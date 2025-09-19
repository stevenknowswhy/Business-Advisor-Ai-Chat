"use client";

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  UserCircleIcon,
  ClockIcon,
  FlagIcon,
  HandThumbUpIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Badge, Modal, TextArea } from '../../ui';
import { type Id } from '../../../../convex/_generated/dataModel';
import { type AdvisorReview } from '../types/marketplace';

export interface ReviewModerationProps {
  className?: string;
}

export const ReviewModeration: React.FC<ReviewModerationProps> = ({ className }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReview, setSelectedReview] = useState<AdvisorReview | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');

  // Mock data - will replace with real Convex queries
  const mockReviews: AdvisorReview[] = [
    {
      _id: 'review1' as Id<"advisorReviews">,
      advisorId: 'advisor1' as Id<"advisors">,
      userId: 'user1' as Id<"users">,
      rating: 5,
      title: 'Excellent Business Strategy Advice',
      content: 'Sarah provided incredible insights that helped us scale our business by 40% in just 6 months. Her data-driven approach and deep industry knowledge were exactly what we needed.',
      helpful: 12,
      verified: true,
      tags: ['strategic', 'data-driven', 'growth'],
      status: 'pending',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      _id: 'review2' as Id<"advisorReviews">,
      advisorId: 'advisor2' as Id<"advisors">,
      userId: 'user2' as Id<"users">,
      rating: 4,
      title: 'Great Technical Leadership',
      content: 'Marcus helped us restructure our engineering team and implement better processes. His experience in scaling teams was invaluable.',
      helpful: 8,
      verified: false,
      tags: ['leadership', 'team-building', 'process'],
      status: 'pending',
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    },
    {
      _id: 'review3' as Id<"advisorReviews">,
      advisorId: 'advisor1' as Id<"advisors">,
      userId: 'user3' as Id<"users">,
      rating: 2,
      title: 'Unprofessional Service',
      content: 'This review contains inappropriate content and should be flagged for moderation. It includes personal attacks and false claims.',
      helpful: 1,
      verified: false,
      tags: ['negative', 'unprofessional'],
      status: 'pending',
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    }
  ];

  const filteredReviews = mockReviews.filter(review => {
    if (filter === 'all') return true;
    return review.status === filter;
  });

  const stats = {
    pending: mockReviews.filter(r => r.status === 'pending').length,
    approved: mockReviews.filter(r => r.status === 'approved').length,
    rejected: mockReviews.filter(r => r.status === 'rejected').length,
    total: mockReviews.length
  };

  const handleApproveReview = (reviewId: Id<"advisorReviews">) => {
    console.log(`Approving review ${reviewId}`);
    setSelectedReview(null);
  };

  const handleRejectReview = (reviewId: Id<"advisorReviews">, reason: string) => {
    console.log(`Rejecting review ${reviewId} with reason: ${reason}`);
    setSelectedReview(null);
    setRejectionReason('');
  };

  const handleBulkAction = (action: 'approve' | 'reject') => {
    console.log(`Bulk ${action} for reviews:`, selectedReviews);
    setSelectedReviews([]);
    setShowBulkActions(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getReviewStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Review Moderation</h2>
          <p className="text-sm text-gray-600 mt-1">Review and moderate user-submitted advisor reviews</p>
        </div>
        <div className="flex items-center space-x-4">
          {stats.pending > 0 && (
            <Badge variant="warning" className="text-sm">
              {stats.pending} Pending Review{stats.pending !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'pending', label: 'Pending', count: stats.pending },
            { key: 'approved', label: 'Approved', count: stats.approved },
            { key: 'rejected', label: 'Rejected', count: stats.rejected },
            { key: 'all', label: 'All Reviews', count: stats.total }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bulk Actions */}
      {selectedReviews.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-blue-900 font-medium">
                {selectedReviews.length} review{selectedReviews.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('approve')}
              >
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Approve Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('reject')}
              >
                <XCircleIcon className="w-4 h-4 mr-1" />
                Reject Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReviews([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-600">
                {filter === 'pending'
                  ? 'Great! All reviews have been moderated.'
                  : `No reviews found with status "${filter}".`}
              </p>
            </div>
          </Card>
        ) : (
          filteredReviews.map(review => (
            <Card key={review._id} className="relative">
              {/* Review Header */}
              <div className="flex items-start justify-between p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-gray-900">
                        Anonymous User
                      </span>
                      {getReviewStatusBadge(review.status)}
                      {review.verified && (
                        <Badge variant="success" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                      {renderStars(review.rating)}
                      <span>•</span>
                      <span>Advisor ID: {String(review.advisorId).slice(0, 8)}...</span>
                      <span>•</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                    {review.title && (
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    )}
                    <p className="text-gray-700 leading-relaxed">{review.content}</p>

                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {review.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Actions */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedReviews.includes(String(review._id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReviews([...selectedReviews, String(review._id)]);
                      } else {
                        setSelectedReviews(selectedReviews.filter(id => id !== String(review._id)));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReview(review)}
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Review
                  </Button>
                </div>
              </div>

              {/* Review Footer */}
              <div className="border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <HandThumbUpIcon className="w-4 h-4 mr-1" />
                      {review.helpful || 0} helpful
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      Submitted {formatDate(review.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {review.status === 'pending' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveReview(review._id)}
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setSelectedReview(review)}
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <Modal
          isOpen={!!selectedReview}
          onClose={() => {
            setSelectedReview(null);
            setRejectionReason('');
          }}
          title="Review Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Review Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <UserCircleIcon className="w-12 h-12 text-gray-400" />
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium text-gray-900">Anonymous User</span>
                    {getReviewStatusBadge(selectedReview.status)}
                    {selectedReview.verified && (
                      <Badge variant="success">Verified</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    {renderStars(selectedReview.rating)}
                    <span>•</span>
                    <span>{formatDate(selectedReview.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Content */}
            <div className="space-y-4">
              {selectedReview.title && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Title</h3>
                  <p className="text-gray-700">{selectedReview.title}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Review</h3>
                <p className="text-gray-700 leading-relaxed">{selectedReview.content}</p>
              </div>

              {selectedReview.tags && selectedReview.tags.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReview.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Flags */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FlagIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">Content Analysis</h4>
                    <p className="text-sm text-yellow-800">
                      This review has been flagged for potential issues. Please review carefully before making a decision.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason (only for pending reviews) */}
              {selectedReview.status === 'pending' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Rejection Reason (if rejecting)</h3>
                  <TextArea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this review..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReview(null);
                  setRejectionReason('');
                }}
              >
                Close
              </Button>
              {selectedReview.status === 'pending' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => handleApproveReview(selectedReview._id)}
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Approve Review
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleRejectReview(selectedReview._id, rejectionReason)}
                    disabled={!rejectionReason.trim()}
                  >
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    Reject Review
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};