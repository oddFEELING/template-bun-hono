// ~ ======= Color utilities for nice logs ======= ~
export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

/**
 * Logs a success message with a checkmark
 */
export function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

/**
 * Logs an info message
 */
export function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

/**
 * Logs an error message
 */
export function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

/**
 * Logs a header message
 */
export function logHeader(message) {
  console.log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
}
