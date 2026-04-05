import { useCallback, useEffect, useRef, useState } from "react";
import type { CallNotice, CallSession, CallSignalPayload, ICECandidatePayload } from "../types/call";
import type { OutgoingWebSocketMessage, WebSocketEvent } from "../types/websocket";

type EnsureConversationInput = {
  id: string;
  username?: string;
};

type UseAudioCallOptions = {
  currentUserID: string;
  currentUsername?: string;
  lastEvent: WebSocketEvent | null;
  onEnsureConversation: (input: EnsureConversationInput) => void;
  send: (payload: OutgoingWebSocketMessage) => boolean;
  socketConnected: boolean;
};

const CALL_SIGNAL_TYPES = new Set([
  "call_invite",
  "call_accept",
  "call_decline",
  "call_busy",
  "call_cancel",
  "call_offer",
  "call_answer",
  "call_ice_candidate",
  "call_end",
  "call_mute_state",
]);

const RTC_CONFIGURATION: RTCConfiguration = {
  iceCandidatePoolSize: 2,
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

const DISCONNECTED_GRACE_MS = 8000;
const UNANSWERED_TIMEOUT_MS = 30000;

export function useAudioCall({
  currentUserID,
  currentUsername,
  lastEvent,
  onEnsureConversation,
  send,
  socketConnected,
}: UseAudioCallOptions) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const unansweredTimeoutRef = useRef<number | null>(null);
  const disconnectTimeoutRef = useRef<number | null>(null);
  const sessionRef = useRef<CallSession | null>(null);

  const [callNotice, setCallNotice] = useState<CallNotice | null>(null);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const commitSession = useCallback((nextSession: CallSession | null) => {
    sessionRef.current = nextSession;
    setCallSession(nextSession);
  }, []);

  const updateSession = useCallback(
    (updater: (current: CallSession) => CallSession) => {
      const current = sessionRef.current;
      if (!current) {
        return;
      }

      const next = updater(current);
      sessionRef.current = next;
      setCallSession(next);
    },
    [],
  );

  const clearDisconnectTimer = useCallback(() => {
    if (disconnectTimeoutRef.current) {
      window.clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }
  }, []);

  const clearUnansweredTimer = useCallback(() => {
    if (unansweredTimeoutRef.current) {
      window.clearTimeout(unansweredTimeoutRef.current);
      unansweredTimeoutRef.current = null;
    }
  }, []);

  const releaseMediaResources = useCallback(() => {
    clearDisconnectTimer();
    clearUnansweredTimer();
    pendingCandidatesRef.current = [];

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setRemoteStream(null);
  }, [clearDisconnectTimer, clearUnansweredTimer]);

  const finishCall = useCallback(
    (message?: string, tone: CallNotice["tone"] = "info") => {
      commitSession(null);
      releaseMediaResources();
      if (message) {
        setCallNotice({ message, tone });
      }
    },
    [commitSession, releaseMediaResources],
  );

  const sendSignal = useCallback(
    (payload: OutgoingWebSocketMessage, options?: { silentFailure?: boolean }) => {
      const delivered = send(payload);
      if (!delivered && !options?.silentFailure) {
        setCallNotice({
          message: "The realtime connection dropped before the call signal could be sent.",
          tone: "error",
        });
      }

      return delivered;
    },
    [send],
  );

  const handlePeerConnectionFailure = useCallback(
    (message: string) => {
      const current = sessionRef.current;
      if (current) {
        sendSignal(
          {
            type: "call_end",
            receiver_id: current.peerID,
            call_id: current.callID,
            reason: "connection_failed",
            username: currentUsername,
          },
          { silentFailure: true },
        );
      }

      finishCall(message, "error");
    },
    [currentUsername, finishCall, sendSignal],
  );

  const handleConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState) => {
      const current = sessionRef.current;
      if (!current) {
        return;
      }

      switch (state) {
        case "connected":
          clearDisconnectTimer();
          clearUnansweredTimer();
          updateSession((session) => ({
            ...session,
            phase: "active",
            status: `In call with @${session.peerUsername}`,
          }));
          break;
        case "connecting":
          clearDisconnectTimer();
          updateSession((session) => ({
            ...session,
            phase: "connecting",
            status: session.direction === "incoming" ? "Joining the call..." : `Connecting to @${session.peerUsername}...`,
          }));
          break;
        case "disconnected":
          clearDisconnectTimer();
          disconnectTimeoutRef.current = window.setTimeout(() => {
            handlePeerConnectionFailure("The call connection was lost.");
          }, DISCONNECTED_GRACE_MS);
          updateSession((session) => ({
            ...session,
            status: "Connection interrupted. Trying to recover...",
          }));
          break;
        case "failed":
          handlePeerConnectionFailure("The call connection failed.");
          break;
        case "closed":
          if (sessionRef.current) {
            finishCall("Call ended.");
          }
          break;
        default:
          break;
      }
    },
    [clearDisconnectTimer, clearUnansweredTimer, finishCall, handlePeerConnectionFailure, updateSession],
  );

  const flushPendingCandidates = useCallback(async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection || !peerConnection.remoteDescription) {
      return;
    }

    const queuedCandidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];

    for (const candidate of queuedCandidates) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch {
        // Ignore stale candidates after renegotiation or hangup.
      }
    }
  }, []);

  const ensurePeerConnection = useCallback(async () => {
    if (typeof RTCPeerConnection === "undefined") {
      throw new Error("calling_not_supported");
    }

    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const connection = new RTCPeerConnection(RTC_CONFIGURATION);

    connection.onicecandidate = (event) => {
      const current = sessionRef.current;
      if (!event.candidate || !current) {
        return;
      }

      const candidateWithExtras = event.candidate as RTCIceCandidate & {
        usernameFragment?: string | null;
      };

      const candidatePayload: ICECandidatePayload = {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        usernameFragment:
          typeof candidateWithExtras.usernameFragment === "string" ? candidateWithExtras.usernameFragment : undefined,
      };

      sendSignal(
        {
          type: "call_ice_candidate",
          receiver_id: current.peerID,
          call_id: current.callID,
          candidate: candidatePayload,
          username: currentUsername,
        },
        { silentFailure: true },
      );
    };

    connection.ontrack = (event) => {
      const nextStream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(nextStream);
    };

    connection.onconnectionstatechange = () => {
      handleConnectionStateChange(connection.connectionState);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        connection.addTrack(track, localStreamRef.current as MediaStream);
      });
    }

    peerConnectionRef.current = connection;
    return connection;
  }, [currentUsername, handleConnectionStateChange, sendSignal]);

  const ensureLocalAudio = useCallback(async () => {
    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      throw new Error("secure_context_required");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("media_devices_unavailable");
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });

    localStreamRef.current = stream;
    return stream;
  }, []);

  const createAndSendOffer = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) {
      return;
    }

    if (!localStreamRef.current) {
      await ensureLocalAudio();
    }

    const connection = await ensurePeerConnection();
    const offer = await connection.createOffer({
      offerToReceiveAudio: true,
    });

    await connection.setLocalDescription(offer);
    sendSignal({
      type: "call_offer",
      receiver_id: current.peerID,
      call_id: current.callID,
      description: {
        type: offer.type,
        sdp: offer.sdp || "",
      },
      username: currentUsername,
    });
  }, [currentUsername, ensureLocalAudio, ensurePeerConnection, sendSignal]);

  const acceptIncomingCall = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.phase !== "incoming") {
      return;
    }

    setCallNotice(null);
    updateSession((session) => ({
      ...session,
      phase: "requesting_permission",
      status: "Requesting microphone access...",
    }));

    try {
      await ensureLocalAudio();
      if (!sessionRef.current || sessionRef.current.callID !== current.callID) {
        releaseMediaResources();
        return;
      }

      await ensurePeerConnection();
      sendSignal({
        type: "call_accept",
        receiver_id: current.peerID,
        call_id: current.callID,
        username: currentUsername,
      });

      updateSession((session) => ({
        ...session,
        phase: "connecting",
        status: `Connecting to @${session.peerUsername}...`,
      }));
    } catch (error) {
      sendSignal(
        {
          type: "call_decline",
          receiver_id: current.peerID,
          call_id: current.callID,
          reason: "permission_denied",
          username: currentUsername,
        },
        { silentFailure: true },
      );
      finishCall(getMediaErrorMessage(error), "error");
    }
  }, [
    currentUsername,
    ensureLocalAudio,
    ensurePeerConnection,
    finishCall,
    releaseMediaResources,
    sendSignal,
    updateSession,
  ]);

  const declineIncomingCall = useCallback(() => {
    const current = sessionRef.current;
    if (!current) {
      return;
    }

    sendSignal(
      {
        type: current.phase === "incoming" ? "call_decline" : "call_end",
        receiver_id: current.peerID,
        call_id: current.callID,
        reason: current.phase === "incoming" ? "declined" : "ended",
        username: currentUsername,
      },
      { silentFailure: true },
    );
    finishCall(current.phase === "incoming" ? "Call declined." : "Call ended.");
  }, [currentUsername, finishCall, sendSignal]);

  const endCall = useCallback(() => {
    const current = sessionRef.current;
    if (!current) {
      return;
    }

    const eventType = current.phase === "incoming" ? "call_decline" : current.phase === "outgoing" ? "call_cancel" : "call_end";
    const reason = current.phase === "outgoing" ? "cancelled" : "ended";

    sendSignal(
      {
        type: eventType,
        receiver_id: current.peerID,
        call_id: current.callID,
        reason,
        username: currentUsername,
      },
      { silentFailure: true },
    );

    finishCall(current.phase === "outgoing" ? "Call cancelled." : "Call ended.");
  }, [currentUsername, finishCall, sendSignal]);

  const toggleMute = useCallback(() => {
    const current = sessionRef.current;
    if (!current || !localStreamRef.current) {
      return;
    }

    const nextMuted = !current.isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    updateSession((session) => ({
      ...session,
      isMuted: nextMuted,
      status: nextMuted ? "Your microphone is muted." : `In call with @${session.peerUsername}`,
    }));

    sendSignal(
      {
        type: "call_mute_state",
        receiver_id: current.peerID,
        call_id: current.callID,
        muted: nextMuted,
        username: currentUsername,
      },
      { silentFailure: true },
    );
  }, [currentUsername, sendSignal, updateSession]);

  const startCall = useCallback(
    async (peerID: string, peerUsername?: string) => {
      if (!peerID) {
        return;
      }

      const current = sessionRef.current;
      if (current) {
        setCallNotice({
          message: "Finish the current call before starting another one.",
          tone: "error",
        });
        return;
      }

      if (!socketConnected) {
        setCallNotice({
          message: "The realtime connection is offline. Reconnect before placing a call.",
          tone: "error",
        });
        return;
      }

      const nextCallID = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${peerID}`;
      const label = peerUsername || "ghost";

      setCallNotice(null);
      commitSession({
        callID: nextCallID,
        direction: "outgoing",
        isMuted: false,
        peerID,
        peerUsername: label,
        phase: "requesting_permission",
        remoteMuted: false,
        status: "Requesting microphone access...",
      });

      try {
        await ensureLocalAudio();
        if (!sessionRef.current || sessionRef.current.callID !== nextCallID) {
          releaseMediaResources();
          return;
        }

        await ensurePeerConnection();
        const delivered = sendSignal({
          type: "call_invite",
          receiver_id: peerID,
          call_id: nextCallID,
          username: currentUsername,
        });

        if (!delivered) {
          finishCall("Unable to send the call invite.", "error");
          return;
        }

        updateSession((session) => ({
          ...session,
          phase: "outgoing",
          status: `Calling @${label}...`,
        }));

        clearUnansweredTimer();
        unansweredTimeoutRef.current = window.setTimeout(() => {
          const active = sessionRef.current;
          if (!active || active.callID !== nextCallID || active.phase !== "outgoing") {
            return;
          }

          sendSignal(
            {
              type: "call_cancel",
              receiver_id: peerID,
              call_id: nextCallID,
              reason: "no_answer",
              username: currentUsername,
            },
            { silentFailure: true },
          );
          finishCall(`@${label} did not answer.`, "info");
        }, UNANSWERED_TIMEOUT_MS);
      } catch (error) {
        finishCall(getMediaErrorMessage(error), "error");
      }
    },
    [
      clearUnansweredTimer,
      commitSession,
      currentUsername,
      ensureLocalAudio,
      ensurePeerConnection,
      finishCall,
      releaseMediaResources,
      sendSignal,
      socketConnected,
      updateSession,
    ],
  );

  useEffect(() => {
    if (!remoteAudioRef.current) {
      return;
    }

    remoteAudioRef.current.srcObject = remoteStream;
    if (remoteStream) {
      void remoteAudioRef.current.play().catch(() => {
        setCallNotice((current) =>
          current || {
            message: "Remote audio is ready. If you do not hear it, tap the page once and try again.",
            tone: "info",
          },
        );
      });
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!lastEvent || !CALL_SIGNAL_TYPES.has(lastEvent.type)) {
      return;
    }

    const payload = lastEvent.payload as CallSignalPayload | undefined;
    if (!payload?.call_id || !payload.user_id) {
      return;
    }

    const incomingUserID = payload.user_id;
    const incomingUsername = payload.username?.trim() || "ghost";
    const active = sessionRef.current;

    if (lastEvent.type === "call_invite") {
      if (active) {
        if (
          active.direction === "outgoing" &&
          active.phase === "outgoing" &&
          active.peerID === incomingUserID &&
          shouldYieldToIncomingInvite(currentUserID, incomingUserID)
        ) {
          sendSignal(
            {
              type: "call_cancel",
              receiver_id: active.peerID,
              call_id: active.callID,
              reason: "switching_to_incoming",
              username: currentUsername,
            },
            { silentFailure: true },
          );
          releaseMediaResources();
        } else {
          sendSignal(
            {
              type: "call_busy",
              receiver_id: incomingUserID,
              call_id: payload.call_id,
              reason: "busy",
              username: currentUsername,
            },
            { silentFailure: true },
          );
          return;
        }
      }

      onEnsureConversation({ id: incomingUserID, username: incomingUsername });
      setCallNotice(null);
      commitSession({
        callID: payload.call_id,
        direction: "incoming",
        isMuted: false,
        peerID: incomingUserID,
        peerUsername: incomingUsername,
        phase: "incoming",
        remoteMuted: false,
        status: `Incoming voice call from @${incomingUsername}`,
      });
      return;
    }

    if (!active || active.callID !== payload.call_id || active.peerID !== incomingUserID) {
      return;
    }

    switch (lastEvent.type) {
      case "call_accept":
        clearUnansweredTimer();
        updateSession((session) => ({
          ...session,
          phase: "connecting",
          status: `@${session.peerUsername} joined. Connecting audio...`,
        }));
        void createAndSendOffer().catch(() => {
          handlePeerConnectionFailure("Unable to start the audio call.");
        });
        break;
      case "call_decline":
        finishCall(`@${active.peerUsername} declined the call.`);
        break;
      case "call_busy":
        finishCall(`@${active.peerUsername} is already in another call.`);
        break;
      case "call_cancel":
        finishCall(
          payload.reason === "no_answer"
            ? `@${active.peerUsername} stopped waiting for the call.`
            : `@${active.peerUsername} cancelled the call.`,
        );
        break;
      case "call_end":
        finishCall(`Call with @${active.peerUsername} ended.`);
        break;
      case "call_offer":
        if (!payload.description) {
          return;
        }
        {
          const description = payload.description;
        void (async () => {
          try {
            const connection = await ensurePeerConnection();
            await connection.setRemoteDescription(toRTCSessionDescription(description));
            await flushPendingCandidates();
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            sendSignal({
              type: "call_answer",
              receiver_id: active.peerID,
              call_id: active.callID,
              description: {
                type: answer.type,
                sdp: answer.sdp || "",
              },
              username: currentUsername,
            });
            updateSession((session) => ({
              ...session,
              phase: "connecting",
              status: `Joining @${session.peerUsername}...`,
            }));
          } catch {
            handlePeerConnectionFailure("Unable to answer the call.");
          }
        })();
        }
        break;
      case "call_answer":
        if (!payload.description) {
          return;
        }
        {
          const description = payload.description;
        void (async () => {
          try {
            const connection = await ensurePeerConnection();
            await connection.setRemoteDescription(toRTCSessionDescription(description));
            await flushPendingCandidates();
            updateSession((session) => ({
              ...session,
              phase: "connecting",
              status: `Connecting to @${session.peerUsername}...`,
            }));
          } catch {
            handlePeerConnectionFailure("Unable to connect the call.");
          }
        })();
        }
        break;
      case "call_ice_candidate":
        if (!payload.candidate) {
          return;
        }
        void (async () => {
          const connection = peerConnectionRef.current;
          if (!connection) {
            pendingCandidatesRef.current.push(payload.candidate as RTCIceCandidateInit);
            return;
          }

          if (!connection.remoteDescription) {
            pendingCandidatesRef.current.push(payload.candidate as RTCIceCandidateInit);
            return;
          }

          try {
            await connection.addIceCandidate(payload.candidate as RTCIceCandidateInit);
          } catch {
            // Ignore stale candidates after renegotiation or rapid hangups.
          }
        })();
        break;
      case "call_mute_state":
        updateSession((session) => ({
          ...session,
          remoteMuted: Boolean(payload.muted),
        }));
        break;
      default:
        break;
    }
  }, [
    clearUnansweredTimer,
    commitSession,
    createAndSendOffer,
    currentUserID,
    currentUsername,
    ensurePeerConnection,
    finishCall,
    flushPendingCandidates,
    handlePeerConnectionFailure,
    lastEvent,
    onEnsureConversation,
    releaseMediaResources,
    sendSignal,
    updateSession,
  ]);

  useEffect(() => {
    const handlePageHide = () => {
      const current = sessionRef.current;
      if (!current) {
        return;
      }

      sendSignal(
        {
          type: "call_end",
          receiver_id: current.peerID,
          call_id: current.callID,
          reason: "page_hidden",
          username: currentUsername,
        },
        { silentFailure: true },
      );
      releaseMediaResources();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [currentUsername, releaseMediaResources, sendSignal]);

  useEffect(() => {
    return () => {
      const current = sessionRef.current;
      if (!current) {
        return;
      }

      sendSignal(
        {
          type: "call_end",
          receiver_id: current.peerID,
          call_id: current.callID,
          reason: "chat_closed",
          username: currentUsername,
        },
        { silentFailure: true },
      );
      releaseMediaResources();
    };
  }, [currentUsername, releaseMediaResources, sendSignal]);

  useEffect(() => {
    if (socketConnected || !sessionRef.current) {
      return;
    }

    setCallNotice({
      message: "The realtime connection dropped. Call controls may be unavailable until the socket reconnects.",
      tone: "error",
    });
  }, [socketConnected]);

  return {
    acceptIncomingCall,
    callNotice,
    callSession,
    declineIncomingCall,
    dismissCallNotice: () => setCallNotice(null),
    endCall,
    remoteAudioRef,
    startCall,
    toggleMute,
  };
}

function shouldYieldToIncomingInvite(currentUserID: string, incomingUserID: string) {
  return currentUserID.localeCompare(incomingUserID) < 0;
}

function getMediaErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Microphone permission is required to place or answer a call.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No microphone was found on this device.";
      case "NotReadableError":
      case "TrackStartError":
        return "The microphone is busy in another app. Close the other app and try again.";
      case "OverconstrainedError":
      case "ConstraintNotSatisfiedError":
        return "The browser could not start the microphone with the required settings.";
      case "AbortError":
        return "The browser interrupted microphone access. Try again.";
      default:
        return "Microphone access is required for calls.";
    }
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "calling_not_supported":
        return "This browser does not support audio calling.";
      case "secure_context_required":
        return "Microphone access needs HTTPS or localhost.";
      case "media_devices_unavailable":
        return "This browser cannot access microphone devices.";
      default:
        return error.message || "Unable to start the microphone.";
    }
  }

  return "Unable to start the microphone.";
}

function toRTCSessionDescription(description: CallSignalPayload["description"]): RTCSessionDescriptionInit {
  return {
    sdp: description?.sdp || "",
    type: (description?.type || "offer") as RTCSdpType,
  };
}
