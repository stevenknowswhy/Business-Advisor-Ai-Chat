"use client";

import React, { useState } from 'react';
import {
  StarIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  Card,
  Button,
  Badge,
  Modal,
  TextArea,
  type ModalProps
} from '../../ui';
import { type AdvisorReview } from '../types/marketplace';
import { type Id } from '../../../../convex/_generated/dataModel';

export interface ReviewListProps {
  reviews: AdvisorReview[];
  advisorId: Id<"advisors">;
  averageRating: number;
  reviewCount: number;
  onAddReview?: (review: Omit<AdvisorReview, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  className?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  advisorId,
  averageRating,
  reviewCount,
  onAddReview,
  className
}) => {
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
    tags: [] as string[]
  });

  // Sort reviews by creation date (newest first)
  const sortedReviews = [...reviews].sort((a, b) => b.createdAt - a.createdAt);

  // Render star rating
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!newReview.title.trim() || !newReview.content.trim()) {
      return;
    }

    if (onAddReview) {
      await onAddReview({
        advisorId,
        userId: '' as Id<"users">, // This would come from auth context
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
        helpful: 0,
        verified: false,
        tags: newReview.tags,
        status: 'pending'
      });

      // Reset form and close modal
      setNewReview({
        rating: 5,
        title: '',
        content: '',
        tags: []
      });
      setShowAddReviewModal(false);
    }
  };

  // Review summary stats
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviewCount > 0 ? (reviews.filter(r => r.rating === rating).length / reviewCount) * 100 : 0
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Review Summary */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </div>
            {renderStars(averageRating, 'lg')}
            <div className="text-sm text-gray-600 mt-1">
              {reviewCount} review{reviewCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2">
            <h4 className="font-medium text-gray-900 mb-3">Rating Distribution</h4>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Review Button */}
        {onAddReview && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAddReviewModal(true)}
            >
              Write a Review
            </Button>
          </div>
        )}
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">
                Be the first to share your experience with this advisor.
              </p>
            </div>
          </Card>
        ) : (
          sortedReviews.map((review) => (
            <Card key={review._id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        Anonymous User {/* In real app, this would be user name */}
                      </span>
                      {review.verified && (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" title="Verified review" />
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      {renderStars(review.rating, 'sm')}
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {review.status === 'pending' && (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>

              <div className="ml-13">
                {review.title && (
                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                )}
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {review.content}
                </p>

                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {review.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Helpful votes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <HandThumbUpIcon className="w-4 h-4 mr-1" />
                      Helpful ({review.helpful || 0})
                    </Button>
                  </div>

                  {/* Advisor response */}
                  {review.response && (
                    <div className="text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4 inline mr-1" />
                      Responded {formatDate(review.response.respondedAt)}
                    </div>
                  )}
                </div>

                {/* Advisor response */}
                {review.response && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-blue-900">Advisor Response</span>
                    </div>
                    <p className="text-blue-800 leading-relaxed">
                      {review.response.content}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Review Modal */}
      {showAddReviewModal && (
        <Modal
          isOpen={showAddReviewModal}
          onClose={() => setShowAddReviewModal(false)}
          title="Write a Review"
          size="lg"
        >
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setNewReview(prev => ({ ...prev, rating }))}
                    className="p-1"
                  >
                    <StarIcon
                      className={`w-6 h-6 ${
                        rating <= newReview.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Summarize your experience"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <TextArea
                value={newReview.content}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your experience working with this advisor..."
                rows={6}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {['responsive', 'knowledgeable', 'professional', 'helpful', 'creative'].map((tag) => (
                  <Button
                    key={tag}
                    variant={newReview.tags.includes(tag) ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setNewReview(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter(t => t !== tag)
                          : [...prev.tags, tag]
                      }));
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddReviewModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSubmitReview}
                disabled={!newReview.title.trim() || !newReview.content.trim()}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};