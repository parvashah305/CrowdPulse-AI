// src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:4000';

export function useSocket() {
  const socketRef           = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(API_URL);

    socketRef.current.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    socketRef.current.on('disconnect', () => setConnected(false));

    // Load last 10 alerts immediately on connect
    socketRef.current.on('recent_alerts', (data) => {
      setAlerts(data);
    });

    // New alert arrives in real time from Spark via MongoDB change stream
    socketRef.current.on('new_alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50)); // keep max 50
    });

    return () => socketRef.current.disconnect();
  }, []);

  return { alerts, connected };
}