import { z } from "@hono/zod-openapi";

/**
 * Queue Names Enum
 * Define all available queue names here
 * Add new queues as your application grows
 */
export enum QueueName {
	MAIN = "main",
	EMAIL = "email",
	NOTIFICATIONS = "notifications",
}

/**
 * Job Types Enum
 * Define all job types that can be processed
 * Organize by queue or functionality
 */
export enum JobType {
	// Main queue jobs
	SEND_EMAIL = "sendEmail",
	PROCESS_IMAGE = "processImage",
	GENERATE_REPORT = "generateReport",
	EXAMPLE_JOB = "example_job",

	// Notification queue jobs
	SEND_NOTIFICATION = "sendNotification",
	SEND_SMS = "sendSms",

	// Add more job types as needed
}

/**
 * BullMq Provider DTO schema
 */
const bullMqDto = z
	.object({
		queueName: z.enum(QueueName).openapi({
			description: "Name of the queue",
			example: QueueName.MAIN,
		}),
		jobType: z.enum(JobType).openapi({
			description: "Type of job to process",
			example: JobType.SEND_EMAIL,
		}),
		jobData: z.record(z.string(), z.unknown()).openapi({
			description: "Job data payload",
			example: { to: "user@example.com", subject: "Hello" },
		}),
	})
	.openapi("BullMqDto");

// Type for job data based on job type
export type JobDataMap = {
	[JobType.SEND_EMAIL]: {
		to: string;
		subject: string;
		body: string;
	};
	[JobType.PROCESS_IMAGE]: {
		imageUrl: string;
		width?: number;
		height?: number;
	};
	[JobType.GENERATE_REPORT]: {
		reportId: string;
		userId: string;
		format: "pdf" | "csv";
	};
	[JobType.SEND_NOTIFICATION]: {
		userId: string;
		message: string;
		type: "info" | "warning" | "error";
	};
	[JobType.SEND_SMS]: {
		phoneNumber: string;
		message: string;
	};
	[JobType.EXAMPLE_JOB]: {
		message: string;
	};
};

// Schema is exported for auto-discovery and registered in SchemaRegistry
// Access type via: SchemaRegistryType<"BullMqDto">
export { bullMqDto };
