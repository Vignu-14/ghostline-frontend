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
  | "call_mute_state";

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
  description?: SessionDescriptionPayload;
  candidate?: ICECandidatePayload;
  reason?: string;
  muted?: boolean;
}

export interface CallSession {
  callID: string;
  direction: CallDirection;
  error?: string;
  isMuted: boolean;
  peerID: string;
  peerUsername: string;
  phase: CallPhase;
  remoteMuted: boolean;
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
