import { getServices } from "@/lib/_internal/get-service";
import { AppLogger } from "@/lib/logger";
import type { Job } from "bullmq";
import { BullMqProvider } from "./bull-mq.service";
import { JobDataMap, JobType, QueueName } from "./interfaces/bull-mq.dto";
import { mainConsumer } from "./job-consumers/main.consumer";

/**
 * Register Job Consumers
 * Sets up Workers that will consume jobs from the BullMQ queues
 *
 * This function should be called during application initialization
 * to start consuming and processing jobs from all registered queues.
 *
 * Each consumer is registered with:
 * - Queue name (where jobs will be consumed from)
 * - Consumer function (handles the job logic)
 * - Concurrency options (how many jobs to process simultaneously)
 */
export function registerJobConsumers(): void {
	// Get service instances
	const services = getServices({
		bullMqProvider: BullMqProvider,
		logger: AppLogger,
	});

	services.logger.info("[BullMQ] Registering job consumers...");

	// ~ ======= Register Main QUeue consumer ======= ~
	services.bullMqProvider.registerProcessor(
		QueueName.MAIN,
		async (job) =>
			await mainConsumer(job as Job<JobDataMap[JobType.EXAMPLE_JOB]>),
		{ concurrency: 3 } // Process up to 3 chat messages simultaneously
	);

	services.logger.info("[BullMQ] ✅ Job consumers registered successfully");
}
