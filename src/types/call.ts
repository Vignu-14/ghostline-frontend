export type CallEventType =
  | "call_invite"
  | "call_accept"
  | "call_decline"
  | "call_busy"
  | "call_cancel"
  | "call_offer"
  | "call_answer"
  | "call_ice_candidate"
  | "call_end"
  | "call_mute_state"
  | "call_video_state";

export type CallType = "audio" | "video";

export type CallPhase =
  | "idle"
  | "requesting_permission"
  | "incoming"
  | "outgoing"
  | "connecting"
  | "active";

export type CallDirection = "incoming" | "outgoing";
export type CallNoticeTone = "info" | "error";

export interface SessionDescriptionPayload {
  type: string;
  sdp: string;
}

export interface ICECandidatePayload {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface CallSignalPayload {
  call_id: string;
  user_id: string;
  username?: string;
  call_type?: CallType;
  description?: SessionDescriptionPayload;
  candidate?: ICECandidatePayload;
  reason?: string;
  muted?: boolean;
  video_off?: boolean;
}

export interface CallSession {
  callID: string;
  callType: CallType;
  direction: CallDirection;
  error?: string;
  isMuted: boolean;
  isVideoOff?: boolean;
  peerID: string;
  peerUsername: string;
  phase: CallPhase;
  remoteMuted: boolean;
  remoteVideoOff?: boolean;
  status: string;
}

export interface CallNotice {
  message: string;
  tone: CallNoticeTone;
}

export interface CallIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface CallRuntimeConfig {
  has_turn: boolean;
  ice_servers: CallIceServer[];
  transport_policy?: RTCIceTransportPolicy | string;
}
