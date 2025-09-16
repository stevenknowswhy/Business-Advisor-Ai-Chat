import { db } from "~/server/db";
import type { Advisor } from "@prisma/client";

/**
 * Get all active advisors
 * TEMPORARY: Using mock data while database is down
 */
export async function getActiveAdvisors(): Promise<Advisor[]> {
  // TODO: Re-enable database when connection is fixed
  // return db.advisor.findMany({
  //   where: {
  //     status: "active",
  //   },
  //   orderBy: {
  //     createdAt: "asc",
  //   },
  // });

  // Return mock data for now
  const mockAdvisors: Advisor[] = [
    {
      id: "1",
      firstName: "Investment",
      lastName: "Advisor",
      status: "active",
      schemaVersion: "1.0",
      imageUrl: null,
      persona: {
        name: "Marcus Wellington",
        title: "Senior Investment Strategist",
        description: "Building wealth through strategic investment decisions",
        personality: ["analytical", "methodical", "trustworthy", "detail-oriented"],
        expertise: ["Portfolio Management", "Risk Assessment", "Retirement Planning", "Tax-Efficient Investing"]
      },
      roleDefinition: {
        role: "Investment Advisor",
        responsibilities: ["Portfolio management", "Risk assessment", "Financial planning"],
        constraints: ["Must follow regulatory guidelines", "Cannot provide specific stock recommendations"]
      },
      components: [],
      metadata: {
        version: "1.0",
        author: "System",
        category: "Finance"
      },
      localization: {
        language: "en",
        region: "US"
      },
      modelHint: "x-ai/grok-code-fast-1",
      tags: ["investment", "finance", "portfolio"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      firstName: "Tech",
      lastName: "Advisor",
      status: "active",
      schemaVersion: "1.0",
      imageUrl: null,
      persona: {
        name: "Dr. Sarah Chen",
        title: "Chief Technology Strategist",
        description: "Transforming businesses through strategic technology adoption",
        personality: ["visionary", "pragmatic", "innovative", "analytical"],
        expertise: ["Software Architecture", "AI/ML Strategy", "Digital Transformation", "Team Building"]
      },
      roleDefinition: {
        role: "Technology Advisor",
        responsibilities: ["Technology strategy", "Digital transformation", "Team building"],
        constraints: ["Must consider business impact", "Focus on scalable solutions"]
      },
      components: [],
      metadata: {
        version: "1.0",
        author: "System",
        category: "Technology"
      },
      localization: {
        language: "en",
        region: "US"
      },
      modelHint: "x-ai/grok-code-fast-1",
      tags: ["technology", "software", "ai", "strategy"],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  return mockAdvisors;
}

/**
 * Get advisor by ID
 */
export async function getAdvisorById(id: string): Promise<Advisor | null> {
  return db.advisor.findUnique({
    where: { id },
  });
}

/**
 * Get advisor persona data with type safety
 */
export function getAdvisorPersona(advisor: Advisor) {
  const persona = advisor.persona as any;

  return {
    id: advisor.id,
    name: persona.name,
    title: persona.title,
    image: persona.image,
    oneLiner: persona.oneLiner,
    archetype: persona.archetype,
    temperament: persona.temperament,
    coreBeliefsOrPrinciples: persona.coreBeliefsOrPrinciples,
    bio: persona.bio,
    detailedBackground: persona.detailedBackground,
    experience: persona.experience,
    specialties: persona.specialties,
    personalInterests: persona.personalInterests,
    communicationStyle: persona.communicationStyle,
    education: persona.education,
    location: persona.location,
    adviceDelivery: persona.adviceDelivery,
  };
}

/**
 * Get advisor role definition
 */
export function getAdvisorRole(advisor: Advisor) {
  const roleDefinition = advisor.roleDefinition as any;
  
  return {
    mission: roleDefinition?.mission,
    scope: roleDefinition?.scope,
    keyPerformanceIndicators: roleDefinition?.keyPerformanceIndicators,
  };
}

/**
 * Get advisor components configuration
 */
export function getAdvisorComponents(advisor: Advisor) {
  return advisor.components as any[];
}

/**
 * Get advisor metadata
 */
export function getAdvisorMetadata(advisor: Advisor) {
  const metadata = advisor.metadata as any;
  
  return {
    version: metadata?.version,
    tags: advisor.tags,
    modelHint: advisor.modelHint,
  };
}

/**
 * Format advisor for client-side use
 */
export function formatAdvisorForClient(advisor: Advisor) {
  const persona = getAdvisorPersona(advisor);
  const role = getAdvisorRole(advisor);
  const metadata = getAdvisorMetadata(advisor);

  return {
    id: advisor.id,
    name: persona.name,
    title: persona.title,
    image: persona.image,
    oneLiner: persona.oneLiner,
    archetype: persona.archetype,
    bio: persona.bio,
    detailedBackground: persona.detailedBackground,
    experience: persona.experience,
    specialties: persona.specialties,
    personalInterests: persona.personalInterests,
    communicationStyle: persona.communicationStyle,
    location: persona.location,
    adviceDelivery: persona.adviceDelivery,
    mission: role.mission,
    tags: metadata.tags,
    modelHint: metadata.modelHint,
  };
}
