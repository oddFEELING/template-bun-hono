import Pino, { type Logger } from "pino";
import { Service } from "@/decorators";

/**
 * Global logging service
 * Marked as public since it's used across all modules
 */
@Service({ visibility: "public" })
export class AppLogger {
	private readonly logger: Logger;

	constructor() {
		this.logger = Pino({
			level: "info",
			transport: {
				target: "pino-pretty",
				options: {
					colorize: true,
				},
			},
		});
	}

	/**
	 * Logs informational messages using the logger's `info` method.
	 *
	 * @param {...Parameters<Logger["info"]>} args - The arguments to be passed to the logger's `info` method.
	 * @return {void} No return value as the method is used for logging purposes.
	 */
	info(...args: Parameters<Logger["info"]>) {
		return this.logger.info(...args);
	}

	/**
	 * Logs an error message using the underlying logger instance.
	 *
	 * @param {...Parameters<Logger["error"]>} args - The arguments to be passed to the logger's error method.
	 * @return {void} Does not return a value.
	 */
	error(...args: Parameters<Logger["error"]>) {
		return this.logger.error(...args);
	}

	/**
	 * Logs a debug-level message using the associated logger instance.
	 *
	 * @param {...Parameters<Logger["debug"]>} args The arguments to be passed to the logger's debug method.
	 * @return {void} Does not return any value.
	 */
	debug(...args: Parameters<Logger["debug"]>) {
		return this.logger.debug(...args);
	}

	/**
	 * Logs a warning message using the underlying logger instance.
	 *
	 * @param {...Parameters<Logger["warn"]>} args The arguments to be passed to the logger's warn method.
	 * @return {void} Does not return any value.
	 */
	warn(...args: Parameters<Logger["warn"]>) {
		return this.logger.warn(...args);
	}
}
