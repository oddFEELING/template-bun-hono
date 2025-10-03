import { readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";

/**
 * API Configuration
 * Loaded from api.config.yml at the project root
 */
export interface ApiConfig {
  defaultVersion: string;
  prefix: string;
  availableVersions: string[];
}

/**
 * Loads and parses the API configuration from YAML file
 * @returns Parsed API configuration
 */
function loadApiConfig(): ApiConfig {
  const configPath = resolve(process.cwd(), "api.config.yml");

  try {
    const fileContents = readFileSync(configPath, "utf8");
    const config = parse(fileContents) as ApiConfig;

    return {
      defaultVersion: config.defaultVersion || "v1",
      prefix: config.prefix || "/api",
      availableVersions: config.availableVersions || ["v1"],
    };
  } catch (error) {
    console.warn("⚠️  Could not load api.config.yml, using defaults");
    return {
      defaultVersion: "v1",
      prefix: "/api",
      availableVersions: ["v1"],
    };
  }
}

/**
 * API configuration singleton
 */
export const apiConfig = loadApiConfig();
