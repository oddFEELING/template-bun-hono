/**
 * Service Auto-Discovery
 * This file automatically discovers and registers:
 * 1. All service files (*.service.ts) - triggers @Service decorator
 *
 * Note: Schema registration now happens in src/modules/app/index.ts
 * on the actual app instance to ensure they appear in OpenAPI docs.
 */

// Import all service files to trigger @Service decorator
const serviceGlob = new Bun.Glob("**/*.service.ts");
const serviceFiles = serviceGlob.scanSync({
	cwd: import.meta.dir,
	absolute: true,
});

for (const file of serviceFiles) {
	await import(file);
}
