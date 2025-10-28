import { Service } from "@/decorators";
import { AppLogger } from "@/lib/logger";
import { RedisProvider } from "@/providers/redis/redis.service";
import { type Job, Queue, QueueEvents, Worker } from "bullmq";
import type { RedisOptions } from "ioredis";

/**
 * BullMqProvider
 * Provider class for handling bull-mq integration
 * Uses RedisProvider for connection management
 * Public provider - accessible from other modules
 */
@Service({ visibility: "public" })
export class BullMqProvider {
	private readonly logger: AppLogger;
	private readonly redis: RedisProvider;
	private readonly workers: Map<string, Worker>;
	private readonly queues: Map<string, Queue>;
	private readonly queueEvents: Map<string, QueueEvents>;
	private readonly redisOptions: RedisOptions;

	constructor(logger: AppLogger, redis: RedisProvider) {
		this.logger = logger;
		this.redis = redis;
		this.logger.info("BullMqProvider initialized");

		// ~ ======= Get redis connection options from RedisProvider ======= ~
		// BullMQ requires maxRetriesPerRequest: null for blocking operations
		const redisClient = this.redis.getClient();
		this.redisOptions = {
			...redisClient.options,
			maxRetriesPerRequest: null,
		};

		// ~ ======= Initialize maps ======= ~
		this.queues = new Map<string, Queue>();
		this.workers = new Map<string, Worker>();
		this.queueEvents = new Map<string, QueueEvents>();
	}

	/**
	 * Get or create a queue by name
	 */
	getQueue(queueName: string): Queue {
		if (!this.queues.has(queueName)) {
			// Create the queue
			const queue = new Queue(queueName, {
				connection: this.redisOptions,
			});
			this.queues.set(queueName, queue);
			this.logger.info(`[BullMqProvider] Queue "${queueName}" created`);

			// Create a worker for this queue
			this.createWorkerForQueue(queueName);

			// Create queue events listener for this queue
			this.createQueueEventsListener(queueName);
		}
		return this.queues.get(queueName) as Queue;
	}

	/**
	 * Add a job to a specific queue with options
	 */
	async addJob(
		queueName: string,
		jobName: string,
		jobData: Record<string, unknown>,
		options?: {
			delay?: number;
			attempts?: number;
			backoff?: { type: "exponential" | "fixed"; delay: number };
			priority?: number;
			removeOnComplete?: boolean | number;
			removeOnFail?: boolean | number;
		}
	) {
		const queue = this.getQueue(queueName);
		const job = await queue.add(jobName, jobData, options);
		this.logger.info(
			`[BullMqProvider] Job "${jobName}" (ID: ${job.id}) added to queue "${queueName}"`
		);
		return job;
	}

	/**
	 * Add multiple jobs in bulk to a queue
	 */
	async addBulkJobs(
		queueName: string,
		jobs: Array<{
			name: string;
			data: Record<string, unknown>;
			opts?: Record<string, unknown>;
		}>
	) {
		const queue = this.getQueue(queueName);
		const addedJobs = await queue.addBulk(jobs);
		this.logger.info(
			`[BullMqProvider] Added ${addedJobs.length} jobs to queue "${queueName}"`
		);
		return addedJobs;
	}

	/**
	 * Get a job by ID from a specific queue
	 */
	async getJob(queueName: string, jobId: string) {
		const queue = this.getQueue(queueName);
		const job = await queue.getJob(jobId);
		return job;
	}

	/**
	 * Remove a job by ID from a specific queue
	 */
	async removeJob(queueName: string, jobId: string) {
		const queue = this.getQueue(queueName);
		const job = await queue.getJob(jobId);
		if (job) {
			await job.remove();
			this.logger.info(
				`[BullMqProvider] Job ${jobId} removed from queue "${queueName}"`
			);
			return true;
		}
		return false;
	}

	/**
	 * Pause a queue (stops processing new jobs)
	 */
	async pauseQueue(queueName: string) {
		const queue = this.getQueue(queueName);
		await queue.pause();
		this.logger.info(`[BullMqProvider] Queue "${queueName}" paused`);
	}

	/**
	 * Resume a paused queue
	 */
	async resumeQueue(queueName: string) {
		const queue = this.getQueue(queueName);
		await queue.resume();
		this.logger.info(`[BullMqProvider] Queue "${queueName}" resumed`);
	}

	/**
	 * Get queue job counts (waiting, active, completed, failed, delayed)
	 */
	async getQueueCounts(queueName: string) {
		const queue = this.getQueue(queueName);
		const counts = await queue.getJobCounts(
			"waiting",
			"active",
			"completed",
			"failed",
			"delayed",
			"paused"
		);
		return counts;
	}

	/**
	 * Get jobs in a specific state
	 */
	async getJobs(
		queueName: string,
		state: "waiting" | "active" | "completed" | "failed" | "delayed",
		start = 0,
		end = 10
	) {
		const queue = this.getQueue(queueName);
		let jobs: Job[] = [];

		switch (state) {
			case "waiting":
				jobs = await queue.getWaiting(start, end);
				break;
			case "active":
				jobs = await queue.getActive(start, end);
				break;
			case "completed":
				jobs = await queue.getCompleted(start, end);
				break;
			case "failed":
				jobs = await queue.getFailed(start, end);
				break;
			case "delayed":
				jobs = await queue.getDelayed(start, end);
				break;
			default:
				jobs = [];
		}

		return jobs;
	}

	/**
	 * Clean jobs from a queue (remove old completed/failed jobs)
	 */
	async cleanQueue(
		queueName: string,
		grace: number,
		limit: number,
		type: "completed" | "failed" = "completed"
	) {
		const queue = this.getQueue(queueName);
		const deletedJobs = await queue.clean(grace, limit, type);
		this.logger.info(
			`[BullMqProvider] Cleaned ${deletedJobs.length} ${type} jobs from queue "${queueName}"`
		);
		return deletedJobs;
	}

	/**
	 * Empty a queue (remove all jobs)
	 */
	async emptyQueue(queueName: string) {
		const queue = this.getQueue(queueName);
		await queue.drain();
		this.logger.info(`[BullMqProvider] Queue "${queueName}" emptied`);
	}

	/**
	 * Retry a failed job
	 */
	async retryJob(queueName: string, jobId: string) {
		const job = await this.getJob(queueName, jobId);
		if (job) {
			await job.retry();
			this.logger.info(
				`[BullMqProvider] Job ${jobId} retried in queue "${queueName}"`
			);
			return true;
		}
		return false;
	}

	/**
	 * Get queue metrics (for monitoring)
	 */
	async getQueueMetrics(queueName: string) {
		const queue = this.getQueue(queueName);
		const [counts, isPaused, jobCounts] = await Promise.all([
			queue.getJobCounts(),
			queue.isPaused(),
			queue.getJobCountByTypes("waiting", "active", "completed", "failed"),
		]);

		return {
			queueName,
			isPaused,
			counts,
			jobCounts,
		};
	}

	/**
	 * List all queues
	 */
	listQueues() {
		return Array.from(this.queues.values());
	}

	/**
	 * Get all queue names
	 */
	getQueueNames(): string[] {
		return Array.from(this.queues.keys());
	}

	/**
	 * Create a worker for a specific queue
	 */
	private createWorkerForQueue(queueName: string): Worker {
		const worker = new Worker(
			queueName,
			async (job: Job) => {
				this.logger.info(
					`[BullMqProvider] Processing job "${job.name}" from queue "${queueName}"`
				);

				// Add your job processing logic here based on job.name
				// You can use switch/case or if statements to handle different job types
				await job.updateProgress(50);
				this.logger.info(`[BullMqProvider] Job ${job.name} at 50%`);

				await job.updateProgress(100);
				this.logger.info(`[BullMqProvider] Job ${job.name} completed`);

				return { jobId: job.id, completed: true };
			},
			{
				connection: this.redisOptions,
			}
		);

		// Setup worker event listeners
		worker.on("completed", (job: Job) => {
			this.logger.info(
				`[BullMqProvider][${queueName}] Job ${job.id} completed successfully`
			);
		});

		worker.on("failed", (job: Job | undefined, err: Error) => {
			this.logger.error(
				`[BullMqProvider][${queueName}] Job ${job?.id} failed with error: ${err.message}`
			);
		});

		worker.on("error", (err: Error) => {
			this.logger.error(
				`[BullMqProvider][${queueName}] Worker error: ${err.message}`
			);
		});

		this.workers.set(queueName, worker);
		this.logger.info(
			`[BullMqProvider] Worker created for queue "${queueName}"`
		);

		return worker;
	}

	/**
	 * Create QueueEvents listener for monitoring queue events
	 */
	private createQueueEventsListener(queueName: string): QueueEvents {
		const queueEvents = new QueueEvents(queueName, {
			connection: this.redisOptions,
		});

		// Listen to various queue events
		queueEvents.on("waiting", ({ jobId }) => {
			this.logger.info(
				`[BullMqProvider][${queueName}] Job ${jobId} is waiting`
			);
		});

		queueEvents.on("active", ({ jobId, prev }) => {
			this.logger.info(
				`[BullMqProvider][${queueName}] Job ${jobId} is now active (was ${prev})`
			);
		});

		queueEvents.on("completed", ({ jobId, returnvalue }) => {
			this.logger.info(
				`[BullMqProvider][${queueName}] Job ${jobId} completed with result: ${JSON.stringify(returnvalue)}`
			);
		});

		queueEvents.on("failed", ({ jobId, failedReason }) => {
			this.logger.error(
				`[BullMqProvider][${queueName}] Job ${jobId} failed: ${failedReason}`
			);
		});

		queueEvents.on("progress", ({ jobId, data }) => {
			this.logger.info(
				`[BullMqProvider][${queueName}] Job ${jobId} progress: ${data}%`
			);
		});

		this.queueEvents.set(queueName, queueEvents);
		this.logger.info(
			`[BullMqProvider] QueueEvents listener created for queue "${queueName}"`
		);

		return queueEvents;
	}

	/**
	 * Gracefully close all BullMQ connections
	 * Note: Redis connection is managed by RedisProvider
	 */
	async close() {
		// Close all workers
		for (const [queueName, worker] of this.workers.entries()) {
			await worker.close();
			this.logger.info(
				`[BullMqProvider] Worker closed for queue "${queueName}"`
			);
		}

		// Close all queue events
		for (const [queueName, queueEvents] of this.queueEvents.entries()) {
			await queueEvents.close();
			this.logger.info(
				`[BullMqProvider] QueueEvents closed for queue "${queueName}"`
			);
		}

		// Note: Redis connection is managed by RedisProvider, so we don't close it here
		this.logger.info("[BullMqProvider] Closed all BullMQ connections");
	}
}
