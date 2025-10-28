#!/usr/bin/env bun
/** biome-ignore-all lint/suspicious/noConsole: <Watcher script needs console output> */

import { watch } from "node:fs";
import { join, resolve } from "node:path";
import { generateModuleList } from "./generate-module-list";
import { generateSchemaList } from "./generate-schema-list";

/**
 * Watches for changes in modules and providers directories
 * and regenerates module and schema lists when changes occur
 */

const projectRoot = resolve(import.meta.dir, "../../..");
const modulesDir = join(projectRoot, "src", "modules");
const providersDir = join(projectRoot, "src", "providers");

let moduleDebounceTimer: Timer | null = null;
let schemaDebounceTimer: Timer | null = null;

/**
 * Debounced module list regeneration
 */
function debouncedRegenerateModules() {
	if (moduleDebounceTimer) {
		clearTimeout(moduleDebounceTimer);
	}

	moduleDebounceTimer = setTimeout(() => {
		console.log("\n📦 Module structure changed, regenerating module list...");
		try {
			generateModuleList();
		} catch (error) {
			console.error("❌ Error regenerating module list:", error);
		}
	}, 500);
}

/**
 * Debounced schema list regeneration
 */
function debouncedRegenerateSchemas() {
	if (schemaDebounceTimer) {
		clearTimeout(schemaDebounceTimer);
	}

	schemaDebounceTimer = setTimeout(() => {
		console.log("\n📋 DTO file changed, regenerating schema list...");
		try {
			generateSchemaList();
			console.log("✅ Schema list regenerated - server should hot reload");
		} catch (error) {
			console.error("❌ Error regenerating schema list:", error);
		}
	}, 500);
}

console.log("👀 Watching for changes...");
console.log(`   Modules: ${modulesDir}`);
console.log(`   Providers: ${providersDir}`);
console.log(`   DTO files: ${modulesDir}/**/*.dto.ts`);
console.log(`   DTO files: ${providersDir}/**/*.dto.ts`);
console.log("   Press Ctrl+C to stop\n");

// Watch modules directory for new/removed modules
try {
	watch(modulesDir, { recursive: false }, (eventType, filename) => {
		if (filename && eventType === "rename") {
			// Module directory was added or removed
			debouncedRegenerateModules();
		}
	});
} catch (error) {
	console.warn("⚠️  Could not watch modules directory:", error);
}

// Watch providers directory for new/removed providers
try {
	watch(providersDir, { recursive: false }, (eventType, filename) => {
		if (filename && eventType === "rename") {
			// Provider directory was added or removed
			debouncedRegenerateModules();
		}
	});
} catch (error) {
	console.warn("⚠️  Could not watch providers directory:", error);
}

// Watch for DTO file changes in modules
try {
	watch(modulesDir, { recursive: true }, (eventType, filename) => {
		if (filename?.endsWith(".dto.ts")) {
			console.log(`🔍 Detected ${eventType} on ${filename}`);
			// DTO file was added, modified, or removed
			debouncedRegenerateSchemas();
		}
	});
} catch (error) {
	console.warn("⚠️  Could not watch modules DTO files:", error);
}

// Watch for DTO file changes in providers
try {
	watch(providersDir, { recursive: true }, (eventType, filename) => {
		if (filename?.endsWith(".dto.ts")) {
			console.log(`🔍 Detected ${eventType} on ${filename}`);
			// DTO file was added, modified, or removed
			debouncedRegenerateSchemas();
		}
	});
} catch (error) {
	console.warn("⚠️  Could not watch providers DTO files:", error);
}

// Keep the process alive
process.on("SIGINT", () => {
	console.log("\n👋 Stopped watching for changes");
	process.exit(0);
});
