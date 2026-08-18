import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketEvent {
  type: string;
  journey_id?: string;
  stage?: string;
  status?: string;
  step_key?: string;
  state?: string;
  message?: string;
  [key: string]: any;
}

export function useWebSocket(roomId: string | null) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!roomId) return;
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8000';

    const wsUrl = process.env.NEXT_PUBLIC_WS_BASE_URL || `${protocol}//${host}/ws/journeys/${roomId}`;
    setConnectionStatus('reconnecting');
    
    const socket = new WebSocket(wsUrl);


    socket.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      // Heartbeat ping
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send('ping');
        } else {
          clearInterval(pingInterval);
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const parsed: WebSocketEvent = JSON.parse(event.data);
        setLastEvent(parsed);
        setEvents((prev) => [...prev.slice(-20), parsed]);
      } catch (e) {
        // Ignored raw string message
      }
    };

    socket.onclose = () => {
      setConnectionStatus('disconnected');
      wsRef.current = null;
      
      // Exponential backoff reconnect: 1s, 2s, 4s, max 10s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
      reconnectAttemptsRef.current += 1;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    socket.onerror = () => {
      socket.close();
    };

    wsRef.current = socket;
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { connectionStatus, lastEvent, events };
}
