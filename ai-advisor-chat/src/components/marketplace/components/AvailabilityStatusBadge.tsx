"use client";

import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../../ui';
import { type AvailabilityStatus } from '../types/marketplace';

export interface AvailabilityStatusBadgeProps {
  status: AvailabilityStatus;
  showIcon?: boolean;
  className?: string;
}

export const AvailabilityStatusBadge: React.FC<AvailabilityStatusBadgeProps> = ({
  status,
  showIcon = true,
  className = ''
}) => {
  const getStatusConfig = (status: AvailabilityStatus) => {
    switch (status) {
      case 'available':
        return {
          icon: CheckCircleIcon,
          label: 'Available',
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      case 'busy':
        return {
          icon: ClockIcon,
          label: 'Busy',
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        };
      case 'offline':
        return {
          icon: XCircleIcon,
          label: 'Offline',
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800'
        };
      case 'away':
        return {
          icon: ClockIcon,
          label: 'Away',
          color: 'orange',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800'
        };
      default:
        return {
          icon: QuestionMarkCircleIcon,
          label: 'Unknown',
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = showIcon ? config.icon : null;

  return (
    <Badge
      variant="secondary"
      className={`${config.bgColor} ${config.textColor} ${className}`}
    >
      {Icon && <Icon className={`w-4 h-4 mr-1`} />}
      {config.label}
    </Badge>
  );
};