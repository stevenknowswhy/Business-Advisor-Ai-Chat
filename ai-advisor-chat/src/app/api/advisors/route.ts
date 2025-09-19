import { NextRequest, NextResponse } from "next/server";
import { getActiveAdvisors, formatAdvisorForClient } from "~/server/convex/advisors";
import { getAuth } from '@clerk/nextjs/server';
import { z } from 'zod';

// Validation schema for creating an advisor
const createAdvisorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().min(1, 'Title is required'),
  tagline: z.string().min(1, 'Tagline is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  avatarUrl: z.string().url().optional().nullable(),
  specialties: z.array(z.string()).min(1, 'At least one specialty is required'),
  expertise: z.array(z.string()).min(1, 'At least one area of expertise is required'),
  personalityTraits: z.array(z.string()).min(1, 'At least one personality trait is required'),
  experience: z.string().min(10, 'Experience description must be at least 10 characters'),
  mission: z.string().min(10, 'Mission must be at least 10 characters'),
  scopeIn: z.array(z.string()).min(1, 'At least one "in scope" item is required'),
  scopeOut: z.array(z.string()).min(1, 'At least one "out of scope" item is required'),
  kpis: z.array(z.string()).min(1, 'At least one KPI is required'),
  adviceStyle: z.string().min(1, 'Advice style is required'),
  voice: z.string().min(1, 'Voice/tone is required'),
  schemaVersion: z.string().default('1.0.0'),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

type CreateAdvisorRequest = z.infer<typeof createAdvisorSchema>;

export async function GET(req: NextRequest) {
  console.log("=== ADVISORS API START (CONVEX) ===");
  console.log("Request URL:", req.url);

  try {
    const advisors = await getActiveAdvisors();
    console.log("Retrieved advisors from Convex:", advisors.length);

    // Format advisors for client consumption
    const formattedAdvisors = advisors.map(formatAdvisorForClient);

    return Response.json(formattedAdvisors);

  } catch (error) {
    console.error("=== ADVISORS API ERROR ===");
    console.error("Get advisors error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createAdvisorSchema.parse(body);

    // Here you would typically save to your database
    // For now, we'll simulate creating an advisor and return it

    // Generate a unique ID for the advisor
    const advisorId = `advisor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the advisor object
    const newAdvisor = {
      _id: advisorId,
      ownerId: userId,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: validatedData.schemaVersion || '1.0.0',
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      imageUrl: validatedData.avatarUrl || null,
      title: validatedData.title,
      description: validatedData.tagline,
      // Expertise and specialties
      specialties: validatedData.specialties,
      expertise: validatedData.expertise,
      personalityTraits: validatedData.personalityTraits,
      experience: validatedData.experience,
      // Role and mission
      mission: validatedData.mission,
      scopeIn: validatedData.scopeIn,
      scopeOut: validatedData.scopeOut,
      kpis: validatedData.kpis,
      adviceStyle: validatedData.adviceStyle,
      voice: validatedData.voice,
      // Tags and categorization
      tags: validatedData.tags,
      category: validatedData.tags[0] || 'general', // Use first tag as category
      featured: false, // Custom advisors are not featured by default
      isPublic: true, // Make public so others can see them
      // Rating and engagement (default values)
      rating: 0,
      reviewCount: 0,
      conversationCount: 0,
      // Model configuration
      models: {
        free: 'nvidia/nemotron-nano-9b-v2:free',
        base: 'deepseek/deepseek-chat-v3-0324:free',
        premium: 'deepseek/deepseek-chat-v3.1',
      },
      // Handle for URL-friendly identification
      handle: `${validatedData.firstName.toLowerCase()}-${validatedData.lastName.toLowerCase()}-${Date.now().toString().slice(-4)}`,
    };

    // Here you would save to Convex or your database
    // For now, we'll just return the created advisor
    // In a real implementation, you would do:
    // const result = await ctx.db.insert('advisors').insert(newAdvisor);

    console.log('Creating new advisor:', newAdvisor);

    return NextResponse.json({
      success: true,
      advisor: newAdvisor,
      message: 'Advisor created successfully'
    });

  } catch (error) {
    console.error('Error creating advisor:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create advisor' },
      { status: 500 }
    );
  }
}
