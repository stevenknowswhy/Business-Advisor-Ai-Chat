import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("=== CLERK DIAGNOSTIC API START ===");
  
  try {
    // Check environment variables
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    console.log("Environment variables check:");
    console.log("- CLERK_SECRET_KEY present:", !!clerkSecretKey);
    console.log("- CLERK_SECRET_KEY format:", clerkSecretKey?.substring(0, 10) + "...");
    console.log("- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY present:", !!clerkPublishableKey);
    console.log("- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY format:", clerkPublishableKey?.substring(0, 10) + "...");
    
    // Decode the publishable key to see what it contains
    let decodedPublishableKey = null;
    if (clerkPublishableKey) {
      try {
        // Remove pk_test_ prefix and decode
        const base64Part = clerkPublishableKey.replace('pk_test_', '');
        decodedPublishableKey = Buffer.from(base64Part, 'base64').toString('utf-8');
        console.log("- Decoded publishable key:", decodedPublishableKey);
      } catch (decodeError) {
        console.log("- Failed to decode publishable key:", decodeError);
      }
    }
    
    // Check if keys follow proper Clerk format
    const isValidSecretKey = clerkSecretKey?.startsWith('sk_test_') || clerkSecretKey?.startsWith('sk_live_');
    const isValidPublishableKey = clerkPublishableKey?.startsWith('pk_test_') || clerkPublishableKey?.startsWith('pk_live_');
    
    // Try to make a basic Clerk API call to validate the keys
    let clerkApiTest = null;
    if (clerkSecretKey && isValidSecretKey) {
      try {
        const response = await fetch('https://api.clerk.com/v1/users', {
          headers: {
            'Authorization': `Bearer ${clerkSecretKey}`,
            'Content-Type': 'application/json'
          }
        });
        clerkApiTest = {
          status: response.status,
          statusText: response.statusText,
          success: response.ok
        };
        console.log("Clerk API test result:", clerkApiTest);
      } catch (apiError) {
        clerkApiTest = {
          error: apiError instanceof Error ? apiError.message : 'Unknown error'
        };
        console.log("Clerk API test error:", clerkApiTest);
      }
    }
    
    return Response.json({
      success: true,
      environment: {
        hasSecretKey: !!clerkSecretKey,
        hasPublishableKey: !!clerkPublishableKey,
        secretKeyFormat: clerkSecretKey?.substring(0, 15) + "...",
        publishableKeyFormat: clerkPublishableKey?.substring(0, 15) + "...",
        decodedPublishableKey,
        isValidSecretKey,
        isValidPublishableKey
      },
      clerkApiTest,
      diagnosis: {
        keysPresent: !!clerkSecretKey && !!clerkPublishableKey,
        keysValidFormat: isValidSecretKey && isValidPublishableKey,
        publishableKeyIssue: decodedPublishableKey ? "Publishable key appears to be base64 encoded domain name instead of proper Clerk key" : null,
        recommendation: !isValidPublishableKey ? "Need to create new Clerk application and get proper keys" : "Keys appear valid"
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Clerk diagnostic error:", error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
