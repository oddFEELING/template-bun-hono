/**
 * Route Auto-Discovery
 * Automatically discovers and imports all route files in the modules directory.
 * Each module's routes/index.ts file should call registerRoute() to register itself.
 * This ensures all routes are discovered before the app router is initialized.
 */

// Get all route index files using Bun's glob
const glob = new Bun.Glob("**/modules/*/routes/index.ts");

// Scan for route files starting from the src directory
// Filter out the app module (it's the main router, not a module route)
const routeFiles = Array.from(
  glob.scanSync({
    cwd: import.meta.dir,
    absolute: true,
  })
).filter((file) => !file.includes("/modules/app/"));

// Import each route file to trigger route registration
for (const file of routeFiles) {
  await import(file);
}

// Export to make this file a module and allow top-level await
export {};
