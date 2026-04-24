import { useCallback, useEffect, useRef, useState } from "react";
import { getCallConfig } from "../services/chatService";
import type {
  CallNotice,
  CallRuntimeConfig,
  CallSession,
  CallSignalPayload,
  ICECandidatePayload,
  CallType,
  SessionDescriptionPayload,
} from "../types/call";
import type { OutgoingWebSocketMessage, WebSocketEvent } from "../types/websocket";

type EnsureConversationInput = {
  id: string;
  username?: string;
};

type UseCallOptions = {
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
  "sdp_offer",
  "sdp_answer",
  "call_ice_candidate",
  "call_end",
  "call_mute_state",
  "call_video_state",
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

export function useCall({
  currentUserID,
  currentUsername,
  lastEvent,
  onEnsureConversation,
  send,
  socketConnected,
}: UseCallOptions) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const unansweredTimeoutRef = useRef<number | null>(null);
  const disconnectTimeoutRef = useRef<number | null>(null);
  const sessionRef = useRef<CallSession | null>(null);
  const rtcConfigurationRef = useRef<RTCConfiguration>(RTC_CONFIGURATION);
  const hasTurnServersRef = useRef(false);
  const callConfigLoadedRef = useRef(false);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);
  const iceRestartedRef = useRef(false);
  const processedCallEventsRef = useRef<Set<string>>(new Set());
  const pendingRemoteOfferRef = useRef<SessionDescriptionPayload | null>(null);

  const [callNotice, setCallNotice] = useState<CallNotice | null>(null);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

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

  const ensureCallRuntimeConfig = useCallback(async () => {
    if (callConfigLoadedRef.current) {
      return rtcConfigurationRef.current;
    }

    try {
      const response = await getCallConfig();
      const nextConfiguration = normalizeRTCConfiguration(response);
      rtcConfigurationRef.current = nextConfiguration;
      hasTurnServersRef.current = Boolean(response.has_turn);
    } catch {
      rtcConfigurationRef.current = RTC_CONFIGURATION;
      hasTurnServersRef.current = false;
    } finally {
      callConfigLoadedRef.current = true;
    }

    return rtcConfigurationRef.current;
  }, []);

  const releaseMediaResources = useCallback(() => {
    clearDisconnectTimer();
    clearUnansweredTimer();
    pendingCandidatesRef.current = [];
    ignoreOfferRef.current = false;
    isSettingRemoteAnswerPendingRef.current = false;
    makingOfferRef.current = false;
    iceRestartedRef.current = false;
    pendingRemoteOfferRef.current = null;

    // Fix 1: Robust PeerConnection cleanup
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onnegotiationneeded = null;
      peerConnectionRef.current.ontrack = null;
      
      // Stop all remote tracks received
      peerConnectionRef.current.getReceivers().forEach(receiver => {
        if (receiver.track) receiver.track.stop();
      });
      
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Fix 1: Robust Local Media cleanup
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    
    // Explicitly clear video elements
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
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
            status: `In ${session.callType} call with @${session.peerUsername}`,
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
          updateSession((session) => ({
            ...session,
            status: "The browser is retrying the call connection...",
          }));
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
        // Ignore stale candidates
      }
    }
  }, []);

  const attachLocalTracks = useCallback((connection: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }

    const existingTrackIDs = new Set(
      connection
        .getSenders()
        .map((sender) => sender.track?.id)
        .filter((trackID): trackID is string => Boolean(trackID)),
    );

    stream.getTracks().forEach((track) => {
      if (!existingTrackIDs.has(track.id)) {
        connection.addTrack(track, stream);
      }
    });
  }, []);

  const ensurePeerConnection = useCallback(async () => {
    if (typeof RTCPeerConnection === "undefined") {
      throw new Error("calling_not_supported");
    }

    if (peerConnectionRef.current) {
      attachLocalTracks(peerConnectionRef.current);
      return peerConnectionRef.current;
    }

    const configuration = await ensureCallRuntimeConfig();
    const connection = new RTCPeerConnection(configuration);

    connection.onicecandidate = (event) => {
      const current = sessionRef.current;
      if (!event.candidate || !current) {
        return;
      }

      const candidatePayload: ICECandidatePayload = {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
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

    connection.onnegotiationneeded = () => {
      const current = sessionRef.current;
      if (!current || current.direction !== "outgoing") {
        return;
      }

      void (async () => {
        try {
          makingOfferRef.current = true;
          await connection.setLocalDescription();
          const description = connection.localDescription;
          if (!description) {
            return;
          }

          sendSignal({
            type: "call_offer",
            receiver_id: current.peerID,
            call_id: current.callID,
            call_type: current.callType,
            description: {
              type: description.type,
              sdp: description.sdp || "",
            },
            username: currentUsername,
          });
        } catch {
          handlePeerConnectionFailure("Unable to prepare the call offer.");
        } finally {
          makingOfferRef.current = false;
        }
      })();
    };

    connection.onconnectionstatechange = () => {
      handleConnectionStateChange(connection.connectionState);
    };

    connection.oniceconnectionstatechange = () => {
      const current = sessionRef.current;
      if (!current) {
        return;
      }

      if (connection.iceConnectionState === "failed") {
        if (current.direction === "outgoing" && !iceRestartedRef.current) {
          iceRestartedRef.current = true;
          updateSession((session) => ({
            ...session,
            status: "Media path failed. Retrying...",
          }));
          connection.restartIce();
          return;
        }

        handlePeerConnectionFailure("Media connection failed.");
      }
    };

    attachLocalTracks(connection);

    peerConnectionRef.current = connection;
    return connection;
  }, [
    attachLocalTracks,
    currentUsername,
    ensureCallRuntimeConfig,
    handleConnectionStateChange,
    handlePeerConnectionFailure,
    sendSignal,
    updateSession,
  ]);

  const ensureLocalMedia = useCallback(async (type: CallType) => {
    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      throw new Error("secure_context_required");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("media_devices_unavailable");
    }

    // Fix 1: Ensure previous tracks are stopped before acquiring new ones
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Fix 2: Strict getUserMedia Constraints
    const constraints: MediaStreamConstraints = {
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: type === "video" ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      } : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const acceptIncomingCall = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.phase !== "incoming") {
      return;
    }

    setCallNotice(null);
    updateSession((session) => ({
      ...session,
      phase: "requesting_permission",
      status: `Requesting ${session.callType === 'video' ? 'camera' : 'microphone'} access...`,
    }));

    try {
      await Promise.all([ensureLocalMedia(current.callType), ensureCallRuntimeConfig()]);
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

      if (pendingRemoteOfferRef.current) {
        const description = pendingRemoteOfferRef.current;
        pendingRemoteOfferRef.current = null;

        const connection = await ensurePeerConnection();
        await connection.setRemoteDescription(toRTCSessionDescription(description));
        await flushPendingCandidates();
        await connection.setLocalDescription();

        const answer = connection.localDescription;
        if (answer) {
          sendSignal({
            type: "call_answer",
            receiver_id: current.peerID,
            call_id: current.callID,
            description: {
              type: answer.type,
              sdp: answer.sdp || "",
            },
            username: currentUsername,
          });
        }
      }
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
      finishCall(getMediaErrorMessage(error, current.callType), "error");
    }
  }, [
    currentUsername,
    ensureCallRuntimeConfig,
    ensureLocalMedia,
    ensurePeerConnection,
    finishCall,
    releaseMediaResources,
    sendSignal,
    updateSession,
    flushPendingCandidates,
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

  const toggleVideo = useCallback(() => {
    const current = sessionRef.current;
    if (!current || !localStreamRef.current || current.callType !== 'video') {
      return;
    }

    const nextVideoOff = !current.isVideoOff;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !nextVideoOff;
    });

    updateSession((session) => ({
      ...session,
      isVideoOff: nextVideoOff,
    }));

    sendSignal(
      {
        type: "call_video_state",
        receiver_id: current.peerID,
        call_id: current.callID,
        video_off: nextVideoOff,
        username: currentUsername,
      },
      { silentFailure: true },
    );
  }, [currentUsername, sendSignal, updateSession]);

  const startCall = useCallback(
    async (peerID: string, peerUsername: string | undefined, type: CallType) => {
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
          message: "The realtime connection is offline.",
          tone: "error",
        });
        return;
      }

      const nextCallID = typeof crypto !== "undefined" && "randomUUID" in crypto 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        
      const label = peerUsername || "ghost";

      setCallNotice(null);
      commitSession({
        callID: nextCallID,
        callType: type,
        direction: "outgoing",
        isMuted: false,
        isVideoOff: false,
        peerID,
        peerUsername: label,
        phase: "requesting_permission",
        remoteMuted: false,
        remoteVideoOff: false,
        status: `Requesting ${type === 'video' ? 'camera' : 'microphone'} access...`,
      });

      try {
        await Promise.all([ensureLocalMedia(type), ensureCallRuntimeConfig()]);
        if (!sessionRef.current || sessionRef.current.callID !== nextCallID) {
          releaseMediaResources();
          return;
        }

        const delivered = sendSignal({
          type: "call_invite",
          receiver_id: peerID,
          call_id: nextCallID,
          call_type: type,
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
        finishCall(getMediaErrorMessage(error, type), "error");
      }
    },
    [
      clearUnansweredTimer,
      commitSession,
      currentUsername,
      ensureCallRuntimeConfig,
      ensureLocalMedia,
      finishCall,
      releaseMediaResources,
      sendSignal,
      socketConnected,
      updateSession,
    ],
  );

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) {
      return;
    }
    remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream, callSession?.phase]);

  useEffect(() => {
    if (!localVideoRef.current || !localStream) {
      return;
    }
    localVideoRef.current.srcObject = localStream;
  }, [localStream, callSession?.phase]);

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

    const eventFingerprint = `${lastEvent.type}:${payload.call_id}`;
    if (processedCallEventsRef.current.has(eventFingerprint)) {
      return;
    }
    if (["call_invite", "call_accept", "call_decline", "call_cancel", "call_end"].includes(lastEvent.type)) {
      processedCallEventsRef.current.add(eventFingerprint);
    }

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
        callType: payload.call_type || "audio",
        direction: "incoming",
        isMuted: false,
        isVideoOff: false,
        peerID: incomingUserID,
        peerUsername: incomingUsername,
        phase: "incoming",
        remoteMuted: false,
        remoteVideoOff: false,
        status: `Incoming ${payload.call_type || 'audio'} call from @${incomingUsername}`,
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
          status: `@${session.peerUsername} joined. Connecting...`,
        }));
        void ensurePeerConnection().catch(() => {
          handlePeerConnectionFailure("Unable to start the call.");
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
        if (!active || active.phase === "incoming") {
          pendingRemoteOfferRef.current = payload.description;
          return;
        }
        void (async () => {
          try {
            const connection = await ensurePeerConnection();
            const polite = shouldYieldToIncomingInvite(currentUserID, incomingUserID);
            const offerCollision = makingOfferRef.current || connection.signalingState !== "stable";
            
            ignoreOfferRef.current = !polite && offerCollision;
            if (ignoreOfferRef.current) return;

            if (offerCollision) {
              await Promise.all([
                connection.setLocalDescription({ type: "rollback" }),
                connection.setRemoteDescription(toRTCSessionDescription(payload.description!)),
              ]);
            } else {
              await connection.setRemoteDescription(toRTCSessionDescription(payload.description!));
            }

            await flushPendingCandidates();
            await connection.setLocalDescription();
            const answer = connection.localDescription;
            if (answer) {
              sendSignal({
                type: "call_answer",
                receiver_id: active.peerID,
                call_id: active.callID,
                description: { type: answer.type, sdp: answer.sdp || "" },
                username: currentUsername,
              });
            }
          } catch {
            handlePeerConnectionFailure("Unable to answer the call.");
          }
        })();
        break;
      case "call_answer":
        if (!payload.description) {
          return;
        }
        void (async () => {
          try {
            const connection = await ensurePeerConnection();
            isSettingRemoteAnswerPendingRef.current = true;
            await connection.setRemoteDescription(toRTCSessionDescription(payload.description!));
            isSettingRemoteAnswerPendingRef.current = false;
            await flushPendingCandidates();
          } catch {
            isSettingRemoteAnswerPendingRef.current = false;
            handlePeerConnectionFailure("Unable to connect the call.");
          }
        })();
        break;
      case "call_ice_candidate":
        if (!payload.candidate) {
          return;
        }
        void (async () => {
          const connection = peerConnectionRef.current;
          if (ignoreOfferRef.current) return;
          if (!connection || !connection.remoteDescription) {
            pendingCandidatesRef.current.push(payload.candidate as RTCIceCandidateInit);
            return;
          }
          try {
            await connection.addIceCandidate(payload.candidate as RTCIceCandidateInit);
          } catch {}
        })();
        break;
      case "call_mute_state":
        updateSession((session) => ({
          ...session,
          remoteMuted: Boolean(payload.muted),
        }));
        break;
      case "call_video_state":
        updateSession((session) => ({
          ...session,
          remoteVideoOff: Boolean(payload.video_off),
        }));
        break;
    }
  }, [
    clearUnansweredTimer,
    commitSession,
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
    return () => {
      releaseMediaResources();
    };
  }, [releaseMediaResources]);

  return {
    acceptIncomingCall,
    callNotice,
    callSession,
    declineIncomingCall,
    dismissCallNotice: () => setCallNotice(null),
    endCall,
    remoteVideoRef,
    localVideoRef,
    startCall,
    toggleMute,
    toggleVideo,
    localStream,
    remoteStream,
  };
}

function shouldYieldToIncomingInvite(currentUserID: string, incomingUserID: string) {
  return currentUserID.localeCompare(incomingUserID) < 0;
}

function getMediaErrorMessage(error: unknown, type: CallType) {
  const device = type === 'video' ? 'camera' : 'microphone';
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return `Permission to access the ${device} was denied.`;
      case "NotFoundError":
        return `No ${device} was found on this device.`;
      case "NotReadableError":
        return `The ${device} is already in use by another application.`;
    }
  }
  return `Unable to access the ${device}.`;
}

function toRTCSessionDescription(description: SessionDescriptionPayload): RTCSessionDescriptionInit {
  return {
    sdp: description.sdp,
    type: description.type as RTCSdpType,
  };
}

function normalizeRTCConfiguration(config: CallRuntimeConfig): RTCConfiguration {
  const iceServers =
    Array.isArray(config.ice_servers) && config.ice_servers.length > 0
      ? config.ice_servers.map((server) => ({
          credential: server.credential,
          urls: server.urls,
          username: server.username,
        }))
      : RTC_CONFIGURATION.iceServers;

  return {
    iceCandidatePoolSize: 2,
    iceServers,
    iceTransportPolicy: config.transport_policy === "relay" ? "relay" : "all",
  };
}
