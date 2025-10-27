import { z } from "zod";

/**
 * Shared error response schemas for consistent API error handling
 * These schemas ensure all error responses follow the same structure
 */

// ~ ======= Validation Error Schema (422) ======= ~
export const validationErrorSchema = z.object({
	success: z.literal(false),
	data: z.null(),
	status: z.literal(422),
	error: z.object({
		type: z.literal("validation_error"),
		message: z.string(),
		fields: z.record(z.string(), z.array(z.string())),
	}),
});

// ~ ======= Not Found Error Schema (404) ======= ~
export const notFoundErrorSchema = z.object({
	success: z.literal(false),
	data: z.null(),
	status: z.literal(404),
	error: z.object({
		type: z.literal("not_found"),
		message: z.string(),
	}),
});

// ~ ======= Unauthorized Error Schema (401) ======= ~
export const unauthorizedErrorSchema = z.object({
	success: z.literal(false),
	data: z.null(),
	status: z.literal(401),
	error: z.object({
		type: z.literal("unauthorized"),
		message: z.string(),
	}),
});

// ~ ======= Forbidden Error Schema (403) ======= ~
export const forbiddenErrorSchema = z.object({
	success: z.literal(false),
	data: z.null(),
	status: z.literal(403),
	error: z.object({
		type: z.literal("forbidden"),
		message: z.string(),
	}),
});

// ~ ======= Server Error Schema (500) ======= ~
export const serverErrorSchema = z.object({
	success: z.literal(false),
	data: z.null(),
	status: z.number(),
	error: z.object({
		type: z.string(),
		message: z.string(),
		details: z.any().optional(),
	}),
});

// ~ ======= Generic Error Schema ======= ~
export const genericErrorSchema = z.object({
	success: z.literal(false),
	data: z.null(),
	status: z.number(),
	error: z.object({
		type: z.string(),
		message: z.string(),
	}),
});

// ~ ======= TypeScript Types ======= ~
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type NotFoundError = z.infer<typeof notFoundErrorSchema>;
export type UnauthorizedError = z.infer<typeof unauthorizedErrorSchema>;
export type ForbiddenError = z.infer<typeof forbiddenErrorSchema>;
export type ServerError = z.infer<typeof serverErrorSchema>;
export type GenericError = z.infer<typeof genericErrorSchema>;
