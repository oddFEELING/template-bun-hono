import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { generateProviderDtoTemplate } from "../templates/provider-dto.template.js";
import { generateProviderTemplate } from "../templates/provider.template.js";
import { generateSchemaTemplate } from "../templates/schema.template.js";
import {
  colors,
  logError,
  logHeader,
  logInfo,
  logSuccess,
} from "../utils/logger.js";
import { promptYesNo } from "../utils/prompt.js";

/**
 * Creates a provider with all necessary files
 * @param {string} providerName - The name of the provider to create
 * @param {string} visibility - Service visibility ('public' or 'private')
 */
export async function createProvider(providerName, visibility = "public") {
  try {
    logHeader(`🚀 Creating provider: ${providerName}`);

    const baseDir = resolve(process.cwd(), "src", "providers", providerName);

    // ~ ======= Check if provider already exists ======= ~
    if (existsSync(baseDir)) {
      logError(`Provider "${providerName}" already exists!`);
      process.exit(1);
    }

    // ~ ======= Create directory structure ======= ~
    logInfo("Creating directory structure...");
    await mkdir(join(baseDir, "interfaces"), { recursive: true });
    logSuccess("Directory structure created");

    // ~ ======= Create provider service file ======= ~
    logInfo(`Creating ${providerName}.service.ts...`);
    await writeFile(
      join(baseDir, `${providerName}.service.ts`),
      generateProviderTemplate(providerName, visibility)
    );
    logSuccess(`${providerName}.service.ts created`);

    // ~ ======= Create DTO file ======= ~
    logInfo(`Creating interfaces/${providerName}.dto.ts...`);
    await writeFile(
      join(baseDir, "interfaces", `${providerName}.dto.ts`),
      generateProviderDtoTemplate(providerName)
    );
    logSuccess(`interfaces/${providerName}.dto.ts created`);

    // ~ ======= Ask if database entity is needed ======= ~
    console.log(""); // Empty line for spacing
    const needsEntity = await promptYesNo(
      `${colors.blue}?${colors.reset} Does this provider need a database entity?`,
      false
    );

    let entityCreated = false;

    if (needsEntity) {
      // Create entities directory
      await mkdir(join(baseDir, "entities"), { recursive: true });

      // Create schema file
      logInfo(`Creating entities/${providerName}.schema.ts...`);
      await writeFile(
        join(baseDir, "entities", `${providerName}.schema.ts`),
        generateSchemaTemplate(providerName)
      );
      logSuccess(`entities/${providerName}.schema.ts created`);
      entityCreated = true;
    }

    // ~ ======= Success message ======= ~
    logHeader(`✨ Provider "${providerName}" created successfully!`);
    console.log(
      `${colors.dim}Location: src/providers/${providerName}${colors.reset}`
    );

    const nextSteps = [
      `Implement integration logic in ${colors.cyan}${providerName}.service.ts${colors.reset}`,
      `Customize types in ${colors.cyan}interfaces/${providerName}.dto.ts${colors.reset}`,
    ];

    if (entityCreated) {
      nextSteps.push(
        `Update the schema in ${colors.cyan}entities/${providerName}.schema.ts${colors.reset}`
      );
    }

    console.log(
      `\n${colors.yellow}Next steps:${colors.reset}\n` +
        nextSteps.map((step, i) => `  ${i + 1}. ${step}`).join("\n") +
        "\n"
    );

    // ~ ======= Ask about migrations (only if entity was created) ======= ~
    if (entityCreated) {
      console.log(""); // Empty line for spacing
      const shouldGenerateMigration = await promptYesNo(
        `${colors.blue}?${colors.reset} Would you like to generate migrations for the database schema?`,
        false
      );

      if (shouldGenerateMigration) {
        logInfo("Generating migrations...");

        try {
          const generateProc = Bun.spawn(["bun", "run", "migration:generate"], {
            cwd: process.cwd(),
            stdout: "inherit",
            stderr: "inherit",
          });

          const exitCode = await generateProc.exited;

          if (exitCode === 0) {
            logSuccess("Migrations generated successfully");

            // Ask about running migrations
            const shouldMigrate = await promptYesNo(
              `${colors.blue}?${colors.reset} Would you like to run the migrations now?`,
              false
            );

            if (shouldMigrate) {
              logInfo("Running migrations...");

              const migrateProc = Bun.spawn(["bun", "run", "migration:run"], {
                cwd: process.cwd(),
                stdout: "inherit",
                stderr: "inherit",
              });

              const migrateExitCode = await migrateProc.exited;

              if (migrateExitCode === 0) {
                logSuccess("Migrations applied successfully");
              } else {
                logError("Failed to apply migrations");
              }
            } else {
              logInfo(
                `You can run migrations later with: ${colors.cyan}bun run migration:run${colors.reset}`
              );
            }
          } else {
            logError("Failed to generate migrations");
          }
        } catch (error) {
          logError(`Migration error: ${error.message}`);
        }
      } else {
        logInfo(
          `You can generate migrations later with: ${colors.cyan}bun run migration:generate${colors.reset}`
        );
      }
    }

    console.log(""); // Empty line for spacing
  } catch (error) {
    logError(`Failed to create provider: ${error.message}`);
    process.exit(1);
  }
}
