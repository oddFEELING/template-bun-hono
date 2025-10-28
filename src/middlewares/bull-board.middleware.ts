import { env } from "@/config";
import { AppEnv, errorResponse, getServices, HTTP_STATUS } from "@/lib";
import { BullMqProvider } from "@/providers/bull-mq/bull-mq.service";
import { QueueName } from "@/providers/bull-mq/interfaces/bull-mq.dto";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { serveStatic } from "hono/bun";

const services = getServices({ bullMqProvider: BullMqProvider });

function createBullBoardMiddleware(app: OpenAPIHono<AppEnv>) {
	// Check if Bull Board is enabled via environment variable
	const isEnabled = env.BULL_BOARD_ENABLED;

	// Skip setup if disabled
	if (!isEnabled) {
		return;
	}

	// Set base path for Bull Board UI
	const basePath = "/bull-board";

	// Add authentication guard for Bull Board routes
	// Only authenticated users can access the Bull Board UI
	app.use(`${basePath}/*`, async (c, next) => {
		const user = c.get("user");

		// In production, require authentication
		if (env.NODE_ENV === "production" && !user) {
			return errorResponse(
				c,
				"Authentication required to access Bull Board",
				HTTP_STATUS.FORBIDDEN
			);
		}

		// In development, allow access but log warning if no user
		if (!user) {
			c.get("logger")?.warn("[Bull Board] Accessed without authentication");
		}

		await next();
	});

	// Initialize default queues
	const defaultQueues: QueueName[] = [QueueName.MAIN];
	for (const queueName of defaultQueues) {
		services.bullMqProvider.getQueue(queueName);
	}

	// Get all queues from the BullMQ provider
	const queues = services.bullMqProvider.listQueues();

	// Create server adapter with serveStatic
	const serverAdapter = new HonoAdapter(serveStatic);

	// Create Bull Board with all queues
	createBullBoard({
		queues: queues.map((queue) => new BullMQAdapter(queue)),
		serverAdapter,
	});

	// Register Bull Board plugin
	serverAdapter.setBasePath(basePath);
	app.route(basePath, serverAdapter.registerPlugin());
}

export { createBullBoardMiddleware };
