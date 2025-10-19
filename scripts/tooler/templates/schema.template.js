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
const ${tableVarName} = pgTable("${tableName}", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),

});

// ~ ======= Types ======= ~
type ${toPascalCase(moduleName)} = typeof ${tableVarName}.$inferSelect;
type New${toPascalCase(moduleName)} = typeof ${tableVarName}.$inferInsert;

// ~ ======= Exports ======= ~
export { ${tableVarName} };

export type { ${toPascalCase(moduleName)}, New${toPascalCase(moduleName)}};
`;
}
