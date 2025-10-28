import { z } from "@hono/zod-openapi";

/**
 * Shared error response DTOs for consistent API error handling
 * These DTOs ensure all error responses follow the same structure
 */

// ~ ======= Validation Error DTO (422) ======= ~
export const validationErrorDto = z
	.object({
		success: z.literal(false),
		data: z.null(),
		status: z.literal(422),
		error: z.object({
			type: z.literal("validation_error"),
			message: z.string(),
			fields: z.record(z.string(), z.array(z.string())),
		}),
	})
	.openapi("ValidationError");

// ~ ======= Not Found Error DTO (404) ======= ~
export const notFoundErrorDto = z
	.object({
		success: z.literal(false),
		data: z.null(),
		status: z.literal(404),
		error: z.object({
			type: z.literal("not_found"),
			message: z.string(),
		}),
	})
	.openapi("NotFoundError");

// ~ ======= Unauthorized Error DTO (401) ======= ~
export const unauthorizedErrorDto = z
	.object({
		success: z.literal(false),
		data: z.null(),
		status: z.literal(401),
		error: z.object({
			type: z.literal("unauthorized"),
			message: z.string(),
		}),
	})
	.openapi("UnauthorizedError");

// ~ ======= Forbidden Error DTO (403) ======= ~
export const forbiddenErrorDto = z
	.object({
		success: z.literal(false),
		data: z.null(),
		status: z.literal(403),
		error: z.object({
			type: z.literal("forbidden"),
			message: z.string(),
		}),
	})
	.openapi("ForbiddenError");

// ~ ======= Server Error DTO (500) ======= ~
export const serverErrorDto = z
	.object({
		success: z.literal(false),
		data: z.null(),
		status: z.number(),
		error: z.object({
			type: z.string(),
			message: z.string(),
			details: z.any().optional(),
		}),
	})
	.openapi("ServerError");

// ~ ======= Generic Error DTO ======= ~
export const genericErrorDto = z
	.object({
		success: z.literal(false),
		data: z.null(),
		status: z.number(),
		error: z.object({
			type: z.string(),
			message: z.string(),
		}),
	})
	.openapi("GenericError");

// ~ ======= TypeScript Types ======= ~
export type ValidationError = z.infer<typeof validationErrorDto>;
export type NotFoundError = z.infer<typeof notFoundErrorDto>;
export type UnauthorizedError = z.infer<typeof unauthorizedErrorDto>;
export type ForbiddenError = z.infer<typeof forbiddenErrorDto>;
export type ServerError = z.infer<typeof serverErrorDto>;
export type GenericError = z.infer<typeof genericErrorDto>;
