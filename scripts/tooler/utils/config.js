import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

/**
 * Loads API configuration from api.config.yml
 * @returns API configuration object
 */
export function loadApiConfig() {
	const configPath = resolve(process.cwd(), "api.config.yml");

	try {
		const fileContents = readFileSync(configPath, "utf8");
		const config = parse(fileContents);

		return {
			defaultVersion: config.defaultVersion || "v1",
			prefix: config.prefix || "/api",
			availableVersions: config.availableVersions || ["v1"],
		};
	} catch (_error) {
		console.warn("⚠️  Could not load api.config.yml, using defaults");
		return {
			defaultVersion: "v1",
			prefix: "/api",
			availableVersions: ["v1"],
		};
	}
}
