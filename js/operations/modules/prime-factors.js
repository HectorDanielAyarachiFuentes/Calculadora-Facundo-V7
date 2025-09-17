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
export async function desFacPri(numero = null) {
    errorHandler.limpiarErrores();
    
    const entrada = numero || display.innerHTML;

    // --- 1. VALIDACIÓN ---
    // CORRECCIÓN: Se usa la instancia única de errorHandler y se pasa el argumento correcto.
    if (!errorHandler.validarFactoresPrimos(entrada)) {
        return;
    }

    const numOriginal = parseInt(entrada, 10);

    // --- 2. USAR WEB WORKER PARA LA FACTORIZACIÓN ---
    // Mostramos un indicador de carga mientras el Worker calcula.
    salida.innerHTML = '<p class="loading-indicator">Calculando factores primos...</p>';

    const factores = await new Promise((resolve, reject) => {
        // Creamos una nueva instancia del Worker.
        // MEJORA: Se utiliza `import.meta.url` para crear una ruta al worker que es
        // relativa a este archivo JS, no al documento HTML. Esto es mucho más robusto
        // y evita errores de carga (404) si la estructura de carpetas cambia.
        const workerUrl = new URL('./prime-factors.worker.js', import.meta.url);
        // SOLUCIÓN: Se añade { type: 'module' }. Esto le indica al navegador que cargue
        // el worker como un módulo de JavaScript, lo cual es esencial en proyectos
        // modernos y resuelve los errores de carga (404 o de tipo de script).
        const worker = new Worker(workerUrl, { type: 'module' });

        // 3. Escuchamos los mensajes que nos envía el Worker.
        worker.onmessage = (event) => {
            if (event.data.error) {
                reject(new Error(event.data.error));
            } else {
                resolve(event.data.factores);
            }
            // Una vez que tenemos la respuesta, terminamos el worker para liberar recursos.
            worker.terminate();
        };

        // Manejador de errores del worker.
        worker.onerror = (error) => {
            // El objeto 'error' que llega aquí puede ser un ErrorEvent o un Event genérico.
            // Lo envolvemos en un nuevo Error para un manejo de errores consistente.
            console.error("Error en el Web Worker de factores primos:", error);
            // Si es un ErrorEvent, tendrá un 'message'. Si no (p.ej. error de carga), usamos un mensaje genérico.
            const errorMessage = error.message ? error.message : "No se pudo cargar el script del worker o ocurrió un error inesperado.";
            reject(new Error(`Error en el worker: ${errorMessage}`));
            worker.terminate();
        };

        // 2. Enviamos el número al Worker para que comience el cálculo.
        worker.postMessage(numOriginal);
    });

    // --- 4. PREPARAR DATOS PARA VISUALIZACIÓN (una vez que el worker ha respondido) ---
    salida.innerHTML = ''; // Limpiamos el indicador de carga.
    const fragment = document.createDocumentFragment();
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

    // --- 5. MOSTRAR RESULTADO FINAL ---
    const resultadoFinal = formatearFactoresPrimos(factores);
    const resultadoElement = crearCelda("output-grid__result", `Factores primos: ${resultadoFinal}`, {
        left: '10px',
        top: '10px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#66FF66'
    });
    fragment.appendChild(resultadoElement);

    // --- 6. CÁLCULO DEL LAYOUT ---
    const maxDigitsIzda = Math.max(...numIzdaArray.map(n => n.toString().length));
    const maxDigitsDcha = Math.max(...numDchaArray.map(n => n.toString().length));
    const separatorWidth = 1;
    const totalCols = maxDigitsIzda + separatorWidth + maxDigitsDcha;
    const numRows = numIzdaArray.length;

    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, totalCols, numRows);

    // --- 7. VISUALIZACIÓN MEJORADA ---
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
