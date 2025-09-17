// =======================================================
// --- operations/utils/VisualOperation.js ---
// Clase base abstracta para todas las operaciones visuales.
// Utiliza el patrón "Template Method".
// =======================================================
"use strict";

import * as CommonOps from './common-operations.js';
import { crearCelda } from './dom-helpers.js';

export class VisualOperation {
    /**
     * @param {Array<[string, number]>} numerosAR - Los operandos de la operación.
     * @param {HTMLElement} salida - El elemento del DOM donde se renderizará la operación.
     */
    constructor(numerosAR, salida) {
        if (this.constructor === VisualOperation) {
            throw new Error("La clase base 'VisualOperation' no puede ser instanciada directamente.");
        }
        this.numerosAR = numerosAR;
        this.salida = salida;
        this.layoutParams = {};
        this.partesOperandos = [];
        this.operandosParaCalcular = [];
        this.maxIntLength = 0;
        this.maxDecLength = 0;
        this.displayWidth = 0;
        this.longitudMaximaTotal = 0;
        this.resultado = { raw: '0', display: '0', esNegativo: false };
    }

    /**
     * Método plantilla que orquesta la ejecución de la operación visual.
     * Este es el único método público que se debe llamar desde fuera.
     */
    async execute() {
        this._clearOutput();
        this._prepareOperands();
        this._calculateLayout();
        this._calculateResult();
        await this._drawStaticElements();
        await this._animateSteps();
        this._drawResult();
        this._finalize();
    }

    // --- Pasos del Algoritmo (Implementados en la clase base) ---

    _clearOutput() {
        this.salida.innerHTML = "";
    }

    _prepareOperands() {
        const data = CommonOps.prepararOperandos(this.numerosAR);
        Object.assign(this, data);
    }

    _calculateLayout() {
        const { width, height } = this._getGridDimensions();
        this.layoutParams = CommonOps.calcularLayout(this.salida, width, height);
    }

    async _drawStaticElements() {
        const { width } = this._getGridDimensions();
        const operandosParaDibujar = this._getOperandsForDisplay();
        
        let yPos = this.layoutParams.paddingTop + this.layoutParams.tamCel * (this._getYPosMultiplier() || 1);

        const yPosDespues = CommonOps.dibujarOperandos(this.salida, operandosParaDibujar, this.maxIntLength, this.maxDecLength, width, this.layoutParams, yPos);

        const signCol = this.displayWidth + 1;
        CommonOps.dibujarSignoOperacion(this.salida, this._getOperatorSign(), signCol, yPosDespues, width, this.layoutParams);
        CommonOps.dibujarLinea(this.salida, signCol, yPosDespues, width, this.layoutParams);

        this.yPosResultado = yPosDespues + this.layoutParams.tamCel * 0.2;
    }

    _drawResult() {
        const { width } = this._getGridDimensions();
        let resultadoFinal = this.resultado.display;

        if (this.resultado.esNegativo) {
            const resultSignCol = width - resultadoFinal.length - 1;
            const resultSignLeft = this.layoutParams.offsetHorizontal + resultSignCol * this.layoutParams.tamCel + this.layoutParams.paddingLeft;
            const signElement = crearCelda("output-grid__cell output-grid__cell--cociente", "-", {
                left: `${resultSignLeft}px`, top: `${this.yPosResultado}px`, width: `${this.layoutParams.tamCel}px`, height: `${this.layoutParams.tamCel}px`, fontSize: `${this.layoutParams.tamFuente}px`
            });
            this.salida.appendChild(signElement);
        }
        
        CommonOps.dibujarResultado(this.salida, resultadoFinal, this.yPosResultado, width, this.layoutParams);
    }

    // --- Métodos "Abstractos" (para ser implementados por las subclases) ---

    /** @returns {{width: number, height: number}} Las dimensiones de la cuadrícula. */
    _getGridDimensions() {
        throw new Error("El método '_getGridDimensions' debe ser implementado por la subclase.");
    }

    /** @returns {string} El signo de la operación (ej: '+', '-'). */
    _getOperatorSign() {
        throw new Error("El método '_getOperatorSign' debe ser implementado por la subclase.");
    }

    /** @returns {Array} Los operandos en el orden correcto para ser dibujados. */
    _getOperandsForDisplay() {
        return this.partesOperandos; // Comportamiento por defecto
    }

    /** @returns {number} Multiplicador para la posición Y inicial. */
    _getYPosMultiplier() {
        return 1.0; // Comportamiento por defecto
    }

    /** Realiza el cálculo matemático principal y formatea el resultado. */
    _calculateResult() {
        throw new Error("El método '_calculateResult' debe ser implementado por la subclase.");
    }

    /** Contiene la lógica de animación específica de la operación. */
    async _animateSteps() {
        // Puede estar vacío si la operación no tiene animación de pasos intermedios.
        return Promise.resolve();
    }

    /** Se ejecuta al final, para cualquier limpieza o animación final. */
    _finalize() {
        // Opcional para las subclases
    }
}