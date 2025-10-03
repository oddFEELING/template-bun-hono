import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { generateDtoTemplate } from "../templates/dto.template.js";
import { generateOpenApiTemplate } from "../templates/openapi.template.js";
import { generateRoutesIndexTemplate } from "../templates/routes.template.js";
import { generateSchemaTemplate } from "../templates/schema.template.js";
import { generateServiceTemplate } from "../templates/service.template.js";
import { loadApiConfig } from "../utils/config.js";
import {
  colors,
  logError,
  logHeader,
  logInfo,
  logSuccess,
} from "../utils/logger.js";
import { promptYesNo } from "../utils/prompt.js";

/**
 * Creates a module with all necessary files
 * @param {string} moduleName - The name of the module to create
 * @param {string} visibility - Service visibility ('public' or 'private')
 * @param {string} version - API version (defaults to config default)
 */
export async function createModule(
  moduleName,
  visibility = "private",
  version = null
) {
  try {
    const apiConfig = loadApiConfig();
    const moduleVersion = version || apiConfig.defaultVersion;

    logHeader(`🚀 Creating module: ${moduleName} (${moduleVersion})`);

    // Validate version
    if (!apiConfig.availableVersions.includes(moduleVersion)) {
      logError(`Invalid version: ${moduleVersion}`);
      console.log(
        `Available versions: ${apiConfig.availableVersions.join(", ")}`
      );
      process.exit(1);
    }

    const baseDir = resolve(process.cwd(), "src", "modules", moduleName);

    // ~ ======= Check if module already exists ======= ~
    if (existsSync(baseDir)) {
      logError(`Module "${moduleName}" already exists!`);
      process.exit(1);
    }

    // ~ ======= Create directory structure ======= ~
    logInfo("Creating directory structure...");
    await mkdir(join(baseDir, "interfaces"), { recursive: true });
    await mkdir(join(baseDir, "routes"), { recursive: true });
    await mkdir(join(baseDir, "entities"), { recursive: true });
    logSuccess("Directory structure created");

    // ~ ======= Create service file ======= ~
    logInfo(`Creating ${moduleName}.service.ts...`);
    await writeFile(
      join(baseDir, `${moduleName}.service.ts`),
      generateServiceTemplate(moduleName, visibility)
    );
    logSuccess(`${moduleName}.service.ts created`);

    // ~ ======= Create DTO file ======= ~
    logInfo(`Creating interfaces/${moduleName}.dto.ts...`);
    await writeFile(
      join(baseDir, "interfaces", `${moduleName}.dto.ts`),
      generateDtoTemplate(moduleName)
    );
    logSuccess(`interfaces/${moduleName}.dto.ts created`);

    // ~ ======= Create routes index file ======= ~
    logInfo("Creating routes/index.ts...");
    await writeFile(
      join(baseDir, "routes", "index.ts"),
      generateRoutesIndexTemplate(moduleName, moduleVersion)
    );
    logSuccess("routes/index.ts created");

    // ~ ======= Create OpenAPI routes file ======= ~
    logInfo(`Creating routes/${moduleName}.openapi.ts...`);
    await writeFile(
      join(baseDir, "routes", `${moduleName}.openapi.ts`),
      generateOpenApiTemplate(moduleName)
    );
    logSuccess(`routes/${moduleName}.openapi.ts created`);

    // ~ ======= Create schema file ======= ~
    logInfo(`Creating entities/${moduleName}.schema.ts...`);
    await writeFile(
      join(baseDir, "entities", `${moduleName}.schema.ts`),
      generateSchemaTemplate(moduleName)
    );
    logSuccess(`entities/${moduleName}.schema.ts created`);

    // ~ ======= Success message ======= ~
    logHeader(`✨ Module "${moduleName}" created successfully!`);
    console.log(
      `${colors.dim}Location: src/modules/${moduleName}${colors.reset}`
    );
    console.log(
      `\n${colors.yellow}Next steps:${colors.reset}\n` +
        `  1. Update the schema in ${colors.cyan}entities/${moduleName}.schema.ts${colors.reset}\n` +
        `  2. Customize DTOs in ${colors.cyan}interfaces/${moduleName}.dto.ts${colors.reset}\n` +
        `  3. Implement business logic in ${colors.cyan}${moduleName}.service.ts${colors.reset}\n` +
        `  4. Run ${colors.cyan}bun dev${colors.reset} - Routes auto-register at ${colors.green}${apiConfig.prefix}/${moduleVersion}/${moduleName}${colors.reset}\n`
    );

    // ~ ======= Ask about migrations ======= ~
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
              `You can run migrations later with: ${colors.cyan}bun run migration:migrate${colors.reset}`
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

    console.log(""); // Empty line for spacing
  } catch (error) {
    logError(`Failed to create module: ${error.message}`);
    process.exit(1);
  }
}
