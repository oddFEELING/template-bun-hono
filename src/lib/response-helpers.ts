import type { Context } from "hono";

/**
 * HTTP Status Code Constants
 * Centralized status codes for consistent usage across the application
 */
export const HTTP_STATUS = {
	// Success codes
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,

	// Client error codes
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE: 422,
	TOO_MANY_REQUESTS: 429,

	// Server error codes
	SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Standard success response
 * Returns the provided data as JSON with HTTP 200 OK status
 * @param c - Hono context
 * @param data - Response data (sent directly without envelope)
 * @returns JSON response with 200 status
 */
export function successResponse<T>(c: Context, data: T) {
	return c.json(data, HTTP_STATUS.OK);
}

/**
 * Created response for POST requests
 * @param c - Hono context
 * @param data - Created resource data
 * @returns JSON response with 201 status
 */
export function createdResponse<T>(c: Context, data: T) {
	return c.json(data, HTTP_STATUS.CREATED);
}

/**
 * Not found error response
 * Matches the notFoundErrorDto schema structure
 * @param c - Hono context
 * @param message - Error message (default: "Resource not found")
 * @returns JSON response with 404 status
 */
export function notFoundResponse(c: Context, message = "Resource not found") {
	return c.json(
		{
			success: false as const,
			data: null,
			status: HTTP_STATUS.NOT_FOUND,
			error: {
				type: "not_found" as const,
				message,
			},
		},
		HTTP_STATUS.NOT_FOUND
	);
}

/**
 * Bad request error response
 * @param c - Hono context
 * @param message - Error message
 * @returns JSON response with 400 status
 */
export function badRequestResponse(c: Context, message: string) {
	return c.json(
		{
			success: false as const,
			data: null,
			status: HTTP_STATUS.BAD_REQUEST,
			error: {
				type: "bad_request" as const,
				message,
			},
		},
		HTTP_STATUS.BAD_REQUEST
	);
}

/**
 * Unauthorized error response
 * @param c - Hono context
 * @param message - Error message (default: "Unauthorized")
 * @returns JSON response with 401 status
 */
export function unauthorizedResponse(c: Context, message = "Unauthorized") {
	return c.json(
		{
			success: false as const,
			data: null,
			status: HTTP_STATUS.UNAUTHORIZED,
			error: {
				type: "unauthorized" as const,
				message,
			},
		},
		HTTP_STATUS.UNAUTHORIZED
	);
}

/**
 * Forbidden error response
 * @param c - Hono context
 * @param message - Error message (default: "Forbidden")
 * @returns JSON response with 403 status
 */
export function forbiddenResponse(c: Context, message = "Forbidden") {
	return c.json(
		{
			success: false as const,
			data: null,
			status: HTTP_STATUS.FORBIDDEN,
			error: {
				type: "forbidden" as const,
				message,
			},
		},
		HTTP_STATUS.FORBIDDEN
	);
}

/**
 * Generic error response
 * @param c - Hono context
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @returns JSON response with error format
 */
export function errorResponse(
	c: Context,
	message: string,
	status: number = HTTP_STATUS.SERVER_ERROR
) {
	return c.json(
		{
			error: "error",
			message,
		},
		status as never
	);
}
