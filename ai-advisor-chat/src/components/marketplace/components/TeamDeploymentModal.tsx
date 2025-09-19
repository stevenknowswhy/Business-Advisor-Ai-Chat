"use client";

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Badge,
  Card,
  CardContent,
  LoadingSpinner,
} from '../../ui';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import type { TeamTemplate } from '~/hooks/useTeamManagement';
import { useTeamManagement } from '~/hooks/useTeamManagement';

export interface TeamDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamTemplate;
  userPlan?: 'free' | 'regular' | 'pro';
  onDeploymentComplete?: (deploymentId: string) => void;
}

export const TeamDeploymentModal: React.FC<TeamDeploymentModalProps> = ({
  isOpen,
  onClose,
  team,
  userPlan = 'free',
  onDeploymentComplete,
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  const { deployTeam } = useTeamManagement();

  const deploymentEligibility = team.deploymentEligibility?.[userPlan] ?? false;

  // Customization state
  const [customizations, setCustomizations] = useState({
    removedAdvisors: [] as string[],
    renamedRoles: {} as Record<string, string>,
    settings: {
      autoCreateConversation: true,
      enableCrossAdvisorCommunication: true,
    }
  });

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const handleDeployTeam = async () => {
    if (!deploymentEligibility) {
      setDeploymentError('This team is not available for your current plan.');
      return;
    }

    setIsDeploying(true);
    setDeploymentError(null);

    try {
      const result = await deployTeam({
        teamId: team.teamId,
        customizations: {
          removedAdvisors: customizations.removedAdvisors.length > 0 ? customizations.removedAdvisors : undefined,
          renamedRoles: Object.keys(customizations.renamedRoles).length > 0 ? customizations.renamedRoles : undefined,
        },
        settings: customizations.settings,
      });

      setDeploymentResult(result);
      onDeploymentComplete?.(result.deploymentId);

      // Auto-close after successful deployment
      setTimeout(() => {
        onClose();
        // Reset state
        setDeploymentResult(null);
        setCustomizations({
          removedAdvisors: [],
          renamedRoles: {},
          settings: {
            autoCreateConversation: true,
            enableCrossAdvisorCommunication: true,
          }
        });
      }, 3000);

    } catch (error: any) {
      setDeploymentError(error.message || 'Failed to deploy team');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRemoveAdvisor = (roleId: string) => {
    if (!team.advisorRoles.find(role => role.roleId === roleId)?.optional) {
      return; // Cannot remove required advisors
    }
    setCustomizations(prev => ({
      ...prev,
      removedAdvisors: [...prev.removedAdvisors, roleId]
    }));
  };

  const handleRestoreAdvisor = (roleId: string) => {
    setCustomizations(prev => ({
      ...prev,
      removedAdvisors: prev.removedAdvisors.filter(id => id !== roleId)
    }));
  };

  const handleRenameRole = (roleId: string, newName: string) => {
    setCustomizations(prev => ({
      ...prev,
      renamedRoles: {
        ...prev.renamedRoles,
        [roleId]: newName
      }
    }));
  };

  const getDeploymentCost = () => {
    const deploymentFee = team.pricing.deploymentFee[userPlan];
    const monthlyFee = team.pricing.monthlyFee[userPlan];
    return { deploymentFee, monthlyFee };
  };

  const getActiveAdvisors = () => {
    return team.advisorRoles.filter(role => !customizations.removedAdvisors.includes(role.roleId));
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Deploy ${team.name}`}
    >
      <div className="space-y-6">
        {/* Team Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{team.tagline}</p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <UserGroupIcon className="w-4 h-4 text-gray-500" />
              <span>{getActiveAdvisors().length} advisors</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span>{team.onboarding.estimatedTime} setup</span>
            </div>
            <div className="flex items-center space-x-1">
              <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
              <span>{formatPrice(getDeploymentCost().deploymentFee)} + {formatPrice(getDeploymentCost().monthlyFee)}/month</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {deploymentError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start space-x-3">
            <InformationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-red-800">{deploymentError}</span>
          </div>
        )}

        {/* Success Display */}
        {deploymentResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-green-800">Team deployed successfully!</span>
              <p className="text-sm text-green-700 mt-1">
                Your {team.name} team is now ready. You can start chatting with them immediately.
              </p>
            </div>
          </div>
        )}

        {/* Customization Section */}
        {!deploymentResult && (
          <>
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium text-gray-900">Customization Options</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomization(!showCustomization)}
              >
                {showCustomization ? 'Hide' : 'Show'} Options
              </Button>
            </div>

            {showCustomization && (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                {/* Advisor Customization */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Team Members</h5>
                  <div className="space-y-2">
                    {team.advisorRoles.map((role) => {
                      const isRemoved = customizations.removedAdvisors.includes(role.roleId);
                      const customName = customizations.renamedRoles[role.roleId];

                      if (isRemoved) return null;

                      return (
                        <div key={role.roleId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {customName || role.roleName}
                              </div>
                              <div className="text-xs text-gray-500">{role.roleDescription}</div>
                            </div>
                            {role.optional && (
                              <Badge variant="secondary" size="sm" className="text-xs">Optional</Badge>
                            )}
                          </div>
                          {role.optional && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAdvisor(role.roleId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Removed Advisors */}
                  {customizations.removedAdvisors.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Removed Advisors:</h6>
                      <div className="space-y-1">
                        {customizations.removedAdvisors.map((roleId) => {
                          const role = team.advisorRoles.find(r => r.roleId === roleId);
                          if (!role) return null;
                          return (
                            <div key={roleId} className="flex items-center justify-between p-2 bg-red-50 rounded">
                              <div className="text-sm text-red-700">
                                {role.roleName}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestoreAdvisor(roleId)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Restore
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Deployment Settings</h5>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={customizations.settings.autoCreateConversation}
                        onChange={(e) => setCustomizations(prev => ({
                          ...prev,
                          settings: { ...prev.settings, autoCreateConversation: e.target.checked }
                        }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Auto-create first conversation</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={customizations.settings.enableCrossAdvisorCommunication}
                        onChange={(e) => setCustomizations(prev => ({
                          ...prev,
                          settings: { ...prev.settings, enableCrossAdvisorCommunication: e.target.checked }
                        }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Enable cross-advisor communication</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        {!deploymentResult && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex items-center space-x-3">
              {!deploymentEligibility && userPlan !== 'pro' && (
                <Badge variant="warning">
                  Pro Plan Required
                </Badge>
              )}
              <Button
                variant="primary"
                onClick={handleDeployTeam}
                disabled={isDeploying || !deploymentEligibility}
                className="flex items-center space-x-2"
              >
                {isDeploying ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <UserGroupIcon className="w-4 h-4" />
                    <span>Deploy Team</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};