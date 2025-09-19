"use client";

import React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Badge } from '../../ui';
import type { TeamAffiliation } from '../types/marketplace';

export interface TeamBadgeProps {
  team: TeamAffiliation;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  team,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Badge
      variant="secondary"
      className={`inline-flex items-center space-x-1 ${sizeClasses[size]} ${className}`}
      title={`${team.roleName} in ${team.teamName}`}
    >
      {showIcon && <UsersIcon className={`${iconSize[size]}`} />}
      <span className="truncate max-w-[120px]">{team.teamName}</span>
      {team.isPrimary && (
        <span className="text-xs font-medium text-blue-600">(Primary)</span>
      )}
    </Badge>
  );
};

// Multiple team affiliations component
export interface TeamAffiliationsProps {
  teams: TeamAffiliation[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const TeamAffiliations: React.FC<TeamAffiliationsProps> = ({
  teams,
  maxDisplay = 2,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  if (!teams || teams.length === 0) {
    return null;
  }

  const displayTeams = teams.slice(0, maxDisplay);
  const remainingCount = teams.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayTeams.map((team) => (
        <TeamBadge
          key={team.teamId}
          team={team}
          size={size}
          showIcon={showIcon}
        />
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="secondary"
          className={`${size === 'sm' ? 'text-xs px-2 py-1' : size === 'md' ? 'text-sm px-3 py-1.5' : 'text-base px-4 py-2'}`}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};