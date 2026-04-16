import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_COLOR = {
  critical: 'var(--red)',
  high:     'var(--accent)',
  medium:   'var(--amber)',
};

const SEVERITY_BG = {
  critical: 'rgba(239,68,68,0.08)',
  high:     'rgba(249,115,22,0.08)',
  medium:   'rgba(245,158,11,0.08)',
};

export default function AlertPanel({ alerts }) {
  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow:     'hidden',
      display:      'flex',
      flexDirection:'column',
      height:       '100%',
    }}>
      <div style={{
        padding:      '16px 20px',
        borderBottom: '1px solid var(--border)',
        display:      'flex',
        alignItems:   'center',
        gap:          8,
      }}>
        {/* Pulsing red dot for live indicator */}
        <span style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: 'var(--red)',
          boxShadow:  '0 0 6px var(--red)',
          animation:  'pulse 2s infinite',
          display:    'inline-block',
        }}/>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Live Alerts</span>
        <span style={{
          marginLeft:   'auto',
          background:   'var(--accent-subtle)',
          color:        'var(--accent)',
          fontSize:     11,
          padding:      '2px 8px',
          borderRadius: 20,
          fontWeight:   500,
        }}>
          {alerts.length} active
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        <AnimatePresence initial={false}>
          {alerts.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              Waiting for alerts...
            </div>
          ) : (
            alerts.map((alert, i) => (
              <motion.div
                key={alert._id || i}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0,  height: 'auto' }}
                exit={{    opacity: 0, x:  20, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  padding:      '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  background:   SEVERITY_BG[alert.severity] || 'transparent',
                  cursor:       'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    width:        6, height: 6,
                    borderRadius: '50%',
                    background:   SEVERITY_COLOR[alert.severity] || 'var(--accent)',
                    flexShrink:   0,
                  }}/>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{alert.city}</span>
                  <span style={{
                    marginLeft:   'auto',
                    fontSize:     10,
                    fontWeight:   600,
                    color:        SEVERITY_COLOR[alert.severity],
                    textTransform:'uppercase',
                    letterSpacing:'0.06em',
                  }}>
                    {alert.severity}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 14 }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 14, marginTop: 3 }}>
                  Score: {alert.spike_score} · Events: {alert.event_count}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}