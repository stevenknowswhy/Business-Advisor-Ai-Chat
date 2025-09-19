"use client";

import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  UserIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Badge, Modal } from '../../ui';
import { type Id } from '../../../../convex/_generated/dataModel';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { adaptConvexAdvisorToMarketplaceAdvisor, type MarketplaceAdvisor } from '../types/marketplace';

export interface AdvisorManagementProps {
  className?: string;
  onEditAdvisor?: (advisorId: Id<"advisors">) => void;
  onViewAdvisor?: (advisorId: Id<"advisors">) => void;
}

export const AdvisorManagement: React.FC<AdvisorManagementProps> = ({
  className,
  onEditAdvisor,
  onViewAdvisor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<Id<"advisors"> | null>(null);
  const [selectedAdvisors, setSelectedAdvisors] = useState<Id<"advisors">[]>([]);

  // Mock data - will replace with real Convex queries
  const mockAdvisors: MarketplaceAdvisor[] = [
    {
      id: 'advisor1',
      name: 'Sarah Chen',
      title: 'Business Strategy Advisor',
      image: '/placeholder-avatar.png',
      oneLiner: 'Helping businesses scale with data-driven strategies',
      archetype: 'strategist',
      bio: '10+ years experience in business consulting',
      detailedBackground: 'Former McKinsey consultant specializing in scaling tech startups',
      experience: '10+ years',
      specialties: ['Strategy', 'Operations', 'Growth'],
      personalInterests: ['Technology', 'Reading', 'Hiking'],
      communicationStyle: 'Direct and data-focused',
      location: { city: 'San Francisco', region: 'CA' },
      adviceDelivery: { mode: 'analytical', formality: 'professional', signOff: 'Best regards' },
      mission: 'To help businesses reach their full potential',
      tags: ['business', 'strategy', 'growth'],
      _id: 'advisor1' as Id<"advisors">,
      isPublic: true,
      featured: true,
      category: 'business',
      ownerId: undefined,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'advisor2',
      name: 'Marcus Rodriguez',
      title: 'Technical Leadership Expert',
      image: '/placeholder-avatar.png',
      oneLiner: 'Building high-performing engineering teams',
      archetype: 'technical',
      bio: 'Former VP of Engineering at multiple tech companies',
      detailedBackground: 'Led engineering teams at Google, Meta, and several startups',
      experience: '15+ years',
      specialties: ['Engineering Leadership', 'System Architecture', 'Team Building'],
      personalInterests: ['Open Source', 'Photography', 'Running'],
      communicationStyle: 'Collaborative and mentorship-focused',
      location: { city: 'Austin', region: 'TX' },
      adviceDelivery: { mode: 'mentoring', formality: 'collaborative', signOff: 'Let\'s build' },
      mission: 'Empowering engineers to become great leaders',
      tags: ['technical', 'leadership', 'engineering'],
      _id: 'advisor2' as Id<"advisors">,
      isPublic: true,
      featured: false,
      category: 'technical',
      ownerId: undefined,
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    }
  ];

  // Filter advisors based on search and filters
  const filteredAdvisors = mockAdvisors.filter(advisor => {
    const matchesSearch = searchQuery === '' ||
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advisor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advisor.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && advisor.isPublic) ||
      (statusFilter === 'inactive' && !advisor.isPublic);

    const matchesCategory = categoryFilter === 'all' || advisor.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'business', label: 'Business' },
    { value: 'technical', label: 'Technical' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'product', label: 'Product' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const handleStatusToggle = (advisorId: Id<"advisors">, currentStatus: boolean) => {
    // Mock implementation - will replace with real mutation
    console.log(`Toggling advisor ${advisorId} status from ${currentStatus} to ${!currentStatus}`);
  };

  const handleFeaturedToggle = (advisorId: Id<"advisors">, currentFeatured: boolean) => {
    // Mock implementation - will replace with real mutation
    console.log(`Toggling advisor ${advisorId} featured from ${currentFeatured} to ${!currentFeatured}`);
  };

  const handleDeleteAdvisor = (advisorId: Id<"advisors">) => {
    // Mock implementation - will replace with real mutation
    console.log(`Deleting advisor ${advisorId}`);
    setShowDeleteModal(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advisor Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage marketplace advisors, their profiles, and settings</p>
        </div>
        <Button onClick={() => onEditAdvisor?.('' as Id<"advisors">)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New Advisor
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search advisors by name, title, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAdvisors.length} of {mockAdvisors.length} advisors
        </p>
        {selectedAdvisors.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{selectedAdvisors.length} selected</span>
            <Button variant="outline" size="sm">Bulk Actions</Button>
          </div>
        )}
      </div>

      {/* Advisors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAdvisors.map(advisor => (
          <Card key={advisor._id} className="relative">
            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10">
              {advisor.featured && (
                <Badge variant="warning" className="mb-1">Featured</Badge>
              )}
              <Badge variant={advisor.isPublic ? "success" : "secondary"}>
                {advisor.isPublic ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Advisor Info */}
            <div className="flex items-start space-x-4 p-6">
              <div className="flex-shrink-0">
                <img
                  src={advisor.image || '/placeholder-avatar.png'}
                  alt={advisor.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {advisor.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {advisor.title}
                </p>
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    {advisor.location.city}, {advisor.location.region}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {formatDate(advisor.updatedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats and Tags */}
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-1 mb-3">
                {advisor.specialties?.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {advisor.specialties && advisor.specialties.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{advisor.specialties.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewAdvisor?.(advisor._id)}
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditAdvisor?.(advisor._id)}
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeaturedToggle(advisor._id, advisor.featured)}
                    title={advisor.featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <StarIcon className={`w-4 h-4 ${advisor.featured ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusToggle(advisor._id, advisor.isPublic)}
                    title={advisor.isPublic ? 'Deactivate advisor' : 'Activate advisor'}
                  >
                    {advisor.isPublic ? (
                      <XCircleIcon className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteModal(advisor._id)}
                    title="Delete advisor"
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAdvisors.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No advisors found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters to find advisors.'
                : 'Get started by adding your first advisor to the marketplace.'}
            </p>
            {(!searchQuery && statusFilter === 'all' && categoryFilter === 'all') && (
              <Button onClick={() => onEditAdvisor?.('' as Id<"advisors">)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add First Advisor
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={!!showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          title="Delete Advisor"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this advisor? This action cannot be undone and will remove:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Advisor profile and all associated data</li>
              <li>All reviews and ratings</li>
              <li>Portfolio items and work samples</li>
              <li>Availability schedules</li>
              <li>User selections and team memberships</li>
            </ul>
            <p className="text-sm text-red-600 font-medium">This action is permanent and cannot be undone.</p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteAdvisor(showDeleteModal)}
              >
                Delete Advisor
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};