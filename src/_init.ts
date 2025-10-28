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

import * as Sentry from "@sentry/bun";

import { env } from "./config";

const serviceFiles = serviceGlob.scanSync({
	cwd: import.meta.dir,
	absolute: true,
});

// Initialize Sentry for error tracking and monitoring
Sentry.init({
	dsn: env.SENTRY_DSN,
	environment: process.env.NODE_ENV || "development",
	tracesSampleRate: 0.1,
	integrations: [
		// Instrument Bun.serve()
		Sentry.bunServerIntegration(),
		Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
		// Add Hono-specific error handling
		Sentry.honoIntegration(),
	],
});

for (const file of serviceFiles) {
	await import(file);
}
