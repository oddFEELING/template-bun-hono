#!/usr/bin/env bun

import { watch } from "fs";
import { join, resolve } from "path";
import { generateModuleList } from "./generate-module-list";

/**
 * Watches for changes in modules and providers directories
 * and regenerates the module list when changes occur
 */

const projectRoot = resolve(import.meta.dir, "..");
const modulesDir = join(projectRoot, "src", "modules");
const providersDir = join(projectRoot, "src", "providers");

let debounceTimer: Timer | null = null;

/**
 * Debounced regeneration to avoid multiple rapid regenerations
 */
function debouncedRegenerate() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    console.log("\n📦 Module structure changed, regenerating module list...");
    try {
      generateModuleList();
    } catch (error) {
      console.error("❌ Error regenerating module list:", error);
    }
  }, 500);
}

console.log("👀 Watching for module and provider changes...");
console.log(`   Modules: ${modulesDir}`);
console.log(`   Providers: ${providersDir}`);
console.log("   Press Ctrl+C to stop\n");

// Watch modules directory
try {
  watch(modulesDir, { recursive: false }, (eventType, filename) => {
    if (filename && eventType === "rename") {
      // Directory was added or removed
      debouncedRegenerate();
    }
  });
} catch (error) {
  console.warn("⚠️  Could not watch modules directory:", error);
}

// Watch providers directory
try {
  watch(providersDir, { recursive: false }, (eventType, filename) => {
    if (filename && eventType === "rename") {
      // Directory was added or removed
      debouncedRegenerate();
    }
  });
} catch (error) {
  console.warn("⚠️  Could not watch providers directory:", error);
}

// Keep the process alive
process.on("SIGINT", () => {
  console.log("\n👋 Stopped watching for changes");
  process.exit(0);
});
