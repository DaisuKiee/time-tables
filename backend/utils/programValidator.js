/**
 * Program validation helpers.
 *
 * Program codes live in the `programs` collection (see models/Program.model.js).
 * These helpers let models and route validators check a value against the
 * database instead of a hardcoded list.
 *
 * A short-lived in-memory cache avoids hitting the DB on every single
 * validation, since program codes change very rarely.
 */

const CACHE_TTL_MS = 60 * 1000; // 1 minute

let cachedCodes = null;
let cachedAt = 0;

/**
 * Fetch all active program codes from the database (cached).
 * @param {boolean} forceRefresh Bypass the cache.
 * @returns {Promise<string[]>} e.g. ['BIT-AT', 'BSIT', ...]
 */
const getProgramCodes = async (forceRefresh = false) => {
  const isFresh = cachedCodes && Date.now() - cachedAt < CACHE_TTL_MS;
  if (isFresh && !forceRefresh) {
    return cachedCodes;
  }

  // Required lazily to avoid a circular require at module load time.
  const Program = require('../models/Program.model');

  const programs = await Program.find({ isActive: true }).select('code').lean();
  cachedCodes = programs.map(p => p.code);
  cachedAt = Date.now();

  return cachedCodes;
};

/**
 * Clear the cache. Call this after creating/updating/deleting a program so
 * validation picks up the change immediately.
 */
const invalidateProgramCache = () => {
  cachedCodes = null;
  cachedAt = 0;
};

/**
 * Check whether a program code exists and is active.
 * @param {string} code
 * @param {string[]} extraAllowed Additional values to accept (e.g. ['General']).
 * @returns {Promise<boolean>}
 */
const isValidProgramCode = async (code, extraAllowed = []) => {
  if (extraAllowed.includes(code)) return true;

  const codes = await getProgramCodes();
  return codes.includes(code);
};

/**
 * Build a Mongoose `validate` config for a program field.
 *
 * @param {object} [options]
 * @param {boolean} [options.allowNull=false] Accept null/undefined/'' as valid.
 * @param {string[]} [options.extraAllowed=[]] Extra accepted values, e.g. ['General'].
 * @returns {{validator: Function, message: Function}}
 */
const programFieldValidator = ({ allowNull = false, extraAllowed = [] } = {}) => ({
  validator: async function (value) {
    if (value === null || value === undefined || value === '') {
      return allowNull;
    }
    return isValidProgramCode(value, extraAllowed);
  },
  message: props =>
    `'${props.value}' is not a valid program. It must match an active program code in the database.`,
});

module.exports = {
  getProgramCodes,
  invalidateProgramCache,
  isValidProgramCode,
  programFieldValidator,
};
