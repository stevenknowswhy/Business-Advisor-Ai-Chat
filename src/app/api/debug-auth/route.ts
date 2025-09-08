import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("=== DEBUG AUTH API START ===");
  
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
    
    // Check headers
    const headers = Object.fromEntries(req.headers.entries());
    console.log("Request headers:", headers);
    
    return Response.json({
      success: true,
      auth: authResult,
      user: user ? {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        fullName: user.fullName,
        imageUrl: user.imageUrl
      } : null,
      headers: headers,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Debug auth error:", error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
