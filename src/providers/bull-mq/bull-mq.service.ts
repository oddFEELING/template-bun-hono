import { Service } from "@/decorators";
import { AppLogger } from "@/lib/logger";
import { RedisProvider } from "@/providers/redis/redis.service";
import { type Job, Queue, QueueEvents, Worker } from "bullmq";
import type { RedisOptions } from "ioredis";
import { type JobDataMap, JobType, QueueName } from "./interfaces/bull-mq.dto";

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
	 * Note: This only creates the Queue instance. Workers and event listeners
	 * must be registered explicitly using registerProcessor()
	 */
	getQueue(queueName: QueueName): Queue {
		if (!this.queues.has(queueName)) {
			// Create the queue
			const queue = new Queue(queueName, {
				connection: this.redisOptions,
			});
			this.queues.set(queueName, queue);
			this.logger.info(`[BullMqProvider] Queue "${queueName}" created`);
		}
		return this.queues.get(queueName) as Queue;
	}

	/**
	 * Register a processor for a queue (creates Worker and QueueEvents)
	 * This should be called explicitly to process jobs in a queue
	 */
	registerProcessor<T extends JobType = JobType>(
		queueName: QueueName,
		processor: (job: Job<JobDataMap[T]>) => Promise<unknown>,
		opts?: { concurrency?: number }
	): Worker {
		// Ensure queue exists
		this.getQueue(queueName);

		// Check if worker already exists
		if (this.workers.has(queueName)) {
			this.logger.warn(
				`[BullMqProvider] Worker already exists for "${queueName}"`
			);
			return this.workers.get(queueName) as Worker;
		}

		// Create worker with custom processor
		const worker = new Worker(queueName, processor, {
			connection: this.redisOptions,
			concurrency: opts?.concurrency ?? 1,
		});

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
			`[BullMqProvider] Worker registered for queue "${queueName}"`
		);

		// Create queue events listener if not exists
		if (!this.queueEvents.has(queueName)) {
			this.createQueueEventsListener(queueName);
		}

		return worker;
	}

	/**
	 * Add a job to a specific queue with options
	 * Generic type ensures job data matches the job type
	 */
	async addJob<T extends JobType>(
		queueName: QueueName,
		jobType: T,
		jobData: JobDataMap[T],
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
		const job = await queue.add(jobType, jobData, options);
		this.logger.info(
			`[BullMqProvider] Job "${jobType}" (ID: ${job.id}) added to queue "${queueName}"`
		);
		return job;
	}

	/**
	 * Add multiple jobs in bulk to a queue
	 */
	async addBulkJobs<T extends JobType>(
		queueName: QueueName,
		jobs: Array<{
			name: T;
			data: JobDataMap[T];
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
	async getJob(queueName: QueueName, jobId: string) {
		const queue = this.getQueue(queueName);
		const job = await queue.getJob(jobId);
		return job;
	}

	/**
	 * Remove a job by ID from a specific queue
	 */
	async removeJob(queueName: QueueName, jobId: string) {
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
	async pauseQueue(queueName: QueueName) {
		const queue = this.getQueue(queueName);
		await queue.pause();
		this.logger.info(`[BullMqProvider] Queue "${queueName}" paused`);
	}

	/**
	 * Resume a paused queue
	 */
	async resumeQueue(queueName: QueueName) {
		const queue = this.getQueue(queueName);
		await queue.resume();
		this.logger.info(`[BullMqProvider] Queue "${queueName}" resumed`);
	}

	/**
	 * Get queue job counts (waiting, active, completed, failed, delayed)
	 */
	async getQueueCounts(queueName: QueueName) {
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
		queueName: QueueName,
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
		queueName: QueueName,
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
	async emptyQueue(queueName: QueueName) {
		const queue = this.getQueue(queueName);
		await queue.drain();
		this.logger.info(`[BullMqProvider] Queue "${queueName}" emptied`);
	}

	/**
	 * Retry a failed job
	 */
	async retryJob(queueName: QueueName, jobId: string) {
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
	async getQueueMetrics(queueName: QueueName) {
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
	 * Create QueueEvents listener for monitoring queue events
	 */
	private createQueueEventsListener(queueName: QueueName): QueueEvents {
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

		// Close all queues
		for (const [queueName, queue] of this.queues.entries()) {
			await queue.close();
			this.logger.info(
				`[BullMqProvider] Queue closed for queue "${queueName}"`
			);
		}

		// Note: Redis connection is managed by RedisProvider, so we don't close it here
		this.logger.info("[BullMqProvider] Closed all BullMQ connections");
	}
}
