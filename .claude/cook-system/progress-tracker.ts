/**
 * Progress Tracker for /cook Command System
 * Provides real-time progress monitoring and reporting
 */

import { ExecutionSession, AgentExecution } from './team-coordinator';

export interface ProgressUpdate {
  sessionId: string;
  timestamp: Date;
  progress: number;
  status: string;
  currentAgent?: string;
  message: string;
  estimatedTimeRemaining?: number;
}

export interface ProgressMetrics {
  sessionId: string;
  startTime: Date;
  estimatedDuration: number;
  actualDuration?: number;
  progress: number;
  agentsCompleted: number;
  agentsTotal: number;
  successRate: number;
  averageExecutionTime: number;
}

export class ProgressTracker {
  private sessions: Map<string, ProgressMetrics> = new Map();
  private subscribers: Map<string, ((update: ProgressUpdate) => void)[]> = new Map();
  private updateInterval: number = 1000; // 1 second
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start tracking a session
   */
  startTracking(session: ExecutionSession, estimatedDuration: number = 300000): void {
    const metrics: ProgressMetrics = {
      sessionId: session.id,
      startTime: session.startTime!,
      estimatedDuration,
      progress: session.progress,
      agentsCompleted: 0,
      agentsTotal: session.executions.length,
      successRate: 0,
      averageExecutionTime: 0
    };

    this.sessions.set(session.id, metrics);
    this.startProgressUpdates(session.id);
  }

  /**
   * Stop tracking a session
   */
  stopTracking(sessionId: string): void {
    const interval = this.intervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(sessionId);
    }

    // Final update
    this.publishUpdate(sessionId, {
      sessionId,
      timestamp: new Date(),
      progress: 100,
      status: 'completed',
      message: 'Session completed'
    });
  }

  /**
   * Update session progress
   */
  updateProgress(session: ExecutionSession): void {
    const metrics = this.sessions.get(session.id);
    if (!metrics) return;

    // Calculate progress
    const completedAgents = session.executions.filter(e => e.status === 'completed').length;
    const successfulAgents = session.executions.filter(e => e.status === 'completed' && !e.error).length;
    const totalAgents = session.executions.length;

    metrics.progress = session.progress;
    metrics.agentsCompleted = completedAgents;
    metrics.agentsTotal = totalAgents;
    metrics.successRate = totalAgents > 0 ? (successfulAgents / totalAgents) * 100 : 0;

    // Calculate average execution time
    const completedExecutions = session.executions.filter(e => e.status === 'completed' && e.startTime && e.endTime);
    if (completedExecutions.length > 0) {
      const totalTime = completedExecutions.reduce((sum, exec) => {
        return sum + (exec.endTime!.getTime() - exec.startTime!.getTime());
      }, 0);
      metrics.averageExecutionTime = totalTime / completedExecutions.length;
    }

    // Find current running agent
    const runningAgent = session.executions.find(e => e.status === 'running');

    // Calculate estimated time remaining
    const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(metrics, runningAgent);

    // Publish update
    this.publishUpdate(session.id, {
      sessionId: session.id,
      timestamp: new Date(),
      progress: session.progress,
      status: session.status,
      currentAgent: runningAgent?.agent,
      message: this.generateProgressMessage(session, metrics, runningAgent),
      estimatedTimeRemaining
    });
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTimeRemaining(metrics: ProgressMetrics, runningAgent?: AgentExecution): number {
    if (metrics.progress >= 100) return 0;

    const elapsedTime = Date.now() - metrics.startTime.getTime();
    const totalEstimatedTime = elapsedTime / (metrics.progress / 100);
    const remainingTime = totalEstimatedTime - elapsedTime;

    // Adjust for running agent
    if (runningAgent && metrics.averageExecutionTime > 0) {
      const agentRemainingTime = metrics.averageExecutionTime * 0.7; // Assume 70% complete
      return Math.max(remainingTime, agentRemainingTime);
    }

    return Math.max(0, remainingTime);
  }

  /**
   * Generate progress message
   */
  private generateProgressMessage(session: ExecutionSession, metrics: ProgressMetrics, runningAgent?: AgentExecution): string {
    const { progress, agentsCompleted, agentsTotal, successRate } = metrics;

    if (session.status === 'completed') {
      return `✅ All ${agentsTotal} agents completed successfully`;
    }

    if (session.status === 'failed') {
      return `❌ Session failed with ${agentsTotal - agentsCompleted} agents remaining`;
    }

    if (runningAgent) {
      return `🔍 ${runningAgent.agent} is working... (${progress}% complete, ${agentsCompleted}/${agentsTotal} agents)`;
    }

    return `📊 ${progress}% complete (${agentsCompleted}/${agentsTotal} agents, ${Math.round(successRate)}% success rate)`;
  }

  /**
   * Subscribe to progress updates
   */
  subscribe(sessionId: string, callback: (update: ProgressUpdate) => void): void {
    if (!this.subscribers.has(sessionId)) {
      this.subscribers.set(sessionId, []);
    }
    this.subscribers.get(sessionId)!.push(callback);
  }

  /**
   * Unsubscribe from progress updates
   */
  unsubscribe(sessionId: string, callback: (update: ProgressUpdate) => void): void {
    const subscribers = this.subscribers.get(sessionId);
    if (subscribers) {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  /**
   * Publish progress update
   */
  private publishUpdate(sessionId: string, update: ProgressUpdate): void {
    const subscribers = this.subscribers.get(sessionId);
    if (subscribers) {
      subscribers.forEach(callback => callback(update));
    }
  }

  /**
   * Start progress updates interval
   */
  private startProgressUpdates(sessionId: string): void {
    const interval = setInterval(() => {
      // This would be called by the coordinator when session updates
      // For now, we'll just simulate progress updates
    }, this.updateInterval);

    this.intervals.set(sessionId, interval);
  }

  /**
   * Get progress metrics for session
   */
  getMetrics(sessionId: string): ProgressMetrics | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get current progress for session
   */
  getCurrentProgress(sessionId: string): number {
    const metrics = this.sessions.get(sessionId);
    return metrics ? metrics.progress : 0;
  }

  /**
   * Format progress for display
   */
  formatProgress(sessionId: string): string {
    const metrics = this.sessions.get(sessionId);
    if (!metrics) return 'No progress data available';

    const { progress, agentsCompleted, agentsTotal, successRate, startTime, averageExecutionTime } = metrics;
    const elapsedTime = Date.now() - startTime.getTime();
    const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(metrics);

    return `
📊 Progress Report
=================
Session: ${sessionId}
Progress: ${progress}%
Agents: ${agentsCompleted}/${agentsTotal} completed
Success Rate: ${Math.round(successRate)}%
Time Elapsed: ${this.formatDuration(elapsedTime)}
Time Remaining: ${this.formatDuration(estimatedTimeRemaining)}
Avg. Agent Time: ${this.formatDuration(averageExecutionTime)}
    `.trim();
  }

  /**
   * Format duration for display
   */
  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (milliseconds < 60000) return `${Math.round(milliseconds / 1000)}s`;
    if (milliseconds < 3600000) return `${Math.round(milliseconds / 60000)}m`;
    return `${Math.round(milliseconds / 3600000)}h`;
  }

  /**
   * Generate progress bar
   */
  generateProgressBar(sessionId: string, width: number = 50): string {
    const metrics = this.sessions.get(sessionId);
    if (!metrics) return 'No progress data';

    const progress = Math.round(metrics.progress);
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentage = progress.toString().padStart(3);

    return `Progress: [${bar}] ${percentage}%`;
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string): string {
    const metrics = this.sessions.get(sessionId);
    if (!metrics) return 'Session not found';

    const { progress, agentsCompleted, agentsTotal, successRate, startTime } = metrics;
    const elapsedTime = Date.now() - startTime.getTime();

    return `
🍳 Session Summary
==================
ID: ${sessionId}
Status: ${progress === 100 ? 'Completed' : 'In Progress'}
Progress: ${progress}%
Agents: ${agentsCompleted}/${agentsTotal} completed
Success Rate: ${Math.round(successRate)}%
Duration: ${this.formatDuration(elapsedTime)}
    `.trim();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(sessionId: string): string {
    const metrics = this.sessions.get(sessionId);
    if (!metrics) return 'Session not found';

    const { averageExecutionTime, successRate, agentsCompleted, agentsTotal, startTime } = metrics;
    const elapsedTime = Date.now() - startTime.getTime();
    const throughput = agentsCompleted > 0 ? elapsedTime / agentsCompleted : 0;

    return `
📈 Performance Metrics
====================
Session: ${sessionId}
Throughput: ${this.formatDuration(throughput)} per agent
Avg. Execution Time: ${this.formatDuration(averageExecutionTime)}
Success Rate: ${Math.round(successRate)}%
Total Agents: ${agentsTotal}
Completed Agents: ${agentsCompleted}
Total Duration: ${this.formatDuration(elapsedTime)}
    `.trim();
  }

  /**
   * Export session data
   */
  exportSessionData(sessionId: string): string {
    const metrics = this.sessions.get(sessionId);
    if (!metrics) return 'Session not found';

    return JSON.stringify({
      sessionId: metrics.sessionId,
      startTime: metrics.startTime.toISOString(),
      estimatedDuration: metrics.estimatedDuration,
      actualDuration: Date.now() - metrics.startTime.getTime(),
      progress: metrics.progress,
      agentsCompleted: metrics.agentsCompleted,
      agentsTotal: metrics.agentsTotal,
      successRate: metrics.successRate,
      averageExecutionTime: metrics.averageExecutionTime,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Clean up old sessions
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.sessions.forEach((metrics, sessionId) => {
      if (now - metrics.startTime.getTime() > maxAge) {
        toDelete.push(sessionId);
      }
    });

    toDelete.forEach(sessionId => {
      this.stopTracking(sessionId);
      this.sessions.delete(sessionId);
      this.subscribers.delete(sessionId);
    });
  }
}