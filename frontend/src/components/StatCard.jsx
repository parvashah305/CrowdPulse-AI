import { motion } from 'framer-motion';

export default function StatCard({ label, value, sub, color = 'accent', icon }) {
  const colors = {
    accent:   'var(--accent)',
    red:      'var(--red)',
    amber:    'var(--amber)',
    green:    'var(--green)',
    blue:     'var(--blue)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding:      '20px 24px',
        position:     'relative',
        overflow:     'hidden',
      }}
    >
      {/* Subtle glow top-left */}
      <div style={{
        position:   'absolute', top: 0, left: 0,
        width: 120, height: 120,
        background: `radial-gradient(circle, ${colors[color]}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: colors[color], lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}