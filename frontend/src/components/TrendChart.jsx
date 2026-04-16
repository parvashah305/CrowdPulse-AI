import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function TrendChart({ data, selectedCity, onCityChange }) {
  const cities = ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Hyderabad','Pune','Ahmedabad'];

  const chartData = data.map((d, i) => ({
    name:        i + 1,
    events:      d.event_count,
    density:     Math.round(d.avg_density || 0),
    spike_score: d.spike_score,
  }));

  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding:      '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Activity Trend</span>
        <select
          value={selectedCity}
          onChange={e => onCityChange(e.target.value)}
          style={{
            marginLeft:   'auto',
            background:   'var(--bg-secondary)',
            border:       '1px solid var(--border)',
            color:        'var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
            padding:      '4px 10px',
            fontSize:     12,
            cursor:       'pointer',
            outline:      'none',
          }}
        >
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background:   'var(--bg-card)',
              border:       '1px solid var(--border-accent)',
              borderRadius: 8,
              fontSize:     12,
              color:        'var(--text-primary)',
            }}
            formatter={(v, n) => [v, n.charAt(0).toUpperCase() + n.slice(1)]}
          />
          <Area
            type="monotone"
            dataKey="events"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#grad)"
            dot={false}
            activeDot={{ r: 4, fill: '#f97316' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}