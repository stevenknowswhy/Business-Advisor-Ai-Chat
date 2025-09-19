/**
 * Team Coordinator for /cook Command System
 * Manages sub-agent execution, coordination, and result synthesis
 */

import { CookCommand, CookOptions } from './command-parser';
import { ProjectTemplate, TemplateManager } from './templates';

export interface AgentExecution {
  agent: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  output?: string;
}

export interface ExecutionSession {
  id: string;
  command: CookCommand;
  template?: ProjectTemplate;
  executions: AgentExecution[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  progress: number;
  logs: string[];
}

export interface CoordinatorConfig {
  maxConcurrentAgents: number;
  agentTimeout: number;
  retryAttempts: number;
  enableParallelExecution: boolean;
  progressReporting: boolean;
}

export class TeamCoordinator {
  private sessions: Map<string, ExecutionSession> = new Map();
  private config: CoordinatorConfig;

  constructor(config: Partial<CoordinatorConfig> = {}) {
    this.config = {
      maxConcurrentAgents: 3,
      agentTimeout: 300000, // 5 minutes
      retryAttempts: 2,
      enableParallelExecution: true,
      progressReporting: true,
      ...config
    };
  }

  /**
   * Execute a cook command
   */
  async executeCommand(command: CookCommand): Promise<ExecutionSession> {
    const session: ExecutionSession = {
      id: command.id,
      command,
      status: 'pending',
      executions: [],
      progress: 0,
      logs: []
    };

    this.sessions.set(session.id, session);

    try {
      session.startTime = new Date();
      session.status = 'running';
      this.log(session.id, '🍳 Starting cook command execution');

      // Get template for the command
      const template = this.getTemplateForCommand(command);
      if (template) {
        session.template = template;
        this.log(session.id, `📋 Using template: ${template.name}`);
      }

      // Prepare execution plan
      const executionPlan = this.prepareExecutionPlan(command, template);
      session.executions = executionPlan;

      this.log(session.id, `📋 Execution plan created with ${executionPlan.length} agents`);

      // Execute the plan
      await this.executePlan(session);

      session.status = 'completed';
      session.endTime = new Date();
      session.progress = 100;
      this.log(session.id, '✅ Cook command completed successfully');

    } catch (error) {
      session.status = 'failed';
      session.endTime = new Date();
      this.log(session.id, `❌ Cook command failed: ${error}`);
    }

    return session;
  }

  /**
   * Get template for command
   */
  private getTemplateForCommand(command: CookCommand): ProjectTemplate | null {
    // Try to get template by project type
    let template = TemplateManager.getTemplate(command.projectType);

    // Check for custom template option
    if (command.options.template) {
      const customTemplate = TemplateManager.getTemplate(command.options.template);
      if (customTemplate) {
        template = customTemplate;
      }
    }

    // Apply command options to template
    if (template && command.options) {
      const validation = TemplateManager.validateTemplate(template, command);
      if (validation.warnings) {
        validation.warnings.forEach(warning => {
          this.log(command.id, `⚠️  ${warning}`);
        });
      }
    }

    return template;
  }

  /**
   * Prepare execution plan
   */
  private prepareExecutionPlan(command: CookCommand, template?: ProjectTemplate): AgentExecution[] {
    const executions: AgentExecution[] = [];

    // If template is provided, use its execution plan
    if (template) {
      const plan = TemplateManager.getExecutionPlan(template);

      // Add sequential steps
      plan.sequential.forEach(step => {
        executions.push({
          agent: step.agent,
          task: this.customizeTask(step.task, command.taskDescription),
          status: 'pending'
        });
      });

      // Add parallel steps
      plan.parallel.forEach(group => {
        group.forEach(step => {
          executions.push({
            agent: step.agent,
            task: this.customizeTask(step.task, command.taskDescription),
            status: 'pending'
          });
        });
      });

    } else {
      // Use command options or default agents
      const agents = command.options.agents || this.getDefaultAgents(command.projectType);

      agents.forEach(agent => {
        executions.push({
          agent,
          task: this.generateAgentTask(agent, command),
          status: 'pending'
        });
      });
    }

    return executions;
  }

  /**
   * Customize task with command context
   */
  private customizeTask(templateTask: string, commandTask: string): string {
    return templateTask.replace('[task]', commandTask);
  }

  /**
   * Get default agents for project type
   */
  private getDefaultAgents(projectType: string): string[] {
    const defaults: Record<string, string[]> = {
      architecture: ['architect', 'backend', 'ui', 'tester', 'docs'],
      implementation: ['architect', 'backend', 'ui', 'tester', 'docs'],
      testing: ['tester', 'architect', 'backend', 'ui', 'docs'],
      documentation: ['docs', 'architect', 'backend', 'ui', 'tester'],
      optimization: ['backend', 'ui', 'architect', 'tester', 'docs'],
      custom: ['architect', 'backend', 'ui']
    };

    return defaults[projectType] || defaults.custom;
  }

  /**
   * Generate agent task based on command
   */
  private generateAgentTask(agent: string, command: CookCommand): string {
    const taskTemplates: Record<string, string> = {
      architect: `Analyze architecture for: ${command.taskDescription}`,
      backend: `Review backend implementation for: ${command.taskDescription}`,
      ui: `Evaluate frontend components for: ${command.taskDescription}`,
      tester: `Identify testing requirements for: ${command.taskDescription}`,
      docs: `Generate documentation for: ${command.taskDescription}`
    };

    return taskTemplates[agent] || `Analyze: ${command.taskDescription}`;
  }

  /**
   * Execute the prepared plan
   */
  private async executePlan(session: ExecutionSession): Promise<void> {
    const executions = session.executions;
    const totalExecutions = executions.length;
    let completedExecutions = 0;

    // Execute agents based on their dependencies
    while (completedExecutions < totalExecutions) {
      // Find ready agents (no pending dependencies)
      const readyAgents = executions.filter(execution =>
        execution.status === 'pending' && this.isExecutionReady(execution, executions)
      );

      if (readyAgents.length === 0) {
        // Check for circular dependencies or stuck agents
        const pendingAgents = executions.filter(e => e.status === 'pending');
        if (pendingAgents.length > 0) {
          throw new Error(`Circular dependency detected with agents: ${pendingAgents.map(a => a.agent).join(', ')}`);
        }
        break;
      }

      // Execute ready agents (respecting concurrency limits)
      const concurrentLimit = this.config.enableParallelExecution ?
        Math.min(readyAgents.length, this.config.maxConcurrentAgents) : 1;

      const agentsToExecute = readyAgents.slice(0, concurrentLimit);

      // Execute agents in parallel
      const executionPromises = agentsToExecute.map(execution =>
        this.executeAgent(session, execution)
      );

      await Promise.all(executionPromises);

      completedExecutions += agentsToExecute.length;
      session.progress = Math.round((completedExecutions / totalExecutions) * 100);

      if (this.config.progressReporting) {
        this.log(session.id, `📊 Progress: ${session.progress}% (${completedExecutions}/${totalExecutions})`);
      }
    }
  }

  /**
   * Check if execution is ready (dependencies met)
   */
  private isExecutionReady(execution: AgentExecution, allExecutions: AgentExecution[]): boolean {
    // In this simplified version, all agents are ready
    // In a more complex system, you would check dependencies
    return true;
  }

  /**
   * Execute a single agent
   */
  private async executeAgent(session: ExecutionSession, execution: AgentExecution): Promise<void> {
    execution.status = 'running';
    execution.startTime = new Date();

    this.log(session.id, `🔍 Starting ${execution.agent}: ${execution.task}`);

    try {
      // Simulate agent execution (in real implementation, this would call the actual agent)
      const result = await this.simulateAgentExecution(execution);

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.result = result;
      execution.output = this.formatAgentOutput(execution.agent, result);

      this.log(session.id, `✅ Completed ${execution.agent}`);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : String(error);

      this.log(session.id, `❌ Failed ${execution.agent}: ${execution.error}`);
    }
  }

  /**
   * Simulate agent execution (placeholder for real implementation)
   */
  private async simulateAgentExecution(execution: AgentExecution): Promise<any> {
    // In a real implementation, this would:
    // 1. Load the agent configuration
    // 2. Execute the agent with the task
    // 3. Return the result

    // Simulate processing time
    const processingTime = 2000 + Math.random() * 3000; // 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Return mock result
    return {
      agent: execution.agent,
      task: execution.task,
      analysis: `Analysis completed for ${execution.task}`,
      recommendations: [
        'Recommendation 1',
        'Recommendation 2',
        'Recommendation 3'
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format agent output for display
   */
  private formatAgentOutput(agent: string, result: any): string {
    const agentNames: Record<string, string> = {
      architect: '🏗️ Architect',
      backend: '⚙️ Backend',
      ui: '🎨 UI/UX',
      tester: '🧪 Tester',
      docs: '📚 Docs'
    };

    const agentName = agentNames[agent] || agent;

    return `
${agentName} Analysis
================
Task: ${result.task}
Analysis: ${result.analysis}

Recommendations:
${result.recommendations.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n')}

Completed: ${new Date(result.timestamp).toLocaleString()}
    `.trim();
  }

  /**
   * Log message to session
   */
  private log(sessionId: string, message: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const timestamp = new Date().toLocaleTimeString();
      session.logs.push(`[${timestamp}] ${message}`);
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ExecutionSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): ExecutionSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    return session ? session.status : 'not_found';
  }

  /**
   * Cancel session
   */
  cancelSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'running') {
      session.status = 'cancelled';
      session.endTime = new Date();
      this.log(sessionId, '⚠️  Session cancelled');
      return true;
    }
    return false;
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return 'Session not found';
    }

    const duration = session.endTime ?
      `${Math.round((session.endTime.getTime() - (session.startTime?.getTime() || 0)) / 1000)}s` :
      'In progress';

    const successfulExecutions = session.executions.filter(e => e.status === 'completed').length;
    const failedExecutions = session.executions.filter(e => e.status === 'failed').length;

    return `
🍳 Cook Session Summary
=====================
ID: ${session.id}
Status: ${session.status}
Duration: ${duration}
Progress: ${session.progress}%
Template: ${session.template?.name || 'Custom'}

Executions: ${successfulExecutions} successful, ${failedExecutions} failed

Logs:
${session.logs.slice(-5).join('\n')}
    `.trim();
  }

  /**
   * Get detailed session report
   */
  getSessionReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return 'Session not found';
    }

    const report = [
      '🍳 Detailed Cook Session Report',
      '=================================',
      `ID: ${session.id}`,
      `Command: ${CookCommandParser.formatCommand(session.command)}`,
      `Status: ${session.status}`,
      `Started: ${session.startTime?.toLocaleString()}`,
      `Ended: ${session.endTime?.toLocaleString()}`,
      `Progress: ${session.progress}%`,
      `Template: ${session.template?.name || 'Custom'}`,
      '',
      'Execution Results:',
      '------------------'
    ];

    session.executions.forEach(execution => {
      report.push(`\n${execution.agent}:`);
      report.push(`  Status: ${execution.status}`);
      report.push(`  Task: ${execution.task}`);

      if (execution.startTime) {
        report.push(`  Started: ${execution.startTime.toLocaleString()}`);
      }

      if (execution.endTime) {
        report.push(`  Ended: ${execution.endTime.toLocaleString()}`);
      }

      if (execution.error) {
        report.push(`  Error: ${execution.error}`);
      }

      if (execution.output) {
        report.push(`  Output: ${execution.output.substring(0, 100)}...`);
      }
    });

    report.push('');
    report.push('Logs:');
    report.push('-----');
    report.push(...session.logs);

    return report.join('\n');
  }
}