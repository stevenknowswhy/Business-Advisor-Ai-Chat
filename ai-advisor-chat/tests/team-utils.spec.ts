import { describe, it, expect } from '@jest/globals';
import {
  loadTeamConfig,
  loadAdvisorConfig,
  getAllTeams,
  getTeamsByCategory,
  getFeaturedTeams,
  validateTeamCustomizations,
  calculateDeploymentCost,
  getAvailableModelsForAdvisor,
  generateDeploymentSummary,
  isDeploymentAllowed,
  getTeamStatistics
} from '../src/lib/teamUtils';

// Mock file system operations
jest.mock('fs/promises');
const fs = require('fs/promises');

// Mock team data
const mockTeamConfig = {
  teamId: 'startup-squad-v1',
  teamSchemaVersion: '1.0.0',
  name: 'The Startup Squad',
  tagline: 'Stress-test your business idea from every critical angle',
  description: 'A comprehensive team of advisors designed to evaluate and strengthen your startup idea',
  category: 'Startup & Entrepreneurship',
  targetAudience: ['Early-stage founders', 'Entrepreneurs'],
  useCases: ['Business idea validation', 'Product-market fit analysis'],
  advisorRoles: [
    {
      roleId: 'visionary',
      roleName: 'The Visionary',
      roleDescription: 'Focuses on the "Why"',
      advisorId: 'startup-visionary-v1',
      primaryFocus: ['Product vision'],
      interactionStyle: 'Inspiring',
      sessionPriority: 1,
      optional: false
    },
    {
      roleId: 'storyteller',
      roleName: 'The Storyteller',
      roleDescription: 'Focuses on the "Who"',
      advisorId: 'startup-storyteller-v1',
      primaryFocus: ['Brand strategy'],
      interactionStyle: 'Creative',
      sessionPriority: 5,
      optional: true
    }
  ],
  interactionProtocol: {
    sessionFlow: 'sequential',
    crossAdvisorCommunication: true,
    contextSharing: 'full',
    decisionMaking: 'consensusBased',
    feedbackLoop: 'iterative'
  },
  onboarding: {
    estimatedTime: '15 minutes',
    prerequisites: ['Business idea concept'],
    welcomeMessage: 'Welcome to The Startup Squad!',
    firstSession: {
      type: 'teamIntroduction',
      duration: '30 minutes',
      objectives: ['Understand your business concept']
    }
  },
  customizationOptions: {
    removableAdvisors: ['storyteller'],
    renameableRoles: true,
    adjustablePersonalities: true,
    configurableFocusAreas: true,
    teamSize: 'flexible (3-5 advisors)'
  },
  pricing: {
    deploymentFee: {
      free: 0,
      regular: 50,
      pro: 0
    },
    monthlyFee: {
      free: 0,
      regular: 20,
      pro: 0
    },
    sessionPricing: {
      free: 'limited',
      regular: 'unlimited',
      pro: 'unlimited'
    }
  },
  successMetrics: [
    {
      metric: 'Idea Validation Score',
      description: 'Comprehensive assessment of business idea viability',
      unit: 'score (1-10)'
    }
  ],
  metadata: {
    version: '1.0.0',
    createdAt: '2025-09-19T00:00:00Z',
    updatedAt: '2025-09-19T00:00:00Z',
    owner: {
      org: 'AdvisorOS',
      contactEmail: 'ops@advisoros.dev'
    },
    tags: ['startup', 'entrepreneurship', 'business'],
    featured: true,
    popularityScore: 95
  }
};

// Mock advisor data
const mockAdvisorConfig = {
  advisorId: 'startup-visionary-v1',
  advisorSchemaVersion: '1.1-base',
  status: 'active',
  persona: {
    name: 'Sarah Chen',
    title: 'The Visionary',
    image: 'https://example.com/image.jpg',
    oneLiner: 'A master brand strategist who transforms complex ideas into compelling narratives',
    archetype: 'The Narrative Architect',
    temperament: 'Creative, empathetic, and intuitively understands',
    bio: 'Sarah Chen is a brand strategist',
    experience: '10+ years in brand strategy',
    specialties: ['Brand strategy', 'Narrative development'],
    personalInterests: ['Screenwriting', 'Psychology'],
    communicationStyle: 'Engaging and empathetic',
    adviceDelivery: {
      mode: 'storytelling',
      formality: 'conversational',
      useEmojis: true,
      voiceGuidelines: ['Engaging and narrative-driven'],
      signOff: 'Let\'s tell your story. 📖\n— Sarah'
    }
  },
  modelConfiguration: {
    category: 'Creative',
    defaultModel: 'anthropic/claude-3-haiku',
    tierAvailability: {
      free: ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo'],
      regular: ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-sonnet'],
      pro: ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-sonnet', 'anthropic/claude-3-opus']
    }
  },
  metadata: {
    version: '1.0.0',
    createdAt: '2025-09-19T00:00:00Z',
    updatedAt: '2025-09-19T00:00:00Z',
    owner: {
      org: 'AdvisorOS',
      contactEmail: 'ops@advisoros.dev'
    },
    tags: ['visionary', 'creative', 'strategy']
  }
};

describe('Team Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTeamConfig', () => {
    it('should load team configuration successfully', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockTeamConfig));

      const result = await loadTeamConfig('startup-squad-v1');

      expect(result).toEqual(mockTeamConfig);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('prisma/teams/startup-squad-v1.json'),
        'utf-8'
      );
    });

    it('should return null for file read error', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await loadTeamConfig('non-existent-team');

      expect(result).toBeNull();
    });

    it('should return null for invalid configuration', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({ invalid: 'config' }));

      const result = await loadTeamConfig('invalid-team');

      expect(result).toBeNull();
    });
  });

  describe('loadAdvisorConfig', () => {
    it('should load advisor configuration successfully', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockAdvisorConfig));

      const result = await loadAdvisorConfig('startup-visionary-v1');

      expect(result).toEqual(mockAdvisorConfig);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('prisma/advisors/startup-visionary-v1.json'),
        'utf-8'
      );
    });

    it('should return null for file read error', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await loadAdvisorConfig('non-existent-advisor');

      expect(result).toBeNull();
    });

    it('should return null for invalid configuration', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({ invalid: 'config' }));

      const result = await loadAdvisorConfig('invalid-advisor');

      expect(result).toBeNull();
    });
  });

  describe('getAllTeams', () => {
    it('should return all available teams', async () => {
      fs.readdir.mockResolvedValue(['startup-squad-v1.json', 'another-team.json']);
      fs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockTeamConfig))
        .mockResolvedValueOnce(JSON.stringify({ ...mockTeamConfig, teamId: 'another-team' }));

      const result = await getAllTeams();

      expect(result).toHaveLength(2);
      expect(result[0]?.teamId).toBe('startup-squad-v1');
      expect(result[1]?.teamId).toBe('another-team');
    });

    it('should handle directory read error', async () => {
      fs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await getAllTeams();

      expect(result).toEqual([]);
    });
  });

  describe('getTeamsByCategory', () => {
    it('should return teams filtered by category', async () => {
      const mockTeams = [
        mockTeamConfig,
        { ...mockTeamConfig, teamId: 'marketing-team', category: 'Marketing' }
      ];

      // Mock getAllTeams directly
      jest.spyOn(fs, 'readdir').mockResolvedValue(['startup-squad-v1.json', 'marketing-team.json']);
      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(JSON.stringify(mockTeams[0]))
        .mockResolvedValueOnce(JSON.stringify(mockTeams[1]));

      const result = await getTeamsByCategory('Startup & Entrepreneurship');

      expect(result).toHaveLength(1);
      expect(result[0]?.category?.toLowerCase()).toBe('startup & entrepreneurship');
    });
  });

  describe('getFeaturedTeams', () => {
    it('should return only featured teams', async () => {
      const mockTeams = [
        mockTeamConfig, // featured: true
        { ...mockTeamConfig, teamId: 'regular-team', metadata: { ...mockTeamConfig.metadata, featured: false } }
      ];

      jest.spyOn(fs, 'readdir').mockResolvedValue(['startup-squad-v1.json', 'regular-team.json']);
      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(JSON.stringify(mockTeams[0]))
        .mockResolvedValueOnce(JSON.stringify(mockTeams[1]));

      const result = await getFeaturedTeams();

      expect(result).toHaveLength(1);
      expect(result[0]?.metadata?.featured).toBe(true);
    });
  });

  describe('validateTeamCustomizations', () => {
    it('should validate correct customizations', () => {
      const result = validateTeamCustomizations(mockTeamConfig, {
        removedAdvisors: ['storyteller'], // optional - should be fine
        renamedRoles: { visionary: 'Chief Visionary' }
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject removing required advisors', () => {
      const result = validateTeamCustomizations(mockTeamConfig, {
        removedAdvisors: ['visionary'] // required - should fail
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot remove required advisors: visionary');
    });

    it('should warn about unsupported role renaming', () => {
      const teamNoRename = {
        ...mockTeamConfig,
        customizationOptions: { ...mockTeamConfig.customizationOptions, renameableRoles: false }
      };

      const result = validateTeamCustomizations(teamNoRename, {
        renamedRoles: { visionary: 'Chief Visionary' }
      });

      expect(result.warnings).toContain('Role renaming is not supported for this team');
    });

    it('should reject invalid role IDs for renaming', () => {
      const result = validateTeamCustomizations(mockTeamConfig, {
        renamedRoles: { 'invalid-role': 'New Name' }
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid role IDs for renaming: invalid-role');
    });
  });

  describe('calculateDeploymentCost', () => {
    it('should calculate free tier costs', () => {
      const result = calculateDeploymentCost(mockTeamConfig, 'free');

      expect(result.deploymentFee).toBe(0);
      expect(result.monthlyFee).toBe(0);
      expect(result.currency).toBe('USD');
    });

    it('should calculate regular tier costs', () => {
      const result = calculateDeploymentCost(mockTeamConfig, 'regular');

      expect(result.deploymentFee).toBe(50);
      expect(result.monthlyFee).toBe(20);
      expect(result.currency).toBe('USD');
    });

    it('should calculate pro tier costs', () => {
      const result = calculateDeploymentCost(mockTeamConfig, 'pro');

      expect(result.deploymentFee).toBe(0);
      expect(result.monthlyFee).toBe(0);
      expect(result.currency).toBe('USD');
    });
  });

  describe('getAvailableModelsForAdvisor', () => {
    it('should return free tier models', () => {
      const result = getAvailableModelsForAdvisor(mockAdvisorConfig, 'free');

      expect(result).toEqual(['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo']);
    });

    it('should return regular tier models', () => {
      const result = getAvailableModelsForAdvisor(mockAdvisorConfig, 'regular');

      expect(result).toEqual(['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-sonnet']);
    });

    it('should return pro tier models', () => {
      const result = getAvailableModelsForAdvisor(mockAdvisorConfig, 'pro');

      expect(result).toEqual(['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-sonnet', 'anthropic/claude-3-opus']);
    });

    it('should fallback to free tier for unknown tier', () => {
      const result = getAvailableModelsForAdvisor(mockAdvisorConfig, 'unknown' as any);

      expect(result).toEqual(['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo']);
    });
  });

  describe('generateDeploymentSummary', () => {
    it('should generate summary without customizations', () => {
      const result = generateDeploymentSummary(mockTeamConfig);

      expect(result.totalAdvisors).toBe(2);
      expect(result.requiredAdvisors).toBe(1);
      expect(result.optionalAdvisors).toBe(1);
      expect(result.removedAdvisors).toEqual([]);
      expect(result.renamedRoles).toEqual({});
      expect(result.estimatedDeploymentTime).toBe('15 minutes');
    });

    it('should generate summary with customizations', () => {
      const result = generateDeploymentSummary(mockTeamConfig, {
        removedAdvisors: ['storyteller'],
        renamedRoles: { visionary: 'Chief Visionary' }
      });

      expect(result.totalAdvisors).toBe(1);
      expect(result.requiredAdvisors).toBe(1);
      expect(result.optionalAdvisors).toBe(0);
      expect(result.removedAdvisors).toEqual(['storyteller']);
      expect(result.renamedRoles).toEqual({ visionary: 'Chief Visionary' });
    });
  });

  describe('isDeploymentAllowed', () => {
    it('should allow deployment for free tier with no fee', () => {
      const result = isDeploymentAllowed(mockTeamConfig, 'free');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject deployment for regular tier with fee', () => {
      const result = isDeploymentAllowed(mockTeamConfig, 'regular');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('requires regular plan payment of $50');
    });

    it('should allow deployment for pro tier with no fee', () => {
      const result = isDeploymentAllowed(mockTeamConfig, 'pro');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('getTeamStatistics', () => {
    it('should return team statistics', () => {
      const result = getTeamStatistics('startup-squad-v1');

      expect(result).toHaveProperty('totalDeployments');
      expect(result).toHaveProperty('activeDeployments');
      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('popularCategories');
      expect(typeof result.totalDeployments).toBe('number');
      expect(Array.isArray(result.popularCategories)).toBe(true);
    });
  });
});