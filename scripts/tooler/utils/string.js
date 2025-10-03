/**
 * Converts a string to PascalCase
 * @param {string} str - The string to convert
 * @returns {string} The PascalCase string
 */
export function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Converts a string to camelCase
 * @param {string} str - The string to convert
 * @returns {string} The camelCase string
 */
export function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
