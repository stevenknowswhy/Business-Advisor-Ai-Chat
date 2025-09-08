/**
 * Environment variable validation for authentication
 */

export interface AuthEnvValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    hasClerkPublishableKey: boolean;
    hasClerkSecretKey: boolean;
    hasDatabaseUrl: boolean;
    clerkPublishableKeyFormat: boolean;
    clerkSecretKeyFormat: boolean;
    environment: string;
  };
}

export function validateAuthEnvironment(): AuthEnvValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required environment variables
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Validate Clerk Publishable Key
  const hasClerkPublishableKey = !!clerkPublishableKey;
  if (!hasClerkPublishableKey) {
    errors.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing");
  }

  const clerkPublishableKeyFormat = clerkPublishableKey?.startsWith('pk_test_') || clerkPublishableKey?.startsWith('pk_live_') || false;
  if (hasClerkPublishableKey && !clerkPublishableKeyFormat) {
    errors.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY has invalid format (should start with pk_test_ or pk_live_)");
  }

  // Validate Clerk Secret Key
  const hasClerkSecretKey = !!clerkSecretKey;
  if (!hasClerkSecretKey) {
    errors.push("CLERK_SECRET_KEY is missing");
  }

  const clerkSecretKeyFormat = clerkSecretKey?.startsWith('sk_test_') || clerkSecretKey?.startsWith('sk_live_') || false;
  if (hasClerkSecretKey && !clerkSecretKeyFormat) {
    errors.push("CLERK_SECRET_KEY has invalid format (should start with sk_test_ or sk_live_)");
  }

  // Validate Database URL
  const hasDatabaseUrl = !!databaseUrl;
  if (!hasDatabaseUrl) {
    errors.push("DATABASE_URL is missing");
  }

  // Environment-specific warnings
  if (nodeEnv === 'production') {
    if (clerkPublishableKey?.startsWith('pk_test_')) {
      warnings.push("Using test Clerk keys in production environment");
    }
    if (clerkSecretKey?.startsWith('sk_test_')) {
      warnings.push("Using test Clerk secret key in production environment");
    }
  }

  // Key matching validation
  if (hasClerkPublishableKey && hasClerkSecretKey) {
    const pubKeyEnv = clerkPublishableKey.startsWith('pk_test_') ? 'test' : 'live';
    const secretKeyEnv = clerkSecretKey.startsWith('sk_test_') ? 'test' : 'live';
    
    if (pubKeyEnv !== secretKeyEnv) {
      errors.push("Clerk publishable key and secret key environment mismatch (test vs live)");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      hasClerkPublishableKey,
      hasClerkSecretKey,
      hasDatabaseUrl,
      clerkPublishableKeyFormat,
      clerkSecretKeyFormat,
      environment: nodeEnv,
    },
  };
}

/**
 * Throws an error if authentication environment is not properly configured
 */
export function requireValidAuthEnvironment(): void {
  const validation = validateAuthEnvironment();
  
  if (!validation.isValid) {
    const errorMessage = [
      "Authentication environment validation failed:",
      ...validation.errors.map(error => `  - ${error}`),
      "",
      "Please check your environment variables and ensure they are properly configured.",
    ].join("\n");
    
    throw new Error(errorMessage);
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn("Authentication environment warnings:");
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}
