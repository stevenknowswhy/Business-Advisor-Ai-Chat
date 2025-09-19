/**
 * /cook Command System - Main Entry Point
 * Orchestrates sub-agent teams for project execution
 */

import { CookCommandParser, CookCommand, CookOptions } from './command-parser';
import { TeamCoordinator } from './team-coordinator';
import { ProgressTracker } from './progress-tracker';
import { TemplateManager, ProjectTemplate } from './templates';

export class CookSystem {
  private coordinator: TeamCoordinator;
  private tracker: ProgressTracker;
  private parser: CookCommandParser;

  constructor() {
    this.coordinator = new TeamCoordinator();
    this.tracker = new ProgressTracker();
    this.parser = new CookCommandParser();
  }

  /**
   * Execute a cook command
   */
  async execute(input: string): Promise<string> {
    try {
      // Parse the command
      const parseResult = CookCommandParser.parse(input);

      if (!parseResult.isValid) {
        return this.formatError(parseResult.error || 'Invalid command');
      }

      const command = parseResult.command!;

      // Handle special commands
      if (command.taskDescription === 'help') {
        return this.showHelp();
      }

      if (command.taskDescription === 'list') {
        return this.listTemplates();
      }

      // Execute the command
      const session = await this.coordinator.executeCommand(command);

      // Start progress tracking
      this.tracker.startTracking(session);

      // Subscribe to progress updates
      const progressUpdates: string[] = [];
      this.tracker.subscribe(session.id, (update) => {
        progressUpdates.push(this.formatProgressUpdate(update));
      });

      // Wait for completion and return summary
      const result = await this.waitForCompletion(session);

      // Stop tracking
      this.tracker.stopTracking(session.id);

      return result;

    } catch (error) {
      return this.formatError(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Wait for session completion
   */
  private async waitForCompletion(session: any): Promise<string> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const updatedSession = this.coordinator.getSession(session.id);
        if (updatedSession && updatedSession.status !== 'running') {
          clearInterval(checkInterval);
          resolve(this.formatSessionResult(updatedSession));
        }
      }, 1000);
    });
  }

  /**
   * Format session result
   */
  private formatSessionResult(session: any): string {
    const successfulExecutions = session.executions.filter((e: any) => e.status === 'completed').length;
    const failedExecutions = session.executions.filter((e: any) => e.status === 'failed').length;

    return `
🍳 Cook Command Complete
=======================
Command: ${CookCommandParser.formatCommand(session.command)}
Status: ${session.status}
Duration: ${this.formatDuration(session.startTime, session.endTime)}
Results: ${successfulExecutions} successful, ${failedExecutions} failed

Execution Summary:
${this.formatExecutionSummary(session.executions)}

${this.tracker.getSessionSummary(session.id)}
    `.trim();
  }

  /**
   * Format execution summary
   */
  private formatExecutionSummary(executions: any[]): string {
    return executions.map((execution) => {
      const icon = execution.status === 'completed' ? '✅' : execution.status === 'failed' ? '❌' : '⏳';
      return `${icon} ${execution.agent}: ${execution.task}`;
    }).join('\n');
  }

  /**
   * Format progress update
   */
  private formatProgressUpdate(update: any): string {
    const time = update.timestamp.toLocaleTimeString();
    const progress = update.progress.toString().padStart(3);
    const current = update.currentAgent ? ` (${update.currentAgent})` : '';
    return `[${time}] ${progress}%${current} - ${update.message}`;
  }

  /**
   * Show help
   */
  private showHelp(): string {
    return CookCommandParser.getHelpText();
  }

  /**
   * List templates
   */
  private listTemplates(): string {
    const templates = TemplateManager.getAllTemplates();

    return `
📋 Available Templates
=====================
${templates.map(template => `
${template.name}
  Description: ${template.description}
  Duration: ${template.estimatedDuration}
  Tags: ${template.tags.join(', ')}
`).join('\n')}

Usage: /cook --template=<template-name> "your task"
    `.trim();
  }

  /**
   * Format error
   */
  private formatError(error: string): string {
    return `❌ Error: ${error}`;
  }

  /**
   * Format duration
   */
  private formatDuration(start: Date, end?: Date): string {
    const duration = (end?.getTime() || Date.now()) - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Get system status
   */
  getStatus(): string {
    const sessions = this.coordinator.getAllSessions();
    const activeSessions = sessions.filter(s => s.status === 'running');
    const completedSessions = sessions.filter(s => s.status === 'completed');

    return `
🍳 Cook System Status
=====================
Active Sessions: ${activeSessions.length}
Completed Sessions: ${completedSessions.length}
Total Sessions: ${sessions.length}

Available Agents: architect, backend, ui, tester, docs
Available Templates: ${TemplateManager.getAllTemplates().length}
    `.trim();
  }

  /**
   * Get session details
   */
  getSession(sessionId: string): string {
    const session = this.coordinator.getSession(sessionId);
    if (!session) {
      return 'Session not found';
    }

    return this.coordinator.getSessionReport(sessionId);
  }

  /**
   * Cancel session
   */
  cancelSession(sessionId: string): string {
    const success = this.coordinator.cancelSession(sessionId);
    return success ? 'Session cancelled' : 'Session not found or not running';
  }
}

// Export for use
export { CookCommandParser, TeamCoordinator, ProgressTracker, TemplateManager };
export type { CookCommand, CookOptions, ProjectTemplate };

// Global instance for easy use
const cookSystem = new CookSystem();

// Command line interface
if (typeof process !== 'undefined' && process.argv) {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const command = args.join(' ');
    cookSystem.execute(command)
      .then(result => console.log(result))
      .catch(error => console.error('Error:', error));
  }
}

export default cookSystem;