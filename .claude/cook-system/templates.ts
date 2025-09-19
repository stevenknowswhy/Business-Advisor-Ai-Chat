/**
 * Project Templates for /cook Command System
 * Predefined workflows for different types of tasks
 */

import { CookCommand, CookOptions } from './command-parser';

export interface AgentStep {
  agent: string;
  task: string;
  dependsOn?: string[];
  parallelWith?: string[];
  timeout?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface ProjectTemplate {
  name: string;
  description: string;
  agents: AgentStep[];
  options: Partial<CookOptions>;
  estimatedDuration: string;
  outputFormat: 'summary' | 'detailed' | 'executive';
  tags: string[];
}

export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  // Architecture Templates
  architecture: {
    name: 'Architecture Analysis',
    description: 'Comprehensive architectural analysis and design',
    agents: [
      {
        agent: 'architect',
        task: 'Analyze requirements and design architecture',
        priority: 'high'
      },
      {
        agent: 'backend',
        task: 'Review backend architecture implications',
        dependsOn: ['architect'],
        parallelWith: ['ui']
      },
      {
        agent: 'ui',
        task: 'Evaluate frontend architecture requirements',
        dependsOn: ['architect'],
        parallelWith: ['backend']
      },
      {
        agent: 'tester',
        task: 'Identify testing requirements and risks',
        dependsOn: ['backend', 'ui']
      },
      {
        agent: 'docs',
        task: 'Synthesize architecture documentation',
        dependsOn: ['tester']
      }
    ],
    options: {
      output: 'detailed',
      priority: 'high'
    },
    estimatedDuration: '15-30 minutes',
    outputFormat: 'detailed',
    tags: ['planning', 'design', 'architecture']
  },

  // Implementation Templates
  implementation: {
    name: 'Feature Implementation',
    description: 'Complete feature implementation workflow',
    agents: [
      {
        agent: 'architect',
        task: 'Design implementation approach',
        priority: 'high'
      },
      {
        agent: 'backend',
        task: 'Implement backend components',
        dependsOn: ['architect']
      },
      {
        agent: 'ui',
        task: 'Implement frontend components',
        dependsOn: ['architect']
      },
      {
        agent: 'tester',
        task: 'Create and validate tests',
        dependsOn: ['backend', 'ui']
      },
      {
        agent: 'docs',
        task: 'Generate implementation documentation',
        dependsOn: ['tester']
      }
    ],
    options: {
      output: 'detailed',
      priority: 'medium'
    },
    estimatedDuration: '30-60 minutes',
    outputFormat: 'detailed',
    tags: ['implementation', 'development', 'coding']
  },

  // Testing Templates
  testing: {
    name: 'Testing Strategy',
    description: 'Comprehensive testing approach and test planning',
    agents: [
      {
        agent: 'tester',
        task: 'Analyze testing requirements',
        priority: 'high'
      },
      {
        agent: 'architect',
        task: 'Review architectural test implications',
        dependsOn: ['tester'],
        parallelWith: ['backend']
      },
      {
        agent: 'backend',
        task: 'Identify backend testing requirements',
        dependsOn: ['tester'],
        parallelWith: ['architect']
      },
      {
        agent: 'ui',
        task: 'Identify frontend testing requirements',
        dependsOn: ['tester']
      },
      {
        agent: 'docs',
        task: 'Generate testing documentation',
        dependsOn: ['architect', 'backend', 'ui']
      }
    ],
    options: {
      output: 'detailed',
      priority: 'medium'
    },
    estimatedDuration: '20-40 minutes',
    outputFormat: 'detailed',
    tags: ['testing', 'quality', 'validation']
  },

  // Documentation Templates
  documentation: {
    name: 'Documentation Generation',
    description: 'Comprehensive documentation creation',
    agents: [
      {
        agent: 'docs',
        task: 'Analyze documentation requirements',
        priority: 'high'
      },
      {
        agent: 'architect',
        task: 'Provide architectural documentation',
        dependsOn: ['docs']
      },
      {
        agent: 'backend',
        task: 'Provide backend documentation',
        dependsOn: ['docs'],
        parallelWith: ['ui']
      },
      {
        agent: 'ui',
        task: 'Provide frontend documentation',
        dependsOn: ['docs'],
        parallelWith: ['backend']
      },
      {
        agent: 'tester',
        task: 'Validate documentation completeness',
        dependsOn: ['architect', 'backend', 'ui']
      }
    ],
    options: {
      output: 'detailed',
      priority: 'medium'
    },
    estimatedDuration: '15-25 minutes',
    outputFormat: 'detailed',
    tags: ['documentation', 'knowledge', 'communication']
  },

  // Optimization Templates
  optimization: {
    name: 'Performance Optimization',
    description: 'Performance and optimization analysis',
    agents: [
      {
        agent: 'backend',
        task: 'Analyze backend performance',
        priority: 'high',
        parallelWith: ['ui']
      },
      {
        agent: 'ui',
        task: 'Analyze frontend performance',
        priority: 'high',
        parallelWith: ['backend']
      },
      {
        agent: 'architect',
        task: 'Review optimization strategy',
        dependsOn: ['backend', 'ui']
      },
      {
        agent: 'tester',
        task: 'Validate optimization effectiveness',
        dependsOn: ['architect']
      },
      {
        agent: 'docs',
        task: 'Document optimization findings',
        dependsOn: ['tester']
      }
    ],
    options: {
      output: 'detailed',
      parallel: true,
      priority: 'high'
    },
    estimatedDuration: '25-45 minutes',
    outputFormat: 'detailed',
    tags: ['performance', 'optimization', 'efficiency']
  },

  // Quick Analysis Templates
  'quick-analysis': {
    name: 'Quick Analysis',
    description: 'Rapid analysis for urgent issues',
    agents: [
      {
        agent: 'tester',
        task: 'Quick issue identification',
        priority: 'high',
        timeout: 5
      }
    ],
    options: {
      output: 'summary',
      priority: 'high',
      quick: true
    },
    estimatedDuration: '5-10 minutes',
    outputFormat: 'summary',
    tags: ['quick', 'analysis', 'urgent']
  },

  // Bug Fix Templates
  'bug-fix': {
    name: 'Bug Fix Analysis',
    description: 'Comprehensive bug analysis and fix strategy',
    agents: [
      {
        agent: 'tester',
        task: 'Analyze bug patterns and root causes',
        priority: 'high'
      },
      {
        agent: 'backend',
        task: 'Identify backend bug sources',
        dependsOn: ['tester'],
        parallelWith: ['ui']
      },
      {
        agent: 'ui',
        task: 'Identify frontend bug sources',
        dependsOn: ['tester'],
        parallelWith: ['backend']
      },
      {
        agent: 'architect',
        task: 'Review architectural implications',
        dependsOn: ['backend', 'ui']
      },
      {
        agent: 'docs',
        task: 'Document bug fix approach',
        dependsOn: ['architect']
      }
    ],
    options: {
      output: 'detailed',
      priority: 'high'
    },
    estimatedDuration: '20-35 minutes',
    outputFormat: 'detailed',
    tags: ['bug-fix', 'debugging', 'quality']
  },

  // Security Review Templates
  'security-review': {
    name: 'Security Review',
    description: 'Comprehensive security analysis',
    agents: [
      {
        agent: 'backend',
        task: 'Analyze backend security',
        priority: 'high'
      },
      {
        agent: 'architect',
        task: 'Review architectural security',
        dependsOn: ['backend'],
        parallelWith: ['tester']
      },
      {
        agent: 'tester',
        task: 'Identify security testing requirements',
        dependsOn: ['backend'],
        parallelWith: ['architect']
      },
      {
        agent: 'docs',
        task: 'Generate security documentation',
        dependsOn: ['architect', 'tester']
      }
    ],
    options: {
      output: 'detailed',
      priority: 'high'
    },
    estimatedDuration: '30-50 minutes',
    outputFormat: 'detailed',
    tags: ['security', 'audit', 'compliance']
  },

  // Migration Templates
  migration: {
    name: 'Migration Planning',
    description: 'Database or technology migration planning',
    agents: [
      {
        agent: 'architect',
        task: 'Design migration strategy',
        priority: 'high'
      },
      {
        agent: 'backend',
        task: 'Plan backend migration',
        dependsOn: ['architect']
      },
      {
        agent: 'tester',
        task: 'Identify migration testing requirements',
        dependsOn: ['backend']
      },
      {
        agent: 'docs',
        task: 'Generate migration documentation',
        dependsOn: ['tester']
      }
    ],
    options: {
      output: 'detailed',
      priority: 'high'
    },
    estimatedDuration: '25-45 minutes',
    outputFormat: 'detailed',
    tags: ['migration', 'planning', 'infrastructure']
  }
};

export class TemplateManager {
  /**
   * Get template by name
   */
  static getTemplate(name: string): ProjectTemplate | null {
    return PROJECT_TEMPLATES[name] || null;
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): ProjectTemplate[] {
    return Object.values(PROJECT_TEMPLATES);
  }

  /**
   * Get templates by tags
   */
  static getTemplatesByTags(tags: string[]): ProjectTemplate[] {
    return Object.values(PROJECT_TEMPLATES).filter(template =>
      tags.some(tag => template.tags.includes(tag))
    );
  }

  /**
   * Search templates by name or description
   */
  static searchTemplates(query: string): ProjectTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Object.values(PROJECT_TEMPLATES).filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Apply template to command
   */
  static applyTemplate(template: ProjectTemplate, taskDescription: string): CookCommand {
    return {
      projectType: 'custom',
      taskDescription,
      options: {
        ...template.options,
        agents: template.agents.map(step => step.agent)
      },
      timestamp: new Date(),
      id: `cook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Validate template compatibility with command
   */
  static validateTemplate(template: ProjectTemplate, command: CookCommand): {
    isValid: boolean;
    warnings?: string[];
  } {
    const warnings: string[] = [];

    // Check if requested agents are available in template
    if (command.options.agents) {
      const templateAgents = template.agents.map(step => step.agent);
      const missingAgents = command.options.agents.filter(
        agent => !templateAgents.includes(agent)
      );

      if (missingAgents.length > 0) {
        warnings.push(`Template doesn't include agents: ${missingAgents.join(', ')}`);
      }
    }

    // Check option compatibility
    if (command.options.parallel && !template.agents.some(step => step.parallelWith)) {
      warnings.push('Template doesn\'t support parallel execution');
    }

    if (command.options.quick && template.estimatedDuration !== '5-10 minutes') {
      warnings.push('Template not optimized for quick execution');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Get template execution plan
   */
  static getExecutionPlan(template: ProjectTemplate): {
    sequential: AgentStep[];
    parallel: AgentStep[][];
  } {
    const sequential: AgentStep[] = [];
    const parallel: AgentStep[][] = [];

    // Group agents by execution order
    const steps = [...template.agents];
    const executed = new Set<string>();

    while (steps.length > 0) {
      // Find agents with all dependencies met
      const ready = steps.filter(step =>
        !step.dependsOn || step.dependsOn.every(dep => executed.has(dep))
      );

      if (ready.length === 0) {
        // Circular dependency detected
        break;
      }

      // Process ready agents
      for (const step of ready) {
        if (step.parallelWith && step.parallelWith.every(pw => executed.has(pw))) {
          // Add to parallel execution
          parallel.push([step]);
        } else {
          // Add to sequential execution
          sequential.push(step);
        }
        executed.add(step.agent);
      }

      // Remove processed steps
      steps.splice(0, ready.length);
    }

    return { sequential, parallel };
  }

  /**
   * Format template for display
   */
  static formatTemplate(template: ProjectTemplate): string {
    const plan = this.getExecutionPlan(template);
    const lines = [
      `📋 ${template.name}`,
      `   Description: ${template.description}`,
      `   Duration: ${template.estimatedDuration}`,
      `   Output: ${template.outputFormat}`,
      `   Tags: ${template.tags.join(', ')}`,
      '',
      '🔄 Execution Plan:'
    ];

    // Add sequential steps
    if (plan.sequential.length > 0) {
      lines.push('   Sequential:');
      plan.sequential.forEach((step, index) => {
        lines.push(`     ${index + 1}. ${step.agent}: ${step.task}`);
      });
    }

    // Add parallel steps
    if (plan.parallel.length > 0) {
      lines.push('   Parallel:');
      plan.parallel.forEach((group, index) => {
        const agentNames = group.map(step => step.agent).join(', ');
        lines.push(`     Group ${index + 1}: ${agentNames}`);
      });
    }

    return lines.join('\n');
  }
}