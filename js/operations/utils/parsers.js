// =======================================================
// --- operations/utils/parsers.js ---
// Contiene funciones para procesar y limpiar cadenas de entrada.
// =======================================================
"use strict";

/**
 * Parsea la cadena de entrada en un array de operandos.
 * Limpia los números, maneja comas decimales y devuelve una estructura
 * con el número como string (sin comas) y la cantidad de decimales.
 *
 * Ejemplo: parsearNumeros("12,3+04,567", "+") -> [['123', 1], ['4567', 3]]
 *
 * @param {string} entradaStr - La cadena del display (ej: "12,3+4,5").
 * @param {string} operador - El operador que separa los números (ej: "+").
 * @returns {Array<[string, number]>} Un array de tuplas [valorSinComa, numDecimales].
 */
export function parsearNumeros(entradaStr, operador) {
    // Separa la cadena por el operador para obtener los operandos
    const numAr = entradaStr.split(operador);

    return numAr.map(numStr => {
        // Limpia ceros a la izquierda, ej: "007" -> "7", pero no "0," -> "0,"
        let limpio = numStr.replace(/^0+(?!\b|,)/, '');
        if (limpio === '') limpio = '0'; // Si queda vacío (era "00"), lo restaura a "0"
        if (limpio.startsWith(',')) limpio = '0' + limpio; // Si es ",5", lo convierte en "0,5"

        const p = limpio.indexOf(",") + 1; // Posición de la coma + 1
        const d = p > 0 ? limpio.length - p : 0; // Número de decimales
        const v = limpio.replace(",", ""); // Valor sin la coma

        // Devuelve la tupla con el valor y el número de decimales
        return [v || "0", d];
    });
}