import { AppEnv, getServices } from "@/lib";
import { BullMqProvider } from "@/providers/bull-mq/bull-mq.service";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { serveStatic } from "hono/bun";

const services = getServices({ bullMqProvider: BullMqProvider });

// Define your queue names here for type safety
type QueueNames = "main";

function createBullBoardMiddleware(app: OpenAPIHono<AppEnv>) {
	// Initialize default queues
	const defaultQueues: QueueNames[] = ["main"];
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

	// Set base path and register plugin
	const basePath = "/bull-board";
	serverAdapter.setBasePath(basePath);
	app.route(basePath, serverAdapter.registerPlugin());
}

export { createBullBoardMiddleware };
export type { QueueNames };
