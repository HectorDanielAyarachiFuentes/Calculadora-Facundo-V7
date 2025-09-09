// =======================================================
// --- operations/modules/square-root.js (VERSIÓN CORREGIDA - COLORES FINALES) ---
// Implementación mejorada del cálculo de raíz cuadrada con visualización paso a paso
// que incluye manejo correcto de decimales, limpieza de DOM y colores de alta visibilidad.
// =======================================================
"use strict";

import { crearCelda, esperar } from '../utils/dom-helpers.js';
import { calculateLayout } from '../utils/layout-calculator.js';
import { salida, display } from '../../config.js';
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

// =======================================================
// FUNCIÓN PRINCIPAL
// =======================================================

export async function raizCuadrada(numero = null) {
    let inputNumber;
    if (numero !== null) {
        const errorHandler = new ErrorHandlerCentralized(salida);
        if (!errorHandler.validarRaizCuadrada(salida, numero)) {
            return;
        }
        inputNumber = parseFloat(numero.replace(',', '.'));
    } else {
        inputNumber = validateAndParseInput();
    }
    if (inputNumber === null) return;

    await visualizeSquareRoot(inputNumber);
}

// =======================================================
// VALIDACIÓN DE ENTRADA
// =======================================================

function validateAndParseInput() {
    salida.innerHTML = "";
    const entrada = display.innerHTML.replace(',', '.');

    const errorHandler = new ErrorHandlerCentralized(salida);
    if (!errorHandler.validarRaizCuadrada(salida, entrada)) {
        return null;
    }

    return parseFloat(entrada);
}

// =======================================================
// VISUALIZACIÓN PRINCIPAL
// =======================================================

async function visualizeSquareRoot(numero) {
    const container = setupContainer();
    const { groups, decimalPos, decGroups } = groupDigits(numero);
    const steps = calculateSquareRootSteps(groups, decGroups);
    
    const layout = calculateVisualizationLayout(container, groups, steps);
    const positions = drawStaticElements(container, groups, decimalPos, layout);
    
    await animateSquareRootSteps(container, steps, groups, decimalPos, layout, positions);
}

function setupContainer() {
    salida.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'square-root-container';
    Object.assign(container.style, {
        position: 'relative',
        width: '100%',
        minHeight: '300px',
        overflow: 'visible'
    });
    salida.appendChild(container);
    return container;
}

// =======================================================
// CÁLCULO DE LAYOUT Y POSICIONES
// =======================================================

function calculateVisualizationLayout(container, groups, steps) {
    const maxDigitsInStep = Math.max(...steps.map(s => s.numberToSubtract?.length || 0));
    const totalDigits = groups.join('').length + (groups.length > 1 ? 1 : 0);
    
    const layoutWidth = Math.max(totalDigits, maxDigitsInStep) + groups.length + 3;
    const layoutHeight = steps.length * 2 + 4;
    
    const baseLayout = calculateLayout(container, layoutWidth, layoutHeight);
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = baseLayout;
    
    return {
        ...baseLayout,
        yBase: paddingTop + (tamCel * 2),
        radicalSignWidth: tamCel * VISUAL_CONFIG.RADICAL_WIDTH_RATIO,
        numberBlockLeft: offsetHorizontal + (tamCel * VISUAL_CONFIG.RADICAL_WIDTH_RATIO) + paddingLeft,
        resultYPosition: paddingTop
    };
}

// =======================================================
// DIBUJO DE ELEMENTOS ESTÁTICOS
// =======================================================

function drawStaticElements(container, groups, decimalPos, layout) {
    const { tamCel, tamFuente, yBase, radicalSignWidth, numberBlockLeft, offsetHorizontal, paddingLeft } = layout;
    
    const fullNumber = groups.join('');
    const decimalIndex = decimalPos * 2;
    const leftBlockCharCount = fullNumber.length + (decimalPos < groups.length ? 1 : 0);
    const barWidth = (leftBlockCharCount * tamCel) - radicalSignWidth;
    
    drawRadicalSign(container, offsetHorizontal + paddingLeft, yBase, radicalSignWidth, tamCel * 1.5, barWidth);
    
    const charPositions = drawNumbersWithDecimal(container, fullNumber, decimalIndex, {
        startX: numberBlockLeft,
        y: yBase,
        tamCel,
        tamFuente
    });
    
    return {
        charPositions,
        rootXStart: numberBlockLeft + (leftBlockCharCount * tamCel) + (tamCel * 0.5),
        leftBlockCharCount,
        decimalIndex
    };
}

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

async function animateSquareRootSteps(container, steps, groups, decimalPos, layout, positions) {
    const { tamCel, tamFuente, yBase, resultYPosition } = layout;
    const { charPositions, rootXStart, decimalIndex } = positions;
    
    let yPos = yBase + tamCel * 1.2;
    let remainderStr = '';
    let currentRoot = '';

    for (const [index, step] of steps.entries()) {
        await esperar(ANIMATION_DELAYS.STEP_TRANSITION);

        const stepData = prepareStepData(step, groups, remainderStr, index, charPositions, decimalIndex, tamCel);
        
        if (index > 0 || remainderStr) {
            drawWorkingNumber(container, stepData.currentWorkingNumber, stepData.xEndPos, yPos, tamCel, tamFuente);
        }

        const opCell = showOperationPlaceholder(container, step, rootXStart, yPos, tamFuente);
        
        await esperar(ANIMATION_DELAYS.OPERATION_REVEAL);
        
        yPos = drawSubtractionStep(container, step, stepData.xEndPos, yPos, stepData.currentWorkingNumber, tamCel, tamFuente);
        
        await esperar(ANIMATION_DELAYS.RESULT_SHOW);
        
        updateOperationDisplay(opCell, step);
        currentRoot += step.foundDigitX;
        
        drawRootDigit(container, step, index, decimalPos, rootXStart, resultYPosition, currentRoot, tamCel, tamFuente);
        
        remainderStr = step.newRemainder;
        drawRemainder(container, remainderStr, stepData.xEndPos, yPos, tamCel, tamFuente);
        
        yPos += tamCel * 0.8;
    }

    await esperar(ANIMATION_DELAYS.RESULT_SHOW);

    const finalResultElements = container.querySelectorAll('.output-grid__cell--cociente');
    
    finalResultElements.forEach(el => {
        el.style.transition = 'color 0.4s ease, font-weight 0.4s ease';
        el.style.color = '#ffc107';
        el.style.fontWeight = 'bold';
    });
}

// =======================================================
// FUNCIONES AUXILIARES PARA ANIMACIÓN
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