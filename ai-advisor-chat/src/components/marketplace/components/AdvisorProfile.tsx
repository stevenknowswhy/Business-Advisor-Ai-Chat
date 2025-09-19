"use client";

import React, { useState, useMemo } from 'react';
import {
  StarIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  LightBulbIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import {
  Badge,
  Button,
  Card,
  Modal,
  Tabs
} from '../../ui';
import { PaymentModal } from '../../payments/PaymentModal';
import { AdvisorSubscriptionCard } from '../../advisors/AdvisorSubscriptionCard';
import { PermissionGuard, FeatureGate } from '../../rbac';
import {
  type MarketplaceAdvisor,
  type AdvisorReview,
  type PortfolioItem,
  type AvailabilityStatus,
  type Availability,
  type AdvisorCategory
} from '../types/marketplace';
import { ADVISOR_CATEGORIES } from '../types/marketplace';
import { ReviewList } from './ReviewList';
import { PortfolioGallery } from './PortfolioGallery';
import { AvailabilityStatusBadge } from './AvailabilityStatusBadge';

export interface AdvisorProfileProps {
  advisor: MarketplaceAdvisor;
  reviews?: AdvisorReview[];
  portfolioItems?: PortfolioItem[];
  availability?: Availability;
  onClose?: () => void;
  onSelect?: (advisor: MarketplaceAdvisor) => void;
  onUnselect?: (advisor: MarketplaceAdvisor) => void;
  isSelected?: boolean;
  loading?: boolean;
  currentSubscription?: 'basic' | 'premium' | 'enterprise';
  stripePublishableKey?: string;
}

export const AdvisorProfile: React.FC<AdvisorProfileProps> = ({
  advisor,
  reviews = [],
  portfolioItems = [],
  availability,
  onClose,
  onSelect,
  onUnselect,
  isSelected = false,
  loading = false,
  currentSubscription,
  stripePublishableKey = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Advisor pricing data
  const advisorPricing = {
    basic: {
      price: 29,
      currency: 'USD',
      interval: 'month' as const,
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
      interval: 'month' as const,
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
      interval: 'month' as const,
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

  const handleTabChange = (tab: string | { id: string; label: string }) => {
    setActiveTab(typeof tab === 'string' ? tab : tab.id);
  };

  const handleSubscribe = (subscriptionType: 'basic' | 'premium' | 'enterprise') => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (subscription: any) => {
    console.log('Payment successful:', subscription);
    setShowPaymentModal(false);
    // You could update user state or refresh subscription info here
  };

  // Calculate average rating and review count
  const { averageRating, reviewCount } = useMemo(() => {
    if (reviews.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      averageRating: totalRating / reviews.length,
      reviewCount: reviews.length
    };
  }, [reviews]);

  // Extract experience years from experience string
  const experienceYears = useMemo(() => {
    const experienceStr = advisor.experience || '';
    const experienceMatch = experienceStr.match(/(\d+)/);
    return experienceMatch ? parseInt(experienceMatch[1]!) : 0;
  }, [advisor.experience]);

  // Get category info
  const categoryInfo = useMemo(() => {
    return ADVISOR_CATEGORIES[advisor.category as keyof typeof ADVISOR_CATEGORIES] ||
           ADVISOR_CATEGORIES.general;
  }, [advisor.category]);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: `Reviews (${reviewCount})` },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'availability', label: 'Availability' },
    { id: 'pricing', label: 'Pricing & Plans' }
  ];

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'reviews':
        return (
          <ReviewList
            reviews={reviews}
            advisorId={advisor._id}
            averageRating={averageRating}
            reviewCount={reviewCount}
          />
        );

      case 'portfolio':
        return (
          <PortfolioGallery
            items={portfolioItems}
            advisorName={advisor.name}
          />
        );

      case 'availability':
        return (
          <div className="space-y-6">
            {availability && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold mb-4">Current Status</h3>
                  <div className="space-y-3">
                    <AvailabilityStatusBadge status={availability.status} />
                    <p className="text-sm text-gray-600">
                      {availability.statusMessage || 'No status message'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(availability.lastStatusUpdate).toLocaleDateString()}
                    </p>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold mb-4">Response Time</h3>
                  {availability.responseTime && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average:</span>
                        <span className="text-sm font-medium">
                          {availability.responseTime.average} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Range:</span>
                        <span className="text-sm font-medium">
                          {availability.responseTime.min} - {availability.responseTime.max} min
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {availability?.schedule && (
              <Card>
                <h3 className="text-lg font-semibold mb-4">Schedule</h3>
                <div className="space-y-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                    const daySchedule = availability.schedule?.find(s => s.dayOfWeek === index);
                    return (
                      <div key={day} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{day}</span>
                        {daySchedule ? (
                          <div className="flex items-center space-x-2">
                            {daySchedule.available ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm">
                              {daySchedule.startTime} - {daySchedule.endTime}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not available</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        );

      case 'pricing':
        return (
          <PermissionGuard permission="view_payments">
            <div className="space-y-6">
              <AdvisorSubscriptionCard
                advisor={{
                  id: advisor._id,
                  name: advisor.name,
                  avatar: advisor.image,
                  specialty: advisor.title,
                  rating: averageRating,
                  reviewCount: reviewCount
                }}
                pricing={advisorPricing}
                onSubscribe={handleSubscribe}
                currentSubscription={currentSubscription}
                showComparison={true}
              />
              {currentSubscription && (
                <Card>
                  <h3 className="text-lg font-semibold mb-4">Current Subscription</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{currentSubscription} Plan</p>
                      <p className="text-sm text-gray-600">Active subscription</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </Card>
              )}
            </div>
          </PermissionGuard>
        );

      default: // overview
        return (
          <div className="space-y-6">
            {/* Bio */}
            {advisor.detailedBackground && (
              <Card>
                <h3 className="text-lg font-semibold mb-3">Background</h3>
                <p className="text-gray-700 leading-relaxed">
                  {advisor.detailedBackground}
                </p>
              </Card>
            )}

            {/* Expertise */}
            {advisor.specialties && advisor.specialties.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <LightBulbIcon className="w-5 h-5 mr-2" />
                  Areas of Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {advisor.specialties.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Specialties */}
            {advisor.specialties && advisor.specialties.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <BriefcaseIcon className="w-5 h-5 mr-2" />
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {advisor.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

  
            {/* Communication Style */}
            {advisor.communicationStyle && (
              <Card>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <ChatBubbleLeftIcon className="w-5 h-5 mr-2" />
                  Communication Style
                </h3>
                <p className="text-gray-700">{advisor.communicationStyle}</p>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Advisor Image */}
            <div className="flex-shrink-0">
              <img
                src={advisor.image || '/placeholder-avatar.png'}
                alt={advisor.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            </div>

            {/* Advisor Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {advisor.name}
                  </h1>
                  <p className="text-lg text-gray-600 mb-2">
                    {advisor.title}
                  </p>
                  <div className="flex items-center space-x-4 mb-3">
                    {renderStars(averageRating)}
                    <span className="text-sm text-gray-600">
                      ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </span>
                    {experienceYears > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {experienceYears}+ years experience
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant="secondary"
                      className={advisor.featured ? 'bg-yellow-100 text-yellow-800' : ''}
                    >
                      {advisor.featured ? 'Featured' : categoryInfo.label}
                    </Badge>
                    {availability && (
                      <AvailabilityStatusBadge status={availability.status} />
                    )}
                  </div>
                </div>

                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="ml-4"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Location */}
              {advisor.location && (
                <div className="flex items-center text-sm text-gray-600 mt-2">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {[
                    advisor.location.city,
                    advisor.location.region
                  ].filter(Boolean).join(', ')}
                </div>
              )}

              {/* One-liner */}
              {advisor.oneLiner && (
                <p className="text-gray-700 mt-3 italic">
                  "{advisor.oneLiner}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex space-x-3">
            <PermissionGuard permission="select_advisors">
              {isSelected ? (
                <Button
                  variant="secondary"
                  onClick={() => onUnselect?.(advisor)}
                  disabled={loading}
                >
                  Remove from My Advisors
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => onSelect?.(advisor)}
                  disabled={loading}
                >
                  Add to My Advisors
                </Button>
              )}
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          advisorId={advisor._id}
          advisorName={advisor.name}
          stripePublishableKey={stripePublishableKey}
        />
      )}
    </div>
  );
};