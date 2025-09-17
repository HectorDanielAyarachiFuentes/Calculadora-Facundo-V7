// =======================================================
// --- operations/modules/modulo.js ---
// Implementa la operación de módulo (resto de la división).
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { crearCelda } from '../utils/dom-helpers.js';

export class ModuloOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
        this.operando1 = BigInt(this.numerosAR[0][0]);
        this.operando2 = BigInt(this.numerosAR[1][0]);
    }

    _calculateResult() {
        if (this.operando2 === 0n) {
            this.resultado.display = "Error";
            this.resultado.raw = "Error";
            return;
        }
        this.resultado.raw = (this.operando1 % this.operando2).toString();
        this.resultado.display = this.resultado.raw;
    }

    _getGridDimensions() {
        const op1Str = this.operando1.toString();
        const op2Str = this.operando2.toString();
        const width = op1Str.length + op2Str.length + this.resultado.display.length + 5; // op1 + ' % ' + op2 + ' = ' + res
        return { width, height: 5 };
    }

    // Sobrescribimos el dibujado para un formato simple: a % b = c
    async _drawStaticElements() {
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = this.layoutParams;
        let xPos = offsetHorizontal + paddingLeft + tamCel;
        const yPos = paddingTop + tamCel * 2;

        const op1Str = this.operando1.toString();
        const op2Str = this.operando2.toString();

        // Dibujar operando 1
        this.salida.appendChild(crearCelda('output-grid__cell', op1Str, {
            left: `${xPos}px`, top: `${yPos}px`, fontSize: `${tamFuente}px`,
            width: `${op1Str.length * tamCel}px`, height: `${tamCel}px`
        }));
        xPos += op1Str.length * tamCel + tamCel;

        // Dibujar signo %
        this.salida.appendChild(crearCelda('output-grid__cell', '%', {
            left: `${xPos}px`, top: `${yPos}px`, fontSize: `${tamFuente}px`,
            width: `${tamCel}px`, height: `${tamCel}px`
        }));
        xPos += tamCel + tamCel;

        // Dibujar operando 2
        this.salida.appendChild(crearCelda('output-grid__cell', op2Str, {
            left: `${xPos}px`, top: `${yPos}px`, fontSize: `${tamFuente}px`,
            width: `${op2Str.length * tamCel}px`, height: `${tamCel}px`
        }));
        xPos += op2Str.length * tamCel + tamCel;

        // Dibujar signo =
        this.salida.appendChild(crearCelda('output-grid__cell', '=', {
            left: `${xPos}px`, top: `${yPos}px`, fontSize: `${tamFuente}px`,
            width: `${tamCel}px`, height: `${tamCel}px`
        }));
        xPos += tamCel * 1.5;

        // Guardar posición para el resultado
        this.resultXPos = xPos;
        this.yPosResultado = yPos;
    }

    _drawResult() {
        const { tamCel, tamFuente } = this.layoutParams;
        this.salida.appendChild(crearCelda('output-grid__cell output-grid__cell--cociente', this.resultado.display, {
            left: `${this.resultXPos}px`, top: `${this.yPosResultado}px`, fontSize: `${tamFuente}px`,
            width: `${this.resultado.display.length * tamCel}px`, height: `${tamCel}px`
        }));
    }

    // Métodos que no se usan en esta operación simple
    _getOperatorSign() { return '%'; }
    async _animateSteps() { /* Sin pasos intermedios */ }
}