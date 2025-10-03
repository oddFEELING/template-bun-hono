import { createInterface } from "readline";

/**
 * Prompts the user for input and waits for their response
 * @param {string} question - The question to ask the user
 * @returns {Promise<string>} The user's input
 */
export async function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompts the user for a yes/no answer
 * @param {string} question - The question to ask the user
 * @param {boolean} defaultValue - The default value if user just presses enter (default: false)
 * @returns {Promise<boolean>} True if user answered yes, false otherwise
 */
export async function promptYesNo(question, defaultValue = false) {
  const defaultText = defaultValue ? "Y/n" : "y/N";
  const answer = await prompt(`${question} (${defaultText}): `);

  if (answer === "") {
    return defaultValue;
  }

  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}
