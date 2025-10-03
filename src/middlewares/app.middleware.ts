import { getService } from "@/lib/get-service";
import { AppLogger } from "@/lib/logger";
import type { AppEnv } from "@/lib/types";
import routes from "@/modules/app";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { injectSession } from "./auth.middleware";
import { addContextVariables } from "./context.middleware";

const logger = getService(AppLogger);

export const addAppMiddleware = (app: OpenAPIHono<AppEnv>) => {
  // Add context variables (logger, requestId)
  app.use(addContextVariables);

  // Inject session into all routes
  app.use(injectSession);

  // Global middleware
  app.use(cors());
  app.use(prettyJSON());
  app.use(secureHeaders());
  app.use(timeout(10000));
  app.use(honoLogger(logger.info.bind(logger)));

  // Mount the app router (which includes docs + all API routes)
  app.route("/", routes);
};
