const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
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

const sendConfirmationEmail = async (studentEmail, studentName, department, year, whatsapp, subEvent, eventTitle, eventDate, eventLocation) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1a73e8, #0d47a1); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎉 You're Registered!</h1>
        <p style="color: #cce5ff; margin-top: 8px;">Registration Confirmed</p>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p style="font-size: 16px;">Hi <strong>${studentName}</strong>,</p>
        <p>You have successfully registered! Here are your details:</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <tr style="background:#1a73e8;color:white;">
            <th style="padding:12px 16px;text-align:left;">Field</th>
            <th style="padding:12px 16px;text-align:left;">Details</th>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 16px;">🎯 Event</td>
            <td style="padding:12px 16px;"><strong>${eventTitle}</strong></td>
          </tr>
          <tr style="border-bottom:1px solid #eee;background:#f5f5f5;">
            <td style="padding:12px 16px;">🏆 Competition</td>
            <td style="padding:12px 16px;"><strong>${subEvent}</strong></td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 16px;">📅 Date</td>
            <td style="padding:12px 16px;">${new Date(eventDate).toDateString()}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;background:#f5f5f5;">
            <td style="padding:12px 16px;">📍 Location</td>
            <td style="padding:12px 16px;">${eventLocation}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 16px;">🏫 Department</td>
            <td style="padding:12px 16px;">${department}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;background:#f5f5f5;">
            <td style="padding:12px 16px;">📚 Year</td>
            <td style="padding:12px 16px;">${year}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;">📱 WhatsApp</td>
            <td style="padding:12px 16px;">${whatsapp}</td>
          </tr>
        </table>
        <div style="margin-top:25px;padding:15px;background:#e8f5e9;border-left:4px solid #4CAF50;border-radius:4px;">
          <p style="margin:0;">⏰ We will send you a reminder email one day before the event. See you there! 🎊</p>
        </div>
      </div>
      <div style="background:#1a73e8;padding:15px;text-align:center;">
        <p style="color:white;margin:0;font-size:13px;">Event Management System ©️ 2026</p>
      </div>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Event Management System <onboarding@resend.dev>',
      to: studentEmail,
      subject: `✅ Registration Confirmed – ${eventTitle}`,
      html: htmlContent
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to send confirmation email');
  }
};

// Register for an event
router.post('/:eventId', auth, async (req, res) => {
  try {
    const { name, department, year, whatsapp, subEvent } = req.body;

    if (!name || !department || !year || !whatsapp) {
      return res.status(400).json({ message: 'Name, department, year, and WhatsApp number are required' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const existing = await Registration.findOne({
      student: req.user.userId,
      event: req.params.eventId,
      subEvent: subEvent
    });
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const registration = new Registration({
      student: req.user.userId,
      event: req.params.eventId,
      name: name.trim(),
      department: department.trim(),
      year,
      whatsapp: whatsapp.trim(),
      subEvent
    });
    await registration.save();

    event.registeredCount += 1;
    await event.save();

    try {
      const student = await User.findById(req.user.userId);
      if (!student || !student.email) throw new Error('Student record or email not found');
      await sendConfirmationEmail(
        student.email, name, department, year, whatsapp,
        subEvent, event.title, event.date, event.location
      );
      console.log('✅ Confirmation email sent to:', student.email);
    } catch (emailError) {
      console.error('❌ Email failed:', emailError.message);
    }

    res.status(201).json({ message: 'Registered successfully! Check your email for confirmation.' });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get registrations for a specific event
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export attendee list as CSV (admin/organizer only)
router.get('/event/:eventId/export-csv', auth, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const registrations = await Registration.find({ event: req.params.eventId });

    // Column widths via padding — pad each field to fixed width for readability
    const pad = (str, len) => String(str).padEnd(len, ' ');

    const rows = [
      // Header row
      ['Name', 'Department', 'Year', 'WhatsApp', 'Sub-Event', 'Registered At'],
      ...registrations.map(r => [
        r.name,
        r.department,
        r.year,
        // Prefix with tab character so Excel treats as text, not scientific notation
        '\t' + r.whatsapp,
        r.subEvent || '-',
        new Date(r.createdAt).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        })
      ])
    ];

    const csv = rows.map(row =>
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const filename = `${event.title.replace(/[^a-z0-9]/gi, '_')}_attendees.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my registrations
router.get('/my', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user.userId })
      .populate('event', 'title date location');
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;