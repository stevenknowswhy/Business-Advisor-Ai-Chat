"use client";

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CogIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  WindowIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Badge } from '../ui';

interface MCPService {
  name: string;
  url: string;
  port: number;
  status: 'online' | 'offline' | 'error';
  description: string;
  capabilities: string[];
}

interface MCPStatusResponse {
  success: boolean;
  data: {
    services: MCPService[];
    summary: {
      total: number;
      online: number;
      offline: number;
      error: number;
    };
  };
  error?: string;
}

interface MCPStatusDashboardProps {
  className?: string;
}

export const MCPStatusDashboard: React.FC<MCPStatusDashboardProps> = ({ className }) => {
  const [services, setServices] = useState<MCPService[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    online: 0,
    offline: 0,
    error: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMCPStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/status');
      const data: MCPStatusResponse = await response.json();

      if (data.success) {
        setServices(data.data.services);
        setSummary(data.data.summary);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch MCP status:', data.error);
      }
    } catch (error) {
      console.error('Error fetching MCP status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMCPStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchMCPStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="success">Online</Badge>;
      case 'offline':
        return <Badge variant="danger">Offline</Badge>;
      case 'error':
        return <Badge variant="warning">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getServiceIcon = (name: string) => {
    switch (name) {
      case 'github':
        return <CodeBracketIcon className="w-6 h-6 text-gray-600" />;
      case 'filesystem':
        return <DocumentTextIcon className="w-6 h-6 text-gray-600" />;
      case 'shadcn':
        return <CogIcon className="w-6 h-6 text-gray-600" />;
      case 'playwright':
        return <WindowIcon className="w-6 h-6 text-gray-600" />;
      default:
        return <PlayIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">MCP Services Status</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor Model Context Protocol services and their capabilities
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMCPStatus}
            disabled={loading}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-600">Total Services</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.online}</div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.offline}</div>
            <div className="text-sm text-gray-600">Offline</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.error}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </Card>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.name} className="relative">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getServiceIcon(service.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {service.name}
                        </h3>
                        {getStatusBadge(service.status)}
                        <span className="text-sm text-gray-500">Port {service.port}</span>
                      </div>
                      <p className="text-gray-600 mb-3">{service.description}</p>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Capabilities:</h4>
                        <div className="flex flex-wrap gap-2">
                          {service.capabilities.map((capability, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {capability.replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(service.status)}
                  </div>
                </div>

                {/* Service Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Service URL: {service.url}</span>
                    {service.status === 'online' && (
                      <span className="text-green-600">All systems operational</span>
                    )}
                    {service.status === 'offline' && (
                      <span className="text-red-600">Service unavailable</span>
                    )}
                    {service.status === 'error' && (
                      <span className="text-yellow-600">Service error detected</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <CogIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No MCP Services Found</h3>
            <p className="text-gray-600">
              No Model Context Protocol services are currently configured or running.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};