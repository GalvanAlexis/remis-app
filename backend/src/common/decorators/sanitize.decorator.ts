import { Transform } from 'class-transformer';
import sanitizeHtml = require('sanitize-html');

export interface SanitizeOptions {
  trim?: boolean;
  sanitizeOptions?: sanitizeHtml.IOptions;
}

/**
 * Custom decorator para interceptar y sanitizar strings a nivel DTO.
 * Por defecto remueve todo el HTML (tags) y hace un trim() al string.
 * @param options Opciones de `sanitize-html` y flags adiciones como evitar el trim.
 */
export function Sanitize(options: SanitizeOptions = {}) {
  const { trim = true, sanitizeOptions } = options;

  return Transform(({ value }) => {
    if (typeof value === 'string') {
      let sanitized = sanitizeHtml(value, {
        allowedTags: [], // Strippea absolutamente todo (No bold, no links)
        allowedAttributes: {},
        ...sanitizeOptions,
      });

      if (trim) {
        sanitized = sanitized.trim();
      }

      return sanitized;
    }
    // Retorna el mismo objeto/valor si no es un string (fail-safe array/object bypass)
    return value;
  });
}
