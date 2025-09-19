"use client";

import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Modal, Button, Card, CardHeader, CardTitle, CardContent, Alert, Input, Label, Badge } from '../ui';
import { type Id } from '../../../convex/_generated/dataModel';
import { type PaymentFormData, type PaymentStatus, type AdvisorPricing, type BillingInformation } from '../../types/payment';
import { XMarkIcon, CreditCardIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisorId?: Id<"advisors">;
  advisorName?: string;
  onSuccess: (subscription: any) => void;
  stripePublishableKey: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const PaymentForm: React.FC<{
  advisorId?: Id<"advisors">;
  advisorName?: string;
  onSuccess: (subscription: any) => void;
}> = ({ advisorId, advisorName, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });
  const [billingInfo, setBillingInfo] = useState<BillingInformation>({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });
  const [subscriptionType, setSubscriptionType] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);

  const pricing: AdvisorPricing = {
    basic: {
      price: 29,
      currency: 'USD',
      interval: 'month',
      features: [
        'Up to 10 advisor messages per month',
        'Email support',
        'Basic analytics',
        '24-hour response time'
      ]
    },
    premium: {
      price: 99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Unlimited advisor messages',
        'Priority support',
        'Advanced analytics',
        '12-hour response time',
        'Video call options',
        'Document sharing'
      ]
    },
    enterprise: {
      price: 299,
      currency: 'USD',
      interval: 'month',
      features: [
        'Everything in Premium',
        'Custom advisor matching',
        'Dedicated account manager',
        '6-hour response time',
        'API access',
        'Custom integrations',
        'White-label options'
      ]
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setPaymentStatus({
        status: 'failed',
        error: 'Stripe has not loaded properly'
      });
      return;
    }

    setPaymentStatus({ status: 'processing' });

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: pricing[subscriptionType].price * 100, // Convert to cents
          currency: pricing[subscriptionType].currency,
          advisorId,
          subscriptionType,
          metadata: {
            advisorName,
            billingEmail: billingInfo.email
          }
        }),
      });

      const { client_secret, error } = await response.json();

      if (error) {
        throw new Error(error.message);
      }

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: billingInfo.name,
            email: billingInfo.email,
            phone: billingInfo.phone,
            address: billingInfo.address,
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      setPaymentStatus({ status: 'succeeded' });

      // Create subscription
      await createSubscription();

    } catch (error) {
      setPaymentStatus({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payment failed'
      });
    }
  };

  const createSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisorId,
          subscriptionType,
          billingInfo,
          savePaymentMethod
        }),
      });

      const subscription = await response.json();
      onSuccess(subscription);
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  const formatPrice = (price: number, currency: string, interval: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price) + '/' + interval;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentStatus.status === 'succeeded' && (
        <Alert variant="default" className="mb-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2" />
            <span>Payment successful! Setting up your subscription...</span>
          </div>
        </Alert>
      )}

      {paymentStatus.status === 'failed' && (
        <Alert variant="destructive" className="mb-6">
          <div className="flex items-center">
            <XMarkIcon className="w-5 h-5 mr-2" />
            <span>{paymentStatus.error}</span>
          </div>
        </Alert>
      )}

      {/* Advisor Selection */}
      {advisorId && advisorName && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-2">Selected Advisor</h3>
            <p className="text-gray-600">{advisorName}</p>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Choose Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['basic', 'premium', 'enterprise'] as const).map((plan) => (
            <Card
              key={plan}
              className={`cursor-pointer transition-all ${
                subscriptionType === plan
                  ? 'ring-2 ring-blue-500 border-blue-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSubscriptionType(plan)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 capitalize">{plan}</h4>
                  {subscriptionType === plan && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  {formatPrice(pricing[plan].price, pricing[plan].currency, pricing[plan].interval)}
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  {pricing[plan].features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Billing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={billingInfo.name}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={billingInfo.email}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={billingInfo.phone}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              type="text"
              value={billingInfo.address?.postal_code || ''}
              onChange={(e) => setBillingInfo(prev => ({
                ...prev,
                address: { ...prev.address!, postal_code: e.target.value }
              }))}
              required
            />
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
        <div className="p-4 border border-gray-200 rounded-lg">
          <Label htmlFor="card-element">Card Information</Label>
          <div className="mt-2">
            <CardElement
              id="card-element"
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="save-payment-method"
            checked={savePaymentMethod}
            onChange={(e) => setSavePaymentMethod(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="save-payment-method" className="ml-2 text-sm text-gray-600">
            Save payment method for future use
          </label>
        </div>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)} Plan</span>
              <span>{formatPrice(pricing[subscriptionType].price, pricing[subscriptionType].currency, pricing[subscriptionType].interval)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(pricing[subscriptionType].price, pricing[subscriptionType].currency, pricing[subscriptionType].interval)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!stripe || paymentStatus.status === 'processing'}
      >
        {paymentStatus.status === 'processing' ? (
          <div className="flex items-center justify-center">
            <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <CreditCardIcon className="w-5 h-5 mr-2" />
            Pay {formatPrice(pricing[subscriptionType].price, pricing[subscriptionType].currency, pricing[subscriptionType].interval)}
          </div>
        )}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Your payment is secured with SSL encryption. We never store your card details.
      </p>
    </form>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  advisorId,
  advisorName,
  onSuccess,
  stripePublishableKey
}) => {
  if (!stripePublishableKey) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Your Subscription"
      size="lg"
    >
      <Elements stripe={stripePromise}>
        <PaymentForm
          advisorId={advisorId}
          advisorName={advisorName}
          onSuccess={onSuccess}
        />
      </Elements>
    </Modal>
  );
};