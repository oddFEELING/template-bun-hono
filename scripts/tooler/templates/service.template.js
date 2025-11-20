import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the service template file content
 * @param {string} moduleName - The name of the module
 * @param {string} visibility - Service visibility ('public' or 'private')
 * @returns {string} The service template content
 */
export function generateServiceTemplate(moduleName, visibility = "private") {
	const className = toPascalCase(moduleName);
	const tableVarName = toCamelCase(moduleName);
	const decorator =
		visibility === "public"
			? `@Service({ visibility: "public" })`
			: "@Service()";
	const visibilityComment =
		visibility === "public"
			? "Public service - accessible from other modules"
			: "Private service - only accessible within this module";

	return `import { Service } from "@/decorators";
import { AppLogger } from "@/lib/logger";
import type { SchemaRegistryType } from "@/_generated/schemas";
import db from "@/drizzle/db";
import {
  createPaginatedResponse,
  parsePaginationParams,
} from "@/lib/pagination-helper";
import { ${tableVarName} } from "./entities/${moduleName}.schema";
import { eq } from "drizzle-orm";

/**
 * ${className}Service
 * Service class for handling ${moduleName} business logic
 * ${visibilityComment}
 */
${decorator}
export class ${className}Service {
  private readonly logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
    this.logger.info("${className}Service initialized");
  }

  /**
   * Retrieves all ${moduleName} records from the database
   * @returns Array of all ${moduleName} records
   */
  async getAll() {
    this.logger.info("Fetching all ${moduleName}");
    const results = await db.select().from(${tableVarName});
    return results;
  }

  /**
   * Retrieves paginated ${moduleName} records from the database
   * @param query - Pagination parameters (page, limit)
   * @returns Paginated array of ${moduleName} records
   */
  async getAllPaginated(query: SchemaRegistryType<"list${className}sQueryDto">) {
    const { page, limit, offset } = parsePaginationParams(query);

    this.logger.info(\`Fetching paginated ${moduleName} - Page: \${page}, Limit: \${limit}\`);

    const results = await db
      .select()
      .from(${tableVarName})
      .limit(limit)
      .offset(offset);

    const total = await db.$count(${tableVarName});

    return createPaginatedResponse(results, page, limit, total);
  }

  /**
   * Retrieves a single ${moduleName} record by ID
   * @param id - UUID of the ${moduleName} to retrieve
   * @returns The ${moduleName} record or null if not found
   */
  async getById(id: string) {
    this.logger.info(\`Fetching ${moduleName} with ID: \${id}\`);
    const result = await db
      .select()
      .from(${tableVarName})
      .where(eq(${tableVarName}.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Creates a new ${moduleName} record in the database
   * @param data - The data for creating a new ${moduleName}
   * @returns The newly created ${moduleName} record
   */
  async create(data: SchemaRegistryType<"create${className}RequestDto">) {
    this.logger.info(\`Creating new ${moduleName}: \${JSON.stringify(data)}\`);
    const result = await db
      .insert(${tableVarName})
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Updates an existing ${moduleName} record in the database
   * @param id - UUID of the ${moduleName} to update
   * @param data - The data to update
   * @returns The updated ${moduleName} record or null if not found
   */
  async update(id: string, data: SchemaRegistryType<"update${className}RequestDto">) {
    this.logger.info(\`Updating ${moduleName} with ID: \${id}\`);
    const result = await db
      .update(${tableVarName})
      .set({ ...data, updatedAt: new Date() })
      .where(eq(${tableVarName}.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Deletes a ${moduleName} record from the database
   * @param id - UUID of the ${moduleName} to delete
   * @returns The deleted ${moduleName} record or null if not found
   */
  async delete(id: string) {
    this.logger.info(\`Deleting ${moduleName} with ID: \${id}\`);
    const result = await db
      .delete(${tableVarName})
      .where(eq(${tableVarName}.id, id))
      .returning();

    return result[0] || null;
  }
}
`;
}
