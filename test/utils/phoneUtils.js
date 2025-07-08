/**
 * Utility functions for phone number formatting and handling
 */

/**
 * Format types for phone numbers
 * @enum {string}
 */
export const PhoneFormat = {
  /** Standard North American format: +1 234-567-8912 */
  US_STANDARD: 'us-standard',
  /** International format with no spaces: +12345678912 */
  INTERNATIONAL_COMPACT: 'international-compact',
  /** International format with spaces: +1 234 567 8912 */
  INTERNATIONAL_SPACED: 'international-spaced',
  /** Format with parentheses: +1 (234) 567-8912 */
  PARENTHESES: 'parentheses',
  /** Format with dots: +1.234.567.8912 */
  DOTTED: 'dotted',
  /** European format: +1 234 567 89 12 */
  EUROPEAN: 'european',
};

export function formatPhoneNumber(phoneNumber, locale = 'en_US', format = null) {
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length === 0) {
    return '';
  }

  let countryCode = '1';
  let remainingDigits = digitsOnly;

  if (digitsOnly.length === 11) {
    countryCode = digitsOnly.charAt(0);
    remainingDigits = digitsOnly.substring(1);
  } else if (digitsOnly.length === 10) {
    remainingDigits = digitsOnly;
  } else {
    // For unexpected lengths, just return the digits with + prefix
    return `+${digitsOnly}`;
  }

  // Map locale to default format (expandable)
  const localeFormatMap = {
    en_US: PhoneFormat.PARENTHESES,
    en_CA: PhoneFormat.PARENTHESES,
    fr_FR: PhoneFormat.EUROPEAN,
    en_GB: PhoneFormat.INTERNATIONAL_SPACED,
  };

  const formatToUse = format || localeFormatMap[locale] || PhoneFormat.US_STANDARD;

  // Logic: skip country code prefix if locale is en_US (and maybe en_CA)
  const includeCountryCode = locale !== 'en_US' && locale !== 'en_CA';

  const prefix = includeCountryCode ? `+${countryCode} ` : '';

  switch (formatToUse) {
    case PhoneFormat.US_STANDARD:
      return `${prefix}${remainingDigits.substring(0, 3)}-${remainingDigits.substring(3, 6)}-${remainingDigits.substring(6)}`;

    case PhoneFormat.INTERNATIONAL_COMPACT:
      return `+${countryCode}${remainingDigits}`;

    case PhoneFormat.INTERNATIONAL_SPACED:
      return `${prefix}${remainingDigits.substring(0, 3)} ${remainingDigits.substring(3, 6)} ${remainingDigits.substring(6)}`;

    case PhoneFormat.PARENTHESES:
      return `${prefix}(${remainingDigits.substring(0, 3)}) ${remainingDigits.substring(3, 6)}-${remainingDigits.substring(6)}`;

    case PhoneFormat.DOTTED:
      return `${prefix}${remainingDigits.substring(0, 3)}.${remainingDigits.substring(3, 6)}.${remainingDigits.substring(6)}`;

    case PhoneFormat.EUROPEAN:
      return `${prefix}${remainingDigits.substring(0, 3)} ${remainingDigits.substring(3, 6)} ${remainingDigits.substring(6, 8)} ${remainingDigits.substring(8)}`;

    default:
      return `${prefix}${remainingDigits.substring(0, 3)}-${remainingDigits.substring(3, 6)}-${remainingDigits.substring(6)}`;
  }
}
