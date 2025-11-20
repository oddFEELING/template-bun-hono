import { getServices } from "@/lib/_internal/get-service";
import { AppLogger } from "@/lib/logger";
import type { Job } from "bullmq";
import { JobDataMap, JobType } from "../interfaces/bull-mq.dto";

const services = getServices({
	logger: AppLogger,
});

/**
 * Main Job Consumer
 * Consumes and processes incoming jobs
 *
 * @param job - BullMQ job containing the job data
 * @returns Promise with processing result
 */
export async function mainConsumer(
	job: Job<JobDataMap[JobType.EXAMPLE_JOB]>
): Promise<{ success: boolean; responseText?: string; error?: string }> {
	const { message } = job.data;

	try {
		await job.updateProgress(100);
		return {
			success: true,
			responseText: `Job ${job.id} completed successfully with message: ${message}`,
		};
	} catch (error) {
		services.logger.error({ error, jobData: job.data });

		// Return error result
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
