// =======================================================
// --- operations/modules/prime-factors.js (VERSIÓN OPTIMIZADA Y MEJORADA) ---
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda } from '../utils/dom-helpers.js';
import { salida, display } from '../../config.js';
import { ErrorHandlerCentralized } from '../../error-handler-centralized.js';

const errorHandler = new ErrorHandlerCentralized(salida);

/**
 * Realiza y visualiza la descomposición en factores primos de manera optimizada.
 */
export function desFacPri(numero = null) {
    errorHandler.limpiarErrores();
    const fragment = document.createDocumentFragment();

    const entrada = numero || display.innerHTML;

    // --- 1. VALIDACIÓN ---
    // CORRECCIÓN: Se usa la instancia única de errorHandler y se pasa el argumento correcto.
    if (!errorHandler.validarFactoresPrimos(entrada)) {
        return;
    }

    const numOriginal = parseInt(entrada, 10);

    // --- 2. FACTORIZACIÓN OPTIMIZADA ---
    const factores = factorizarPrimos(numOriginal);

    // --- 3. PREPARAR DATOS PARA VISUALIZACIÓN ---
    const numIzdaArray = [];
    const numDchaArray = [];
    let tempNum = numOriginal;

    if (numOriginal === 1) {
        numIzdaArray.push(1);
        numDchaArray.push(1);
    } else {
        for (const factor of factores) {
            numIzdaArray.push(tempNum);
            numDchaArray.push(factor);
            tempNum /= factor;
        }
        if (tempNum > 1) {
            numIzdaArray.push(tempNum);
            numDchaArray.push(tempNum);
        }
    }
    numIzdaArray.push(1);

    // --- 4. MOSTRAR RESULTADO FINAL ---
    const resultadoFinal = formatearFactoresPrimos(factores);
    const resultadoElement = crearCelda("output-grid__result", `Factores primos: ${resultadoFinal}`, {
        left: '10px',
        top: '10px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#66FF66'
    });
    fragment.appendChild(resultadoElement);

    // --- 5. CÁLCULO DEL LAYOUT ---
    const maxDigitsIzda = Math.max(...numIzdaArray.map(n => n.toString().length));
    const maxDigitsDcha = Math.max(...numDchaArray.map(n => n.toString().length));
    const separatorWidth = 1;
    const totalCols = maxDigitsIzda + separatorWidth + maxDigitsDcha;
    const numRows = numIzdaArray.length;

    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, totalCols, numRows);

    // --- 6. VISUALIZACIÓN MEJORADA ---
    const startY = paddingTop + 50; // Espacio para el resultado

    // Dibujar la columna izquierda (números que se van dividiendo)
    numIzdaArray.forEach((n, idx) => {
        let s = n.toString();
        const xPos = offsetHorizontal + (maxDigitsIzda - s.length) * tamCel + paddingLeft;
        const yPos = startY + idx * tamCel;
        fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--dividendo", s, {
            left: `${xPos}px`,
            top: `${yPos}px`,
            width: `${s.length * tamCel}px`,
            height: `${tamCel}px`,
            fontSize: `${tamFuente}px`
        }));
    });

    // Dibujar la línea vertical de separación
    const xLineaVertical = offsetHorizontal + maxDigitsIzda * tamCel + (separatorWidth * tamCel / 2) + paddingLeft;
    fragment.appendChild(crearCelda("output-grid__line", "", {
        left: `${xLineaVertical}px`,
        top: `${startY}px`,
        width: `2px`,
        height: `${numRows * tamCel}px`
    }));

    // Dibujar la columna derecha (factores primos)
    numDchaArray.forEach((n, idx) => {
        let s = n.toString();
        const xPos = offsetHorizontal + (maxDigitsIzda + separatorWidth) * tamCel + paddingLeft;
        const yPos = startY + idx * tamCel;
        fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--divisor", s, {
            left: `${xPos}px`,
            top: `${yPos}px`,
            width: `${s.length * tamCel}px`,
            height: `${tamCel}px`,
            fontSize: `${tamFuente}px`
        }));
    });

    salida.appendChild(fragment);
}

/**
 * Factoriza un número en sus factores primos de manera optimizada.
 * @param {number} n - El número a factorizar.
 * @returns {number[]} - Array de factores primos.
 */
function factorizarPrimos(n) {
    const factores = [];

    // Manejar el factor 2 por separado
    while (n % 2 === 0) {
        factores.push(2);
        n /= 2;
    }

    // Factores impares
    for (let i = 3; i * i <= n; i += 2) {
        while (n % i === 0) {
            factores.push(i);
            n /= i;
        }
    }

    // Si queda un factor primo mayor que 2
    if (n > 2) {
        factores.push(n);
    }

    return factores;
}

/**
 * Formatea los factores primos en una cadena legible.
 * @param {number[]} factores - Array de factores primos.
 * @returns {string} - Cadena formateada.
 */
function formatearFactoresPrimos(factores) {
    if (factores.length === 0) return '1';

    const conteo = {};
    factores.forEach(factor => {
        conteo[factor] = (conteo[factor] || 0) + 1;
    });

    const partes = Object.entries(conteo).map(([base, exp]) => exp > 1 ? `${base}^${exp}` : base);
    return partes.join(' × ');
}
