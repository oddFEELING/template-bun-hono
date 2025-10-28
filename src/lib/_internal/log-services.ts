import { ServiceRegistry } from "@/decorators/service.decorator";
import { AppLogger } from "../logger";

/**
 * Logs all registered services grouped by type
 * Separates services into Global, Module, and Provider categories
 * @param logger - The logger instance to use for output
 */
export function logRegisteredServices(logger: AppLogger): void {
	logger.info("\n\n[ Services ]");

	// Separate services by type
	// biome-ignore lint/suspicious/noExplicitAny: Service metadata array can contain various service types
	const moduleServices: any[] = [];
	// biome-ignore lint/suspicious/noExplicitAny: Service metadata array can contain various service types
	const providerServices: any[] = [];
	// biome-ignore lint/suspicious/noExplicitAny: Service metadata array can contain various service types
	const globalServices: any[] = [];

	ServiceRegistry.forEach((metadata) => {
		if (!metadata.module) {
			globalServices.push(metadata);
		} else if (metadata.module.startsWith("provider:")) {
			providerServices.push(metadata);
		} else {
			moduleServices.push(metadata);
		}
	});

	// Log global services
	if (globalServices.length > 0) {
		logger.info("[ Global Services ]");
		globalServices.forEach((metadata) => {
			const visibility =
				metadata.visibility === "public" ? "[PUBLIC]" : "[PRIVATE]";
			logger.info(`  ├─ ${metadata.name} ${visibility}`);
		});
		logger.info("");
	}

	// Log module services
	if (moduleServices.length > 0) {
		logger.info("[ Module Services ]");
		moduleServices.forEach((metadata) => {
			const visibility =
				metadata.visibility === "public" ? "[PUBLIC]" : "[PRIVATE]";
			const exposeTo =
				metadata.exposeTo && metadata.exposeTo.length > 0
					? ` → [${metadata.exposeTo.join(", ")}]`
					: "";
			logger.info(
				`  ├─ ${metadata.name} ${visibility} (${metadata.module})${exposeTo}`
			);
		});
		logger.info("");
	}

	// Log provider services
	if (providerServices.length > 0) {
		logger.info("[ Provider Services ]");
		providerServices.forEach((metadata) => {
			const visibility =
				metadata.visibility === "public" ? "[PUBLIC]" : "[PRIVATE]";
			const providerName =
				metadata.module?.replace("provider:", "") || "unknown";
			const exposeTo =
				metadata.exposeTo && metadata.exposeTo.length > 0
					? ` → [${metadata.exposeTo.join(", ")}]`
					: "";
			logger.info(
				`  ├─ ${metadata.name} ${visibility} (${providerName})${exposeTo}`
			);
		});
		logger.info("");
	}

	logger.info(`[ Total ] ${ServiceRegistry.size} services registered\n`);
}
