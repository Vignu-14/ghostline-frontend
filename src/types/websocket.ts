import type { Message } from "./message";
import type { CallSignalPayload, ICECandidatePayload, SessionDescriptionPayload } from "./call";

export type WebSocketEventType =
  | "connected"
  | "message"
  | "error"
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

export interface WebSocketEvent {
  type: WebSocketEventType | string;
  payload?: Message | CallSignalPayload;
  message?: string;
}

export interface OutgoingWebSocketMessage {
  type?: WebSocketEventType | string;
  receiver_id: string;
  content?: string;
  call_id?: string;
  description?: SessionDescriptionPayload;
  candidate?: ICECandidatePayload;
  reason?: string;
  username?: string;
  muted?: boolean;
}
