// =======================================================
// --- operations/modules/square-root.js (VERSIÓN CORREGIDA - COLORES FINALES) ---
// Implementación mejorada del cálculo de raíz cuadrada con visualización paso a paso
// que incluye manejo correcto de decimales, limpieza de DOM y colores de alta visibilidad.
// =======================================================
"use strict";

import { crearCelda, esperar } from '../utils/dom-helpers.js';
import { salida, display } from '../../config.js';
import { VisualOperation } from '../utils/VisualOperation.js';
import { ErrorHandlerCentralized } from '../../error-handler-centralized.js';

// =======================================================
// CONSTANTES Y CONFIGURACIÓN
// =======================================================
const ANIMATION_DELAYS = {
    STEP_TRANSITION: 800,
    OPERATION_REVEAL: 800,
    RESULT_SHOW: 500
};

const VISUAL_CONFIG = {
    RADICAL_WIDTH_RATIO: 0.7,
    DECIMAL_OFFSET_RATIO: 0.8,
    MARGIN_RATIO: 0.5,
    FONT_SIZE_RATIO: 0.8,
    MAX_DECIMAL_PLACES: 6,
    MAX_ITERATIONS: 20
};

const CSS_CLASSES = {
    DIVIDEND: "output-grid__cell output-grid__cell--dividendo",
    PRODUCT: "output-grid__cell output-grid__cell--producto", 
    QUOTIENT: "output-grid__cell output-grid__cell--cociente",
    REMAINDER: "output-grid__cell output-grid__cell--resto",
    LINE: "output-grid__line",
    ANIMATE: "animate-fade-in-scale",
    RADICAL: "output-grid__radical",
    DECIMAL_POINT: "decimal-point"
};

const errorHandler = new ErrorHandlerCentralized(salida);

// =======================================================
// FUNCIÓN PRINCIPAL
// =======================================================

class SquareRootOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
    }

    // Sobrescribimos el método de ejecución para adaptarlo al flujo de la raíz cuadrada,
    // donde el layout depende del resultado del cálculo.
    async execute() {
        this._clearOutput();
        if (!this._prepareOperands()) return; // La validación ocurre aquí
        this._calculateResult();
        this._calculateLayout();
        await this._drawStaticElements();
        await this._animateSteps();
        await this._finalize();
    }

    _prepareOperands() {
        const inputStr = this.numerosAR[0][0];
        if (!errorHandler.validarRaizCuadrada(inputStr)) {
            return false;
        }
        const inputNumber = parseFloat(inputStr.replace(',', '.'));
        const { groups, decimalPos, decGroups } = groupDigits(inputNumber);
        this.groups = groups;
        this.decimalPos = decimalPos;
        this.decGroups = decGroups;
        return true;
    }

    _calculateResult() {
        this.steps = calculateSquareRootSteps(this.groups, this.decGroups);
        const rootSoFar = this.steps.map(step => step.foundDigitX).join('');
        this.resultado.raw = rootSoFar;

        const intPart = rootSoFar.substring(0, this.decimalPos) || '0';
        const decPart = rootSoFar.substring(this.decimalPos);

        if (decPart) {
            this.resultado.display = `${intPart},${decPart}`;
        } else {
            this.resultado.display = intPart;
        }
    }

    _getGridDimensions() {
        const maxDigitsInStep = Math.max(...this.steps.map(s => s.numberToSubtract?.length || 0));
        const totalDigits = this.groups.join('').length + (this.groups.length > 1 ? 1 : 0);
        
        const layoutWidth = Math.max(totalDigits, maxDigitsInStep) + this.groups.length + 3;
        const layoutHeight = this.steps.length * 2 + 4;
        return { width: layoutWidth, height: layoutHeight };
    }

    _calculateLayout() {
        super._calculateLayout(); // Llama a _getGridDimensions y establece layoutParams base
        const { tamCel, paddingTop } = this.layoutParams;
        
        // Añadir propiedades de layout personalizadas para la raíz cuadrada
        this.layoutParams.yBase = paddingTop + (tamCel * 2);
        this.layoutParams.radicalSignWidth = tamCel * VISUAL_CONFIG.RADICAL_WIDTH_RATIO;
        this.layoutParams.numberBlockLeft = this.layoutParams.offsetHorizontal + (tamCel * VISUAL_CONFIG.RADICAL_WIDTH_RATIO) + this.layoutParams.paddingLeft;
        this.layoutParams.resultYPosition = paddingTop;
    }

    async _drawStaticElements() {
        const { tamCel, tamFuente, yBase, radicalSignWidth, numberBlockLeft, offsetHorizontal, paddingLeft } = this.layoutParams;
    
        const fullNumber = this.groups.join('');
        const decimalIndex = this.decimalPos * 2;
        const leftBlockCharCount = fullNumber.length + (this.decimalPos < this.groups.length ? 1 : 0);
        const barWidth = (leftBlockCharCount * tamCel) - radicalSignWidth;
        
        drawRadicalSign(this.salida, offsetHorizontal + paddingLeft, yBase, radicalSignWidth, tamCel * 1.5, barWidth);
        
        const charPositions = drawNumbersWithDecimal(this.salida, fullNumber, decimalIndex, {
            startX: numberBlockLeft,
            y: yBase,
            tamCel,
            tamFuente
        });
        
        this.positions = {
            charPositions,
            rootXStart: numberBlockLeft + (leftBlockCharCount * tamCel) + (tamCel * 0.5),
            leftBlockCharCount,
            decimalIndex
        };
    }

    async _animateSteps() {
        const { tamCel, tamFuente, yBase, resultYPosition } = this.layoutParams;
        const { charPositions, rootXStart, decimalIndex } = this.positions;
        
        let yPos = yBase + tamCel * 1.2;
        let remainderStr = '';
        let currentRoot = '';

        for (const [index, step] of this.steps.entries()) {
            await esperar(ANIMATION_DELAYS.STEP_TRANSITION);

            const stepData = prepareStepData(step, this.groups, remainderStr, index, charPositions, decimalIndex, tamCel);
            
            if (index > 0 || remainderStr) {
                drawWorkingNumber(this.salida, stepData.currentWorkingNumber, stepData.xEndPos, yPos, tamCel, tamFuente);
            }

            const opCell = showOperationPlaceholder(this.salida, step, rootXStart, yPos, tamFuente);
            
            await esperar(ANIMATION_DELAYS.OPERATION_REVEAL);
            
            yPos = drawSubtractionStep(this.salida, step, stepData.xEndPos, yPos, stepData.currentWorkingNumber, tamCel, tamFuente);
            
            await esperar(ANIMATION_DELAYS.RESULT_SHOW);
            
            updateOperationDisplay(opCell, step);
            currentRoot += step.foundDigitX;
            
            drawRootDigit(this.salida, step, index, this.decimalPos, rootXStart, resultYPosition, currentRoot, tamCel, tamFuente);
            
            remainderStr = step.newRemainder;
            drawRemainder(this.salida, remainderStr, stepData.xEndPos, yPos, tamCel, tamFuente);
            
            yPos += tamCel * 0.8;
        }
    }

    async _finalize() {
        await esperar(ANIMATION_DELAYS.RESULT_SHOW);
        const finalResultElements = this.salida.querySelectorAll('.output-grid__cell--cociente');
        
        finalResultElements.forEach(el => {
            el.style.transition = 'color 0.4s ease, font-weight 0.4s ease';
            el.style.color = '#ffc107';
            el.style.fontWeight = 'bold';
        });
    }

    // Estos métodos no son necesarios para esta operación, así que los sobrescribimos.
    _drawResult() { }
    _getOperatorSign() { return ''; }
}

export async function raizCuadrada(numero = null) {
    errorHandler.limpiarErrores();
    const entrada = numero || display.innerHTML;
    const numerosAR = [[entrada, 0]]; // Adaptar al formato esperado por VisualOperation

    const op = new SquareRootOperation(numerosAR, salida);
    await op.execute();
}

// =======================================================
// DIBUJO DE ELEMENTOS ESTÁTICOS
// =======================================================

function drawNumbersWithDecimal(container, fullNumber, decimalIndex, config) {
    const { startX, y, tamCel, tamFuente } = config;
    const charPositions = [];
    let currentX = startX;

    for (let i = 0; i < fullNumber.length; i++) {
        if (i === decimalIndex && decimalIndex < fullNumber.length) {
            const decimalCell = crearCelda(`${CSS_CLASSES.PRODUCT} ${CSS_CLASSES.DECIMAL_POINT}`, ".", {
                left: `${currentX - tamCel * 0.2}px`,
                top: `${y}px`,
                width: `${tamCel}px`,
                height: `${tamCel}px`,
                fontSize: `${tamFuente}px`
            });
            decimalCell.style.color = '#666';
            container.appendChild(decimalCell);
            charPositions.push(currentX);
            currentX += tamCel * VISUAL_CONFIG.DECIMAL_OFFSET_RATIO;
        }

        container.appendChild(crearCelda(CSS_CLASSES.DIVIDEND, fullNumber[i], {
            left: `${currentX}px`,
            top: `${y}px`,
            width: `${tamCel}px`,
            height: `${tamCel}px`,
            fontSize: `${tamFuente}px`
        }));
        charPositions.push(currentX);
        currentX += tamCel;
    }

    return charPositions;
}

// =======================================================
// ANIMACIÓN DE PASOS
// =======================================================

function prepareStepData(step, groups, remainderStr, index, charPositions, decimalIndex, tamCel) {
    const currentGroup = groups[index] || '00';
    const currentWorkingNumber = (remainderStr + currentGroup).replace(/^0+/, '') || '0';
    
    const digitsBefore = groups.slice(0, index).join('').length;
    const adjustForDecimal = index > 0 && decimalIndex < (digitsBefore + currentGroup.length) ? 1 : 0;
    const groupEndIndexInChars = digitsBefore + adjustForDecimal + currentGroup.length - 1;
    
    const xEndPos = charPositions[Math.min(groupEndIndexInChars, charPositions.length - 1)] + tamCel;
    
    return {
        currentWorkingNumber,
        xEndPos
    };
}

function drawWorkingNumber(container, workingNumber, xEndPos, yPos, tamCel, tamFuente) {
    let xCurrent = xEndPos - (workingNumber.length * tamCel);
    
    for (const char of workingNumber) {
        container.appendChild(crearCelda(`${CSS_CLASSES.DIVIDEND} ${CSS_CLASSES.ANIMATE}`, char, {
            left: `${xCurrent}px`,
            top: `${yPos}px`,
            width: `${tamCel}px`,
            height: `${tamCel}px`,
            fontSize: `${tamFuente}px`
        }));
        xCurrent += tamCel;
    }
}

function showOperationPlaceholder(container, step, rootXStart, yPos, tamFuente) {
    const opTextPlaceholder = `${step.doubledRoot}_ × _`;
    const opCell = crearCelda("", opTextPlaceholder, {
        left: `${rootXStart}px`,
        top: `${yPos + tamFuente * 0.5}px`,
        fontSize: `${tamFuente * VISUAL_CONFIG.FONT_SIZE_RATIO}px`,
        position: 'absolute',
        whiteSpace: 'nowrap',
        color: '#ddd',
        transition: 'all 0.3s ease'
    });
    container.appendChild(opCell);
    return opCell;
}

function drawSubtractionStep(container, step, xEndPos, yPos, workingNumber, tamCel, tamFuente) {
    yPos += tamCel * 0.8;
    const numToSubtractStr = step.numberToSubtract || '0';
    let xSubtract = xEndPos - (numToSubtractStr.length * tamCel);
    
    for (const char of numToSubtractStr) {
        container.appendChild(crearCelda(`${CSS_CLASSES.PRODUCT} ${CSS_CLASSES.ANIMATE}`, char, {
            left: `${xSubtract}px`,
            top: `${yPos}px`,
            width: `${tamCel}px`,
            height: `${tamCel}px`,
            fontSize: `${tamFuente}px`
        }));
        xSubtract += tamCel;
    }
    
    const lineLeft = xEndPos - (Math.max(workingNumber.length, numToSubtractStr.length) * tamCel);
    const lineWidth = Math.max(workingNumber.length, numToSubtractStr.length) * tamCel;
    container.appendChild(crearCelda(CSS_CLASSES.LINE, "", {
        left: `${lineLeft}px`,
        top: `${yPos + tamCel}px`,
        width: `${lineWidth}px`,
        height: '2px',
        backgroundColor: '#333'
    }));
    
    return yPos + tamCel;
}

function updateOperationDisplay(opCell, step) {
    opCell.textContent = `${step.doubledRoot}${step.foundDigitX} × ${step.foundDigitX}`;
    // *** CAMBIO DE COLOR: Usar un azul marino fuerte para las operaciones auxiliares. ***
    opCell.style.color = '#6495ED'; // Se cambió a un azul visible y fuerte.
    opCell.style.fontWeight = 'normal';
}

function drawRootDigit(container, step, index, decimalPos, rootXStart, yPos, currentRoot, tamCel, tamFuente) {
    container.querySelectorAll('.output-grid__cell--cociente').forEach(el => el.remove());
    
    let xCurrent = rootXStart;
    let needsDecimalPoint = decimalPos > 0;
    
    for (let i = 0; i < currentRoot.length; i++) {
        if (i === decimalPos && needsDecimalPoint) {
            const decimalCell = crearCelda(`${CSS_CLASSES.QUOTIENT} ${CSS_CLASSES.DECIMAL_POINT}`, ".", {
                left: `${xCurrent - tamCel * 0.2}px`,
                top: `${yPos}px`,
                width: `${tamCel}px`,
                height: `${tamCel}px`,
                fontSize: `${tamFuente}px`
            });
            decimalCell.style.color = '#666';
            container.appendChild(decimalCell);
            xCurrent += tamCel * VISUAL_CONFIG.DECIMAL_OFFSET_RATIO;
            needsDecimalPoint = false;
        }
        
        container.appendChild(crearCelda(`${CSS_CLASSES.QUOTIENT} ${i === index ? CSS_CLASSES.ANIMATE : ''}`, currentRoot[i], {
            left: `${xCurrent}px`,
            top: `${yPos}px`,
            width: `${tamCel}px`,
            height: `${tamCel}px`,
            fontSize: `${tamFuente}px`,
            color: i === index ? '#d00' : '#b0bec5'
        }));
        xCurrent += tamCel;
    }
}

function drawRemainder(container, remainderStr, xEndPos, yPos, tamCel, tamFuente) {
    remainderStr = remainderStr || '0';
    let xRemainder = xEndPos - (remainderStr.length * tamCel);
    
    for (const char of remainderStr) {
        container.appendChild(crearCelda(`${CSS_CLASSES.REMAINDER} ${CSS_CLASSES.ANIMATE}`, char, {
            left: `${xRemainder}px`,
            top: `${yPos}px`,
            width: `${tamCel}px`,
            height: `${tamCel}px`,
            fontSize: `${tamFuente}px`
        }));
        xRemainder += tamCel;
    }
}

// =======================================================
// FUNCIONES DE CÁLCULO MATEMÁTICO
// =======================================================

function groupDigits(numero) {
    let strNum = numero.toString();
    let [intPart, decPart = ''] = strNum.split('.');
    
    if (intPart === '0' && decPart) intPart = '';
    
    if (intPart.length % 2 !== 0) intPart = '0' + intPart;
    
    if (decPart.length % 2 !== 0) decPart += '0';
    decPart = decPart.substring(0, VISUAL_CONFIG.MAX_DECIMAL_PLACES);
    
    while (decPart.length < VISUAL_CONFIG.MAX_DECIMAL_PLACES) {
        decPart += '00';
    }
    
    const intGroups = intPart.match(/.{1,2}/g) || [];
    const decGroups = decPart.match(/.{1,2}/g) || [];
    const decimalPos = intGroups.length;
    
    const groups = [...intGroups, ...decGroups];
    if (groups.length === 0) groups.push('00');
    
    return { groups, decimalPos, decGroups };
}

function calculateSquareRootSteps(groups, decGroups) {
    const steps = [];
    let rootSoFar = '';
    let remainder = 0n;
    
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const currentNumber = remainder * 100n + BigInt(group);
        const doubledRoot = BigInt(rootSoFar || '0') * 2n;
        
        let foundDigitX = 0;
        for (let x = 9; x >= 0; x--) {
            const tempNum = (doubledRoot * 10n + BigInt(x)) * BigInt(x);
            if (tempNum <= currentNumber) {
                foundDigitX = x;
                break;
            }
        }
        
        const numberToSubtract = (doubledRoot * 10n + BigInt(foundDigitX)) * BigInt(foundDigitX);
        const newRemainder = currentNumber - numberToSubtract;
        
        steps.push({
            doubledRoot: doubledRoot.toString(),
            foundDigitX: foundDigitX.toString(),
            numberToSubtract: numberToSubtract.toString(),
            newRemainder: newRemainder.toString()
        });
        
        rootSoFar += foundDigitX.toString();
        remainder = newRemainder;
        
        if (remainder === 0n && i >= groups.length / 2) {
             if (decGroups && i >= (groups.length - decGroups.length) + 1 ) {
                 break;
            }
        }
    }
    
    return steps;
}

// =======================================================
// DIBUJO DEL SÍMBOLO RADICAL
// =======================================================

function drawRadicalSign(container, x, y, tickWidth, height, barWidth) {
    const radical = document.createElement('div');
    radical.className = CSS_CLASSES.RADICAL;
    Object.assign(radical.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        height: `${height}px`,
        width: `${tickWidth + barWidth}px`,
        overflow: 'hidden'
    });

    const hLine = document.createElement('div');
    Object.assign(hLine.style, {
        position: 'absolute',
        backgroundColor: '#333',
        height: '2px',
        width: `${barWidth}px`,
        left: `${tickWidth * 0.7}px`,
        top: '0'
    });
    radical.appendChild(hLine);

    const vLine = document.createElement('div');
    Object.assign(vLine.style, {
        position: 'absolute',
        backgroundColor: '#333',
        width: '2px',
        height: `${height * 0.8}px`,
        left: `${tickWidth * 0.7}px`,
        top: '0'
    });
    radical.appendChild(vLine);

    const diagonal = document.createElement('div');
    Object.assign(diagonal.style, {
        position: 'absolute',
        backgroundColor: '#333',
        width: '2px',
        height: `${height * 0.4}px`,
        left: `${tickWidth * 0.3}px`,
        top: `${height * 0.2}px`,
        transform: 'rotate(-30deg)',
        transformOrigin: 'left bottom'
    });
    radical.appendChild(diagonal);

    container.appendChild(radical);
}