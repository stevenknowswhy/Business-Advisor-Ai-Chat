"use client";

import * as React from "react";
import { Button, FilterDropdown } from "~/components/ui";
import {
  TeamCreator as CoreTeamCreator,
  type TeamCreatorProps as CoreTeamCreatorProps,
  type DSButtonProps,
  type DSFilterDropdownProps,
} from "~/features/advisors/components/TeamCreator";

export interface TeamCreatorWithDesignSystemProps
  extends Omit<CoreTeamCreatorProps, "ButtonComponent" | "SelectComponent"> {}

export const TeamCreatorWithDesignSystem: React.FC<TeamCreatorWithDesignSystemProps> = (props) => {
  // Wrap DS components to satisfy the structural props used by the core component
  const UIButton: React.ComponentType<DSButtonProps> = ({ children, ...btnProps }) => {
    // Transform props to match expected types
    const { variant, size, ...buttonProps } = btnProps;
    const safeVariant = variant === 'ghost' ? 'ghost' :
                       variant === 'outline' ? 'outline' :
                       variant === 'danger' ? 'danger' :
                       variant === 'secondary' ? 'secondary' : 'primary';

    const safeSize = size === 'lg' ? 'lg' :
                    size === 'sm' ? 'sm' : 'md';

    return (
      <Button
        {...buttonProps}
        variant={safeVariant}
        size={safeSize}
      >
        {children}
      </Button>
    );
  };

  const UISelect: React.ComponentType<DSFilterDropdownProps> = (selectProps) => (
    <FilterDropdown {...selectProps} />
  );

  return (
    <CoreTeamCreator
      {...props}
      ButtonComponent={UIButton}
      SelectComponent={UISelect}
    />
  );
};

export default TeamCreatorWithDesignSystem;

