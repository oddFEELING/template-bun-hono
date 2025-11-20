import { Service } from "@/decorators";
import { AppLogger } from "@/lib/logger";

/**
 * TestBullmqService
 * Service class for handling test-bullmq business logic
 * Private service - only accessible within this module
 */
@Service()
export class TestBullmqService {
  private readonly logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
    this.logger.info("TestBullmqService initialized");
  }

  /**
   * Generates a hello world message
   * @returns Hello world message
   */
  async getHelloMessage() {
    this.logger.info("Generating hello message");
    return {
      message: "Hello World from TestBullmq!",
    };
  }

  /**
   * Echoes back the provided message
   * @param message - The message to echo back
   * @returns The echoed message
   */
  async echoMessage(message: string) {
    this.logger.info(`Echoing message: ${message}`);
    return {
      message,
    };
  }

  /**
   * Generates a personalized greeting
   * @param name - The name to include in the greeting (defaults to "World")
   * @returns Personalized greeting message
   */
  async getPersonalizedGreeting(name?: string) {
    const userName = name || "World";
    this.logger.info(`Generating greeting for: ${userName}`);
    return {
      greeting: `Hello, ${userName}! Welcome to TestBullmq.`,
    };
  }
}
