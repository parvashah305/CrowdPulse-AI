// src/App.jsx
import { motion } from 'framer-motion';
import StatCard    from './components/StatCard';
import AlertPanel  from './components/AlertPanel';
import TrendChart  from './components/TrendChart';
import HotspotList from './components/HotspotList';
import CrowdMap    from './components/CrowdMap';
import { useApi }    from './hooks/useApi';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const {
    stats, hotspots, trends, events,
    loading, selectedCity, setSelectedCity,
  } = useApi();

  const { alerts, connected } = useSocket();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTop: '3px solid var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }}/>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Connecting to CrowdPulse...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0' }}>

      {/* Header */}
      <header style={{
        padding:      '0 28px',
        height:       56,
        borderBottom: '1px solid var(--border)',
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        position:     'sticky',
        top:          0,
        background:   'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex:       100,
      }}>
        {/* Logo mark */}
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#000',
        }}>C</div>

        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
          CrowdPulse
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI</span>

        {/* Live indicator */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: connected ? 'var(--green)' : 'var(--text-muted)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: connected ? 'var(--green)' : 'var(--text-muted)',
            boxShadow: connected ? '0 0 6px var(--green)' : 'none',
            display: 'inline-block',
          }}/>
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: '24px 28px', maxWidth: 1600, margin: '0 auto' }}>

        {/* Stat cards row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 24,
        }}>
          <StatCard
            label="Events / hour"
            value={stats?.events_last_hour?.toLocaleString()}
            sub="across all sources"
            color="accent"
          />
          <StatCard
            label="Alerts / hour"
            value={stats?.alerts_last_hour}
            sub="spike detections"
            color="red"
          />
          <StatCard
            label="Active hotspots"
            value={stats?.active_hotspots}
            sub="cities above threshold"
            color="amber"
          />
          <StatCard
            label="Critical alerts"
            value={stats?.critical_alerts}
            sub="score > 75"
            color="red"
          />
        </div>

        {/* Map + Alert panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 16, marginBottom: 24,
          height: 480,
        }}>
          <CrowdMap hotspots={hotspots} events={events} />
          <AlertPanel alerts={alerts} />
        </div>

        {/* Trend chart + Hotspot list */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}>
          <TrendChart
            data={trends}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
          />
          <HotspotList
            hotspots={hotspots}
            onSelect={h => setSelectedCity(h.city)}
          />
        </div>

      </main>
    </div>
  );
}