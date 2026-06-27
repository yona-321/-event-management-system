const sendEmail = async (to, subject, html) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Event Management System <noreply@rojaevent.dev>',
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Email sending failed:', err.message);
    } else {
      console.log('Email sent to', to);
    }
  } catch (error) {
    console.error('Email sending failed:', error.message);
  }
};

module.exports = sendEmail;