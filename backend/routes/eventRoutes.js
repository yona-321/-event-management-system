const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
 params: {
  folder: 'event-posters',
  allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'webp'],
},
});
const upload = multer({ storage });

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create event
router.post('/', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer/Cloudinary upload error:', err.message, err.stack);
      return res.status(500).json({ message: 'Image upload failed', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { title, description, date, startTime, endTime, location, capacity, category, subEvents } = req.body;
    const image = req.file ? req.file.path : '';
    const event = new Event({
      title, description, date, startTime, endTime, location, capacity,
      category: category || 'Technical',
      subEvents: subEvents ? JSON.parse(subEvents) : [],
      image,
      organizer: req.user.userId
    });
    await event.save();
    console.log('✅ Event saved:', event.title);

    // Notify all registered users
    try {
      const users = await User.find({}, 'email name');
      for (const user of users) {
        await sendEmail(
          user.email,
          `New Event: ${title}`,
          `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
            <h2 style="background:#1a73e8;color:white;padding:20px;border-radius:8px 8px 0 0;margin:0;">
              New Event Posted!
            </h2>
            <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
              <p>Hi ${user.name},</p>
              <h3 style="color:#1a73e8;">${title}</h3>
              <p>${description}</p>
              <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Capacity:</strong> ${capacity} seats</p>
              <a href="https://event-management-system-pied-beta.vercel.app/events"
                style="background:#1a73e8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px;">
                View & Register
              </a>
            </div>
          </div>
          `
        );
      }
      console.log(`✅ Notification sent to ${users.length} users`);
    } catch (emailErr) {
      console.error('❌ Notification email error:', emailErr.message, emailErr.stack);
    }

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('❌ Event creation error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event
router.put('/:id', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer/Cloudinary upload error:', err.message, err.stack);
      return res.status(500).json({ message: 'Image upload failed', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = req.file.path;
    if (updates.subEvents) updates.subEvents = JSON.parse(updates.subEvents);
    const event = await Event.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
    console.log('✅ Event updated:', req.params.id);
    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('❌ Update event error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    console.log('✅ Event deleted:', req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('❌ Delete event error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;