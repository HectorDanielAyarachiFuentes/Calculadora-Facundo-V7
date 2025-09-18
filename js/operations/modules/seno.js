// =======================================================
// --- operations/modules/seno.js ---
// Implementa la operación de seno (sin).
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { crearCelda } from '../utils/dom-helpers.js';
import { salida } from '../../calculadora/config.js';
import { ErrorHandlerCentralized } from '../../calculadora/error-handler-centralized.js';

const errorHandler = new ErrorHandlerCentralized(salida);

// La clase base VisualOperation espera un array de operandos.
// Para una función unaria como el seno, adaptamos la entrada.
export class SenoOperation extends VisualOperation {
    constructor(numero, salida) {
        // Creamos un array 'numerosAR' simulado para ser compatible con la clase padre.
        super([[numero, 0], ['0', 0]], salida);
        this.operando = numero; // El ángulo en grados
    }

    // Sobrescribimos el paso de preparación, ya que no necesitamos alinear dos operandos.
    _prepareOperands() {
        // No es necesario para una operación unaria.
    }

    _calculateResult() {
        try {
            const anguloGrados = parseFloat(this.operando.replace(',', '.'));

            if (isNaN(anguloGrados)) {
                this.error = 'Entrada inválida para el seno.';
                return;
            }

            // Math.sin() espera el ángulo en radianes. Convertimos grados a radianes.
            const anguloRadianes = anguloGrados * (Math.PI / 180);
            const resultado = Math.sin(anguloRadianes);
            
            // Redondear a un número razonable de decimales para evitar imprecisiones de punto flotante.
            // Por ejemplo, sin(180) debería ser 0, no un número muy pequeño.
            const resultadoRedondeado = parseFloat(resultado.toFixed(10));

            const resultadoFormateado = resultadoRedondeado.toString().replace('.', ',');

            this.resultado.raw = resultado.toString();
            this.resultado.display = resultadoFormateado;

        } catch (e) {
            this.error = 'Error al calcular el seno.';
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
        const width = opStr.length + resStr.length + 10; // "sin(" + op + "°) = " + res
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
        const fullExpression = `sin(${this.operando}°) = ${this.resultado.display}`;
        
        this.salida.appendChild(crearCelda('output-grid__cell output-grid__result--simple', fullExpression, {
            left: `${offsetHorizontal + paddingLeft + tamCel}px`, top: `${yPos}px`, fontSize: `${tamFuente}px`, width: 'auto', height: `${tamCel}px`, whiteSpace: 'nowrap'
        }));

        return true;
    }

    // Métodos de la clase padre que no son necesarios aquí.
    _getOperatorSign() { return 'sin'; }
    async _animateSteps() { /* Sin animación */ }
    async _drawStaticElements() { /* No necesario para esta vista */ }
    _drawResult() { /* El resultado se dibuja dentro de execute() */ }
}

export async function seno(numero) {
    const op = new SenoOperation(numero, salida);
    return await op.execute();
}