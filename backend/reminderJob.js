const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Registration = require('./models/Registration');
const Event = require('./models/Event');
const User = require('./models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendReminderEmails = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Find events happening tomorrow
    const events = await Event.find({
      date: { $gte: tomorrow, $lt: dayAfter }
    });

    console.log(`Found ${events.length} events tomorrow`);

    for (const event of events) {
      const registrations = await Registration.find({ event: event._id });

      for (const reg of registrations) {
        const student = await User.findById(reg.student);
        if (!student) continue;

        await transporter.sendMail({
          from: `"Event Management System" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: `⏰ Reminder: ${event.title} is Tomorrow!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #1a73e8, #0d47a1); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">⏰ Event Reminder!</h1>
                <p style="color: #cce5ff; margin-top: 8px;">Your event is tomorrow!</p>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <p style="font-size: 16px;">Hi <strong>${reg.name}</strong>,</p>
                <p>This is a reminder that you have registered for an event happening <strong>tomorrow</strong>!</p>
                <table style="width:100%;border-collapse:collapse;margin-top:20px;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                  <tr style="background:#1a73e8;color:white;">
                    <th style="padding:12px 16px;text-align:left;">Field</th>
                    <th style="padding:12px 16px;text-align:left;">Details</th>
                  </tr>
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px 16px;">🎯 Event</td>
                    <td style="padding:12px 16px;"><strong>${event.title}</strong></td>
                  </tr>
                  <tr style="border-bottom:1px solid #eee;background:#f5f5f5;">
                    <td style="padding:12px 16px;">🏆 Competition</td>
                    <td style="padding:12px 16px;">${reg.subEvent || 'General'}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px 16px;">📅 Date</td>
                    <td style="padding:12px 16px;">${new Date(event.date).toDateString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #eee;background:#f5f5f5;">
                    <td style="padding:12px 16px;">📍 Location</td>
                    <td style="padding:12px 16px;">${event.location}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px 16px;">🏫 Department</td>
                    <td style="padding:12px 16px;">${reg.department}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;">📚 Year</td>
                    <td style="padding:12px 16px;">${reg.year}</td>
                  </tr>
                </table>
                <div style="margin-top:25px;padding:15px;background:#fff3e0;border-left:4px solid #ff9800;border-radius:4px;">
                  <p style="margin:0;">📌 Please be on time! We look forward to seeing you there. Good luck! 🎊</p>
                </div>
              </div>
              <div style="background:#1a73e8;padding:15px;text-align:center;">
                <p style="color:white;margin:0;font-size:13px;">Event Management System © 2026</p>
              </div>
            </div>
          `
        });
        console.log(`Reminder sent to ${student.email} for ${event.title}`);
      }
    }
  } catch (error) {
    console.error('Reminder job error:', error.message);
  }
};

// Run every day at 8:00 AM
cron.schedule('0 8 * * *', () => {
  console.log('Running daily reminder job...');
  sendReminderEmails();
});

module.exports = { sendReminderEmails };