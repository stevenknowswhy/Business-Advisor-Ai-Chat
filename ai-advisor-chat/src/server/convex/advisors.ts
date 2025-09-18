import { getActiveAdvisors, getAdvisorById } from "./client";

/**
 * Convex-based advisor utilities
 * These replace the Prisma-based functions in ~/server/advisors/persona.ts
 */

/**
 * Get advisor persona data with type safety
 */
export function getAdvisorPersona(advisor: any) {
  const persona = advisor.persona;

  return {
    id: advisor._id,
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
export function getAdvisorRole(advisor: any) {
  const roleDefinition = advisor.roleDefinition;
  
  return {
    mission: roleDefinition?.mission,
    scope: roleDefinition?.scope,
    keyPerformanceIndicators: roleDefinition?.keyPerformanceIndicators,
  };
}

/**
 * Get advisor components configuration
 */
export function getAdvisorComponents(advisor: any) {
  return advisor.components || [];
}

/**
 * Get advisor metadata
 */
export function getAdvisorMetadata(advisor: any) {
  const metadata = advisor.metadata;
  
  return {
    version: metadata?.version,
    tags: advisor.tags || [],
    modelHint: advisor.modelHint,
  };
}

/**
 * Format advisor for client-side use
 * This maintains the same interface as the Prisma version
 */
export function formatAdvisorForClient(advisor: any) {
  const persona = getAdvisorPersona(advisor);
  const role = getAdvisorRole(advisor);
  const metadata = getAdvisorMetadata(advisor);

  return {
    id: advisor._id,
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
    location: persona.location || { city: "Remote", region: "Global" },
    adviceDelivery: persona.adviceDelivery || { mode: "conversational", formality: "professional", signOff: "Best regards" },
    mission: role.mission,
    tags: metadata.tags,
    modelHint: metadata.modelHint,
  };
}

// Re-export the client functions for convenience
export { getActiveAdvisors, getAdvisorById };
