"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { type Id } from '../../../convex/_generated/dataModel';
import { type AdvisorPricing } from '../../types/payment';

interface AdvisorSubscriptionCardProps {
  advisor?: {
    id: Id<"advisors">;
    name: string;
    avatar?: string;
    specialty: string;
    rating?: number;
    reviewCount?: number;
  };
  pricing: AdvisorPricing;
  onSubscribe: (subscriptionType: 'basic' | 'premium' | 'enterprise') => void;
  currentSubscription?: 'basic' | 'premium' | 'enterprise';
  showComparison?: boolean;
  className?: string;
}

export const AdvisorSubscriptionCard: React.FC<AdvisorSubscriptionCardProps> = ({
  advisor,
  pricing,
  onSubscribe,
  currentSubscription,
  showComparison = false,
  className = ''
}) => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const getSubscriptionBadge = (type: 'basic' | 'premium' | 'enterprise') => {
    if (type === currentSubscription) {
      return <Badge variant="default">Current Plan</Badge>;
    }
    return null;
  };

  const formatPrice = (price: number, currency: string, interval: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price) + '/' + interval;
  };

  const getYearlySavings = (monthlyPrice: number) => {
    const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% discount for yearly
    return Math.round(monthlyPrice * 12 - yearlyPrice);
  };

  const getFeatureIcon = (index: number) => {
    return <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />;
  };

  if (showComparison) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {(['basic', 'premium', 'enterprise'] as const).map((plan, index) => (
          <Card
            key={plan}
            className={`relative overflow-hidden transition-all hover:shadow-lg ${
              plan === 'premium'
                ? 'ring-2 ring-blue-500 border-blue-500 transform scale-105'
                : 'border-gray-200'
            }`}
          >
            {plan === 'premium' && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium">
                Most Popular
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl font-bold text-gray-900 capitalize">
                  {plan}
                </CardTitle>
                {getSubscriptionBadge(plan)}
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {billingInterval === 'year'
                    ? formatPrice(pricing[plan].price * 0.8 * 12, pricing[plan].currency, 'year')
                    : formatPrice(pricing[plan].price, pricing[plan].currency, billingInterval)
                  }
                </div>
                {billingInterval === 'year' && (
                  <div className="text-sm text-green-600 font-medium">
                    Save ${getYearlySavings(pricing[plan].price)}/year
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-2 mb-4">
                <button
                  onClick={() => setBillingInterval('month')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    billingInterval === 'month'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('year')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    billingInterval === 'year'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                {pricing[plan].features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {getFeatureIcon(index)}
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={plan === 'premium' ? 'primary' : 'secondary'}
                className="w-full mt-6"
                onClick={() => onSubscribe(plan)}
                disabled={plan === currentSubscription}
              >
                {plan === currentSubscription ? 'Current Plan' : (
                  <>
                    Subscribe
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl font-bold text-gray-900">
            Subscription Plans
          </CardTitle>
          <Badge variant="secondary">
            <SparklesIcon className="w-4 h-4 mr-1" />
            Premium Features
          </Badge>
        </div>

        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              billingInterval === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              billingInterval === 'year'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Yearly (Save 20%)
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['basic', 'premium', 'enterprise'] as const).map((plan) => (
            <div
              key={plan}
              className={`p-4 rounded-lg border-2 transition-all ${
                plan === 'premium'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 capitalize mb-2">
                  {plan}
                </h3>
                <div className="text-2xl font-bold text-gray-900">
                  {billingInterval === 'year'
                    ? formatPrice(pricing[plan].price * 0.8 * 12, pricing[plan].currency, 'year')
                    : formatPrice(pricing[plan].price, pricing[plan].currency, billingInterval)
                  }
                </div>
                {billingInterval === 'year' && (
                  <div className="text-xs text-green-600 font-medium">
                    Save ${getYearlySavings(pricing[plan].price)}/year
                  </div>
                )}
                {getSubscriptionBadge(plan)}
              </div>

              <div className="space-y-2 mb-4">
                {pricing[plan].features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-700 truncate">{feature}</span>
                  </div>
                ))}
                {pricing[plan].features.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{pricing[plan].features.length - 3} more features
                  </div>
                )}
              </div>

              <Button
                variant={plan === 'premium' ? 'primary' : 'secondary'}
                size="sm"
                className="w-full"
                onClick={() => onSubscribe(plan)}
                disabled={plan === currentSubscription}
              >
                {plan === currentSubscription ? 'Current' : 'Subscribe'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};