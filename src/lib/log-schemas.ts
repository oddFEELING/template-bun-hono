import type { AppLogger } from "./logger";
import { SchemaRegistry } from "./schema-registry";

/**
 * Logs all registered schemas grouped by module
 * Separates schemas into Module and Provider categories
 * Displays statistics and breakdown by type
 */
export function logRegisteredSchemas(logger: AppLogger): void {
  const stats = SchemaRegistry.stats();

  if (stats.total === 0) {
    logger.info("\n[ Schemas ] No schemas registered\n");
    return;
  }

  logger.info("\n\n[ Schemas ]");

  // Group schemas by module
  const moduleSchemas: Record<string, string[]> = {};
  const providerSchemas: Record<string, string[]> = {};

  const allSchemas = SchemaRegistry.getAll();

  for (const [schemaName, schemaInfo] of allSchemas) {
    const module = schemaInfo.metadata.module;

    if (module.startsWith("provider:")) {
      if (!providerSchemas[module]) {
        providerSchemas[module] = [];
      }
      providerSchemas[module].push(schemaName);
    } else {
      if (!moduleSchemas[module]) {
        moduleSchemas[module] = [];
      }
      moduleSchemas[module].push(schemaName);
    }
  }

  // Log module schemas
  if (Object.keys(moduleSchemas).length > 0) {
    logger.info("[ Module Schemas ]");
    for (const [module, schemas] of Object.entries(moduleSchemas)) {
      logger.info(
        `  ├─ ${module} (${schemas.length} schema${
          schemas.length === 1 ? "" : "s"
        })`
      );
    }
    logger.info("");
  }

  // Log provider schemas
  if (Object.keys(providerSchemas).length > 0) {
    logger.info("[ Provider Schemas ]");
    for (const [module, schemas] of Object.entries(providerSchemas)) {
      const providerName = module.replace("provider:", "");
      logger.info(
        `  ├─ ${providerName} (${schemas.length} schema${
          schemas.length === 1 ? "" : "s"
        })`
      );
    }
    logger.info("");
  }

  // Log statistics
  logger.info("[ Schema Statistics ]");
  logger.info(`  ├─ Total: ${stats.total} schemas`);

  if (Object.keys(stats.byType).length > 0) {
    logger.info("  ├─ By Type:");
    for (const [type, count] of Object.entries(stats.byType)) {
      logger.info(`  │  ├─ ${type}: ${count}`);
    }
  }

  logger.info(`\n[ Total ] ${stats.total} schemas registered\n`);
}
