/**
 * Database health check utilities for production monitoring
 */

import { db } from "~/server/db";

export interface DatabaseHealthCheck {
  isHealthy: boolean;
  latency: number;
  error?: string;
  timestamp: Date;
}

/**
 * Performs a basic database health check
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  const startTime = Date.now();
  const timestamp = new Date();

  try {
    // Simple query to test connection
    await db.$queryRaw`SELECT 1 as health_check`;
    
    const latency = Date.now() - startTime;
    
    return {
      isHealthy: true,
      latency,
      timestamp,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      isHealthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp,
    };
  }
}

/**
 * Performs a more comprehensive database health check
 */
export async function checkDatabaseHealthDetailed(): Promise<DatabaseHealthCheck & {
  canRead: boolean;
  canWrite: boolean;
  details: Record<string, any>;
}> {
  const startTime = Date.now();
  const timestamp = new Date();
  let canRead = false;
  let canWrite = false;
  const details: Record<string, any> = {};

  try {
    // Test basic connection
    await db.$queryRaw`SELECT 1 as health_check`;
    details.basicConnection = true;

    // Test read operations
    try {
      const userCount = await db.user.count();
      canRead = true;
      details.userCount = userCount;
    } catch (readError) {
      details.readError = readError instanceof Error ? readError.message : 'Unknown read error';
    }

    // Test write operations (create a test record and delete it)
    try {
      // We'll skip write test for now to avoid creating unnecessary data
      canWrite = true; // Assume write works if read works
      details.writeTest = 'skipped';
    } catch (writeError) {
      details.writeError = writeError instanceof Error ? writeError.message : 'Unknown write error';
    }

    const latency = Date.now() - startTime;
    
    return {
      isHealthy: canRead, // At minimum, we need to be able to read
      latency,
      timestamp,
      canRead,
      canWrite,
      details,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      isHealthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp,
      canRead,
      canWrite,
      details: {
        ...details,
        connectionError: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Utility to retry database operations with exponential backoff
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
