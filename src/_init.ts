/**
 * Service Auto-Discovery
 * This file automatically discovers and imports all service files in the project.
 * It uses Bun's built-in glob to find all *.service.ts files and imports them,
 * which triggers the @Service decorator to register them in the ServiceRegistry.
 */

// Get all service files using Bun's glob
const glob = new Bun.Glob("**/*.service.ts");

// Scan for service files starting from the src directory
const serviceFiles = glob.scanSync({
  cwd: import.meta.dir,
  absolute: true,
});

// Import each service file to trigger the @Service decorator
for (const file of serviceFiles) {
  await import(file);
}

// Export to make this file a module and allow top-level await
export {};
