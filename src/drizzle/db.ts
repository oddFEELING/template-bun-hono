import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/config";

const client = neon(env.DATABASE_URL);
const db = drizzle({ client });

export default db;
