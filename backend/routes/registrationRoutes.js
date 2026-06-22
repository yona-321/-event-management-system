const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const brevo = require('@getbrevo/brevo');
const brevoClient = new brevo.TransactionalEmailsApi();
brevoClient.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

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

  const email = new brevo.SendSmtpEmail();
  email.subject = `✅ Registration Confirmed – ${eventTitle}`;
  email.htmlContent = htmlContent;
  email.sender = { name: 'Event Management System', email: process.env.BREVO_FROM_EMAIL };
  email.to = [{ email: studentEmail, name: studentName }];

  await brevoClient.sendTransacEmail(email);
};

// Register for an event
router.post('/:eventId', auth, async (req, res) => {
  try {
    const { name, department, year, whatsapp, subEvent } = req.body;
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
      name, department, year, whatsapp, subEvent
    });
    await registration.save();

    event.registeredCount += 1;
    await event.save();

    // Registration is saved at this point regardless of what happens below.
    // Email failures are logged and reported separately so the student
    // still gets a success response instead of a false "Server error".
    try {
      const student = await User.findById(req.user.userId);
      await sendConfirmationEmail(
        student.email, name, department, year, whatsapp,
        subEvent, event.title, event.date, event.location
      );
    } catch (emailError) {
      console.error('❌ Confirmation email failed:', emailError.message);
      return res.status(201).json({
        message: 'Registered successfully! (Confirmation email could not be sent — please check your registration in the app.)'
      });
    }

    res.status(201).json({ message: 'Registered successfully! Check your email.' });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get registrations for a specific event grouped by sub-event
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId });
    res.json(registrations);
  } catch (error) {
    console.error('❌ Fetch registrations error:', error.message);
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
    console.error('❌ Fetch my registrations error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;