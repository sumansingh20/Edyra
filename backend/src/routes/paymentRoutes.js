import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ==================== STRIPE ROUTES ====================

// Create payment intent (for web form)
router.post('/stripe/create-intent', authenticate, async (req, res) => {
  // Allow students and admins to initiate payments
  if (req.user.role !== 'student' && !['admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  await paymentController.createStripePaymentIntent(req, res);
});

// Verify stripe payment
router.post('/stripe/verify', authenticate, paymentController.verifyStripePayment);

// ==================== RAZORPAY ROUTES ====================

// Create order (for Indian rupees)
router.post('/razorpay/create-order', authenticate, async (req, res) => {
  if (req.user.role !== 'student' && !['admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  await paymentController.createRazorpayOrder(req, res);
});

// Verify razorpay payment
router.post('/razorpay/verify', authenticate, paymentController.verifyRazorpayPayment);

// ==================== WEBHOOK ROUTES ====================

// Stripe webhook (public - no auth needed)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

// Razorpay webhook (public - no auth needed)
router.post('/razorpay/webhook', express.json(), paymentController.handleRazorpayWebhook);

// ==================== PAYMENT HISTORY & MANAGEMENT ====================

// Get payment history for a student
router.get('/history/:studentId', authenticate, paymentController.getPaymentHistory);

// Refund a payment
router.post('/refund', authenticate, authorize(['admin', 'super-admin']), paymentController.refundPayment);

export default router;
