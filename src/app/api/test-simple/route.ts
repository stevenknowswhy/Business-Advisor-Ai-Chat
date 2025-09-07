import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    console.log("=== SIMPLE TEST ENDPOINT ===");
    console.log("Request received at:", new Date().toISOString());
    
    return Response.json({
      status: "success",
      message: "Simple endpoint working",
      timestamp: new Date().toISOString(),
      runtime: "nodejs",
      url: req.url,
    });
  } catch (error: any) {
    console.error("Simple endpoint error:", error);
    return Response.json({
      status: "error",
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== SIMPLE POST TEST ===");
    const body = await req.json();
    console.log("Body received:", body);
    
    return Response.json({
      status: "success",
      message: "Simple POST working",
      receivedBody: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Simple POST error:", error);
    return Response.json({
      status: "error",
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
