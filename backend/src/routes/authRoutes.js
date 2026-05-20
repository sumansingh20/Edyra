import express from 'express';
import * as authController from '../controllers/authController.js';
import * as authAdvancedController from '../controllers/authAdvancedController.js';
import { authenticate, validateSession } from '../middleware/auth.js';
import { validate, authSchemas } from '../middleware/validation.js';
import { loginRateLimiter } from '../middleware/security.js';

const router = express.Router();

// ===== Public routes =====
router.post(
  '/register',
  loginRateLimiter,
  validate(authSchemas.register),
  authController.register
);

router.post(
  '/login',
  loginRateLimiter,
  validate(authSchemas.login),
  authController.login
);

// Forgot password / reset
router.post('/forgot-password', loginRateLimiter, authController.forgotPassword);
router.post('/reset-password', loginRateLimiter, authController.resetPassword);

// Email verification (public — token-based)
router.post('/verify-email', authController.verifyEmail);

// DOB-based login for students (exam portal)
router.post(
  '/dob-login',
  loginRateLimiter,
  authController.dobLogin
);

// Advanced Auth - Public
router.post('/google-login', loginRateLimiter, authAdvancedController.googleLogin);
router.post('/verify-2fa', loginRateLimiter, authAdvancedController.verify2FAToken);

// OAuth Callback (server-side for traditional OAuth flow)
router.get('/oauth/google/callback', authAdvancedController.googleOAuthCallback || ((req, res) => {
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_not_configured`);
}));

// Server time - public (used on login/exam pages for clock sync)
router.get('/server-time', authController.getServerTime);

router.post(
  '/refresh-token',
  validate(authSchemas.refreshToken),
  authController.refreshToken
);

// ===== Protected routes =====
router.use(authenticate);

router.post('/logout', authController.logout);

router.get('/me', authController.getMe);

router.get('/session', validateSession, authController.checkSession);

router.put(
  '/profile',
  validateSession,
  authController.updateProfile
);

router.post(
  '/profile/avatar',
  validateSession,
  authController.uploadAvatar
);

router.put(
  '/change-password',
  validateSession,
  validate(authSchemas.changePassword),
  authController.changePassword
);

// Email verification (authenticated — request new token)
router.post('/request-verification', authController.requestEmailVerification);

// ===== 2FA (Protected) =====
router.get('/2fa/generate', authAdvancedController.generate2FA);
router.post('/2fa/enable', authAdvancedController.enable2FA);
router.post('/2fa/disable', authAdvancedController.disable2FA || ((req, res) => {
  res.json({ success: false, message: '2FA disable endpoint coming soon' });
}));

// ===== Device Management (Protected) =====
router.post('/device/track', authAdvancedController.trackDevice);
router.get('/device/list', authAdvancedController.getMyDevices);
router.delete('/device/:deviceId', authAdvancedController.revokeDevice);

export default router;
