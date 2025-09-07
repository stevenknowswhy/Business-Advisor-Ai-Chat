import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Load advisor JSON files
  const advisorsDir = path.join(__dirname, "advisors");
  const advisorFiles = fs.readdirSync(advisorsDir).filter(file => file.endsWith(".json"));

  console.log(`📁 Found ${advisorFiles.length} advisor files`);

  for (const file of advisorFiles) {
    const filePath = path.join(advisorsDir, file);
    const advisorData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    console.log(`👤 Seeding advisor: ${advisorData.persona.name}`);

    await prisma.advisor.upsert({
      where: { id: advisorData.advisorId },
      update: {
        schemaVersion: advisorData.advisorSchemaVersion,
        status: advisorData.status,
        persona: advisorData.persona,
        roleDefinition: advisorData.roleDefinition,
        components: advisorData.components,
        metadata: advisorData.metadata,
        localization: advisorData.localization,
        modelHint: advisorData.modelHint || null,
        tags: advisorData.metadata?.tags || [],
      },
      create: {
        id: advisorData.advisorId,
        schemaVersion: advisorData.advisorSchemaVersion,
        status: advisorData.status,
        persona: advisorData.persona,
        roleDefinition: advisorData.roleDefinition,
        components: advisorData.components,
        metadata: advisorData.metadata,
        localization: advisorData.localization,
        modelHint: advisorData.modelHint || null,
        tags: advisorData.metadata?.tags || [],
      },
    });

    console.log(`✅ Seeded advisor: ${advisorData.persona.name} (${advisorData.advisorId})`);
  }

  console.log("🎉 Database seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
