import { type ZodError } from "zod";

/**
 * Validation error response structure
 * Matches the standard API response schema
 */
export interface ValidationErrorResponse {
	success: false;
	data: null;
	status: 422;
	error: {
		type: "validation_error";
		message: string;
		fields: Record<string, string[]>;
	};
}

/**
 * Formats Zod validation errors into a consistent response structure
 * Converts Zod error issues into field-based error messages
 *
 * @param zodError - The Zod validation error
 * @returns Formatted validation error response
 *
 * @example
 * // Input: Zod error with issues for "name" and "email"
 * // Output:
 * {
 *   success: false,
 *   data: null,
 *   status: 422,
 *   error: {
 *     type: "validation_error",
 *     message: "Validation failed",
 *     fields: {
 *       "name": ["Name is required"],
 *       "email": ["Invalid email format"]
 *     }
 *   }
 * }
 */
export function formatValidationError(
	zodError: ZodError
): ValidationErrorResponse {
	const fields: Record<string, string[]> = {};

	// Convert Zod issues to field-based format
	zodError.issues.forEach((issue) => {
		const path = issue.path.join(".") || "general";
		if (!fields[path]) {
			fields[path] = [];
		}
		fields[path].push(issue.message);
	});

	return {
		success: false as const,
		data: null,
		status: 422,
		error: {
			type: "validation_error" as const,
			message: "Validation failed",
			fields,
		},
	};
}
