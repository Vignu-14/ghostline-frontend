import type { OutgoingWebSocketMessage, WebSocketEvent } from "../types/websocket";
import { API_BASE_URL } from "../utils/constants";

type RawWebSocketEvent = {
  type?: string;
  message?: WebSocketEvent["payload"];
  error?: string;
  call_id?: string;
  user_id?: string;
  username?: string;
  description?: OutgoingWebSocketMessage["description"];
  candidate?: OutgoingWebSocketMessage["candidate"];
  reason?: string;
  muted?: boolean;
};

const callEventTypes = new Set([
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

function buildWebSocketURL() {
  const origin = typeof window === "undefined" ? "http://localhost:5173" : window.location.origin;
  const url = new URL(API_BASE_URL || origin, origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/chat";
  url.search = "";
  return url.toString();
}

export class ChatSocket {
  private socket: WebSocket | null = null;

  connect(onMessage: (event: WebSocketEvent) => void, onClose?: () => void, onOpen?: () => void) {
    const wsURL = buildWebSocketURL();

    const token = localStorage.getItem("auth_token");
    const urlWithToken = token ? `${wsURL}?token=${encodeURIComponent(token)}` : wsURL;

    this.socket = new WebSocket(urlWithToken);

    this.socket.onopen = () => {
      if (onOpen) {
        onOpen();
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const rawEvent = JSON.parse(event.data) as RawWebSocketEvent;
        const normalized = normalizeEvent(rawEvent);
        if (normalized) {
          onMessage(normalized);
        }
      } catch {
        onMessage({
          type: "error",
          message: "Unable to read the realtime event from the server.",
        });
      }
    };

    this.socket.onclose = () => {
      if (onClose) {
        onClose();
      }
    };
  }

  send(payload: OutgoingWebSocketMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.socket.send(JSON.stringify(payload));
    return true;
  }

  close() {
    this.socket?.close();
    this.socket = null;
  }
}

function normalizeEvent(rawEvent: RawWebSocketEvent): WebSocketEvent | null {
  if (!rawEvent.type) {
    return null;
  }

  if (rawEvent.type === "message") {
    return {
      type: rawEvent.type,
      payload: rawEvent.message,
    };
  }

  if (rawEvent.type === "error") {
    return {
      type: rawEvent.type,
      message: rawEvent.error || "Something went wrong with the realtime connection.",
    };
  }

  if (callEventTypes.has(rawEvent.type)) {
    return {
      type: rawEvent.type,
      payload: {
        call_id: rawEvent.call_id || "",
        user_id: rawEvent.user_id || "",
        username: rawEvent.username,
        description: rawEvent.description,
        candidate: rawEvent.candidate,
        reason: rawEvent.reason,
        muted: rawEvent.muted,
      },
    };
  }

  return {
    type: rawEvent.type,
  };
}
