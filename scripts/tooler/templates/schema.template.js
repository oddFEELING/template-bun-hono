import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the Drizzle schema template file content
 * @param {string} moduleName - The name of the module
 * @returns {string} The schema template content
 */
export function generateSchemaTemplate(moduleName) {
  const tableVarName = toCamelCase(moduleName); // productV2 (valid identifier)
  const tableName = moduleName; // product-v2 (database table name)
  return `import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * ${tableName} table schema
 * Drizzle ORM schema definition
 */
export const ${tableVarName}Table = pgTable("${tableName}", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // TODO: Add your columns here
});

// ~ ======= Types ======= ~
export type ${toPascalCase(
    moduleName
  )} = typeof ${tableVarName}Table.$inferSelect;
export type New${toPascalCase(
    moduleName
  )} = typeof ${tableVarName}Table.$inferInsert;
`;
}
