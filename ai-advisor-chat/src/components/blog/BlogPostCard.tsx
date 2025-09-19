'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CalendarIcon,
  UserIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  Card,
  Badge,
  Button
} from '../ui';
import { type BlogPost } from '../../types/blog';

interface BlogPostCardProps {
  post: BlogPost;
  onReadMore?: (postId: string) => void;
  onLike?: (postId: string) => void;
  showActions?: boolean;
}

export function BlogPostCard({
  post,
  onReadMore,
  onLike,
  showActions = true
}: BlogPostCardProps) {
  const formattedDate = post.publishedAt
    ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
    : 'Draft';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Featured Image */}
      {post.featuredImage && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* Category and Status */}
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="secondary"
            style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
          >
            {post.category.name}
          </Badge>
          {post.isFeatured && (
            <Badge variant="default" className="bg-yellow-500">
              Featured
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>{post.readTime} min read</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              <span>{post.views}</span>
            </div>
            <div className="flex items-center">
              <HeartIcon className="w-4 h-4 mr-1" />
              <span>{post.likes}</span>
            </div>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {post.author.avatar && (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-8 h-8 rounded-full mr-2"
              />
            )}
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-sm text-gray-600">{post.author.name}</span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2">
              {onLike && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(post.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <HeartIcon className="w-4 h-4" />
                </Button>
              )}
              {onReadMore && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onReadMore(post.id)}
                >
                  Read More
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}