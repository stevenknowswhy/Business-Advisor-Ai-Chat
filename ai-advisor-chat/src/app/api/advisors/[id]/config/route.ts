import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const advisorId = params.id;

    // Load advisor configuration
    const configPath = path.join(process.cwd(), 'prisma', 'advisors', `${advisorId}.json`);
    let configData;

    try {
      configData = await fs.readFile(configPath, 'utf-8');
    } catch (error) {
      return NextResponse.json(
        { error: 'Advisor configuration not found' },
        { status: 404 }
      );
    }

    const config = JSON.parse(configData);

    // Extract only the model configuration and essential advisor info
    const response = {
      advisorId: config.advisorId,
      status: config.status,
      modelConfiguration: config.modelConfiguration || null,
      persona: {
        name: config.persona?.name,
        title: config.persona?.title,
        category: config.modelConfiguration?.category || 'General'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`Error fetching configuration for advisor ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}