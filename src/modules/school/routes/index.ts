import { OpenAPIHono } from "@hono/zod-openapi";
import { getServices } from "@/lib/get-service";
import { registerRoute } from "@/lib/route-registry";
import type { RouteConfig } from "@/lib/route-registry";
import type { AppEnv } from "@/lib/types";
import {
  successResponse,
  createdResponse,
  notFoundResponse,
} from "@/lib/response-helpers";
import { SchoolService } from "../school.service";
import { schoolRoutes } from "./school.openapi";

// ~ ======= Get service instances ======= ~
const services = getServices({
  schoolService: SchoolService,
});

// ~ ======= Initialize router ======= ~
const schoolRouter = new OpenAPIHono<AppEnv>();

// ~ ======= List All Schools (with pagination) ======= ~
schoolRouter.openapi(schoolRoutes.getAll, async (c) => {
  const query = c.req.valid("query");
  const data = await services.schoolService.getAllPaginated(query);
  return successResponse(c, data);
});

// ~ ======= Get School By ID ======= ~
schoolRouter.openapi(schoolRoutes.getById, async (c) => {
  const { id } = c.req.valid("param");
  const data = await services.schoolService.getById(id);
  
  if (!data) {
    return notFoundResponse(c, "School not found");
  }
  
  return successResponse(c, data);
});

// ~ ======= Create School ======= ~
schoolRouter.openapi(schoolRoutes.create, async (c) => {
  const body = c.req.valid("json");
  const data = await services.schoolService.create(body);
  return createdResponse(c, data);
});

// ~ ======= Update School ======= ~
schoolRouter.openapi(schoolRoutes.update, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const data = await services.schoolService.update(id, body);
  
  if (!data) {
    return notFoundResponse(c, "School not found");
  }
  
  return successResponse(c, data);
});

// ~ ======= Delete School ======= ~
schoolRouter.openapi(schoolRoutes.delete, async (c) => {
  const { id } = c.req.valid("param");
  const deleted = await services.schoolService.delete(id);
  
  if (!deleted) {
    return notFoundResponse(c, "School not found");
  }
  
  return successResponse(c, {
    success: true,
    message: "School deleted successfully",
  });
});

// ~ ======= Route Configuration ======= ~
const schoolRouteConfig: RouteConfig = {
  router: schoolRouter,
  prefix: "/school",
  version: "v1",
  moduleName: "School",
};

// ~ ======= Register route ======= ~
registerRoute(schoolRouteConfig);

// ~ ======= Exports ======= ~
export { schoolRouteConfig };
export default schoolRouter;
