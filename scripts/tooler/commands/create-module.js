import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { generateCreateDtoTemplate } from "../templates/dtos/create-dto.template.js";
import { generateDeleteDtoTemplate } from "../templates/dtos/delete-dto.template.js";
import { generateDtoTemplate } from "../templates/dtos/dto.template.js";
import { generateGetDtoTemplate } from "../templates/dtos/get-dto.template.js";
import { generateListDtoTemplate } from "../templates/dtos/list-dto.template.js";
import { generateUpdateDtoTemplate } from "../templates/dtos/update-dto.template.js";
import { generateOpenApiTemplate } from "../templates/openapi.template.js";
import { generateRoutesIndexTemplate } from "../templates/routes.template.js";
import { generateSchemaTemplate } from "../templates/schema.template.js";
import { generateServiceTemplate } from "../templates/service.template.js";
import { generateSimpleDtoTemplate } from "../templates/simple-dto.template.js";
import { generateSimpleOpenApiTemplate } from "../templates/simple-openapi.template.js";
import { generateSimpleRouteTemplate } from "../templates/simple-route.template.js";
import { generateSimpleServiceTemplate } from "../templates/simple-service.template.js";
import { loadApiConfig } from "../utils/config.js";
import {
	colors,
	logError,
	logHeader,
	logInfo,
	logSuccess,
} from "../utils/logger.js";
import { promptYesNo } from "../utils/prompt.js";
import { toPascalCase } from "../utils/string.js";

/**
 * Creates a module with all necessary files
 * @param {string} moduleName - The name of the module to create
 * @param {string} visibility - Service visibility ('public' or 'private')
 * @param {string} version - API version (defaults to config default)
 * @param {boolean} slim - If true, creates module without database entities and CRUD
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Scaffolding function intentionally handles multiple steps
export async function createModule(
	moduleName,
	visibility = "private",
	version = null,
	slim = false
) {
	try {
		const apiConfig = loadApiConfig();
		const moduleVersion = version || apiConfig.defaultVersion;

		const moduleType = slim ? "slim module" : "module";
		logHeader(`🚀 Creating ${moduleType}: ${moduleName} (${moduleVersion})`);

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
		if (!slim) {
			await mkdir(join(baseDir, "entities"), { recursive: true });
		}
		logSuccess("Directory structure created");

		// ~ ======= Create service file ======= ~
		logInfo(`Creating ${moduleName}.service.ts...`);
		const serviceTemplate = slim
			? generateSimpleServiceTemplate(moduleName, visibility)
			: generateServiceTemplate(moduleName, visibility);
		await writeFile(join(baseDir, `${moduleName}.service.ts`), serviceTemplate);
		logSuccess(`${moduleName}.service.ts created`);

		// ~ ======= Create DTO files ======= ~
		if (slim) {
			// Slim modules use single DTO file
			logInfo(`Creating interfaces/${moduleName}.dto.ts...`);
			const dtoTemplate = generateSimpleDtoTemplate(moduleName);
			await writeFile(
				join(baseDir, "interfaces", `${moduleName}.dto.ts`),
				dtoTemplate
			);
			logSuccess(`interfaces/${moduleName}.dto.ts created`);
		} else {
			// Full modules use separate DTO files for each operation
			logInfo("Creating DTO files...");

			const className = toPascalCase(moduleName);

			// Base entity DTO
			await writeFile(
				join(baseDir, "interfaces", `${moduleName}.dto.ts`),
				generateDtoTemplate(moduleName)
			);
			logSuccess(`interfaces/${moduleName}.dto.ts created`);

			// Create DTO
			await writeFile(
				join(baseDir, "interfaces", `create${className}.dto.ts`),
				generateCreateDtoTemplate(moduleName)
			);
			logSuccess(`interfaces/create${className}.dto.ts created`);

			// Update DTO
			await writeFile(
				join(baseDir, "interfaces", `update${className}.dto.ts`),
				generateUpdateDtoTemplate(moduleName)
			);
			logSuccess(`interfaces/update${className}.dto.ts created`);

			// Get DTO
			await writeFile(
				join(baseDir, "interfaces", `get${className}.dto.ts`),
				generateGetDtoTemplate(moduleName)
			);
			logSuccess(`interfaces/get${className}.dto.ts created`);

			// List DTO
			await writeFile(
				join(baseDir, "interfaces", `list${className}s.dto.ts`),
				generateListDtoTemplate(moduleName)
			);
			logSuccess(`interfaces/list${className}s.dto.ts created`);

			// Delete DTO
			await writeFile(
				join(baseDir, "interfaces", `delete${className}.dto.ts`),
				generateDeleteDtoTemplate(moduleName)
			);
			logSuccess(`interfaces/delete${className}.dto.ts created`);
		}

		// ~ ======= Create OpenAPI routes file ======= ~
		logInfo(`Creating routes/${moduleName}.openapi.ts...`);
		const openApiTemplate = slim
			? generateSimpleOpenApiTemplate(moduleName)
			: generateOpenApiTemplate(moduleName);
		await writeFile(
			join(baseDir, "routes", `${moduleName}.openapi.ts`),
			openApiTemplate
		);
		logSuccess(`routes/${moduleName}.openapi.ts created`);

		// ~ ======= Create routes index file ======= ~
		logInfo("Creating routes/index.ts...");
		const routesTemplate = slim
			? generateSimpleRouteTemplate(moduleName, moduleVersion)
			: generateRoutesIndexTemplate(moduleName, moduleVersion);
		await writeFile(join(baseDir, "routes", "index.ts"), routesTemplate);
		logSuccess("routes/index.ts created");

		// ~ ======= Create schema file (only for non-slim modules) ======= ~
		if (!slim) {
			logInfo(`Creating entities/${moduleName}.schema.ts...`);
			await writeFile(
				join(baseDir, "entities", `${moduleName}.schema.ts`),
				generateSchemaTemplate(moduleName)
			);
			logSuccess(`entities/${moduleName}.schema.ts created`);
		}

		// ~ ======= Success message ======= ~
		logHeader(`✨ Module "${moduleName}" created successfully!`);
		console.log(
			`${colors.dim}Location: src/modules/${moduleName}${colors.reset}`
		);

		if (slim) {
			console.log(
				`\n${colors.yellow}Available endpoints:${colors.reset}\n` +
					`  ${colors.green}GET${colors.reset}  ${colors.cyan}${apiConfig.prefix}/${moduleVersion}/${moduleName}${colors.reset}         - Hello world message\n` +
					`  ${colors.green}POST${colors.reset} ${colors.cyan}${apiConfig.prefix}/${moduleVersion}/${moduleName}${colors.reset}         - Echo message back\n` +
					`  ${colors.green}GET${colors.reset}  ${colors.cyan}${apiConfig.prefix}/${moduleVersion}/${moduleName}/query${colors.reset}   - Query parameter greeting\n`
			);
			console.log(
				`${colors.yellow}Next steps:${colors.reset}\n` +
					`  1. Implement business logic in ${colors.cyan}${moduleName}.service.ts${colors.reset}\n` +
					`  2. Customize DTOs in ${colors.cyan}interfaces/${moduleName}.dto.ts${colors.reset}\n` +
					`  3. Modify route definitions in ${colors.cyan}routes/${moduleName}.openapi.ts${colors.reset}\n` +
					`  4. Update handlers in ${colors.cyan}routes/index.ts${colors.reset}\n` +
					`  5. Run ${colors.cyan}bun dev${colors.reset} - Routes auto-register at ${colors.green}${apiConfig.prefix}/${moduleVersion}/${moduleName}${colors.reset}\n`
			);
			return; // Skip migrations for slim modules
		}

		console.log(
			`\n${colors.yellow}Next steps:${colors.reset}\n` +
				`  1. Update the schema in ${colors.cyan}entities/${moduleName}.schema.ts${colors.reset}\n` +
				`  2. Customize DTOs in ${colors.cyan}interfaces/${moduleName}.dto.ts${colors.reset}\n` +
				`  3. Implement business logic in ${colors.cyan}${moduleName}.service.ts${colors.reset}\n` +
				`  4. Run ${colors.cyan}bun dev${colors.reset} - Routes auto-register at ${colors.green}${apiConfig.prefix}/${moduleVersion}/${moduleName}${colors.reset}\n`
		);

		// ~ ======= Ask about migrations (only for non-slim modules) ======= ~
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
