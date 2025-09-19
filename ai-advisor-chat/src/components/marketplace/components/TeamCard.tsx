"use client";

import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '../../ui';
import {
  UserGroupIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon as CheckCircleIconOutline
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { TeamTemplate } from '~/hooks/useTeamManagement';

export interface TeamCardProps {
  team: TeamTemplate;
  isDeployed?: boolean;
  className?: string;
  onDeploy?: (team: TeamTemplate) => void;
  onViewDetails?: (team: TeamTemplate) => void;
  userPlan?: 'free' | 'regular' | 'pro';
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isDeployed = false,
  className,
  onDeploy,
  onViewDetails,
  userPlan = 'free',
}) => {
  const deploymentEligibility = team.deploymentEligibility?.[userPlan] ?? false;
  const canDeploy = deploymentEligibility && !isDeployed;

  const handleDeploy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeploy?.(team);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.(team);
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const getAdvisorCount = () => {
    return team.advisorRoles?.length || 0;
  };

  const getFeaturedCount = () => {
    return team.advisorRoles?.filter(role => !role.optional).length || 0;
  };

  return (
    <Card
      variant="default"
      hover
      className={`cursor-pointer transition-all duration-200 ${isDeployed ? 'ring-2 ring-green-500 border-green-500' : ''} ${className}`}
      onClick={handleViewDetails}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {team.name}
              </h3>
              {team.metadata.featured && (
                <Badge variant="warning" size="sm">
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {isDeployed && (
                <Badge variant="success" size="sm">
                  <CheckCircleIconSolid className="w-3 h-3 mr-1" />
                  Deployed
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {team.tagline}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="w-4 h-4" />
                <span>{getAdvisorCount()} advisors</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>{team.onboarding.estimatedTime}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-700 line-clamp-3">
            {team.description}
          </p>

          {/* Category and Target Audience */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" size="sm">
              {team.category}
            </Badge>
            {team.targetAudience.slice(0, 2).map((audience, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {audience}
              </Badge>
            ))}
          </div>

          {/* Key Roles */}
          <div>
            <h4 className="text-xs font-medium text-gray-900 mb-2">Key Roles:</h4>
            <div className="flex flex-wrap gap-1">
              {team.advisorRoles.slice(0, 3).map((role, index) => (
                <Badge key={index} variant="secondary" size="sm" className="text-xs">
                  {role.roleName}
                  {!role.optional && <span className="text-red-500 ml-1">*</span>}
                </Badge>
              ))}
              {team.advisorRoles.length > 3 && (
                <Badge variant="secondary" size="sm" className="text-xs">
                  +{team.advisorRoles.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {formatPrice(team.pricing.deploymentFee[userPlan])} deployment
              </span>
              <span className="text-xs text-gray-500">
                + {formatPrice(team.pricing.monthlyFee[userPlan])}/month
              </span>
            </div>
            {!deploymentEligibility && userPlan !== 'pro' && (
              <Badge variant="warning" size="sm">
                Pro Plan Required
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            className="text-blue-600 hover:text-blue-700"
          >
            View Details
          </Button>

          {canDeploy ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeploy}
              className="flex items-center space-x-1"
            >
              <UserGroupIcon className="w-4 h-4" />
              <span>Deploy Team</span>
            </Button>
          ) : isDeployed ? (
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="flex items-center space-x-1"
            >
              <CheckCircleIconOutline className="w-4 h-4" />
              <span>Deployed</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="text-gray-400"
            >
              Not Available
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// Skeleton component for loading states
export const TeamCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Card variant="default" className={`animate-pulse ${className}`}>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 rounded-full w-16" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between">
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </CardFooter>
    </Card>
  );
};