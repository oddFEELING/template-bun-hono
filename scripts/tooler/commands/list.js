import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { colors, logHeader, logInfo } from "../utils/logger.js";

/**
 * Regex patterns for parsing service files
 * Defined at module level for better performance
 */
const CLASS_NAME_PATTERN = /export class (\w+)/;
const SERVICE_DECORATOR_PATTERN = /@Service\((.*?)\)/s;
const VISIBILITY_PATTERN = /visibility:\s*["'](\w+)["']/;
const EXPOSE_TO_PATTERN = /exposeTo:\s*\[(.*?)\]/s;
const PREFIX_PATTERN = /prefix:\s*["']([^"']+)["']/;
const VERSION_PATTERN = /version:\s*["']([^"']+)["']/;
const MODULE_NAME_PATTERN = /moduleName:\s*["']([^"']+)["']/;

/**
 * Recursively finds all service files in a directory
 * @param {string} dir - Directory to search
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Promise<Array>} Array of service file objects with path and relativePath
 */
async function findServiceFiles(dir, baseDir = dir) {
	const serviceFiles = [];

	try {
		const entries = await readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) {
				// Recursively search subdirectories
				const subFiles = await findServiceFiles(fullPath, baseDir);
				serviceFiles.push(...subFiles);
			} else if (entry.name.endsWith(".service.ts")) {
				// Found a service file
				const relativePath = fullPath.replace(`${baseDir}/`, "");
				serviceFiles.push({
					path: fullPath,
					relativePath,
				});
			}
		}
	} catch (_error) {
		// Skip directories that can't be read
	}

	return serviceFiles;
}

/**
 * Parses a service file to extract decorator information
 * @param {string} filePath - Path to the service file
 * @returns {Promise<Object>} Service metadata
 */
async function parseServiceFile(filePath) {
	try {
		const content = await readFile(filePath, "utf-8");

		// Extract class name
		const classMatch = content.match(CLASS_NAME_PATTERN);
		const className = classMatch ? classMatch[1] : "Unknown";

		// Extract @Service decorator
		const decoratorMatch = content.match(SERVICE_DECORATOR_PATTERN);

		if (!decoratorMatch) {
			return { className, visibility: "private", exposeTo: [] };
		}

		const decoratorContent = decoratorMatch[1].trim();

		// Parse visibility
		const visibilityMatch = decoratorContent.match(VISIBILITY_PATTERN);
		const visibility = visibilityMatch ? visibilityMatch[1] : "private";

		// Parse exposeTo (note: it's "exposeTo" not "exposedTo")
		const exposeToMatch = decoratorContent.match(EXPOSE_TO_PATTERN);
		let exposeTo = [];

		if (exposeToMatch) {
			const exposeToContent = exposeToMatch[1];
			exposeTo = exposeToContent
				.split(",")
				.map((s) => s.trim().replace(/["']/g, ""))
				.filter(Boolean);
		}

		return { className, visibility, exposeTo };
	} catch (_error) {
		return {
			className: "Unknown",
			visibility: "unknown",
			exposeTo: [],
			error: true,
		};
	}
}

/**
 * Lists all modules in the project
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Function handles comprehensive module listing with multiple display formats
async function listModules() {
	const modulesDir = resolve(process.cwd(), "src", "modules");

	if (!existsSync(modulesDir)) {
		logInfo("No modules directory found");
		return;
	}

	const modules = await readdir(modulesDir, { withFileTypes: true });
	const moduleList = [];

	for (const module of modules) {
		if (!module.isDirectory() || module.name === "app") {
			continue;
		}

		const modulePath = join(modulesDir, module.name);

		// Find ALL service files in the module (including subdirectories)
		const serviceFiles = await findServiceFiles(modulePath);

		if (serviceFiles.length === 0) {
			continue;
		}

		// Parse all service files
		const services = [];
		for (const serviceFile of serviceFiles) {
			const serviceInfo = await parseServiceFile(serviceFile.path);
			services.push({
				fileName: serviceFile.relativePath,
				...serviceInfo,
			});
		}

		// Check for routes
		const routesDir = join(modulePath, "routes");
		const hasRoutes = existsSync(routesDir);

		// Check for entities
		const entitiesDir = join(modulePath, "entities");
		const hasEntities = existsSync(entitiesDir);

		// Count DTOs
		const interfacesDir = join(modulePath, "interfaces");
		let dtoCount = 0;
		if (existsSync(interfacesDir)) {
			const dtos = await readdir(interfacesDir);
			dtoCount = dtos.filter((f) => f.endsWith(".dto.ts")).length;
		}

		moduleList.push({
			name: module.name,
			services,
			hasRoutes,
			hasEntities,
			dtoCount,
		});
	}

	if (moduleList.length === 0) {
		logInfo("No modules found");
		return;
	}

	console.log(
		`\n${colors.bright}📦 Modules (${moduleList.length})${colors.reset}`
	);
	console.log(colors.dim + "─".repeat(60) + colors.reset);

	for (const module of moduleList) {
		console.log(`\n  ${colors.cyan}${module.name}${colors.reset}`);

		// Show all services in the module
		console.log(
			`    ├─ Services: ${colors.dim}${module.services.length}${colors.reset}`
		);

		for (let i = 0; i < module.services.length; i++) {
			const service = module.services[i];
			const isLast = i === module.services.length - 1;
			const branch = isLast ? "└" : "├";

			// Determine visibility color based on service visibility
			let visibilityColor;
			if (service.visibility === "public") {
				visibilityColor = colors.green;
			} else if (service.visibility === "private") {
				visibilityColor = colors.yellow;
			} else {
				visibilityColor = colors.red;
			}

			// Show file path if there are multiple services
			const serviceDisplay =
				module.services.length > 1
					? `${colors.dim}${service.className}${colors.reset} ${colors.dim}(${service.fileName})${colors.reset}`
					: `${colors.dim}${service.className}${colors.reset}`;

			console.log(
				`    ${branch}─ ${serviceDisplay} (${visibilityColor}${service.visibility}${colors.reset})`
			);

			if (service.exposeTo && service.exposeTo.length > 0) {
				console.log(
					`    ${isLast ? " " : "│"}  └─ Exposed To: ${
						colors.magenta
					}${service.exposeTo.join(", ")}${colors.reset}`
				);
			}
		}

		const features = [];
		if (module.hasRoutes) {
			features.push(`${colors.blue}routes${colors.reset}`);
		}
		if (module.hasEntities) {
			features.push(`${colors.blue}entities${colors.reset}`);
		}
		if (module.dtoCount > 0) {
			features.push(`${colors.blue}${module.dtoCount} DTOs${colors.reset}`);
		}

		if (features.length > 0) {
			console.log(`    └─ Features: ${features.join(", ")}`);
		}
	}
}

/**
 * Lists all providers in the project
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Function handles comprehensive provider listing with multiple display formats
async function listProviders() {
	const providersDir = resolve(process.cwd(), "src", "providers");

	if (!existsSync(providersDir)) {
		logInfo("No providers directory found");
		return;
	}

	const providers = await readdir(providersDir, { withFileTypes: true });
	const providerList = [];

	for (const provider of providers) {
		if (!provider.isDirectory()) {
			continue;
		}

		const providerPath = join(providersDir, provider.name);

		// Find ALL service files in the provider (including subdirectories)
		const serviceFiles = await findServiceFiles(providerPath);

		if (serviceFiles.length === 0) {
			continue;
		}

		// Parse all service files
		const services = [];
		for (const serviceFile of serviceFiles) {
			const serviceInfo = await parseServiceFile(serviceFile.path);
			services.push({
				fileName: serviceFile.relativePath,
				...serviceInfo,
			});
		}

		// Check for entities
		const entitiesDir = join(providerPath, "entities");
		const hasEntities = existsSync(entitiesDir);

		// Count DTOs
		const interfacesDir = join(providerPath, "interfaces");
		let dtoCount = 0;
		if (existsSync(interfacesDir)) {
			const dtos = await readdir(interfacesDir);
			dtoCount = dtos.filter((f) => f.endsWith(".dto.ts")).length;
		}

		providerList.push({
			name: provider.name,
			services,
			hasEntities,
			dtoCount,
		});
	}

	if (providerList.length === 0) {
		logInfo("No providers found");
		return;
	}

	console.log(
		`\n${colors.bright}🔌 Providers (${providerList.length})${colors.reset}`
	);
	console.log(colors.dim + "─".repeat(60) + colors.reset);

	for (const provider of providerList) {
		console.log(`\n  ${colors.cyan}${provider.name}${colors.reset}`);

		// Show all services in the provider
		console.log(
			`    ├─ Services: ${colors.dim}${provider.services.length}${colors.reset}`
		);

		for (let i = 0; i < provider.services.length; i++) {
			const service = provider.services[i];
			const isLast = i === provider.services.length - 1;
			const branch = isLast ? "└" : "├";

			// Determine visibility color based on service visibility
			let visibilityColor;
			if (service.visibility === "public") {
				visibilityColor = colors.green;
			} else if (service.visibility === "private") {
				visibilityColor = colors.yellow;
			} else {
				visibilityColor = colors.red;
			}

			// Show file path if there are multiple services
			const serviceDisplay =
				provider.services.length > 1
					? `${colors.dim}${service.className}${colors.reset} ${colors.dim}(${service.fileName})${colors.reset}`
					: `${colors.dim}${service.className}${colors.reset}`;

			console.log(
				`    ${branch}─ ${serviceDisplay} (${visibilityColor}${service.visibility}${colors.reset})`
			);

			if (service.exposeTo && service.exposeTo.length > 0) {
				console.log(
					`    ${isLast ? " " : "│"}  └─ Exposed To: ${
						colors.magenta
					}${service.exposeTo.join(", ")}${colors.reset}`
				);
			}
		}

		const features = [];
		if (provider.hasEntities) {
			features.push(`${colors.blue}entities${colors.reset}`);
		}
		if (provider.dtoCount > 0) {
			features.push(`${colors.blue}${provider.dtoCount} DTOs${colors.reset}`);
		}

		if (features.length > 0) {
			console.log(`    └─ Features: ${features.join(", ")}`);
		}
	}
}

/**
 * Lists all registered routes by scanning modules directory
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Function handles comprehensive route listing with multiple display formats
async function listRoutes() {
	const modulesDir = resolve(process.cwd(), "src", "modules");

	if (!existsSync(modulesDir)) {
		logInfo("No modules directory found");
		return;
	}

	const modules = await readdir(modulesDir, { withFileTypes: true });
	const routesList = [];

	for (const module of modules) {
		if (!module.isDirectory() || module.name === "app") {
			continue;
		}

		const routePath = join(modulesDir, module.name, "routes", "index.ts");

		if (existsSync(routePath)) {
			const routeContent = await readFile(routePath, "utf-8");

			// Extract route config
			const prefixMatch = routeContent.match(PREFIX_PATTERN);
			const versionMatch = routeContent.match(VERSION_PATTERN);
			const moduleNameMatch = routeContent.match(MODULE_NAME_PATTERN);

			const prefix = prefixMatch ? prefixMatch[1] : `/${module.name}`;
			const version = versionMatch ? versionMatch[1] : "v1";
			const moduleName = moduleNameMatch ? moduleNameMatch[1] : module.name;

			// Try to extract route methods
			const methodMatches = routeContent.matchAll(
				/\.openapi\((\w+)Routes?\.(\w+)/g
			);
			const methods = Array.from(methodMatches).map((m) => m[2]);

			routesList.push({
				name: module.name,
				moduleName,
				prefix,
				version,
				methods,
			});
		}
	}

	if (routesList.length === 0) {
		logInfo("No routes found");
		return;
	}

	console.log(
		`\n${colors.bright}🛣️  Routes (${routesList.length})${colors.reset}`
	);
	console.log(colors.dim + "─".repeat(60) + colors.reset);

	for (const route of routesList) {
		console.log(`\n  ${colors.cyan}${route.name}${colors.reset}`);
		console.log(
			`    ├─ Endpoint: ${colors.blue}/api/${route.version}${route.prefix}${colors.reset}`
		);
		console.log(
			`    ├─ Module: ${colors.dim}${route.moduleName}${colors.reset}`
		);

		if (route.methods.length > 0) {
			console.log(
				`    └─ Operations (${route.methods.length}): ${
					colors.green
				}${route.methods.join(", ")}${colors.reset}`
			);
		} else {
			console.log(
				`    └─ Operations: ${colors.dim}none detected${colors.reset}`
			);
		}
	}
}

/**
 * Lists all database entities
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Function handles comprehensive entity listing with multiple display formats
async function listEntities() {
	const entities = [];

	// Scan modules for entities
	const modulesDir = resolve(process.cwd(), "src", "modules");
	if (existsSync(modulesDir)) {
		const modules = await readdir(modulesDir, { withFileTypes: true });

		for (const module of modules) {
			if (!module.isDirectory()) {
				continue;
			}

			const entitiesDir = join(modulesDir, module.name, "entities");
			if (existsSync(entitiesDir)) {
				const entityFiles = await readdir(entitiesDir);
				const schemas = entityFiles.filter((f) => f.endsWith(".schema.ts"));

				for (const schema of schemas) {
					entities.push({
						name: schema.replace(".schema.ts", ""),
						location: `modules/${module.name}`,
						type: "module",
					});
				}
			}
		}
	}

	// Scan providers for entities
	const providersDir = resolve(process.cwd(), "src", "providers");
	if (existsSync(providersDir)) {
		const providers = await readdir(providersDir, { withFileTypes: true });

		for (const provider of providers) {
			if (!provider.isDirectory()) {
				continue;
			}

			const entitiesDir = join(providersDir, provider.name, "entities");
			if (existsSync(entitiesDir)) {
				const entityFiles = await readdir(entitiesDir);
				const schemas = entityFiles.filter((f) => f.endsWith(".schema.ts"));

				for (const schema of schemas) {
					entities.push({
						name: schema.replace(".schema.ts", ""),
						location: `providers/${provider.name}`,
						type: "provider",
					});
				}
			}
		}
	}

	if (entities.length === 0) {
		logInfo("No database entities found");
		return;
	}

	console.log(
		`\n${colors.bright}🗄️  Database Entities (${entities.length})${colors.reset}`
	);
	console.log(colors.dim + "─".repeat(60) + colors.reset);

	for (const entity of entities) {
		const typeColor = entity.type === "module" ? colors.blue : colors.magenta;
		console.log(`\n  ${colors.cyan}${entity.name}${colors.reset}`);
		console.log(
			`    └─ Location: ${typeColor}${entity.location}${colors.reset}`
		);
	}
}

/**
 * Lists all OpenAPI schemas discovered
 */
async function listSchemas() {
	console.log(`\n${colors.bright}📋 OpenAPI Schemas${colors.reset}`);
	console.log(colors.dim + "─".repeat(60) + colors.reset);

	const schemas = [];

	// Scan all DTO files
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Helper function for comprehensive schema scanning with multiple display formats
	const scanDir = async (baseDir, type) => {
		if (!existsSync(baseDir)) {
			return;
		}

		const items = await readdir(baseDir, { withFileTypes: true });

		for (const item of items) {
			if (!item.isDirectory()) {
				continue;
			}

			const interfacesDir = join(baseDir, item.name, "interfaces");
			if (existsSync(interfacesDir)) {
				const dtoFiles = await readdir(interfacesDir);

				for (const dtoFile of dtoFiles) {
					if (!dtoFile.endsWith(".dto.ts")) {
						continue;
					}

					const dtoPath = join(interfacesDir, dtoFile);
					const content = await readFile(dtoPath, "utf-8");

					// Extract schema names
					const schemaMatches = content.matchAll(/const\s+(\w+Schema)\s*=/g);
					const schemaNames = Array.from(schemaMatches).map((m) => m[1]);

					if (schemaNames.length > 0) {
						schemas.push({
							file: dtoFile,
							location: `${type}/${item.name}`,
							schemas: schemaNames,
						});
					}
				}
			}
		}
	};

	await scanDir(resolve(process.cwd(), "src", "modules"), "modules");
	await scanDir(resolve(process.cwd(), "src", "providers"), "providers");

	if (schemas.length === 0) {
		logInfo("No OpenAPI schemas found");
		return;
	}

	for (const item of schemas) {
		console.log(
			`\n  ${colors.cyan}${item.file}${colors.reset} ${colors.dim}(${item.location})${colors.reset}`
		);
		console.log(
			`    └─ Schemas: ${colors.green}${item.schemas.join(", ")}${colors.reset}`
		);
	}

	const totalSchemas = schemas.reduce(
		(sum, item) => sum + item.schemas.length,
		0
	);
	console.log(
		`\n  ${colors.dim}Total: ${totalSchemas} schema${
			totalSchemas === 1 ? "" : "s"
		} across ${schemas.length} file${schemas.length === 1 ? "" : "s"}${
			colors.reset
		}`
	);
}

/**
 * Main list command
 * @param {string} subCommand - What to list (modules, providers, routes, entities, schemas, or "all")
 */
export async function list(subCommand = "all") {
	logHeader("📋 Project Overview");

	if (subCommand === "all" || subCommand === "modules") {
		await listModules();
	}

	if (subCommand === "all" || subCommand === "providers") {
		await listProviders();
	}

	if (subCommand === "all" || subCommand === "routes") {
		await listRoutes();
	}

	if (subCommand === "all" || subCommand === "entities") {
		await listEntities();
	}

	if (subCommand === "all" || subCommand === "schemas") {
		await listSchemas();
	}

	console.log("\n");
}
