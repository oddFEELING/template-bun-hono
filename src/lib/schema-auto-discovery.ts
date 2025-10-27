import type { OpenAPIHono } from "@hono/zod-openapi";
import type { ZodTypeAny } from "zod";
import { SchemaRegistry } from "./schema-registry";
import type { AppEnv } from "./types";

/**
 * Automatically discovers and registers all OpenAPI schemas from DTO files
 * Scans all *.dto.ts files and registers all exported Zod schemas
 * Uses the official registerComponent method from @hono/zod-openapi
 *
 * IMPORTANT: All schemas in DTO files must use .openapi('SchemaName') to be properly registered.
 * Example:
 *   const mySchema = z.object({ name: z.string() }).openapi('MySchema');
 *
 * Schemas without .openapi() will be skipped to avoid empty objects in the OpenAPI spec.
 */
export async function autoRegisterSchemas(app: OpenAPIHono<AppEnv>) {
  // Find all DTO files using Bun's glob
  const glob = new Bun.Glob("**/*.dto.ts");
  const dtoFiles = Array.from(
    glob.scanSync({
      cwd: import.meta.dir + "/..", // src directory
      absolute: true,
    })
  );

  // Schema discovery happens silently
  // Logging is handled separately via logRegisteredSchemas()

  const allSchemas: Record<
    string,
    { schema: ZodTypeAny; file: string; location: string }
  > = {};
  const fileSchemaMap: Record<string, string[]> = {};

  // Scan each DTO file for schemas
  for (const file of dtoFiles) {
    try {
      // Dynamically import the DTO file
      const module = await import(file);

      // Extract relative file path for logging
      const relativePath = file
        .replace(import.meta.dir + "/..", "src")
        .replace(/^\//, "");

      // Extract module name and file info
      const moduleMatch = relativePath.match(/modules\/([^/]+)/);
      const providerMatch = relativePath.match(/providers\/([^/]+)/);
      const moduleName = moduleMatch
        ? moduleMatch[1]
        : providerMatch
        ? `provider:${providerMatch[1]}`
        : "unknown";

      const fileName = relativePath.split("/").pop() || "unknown";

      const schemaNames: string[] = [];

      // Scan all exports for Zod schemas
      for (const [exportName, exportValue] of Object.entries(module)) {
        // Skip TypeScript type exports (these end with 'DTO' or 'Type')
        if (exportName.endsWith("DTO") || exportName.endsWith("Type")) {
          continue;
        }

        // Only process exports that follow the schema naming convention (ends with 'Schema')
        // This helps filter out internal/utility schemas that shouldn't be in OpenAPI docs
        if (!exportName.endsWith("Schema")) {
          continue;
        }

        // Check if it's a Zod schema with _def property
        if (
          exportValue &&
          typeof exportValue === "object" &&
          "_def" in exportValue &&
          exportValue._def
        ) {
          const zodSchema = exportValue as ZodTypeAny;

          // Ensure it's a valid Zod schema with a type
          if (!zodSchema._def.type) {
            continue;
          }

          // Store schema with metadata for registry
          allSchemas[exportName] = {
            schema: zodSchema,
            file: fileName,
            location: relativePath,
          };
          schemaNames.push(exportName);
        }
      }

      // Track schemas found in this file
      if (schemaNames.length > 0) {
        fileSchemaMap[relativePath] = schemaNames;
      }
    } catch (error) {
      // Silently skip files that fail to process
    }
  }

  // Register all found schemas
  const totalSchemas = Object.keys(allSchemas).length;

  if (totalSchemas > 0) {
    // Extract module name from first file for metadata
    const firstFile = Object.values(allSchemas)[0];
    const moduleMatch = firstFile.location.match(/modules\/([^/]+)/);
    const providerMatch = firstFile.location.match(/providers\/([^/]+)/);

    // Register each schema in both registries
    for (const [schemaName, schemaInfo] of Object.entries(allSchemas)) {
      // Extract module from this specific file path
      const fileModuleMatch = schemaInfo.location.match(/modules\/([^/]+)/);
      const fileProviderMatch = schemaInfo.location.match(/providers\/([^/]+)/);
      const schemaModule = fileModuleMatch
        ? fileModuleMatch[1]
        : fileProviderMatch
        ? `provider:${fileProviderMatch[1]}`
        : "unknown";

      // 1. Store in central SchemaRegistry with metadata
      SchemaRegistry.register(schemaName, schemaInfo.schema, {
        module: schemaModule,
        file: schemaInfo.file,
        location: schemaInfo.location,
      });

      // 2. Register with OpenAPI for documentation
      app.openAPIRegistry.register(schemaName, schemaInfo.schema);
    }
  }
}
