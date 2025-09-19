#!/usr/bin/env node

/**
 * Script to seed team templates for testing
 * Usage: node scripts/seed-team-templates.js
 */

import { ConvexHttpClient } from "convex/http";

// Get the Convex deployment URL from environment or use default
const CONVEX_URL = process.env.CONVEX_URL || "http://localhost:3001";

async function seedTeamTemplates() {
  try {
    console.log("Seeding team templates...");

    const client = new ConvexHttpClient(CONVEX_URL);

    // Call the seed mutation
    const result = await client.mutation("migrations:seedTeamTemplates");

    console.log("Result:", result);

    if (result.success) {
      console.log("✅ Team templates seeded successfully!");

      // Verify the seed worked
      const templates = await client.query("migrations:getTeamTemplatesForDebug");
      console.log(`📋 Found ${templates.count} team templates:`);
      templates.templates.forEach(template => {
        console.log(`   - ${template.name} (${template.category}) ${template.featured ? '⭐' : ''}`);
      });
    } else {
      console.log("⚠️  Team templates seeding failed:", result.message);
    }

  } catch (error) {
    console.error("❌ Error seeding team templates:", error.message);
    process.exit(1);
  }
}

// Run the seed function
seedTeamTemplates();