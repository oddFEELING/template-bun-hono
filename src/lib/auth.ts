import db from "@/drizzle/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/**
 * Better Auth instance
 * Configuration for authentication and authorization
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: { enabled: true },
  // Add more auth methods as needed
});

/**
 * Type exports for use in AppEnv and middleware
 */
export type AuthSession = typeof auth.$Infer.Session;
