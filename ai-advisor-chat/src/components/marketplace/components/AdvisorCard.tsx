"use client";

import React from 'react';
import { StarIcon, CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Badge,
  CategoryBadge,
  FeaturedBadge
} from '../../ui';
import { TeamAffiliations } from './TeamBadge';
import { getAdvisorInitials, getAdvisorColor } from '~/lib/chat';
import type { MarketplaceAdvisor, AdvisorCardActions } from '../types/marketplace';

export interface AdvisorCardProps {
  advisor: MarketplaceAdvisor;
  isSelected?: boolean;
  actions: AdvisorCardActions;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showCategory?: boolean;
  showFeatured?: boolean;
  selectionLimitReached?: boolean;
}

export const AdvisorCard: React.FC<AdvisorCardProps> = ({
  advisor,
  isSelected = false,
  actions,
  className,
  variant = 'default',
  showCategory = true,
  showFeatured = true,
  selectionLimitReached = false,
}) => {
  const { onSelect, onUnselect, onViewProfile } = actions;
  
  const handleToggleSelection = () => {
    if (isSelected) {
      onUnselect(advisor);
    } else if (!selectionLimitReached) {
      onSelect(advisor);
    }
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProfile(advisor);
  };

  const name = (advisor as any).name ?? (advisor as any).persona?.name ?? '';
  const title = (advisor as any).title ?? (advisor as any).persona?.title ?? '';
  const oneLiner = (advisor as any).oneLiner ?? (advisor as any).persona?.oneLiner ?? '';
  const image = (advisor as any).image ?? (advisor as any).persona?.image;
const bio = (advisor as any).bio ?? (advisor as any).persona?.bio ?? '';
const experience = (advisor as any).experience ?? (advisor as any).persona?.experience ?? '';
const specialties: string[] = ((advisor as any).specialties ?? (advisor as any).persona?.specialties ?? []) as string[];
  const fallbackInitials = (name || '').trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const advisorInitials = fallbackInitials || getAdvisorInitials(name);
  const advisorColor = getAdvisorColor((advisor as any).id ?? (advisor as any)._id ?? '');

  const renderAvatar = () => {
    if (image) {
      return (
        <img
          src={image}
          alt={`${name} avatar`}
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }

    return (
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${advisorColor}`}
      >
        {advisorInitials}
      </div>
    );
  };

  const renderCompactCard = () => (
    <Card
      variant="outlined"
      hover
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      } ${className}`}
      onClick={handleToggleSelection}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {renderAvatar()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {name}
              </h3>
              {advisor.featured && showFeatured && <FeaturedBadge />}
            </div>
            <p className="text-xs text-gray-600 truncate">
              {title}
            </p>
            {showCategory && advisor.category && (
              <CategoryBadge category={advisor.category} size="sm" />
            )}
            {advisor.teamAffiliations && advisor.teamAffiliations.length > 0 && (
              <TeamAffiliations teams={advisor.teamAffiliations} size="sm" maxDisplay={1} />
            )}
          </div>
          <div className="flex-shrink-0">
            {isSelected ? (
              <CheckCircleIconSolid className="w-6 h-6 text-green-600" />
            ) : (
              <PlusCircleIcon className="w-6 h-6 text-gray-400 hover:text-blue-600" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDefaultCard = () => (
    <Card
      variant="outlined"
      hover
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      } ${className}`}
      onClick={handleToggleSelection}
    >
      <CardHeader>
        <div className="flex items-start space-x-3">
          {renderAvatar()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {name}
              </h3>
              {advisor.featured && showFeatured && <FeaturedBadge />}
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {title}
            </p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {oneLiner}
            </p>
          </div>
          <div className="flex-shrink-0">
            {isSelected ? (
              <CheckCircleIconSolid className="w-6 h-6 text-green-600" />
            ) : (
              <PlusCircleIcon className="w-6 h-6 text-gray-400 hover:text-blue-600" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {showCategory && advisor.category && (
            <CategoryBadge category={advisor.category} />
          )}
          {advisor.teamAffiliations && advisor.teamAffiliations.length > 0 && (
            <TeamAffiliations teams={advisor.teamAffiliations} size="sm" maxDisplay={2} />
          )}
          {specialties.slice(0, 2).map((specialty: string, index: number) => (
            <Badge key={index} variant="secondary" size="sm">
              {specialty}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewProfile}
            className="text-blue-600 hover:text-blue-700"
          >
            View Profile
          </Button>
          <Button
            variant={isSelected ? "secondary" : selectionLimitReached ? "ghost" : "primary"}
            size="sm"
            disabled={!isSelected && selectionLimitReached}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSelection();
            }}
            title={selectionLimitReached && !isSelected ? "Selection limit reached" : undefined}
          >
            {isSelected ? (
              <span className="inline-flex items-center"><CheckCircleIconSolid className="w-4 h-4 mr-1" aria-hidden="true" /> Selected</span>
            ) : selectionLimitReached ? (
              <span className="inline-flex items-center text-gray-400"><PlusCircleIcon className="w-4 h-4 mr-1" aria-hidden="true" /> Limit Reached</span>
            ) : (
              <span className="inline-flex items-center"><PlusCircleIcon className="w-4 h-4 mr-1" aria-hidden="true" /> Select</span>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  const renderDetailedCard = () => (
    <Card
      variant="outlined"
      hover
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      } ${className}`}
      onClick={handleToggleSelection}
    >
      <CardHeader>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {image ? (
              <img
                src={image}
                alt={`${name} avatar`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl ${advisorColor}`}
              >
                {advisorInitials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {name}
              </h3>
              {advisor.featured && showFeatured && <FeaturedBadge />}
            </div>
            <p className="text-base text-gray-600 mb-3">
              {title}
            </p>
            <p className="text-sm text-gray-700 mb-4">
              {oneLiner}
            </p>
            {bio && (
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {bio}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            {isSelected ? (
              <CheckCircleIconSolid className="w-8 h-8 text-green-600" />
            ) : (
              <PlusCircleIcon className="w-8 h-8 text-gray-400 hover:text-blue-600" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {showCategory && advisor.category && (
              <CategoryBadge category={advisor.category} />
            )}
            {advisor.teamAffiliations && advisor.teamAffiliations.length > 0 && (
              <TeamAffiliations teams={advisor.teamAffiliations} size="sm" maxDisplay={3} />
            )}
            {specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {specialty}
              </Badge>
            ))}
          </div>
          
          {experience && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Experience</h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {experience}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewProfile}
            className="text-blue-600 hover:text-blue-700"
          >
            View Full Profile
          </Button>
          <Button
            variant={isSelected ? "secondary" : "primary"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSelection();
            }}
          >
            {isSelected ? (
              <span className="inline-flex items-center"><CheckCircleIconSolid className="w-4 h-4 mr-1" aria-hidden="true" /> Selected</span>
            ) : (
              <span className="inline-flex items-center"><PlusCircleIcon className="w-4 h-4 mr-1" aria-hidden="true" /> Select Advisor</span>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  switch (variant) {
    case 'compact':
      return renderCompactCard();
    case 'detailed':
      return renderDetailedCard();
    default:
      return renderDefaultCard();
  }
};

// Skeleton component for loading states
export const AdvisorCardSkeleton: React.FC<{ variant?: 'default' | 'compact' | 'detailed'; className?: string }> = ({
  variant = 'default',
  className,
}) => {
  const height = variant === 'compact' ? 'h-20' : variant === 'detailed' ? 'h-80' : 'h-64';
  
  return (
    <Card variant="outlined" className={`animate-pulse ${height} ${className || ''}`}>
      <CardContent>
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            {variant !== 'compact' && (
              <>
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </>
            )}
          </div>
        </div>
        {variant !== 'compact' && (
          <div className="mt-4 flex space-x-2">
            <div className="h-6 bg-gray-200 rounded-full w-16" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
