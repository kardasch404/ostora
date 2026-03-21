const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'noreplayostora@gmail.com',
    pass: 'phyojupvncdsvbzv', // Remove spaces from app password
  },
});

// Test email
const mailOptions = {
  from: '"Ostora Platform" <noreplayostora@gmail.com>',
  to: 'zz2406143@gmail.com',
  subject: 'Test Email from Ostora',
  text: 'This is a test email to verify SMTP configuration.',
  html: '<h1>Test Email</h1><p>This is a test email to verify SMTP configuration.</p>',
};

// Send email
async function testEmail() {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');

    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
