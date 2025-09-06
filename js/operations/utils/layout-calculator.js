// =======================================================
// --- operations/utils/layout-calculator.js ---
// Contiene la lógica para calcular las dimensiones de la cuadrícula
// de visualización, adaptándose al espacio disponible.
// =======================================================
"use strict";

// Este valor define qué tan grande será la fuente en relación con el tamaño de la celda.
// Ejemplo: 0.7 significa que la fuente ocupará el 70% de la altura de la celda.
const multiplicadorTamFuente = 0.7;

/**
 * Calcula las dimensiones y posiciones clave para el layout de una operación.
 *
 * @param {HTMLElement} container - El elemento HTML donde se dibujará la operación (ej: el div 'salida').
 * @param {number} gridWidthInCells - El número total de columnas que necesita la operación.
 * @param {number} gridHeightInRows - El número total de filas que necesita la operación.
 * @returns {object} Un objeto con todas las dimensiones calculadas para facilitar el dibujado.
 */
export function calculateLayout(container, gridWidthInCells, gridHeightInRows) {
    // Obtiene las dimensiones y el padding del contenedor
    const rect = container.getBoundingClientRect();
    const style = getComputedStyle(container);

    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);
    const paddingTop = parseFloat(style.paddingTop);
    const paddingBottom = parseFloat(style.paddingBottom);

    // Calcula el espacio real de dibujado dentro de los paddings
    const availableWidth = rect.width - paddingLeft - paddingRight;
    const availableHeight = rect.height - paddingTop - paddingBottom;

    // Calcula el tamaño máximo de celda posible para que todo quepa
    const tamCel = Math.floor(Math.min(availableWidth / gridWidthInCells, availableHeight / gridHeightInRows));
    const tamFuente = tamCel * multiplicadorTamFuente;

    // Calcula el ancho total del bloque de la operación y el offset para centrarlo
    const totalBlockWidth = gridWidthInCells * tamCel;
    const offsetHorizontal = (availableWidth - totalBlockWidth) / 2;

    // Devuelve un objeto con todos los valores para que la función de operación los use
    return {
        tamCel,
        tamFuente,
        offsetHorizontal,
        paddingLeft,
        paddingTop
    };
}