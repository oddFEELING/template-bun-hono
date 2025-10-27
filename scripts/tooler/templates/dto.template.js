import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the DTO interface template file content
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateDtoTemplate(moduleName) {
	const className = toPascalCase(moduleName);
	const varName = toCamelCase(moduleName);
	return `import { z } from "@hono/zod-openapi";

/**
 * ${className} DTO schemas for request/response validation
 */

// ~ ======= Enum Schemas (Optional) ======= ~
// Uncomment and modify as needed for your module
// const ${varName}StatusEnum = z.enum(["active", "inactive", "suspended"]).openapi("${className}Status");
// const ${varName}RoleEnum = z.enum(["admin", "user", "guest"]).openapi("${className}Role");

// ~ ======= Common Schema Patterns (Reference) ======= ~
// Email: z.string().email().openapi({ description: "...", format: "email" })
// Phone: z.string().regex(/^\\+?[1-9]\\d{1,14}$/).openapi({ description: "..." })
// URL: z.string().url().openapi({ description: "...", format: "uri" })
// Date: z.string().date().openapi({ description: "...", format: "date" })
// Array: z.array(z.string()).min(1).max(10).openapi({ description: "..." })

// ~ ======= Entity Schema ======= ~
const ${varName}EntitySchema = z
  .object({
    id: z.uuid().openapi({
      description: "Unique identifier for the ${moduleName}",
    }),
    name: z.string().openapi({
      description: "Name of the ${moduleName}",
    }),
    createdAt: z.iso.datetime().openapi({
      description: "Timestamp when the ${moduleName} was created",
    }),
    updatedAt: z.iso.datetime().openapi({
      description: "Timestamp when the ${moduleName} was last updated",
    }),
  })
  .openapi("${className}");

// ~ ======= ID Parameter Schema ======= ~
const idParamSchema = z
  .object({
    id: z.uuid().openapi({
      param: {
        name: "id",
        in: "path",
      },
      description: "UUID of the ${moduleName}",
    }),
  })
  .openapi("${className}IdParam");

// ~ ======= Create ${className} Schema ======= ~
const create${className}Schema = z
  .object({
    name: z.string().min(1, "Name is required").openapi({
      description: "Name of the ${moduleName}",
    }),
  })
  .openapi("Create${className}");

// ~ ======= Update ${className} Schema ======= ~
const update${className}Schema = create${className}Schema.partial()
  .openapi("Update${className}");

// ~ ======= Query ${className} Schema ======= ~
const query${className}Schema = z
  .object({
    page: z
      .union([z.string(), z.null()])
      .default("1")
      .openapi({
        param: {
          name: "page",
          in: "query",
        },
        type: "string",
        minimum: 1,
        default: 1,
        description: "Page number for pagination",
      }),
    limit: z
      .union([z.string(), z.null()])
      .default("10")
      .openapi({
        param: {
          name: "limit",
          in: "query",
        },
        type: "string",
        minimum: 1,
        maximum: 100,
        default: 10,
        description: "Number of items per page (max 100)",
      }),
  })
  .openapi("${className}QueryParams");

// ~ ======= Response Schema ======= ~
const ${varName}ResponseSchema = ${varName}EntitySchema.openapi(
  "${className}Response"
);

// ~ ======= TypeScript Types ======= ~
type ${className}Entity = z.infer<typeof ${varName}EntitySchema>;
type IdParamDTO = z.infer<typeof idParamSchema>;
type Create${className}DTO = z.infer<typeof create${className}Schema>;
type Update${className}DTO = z.infer<typeof update${className}Schema>;
type Query${className}DTO = z.infer<typeof query${className}Schema>;
type ${className}ResponseDTO = z.infer<typeof ${varName}ResponseSchema>;

// ~ ======= Exports ======= ~
export {
  ${varName}EntitySchema,
  idParamSchema,
  create${className}Schema,
  update${className}Schema,
  query${className}Schema,
  ${varName}ResponseSchema,
};

export type {
  ${className}Entity,
  IdParamDTO,
  Create${className}DTO,
  Update${className}DTO,
  Query${className}DTO,
  ${className}ResponseDTO,
};
`;
}
