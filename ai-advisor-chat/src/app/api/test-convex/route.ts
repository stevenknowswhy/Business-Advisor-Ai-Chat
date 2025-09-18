import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  console.log("=== TEST CONVEX API START ===");
  
  try {
    // Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return Response.json({ error: "NEXT_PUBLIC_CONVEX_URL not set" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    
    // Test query
    const advisors = await convex.query(api.advisors.getActiveAdvisors);
    
    console.log("Retrieved advisors:", advisors.length);
    
    return Response.json({ 
      success: true, 
      count: advisors.length,
      advisors: advisors.map(a => ({ id: a._id, name: a.persona?.name }))
    });

  } catch (error) {
    console.error("Test Convex error:", error);
    return Response.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
