/**
 * Regex pattern for splitting strings by delimiters
 * Defined at module level for better performance
 */
const WORD_DELIMITER_PATTERN = /[-_\s]+/;

/**
 * Converts a string to PascalCase
 * @param {string} str - The string to convert
 * @returns {string} The PascalCase string
 */
export function toPascalCase(str) {
	return str
		.split(WORD_DELIMITER_PATTERN)
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
