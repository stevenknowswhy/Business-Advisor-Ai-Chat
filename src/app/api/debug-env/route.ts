import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      OPENROUTER_API_KEY_SET: !!process.env.OPENROUTER_API_KEY,
      OPENROUTER_API_KEY_LENGTH: process.env.OPENROUTER_API_KEY?.length || 0,
      APP_URL: process.env.APP_URL,
      OPENROUTER_FREE_MODEL: process.env.OPENROUTER_FREE_MODEL,
      OPENROUTER_BASE_MODEL: process.env.OPENROUTER_BASE_MODEL,
      OPENROUTER_PREMIUM_MODEL: process.env.OPENROUTER_PREMIUM_MODEL,
      CLERK_SECRET_KEY_SET: !!process.env.CLERK_SECRET_KEY,
      CLERK_SECRET_KEY_LENGTH: process.env.CLERK_SECRET_KEY?.length || 0,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      ALL_OPENROUTER_VARS: Object.keys(process.env).filter(k => k.includes('OPENROUTER')),
      ALL_CLERK_VARS: Object.keys(process.env).filter(k => k.includes('CLERK')),
    };

    return Response.json(envCheck, { status: 200 });
  } catch (error: any) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
