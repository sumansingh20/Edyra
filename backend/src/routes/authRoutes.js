import express from 'express';
import * as authController from '../controllers/authController.js';
import * as authAdvancedController from '../controllers/authAdvancedController.js';
import { authenticate, validateSession } from '../middleware/auth.js';
import { validate, authSchemas } from '../middleware/validation.js';
import { loginRateLimiter } from '../middleware/security.js';

const router = express.Router();

// Public routes
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

// Server time - public, no auth needed (used on login page)
router.get('/server-time', authController.getServerTime);

router.post(
  '/refresh-token',
  validate(authSchemas.refreshToken),
  authController.refreshToken
);

// Protected routes
router.use(authenticate);

router.post('/logout', authController.logout);

router.get('/me', authController.getMe);

router.get('/session', validateSession, authController.checkSession);

router.put(
  '/profile',
  validateSession,
  authController.updateProfile
);

router.put(
  '/change-password',
  validateSession,
  validate(authSchemas.changePassword),
  authController.changePassword
);

// Email verification (authenticated — request new token)
router.post('/request-verification', authController.requestEmailVerification);

// Advanced Auth - Protected
router.get('/2fa/generate', authAdvancedController.generate2FA);
router.post('/2fa/enable', authAdvancedController.enable2FA);
router.post('/device/track', authAdvancedController.trackDevice);
router.get('/device/list', authAdvancedController.getMyDevices);
router.delete('/device/:deviceId', authAdvancedController.revokeDevice);

export default router;
