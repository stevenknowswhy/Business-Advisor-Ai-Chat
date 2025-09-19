"use client";

import { useState, useEffect } from 'react';
import type {
  MCPService,
  MCPRequest,
  MCPResponse,
  MCPCapabilities
} from '../lib/mcpUtils';
import {
  callMCPService,
  getMCPServiceStatus,
  getMCPServiceCapabilities
} from '../lib/mcpUtils';

// Hook for MCP service status
export function useMCPServiceStatus() {
  const [services, setServices] = useState<MCPService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const status = await getMCPServiceStatus();
      if (status) {
        setServices(status.services);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch MCP service status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    fetchStatus();
  };

  return {
    services,
    loading,
    error,
    lastUpdated,
    refresh,
    onlineServices: services.filter(s => s.status === 'online'),
    offlineServices: services.filter(s => s.status === 'offline'),
    errorServices: services.filter(s => s.status === 'error'),
    isHealthy: services.length > 0 && services.every(s => s.status === 'online')
  };
}

// Hook for specific MCP service operations
export function useMCPService<T = any>(serviceName: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callService = async (action: string, params?: Record<string, any>): Promise<MCPResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await callMCPService(serviceName as any, action, params);

      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Unknown error');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    callService,
    reset: () => {
      setData(null);
      setError(null);
    }
  };
}

// Hook for MCP service capabilities
export function useMCPCapabilities(serviceName: string) {
  const [capabilities, setCapabilities] = useState<MCPCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = async () => {
    try {
      setLoading(true);
      setError(null);

      const caps = await getMCPServiceCapabilities(serviceName as any);
      setCapabilities(caps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapabilities();
  }, [serviceName]);

  return {
    capabilities,
    loading,
    error,
    refresh: fetchCapabilities
  };
}

// Hook for GitHub MCP operations
export function useGitHubMCP() {
  const service = useMCPService('github');

  const searchRepositories = (query: string, language?: string) =>
    service.callService('searchRepos', { query, language });

  const getRepository = (owner: string, repo: string) =>
    service.callService('getRepo', { owner, repo });

  const getIssues = (owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') =>
    service.callService('getIssues', { owner, repo, state });

  const getPullRequests = (owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') =>
    service.callService('getPullRequests', { owner, repo, state });

  const createIssue = (owner: string, repo: string, title: string, body: string) =>
    service.callService('createIssue', { owner, repo, title, body });

  const createPullRequest = (owner: string, repo: string, title: string, body: string, head: string, base: string) =>
    service.callService('createPullRequest', { owner, repo, title, body, head, base });

  const analyzeCode = (owner: string, repo: string, path: string) =>
    service.callService('analyzeCode', { owner, repo, path });

  return {
    ...service,
    searchRepositories,
    getRepository,
    getIssues,
    getPullRequests,
    createIssue,
    createPullRequest,
    analyzeCode
  };
}

// Hook for Filesystem MCP operations
export function useFilesystemMCP() {
  const service = useMCPService('filesystem');

  const readFile = (path: string) =>
    service.callService('readFile', { path });

  const writeFile = (path: string, content: string) =>
    service.callService('writeFile', { path, content });

  const listDirectory = (path: string) =>
    service.callService('listDirectory', { path });

  const createDirectory = (path: string) =>
    service.callService('createDirectory', { path });

  const searchFiles = (path: string, pattern: string) =>
    service.callService('searchFiles', { path, pattern });

  const getFileInfo = (path: string) =>
    service.callService('getFileInfo', { path });

  const analyzeDocument = (path: string) =>
    service.callService('analyzeDocument', { path });

  return {
    ...service,
    readFile,
    writeFile,
    listDirectory,
    createDirectory,
    searchFiles,
    getFileInfo,
    analyzeDocument
  };
}

// Hook for Shadcn MCP operations
export function useShadcnMCP() {
  const service = useMCPService('shadcn');

  const getComponent = (componentName: string) =>
    service.callService('getComponent', { componentName });

  const listComponents = () =>
    service.callService('listComponents', {});

  const getComponentDemo = (componentName: string) =>
    service.callService('getComponentDemo', { componentName });

  const getComponentMetadata = (componentName: string) =>
    service.callService('getComponentMetadata', { componentName });

  const generateComponent = (description: string, framework: 'react' | 'vue' | 'svelte' = 'react') =>
    service.callService('generateComponent', { description, framework });

  const getBlock = (blockName: string) =>
    service.callService('getBlock', { blockName });

  const listBlocks = (category?: string) =>
    service.callService('listBlocks', { category });

  return {
    ...service,
    getComponent,
    listComponents,
    getComponentDemo,
    getComponentMetadata,
    generateComponent,
    getBlock,
    listBlocks
  };
}

// Hook for Playwright MCP operations
export function usePlaywrightMCP() {
  const service = useMCPService('playwright');

  const navigate = (url: string) =>
    service.callService('navigate', { url });

  const screenshot = (selector?: string, options?: { format?: 'png' | 'jpeg' | 'webp'; quality?: number }) =>
    service.callService('screenshot', { selector, ...options });

  const click = (selector: string) =>
    service.callService('click', { selector });

  const fill = (selector: string, value: string) =>
    service.callService('fill', { selector, value });

  const getText = (selector: string) =>
    service.callService('getText', { selector });

  const waitForElement = (selector: string, timeout?: number) =>
    service.callService('waitForElement', { selector, timeout });

  const executeScript = (script: string) =>
    service.callService('executeScript', { script });

  const getPageTitle = () =>
    service.callService('getPageTitle', {});

  const getPageUrl = () =>
    service.callService('getPageUrl', {});

  const checkElementExists = (selector: string) =>
    service.callService('checkElementExists', { selector });

  const takeFullScreenshot = (options?: { format?: 'png' | 'jpeg' | 'webp'; quality?: number }) =>
    service.callService('takeFullScreenshot', { ...options });

  const getPerformanceMetrics = () =>
    service.callService('getPerformanceMetrics', {});

  return {
    ...service,
    navigate,
    screenshot,
    click,
    fill,
    getText,
    waitForElement,
    executeScript,
    getPageTitle,
    getPageUrl,
    checkElementExists,
    takeFullScreenshot,
    getPerformanceMetrics
  };
}

// Hook for MCP batch operations
export function useMCPBatch() {
  const [results, setResults] = useState<Record<string, MCPResponse>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const executeBatch = async (operations: Array<{
    serviceName: string;
    action: string;
    params?: Record<string, any>;
    id: string;
  }>) => {
    try {
      setLoading(true);
      setErrors([]);

      const batchResults: Record<string, MCPResponse> = {};
      const batchErrors: string[] = [];

      // Execute operations in parallel
      const promises = operations.map(async (op) => {
        try {
          const response = await callMCPService(op.serviceName as any, op.action, op.params);
          batchResults[op.id] = response;

          if (!response.success) {
            batchErrors.push(`${op.id}: ${response.error}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          batchErrors.push(`${op.id}: ${errorMessage}`);
          batchResults[op.id] = {
            success: false,
            error: errorMessage
          };
        }
      });

      await Promise.all(promises);

      setResults(batchResults);
      setErrors(batchErrors);

      return {
        success: batchErrors.length === 0,
        results: batchResults,
        errors: batchErrors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors([errorMessage]);
      return {
        success: false,
        results: {},
        errors: [errorMessage]
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    errors,
    executeBatch,
    reset: () => {
      setResults({});
      setErrors([]);
    }
  };
}