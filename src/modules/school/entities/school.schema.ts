import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * school table schema
 * Drizzle ORM schema definition
 */
const school = pgTable("school", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),

});

// ~ ======= Types ======= ~
type School = typeof school.$inferSelect;
type NewSchool = typeof school.$inferInsert;

// ~ ======= Exports ======= ~
export { school };

export type { School, NewSchool};
