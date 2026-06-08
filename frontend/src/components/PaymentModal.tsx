'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface PaymentModalProps {
  studentId: string;
  amount: number;
  feeType: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({
  studentId,
  amount,
  feeType,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<'stripe' | 'razorpay'>('stripe');
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  if (!isOpen) return null;

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      // Create payment intent
      const response = await api.post('/payments/stripe/create-intent', {
        studentId,
        amount,
        feeType,
      });

      const { clientSecret, paymentIntentId } = response.data;

      // In production, use Stripe.js library for complete integration
      // For now, show success message
      toast.success('Payment initiated. Redirecting to Stripe...');

      // Simulate payment verification
      const verifyRes = await api.post('/payments/stripe/verify', {
        paymentIntentId,
        studentId,
        feeType,
      });

      if (verifyRes.data.success) {
        toast.success(' Payment successful!');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      // Create Razorpay order
      const orderResponse = await api.post('/payments/razorpay/create-order', {
        studentId,
        amount,
        feeType,
      });

      const { orderId, keyId } = orderResponse.data;

      // Simulate Razorpay payment (in production, use Razorpay SDK)
      // For demonstration, auto-verify after 2 seconds
      setTimeout(async () => {
        try {
          const verifyRes = await api.post('/payments/razorpay/verify', {
            razorpay_order_id: orderId,
            razorpay_payment_id: `pay_${Date.now()}`,
            razorpay_signature: 'mock_signature_for_demo',
            studentId,
            feeType,
            amount,
          });

          if (verifyRes.data.success) {
            toast.success(' Payment successful!');
            onSuccess?.();
            onClose();
          }
        } catch (error: any) {
          toast.error('Payment verification failed');
        }
        setLoading(false);
      }, 2000);

      toast.loading('Processing payment...');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create order');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-300">Fee Type:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {feeType.charAt(0).toUpperCase() + feeType.slice(1)}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-300">Amount:</span>
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
              ${amount.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total Due:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ${amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod('stripe')}
              className={`p-3 rounded-lg border-2 transition-all ${
                method === 'stripe'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">Stripe</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">USD</div>
            </button>
            <button
              onClick={() => setMethod('razorpay')}
              className={`p-3 rounded-lg border-2 transition-all ${
                method === 'razorpay'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">Razorpay</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">INR</div>
            </button>
          </div>
        </div>

        {/* Card Details (for demo) */}
        {method === 'stripe' && (
          <div className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Card Holder Name"
              value={cardDetails.cardholderName}
              onChange={(e) =>
                setCardDetails({ ...cardDetails, cardholderName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Card Number"
              maxLength={19}
              value={cardDetails.cardNumber}
              onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiryDate}
                onChange={(e) =>
                  setCardDetails({ ...cardDetails, expiryDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="CVV"
                maxLength={4}
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {method === 'razorpay' && (
          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg mb-6 text-sm text-gray-700 dark:text-gray-300">
             You will be redirected to Razorpay for secure payment processing
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => (method === 'stripe' ? handleStripePayment() : handleRazorpayPayment())}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
           Your payment information is secure and encrypted
        </div>
      </div>
    </div>
  );
}
