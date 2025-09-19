"use client";

import React, { useState } from 'react';
import {
  PhotoIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  TrophyIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import {
  Card,
  Badge,
  Button,
  Modal,
  type ModalProps
} from '../../ui';
import { type PortfolioItem } from '../types/marketplace';

export interface PortfolioGalleryProps {
  items: PortfolioItem[];
  advisorName: string;
  className?: string;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  items,
  advisorName,
  className
}) => {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [filter, setFilter] = useState<'all' | PortfolioItem['type']>('all');

  // Filter items by type
  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.type === filter);

  // Sort items by order and featured status
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.order || 0) - (b.order || 0);
  });

  // Get type icon
  const getTypeIcon = (type: PortfolioItem['type']) => {
    switch (type) {
      case 'case_study':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'project':
        return <BriefcaseIcon className="w-5 h-5" />;
      case 'achievement':
        return <TrophyIcon className="w-5 h-5" />;
      case 'publication':
        return <AcademicCapIcon className="w-5 h-5" />;
      default:
        return <PhotoIcon className="w-5 h-5" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: PortfolioItem['type']) => {
    switch (type) {
      case 'case_study':
        return 'Case Study';
      case 'project':
        return 'Project';
      case 'achievement':
        return 'Achievement';
      case 'publication':
        return 'Publication';
      default:
        return 'Other';
    }
  };

  // Get type color
  const getTypeColor = (type: PortfolioItem['type']) => {
    switch (type) {
      case 'case_study':
        return 'blue';
      case 'project':
        return 'green';
      case 'achievement':
        return 'yellow';
      case 'publication':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Type counts for filter
  const typeCounts = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<PortfolioItem['type'], number>);

  if (items.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center py-12">
          <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio items yet</h3>
          <p className="text-gray-600">
            {advisorName} hasn't added any portfolio items yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Portfolio ({items.length} item{items.length !== 1 ? 's' : ''})
        </h3>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </Button>
        {Object.entries(typeCounts).map(([type, count]) => (
          <Button
            key={type}
            variant={filter === type ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(type as PortfolioItem['type'])}
            className="flex items-center space-x-1"
          >
            {getTypeIcon(type as PortfolioItem['type'])}
            <span>{getTypeLabel(type as PortfolioItem['type'])} ({count})</span>
          </Button>
        ))}
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map((item) => (
          <Card
            key={item._id}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => setSelectedItem(item)}
          >
            {/* Image */}
            {item.images && item.images.length > 0 && (
              <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={`bg-${getTypeColor(item.type)}-100 text-${getTypeColor(item.type)}-800`}
                    >
                      {getTypeLabel(item.type)}
                    </Badge>
                    {item.featured && (
                      <Badge variant="warning">Featured</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {item.description}
              </p>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{item.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {formatDate(item.createdAt)}
                </div>
                {item.links && item.links.length > 0 && (
                  <div className="flex items-center">
                    <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
                    {item.links.length} link{item.links.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          size="lg"
        >
          <div className="space-y-6">
            {/* Images */}
            {selectedItem.images && selectedItem.images.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedItem.images.map((image, index) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${selectedItem.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <div className="prose prose-sm max-w-none">
                {selectedItem.content ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedItem.content }} />
                ) : (
                  <p className="text-gray-600">{selectedItem.description}</p>
                )}
              </div>
            </div>

            {/* Links */}
            {selectedItem.links && selectedItem.links.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Links</h4>
                <div className="space-y-2">
                  {selectedItem.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium">{getTypeLabel(selectedItem.type)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="font-medium capitalize">{selectedItem.status}</div>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">{formatDate(selectedItem.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <div className="font-medium">{formatDate(selectedItem.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};