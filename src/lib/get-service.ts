import { ServiceRegistry } from "@/decorators";

/**
 * Extracts module name from the calling file's stack trace
 */
function getCallingModule(): string | undefined {
  const stack = new Error().stack;
  if (!stack) return undefined;

  const lines = stack.split("\n");
  // Skip first 3 lines (Error, getCallingModule, getService/getServices)
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];

    // Look for module pattern
    const moduleMatch = line.match(/\/modules\/([^\/]+)\//);
    if (moduleMatch) {
      return moduleMatch[1];
    }

    // Look for provider pattern
    const providerMatch = line.match(/\/providers\/([^\/]+)\//);
    if (providerMatch) {
      return `provider:${providerMatch[1]}`;
    }
  }

  return undefined;
}

/**
 * Validates if a service can be accessed from the calling module
 */
function validateServiceAccess(
  serviceName: string,
  serviceModule: string | undefined,
  serviceVisibility: string,
  callingModule: string | undefined,
  serviceExposeTo?: string[]
): void {
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
  if (serviceExposeTo && serviceExposeTo.includes(callingModule)) {
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
function getService<T>(constructorObject: { new (...args: any[]): T }): T {
  const metadata = ServiceRegistry.get(constructorObject);
  if (!metadata) {
    throw new Error(
      `Service not found: ${constructorObject.name}. Did you forget to decorate it with @Service?`
    );
  }

  // Validate access
  const callingModule = getCallingModule();
  validateServiceAccess(
    metadata.name,
    metadata.module,
    metadata.visibility,
    callingModule,
    metadata.exposeTo
  );

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
function getServices<T extends Record<string, new (...args: any[]) => any>>(
  servicesMap: T
): { [K in keyof T]: InstanceType<T[K]> } {
  const services: Record<string, any> = {};
  const callingModule = getCallingModule();

  for (const [alias, constructor] of Object.entries(servicesMap)) {
    const metadata = ServiceRegistry.get(constructor);
    if (!metadata) {
      throw new Error(
        `Service not found: ${constructor.name}. Did you forget to decorate it with @Service?`
      );
    }

    // Validate access for each service
    validateServiceAccess(
      metadata.name,
      metadata.module,
      metadata.visibility,
      callingModule,
      metadata.exposeTo
    );

    services[alias] = metadata.instance;
  }

  return services as { [K in keyof T]: InstanceType<T[K]> };
}

export { getService, getServices };
