import "reflect-metadata";
import { container, injectable, singleton } from "tsyringe";

// Import ModuleIdentifier type from generated file for autocomplete
// Note: Run 'bun run generate:modules' first if this import fails
import type { ModuleIdentifier } from "../_generated/modules";

/**
 * Service visibility options
 * - 'public': Service can be used by any module
 * - 'private': Service can only be used within its own module (default)
 */
export type ServiceVisibility = "public" | "private";

/**
 * Service metadata stored in the registry
 */
export interface ServiceMetadata {
  instance: any;
  visibility: ServiceVisibility;
  module?: string;
  name: string;
  exposeTo?: string[];
}

// ~ ======= Create registry ======= ~
export const ServiceRegistry = new Map<Function, ServiceMetadata>();

/**
 * Extracts module name from file path
 * E.g., /path/to/src/modules/users/users.service.ts -> "users"
 */
function getModuleFromStack(): string | undefined {
  const stack = new Error().stack;
  if (!stack) return undefined;

  // Look for module pattern in stack trace
  const moduleMatch = stack.match(/\/modules\/([^\/]+)\//);
  if (moduleMatch) {
    return moduleMatch[1];
  }

  // Look for provider pattern in stack trace
  const providerMatch = stack.match(/\/providers\/([^\/]+)\//);
  if (providerMatch) {
    return `provider:${providerMatch[1]}`;
  }

  return undefined;
}

/**
 * Service decorator options
 *
 * Note: You cannot use both visibility: 'public' and exposeTo together.
 * Public services are accessible everywhere, making exposeTo redundant.
 */
export interface ServiceOptions {
  /**
   * Visibility of the service
   * - 'public': Can be used by any module
   * - 'private': Only usable within its own module or modules specified in exposeTo (default)
   *
   * Cannot be used together with exposeTo.
   */
  visibility?: ServiceVisibility;

  /**
   * List of module names that can access this private service
   * Only valid when visibility is 'private' (or omitted)
   * Must be valid module identifiers (validated at runtime)
   *
   * Cannot be used together with visibility: 'public'.
   *
   * @example ['orders', 'payments', 'provider:stripe']
   */
  exposeTo?: ModuleIdentifier[];
}

/**
 * @Service
 * A custom class decorator that combines tsyringe's @injectable and @singleton
 * decorators and immediately resolves the class instance, storing it in a registry.
 * This makes the service a singleton and ready for immediate use via getService().
 *
 * Services are private by default and can only be used within their own module.
 * Use @Service({ visibility: 'public' }) to make a service available to other modules.
 * Use @Service({ exposeTo: ['module1', 'module2'] }) for granular access control.
 *
 * @param options Service configuration options
 * @example
 * // Private service (default)
 * @Service()
 * export class UsersService { }
 *
 * // Public service
 * @Service({ visibility: 'public' })
 * export class UsersFacade { }
 *
 * // Expose to specific modules
 * @Service({ exposeTo: ['orders', 'payments'] })
 * export class UsersService { }
 *
 * // Expose to specific provider
 * @Service({ exposeTo: ['provider:stripe'] })
 * export class PaymentsService { }
 */
export function Service(options?: ServiceOptions) {
  return function <T extends { new (...args: any[]): {} }>(
    constructorObject: T
  ) {
    const visibility = options?.visibility || "private";
    const exposeTo = options?.exposeTo;
    const module = getModuleFromStack();

    // ~ ======= Validate configuration conflicts ======= ~
    if (visibility === "public" && exposeTo && exposeTo.length > 0) {
      throw new Error(
        `Invalid @Service configuration in ${constructorObject.name}:\n` +
          `Cannot use 'exposeTo' when visibility is 'public'.\n\n` +
          `Public services are accessible from all modules, making 'exposeTo' redundant.\n` +
          `Either:\n` +
          `  - Remove 'exposeTo' to keep it public\n` +
          `  - Remove 'visibility: "public"' to use granular access control with 'exposeTo'`
      );
    }

    // ~ ======= Validate exposeTo field ======= ~
    if (exposeTo && exposeTo.length > 0) {
      validateExposeToField(constructorObject.name, exposeTo);
    }

    // ~ ======= Register into dependency injector container ======= ~
    injectable()(constructorObject);
    singleton()(constructorObject);

    // ~ ======= Validate constructor dependencies BEFORE resolution ======= ~
    // Get constructor parameters and validate their visibility
    validateConstructorDependencies(constructorObject, module, exposeTo);

    // ~ ======= Resolve the instance ======= ~
    const instance = container.resolve(constructorObject);

    // ~ ======= Store instance with metadata in the registry ======= ~
    ServiceRegistry.set(constructorObject, {
      instance,
      visibility,
      module,
      name: constructorObject.name,
      exposeTo,
    });
  };
}

/**
 * Validates the exposeTo field against available modules
 */
function validateExposeToField(serviceName: string, exposeTo: string[]): void {
  try {
    // Dynamically import the generated module list
    const { validateModules } = require("../_generated/modules");
    const invalidModules = validateModules(exposeTo);

    if (invalidModules.length > 0) {
      throw new Error(
        `Invalid exposeTo configuration in ${serviceName}:\n` +
          `  Invalid modules: [${invalidModules.join(", ")}]\n\n` +
          `Run 'bun run generate:modules' to see available modules.\n` +
          `Available modules are listed in src/_generated/modules.ts`
      );
    }
  } catch (error) {
    if ((error as any).code === "MODULE_NOT_FOUND") {
      console.warn(
        `⚠️  Warning: Module list not generated. Run 'bun run generate:modules' to generate it.`
      );
    } else {
      throw error;
    }
  }
}

/**
 * Validates that all constructor dependencies respect visibility rules
 */
function validateConstructorDependencies(
  constructorObject: any,
  callingModule: string | undefined,
  callingExposeTo?: string[]
): void {
  // Get constructor parameter types from reflect metadata
  const paramTypes =
    Reflect.getMetadata("design:paramtypes", constructorObject) || [];

  for (const paramType of paramTypes) {
    // Skip if not a registered service
    if (!ServiceRegistry.has(paramType)) {
      continue;
    }

    const metadata = ServiceRegistry.get(paramType);
    if (!metadata) {
      continue;
    }

    // Validate access using granular permissions
    const hasAccess = canAccessService(
      constructorObject.name,
      callingModule,
      metadata.name,
      metadata.visibility,
      metadata.module,
      metadata.exposeTo
    );

    if (!hasAccess) {
      const errorMessage = buildAccessDeniedMessage(
        constructorObject.name,
        callingModule,
        metadata.name,
        metadata.module,
        metadata.exposeTo
      );
      throw new Error(errorMessage);
    }
  }
}

/**
 * Checks if a service can access another service based on visibility rules
 */
function canAccessService(
  consumerName: string,
  consumerModule: string | undefined,
  serviceName: string,
  serviceVisibility: ServiceVisibility,
  serviceModule: string | undefined,
  serviceExposeTo?: string[]
): boolean {
  // Public services are always accessible
  if (serviceVisibility === "public") {
    return true;
  }

  // Services without module info are considered global
  if (!serviceModule) {
    return true;
  }

  // If consumer module can't be determined, allow (e.g., from middleware, init files)
  if (!consumerModule) {
    return true;
  }

  // Same module always has access
  if (serviceModule === consumerModule) {
    return true;
  }

  // Check if consumer is in the exposeTo list
  if (serviceExposeTo && serviceExposeTo.includes(consumerModule)) {
    return true;
  }

  // Access denied
  return false;
}

/**
 * Builds a detailed error message for access denial
 */
function buildAccessDeniedMessage(
  consumerName: string,
  consumerModule: string | undefined,
  serviceName: string,
  serviceModule: string | undefined,
  serviceExposeTo?: string[]
): string {
  let message = `Access denied: ${consumerName}`;

  if (consumerModule) {
    message += ` in "${consumerModule}" module`;
  }

  message += ` cannot inject ${serviceName}`;

  if (serviceModule) {
    message += ` which is private to the "${serviceModule}" module`;
  }

  message += ".";

  if (serviceExposeTo && serviceExposeTo.length > 0) {
    message += ` This service is only exposed to: [${serviceExposeTo.join(
      ", "
    )}].`;
  }

  message += "\n\nTo fix this, you can:";
  message +=
    "\n1. Mark the service as public: @Service({ visibility: 'public' })";

  if (consumerModule) {
    message += `\n2. Add '${consumerModule}' to exposeTo: @Service({ exposeTo: ['${consumerModule}'] })`;
  }

  message +=
    "\n3. Remove the cross-module dependency (recommended for clean architecture)";

  return message;
}
