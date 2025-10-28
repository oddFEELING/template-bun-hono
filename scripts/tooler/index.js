#!/usr/bin/env bun

import { createModule } from "./commands/create-module.js";
import { createProvider } from "./commands/create-provider.js";
import { list } from "./commands/list.js";
import { colors, logError } from "./utils/logger.js";

/**
 * Display help information
 */
function showHelp() {
	console.log(`
${colors.bright}${colors.cyan}Naalya Tooler CLI${colors.reset}

${colors.bright}Usage:${colors.reset}
  bun tooler ${colors.green}<command>${colors.reset} ${colors.yellow}[options]${colors.reset}

${colors.bright}Commands:${colors.reset}
  ${colors.green}create module${colors.reset} ${colors.yellow}<module_name>${colors.reset}      Create a new module with routes and CRUD operations
  ${colors.green}create provider${colors.reset} ${colors.yellow}<provider_name>${colors.reset}  Create a new provider for 3rd party integrations
  ${colors.green}list${colors.reset} ${colors.yellow}[type]${colors.reset}                     List project components (all, modules, providers, routes, entities, schemas)

${colors.bright}Flags:${colors.reset}
  ${colors.yellow}--public${colors.reset}                       Make the service public (accessible from other modules)
  ${colors.yellow}--private${colors.reset}                      Make the service private (only within its module)
  ${colors.yellow}--slim${colors.reset}                         Create module without database entities and CRUD
  ${colors.yellow}--version${colors.reset} ${colors.cyan}<version>${colors.reset}            Specify API version (default: from api.config.yml)
  ${colors.yellow}--help${colors.reset}                         Show this help message

${colors.bright}Examples:${colors.reset}
  bun tooler create module users
  bun tooler create module users --public          ${colors.dim}# Make UsersService public${colors.reset}
  bun tooler create module users --slim            ${colors.dim}# Create without database/CRUD${colors.reset}
  bun tooler create module users --version v2      ${colors.dim}# Create for API v2${colors.reset}
  bun tooler create provider stripe
  bun tooler create provider stripe --private      ${colors.dim}# Make StripeProvider private${colors.reset}
  bun tooler list                                  ${colors.dim}# List all components${colors.reset}
  bun tooler list modules                          ${colors.dim}# List only modules${colors.reset}
  bun tooler list routes                           ${colors.dim}# List only routes${colors.reset}

${colors.bright}Defaults:${colors.reset}
  - Modules create ${colors.yellow}private${colors.reset} services by default
  - Providers create ${colors.yellow}public${colors.reset} services by default
`);
}

// ~ ======= CLI argument parsing ======= ~
const args = process.argv.slice(2);

// Parse flags and arguments
const flags = {
	public: args.includes("--public"),
	private: args.includes("--private"),
	slim: args.includes("--slim"),
};

// Get version flag value
const versionFlagIndex = args.indexOf("--version");
const versionValue = versionFlagIndex >= 0 ? args[versionFlagIndex + 1] : null;

// Remove flags from args to get command, subcommand, and name
const nonFlagArgs = args.filter(
	(arg) => !arg.startsWith("--") && arg !== versionValue
);
const command = nonFlagArgs[0];
const subCommand = nonFlagArgs[1];
const name = nonFlagArgs[2];

// ~ ======= Main CLI logic ======= ~
if (args.includes("--help") || args.length === 0) {
	showHelp();
	process.exit(0);
}

if (command === "create" && subCommand === "module") {
	if (!name) {
		logError("Module name is required!");
		console.log(
			`\nUsage: bun tooler create module ${colors.yellow}<module_name>${colors.reset} [--public|--private]\n`
		);
		process.exit(1);
	}

	// Validate flags
	if (flags.public && flags.private) {
		logError("Cannot use both --public and --private flags!");
		process.exit(1);
	}

	// Module services are private by default
	const visibility = flags.public ? "public" : "private";
	const slim = flags.slim;
	await createModule(name, visibility, versionValue, slim);
} else if (command === "create" && subCommand === "provider") {
	if (!name) {
		logError("Provider name is required!");
		console.log(
			`\nUsage: bun tooler create provider ${colors.yellow}<provider_name>${colors.reset} [--public|--private]\n`
		);
		process.exit(1);
	}

	// Validate flags
	if (flags.public && flags.private) {
		logError("Cannot use both --public and --private flags!");
		process.exit(1);
	}

	// Provider services are public by default
	const visibility = flags.private ? "private" : "public";
	await createProvider(name, visibility);
} else if (command === "list") {
	// List command - subCommand is optional (modules, providers, routes, entities, schemas, or "all")
	const listType = subCommand || "all";
	const validTypes = [
		"all",
		"modules",
		"providers",
		"routes",
		"entities",
		"schemas",
	];

	if (!validTypes.includes(listType)) {
		logError(`Invalid list type: ${listType}`);
		console.log(
			`\nValid types: ${colors.cyan}${validTypes.join(", ")}${colors.reset}\n`
		);
		process.exit(1);
	}

	await list(listType);
} else {
	logError(`Unknown command: ${command} ${subCommand}`);
	console.log(
		`\nRun ${colors.cyan}bun tooler --help${colors.reset} for usage information.\n`
	);
	process.exit(1);
}
