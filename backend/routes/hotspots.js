const router  = require('express').Router();
const Insight = require('../models/Insight');

const CITY_COORDS = {
  Chennai:   { lat: 13.0827, lon: 80.2707 },
  Mumbai:    { lat: 19.0760, lon: 72.8777 },
  Delhi:     { lat: 28.6139, lon: 77.2090 },
  Bangalore: { lat: 12.9716, lon: 77.5946 },
  Kolkata:   { lat: 22.5726, lon: 88.3639 },
  Hyderabad: { lat: 17.3850, lon: 78.4867 },
  Pune:      { lat: 18.5204, lon: 73.8567 },
  Ahmedabad: { lat: 23.0225, lon: 72.5714 },
};

router.get('/', async (req, res) => {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const hotspots = await Insight.aggregate([
      { $match: { processed_at: { $gte: thirtyMinsAgo } } },
      { $group: {
          _id:          '$city',
          avg_score:    { $avg: '$spike_score' },
          max_score:    { $max: '$spike_score' },
          avg_density:  { $avg: '$avg_density' },
          total_events: { $sum: '$event_count' },
          spike_count:  { $sum: { $cond: ['$is_spike', 1, 0] } },
      }},
      { $sort: { avg_score: -1 } },
      { $limit: 10 },
    ]);

    const enriched = hotspots.map(h => ({
      city:         h._id,
      avg_score:    Math.round(h.avg_score),
      max_score:    Math.round(h.max_score),
      avg_density:  Math.round(h.avg_density),
      total_events: h.total_events,
      spike_count:  h.spike_count,
      ...CITY_COORDS[h._id],
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;