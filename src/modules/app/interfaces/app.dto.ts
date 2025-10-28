import { z } from "@hono/zod-openapi";

/**
 * Shared Application DTOs
 * Common DTOs used across all modules
 */

// ~ ======= ID Parameter DTO ======= ~
const idParamDto = z
	.object({
		id: z.uuid().openapi({
			param: {
				name: "id",
				in: "path",
			},
			description: "UUID identifier",
			example: "123e4567-e89b-12d3-a456-426614174000",
		}),
	})
	.openapi("IdParam");

// ~ ======= Exports ======= ~
export { idParamDto };
