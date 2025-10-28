import { z } from "zod";

/**
 * Shared response schemas for consistent API responses
 * Used in both OpenAPI route definitions and response helpers
 */

/**
 * Generic success response schema factory
 * @param dataSchema - The schema for the data field
 * @returns Success response schema
 */
export function createSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
	return z.object({
		success: z.literal(true),
		data: dataSchema,
		status: z.literal(200),
	});
}

/**
 * Generic list response schema factory
 * @param itemSchema - The schema for list items
 * @returns List response schema
 */
export function createListSchema<T extends z.ZodTypeAny>(itemSchema: T) {
	return z.object({
		success: z.literal(true),
		data: z.array(itemSchema).nullable(),
		status: z.literal(200),
	});
}

/**
 * Generic single item response schema factory
 * @param itemSchema - The schema for the item
 * @returns Single item response schema
 */
export function createSingleSchema<T extends z.ZodTypeAny>(itemSchema: T) {
	return z.object({
		success: z.literal(true),
		data: itemSchema.nullable(),
		status: z.number(),
	});
}

/**
 * Created response schema factory (for 201 status)
 * @param itemSchema - The schema for the created item
 * @returns Created response schema with 201 status
 */
export function createCreatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
	return z.object({
		success: z.literal(true),
		data: itemSchema.nullable(),
		status: z.literal(201),
	});
}

/**
 * Base success response (no specific data type)
 */
export const baseSuccessResponse = z.object({
	success: z.literal(true),
	data: z.any(),
	status: z.literal(200),
});

/**
 * Base list response (array of any)
 */
export const baseListResponse = z.object({
	success: z.literal(true),
	data: z.array(z.any()).nullable(),
	status: z.literal(200),
});

/**
 * Base single response (nullable any)
 */
export const baseSingleResponse = z.object({
	success: z.literal(true),
	data: z.any().nullable(),
	status: z.literal(200),
});
