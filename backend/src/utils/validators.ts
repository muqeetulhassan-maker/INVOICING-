/**
 * Validates phone numbers on the server side
 * Supports Pakistani formats (0300-1234567, 03001234567, +923001234567) and standard international numbers
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.trim();

  // Strip non-digits except leading +
  const digitsOnly = cleaned.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return false;
  }

  const pakistaniPhoneRegex = /^((\+92)|(0092)|(0))?3[0-9]{2}-?[0-9]{7}$/;
  const generalPhoneRegex = /^\+?[0-9\s-]{10,16}$/;

  return pakistaniPhoneRegex.test(cleaned) || generalPhoneRegex.test(cleaned);
}

