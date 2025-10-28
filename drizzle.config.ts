import { defineConfig } from "drizzle-kit";
import { env } from "./src/config";

export default defineConfig({
	out: "./src/drizzle/migrations",
	schema: [
		"./src/modules/*/entities/*.schema.ts",
		"./src/providers/*/entities/*.schema.ts",
	],
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
