// =======================================================
// --- operations/modules/prime-factors.js (REFACTORIZADO) ---
// Utiliza la clase base VisualOperation para una estructura OOP.
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { crearCelda, esperar } from '../utils/dom-helpers.js';
import { salida, display } from '../../calculadora/config.js';
import { ErrorHandlerCentralized } from '../../calculadora/error-handler-centralized.js';

const errorHandler = new ErrorHandlerCentralized(salida);

/**
 * Factoriza un número en sus factores primos de manera optimizada.
 * Esta función se ejecuta en el hilo principal.
 * @param {number} n - El número a factorizar.
 * @returns {number[]} - Array de factores primos.
 */
function factorizarPrimos(n) {
    const factores = [];
    while (n % 2 === 0) {
        factores.push(2);
        n /= 2;
    }
    for (let i = 3; i * i <= n; i += 2) {
        while (n % i === 0) {
            factores.push(i);
            n /= i;
        }
    }
    if (n > 2) {
        factores.push(n);
    }
    return factores;
}

class PrimeFactorsOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
    }

    async execute() {
        this._clearOutput();
        this._prepareOperands();
        if (!this._validateInput()) return;

        this._calculateResult();       // 1. Calcular factores (síncrono)
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

    _calculateResult() {
        const factores = factorizarPrimos(this.numOriginal);

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
                // CORRECCIÓN: Usar Math.round para evitar errores de punto flotante.
                // Esto asegura que tempNum siempre sea un entero para la siguiente iteración,
                // previniendo que valores como 0.9999... o 1.0000... causen errores visuales.
                tempNum = Math.round(tempNum / factor);
            }
            // El bucle debería terminar con tempNum siendo 1.
            // Este `if` es una salvaguarda por si `factorizarPrimos` no es exhaustivo.
            if (tempNum > 1 && !isNaN(tempNum)) {
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
