import { ServiceRegistry } from "@/decorators";

/**
 * Regex patterns for extracting module information from stack traces
 * Defined at module level for better performance
 */
const MODULE_PATH_PATTERN = /\/modules\/([^/]+)\//;
const PROVIDER_PATH_PATTERN = /\/providers\/([^/]+)\//;

/**
 * Extracts module name from the calling file's stack trace
 */
function getCallingModule(): string | undefined {
	const stack = new Error("Stack trace for module detection").stack;
	if (!stack) {
		return;
	}

	const lines = stack.split("\n");
	// Skip first 3 lines (Error, getCallingModule, getService/getServices)
	for (let i = 3; i < lines.length; i++) {
		const line = lines[i];

		// Look for module pattern
		const moduleMatch = line.match(MODULE_PATH_PATTERN);
		if (moduleMatch) {
			return moduleMatch[1];
		}

		// Look for provider pattern
		const providerMatch = line.match(PROVIDER_PATH_PATTERN);
		if (providerMatch) {
			return `provider:${providerMatch[1]}`;
		}
	}

	return;
}

/**
 * Service access validation parameters
 */
interface ServiceAccessParams {
	serviceName: string;
	serviceModule: string | undefined;
	serviceVisibility: string;
	callingModule: string | undefined;
	serviceExposeTo?: string[];
}

/**
 * Validates if a service can be accessed from the calling module
 */
function validateServiceAccess(params: ServiceAccessParams): void {
	const {
		serviceName,
		serviceModule,
		serviceVisibility,
		callingModule,
		serviceExposeTo,
	} = params;
	// Public services can be accessed from anywhere
	if (serviceVisibility === "public") {
		return;
	}

	// Services without module info are considered global (e.g., AppLogger)
	if (!serviceModule) {
		return;
	}

	// If calling module can't be determined, allow access (e.g., from middleware, init files)
	if (!callingModule) {
		return;
	}

	// Same module always has access
	if (serviceModule === callingModule) {
		return;
	}

	// Check if caller is in the exposeTo list
	if (serviceExposeTo?.includes(callingModule)) {
		return;
	}

	// Access denied - build helpful error message
	let errorMessage = `Access denied: ${serviceName} is private to the "${serviceModule}" module and cannot be used in "${callingModule}".`;

	if (serviceExposeTo && serviceExposeTo.length > 0) {
		errorMessage += ` This service is only exposed to: [${serviceExposeTo.join(
			", "
		)}].`;
	}

	errorMessage += "\n\nTo fix this, you can:";
	errorMessage +=
		"\n1. Mark the service as public: @Service({ visibility: 'public' })";
	errorMessage += `\n2. Add '${callingModule}' to exposeTo: @Service({ exposeTo: ['${callingModule}'] })`;
	errorMessage +=
		"\n3. Remove the cross-module dependency (recommended for clean architecture)";

	throw new Error(errorMessage);
}

/**
 * Retrieves a resolved service instance from the registry.
 * Validates that private services are only accessed within their own module.
 *
 * @param constructorObject The class constructor of the service to retrieve.
 * @returns The singleton instance of the service.
 * @throws Error if service is not found or access is denied
 */
// biome-ignore lint/suspicious/noExplicitAny: Constructor signature requires flexible parameter types
function getService<T>(constructorObject: { new (...args: any[]): T }): T {
	const metadata = ServiceRegistry.get(constructorObject);
	if (!metadata) {
		throw new Error(
			`Service not found: ${constructorObject.name}. Did you forget to decorate it with @Service?`
		);
	}

	// Validate access
	const callingModule = getCallingModule();
	validateServiceAccess({
		serviceName: metadata.name,
		serviceModule: metadata.module,
		serviceVisibility: metadata.visibility,
		callingModule,
		serviceExposeTo: metadata.exposeTo,
	});

	return metadata.instance;
}

/**
 * Retrieves multiple resolved service instances from the registry with custom aliases.
 * Validates that private services are only accessed within their own module.
 *
 * @param servicesMap An object mapping alias names to service class constructors.
 * @returns An object containing the service instances, accessible by the provided aliases.
 * @throws Error if any service is not found or access is denied
 * @example
 * const services = getServices({
 *   appLogger: AppLogger,
 *   schoolService: SchoolService
 * });
 * const value = services.appLogger.log("something");
 * const school = services.schoolService.getSchool();
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic type parameters require flexible typing for service constructors
function getServices<T extends Record<string, new (...args: any[]) => any>>(
	servicesMap: T
): { [K in keyof T]: InstanceType<T[K]> } {
	// biome-ignore lint/suspicious/noExplicitAny: Service instances can be of any type
	const services: Record<string, any> = {};
	const callingModule = getCallingModule();

	for (const [alias, serviceConstructor] of Object.entries(servicesMap)) {
		const metadata = ServiceRegistry.get(serviceConstructor);
		if (!metadata) {
			throw new Error(
				`Service not found: ${serviceConstructor.name}. Did you forget to decorate it with @Service?`
			);
		}

		// Validate access for each service
		validateServiceAccess({
			serviceName: metadata.name,
			serviceModule: metadata.module,
			serviceVisibility: metadata.visibility,
			callingModule,
			serviceExposeTo: metadata.exposeTo,
		});

		services[alias] = metadata.instance;
	}

	return services as { [K in keyof T]: InstanceType<T[K]> };
}

export { getService, getServices };
