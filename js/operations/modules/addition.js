// =======================================================
// --- operations/modules/addition.js (REFACTORIZADO) ---
// Utiliza la clase base VisualOperation para una estructura OOP.
// =======================================================
"use strict";

import { crearCelda, crearFlechaLlevada, esperar } from '../utils/dom-helpers.js';
import { VisualOperation } from '../utils/VisualOperation.js';
import { salida } from '../../config.js';

class SumaOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
    }

    _getGridDimensions() {
        return {
            width: this.displayWidth + 1,
            height: this.numerosAR.length + 4
        };
    }

    _getOperatorSign() {
        return "+";
    }

    _getYPosMultiplier() {
        return 2.5;
    }

    _calculateResult() {
        let total = 0n;
        this.operandosParaCalcular.forEach(n => total += BigInt(n));
        this.resultado.raw = total.toString();

        if (this.maxDecLength > 0) {
            let resPadded = this.resultado.raw.padStart(this.maxDecLength + 1, '0');
            this.resultado.display = resPadded.slice(0, resPadded.length - this.maxDecLength) + ',' + resPadded.slice(resPadded.length - this.maxDecLength);
        } else {
            this.resultado.display = this.resultado.raw;
        }
    }

    async _animateSteps() {
        let carry = 0;
        const topPosSumaIntermedia = this.layoutParams.paddingTop + 0.1 * this.layoutParams.tamCel;
        const topPosLlevada = this.layoutParams.paddingTop + 1.1 * this.layoutParams.tamCel;
        this.sumasIntermediasData = [];

        for (let i = this.longitudMaximaTotal - 1; i >= 0; i--) {
            let sumaColumna = carry;
            this.operandosParaCalcular.forEach(n => sumaColumna += parseInt(n[i] || '0'));

            const sumaStr = sumaColumna.toString();
            const newCarry = Math.floor(sumaColumna / 10);

            const digitsToTheRight = (this.longitudMaximaTotal - 1) - i;
            const hasCommaToTheRight = this.maxDecLength > 0 && digitsToTheRight >= this.maxDecLength;
            const visualCellsToTheRight = digitsToTheRight + (hasCommaToTheRight ? 1 : 0);
            const visualCol = this._getGridDimensions().width - 1 - visualCellsToTheRight;

            const xPosColumna = this.layoutParams.offsetHorizontal + visualCol * this.layoutParams.tamCel + this.layoutParams.paddingLeft;
            const centroDeColumna = xPosColumna + (this.layoutParams.tamCel / 2);
            const anchoCeldaTemp = this.layoutParams.tamCel * sumaStr.length * 0.7;
            const leftPosTemp = centroDeColumna - (anchoCeldaTemp / 2);
            const celdaTemp = crearCelda("output-grid__cell output-grid__cell--suma-intermedia", sumaStr, { left: `${leftPosTemp}px`, top: `${topPosSumaIntermedia}px`, width: `${anchoCeldaTemp}px`, height: `${this.layoutParams.tamCel}px`, fontSize: `${this.layoutParams.tamFuente * 0.8}px` });
            this.salida.appendChild(celdaTemp);
            await esperar(1500);
            celdaTemp.remove();
            this.sumasIntermediasData.push({ value: sumaStr, x: leftPosTemp, width: anchoCeldaTemp });

            if (newCarry > 0) {
                const carryDigitsToRight = digitsToTheRight + 1;
                const carryHasCommaToRight = this.maxDecLength > 0 && carryDigitsToRight >= this.maxDecLength;
                const carryVisualCellsToRight = carryDigitsToRight + (carryHasCommaToRight ? 1 : 0);
                const carryVisualCol = this._getGridDimensions().width - 1 - carryVisualCellsToRight;

                const leftBase = this.layoutParams.offsetHorizontal + carryVisualCol * this.layoutParams.tamCel + this.layoutParams.paddingLeft;
                const numeroLlevada = crearCelda("output-grid__cell output-grid__cell--resto", newCarry.toString(), { left: `${leftBase}px`, top: `${topPosLlevada}px`, width: `${this.layoutParams.tamCel}px`, height: `${this.layoutParams.tamCel}px`, fontSize: `${this.layoutParams.tamFuente * 0.7}px`, textAlign: 'center' });
                const topFlecha = topPosLlevada + this.layoutParams.tamCel * 0.8;
                const altoFlecha = (this.layoutParams.paddingTop + 2.5 * this.layoutParams.tamCel) - topFlecha;
                const anchoFlecha = this.layoutParams.tamCel * 0.8;
                const leftFlecha = leftBase + (this.layoutParams.tamCel * 1 - anchoFlecha);
                const flecha = crearFlechaLlevada(leftFlecha, topFlecha, anchoFlecha, altoFlecha);
                this.salida.appendChild(numeroLlevada);
                this.salida.appendChild(flecha);
            }
            carry = newCarry;
            await esperar(500);
        }
    }

    async _finalize() {
        await esperar(100);
        const topPosSumaIntermedia = this.layoutParams.paddingTop + 0.1 * this.layoutParams.tamCel;
        this.sumasIntermediasData.forEach(data => {
            const celdaFinal = crearCelda("output-grid__cell output-grid__cell--suma-intermedia", data.value, { left: `${data.x}px`, top: `${topPosSumaIntermedia}px`, width: `${data.width}px`, height: `${this.layoutParams.tamCel}px`, fontSize: `${this.layoutParams.tamFuente * 0.8}px` });
            celdaFinal.style.opacity = '0';
            this.salida.appendChild(celdaFinal);
            setTimeout(() => {
                celdaFinal.style.transition = 'opacity 0.5s ease-in';
                celdaFinal.style.opacity = '1';
            }, 100);
        });
    }
}

export async function suma(numerosAR) {
    const op = new SumaOperation(numerosAR, salida);
    await op.execute();
}