import CryptoJS from 'crypto-js';

/**
 * Computes a SHA-256 hash of a given string.
 *
 * @param {string} input - The string to be hashed.
 * @returns {string} A hexadecimal string representation of the hash.
 * @example
 * getHash("hello");
 * // returns "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
 */
export function getHash(text: string): string {
  const HASH = CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
  return HASH;
}

/**
 * Generates a hash for a password using salt and pepper for added security.
 * 
 * @param {string} password - The password to hash
 * @param {string | null} salt - Salt value to use in the hash. If null, uses the environment variable SALT.
 * @param {string | null} pepper - Pepper value to use in the hash. If null, uses the environment variable PEPPER.
 * @returns {string} The hashed password. Returns an empty string if salt or pepper is not available.
 * @throws {Error} Logs an error if salt or pepper is not found.
 * @example
 * // Using environment variables for salt and pepper
 * const hash = getPasswordHash('myPassword');
 * 
 * // Using custom salt and pepper
 * const hash = getPasswordHash('myPassword', 'customSalt', 'customPepper');
 */
export function getPasswordHash(password: string, salt: string, pepper: string): string {
    const actualSalt = salt 
    const actualPepper = pepper 

    if (!actualSalt || !actualPepper) {
        // console.error("Salt or Pepper not found");
        return "";
    }

    const PASS = actualSalt + password + actualPepper;
    return getHash(PASS);
}