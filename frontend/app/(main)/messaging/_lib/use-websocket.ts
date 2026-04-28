'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WsNewMessageEvent } from './types';

const WS_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(
    /^http/,
    'ws',
  );

type MessageHandler = (event: WsNewMessageEvent) => void;

/**
 * Manages a persistent WebSocket connection to /messaging/ws.
 * Calls `onMessage` for every incoming `new_message` event.
 * Auto-reconnects with exponential back-off on unexpected close/error.
 */
export function useMessagingWebSocket(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef<MessageHandler>(onMessage);
  const reconnectDelay = useRef(1000);
  const unmountedRef = useRef(false);

  // Keep callback ref up to date without reconnecting
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const ws = new WebSocket(`${WS_BASE_URL}/messaging/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelay.current = 1000; // reset back-off on success
    };

    ws.onmessage = (event) => {
      try {
        const data: WsNewMessageEvent = JSON.parse(event.data as string);
        if (data.type === 'new_message') {
          onMessageRef.current(data);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      // Exponential back-off: 1s → 2s → 4s … capped at 16s
      setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 16_000);
        connect();
      }, reconnectDelay.current);
    };
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  /** Send a message over the WebSocket (falls back silently if not open). */
  const sendWsMessage = useCallback(
    (receiverId: string, content: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ receiver_id: receiverId, content }));
      }
    },
    [],
  );

  return { sendWsMessage };
}
