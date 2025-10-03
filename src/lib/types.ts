import type { auth } from "./auth";
import type { AppLogger } from "./logger";

/**
 * Application Environment Types
 * Defines the shape of context variables available in Hono handlers
 */
export type AppEnv = {
  Variables: {
    logger: AppLogger;
    requestId: string;
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};
