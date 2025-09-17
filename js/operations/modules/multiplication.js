// =======================================================
// --- operations/modules/multiplication.js (REFACTORIZADO) ---
// Utiliza la clase base VisualOperation para una estructura OOP.
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { crearCelda, crearCeldaAnimada, esperar } from '../utils/dom-helpers.js';
import { salida } from '../../calculadora/config.js';

export class MultiplicationOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
        this.coloresParciales = ['color-parcial-1', 'color-parcial-2', 'color-parcial-3'];
    }

    _prepareOperands() {
        super._prepareOperands();

        const [num1, numDec1] = this.numerosAR[0];
        const [num2, numDec2] = this.numerosAR[1];

        // Cadenas de visualización de operandos
        this.num1Display = num1; if (numDec1 > 0) this.num1Display = num1.slice(0, -numDec1) + ',' + num1.slice(-numDec1);
        this.num2Display = num2; if (numDec2 > 0) this.num2Display = num2.slice(0, -numDec2) + ',' + num2.slice(-numDec2);

        // Productos parciales (necesarios para calcular el layout)
        this.partialProducts = [...num2].map((digit, index) => {
            const product = (BigInt(num1) * BigInt(digit)).toString();
            const offset = num2.length - 1 - index;
            return { product, offset, digit };
        }).filter(p => p.digit !== '0');
        
        if (num2.replace(/0/g, '').length === 0) {
            this.partialProducts.push({product: '0', offset:0, digit:'0'});
        }

        // Dimensiones para el layout
        this.maxPartialProductWidth = this.partialProducts.reduce((max, p) => Math.max(max, p.product.length + p.offset), 0);
        this.rightPadding = 1;
        this.signPadding = 1;
        this.num2BlockWidth = this.num2Display.length + this.signPadding + 1;
        this.partialsBlockWidth = (this.partialProducts.length > 1) ? this.maxPartialProductWidth + this.signPadding + 1 : this.maxPartialProductWidth;
    }

    _getGridDimensions() {
        // Estimación del ancho del resultado para el layout inicial
        const estimatedResultLength = this.numerosAR[0][0].length + this.numerosAR[1][0].length + 1;

        const anchuraEnCeldas = Math.max(
            this.num1Display.length, 
            this.num2BlockWidth, 
            estimatedResultLength,
            this.partialsBlockWidth
        ) + this.rightPadding;
        
        const numPartials = this.partialProducts.length;
        const numRowsForPartials = (numPartials > 1) ? numPartials + 1 : 0;
        const alturaEnCeldas = 2 + 1 + numRowsForPartials + 1;

        return { width: anchuraEnCeldas, height: alturaEnCeldas };
    }

    _getOperatorSign() {
        return "x";
    }

    _calculateResult() {
        const [num1, numDec1] = this.numerosAR[0];
        const [num2, numDec2] = this.numerosAR[1];
        this.resultado.raw = (BigInt(num1) * BigInt(num2)).toString();
        
        const totalDecimalesResultado = numDec1 + numDec2;
        let resultadoDisplay = this.resultado.raw;
        if (totalDecimalesResultado > 0) {
            let padding = '0'.repeat(Math.max(0, totalDecimalesResultado - resultadoDisplay.length + 1));
            resultadoDisplay = padding + resultadoDisplay;
            resultadoDisplay = resultadoDisplay.slice(0, -totalDecimalesResultado) + ',' + resultadoDisplay.slice(-totalDecimalesResultado);
        }
        if (resultadoDisplay.startsWith(',')) resultadoDisplay = '0' + resultadoDisplay;
        if (resultadoDisplay.endsWith(',')) resultadoDisplay = resultadoDisplay.slice(0, -1);
        this.resultado.display = resultadoDisplay;
    }

    _dibujarNumero(fragment, numeroStr, y, claseBase, claseDigito, animado = false) {
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft } = this.layoutParams;
        const { width } = this._getGridDimensions();
        const startCol = width - this.rightPadding - numeroStr.length;
        for (let i = 0; i < numeroStr.length; i++) {
            const char = numeroStr[i];
            const esComa = char === ',';
            const claseColor = esComa ? 'color-coma' : claseDigito;
            const leftPos = offsetHorizontal + (startCol + i) * tamCel + paddingLeft;
            const celda = animado
                ? crearCeldaAnimada(`${claseBase} ${claseColor}`, char, { left: `${leftPos}px`, top: `${y}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }, i * 50)
                : crearCelda(`${claseBase} ${claseColor}`, char, { left: `${leftPos}px`, top: `${y}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` });
            fragment.appendChild(celda);
        }
    }

    async _drawStaticElements() {
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = this.layoutParams;
        const { width } = this._getGridDimensions();
        this.yPos = paddingTop;

        const fragmentOperandos = document.createDocumentFragment();
        this._dibujarNumero(fragmentOperandos, this.num1Display, this.yPos, 'output-grid__cell output-grid__cell--operando', 'color-operando');
        this.yPos += tamCel;

        const signXCol = width - this.rightPadding - this.num2Display.length - this.signPadding - 1;
        const signXLeft = offsetHorizontal + signXCol * tamCel + paddingLeft;
        fragmentOperandos.appendChild(crearCelda("output-grid__cell output-grid__cell--signo color-signo", "x", { left: `${signXLeft}px`, top: `${this.yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
        this._dibujarNumero(fragmentOperandos, this.num2Display, this.yPos, 'output-grid__cell output-grid__cell--operando', 'color-operando');
        this.salida.appendChild(fragmentOperandos);
        await esperar(800);
        
        this.yPos += tamCel;
        const line1Width = Math.max(this.num1Display.length, this.num2BlockWidth) * tamCel;
        const lineLeft1 = offsetHorizontal + (width - this.rightPadding) * tamCel - line1Width + paddingLeft;
        this.salida.appendChild(crearCelda("output-grid__line", "", { left: `${lineLeft1}px`, top: `${this.yPos}px`, width: `${line1Width}px`, height: `2px` }));
        this.yPos += tamCel * 0.2;
        await esperar(500);
    }

    async _animateSteps() {
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft } = this.layoutParams;
        const { width } = this._getGridDimensions();

        if (this.partialProducts.length > 1) {
            for (const [index, { product, offset }] of this.partialProducts.reverse().entries()) {
                const fragmentParcial = document.createDocumentFragment();
                const colorClass = this.coloresParciales[index % this.coloresParciales.length];
                
                if (index === 1) {
                    const signPlusCol = width - this.rightPadding - this.maxPartialProductWidth - this.signPadding - 1;
                    const signPlusLeft = offsetHorizontal + signPlusCol * tamCel + paddingLeft;
                    fragmentParcial.appendChild(crearCeldaAnimada("output-grid__cell output-grid__cell--signo color-signo", "+", { left: `${signPlusLeft}px`, top: `${this.yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
                }
                
                const startCol = width - this.rightPadding - product.length - offset;
                for (let j = 0; j < product.length; j++) {
                    const leftPos = offsetHorizontal + (startCol + j) * tamCel + paddingLeft;
                    fragmentParcial.appendChild(crearCeldaAnimada(`output-grid__cell output-grid__cell--producto-parcial ${colorClass}`, product[j], { left: `${leftPos}px`, top: `${this.yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }, j * 50));
                }
                this.salida.appendChild(fragmentParcial);
                this.yPos += tamCel; 
                await esperar(1200);
            }

            const line2Width = Math.max(this.resultado.display.length, this.partialsBlockWidth) * tamCel;
            const lineLeft2 = offsetHorizontal + (width - this.rightPadding) * tamCel - line2Width + paddingLeft;
            this.salida.appendChild(crearCelda("output-grid__line", "", { left: `${lineLeft2}px`, top: `${this.yPos}px`, width: `${line2Width}px`, height: `2px` }));
            this.yPos += tamCel * 0.2;
            await esperar(500);
        } else if (this.partialProducts.length === 1 && this.numerosAR[1][0].replace(/0/g, '').length > 0) {
            this.yPos += tamCel;
        }
        this.yPosResultado = this.yPos;
    }

    _drawResult() {
        const fragmentResultado = document.createDocumentFragment();
        this._dibujarNumero(fragmentResultado, this.resultado.display, this.yPosResultado, 'output-grid__cell output-grid__cell--cociente', 'color-resultado', true);
        this.salida.appendChild(fragmentResultado);
    }
}

export async function multiplica(numerosAR) {
    const op = new MultiplicationOperation(numerosAR, salida);
    await op.execute();
}