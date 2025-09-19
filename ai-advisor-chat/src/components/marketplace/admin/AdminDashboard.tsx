"use client";

import React, { useState } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  CogIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  Squares2X2Icon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Badge } from '../../ui';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdvisorManagement } from './AdvisorManagement';
import { ReviewModeration } from './ReviewModeration';
import { MCPStatusDashboard } from '../../mcp/MCPStatusDashboard';
import { ModelConfiguration } from '../../admin/ModelConfiguration';

export interface AdminDashboardProps {
  className?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);

  // Mock data for now - will be replaced with real queries
  const marketplaceStats = {
    totalAdvisors: 156,
    activeAdvisors: 142,
    featuredAdvisors: 12,
    pendingReviews: 23,
    totalReviews: 892,
    averageRating: 4.6,
    totalUsers: 2847,
    activeUsers: 892,
    newUsersThisMonth: 156
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'advisors', label: 'Advisors', icon: UsersIcon },
    { id: 'reviews', label: 'Reviews', icon: StarIcon },
    { id: 'portfolios', label: 'Portfolios', icon: DocumentTextIcon },
    { id: 'teams', label: 'Teams', icon: UserGroupIcon },
    { id: 'analytics', label: 'Analytics', icon: ArrowTrendingUpIcon },
    { id: 'models', label: 'AI Models', icon: SparklesIcon },
    { id: 'mcp', label: 'MCP Services', icon: Squares2X2Icon },
    { id: 'settings', label: 'Settings', icon: CogIcon }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Advisors</p>
                    <p className="text-2xl font-bold text-gray-900">{marketplaceStats.totalAdvisors}</p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{marketplaceStats.activeUsers}</p>
                  </div>
                  <UserGroupIcon className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{marketplaceStats.averageRating}</p>
                  </div>
                  <StarIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{marketplaceStats.pendingReviews}</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-orange-500" />
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">New advisor registration</span>
                    </div>
                    <span className="text-xs text-gray-500">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Review submitted for moderation</span>
                    </div>
                    <span className="text-xs text-gray-500">15 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Portfolio item requires approval</span>
                    </div>
                    <span className="text-xs text-gray-500">1 hour ago</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Manage Advisors
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <StarIcon className="w-4 h-4 mr-2" />
                    Moderate Reviews
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Review Portfolios
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Manage Teams
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'advisors':
        return (
          <AdvisorManagement
            onEditAdvisor={(advisorId) => console.log('Edit advisor:', advisorId)}
            onViewAdvisor={(advisorId) => console.log('View advisor:', advisorId)}
          />
        );

      case 'reviews':
        return <ReviewModeration />;

      case 'portfolios':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Portfolio Management</h2>
              <Button>View Pending Items</Button>
            </div>
            <Card>
              <p className="text-gray-600 text-center py-8">Portfolio management interface will be implemented here.</p>
            </Card>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Team Templates</h2>
              <Button>Create New Team</Button>
            </div>
            <Card>
              <p className="text-gray-600 text-center py-8">Team template management interface will be implemented here.</p>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Marketplace Analytics</h2>
            <Card>
              <p className="text-gray-600 text-center py-8">Analytics dashboard will be implemented here.</p>
            </Card>
          </div>
        );

      case 'models':
        return <ModelConfiguration />;

      case 'mcp':
        return <MCPStatusDashboard />;

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Marketplace Settings</h2>
            <Card>
              <p className="text-gray-600 text-center py-8">Settings interface will be implemented here.</p>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Marketplace Admin</h1>
              <Badge variant="secondary">Admin</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <BellIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'reviews' && marketplaceStats.pendingReviews > 0 && (
                    <Badge variant="warning" className="text-xs">
                      {marketplaceStats.pendingReviews}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};