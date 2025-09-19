import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') || 'free';
    const advisorId = params.id;

    // Validate tier parameter
    if (!['free', 'regular', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier parameter' },
        { status: 400 }
      );
    }

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
    const modelConfig = config.modelConfiguration;

    if (!modelConfig || !modelConfig.tierAvailability) {
      // Return default models if no specific configuration
      const defaultModels = {
        free: [
          'anthropic/claude-3-haiku',
          'openai/gpt-3.5-turbo'
        ],
        regular: [
          'anthropic/claude-3-haiku',
          'openai/gpt-3.5-turbo',
          'anthropic/claude-3-sonnet',
          'meta/llama-2-70b-chat'
        ],
        pro: [
          'anthropic/claude-3-haiku',
          'openai/gpt-3.5-turbo',
          'anthropic/claude-3-sonnet',
          'meta/llama-2-70b-chat',
          'anthropic/claude-3-opus',
          'openai/gpt-4-turbo'
        ]
      };

      return NextResponse.json({
        models: defaultModels[tier as keyof typeof defaultModels] || defaultModels.free,
        advisorId,
        tier,
        usingDefaults: true
      });
    }

    const models = modelConfig.tierAvailability[tier as keyof typeof modelConfig.tierAvailability] || [];

    return NextResponse.json({
      models,
      advisorId,
      tier,
      category: modelConfig.category,
      usingDefaults: false
    });

  } catch (error) {
    console.error(`Error fetching models for advisor ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}