import React from 'react';

export const TeamCreatorWithDesignSystem: React.FC<{ onAdvisorsCreated?: (ids: string[]) => void }>
  = () => React.createElement('div', { 'data-testid': 'team-creator-mock' });

export default {} as any;

