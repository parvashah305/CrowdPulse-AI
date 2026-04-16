import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Inner component — has access to map instance via useMap()
function HeatLayer({ hotspots, events }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    // Dynamically import leaflet.heat (it attaches to window.L)
    import('leaflet.heat').then(() => {
      const L = window.L || require('leaflet');

      // Build heatmap points from hotspots + raw events
      const points = [];

      // Hotspots contribute heavy weight
      hotspots.forEach(h => {
        if (h.lat && h.lon) {
          points.push([h.lat, h.lon, Math.min(h.avg_score / 100, 1)]);
        }
      });

      // Raw events add granularity
      events.forEach(e => {
        if (e.latitude && e.longitude) {
          const intensity = e.intensity === 'spike' ? 0.9
                          : e.intensity === 'high'  ? 0.6
                          : e.intensity === 'medium'? 0.3 : 0.1;
          points.push([e.latitude, e.longitude, intensity]);
        }
      });

      if (heatRef.current) {
        heatRef.current.setLatLngs(points);
      } else {
        heatRef.current = L.heatLayer(points, {
          radius:  35,
          blur:    25,
          maxZoom: 10,
          max:     1.0,
          gradient: {
            0.0: '#1a1a2e',
            0.3: '#f59e0b',
            0.6: '#f97316',
            0.9: '#ef4444',
            1.0: '#ffffff',
          },
        }).addTo(map);
      }
    });
  }, [hotspots, events, map]);

  return null;
}

export default function CrowdMap({ hotspots, events }) {
  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow:     'hidden',
      height:       '100%',
      minHeight:    400,
    }}>
      <div style={{
        padding:      '16px 20px',
        borderBottom: '1px solid var(--border)',
        fontWeight:   600,
        fontSize:     13,
        display:      'flex',
        alignItems:   'center',
        gap:          8,
      }}>
        Live Heatmap
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
          — crowd + traffic density
        </span>
      </div>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: 'calc(100% - 53px)', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CartoDB'
        />
        <HeatLayer hotspots={hotspots} events={events} />
      </MapContainer>
    </div>
  );
}