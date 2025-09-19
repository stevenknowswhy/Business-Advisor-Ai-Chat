"use client";

import React, { useEffect, useState } from 'react';
import { type Id } from '../../../../convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Modal } from '../../ui';
import { AdvisorProfile } from './AdvisorProfile';
import { type MarketplaceAdvisor, adaptConvexAdvisorToMarketplaceAdvisor } from '../types/marketplace';

export interface AdvisorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisorId: Id<"advisors">;
  onSelect?: (advisor: MarketplaceAdvisor) => void;
  onUnselect?: (advisor: MarketplaceAdvisor) => void;
  isSelected?: boolean;
}

export const AdvisorProfileModal: React.FC<AdvisorProfileModalProps> = ({
  isOpen,
  onClose,
  advisorId,
  onSelect,
  onUnselect,
  isSelected = false
}) => {
  // Fetch advisor details
  const advisor = useQuery(api.advisors.getAdvisorById, { advisorId });

  // Fetch advisor reviews
  const reviews = useQuery(api.marketplace.getAdvisorReviews, { advisorId });

  // Fetch advisor portfolio
  const portfolioItems = useQuery(api.marketplace.getAdvisorPortfolio, { advisorId });

  // Fetch advisor availability
  const availability = useQuery(api.marketplace.getAdvisorAvailability, { advisorId });

  // Loading state
  const [loading, setLoading] = useState(false);
  const [selectedAdvisors, setSelectedAdvisors] = useState<MarketplaceAdvisor[]>([]);

  // Mock selected advisors - in real app, this would come from a hook
  useEffect(() => {
    // This would typically come from a useSelectedAdvisors hook
    if (isSelected && advisor) {
      const marketplaceAdvisor = adaptConvexAdvisorToMarketplaceAdvisor(advisor);
      setSelectedAdvisors([marketplaceAdvisor]);
    } else {
      setSelectedAdvisors([]);
    }
  }, [isSelected, advisor]);

  if (!advisor) {
    return null;
  }

  // Convert Convex advisor to MarketplaceAdvisor
  const marketplaceAdvisor = adaptConvexAdvisorToMarketplaceAdvisor(advisor);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton={false}
      className="p-0"
    >
      <AdvisorProfile
        advisor={marketplaceAdvisor}
        reviews={reviews || []}
        portfolioItems={portfolioItems || []}
        availability={availability || undefined}
        onClose={onClose}
        onSelect={onSelect}
        onUnselect={onUnselect}
        isSelected={selectedAdvisors.some(a => a._id === advisor._id)}
        loading={loading}
      />
    </Modal>
  );
};