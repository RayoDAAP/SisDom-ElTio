/**
 * @module responseHelper
 * @description Utilidades para estandarizar el formato de respuestas HTTP.
 *              Todas las respuestas siguen la misma estructura: { success, message, data }.
 */

/**
 * Envía una respuesta exitosa estandarizada.
 * @param {import('express').Response} res
 * @param {number} statusCode - Código HTTP de éxito (200, 201, etc.)
 * @param {string} message    - Mensaje descriptivo
 * @param {object} [data={}]  - Datos a retornar
 */
export const sendSuccess = (res, statusCode, message, data = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Envía una respuesta de error estandarizada.
 * @param {import('express').Response} res
 * @param {number} statusCode - Código HTTP de error (400, 401, 404, 500, etc.)
 * @param {string} message    - Mensaje de error descriptivo
 * @param {object} [errors=null] - Detalles adicionales del error (opcional)
 */
export const sendError = (res, statusCode, message, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
};
