import nodemailer from 'nodemailer';
import config from '../config/index.js';

/* ========== TRANSPORT ========== */
const createTransport = () => {
  // Development: use Ethereal or Mailhog
  if (config.env === 'development' || !config.email?.host) {
    return nodemailer.createTransport({
      host: process.env.MAILHOG_HOST || 'localhost',
      port: Number(process.env.MAILHOG_PORT) || 1025,
      secure: false,
      ignoreTLS: true,
    });
  }

  // Production: use real SMTP
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

const transporter = createTransport();

/* ========== BASE TEMPLATE ========== */
const baseTemplate = (title, body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    body{margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;color:#3d3d3d}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.12)}
    .hdr{background:linear-gradient(135deg,#1d2d3e 0%,#2a4a6b 100%);padding:32px 40px;text-align:center}
    .hdr-logo{font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px}
    .hdr-logo span{color:#f98012}
    .hdr-sub{color:rgba(255,255,255,0.7);font-size:13px;margin-top:6px}
    .body{padding:36px 40px}
    .body h2{font-size:22px;font-weight:700;color:#1d2d3e;margin-bottom:12px}
    .body p{font-size:15px;line-height:1.7;color:#555;margin-bottom:16px}
    .btn{display:inline-block;background:#f98012;color:#fff;padding:13px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;margin:8px 0 20px}
    .btn:hover{background:#e07010}
    .code-box{background:#f4f6f8;border:2px dashed #dee2e6;border-radius:6px;padding:16px 24px;text-align:center;font-size:28px;font-weight:900;font-family:monospace;letter-spacing:8px;color:#1d2d3e;margin:20px 0}
    .divider{height:1px;background:#f0f2f4;margin:24px 0}
    .ftr{background:#f8f9fa;padding:20px 40px;text-align:center;font-size:12px;color:#999;border-top:1px solid #dee2e6}
    .ftr a{color:#0f6cbf;text-decoration:none}
    .warn{background:#fff4e8;border-left:4px solid #f98012;padding:12px 16px;border-radius:4px;font-size:13px;color:#7a5200;margin:16px 0}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <div class="hdr-logo">EDY<span>RA</span></div>
      <div class="hdr-sub">Enterprise Learning Management System</div>
    </div>
    <div class="body">${body}</div>
    <div class="ftr">
      <p>© ${new Date().getFullYear()} EDYRA — Enterprise LMS. All rights reserved.</p>
      <p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a> · <a href="#">Support</a></p>
    </div>
  </div>
</body>
</html>`;

/* ========== SEND FUNCTION ========== */
const sendMail = async ({ to, subject, html, text }) => {
  const from = config.email?.from || `"EDYRA LMS" <noreply@edyra.com>`;
  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log(`[EMAIL] Sent to ${to}: ${subject} — MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/* ========== TEMPLATES ========== */

export const sendWelcomeEmail = async (user) => {
  const body = `
    <h2>Welcome to EDYRA, ${user.firstName}! 🎉</h2>
    <p>Your account has been created successfully. You can now access the full Edyra Learning Management System.</p>
    <p>Here are your account details:</p>
    <div class="warn">
      <strong>Email:</strong> ${user.email}<br/>
      <strong>Role:</strong> ${user.role}<br/>
      ${user.studentId ? `<strong>Student ID:</strong> ${user.studentId}` : ''}
    </div>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="btn">Sign In to Portal →</a>
    <div class="divider"></div>
    <p style="font-size:13px;color:#999">If you did not create this account, please contact your administrator immediately.</p>`;
  return sendMail({
    to: user.email,
    subject: 'Welcome to EDYRA — Your Account is Ready',
    html: baseTemplate('Welcome to EDYRA', body),
  });
};

export const sendEmailVerification = async (user, verifyToken) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verifyToken}`;
  const body = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${user.firstName}, please verify your email address to activate your EDYRA account.</p>
    <a href="${link}" class="btn">Verify Email Address →</a>
    <div class="divider"></div>
    <p style="font-size:13px;color:#999">This link expires in 24 hours. If you did not request this, ignore this email.</p>
    <p style="font-size:12px;color:#bbb;word-break:break-all">Or copy this link: ${link}</p>`;
  return sendMail({
    to: user.email,
    subject: 'EDYRA — Verify Your Email Address',
    html: baseTemplate('Email Verification', body),
  });
};

export const sendPasswordReset = async (user, resetToken) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const body = `
    <h2>Reset Your Password</h2>
    <p>Hi ${user.firstName}, we received a request to reset the password for your EDYRA account.</p>
    <a href="${link}" class="btn">Reset Password →</a>
    <div class="warn">⚠️ This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email and your password will remain unchanged.</div>
    <div class="divider"></div>
    <p style="font-size:12px;color:#bbb;word-break:break-all">Or copy this link: ${link}</p>`;
  return sendMail({
    to: user.email,
    subject: 'EDYRA — Password Reset Request',
    html: baseTemplate('Password Reset', body),
  });
};

export const send2FACode = async (user, otp) => {
  const body = `
    <h2>Your 2FA Setup Code</h2>
    <p>Hi ${user.firstName}, here is your one-time setup code for two-factor authentication:</p>
    <div class="code-box">${otp}</div>
    <div class="warn">⚠️ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>`;
  return sendMail({
    to: user.email,
    subject: 'EDYRA — Two-Factor Authentication Code',
    html: baseTemplate('2FA Code', body),
  });
};

export const send2FAEnabled = async (user) => {
  const body = `
    <h2>Two-Factor Authentication Enabled ✓</h2>
    <p>Hi ${user.firstName}, two-factor authentication has been successfully enabled on your EDYRA account.</p>
    <div class="warn">🔒 Your account is now more secure. If you did not enable 2FA, contact your administrator immediately.</div>`;
  return sendMail({
    to: user.email,
    subject: 'EDYRA — 2FA Enabled on Your Account',
    html: baseTemplate('2FA Enabled', body),
  });
};

export const sendExamReminder = async (user, exam) => {
  const body = `
    <h2>Exam Reminder: ${exam.title}</h2>
    <p>Hi ${user.firstName}, your exam is starting soon.</p>
    <div class="warn">
      <strong>Exam:</strong> ${exam.title}<br/>
      <strong>Subject:</strong> ${exam.subject}<br/>
      <strong>Start Time:</strong> ${new Date(exam.startTime).toLocaleString()}<br/>
      <strong>Duration:</strong> ${exam.duration} minutes
    </div>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/exam" class="btn">Go to Exam Portal →</a>`;
  return sendMail({
    to: user.email,
    subject: `EDYRA — Exam Reminder: ${exam.title}`,
    html: baseTemplate('Exam Reminder', body),
  });
};

export const sendCertificateReady = async (user, course, certificateId) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificates/${certificateId}`;
  const body = `
    <h2>Congratulations! Your Certificate is Ready 🏆</h2>
    <p>Hi ${user.firstName}, you have successfully completed <strong>${course.title}</strong>.</p>
    <a href="${link}" class="btn">Download Certificate →</a>`;
  return sendMail({
    to: user.email,
    subject: `EDYRA — Certificate Ready: ${course.title}`,
    html: baseTemplate('Certificate Ready', body),
  });
};

export default {
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordReset,
  send2FACode,
  send2FAEnabled,
  sendExamReminder,
  sendCertificateReady,
};
