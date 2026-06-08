import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import Fee from '../models/Fee.js';
import AuditLog from '../models/AuditLog.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'razorpay_key_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'razorpay_secret_dummy',
});

// ==================== STRIPE INTEGRATION ====================

export const createStripePaymentIntent = async (req, res) => {
  try {
    const { studentId, amount, feeType, description } = req.body;

    // Validate request
    if (!studentId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment details' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        studentId,
        feeType: feeType || 'tuition',
        studentEmail: student.email,
      },
      statement_descriptor: `Edyra-${feeType || 'Fee'}`.substring(0, 22),
      receipt_email: student.email,
    });

    // Log transaction initiation
    await AuditLog.create({
      action: 'payment_initiated',
      userId: req.user._id,
      targetId: studentId,
      details: {
        provider: 'stripe',
        paymentIntentId: paymentIntent.id,
        amount,
        feeType,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Stripe payment error:', error);
    await AuditLog.create({
      action: 'payment_error',
      userId: req.user._id,
      details: { error: error.message },
    });
    res.status(400).json({ error: error.message });
  }
};

export const verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, studentId, feeType } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status,
      });
    }

    // Record successful payment
    const fee = await Fee.findOneAndUpdate(
      { student: studentId, type: feeType || 'tuition' },
      {
        paidAmount: paymentIntent.amount / 100,
        paymentDate: new Date(),
        paymentMethod: 'stripe',
        paymentRef: paymentIntentId,
        status: 'paid',
      },
      { new: true, upsert: true }
    );

    // Log successful transaction
    await AuditLog.create({
      action: 'payment_completed',
      userId: req.user._id,
      targetId: studentId,
      details: {
        provider: 'stripe',
        paymentIntentId,
        amount: paymentIntent.amount / 100,
        feeType,
      },
    });

    // Send confirmation email
    const student = await User.findById(studentId);
    if (student?.email) {
      // TODO: Send email notification
      // await sendPaymentConfirmationEmail(student.email, fee);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      fee: {
        _id: fee._id,
        amount: fee.paidAmount,
        type: fee.type,
        paidDate: fee.paymentDate,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ==================== RAZORPAY INTEGRATION ====================

export const createRazorpayOrder = async (req, res) => {
  try {
    const { studentId, amount, feeType, description } = req.body;

    if (!studentId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment details' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // In paise
      currency: 'INR',
      receipt: `edyra-${studentId}-${Date.now()}`,
      notes: {
        studentId,
        feeType: feeType || 'tuition',
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.email,
      },
      timeout: 900, // 15 minutes
    });

    // Log transaction
    await AuditLog.create({
      action: 'payment_initiated',
      userId: req.user._id,
      targetId: studentId,
      details: {
        provider: 'razorpay',
        orderId: order.id,
        amount,
        feeType,
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId, feeType, amount } = req.body;

    // Verify Razorpay signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      await AuditLog.create({
        action: 'payment_fraud_attempt',
        targetId: studentId,
        details: { orderId: razorpay_order_id },
      });
      return res.status(400).json({ error: 'Payment verification failed - Invalid signature' });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        error: 'Payment not captured',
        status: payment.status,
      });
    }

    // Record successful payment
    const fee = await Fee.findOneAndUpdate(
      { student: studentId, type: feeType || 'tuition' },
      {
        paidAmount: payment.amount / 100,
        paymentDate: new Date(),
        paymentMethod: 'razorpay',
        paymentRef: razorpay_payment_id,
        status: 'paid',
      },
      { new: true, upsert: true }
    );

    // Log successful transaction
    await AuditLog.create({
      action: 'payment_completed',
      userId: req.user._id,
      targetId: studentId,
      details: {
        provider: 'razorpay',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: payment.amount / 100,
        feeType,
      },
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      fee: {
        _id: fee._id,
        amount: fee.paidAmount,
        type: fee.type,
        paidDate: fee.paymentDate,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ==================== WEBHOOK HANDLERS ====================

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        // Update fee status in database
        break;
      }
      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object;
        console.log(`Payment failed: ${failedIntent.id}`);
        // Log failure
        break;
      }
      case 'charge.refunded': {
        const refund = event.data.object;
        console.log(`Refund processed: ${refund.id}`);
        // Update fee status as refunded
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    switch (event) {
      case 'payment.authorized':
        // Payment authorized
        break;
      case 'payment.failed':
        console.log(`Payment failed: ${payload.payment.entity.id}`);
        break;
      case 'refund.created':
        console.log(`Refund created: ${payload.refund.entity.id}`);
        break;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ==================== PAYMENT HISTORY ====================

export const getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fees = await Fee.find({ student: studentId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        fees,
        totalPaid: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.paidAmount, 0),
        totalDue: fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0),
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { paymentRef, provider, amount, reason } = req.body;

    let refundId;

    if (provider === 'stripe') {
      const refund = await stripe.refunds.create({
        payment_intent: paymentRef,
        reason: reason || 'requested_by_customer',
      });
      refundId = refund.id;
    } else if (provider === 'razorpay') {
      const refund = await razorpay.payments.refund(paymentRef, {
        amount: Math.round(amount * 100),
        notes: { reason },
      });
      refundId = refund.id;
    }

    // Log refund
    await AuditLog.create({
      action: 'payment_refunded',
      userId: req.user._id,
      details: {
        provider,
        originalPaymentRef: paymentRef,
        refundId,
        amount,
        reason,
      },
    });

    // Update fee status
    const fee = await Fee.findOneAndUpdate(
      { paymentRef },
      { status: 'refunded', refundRef: refundId },
      { new: true }
    );

    res.json({
      success: true,
      refundId,
      fee,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default {
  createStripePaymentIntent,
  verifyStripePayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleStripeWebhook,
  handleRazorpayWebhook,
  getPaymentHistory,
  refundPayment,
};
