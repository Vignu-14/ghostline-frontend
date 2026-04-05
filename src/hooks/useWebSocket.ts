import { useEffect, useRef, useState } from "react";
import { ChatSocket } from "../services/websocketService";
import type { OutgoingWebSocketMessage, WebSocketEvent } from "../types/websocket";

export function useWebSocket(enabled: boolean) {
  const socketRef = useRef<ChatSocket | null>(null);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  useEffect(() => {
    if (!enabled) {
      socketRef.current?.close();
      socketRef.current = null;
      setEvents([]);
      setLastEvent(null);
      setIsConnected(false);
      return;
    }

    const socket = new ChatSocket();
    socketRef.current = socket;
    socket.connect(
      (event) => {
        setEvents((current) => [...current.slice(-39), event]);
        setLastEvent(event);
      },
      () => {
        setIsConnected(false);
      },
      () => {
        setIsConnected(true);
      },
    );

    return () => {
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled]);

  function send(payload: OutgoingWebSocketMessage) {
    return socketRef.current?.send(payload) ?? false;
  }

  return {
    events,
    isConnected,
    lastEvent,
    send,
  };
}
