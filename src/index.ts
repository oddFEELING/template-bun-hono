// Import service auto-discovery to register all services
import "./_init";
// Import route auto-discovery to register all routes
import "./_init-routes";

import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import {
  AppLogger,
  getServices,
  logRegisteredServices,
  type AppEnv,
} from "./lib";
import { addAppMiddleware } from "./middlewares";

const { appLogger } = getServices({ appLogger: AppLogger });

const app = new OpenAPIHono<AppEnv>();
addAppMiddleware(app);

// ~ ======= Log registered services ======= ~
logRegisteredServices(appLogger);

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "Naalya API is running",
    version: "1.0.0",
  });
});

// ~ ======= OpenAPI Documentation ======= ~
app.doc("/doc/raw", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1",
    title: "Chowbea API",
    description: "ChowBea API server documentation",
    contact: {
      name: "Emmanuel Alawode",
      url: "https://github.com/_oddfeeling",
      email: "platforms@chowbea.com",
    },
  },
});

app.get("/doc", Scalar({ url: "/doc/raw" }));

// ~ ======= Export app ======= ~
export default {
  fetch: app.fetch,
  port: 8000,
  idleTimeout: 0,
};
