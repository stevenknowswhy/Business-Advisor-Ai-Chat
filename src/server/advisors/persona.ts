import { db } from "~/server/db";
import type { Advisor } from "@prisma/client";

/**
 * Get all active advisors
 */
export async function getActiveAdvisors(): Promise<Advisor[]> {
  return db.advisor.findMany({
    where: {
      status: "active",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
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
