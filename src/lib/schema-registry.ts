import type { ZodType } from "zod";
import type { SchemaIdentifier } from "../_generated/schemas";

/**
 * Type alias for any Zod schema type
 */
// biome-ignore lint/suspicious/noExplicitAny: This type intentionally accepts any Zod schema
type AnyZodSchema = ZodType<any, any, any>;

/**
 * Metadata stored for each registered schema
 * Provides context about where the schema comes from and its purpose
 */
interface SchemaMetadata {
	module: string;
	file: string;
	location: string;
	type: "request" | "response" | "entity" | "query" | "param" | "other";
	registeredAt: Date;
}

/**
 * Complete schema information including the Zod schema and metadata
 */
interface SchemaInfo {
	schema: AnyZodSchema;
	metadata: SchemaMetadata;
}

/**
 * Central registry for all Zod schemas in the application
 * Stores schemas discovered during auto-discovery and provides
 * runtime validation, introspection, and query capabilities
 */
export class SchemaRegistry {
	private static schemas = new Map<string, SchemaInfo>();

	// ========== STORAGE METHODS ==========

	/**
	 * Registers a schema in the central registry
	 * Called during auto-discovery to store all discovered schemas
	 */
	static register(
		name: string,
		schema: AnyZodSchema,
		metadata: Partial<SchemaMetadata> = {}
	): void {
		SchemaRegistry.schemas.set(name, {
			schema,
			metadata: {
				module: metadata.module || "unknown",
				file: metadata.file || "unknown",
				location: metadata.location || "unknown",
				type: metadata.type || SchemaRegistry.inferType(name),
				registeredAt: new Date(),
			},
		});
	}

	/**
	 * Retrieves a schema by name
	 * Returns undefined if schema not found
	 * Provides autocomplete for all registered schema names
	 */
	static get(name: SchemaIdentifier): AnyZodSchema | undefined {
		return SchemaRegistry.schemas.get(name)?.schema;
	}

	/**
	 * Retrieves complete schema information including metadata
	 * Provides autocomplete for all registered schema names
	 */
	static getInfo(name: SchemaIdentifier): SchemaInfo | undefined {
		return SchemaRegistry.schemas.get(name);
	}

	/**
	 * Returns all registered schemas with their metadata
	 */
	static getAll(): Map<string, SchemaInfo> {
		return new Map(SchemaRegistry.schemas);
	}

	/**
	 * Checks if a schema is registered
	 * Provides autocomplete for all registered schema names
	 */
	static has(name: SchemaIdentifier): boolean {
		return SchemaRegistry.schemas.has(name);
	}

	/**
	 * Lists all registered schema names
	 */
	static list(): string[] {
		return Array.from(SchemaRegistry.schemas.keys());
	}

	/**
	 * Clears all registered schemas
	 * Primarily for testing purposes
	 */
	static clear(): void {
		SchemaRegistry.schemas.clear();
	}

	// ========== VALIDATION METHODS ==========

	/**
	 * Validates data against a registered schema
	 * Returns SafeParseResult for error handling without exceptions
	 * Provides autocomplete for schema names and compile-time validation
	 */
	static validate(
		schemaName: SchemaIdentifier,
		data: unknown
	): ReturnType<AnyZodSchema["safeParse"]> {
		const schema = SchemaRegistry.get(schemaName);

		if (!schema) {
			throw new Error(
				`Schema "${schemaName}" not found in registry. ` +
					`Available schemas: ${SchemaRegistry.list().slice(0, 10).join(", ")}${
						SchemaRegistry.schemas.size > 10 ? "..." : ""
					}`
			);
		}

		return schema.safeParse(data);
	}

	/**
	 * Parses data against a registered schema
	 * Throws ZodError if validation fails
	 * Provides autocomplete for schema names and compile-time validation
	 */
	static parse<T = unknown>(schemaName: SchemaIdentifier, data: unknown): T {
		const schema = SchemaRegistry.get(schemaName);

		if (!schema) {
			throw new Error(`Schema "${schemaName}" not found in registry`);
		}

		return schema.parse(data) as T;
	}

	// ========== CONVENIENCE METHODS ==========

	/**
	 * Retrieves multiple schemas by name with variadic arguments
	 * Returns object with schema names as keys for destructuring
	 * Provides full autocomplete and compile-time validation
	 *
	 * @example
	 * const { messageRequestSchema, queryParamSchema } = SchemaRegistry.getSchemas(
	 *   "messageRequestSchema",
	 *   "queryParamSchema"
	 * );
	 */
	static getSchemas<T extends SchemaIdentifier>(
		...schemaNames: T[]
	): Record<T, AnyZodSchema> {
		const result: Record<string, AnyZodSchema> = {};

		for (const name of schemaNames) {
			const schema = SchemaRegistry.get(name);

			if (!schema) {
				throw new Error(
					`Schema "${name}" not found in registry. ` +
						`Available: ${SchemaRegistry.list().join(", ")}`
				);
			}

			result[name] = schema;
		}

		return result as Record<T, AnyZodSchema>;
	}

	/**
	 * Retrieves schemas with custom aliases using object mapping
	 * Similar to getServices() pattern
	 * Provides autocomplete for schema names and compile-time validation
	 *
	 * @example
	 * const schemas = SchemaRegistry.getSchemasMap({
	 *   message: "messageRequestSchema",
	 *   query: "queryParamSchema",
	 * });
	 */
	static getSchemasMap<T extends Record<string, SchemaIdentifier>>(
		schemaMap: T
	): { [K in keyof T]: AnyZodSchema } {
		const result: Record<string, AnyZodSchema> = {};

		for (const [alias, schemaName] of Object.entries(schemaMap)) {
			const schema = SchemaRegistry.get(schemaName);

			if (!schema) {
				throw new Error(
					`Schema "${schemaName}" not found in registry. ` +
						`Available: ${SchemaRegistry.list().join(", ")}`
				);
			}

			result[alias] = schema;
		}

		return result as { [K in keyof T]: AnyZodSchema };
	}

	// ========== QUERY METHODS ==========

	/**
	 * Retrieves all schema names from a specific module
	 */
	static getByModule(module: string): string[] {
		return Array.from(SchemaRegistry.schemas.entries())
			.filter(([_, info]) => info.metadata.module === module)
			.map(([name]) => name);
	}

	/**
	 * Retrieves all schema names of a specific type
	 */
	static getByType(type: SchemaMetadata["type"]): string[] {
		return Array.from(SchemaRegistry.schemas.entries())
			.filter(([_, info]) => info.metadata.type === type)
			.map(([name]) => name);
	}

	/**
	 * Retrieves schema names matching a pattern
	 */
	static getByPattern(pattern: RegExp): string[] {
		return Array.from(SchemaRegistry.schemas.keys()).filter((name) =>
			pattern.test(name)
		);
	}

	// ========== UTILITIES ==========

	/**
	 * Returns statistics about registered schemas
	 * Includes total count, breakdown by module, and breakdown by type
	 */
	static stats() {
		const byModule: Record<string, number> = {};
		const byType: Record<string, number> = {};

		for (const [_, info] of SchemaRegistry.schemas) {
			byModule[info.metadata.module] =
				(byModule[info.metadata.module] || 0) + 1;
			byType[info.metadata.type] = (byType[info.metadata.type] || 0) + 1;
		}

		return {
			total: SchemaRegistry.schemas.size,
			byModule,
			byType,
		};
	}

	/**
	 * Infers schema type from its name
	 * Uses naming conventions to categorize schemas
	 */
	private static inferType(schemaName: string): SchemaMetadata["type"] {
		const lowerName = schemaName.toLowerCase();

		if (lowerName.includes("request")) {
			return "request";
		}
		if (lowerName.includes("response")) {
			return "response";
		}
		if (lowerName.includes("query")) {
			return "query";
		}
		if (lowerName.includes("param")) {
			return "param";
		}
		if (lowerName.includes("entity") || !lowerName.includes("schema")) {
			return "entity";
		}

		return "other";
	}
}
