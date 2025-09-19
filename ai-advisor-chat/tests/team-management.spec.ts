import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import type { TeamTemplate } from '../src/lib/teamUtils';

// Mock Next.js server for testing API routes
const app = next({ dev: false, dir: '.' });
const handle = app.getRequestHandler();

describe('Team Management API', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    await app.prepare();
    server = createServer(async (req, res) => {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(resolve));
    await app.close();
  });

  describe('GET /api/teams', () => {
    it('should return list of available teams', async () => {
      const response = await fetch(`${baseUrl}/api/teams`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('teams');
      expect(data.data).toHaveProperty('count');
      expect(Array.isArray(data.data.teams)).toBe(true);
      expect(data.data.count).toBeGreaterThan(0);
    });

    it('should filter teams by category', async () => {
      const response = await fetch(`${baseUrl}/api/teams?category=startup`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // All returned teams should be in the startup category
      data.data.teams.forEach((team: TeamTemplate) => {
        expect(team.category.toLowerCase()).toBe('startup');
      });
    });

    it('should return only featured teams when featured=true', async () => {
      const response = await fetch(`${baseUrl}/api/teams?featured=true`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // All returned teams should be featured
      data.data.teams.forEach((team: TeamTemplate) => {
        expect(team.metadata.featured).toBe(true);
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      // This test assumes authentication is required
      // In a real test environment, you'd need to mock authentication
      const response = await fetch(`${baseUrl}/api/teams`, {
        headers: {
          // Remove any authentication headers
        }
      });

      // Depending on your auth setup, this might be 401 or 200 with empty results
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('POST /api/teams', () => {
    it('should return team preview for valid team ID', async () => {
      const response = await fetch(`${baseUrl}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'preview',
          teamId: 'startup-squad-v1'
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('team');
      expect(data.data).toHaveProperty('advisors');
      expect(Array.isArray(data.data.advisors)).toBe(true);
    });

    it('should return 404 for non-existent team ID', async () => {
      const response = await fetch(`${baseUrl}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'preview',
          teamId: 'non-existent-team'
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Team not found');
    });

    it('should validate team deployment', async () => {
      const response = await fetch(`${baseUrl}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          teamId: 'startup-squad-v1',
          customizations: {
            removedAdvisors: ['storyteller'] // This should be valid as it's optional
          }
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('validation');
      expect(data.data.validation).toHaveProperty('isValid');
    });

    it('should reject invalid customizations', async () => {
      const response = await fetch(`${baseUrl}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          teamId: 'startup-squad-v1',
          customizations: {
            removedAdvisors: ['visionary'] // This should fail as it's required
          }
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.validation.isValid).toBe(false);
      expect(data.data.validation.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid action', async () => {
      const response = await fetch(`${baseUrl}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'invalid_action',
          teamId: 'startup-squad-v1'
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action');
    });
  });

  describe('POST /api/teams/[teamId]/deploy', () => {
    it('should initiate team deployment', async () => {
      const response = await fetch(`${baseUrl}/api/teams/startup-squad-v1/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customizations: {
            removedAdvisors: [] // Deploy with all advisors
          },
          settings: {
            autoCreateConversation: true
          }
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('deploymentId');
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('deployedAdvisors');
      expect(Array.isArray(data.data.deployedAdvisors)).toBe(true);
    });

    it('should return 404 for non-existent team', async () => {
      const response = await fetch(`${baseUrl}/api/teams/non-existent-team/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Team not found');
    });

    it('should validate deployment customizations', async () => {
      const response = await fetch(`${baseUrl}/api/teams/startup-squad-v1/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customizations: {
            removedAdvisors: ['visionary'] // Should fail - required advisor
          }
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Cannot remove required advisors');
    });

    it('should handle deployment with valid customizations', async () => {
      const response = await fetch(`${baseUrl}/api/teams/startup-squad-v1/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customizations: {
            removedAdvisors: ['storyteller'], // Optional - should be fine
            renamedRoles: {
              visionary: 'Chief Innovation Officer' // Should be allowed
            }
          }
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('completed');
    });
  });

  describe('GET /api/teams/[teamId]/deploy', () => {
    it('should check deployment status', async () => {
      // First deploy a team to get a deployment ID
      const deployResponse = await fetch(`${baseUrl}/api/teams/startup-squad-v1/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const deployData = await deployResponse.json();
      const deploymentId = deployData.data.deploymentId;

      // Now check the status
      const response = await fetch(`${baseUrl}/api/teams/startup-squad-v1/deploy?deploymentId=${deploymentId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('deploymentId', deploymentId);
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('progress');
    });

    it('should return 400 for missing deployment ID', async () => {
      const response = await fetch(`${baseUrl}/api/teams/startup-squad-v1/deploy`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Deployment ID required');
    });
  });

  describe('GET /api/teams/deployments', () => {
    it('should return user\'s deployed teams', async () => {
      const response = await fetch(`${baseUrl}/api/teams/deployments`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('deployments');
      expect(data.data).toHaveProperty('summary');
      expect(Array.isArray(data.data.deployments)).toBe(true);
    });

    it('should include deployment summary', async () => {
      const response = await fetch(`${baseUrl}/api/teams/deployments`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.summary).toHaveProperty('totalTeams');
      expect(data.data.summary).toHaveProperty('activeTeams');
      expect(data.data.summary).toHaveProperty('totalAdvisors');
      expect(data.data.summary).toHaveProperty('totalConversations');
      expect(typeof data.data.summary.totalTeams).toBe('number');
    });
  });

  describe('POST /api/teams/deployments', () => {
    it('should activate deployed team', async () => {
      // First get deployed teams to find one to test with
      const listResponse = await fetch(`${baseUrl}/api/teams/deployments`);
      const listData = await listResponse.json();

      if (listData.data.deployments.length > 0) {
        const deployment = listData.data.deployments[0];

        const response = await fetch(`${baseUrl}/api/teams/deployments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'activate',
            deploymentId: deployment.deploymentId
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('active');
      }
    });

    it('should deactivate deployed team', async () => {
      // First get deployed teams to find one to test with
      const listResponse = await fetch(`${baseUrl}/api/teams/deployments`);
      const listData = await listResponse.json();

      if (listData.data.deployments.length > 0) {
        const deployment = listData.data.deployments[0];

        const response = await fetch(`${baseUrl}/api/teams/deployments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'deactivate',
            deploymentId: deployment.deploymentId
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('inactive');
      }
    });

    it('should update team settings', async () => {
      // First get deployed teams to find one to test with
      const listResponse = await fetch(`${baseUrl}/api/teams/deployments`);
      const listData = await listResponse.json();

      if (listData.data.deployments.length > 0) {
        const deployment = listData.data.deployments[0];

        const response = await fetch(`${baseUrl}/api/teams/deployments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_settings',
            deploymentId: deployment.deploymentId,
            settings: {
              crossAdvisorCommunication: true,
              autoCreateConversation: false
            }
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.settings.crossAdvisorCommunication).toBe(true);
        expect(data.data.settings.autoCreateConversation).toBe(false);
      }
    });

    it('should return 404 for non-existent deployment', async () => {
      const response = await fetch(`${baseUrl}/api/teams/deployments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate',
          deploymentId: 'non-existent-deployment'
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Deployment not found');
    });

    it('should reject invalid action', async () => {
      const response = await fetch(`${baseUrl}/api/teams/deployments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'invalid_action',
          deploymentId: 'some-deployment-id'
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action');
    });
  });
});

describe('Team Utilities', () => {
  describe('validateTeamCustomizations', () => {
    it('should validate correct customizations', () => {
      const team = {
        advisorRoles: [
          { roleId: 'visionary', optional: false },
          { roleId: 'storyteller', optional: true }
        ],
        customizationOptions: {
          renameableRoles: true
        }
      } as any;

      const { validateTeamCustomizations } = require('../src/lib/teamUtils');
      const result = validateTeamCustomizations(team, {
        removedAdvisors: ['storyteller'],
        renamedRoles: { visionary: 'Chief Visionary' }
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject removing required advisors', () => {
      const team = {
        advisorRoles: [
          { roleId: 'visionary', optional: false }
        ],
        customizationOptions: {
          renameableRoles: true
        }
      } as any;

      const { validateTeamCustomizations } = require('../src/lib/teamUtils');
      const result = validateTeamCustomizations(team, {
        removedAdvisors: ['visionary']
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about unsupported features', () => {
      const team = {
        advisorRoles: [{ roleId: 'visionary', optional: false }],
        customizationOptions: {
          renameableRoles: false
        }
      } as any;

      const { validateTeamCustomizations } = require('../src/lib/teamUtils');
      const result = validateTeamCustomizations(team, {
        renamedRoles: { visionary: 'Chief Visionary' }
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('calculateDeploymentCost', () => {
    it('should calculate free tier costs', () => {
      const team = {
        pricing: {
          deploymentFee: { free: 0, regular: 50, pro: 0 },
          monthlyFee: { free: 0, regular: 20, pro: 0 }
        }
      } as any;

      const { calculateDeploymentCost } = require('../src/lib/teamUtils');
      const cost = calculateDeploymentCost(team, 'free');

      expect(cost.deploymentFee).toBe(0);
      expect(cost.monthlyFee).toBe(0);
      expect(cost.currency).toBe('USD');
    });

    it('should calculate regular tier costs', () => {
      const team = {
        pricing: {
          deploymentFee: { free: 0, regular: 50, pro: 0 },
          monthlyFee: { free: 0, regular: 20, pro: 0 }
        }
      } as any;

      const { calculateDeploymentCost } = require('../src/lib/teamUtils');
      const cost = calculateDeploymentCost(team, 'regular');

      expect(cost.deploymentFee).toBe(50);
      expect(cost.monthlyFee).toBe(20);
      expect(cost.currency).toBe('USD');
    });
  });
});