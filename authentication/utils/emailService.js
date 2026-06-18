const fs = require('fs');
const path = require('path');
const { SMTPClient } = require('emailjs');
const authConfig = require('../config/authConfig');

const superAdminEmail = authConfig.superAdminEmail || 'edubridgeadmin1@gmail.com';

// Configure SMTP Client
const client = new SMTPClient({
  user: authConfig.smtpUser,
  password: authConfig.smtpPass,
  host: authConfig.smtpHost,
  port: parseInt(authConfig.smtpPort || '587', 10),
  ssl: authConfig.smtpSecure === 'true', // true for SSL (typically port 465)
  tls: authConfig.smtpSecure !== 'true', // true for TLS/STARTTLS (typically port 587)
});

/**
 * Sends a notification email. Dispatches a real email via SMTP if credentials 
 * are present, otherwise logs the payload to the root "sent_emails.log" file.
 * 
 * @param {Object} emailOptions - Payload options
 * @param {string} emailOptions.to - Recipient email address
 * @param {string} emailOptions.subject - Notification subject
 * @param {string} emailOptions.text - Text/Markdown payload
 * @param {string} [emailOptions.html] - HTML payload
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const timestamp = new Date().toLocaleString();
  const logDir = path.resolve(__dirname, '../../');
  const logFile = path.join(logDir, 'sent_emails.log');

  const formattedMsg = `
========================================================================
📧  [EMAIL NOTIFICATION PROCESSED] - ${timestamp}
========================================================================
📬  TO      : ${to}
📨  SUBJECT : ${subject}
------------------------------------------------------------------------
${text.trim()}
========================================================================
`;

  // Always log to console and local file
  console.log(formattedMsg);
  try {
    fs.appendFileSync(logFile, formattedMsg + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to append sent email details to root log file:', err);
  }

  // If SMTP user and password are configured, send a real email using emailjs
  if (authConfig.smtpUser && authConfig.smtpPass) {
    try {
      const emailOptions = {
        text: text,
        from: authConfig.emailFrom || authConfig.smtpUser,
        to: to,
        subject: subject,
      };

      if (html) {
        emailOptions.attachment = [
          { data: html, alternative: true }
        ];
      }

      const info = await client.sendAsync(emailOptions);
      console.log(`📧 Real email successfully sent via emailjs to ${to}.`);
      return { success: true, info };
    } catch (err) {
      console.error('❌ Failed to send real email via emailjs:', err);
      return { success: false, error: err.message };
    }
  } else {
    console.log('⚠️ SMTP credentials not fully configured. Email logged locally in mock mode.');
    return { success: true, mock: true };
  }
};

module.exports = {
  sendEmail,
  superAdminEmail
};
