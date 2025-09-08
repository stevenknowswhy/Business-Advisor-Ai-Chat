import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("=== TEST AUTH FLOW API START ===");
  
  try {
    // Check auth() function
    const authResult = await auth();
    console.log("Auth result:", authResult);
    
    // Check currentUser() function
    const user = await currentUser();
    console.log("Current user:", user ? {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      fullName: user.fullName
    } : null);
    
    // Check headers for authentication info
    const authHeaders = {
      'x-clerk-auth-status': req.headers.get('x-clerk-auth-status'),
      'x-clerk-auth-reason': req.headers.get('x-clerk-auth-reason'),
      'authorization': req.headers.get('authorization'),
      'cookie': req.headers.get('cookie')?.substring(0, 100) + '...' // Truncate for security
    };
    console.log("Auth headers:", authHeaders);
    
    // Determine authentication status
    const isAuthenticated = authResult.isAuthenticated && user !== null;
    
    return Response.json({
      success: true,
      isAuthenticated,
      authResult: {
        userId: authResult.userId,
        sessionId: authResult.sessionId,
        isAuthenticated: authResult.isAuthenticated
      },
      user: user ? {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        fullName: user.fullName,
        imageUrl: user.imageUrl
      } : null,
      authHeaders,
      message: isAuthenticated 
        ? "User is authenticated and ready to use chat functionality" 
        : "User is not authenticated - sign in required",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Test auth flow error:", error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      message: "Authentication test failed",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
