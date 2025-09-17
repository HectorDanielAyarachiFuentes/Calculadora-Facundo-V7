// =======================================================
// --- operations/modules/prime-factors.js (REFACTORIZADO) ---
// Utiliza la clase base VisualOperation para una estructura OOP.
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { crearCelda, esperar } from '../utils/dom-helpers.js';
import { salida, display } from '../../config.js';
import { ErrorHandlerCentralized } from '../../error-handler-centralized.js';

const errorHandler = new ErrorHandlerCentralized(salida);

class PrimeFactorsOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
    }

    // Sobrescribimos el método de ejecución para adaptarlo al flujo asíncrono del Web Worker.
    async execute() {
        this._clearOutput();
        this._prepareOperands();
        if (!this._validateInput()) return;

        await this._calculateResult(); // 1. Calcular factores (asíncrono)
        this._calculateLayout();       // 2. Calcular layout con los resultados
        await this._drawStaticElements(); // 3. Dibujar elementos estáticos
        await this._animateSteps();    // 4. Animar los pasos
    }

    _prepareOperands() {
        this.numeroStr = this.numerosAR[0][0];
        this.numOriginal = parseInt(this.numeroStr, 10);
    }

    _validateInput() {
        return errorHandler.validarFactoresPrimos(this.numeroStr);
    }

    async _calculateResult() {
        this.salida.innerHTML = '<p class="loading-indicator">Calculando factores primos...</p>';

        const factores = await new Promise((resolve, reject) => {
            const workerUrl = new URL('./prime-factors.worker.js', import.meta.url);
            const worker = new Worker(workerUrl, { type: 'module' });

            worker.onmessage = (event) => {
                event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.factores);
                worker.terminate();
            };

            worker.onerror = (error) => {
                console.error("Error en el Web Worker de factores primos:", error);
                const errorMessage = error.message || "Error inesperado en el worker.";
                reject(new Error(`Error en el worker: ${errorMessage}`));
                worker.terminate();
            };

            worker.postMessage(this.numOriginal);
        });

        this.salida.innerHTML = ''; // Limpiar indicador de carga

        // Preparar datos para visualización
        this.numIzdaArray = [];
        this.numDchaArray = [];
        let tempNum = this.numOriginal;

        if (this.numOriginal === 1) {
            this.numIzdaArray.push(1);
            this.numDchaArray.push(1);
        } else {
            for (const factor of factores) {
                this.numIzdaArray.push(tempNum);
                this.numDchaArray.push(factor);
                tempNum /= factor;
            }
            if (tempNum > 1) {
                this.numIzdaArray.push(tempNum);
                this.numDchaArray.push(tempNum);
            }
        }
        this.numIzdaArray.push(1);

        this.resultado.display = formatearFactoresPrimos(factores);
    }

    _getGridDimensions() {
        this.maxDigitsIzda = Math.max(...this.numIzdaArray.map(n => n.toString().length));
        this.maxDigitsDcha = Math.max(...this.numDchaArray.map(n => n.toString().length));
        this.separatorWidth = 1;
        const totalCols = this.maxDigitsIzda + this.separatorWidth + this.maxDigitsDcha;
        const numRows = this.numIzdaArray.length;
        return { width: totalCols, height: numRows };
    }

    async _drawStaticElements() {
        const { tamCel, paddingTop, paddingLeft, offsetHorizontal } = this.layoutParams;
        const fragment = document.createDocumentFragment();

        // Dibujar resultado final en la parte superior
        const resultadoElement = crearCelda("output-grid__result", `Factores primos: ${this.resultado.display}`, {
            left: '10px', top: '10px', fontSize: '18px', fontWeight: 'bold', color: '#66FF66'
        });
        fragment.appendChild(resultadoElement);

        // Dibujar la línea vertical de separación
        this.startY = paddingTop + 50; // Espacio para el resultado
        const xLineaVertical = offsetHorizontal + this.maxDigitsIzda * tamCel + (this.separatorWidth * tamCel / 2) + paddingLeft;
        const lineaVertical = crearCelda("output-grid__line", "", {
            left: `${xLineaVertical}px`,
            top: `${this.startY}px`,
            width: `2px`,
            height: `${this.numIzdaArray.length * tamCel}px`
        });
        fragment.appendChild(lineaVertical);
        this.salida.appendChild(fragment);
    }

    async _animateSteps() {
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft } = this.layoutParams;

        for (let idx = 0; idx < this.numIzdaArray.length; idx++) {
            const yPos = this.startY + idx * tamCel;

            // Dibujar número de la izquierda
            const nIzda = this.numIzdaArray[idx];
            let sIzda = nIzda.toString();
            const xPosIzda = offsetHorizontal + (this.maxDigitsIzda - sIzda.length) * tamCel + paddingLeft;
            this.salida.appendChild(crearCelda("output-grid__cell output-grid__cell--dividendo", sIzda, {
                left: `${xPosIzda}px`, top: `${yPos}px`, width: `${sIzda.length * tamCel}px`,
                height: `${tamCel}px`, fontSize: `${tamFuente}px`
            }));

            // Dibujar número de la derecha (factor primo) si existe
            if (idx < this.numDchaArray.length) {
                const nDcha = this.numDchaArray[idx];
                let sDcha = nDcha.toString();
                const xPosDcha = offsetHorizontal + (this.maxDigitsIzda + this.separatorWidth) * tamCel + paddingLeft;
                this.salida.appendChild(crearCelda("output-grid__cell output-grid__cell--divisor", sDcha, {
                    left: `${xPosDcha}px`, top: `${yPos}px`, width: `${sDcha.length * tamCel}px`,
                    height: `${tamCel}px`, fontSize: `${tamFuente}px`
                }));
            }

            await esperar(400);
        }
    }

    // Estos métodos no son necesarios para esta operación, así que los sobrescribimos para que no hagan nada.
    _drawResult() { }
    _getOperatorSign() { return ''; }
}

/**
 * Realiza y visualiza la descomposición en factores primos de manera optimizada.
 */
export async function desFacPri(numero = null) {
    errorHandler.limpiarErrores();
    const entrada = numero || display.innerHTML;
    const numerosAR = [[entrada, 0]]; // Adaptar al formato esperado por VisualOperation

    const op = new PrimeFactorsOperation(numerosAR, salida);
    await op.execute();
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
