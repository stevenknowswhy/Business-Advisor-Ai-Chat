'use client';

import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge
} from '@/components/ui';
import { BlogList } from '@/components/blog/BlogList';
import { FeatureGate } from '@/components/rbac/FeatureGate';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const categories = [
    { id: 'ai-advisors', name: 'AI Advisors', color: '#3B82F6' },
    { id: 'technology', name: 'Technology', color: '#10B981' },
    { id: 'business', name: 'Business', color: '#F59E0B' },
    { id: 'careers', name: 'Careers', color: '#EF4444' },
    { id: 'education', name: 'Education', color: '#8B5CF6' }
  ];

  const popularTags = [
    'AI', 'Machine Learning', 'Career Advice', 'Business Strategy',
    'Technology Trends', 'Professional Development', 'Leadership'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Advisor Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Insights, trends, and expert advice on AI-powered career and business guidance
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                <Button
                  variant={selectedCategory === '' ? 'primary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory('')}
                >
                  All Posts
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'primary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Popular Tags */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Premium Content */}
            <FeatureGate feature="Premium blog content">
              <Card className="p-6 mt-6 bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Access exclusive articles and in-depth analysis with premium subscription
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  Upgrade to Premium
                </Button>
              </Card>
            </FeatureGate>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Posts */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Posts</h2>
              <BlogList showFeatured limit={3} />
            </div>

            {/* Recent Posts */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Posts</h2>
              <BlogList
                category={selectedCategory || undefined}
                tag={selectedTag || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}