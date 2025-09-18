// =======================================================
// --- operations/modules/logaritmolog.js ---
// Implementa la operación de logaritmo en base 10 (log).
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { crearCelda } from '../utils/dom-helpers.js';
import { salida } from '../../calculadora/config.js';
import { ErrorHandlerCentralized } from '../../calculadora/error-handler-centralized.js';

const errorHandler = new ErrorHandlerCentralized(salida);

// La clase base VisualOperation espera un array de operandos.
// Para una función unaria como el logaritmo, adaptamos la entrada para que se ajuste a esta estructura.
export class LogaritmoLogOperation extends VisualOperation {
    constructor(numero, salida) {
        // Creamos un array 'numerosAR' simulado para ser compatible con la clase padre.
        super([[numero, 0], ['0', 0]], salida);
        this.operando = numero;
    }

    // Sobrescribimos el paso de preparación, ya que no necesitamos alinear dos operandos.
    _prepareOperands() {
        // Este paso es para alinear decimales en operaciones binarias. No es necesario aquí.
    }

    _calculateResult() {
        try {
            // Math.log10 de JavaScript calcula el logaritmo en base 10.
            const num = parseFloat(this.operando.replace(',', '.'));

            if (num <= 0) {
                this.error = 'El logaritmo solo está definido para números positivos.';
                return;
            }

            const resultado = Math.log10(num);
            
            // Formateamos el resultado a un número razonable de decimales.
            const resultadoFormateado = parseFloat(resultado.toFixed(10)).toString().replace('.', ',');

            this.resultado.raw = resultado.toString();
            this.resultado.display = resultadoFormateado;

        } catch (e) {
            this.error = 'Entrada inválida para el logaritmo.';
        }

        if (this.error) {
            this.resultado.display = "Error";
            this.resultado.raw = "Error";
        }
    }

    // Sobrescribimos el cálculo del layout para una visualización más simple.
    _getGridDimensions() {
        const opStr = this.operando.toString();
        const resStr = this.resultado.display;
        const width = opStr.length + resStr.length + 9; // "log(" + op + ") = " + res
        return { width, height: 5 };
    }

    // Sobrescribimos el flujo de ejecución para una salida simple en una sola línea.
    async execute() {
        this._clearOutput();
        this._calculateResult();

        if (this.error) {
            errorHandler.mostrarError('invalidOperation', { customMessage: this.error });
            return false;
        }

        this._calculateLayout();
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = this.layoutParams;
        const yPos = paddingTop + tamCel * 2; // Centrado verticalmente
        const fullExpression = `log(${this.operando}) = ${this.resultado.display}`;
        
        this.salida.appendChild(crearCelda('output-grid__cell output-grid__result--simple', fullExpression, {
            left: `${offsetHorizontal + paddingLeft + tamCel}px`, top: `${yPos}px`, fontSize: `${tamFuente}px`, width: 'auto', height: `${tamCel}px`, whiteSpace: 'nowrap'
        }));

        return true;
    }

    // Métodos de la clase padre que no son necesarios aquí.
    _getOperatorSign() { return 'log'; }
    async _animateSteps() { /* Sin animación */ }
    async _drawStaticElements() { /* No necesario para esta vista */ }
    _drawResult() { /* El resultado se dibuja dentro de execute() */ }
}

export async function logaritmoLog(numero) {
    const op = new LogaritmoLogOperation(numero, salida);
    return await op.execute();
}