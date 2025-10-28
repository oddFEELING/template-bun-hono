import { toPascalCase } from "../utils/string.js";

/**
 * Generates the provider service template file content
 * @param {string} providerName - The name of the provider
 * @param {string} visibility - Service visibility ('public' or 'private')
 * @returns {string} The provider template content
 */
export function generateProviderTemplate(providerName, visibility = "public") {
	const className = toPascalCase(providerName);
	const decorator =
		visibility === "public"
			? `@Service({ visibility: "public" })`
			: "@Service()";
	const visibilityComment =
		visibility === "public"
			? "Public provider - accessible from other modules"
			: "Private provider - only accessible within this provider's module";

	return `import { Service } from "@/decorators";
import { AppLogger } from "@/lib/logger";

/**
 * ${className}Provider
 * Provider class for handling ${providerName} integration
 * ${visibilityComment}
 */
${decorator}
export class ${className}Provider {
  private readonly logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
    this.logger.info("${className}Provider initialized");
  }

  /**
   * Add your provider methods here
   */
}
`;
}
