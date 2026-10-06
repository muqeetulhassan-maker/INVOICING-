/**
 * Validates phone numbers (supports Pakistani numbers e.g. 0300-1234567, 03001234567, +923001234567, and standard international formats)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.trim();

  // Pattern matches:
  // 03XX-XXXXXXX or 03XXXXXXXXX (11 digits starting with 03)
  // +92-3XX-XXXXXXX or +923XXXXXXXXX
  // International 10-15 digits with optional +, spaces, hyphens
  const pakistaniPhoneRegex = /^((\+92)|(0092)|(0))?3[0-9]{2}-?[0-9]{7}$/;
  const generalPhoneRegex = /^\+?[0-9\s-]{10,16}$/;

  // Strip non-digits to verify minimum length
  const digitsOnly = cleaned.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return false;
  }

  return pakistaniPhoneRegex.test(cleaned) || generalPhoneRegex.test(cleaned);
}

export const PHONE_ERROR_MESSAGE =
  'Invalid phone format. Please enter a valid number (e.g. 0300-1234567 or +923001234567).';

