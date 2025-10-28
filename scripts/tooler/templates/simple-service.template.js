import { toPascalCase } from "../utils/string.js";

/**
 * Generates a simple service template for routes without database/CRUD operations
 * @param {string} routeName - The name of the route
 * @param {string} visibility - Service visibility ('public' or 'private')
 * @returns {string} The simple service template content
 */
export function generateSimpleServiceTemplate(
	routeName,
	visibility = "private"
) {
	const className = toPascalCase(routeName);

	// Determine service decorator based on visibility
	const serviceDecorator =
		visibility === "public"
			? `@Service({ visibility: "public" })`
			: "@Service()";

	return `import { Service } from "@/decorators";
import { AppLogger } from "@/lib/logger";

/**
 * ${className}Service
 * Service class for handling ${routeName} business logic
 * ${
		visibility === "public"
			? "Public service - accessible from other modules"
			: "Private service - only accessible within this module"
 }
 */
${serviceDecorator}
export class ${className}Service {
  private readonly logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
    this.logger.info("${className}Service initialized");
  }

  /**
   * Generates a hello world message
   * @returns Hello world message
   */
  async getHelloMessage() {
    this.logger.info("Generating hello message");
    return {
      message: "Hello World from ${className}!",
    };
  }

  /**
   * Echoes back the provided message
   * @param message - The message to echo back
   * @returns The echoed message
   */
  async echoMessage(message: string) {
    this.logger.info(\`Echoing message: \${message}\`);
    return {
      message,
    };
  }

  /**
   * Generates a personalized greeting
   * @param name - The name to include in the greeting (defaults to "World")
   * @returns Personalized greeting message
   */
  async getPersonalizedGreeting(name?: string) {
    const userName = name || "World";
    this.logger.info(\`Generating greeting for: \${userName}\`);
    return {
      greeting: \`Hello, \${userName}! Welcome to ${className}.\`,
    };
  }
}
`;
}
