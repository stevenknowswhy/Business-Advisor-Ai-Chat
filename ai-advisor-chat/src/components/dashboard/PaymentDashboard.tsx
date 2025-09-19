"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert } from '../ui';
import {
  CreditCardIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { type Id } from '../../../convex/_generated/dataModel';
import { type UserSubscription, type Subscription, type Invoice } from '../../types/payment';

interface PaymentDashboardProps {
  userId: Id<"users">;
  className?: string;
}

export const PaymentDashboard: React.FC<PaymentDashboardProps> = ({ userId, className = '' }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, [userId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subscriptions?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        // Transform the subscription data to match UserSubscription interface
        if (result.data.activeSubscription) {
          setSubscription({
            subscription: result.data.activeSubscription as Subscription,
            advisor: result.data.activeSubscription.advisor,
            paymentMethods: [],
            invoices: [],
            usage: {
              messagesSent: 0,
              messagesRemaining: -1, // Unlimited for paid plans
              periodEnd: Date.now() / 1000, // Temporary fallback
            }
          });
        }
      } else {
        setError(result.error?.message || 'Failed to load subscription data');
      }
    } catch (err) {
      setError('Failed to load subscription data');
      console.error('Subscription loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      if (!subscription?.subscription.id) return;

      const response = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.subscription.id,
          cancelAtPeriodEnd: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadSubscriptionData();
        setShowCancelConfirmation(false);
      } else {
        setError(result.error?.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error('Subscription cancellation error:', err);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      if (!subscription?.subscription.id) return;

      const response = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.subscription.id,
          subscriptionType: subscription.subscription.type,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadSubscriptionData();
      } else {
        setError(result.error?.message || 'Failed to reactivate subscription');
      }
    } catch (err) {
      setError('Failed to reactivate subscription');
      console.error('Subscription reactivation error:', err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubscriptionStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="warning">Cancels {formatDate(0)}</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'trialing':
        return <Badge variant="info">Trial</Badge>;
      case 'past_due':
        return <Badge variant="warning">Past Due</Badge>;
      case 'unpaid':
        return <Badge variant="danger">Unpaid</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSubscriptionTypeIcon = (type: string) => {
    switch (type) {
      case 'basic':
        return <CreditCardIcon className="w-5 h-5 text-blue-500" />;
      case 'premium':
        return <CreditCardIcon className="w-5 h-5 text-purple-500" />;
      case 'enterprise':
        return <CreditCardIcon className="w-5 h-5 text-green-500" />;
      default:
        return <CreditCardIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading subscription data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </Alert>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-12">
            <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-6">
              You don't have an active subscription. Subscribe to start using our premium features.
            </p>
            <Button variant="primary">
              Subscribe Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              {getSubscriptionTypeIcon(subscription.subscription.type)}
              <span>Subscription Overview</span>
            </CardTitle>
            {getSubscriptionStatusBadge(subscription.subscription.status, false)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Plan Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Plan:</span>{' '}
                  <span className="capitalize">{subscription.subscription.type}</span>
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className="capitalize">{subscription.subscription.status}</span>
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className="capitalize">{subscription.subscription.status}</span>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Usage</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Messages Sent:</span>{' '}
                  {subscription.usage.messagesSent}
                </p>
                <p>
                  <span className="font-medium">Messages Remaining:</span>{' '}
                  {subscription.usage.messagesRemaining === -1 ? 'Unlimited' : subscription.usage.messagesRemaining}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {false ? (
              <Button
                variant="primary"
                onClick={handleReactivateSubscription}
                className="flex items-center"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Reactivate Subscription
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirmation(true)}
                className="flex items-center"
              >
                <ClockIcon className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
            <Button variant="outline" className="flex items-center">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              View Invoices
            </Button>
            <Button variant="outline" className="flex items-center">
              <CreditCardIcon className="w-4 h-4 mr-2" />
              Update Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Confirmation */}
      {showCancelConfirmation && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900 mb-2">Cancel Subscription</h4>
                <p className="text-sm text-orange-800 mb-4">
                  Are you sure you want to cancel your subscription? Your access will continue until the end of your current billing period.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    onClick={handleCancelSubscription}
                  >
                    Yes, Cancel Subscription
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelConfirmation(false)}
                  >
                    Keep Subscription
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advisor Information */}
      {subscription.advisor && (
        <Card>
          <CardHeader>
            <CardTitle>Your Advisor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {subscription.advisor.avatar && (
                <img
                  src={subscription.advisor.avatar}
                  alt={subscription.advisor.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h4 className="font-medium text-gray-900">{subscription.advisor.name}</h4>
                <p className="text-sm text-gray-600">{subscription.advisor.specialty}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription.invoices.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No invoices available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscription.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: invoice.currency,
                        }).format(invoice.amount / 100)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(invoice.created)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                      {invoice.status}
                    </Badge>
                    {invoice.pdf_url && (
                      <Button variant="ghost" size="sm">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};