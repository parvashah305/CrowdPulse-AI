import { motion } from 'framer-motion';

export default function HotspotList({ hotspots, onSelect }) {
  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow:     'hidden',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
        Hotspot Rankings
      </div>
      {hotspots.length === 0 ? (
        <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>
          No hotspots in last 30 mins
        </div>
      ) : (
        hotspots.map((h, i) => (
          <motion.div
            key={h.city}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(h)}
            style={{
              padding:      '12px 20px',
              borderBottom: '1px solid var(--border)',
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              cursor:       'pointer',
              transition:   'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Rank */}
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background:  i < 3 ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              color:       i < 3 ? 'var(--accent)'        : 'var(--text-muted)',
              display:     'flex', alignItems: 'center', justifyContent: 'center',
              fontSize:    11, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{h.city}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {h.total_events} events · {h.spike_count} spikes
              </div>
            </div>

            {/* Score bar */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: h.max_score > 75 ? 'var(--red)' : 'var(--accent)' }}>
                {h.avg_score}
              </div>
              <div style={{
                width: 60, height: 3, background: 'var(--bg-secondary)',
                borderRadius: 2, marginTop: 4, overflow: 'hidden',
              }}>
                <div style={{
                  width:        `${Math.min(h.avg_score, 100)}%`,
                  height:       '100%',
                  background:   h.max_score > 75 ? 'var(--red)' : 'var(--accent)',
                  borderRadius: 2,
                  transition:   'width 0.6s ease',
                }}/>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}