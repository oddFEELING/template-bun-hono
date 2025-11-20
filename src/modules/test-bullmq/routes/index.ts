import { AppLogger } from "@/lib";
import { getServices } from "@/lib/_internal/get-service";
import type { RouteConfig } from "@/lib/_internal/route-registry";
import { registerRoute } from "@/lib/_internal/route-registry";
import { successResponse } from "@/lib/response-helpers";
import type { AppEnv } from "@/lib/types";
import { BullMqProvider, JobType, QueueName } from "@/providers";
import { OpenAPIHono } from "@hono/zod-openapi";
import { TestBullmqService } from "../test-bullmq.service";
import { testBullmqRoutes } from "./test-bullmq.openapi";

// ~ ======= Get service instances ======= ~
const services = getServices({
	logger: AppLogger,
	testBullmqService: TestBullmqService,
	bullMqProvider: BullMqProvider,
});

// ~ ======= Initialize Router ======= ~
const testBullmqRouter = new OpenAPIHono<AppEnv>();

// ~ ======= Route Handlers ======= ~

// GET / - Hello World
testBullmqRouter.openapi(testBullmqRoutes.hello, async (c) => {
	const data = await services.testBullmqService.getHelloMessage();
	return successResponse(c, data);
});

// POST / - Echo Message
testBullmqRouter.openapi(testBullmqRoutes.echo, async (c) => {
	const body = c.req.valid("json");
	const job = await services.bullMqProvider.addJob(
		QueueName.MAIN,
		JobType.EXAMPLE_JOB,
		{ message: body.message }
	);
	const data = await services.testBullmqService.echoMessage(
		`Job with id ${job.id} has been published to the queue.`
	);

	services.logger.info({ job });
	return successResponse(c, data);
});

// GET /query - Query Parameter Greeting
testBullmqRouter.openapi(testBullmqRoutes.query, async (c) => {
	const query = c.req.valid("query");
	const data = await services.testBullmqService.getPersonalizedGreeting(
		query.name
	);
	return successResponse(c, data);
});

// ~ ======= Route Configuration ======= ~
const testBullmqRouteConfig: RouteConfig = {
	router: testBullmqRouter,
	prefix: "/test-bullmq",
	version: "v1",
	moduleName: "TestBullmq",
};

// ~ ======= Register Route ======= ~
registerRoute(testBullmqRouteConfig);

// ~ ======= Exports ======= ~
export { testBullmqRouteConfig };
export default testBullmqRouter;
