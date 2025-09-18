// =======================================================
// --- operations/modules/potencia.js ---
// Implementa la operación de potencia (a elevado a b).
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { crearCelda } from '../utils/dom-helpers.js';
import { salida } from '../../calculadora/config.js';
import { ErrorHandlerCentralized } from '../../calculadora/error-handler-centralized.js';

const errorHandler = new ErrorHandlerCentralized(salida);

export class PotenciaOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
        this.operando1 = this.numerosAR[0][0];
        this.operando2 = this.numerosAR[1][0];
    }

    _calculateResult() {
        try {
            const baseBig = BigInt(this.operando1);
            const expBig = BigInt(this.operando2);

            if (expBig < 0n) {
                this.error = 'Exponentes negativos no soportados.';
            } else {
                const resultado = baseBig ** expBig;
                if (resultado.toString().length > 50) {
                    this.error = 'El resultado es demasiado grande.';
                } else {
                    this.resultado.raw = resultado.toString();
                    this.resultado.display = this.resultado.raw;
                }
            }
        } catch (e) {
            this.error = 'Entrada inválida para la potencia.';
        }

        if (this.error) {
            this.resultado.display = "Error";
            this.resultado.raw = "Error";
        }
    }

    _getGridDimensions() {
        const op1Str = this.operando1.toString();
        const op2Str = this.operando2.toString();
        const resStr = this.resultado.display;
        const width = op1Str.length + op2Str.length + resStr.length + 5; // op1 + ' ^ ' + op2 + ' = ' + res
        return { width, height: 5 };
    }

    async execute() {
        this._clearOutput();
        this._calculateResult();

        if (this.error) {
            errorHandler.mostrarError('invalidOperation', { customMessage: this.error });
            return false;
        }

        this._calculateLayout();
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = this.layoutParams;
        const yPos = paddingTop + tamCel * 2;
        const fullExpression = `${this.operando1} ^ ${this.operando2} = ${this.resultado.display}`;
        
        this.salida.appendChild(crearCelda('output-grid__cell output-grid__result--simple', fullExpression, {
            left: `${offsetHorizontal + paddingLeft + tamCel}px`,
            top: `${yPos}px`,
            fontSize: `${tamFuente}px`,
            width: 'auto',
            height: `${tamCel}px`,
            whiteSpace: 'nowrap'
        }));

        return true;
    }

    _getOperatorSign() { return '^'; }
    async _animateSteps() { /* Sin pasos intermedios */ }
    async _drawStaticElements() { /* No usado en esta implementación simple */ }
    _drawResult() { /* No usado en esta implementación simple */ }
}

export async function potencia(numerosAR) {
    const op = new PotenciaOperation(numerosAR, salida);
    return await op.execute();
}