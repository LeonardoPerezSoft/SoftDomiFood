/**
 * Date Format Domain Module
 * 
 * Centralized date/time formatting utilities.
 * Ensures consistency across the application.
 * 
 * Principles: SOLID (Single Responsibility) - single concern: formatting dates
 */

/**
 * Format ISO datetime string to locale-specific string
 * @param {string} iso - ISO 8601 datetime string
 * @param {string} locale - Locale code (default: 'es-ES')
 * @returns {string|null} Formatted date string or null if invalid
 */
export function formatDateTime(iso, locale = 'es-ES') {
  if (!iso || typeof iso !== 'string') return null;

  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error('Error formatting datetime:', e);
    return null;
  }
}

/**
 * Format ISO datetime to only date part
 * @param {string} iso - ISO 8601 datetime string
 * @param {string} locale - Locale code (default: 'es-ES')
 * @returns {string|null} Formatted date string or null if invalid
 */
export function formatDate(iso, locale = 'es-ES') {
  if (!iso || typeof iso !== 'string') return null;

  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return null;
  }
}

/**
 * Format ISO datetime to relative time (e.g., "hace 2 horas")
 * @param {string} iso - ISO 8601 datetime string
 * @returns {string} Relative time string
 */
export function formatRelativeTime(iso) {
  if (!iso || typeof iso !== 'string') return '';

  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'hace unos segundos';
    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

    return formatDate(iso);
  } catch (e) {
    console.error('Error formatting relative time:', e);
    return '';
  }
}

/**
 * Parse a datetime-local input value (HTML5) to ISO 8601 string
 * @param {string} localDateTime - Value from <input type="datetime-local" />
 * @returns {string|null} ISO 8601 string or null if invalid
 */
export function parseLocalDateTimeToISO(localDateTime) {
  if (!localDateTime || typeof localDateTime !== 'string') return null;

  try {
    // HTML5 datetime-local format: YYYY-MM-DDTHH:mm
    const date = new Date(localDateTime);
    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
  } catch (e) {
    console.error('Error parsing local datetime:', e);
    return null;
  }
}

/**
 * Convert ISO datetime to HTML5 datetime-local format
 * @param {string} iso - ISO 8601 datetime string
 * @returns {string|null} datetime-local format (YYYY-MM-DDTHH:mm) or null
 */
export function isoToDatetimeLocal(iso) {
  if (!iso || typeof iso !== 'string') return null;

  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    // Adjust for local timezone and format as YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error('Error converting ISO to datetime-local:', e);
    return null;
  }
}

/**
 * Check if a date is in the future
 * @param {string} iso - ISO 8601 datetime string
 * @returns {boolean}
 */
export function isFutureDateTime(iso) {
  if (!iso || typeof iso !== 'string') return false;

  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return false;
    return date > new Date();
  } catch (e) {
    return false;
  }
}

/**
 * Get the number of hours between now and a future date
 * @param {string} iso - ISO 8601 datetime string
 * @returns {number|null} Hours difference or null if invalid
 */
export function getHoursUntil(iso) {
  if (!iso || typeof iso !== 'string') return null;

  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    const now = new Date();
    const diffMs = date - now;
    return Math.floor(diffMs / (1000 * 60 * 60));
  } catch (e) {
    return null;
  }
}
