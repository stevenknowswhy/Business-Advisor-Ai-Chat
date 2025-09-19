import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Payments API - Service temporarily unavailable during development',
    timestamp: Date.now(),
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Payments API - Service temporarily unavailable during development',
    timestamp: Date.now(),
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Payments API - Service temporarily unavailable during development',
    timestamp: Date.now(),
  });
}