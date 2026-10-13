const crypto = require('crypto');

/**
 * Mask an account number showing only the last 4 digits.
 * E.g., 501009182736 -> XXXX XXXX 2736
 */
function maskAccountNumber(accNo) {
  if (!accNo || accNo.length < 4) return 'XXXX XXXX XXXX';
  const clean = String(accNo).replace(/\s+/g, '');
  const lastFour = clean.slice(-4);
  return `XXXX XXXX ${lastFour}`;
}

/**
 * Generate a random 12-digit account number.
 */
function generateAccountNumber() {
  const prefix = '5010';
  const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${randomPart}`;
}

/**
 * Compute SHA-256 hash of a string.
 */
function sha256Hash(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

/**
 * Format amount as Indian Rupees (INR)
 */
function formatCurrency(amount) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

module.exports = {
  maskAccountNumber,
  generateAccountNumber,
  sha256Hash,
  formatCurrency,
};
