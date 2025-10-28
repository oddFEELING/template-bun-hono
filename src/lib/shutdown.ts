import type { Server } from "bun";
import { env } from "@/config";
import type { AppLogger } from "./logger";

/**
 * Type definition for cleanup handler functions
 * Each handler should return a promise that resolves when cleanup is complete
 */
type CleanupHandler = () => Promise<void>;

/**
 * ShutdownManager
 * Coordinates graceful shutdown of the application
 * Handles SIGTERM and SIGINT signals to ensure clean resource cleanup
 */
export class ShutdownManager {
	private readonly logger: AppLogger;
	private readonly server: Server;
	private readonly cleanupHandlers: CleanupHandler[] = [];
	private readonly shutdownTimeout: number;
	private isShuttingDown = false;

	constructor(server: Server, logger: AppLogger) {
		this.server = server;
		this.logger = logger;
		this.shutdownTimeout = env.SHUTDOWN_TIMEOUT;
		this.setupSignalHandlers();
	}

	/**
	 * Register a cleanup handler to be called during shutdown
	 * Handlers are called in the order they are registered
	 */
	registerCleanupHandler(handler: CleanupHandler): void {
		this.cleanupHandlers.push(handler);
		this.logger.info(
			`[ShutdownManager] Cleanup handler registered (total: ${this.cleanupHandlers.length})`
		);
	}

	/**
	 * Setup signal handlers for SIGTERM and SIGINT
	 * These signals are commonly used for graceful shutdown in production
	 */
	private setupSignalHandlers(): void {
		// Handle SIGTERM (sent by container orchestrators like Kubernetes)
		process.on("SIGTERM", () => {
			this.logger.info(
				"[ShutdownManager] SIGTERM signal received, initiating graceful shutdown"
			);
			this.shutdown("SIGTERM");
		});

		// Handle SIGINT (sent by Ctrl+C in terminal)
		process.on("SIGINT", () => {
			this.logger.info(
				"[ShutdownManager] SIGINT signal received, initiating graceful shutdown"
			);
			this.shutdown("SIGINT");
		});

		this.logger.info(
			"[ShutdownManager] Signal handlers registered for SIGTERM and SIGINT"
		);
	}

	/**
	 * Execute graceful shutdown process
	 * 1. Stop accepting new requests
	 * 2. Run all cleanup handlers with timeout protection
	 * 3. Exit process
	 */
	private async shutdown(_signal: string): Promise<void> {
		// Prevent multiple shutdown calls
		if (this.isShuttingDown) {
			this.logger.warn(
				"[ShutdownManager] Shutdown already in progress, ignoring signal"
			);
			return;
		}

		this.isShuttingDown = true;
		const startTime = Date.now();

		this.logger.info(
			`[ShutdownManager] Starting graceful shutdown (timeout: ${this.shutdownTimeout}ms)`
		);

		try {
			// Stop the server from accepting new connections
			this.logger.info("[ShutdownManager] Stopping server...");
			this.server.stop();
			this.logger.info("[ShutdownManager] Server stopped accepting new requests");

			// Execute all cleanup handlers with timeout protection
			await this.executeCleanupHandlers();

			const duration = Date.now() - startTime;
			this.logger.info(
				`[ShutdownManager] Graceful shutdown completed successfully in ${duration}ms`
			);

			// Exit with success code
			process.exit(0);
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error(
				`[ShutdownManager] Error during shutdown after ${duration}ms: ${error instanceof Error ? error.message : String(error)}`
			);

			// Exit with error code
			process.exit(1);
		}
	}

	/**
	 * Execute all registered cleanup handlers
	 * Implements timeout protection to prevent hanging
	 */
	private async executeCleanupHandlers(): Promise<void> {
		if (this.cleanupHandlers.length === 0) {
			this.logger.info("[ShutdownManager] No cleanup handlers registered");
			return;
		}

		this.logger.info(
			`[ShutdownManager] Running ${this.cleanupHandlers.length} cleanup handler(s)...`
		);

		// Create a promise that rejects on timeout
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				reject(
					new Error(
						`Shutdown timeout exceeded (${this.shutdownTimeout}ms), forcing exit`
					)
				);
			}, this.shutdownTimeout);
		});

		// Create a promise that resolves when all cleanup handlers complete
		const cleanupPromise = (async () => {
			for (let i = 0; i < this.cleanupHandlers.length; i++) {
				const handler = this.cleanupHandlers[i];
				try {
					this.logger.info(
						`[ShutdownManager] Executing cleanup handler ${i + 1}/${this.cleanupHandlers.length}...`
					);
					await handler();
					this.logger.info(
						`[ShutdownManager] Cleanup handler ${i + 1}/${this.cleanupHandlers.length} completed`
					);
				} catch (error) {
					this.logger.error(
						`[ShutdownManager] Cleanup handler ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`
					);
					// Continue with other handlers even if one fails
				}
			}
		})();

		// Race between cleanup completion and timeout
		try {
			await Promise.race([cleanupPromise, timeoutPromise]);
			this.logger.info("[ShutdownManager] All cleanup handlers completed");
		} catch (error) {
			this.logger.error(
				`[ShutdownManager] Cleanup timeout or error: ${error instanceof Error ? error.message : String(error)}`
			);
			throw error;
		}
	}
}

