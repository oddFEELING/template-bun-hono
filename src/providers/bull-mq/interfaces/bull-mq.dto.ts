import { z } from "@hono/zod-openapi";

/**
 * BullMq Provider DTO schema
 */
const bullMqDto = z
	.object({
		// Add your provider configuration fields here
		name: z.string().openapi({
			description: "Name of the BullMq provider",
			example: "BullMq provider",
		}),
	})
	.openapi("BullMqDto");

// Schema is exported for auto-discovery and registered in SchemaRegistry
// Access type via: SchemaRegistryType<"BullMqDto">
export { bullMqDto };
