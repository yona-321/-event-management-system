const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.get('/summary', auth, adminOnly, async (req, res) => {
  try {
    const events = await Event.find();
    const totalEvents = events.length;
    const totalRegistrations = events.reduce((sum, e) => sum + e.registeredCount, 0);
    const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
    const fillRate = totalCapacity > 0 ? ((totalRegistrations / totalCapacity) * 100).toFixed(1) : 0;

    const mostPopular = events.reduce((max, e) => e.registeredCount > (max?.registeredCount || 0) ? e : max, null);

    const fullyBooked = events.filter(e => e.registeredCount >= e.capacity).length;

    const byCategory = events.reduce((acc, e) => {
      const cat = e.category || 'Other';
      if (!acc[cat]) acc[cat] = { count: 0, registrations: 0 };
      acc[cat].count += 1;
      acc[cat].registrations += e.registeredCount;
      return acc;
    }, {});

    const recentEvents = [...events]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(e => ({
        title: e.title,
        registeredCount: e.registeredCount,
        capacity: e.capacity,
        category: e.category,
        date: e.date
      }));

    res.json({
      totalEvents,
      totalRegistrations,
      totalCapacity,
      fillRate,
      fullyBooked,
      mostPopular: mostPopular ? {
        title: mostPopular.title,
        registeredCount: mostPopular.registeredCount,
        capacity: mostPopular.capacity
      } : null,
      byCategory,
      recentEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;