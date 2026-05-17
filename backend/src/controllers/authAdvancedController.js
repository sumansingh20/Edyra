import { User, AuditLog, Device } from '../models/index.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';
import { TOTP } from 'otplib';
const authenticator = new TOTP();
import QRCode from 'qrcode';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ========== 2FA: Generate Secret & QR Code ========== */
export const generate2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.twoFactorEnabled) {
      throw new AppError('2FA is already enabled', 400);
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.toURI({ label: user.email, issuer: 'EDYRA Enterprise', secret });
    
    // Generate QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    
    // Generate Backup Codes
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));

    // Save temporary secret and backup codes
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: '2FA generated successfully',
      data: {
        qrCode: qrCodeDataUrl,
        secret,
        backupCodes
      }
    });
  } catch (error) {
    next(error);
  }
};

/* ========== 2FA: Verify and Enable ========== */
export const enable2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');
    
    if (!user.twoFactorSecret) {
      throw new AppError('2FA has not been generated yet', 400);
    }

    const isValid = await authenticator.verify({ token, secret: user.twoFactorSecret });
    
    if (!isValid) {
      throw new AppError('Invalid 2FA token', 400);
    }

    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });

    try {
      await AuditLog.log({
        user: user._id,
        userEmail: user.email,
        action: '2fa-enabled',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
      });
    } catch (e) {
      console.error('AuditLog error:', e);
    }

    res.json({
      success: true,
      message: '2FA has been successfully enabled',
    });
  } catch (error) {
    next(error);
  }
};

/* ========== 2FA: Verify Token (For Login Step) ========== */
export const verify2FAToken = async (req, res, next) => {
  try {
    const { email, token, isBackupCode } = req.body;
    
    const user = await User.findOne({ email }).select('+twoFactorSecret +twoFactorBackupCodes');
    
    if (!user || !user.twoFactorEnabled) {
      throw new AppError('2FA is not enabled for this user', 400);
    }

    let isValid = false;

    if (isBackupCode) {
      if (user.twoFactorBackupCodes.includes(token)) {
        isValid = true;
        // Remove used backup code
        user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(code => code !== token);
        await user.save({ validateBeforeSave: false });
      }
    } else {
      isValid = await authenticator.verify({ token, secret: user.twoFactorSecret });
    }

    if (!isValid) {
      throw new AppError('Invalid token or backup code', 400);
    }

    // Login successful
    const { generateSessionJWT, setSessionCookie, generateAccessToken } = await import('./authController.js');
    
    const sessionToken = generateSessionJWT(user);
    setSessionCookie(res, sessionToken);
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, role: user.role },
        token: accessToken
      }
    });

  } catch (error) {
    next(error);
  }
};

/* ========== Google OAuth Login ========== */
export const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) throw new AppError('Google token required', 400);

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) throw new AppError('Invalid Google token', 400);

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Auto-register if not found? Or reject?
      // Enterprise pattern: only allow if domain matches or it's an invite
      if (process.env.ALLOW_OAUTH_SIGNUP === 'true') {
        user = await User.create({
          email: payload.email,
          firstName: payload.given_name,
          lastName: payload.family_name,
          role: 'student',
          isActive: true,
          isVerified: true,
          password: crypto.randomBytes(16).toString('hex') // Dummy password
        });
      } else {
        throw new AppError('Email not registered in the system', 403);
      }
    }

    if (!user.isActive) throw new AppError('Account is deactivated', 403);

    // If 2FA enabled, request 2FA
    if (user.twoFactorEnabled) {
      return res.status(206).json({
        success: true,
        message: '2FA required',
        requires2FA: true,
        email: user.email
      });
    }

    // Complete login
    const { generateSessionJWT, setSessionCookie, generateAccessToken } = await import('./authController.js');
    const sessionToken = generateSessionJWT(user);
    setSessionCookie(res, sessionToken);
    
    res.json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, role: user.role },
        token: generateAccessToken(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

/* ========== Device Management ========== */
export const trackDevice = async (req, res, next) => {
  try {
    const { fingerprint, browser, os, deviceType } = req.body;
    const ipHash = crypto.createHash('sha256').update(req.ip).digest('hex');

    // Find if device already exists for user
    let device = await Device.findOne({ user: req.user._id, fingerprint });

    if (!device) {
      // Create new device
      device = await Device.create({
        user: req.user._id,
        deviceId: fingerprint || crypto.randomUUID(),
        fingerprint,
        browser,
        os,
        deviceType,
        ipAddress: ipHash,
        lastActiveAt: Date.now(),
        isTrusted: false
      });
      
      // Notify if new unrecognized device (simulated)
      try {
        await AuditLog.log({
          user: req.user._id,
          action: 'new-device-login',
          details: { fingerprint, browser, os },
          ipAddress: req.ip,
          status: 'success'
        });
      } catch (e) {
        console.error('AuditLog error:', e);
      }
    } else {
      device.lastActiveAt = Date.now();
      device.ipAddress = ipHash;
      device.loginCount += 1;
      await device.save();
    }

    res.json({ success: true, data: { device } });
  } catch (error) {
    next(error);
  }
};

export const getMyDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ user: req.user._id }).sort('-lastActiveAt');
    res.json({ success: true, data: { devices } });
  } catch (error) {
    next(error);
  }
};

export const revokeDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    await Device.findOneAndDelete({ _id: deviceId, user: req.user._id });
    res.json({ success: true, message: 'Device revoked successfully' });
  } catch (error) {
    next(error);
  }
};
