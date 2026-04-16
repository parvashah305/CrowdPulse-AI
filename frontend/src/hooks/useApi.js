// src/hooks/useApi.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BASE = 'http://localhost:4000';

export function useApi() {
  const [stats,     setStats]     = useState(null);
  const [hotspots,  setHotspots]  = useState([]);
  const [trends,    setTrends]    = useState([]);
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selectedCity, setSelectedCity] = useState('Mumbai');

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, hotspotsRes, eventsRes] = await Promise.all([
        axios.get(`${BASE}/api/stats`),
        axios.get(`${BASE}/api/hotspots`),
        axios.get(`${BASE}/api/events?limit=50`),
      ]);
      setStats(statsRes.data.data);
      setHotspots(hotspotsRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (err) {
      console.error('API error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrends = useCallback(async (city) => {
    try {
      const res = await axios.get(`${BASE}/api/trends?city=${city}&limit=15`);
      setTrends(res.data.data);
    } catch (err) {
      console.error('Trends error:', err.message);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchTrends(selectedCity); }, [selectedCity, fetchTrends]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return {
    stats, hotspots, trends, events, loading,
    selectedCity, setSelectedCity, fetchTrends, refetch: fetchAll
  };
}