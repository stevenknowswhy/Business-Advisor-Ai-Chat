'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge
} from '../ui';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { BlogPostCard } from './BlogPostCard';
import { type BlogPost, type BlogCategory } from '../../types/blog';

interface BlogListProps {
  category?: string;
  tag?: string;
  author?: string;
  showFeatured?: boolean;
  limit?: number;
}

export function BlogList({
  category,
  tag,
  author,
  showFeatured = false,
  limit
}: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [category, tag, author, showFeatured, limit]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (tag) params.append('tag', tag);
      if (author) params.append('author', author);
      if (showFeatured) params.append('featured', 'true');
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/blog/posts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.error?.message || 'Failed to load posts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleReadMore = (postId: string) => {
    window.location.href = `/blog/${postId}`;
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/blog/posts/${postId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        // Update the post's like count
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes + 1 }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchPosts} variant="primary">
          Try Again
        </Button>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No posts found
        </h3>
        <p className="text-gray-600">
          {category || tag || author
            ? 'No posts match your filters.'
            : 'Check back soon for new content!'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <BlogPostCard
          key={post.id}
          post={post}
          onReadMore={handleReadMore}
          onLike={handleLike}
        />
      ))}
    </div>
  );
}