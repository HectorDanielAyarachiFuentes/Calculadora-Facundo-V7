// =======================================================
// --- operations/modules/subtraction.js (REFACTORIZADO) ---
// Utiliza helpers comunes para reducir duplicación y mejorar la legibilidad.
// =======================================================
"use strict";

import { crearCelda, crearCeldaAnimada, esperar } from '../utils/dom-helpers.js';
import * as CommonOps from '../utils/common-operations.js';
import { salida } from '../../config.js';

let animationLoopId = null;

async function startBorrowLoopAnimation(elements) {
    if (animationLoopId) clearTimeout(animationLoopId);
    if (elements.length === 0) return;

    const loop = async () => {
        for (const element of elements) {
            if (element.tagName.toLowerCase() === 'svg') {
                const path = element.querySelector('path[d^="M"]');
                if (path) {
                    const length = path.getTotalLength();
                    path.style.transition = 'none';
                    path.style.strokeDashoffset = length;
                    path.offsetHeight;
                    path.style.transition = 'stroke-dashoffset .8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
                    path.style.strokeDashoffset = '0';
                }
            } else {
                element.classList.add('pulse');
                setTimeout(() => element.classList.remove('pulse'), 500);
            }
            await esperar(200);
        }
        animationLoopId = setTimeout(loop, 3000);
    };
    loop();
}

function calculateBorrows(n1Str, n2Str) {
    const borrowChains = [];
    let n1Array = n1Str.split('').map(Number);
    let n2Array = n2Str.split('').map(Number);

    for (let i = n1Array.length - 1; i >= 0; i--) {
        if (n1Array[i] < n2Array[i]) {
            let chain = [];
            let j = i - 1;
            while (j >= 0 && n1Array[j] === 0) { j--; }

            if (j >= 0) {
                chain.push({ index: j, newValue: n1Array[j] - 1 });
                n1Array[j]--;
                for (let k = j + 1; k < i; k++) {
                    chain.push({ index: k, newValue: 9 });
                    n1Array[k] = 9;
                }
                chain.push({ index: i, newValue: n1Array[i] + 10 });
                n1Array[i] += 10;
                borrowChains.push(chain);
            }
        }
    }
    return borrowChains;
}

function crearTachadoAnimado(styles) {
    const line = document.createElement('div');
    line.className = 'output-grid__cross-out';
    Object.assign(line.style, {
        position: 'absolute', backgroundColor: '#e84d4d', height: '2px',
        transform: 'rotate(-25deg)', transformOrigin: 'left center',
        transition: 'width 0.3s ease-out', width: '0px', ...styles
    });
    requestAnimationFrame(() => { line.style.width = styles.width; });
    return line;
}

function formatWithComma(numStr, dec) {
    if (dec === 0) return numStr;
    const padded = numStr.padStart(dec + 1, '0');
    return `${padded.slice(0, -dec)},${padded.slice(-dec)}`;
}

export async function resta(numerosAR) {
    salida.innerHTML = "";
    if (animationLoopId) clearTimeout(animationLoopId);

    // --- 1. Preparar operandos y layout usando helpers ---
    const {
        partesOperandos,
        maxIntLength,
        maxDecLength,
        displayWidth,
        operandosParaCalcular
    } = CommonOps.prepararOperandos(numerosAR);

    const [n1, n2] = operandosParaCalcular;

    const minuendoBigInt = BigInt(n1);
    const sustraendoBigInt = BigInt(n2);

    const isNegative = minuendoBigInt < sustraendoBigInt;
    const n1Anim = isNegative ? n2 : n1; 
    const n2Anim = isNegative ? n1 : n2; 
    const resultadoAbsStr = (isNegative ? sustraendoBigInt - minuendoBigInt : minuendoBigInt - sustraendoBigInt).toString();
    
    // --- 2. Cálculo del Layout ---
    const anchoGridInCeldas = displayWidth + 1; 
    const altoGridInRows = 5; // Altura suficiente para los elementos estáticos y los préstamos.
    const layoutParams = CommonOps.calcularLayout(salida, anchoGridInCeldas, altoGridInRows);
    const { tamCel, tamFuente } = layoutParams;
    
    // --- 3. Dibujo de elementos estáticos ---
    const yPosMinuendo = layoutParams.paddingTop + tamCel;
    
    // Si el resultado es negativo, intercambiamos los operandos para la visualización.
    const operandosDisplay = isNegative ? [partesOperandos[1], partesOperandos[0]] : partesOperandos;
    
    // Dibujar operandos (minuendo y sustraendo)
    const yPosDespuesDeOperandos = CommonOps.dibujarOperandos(salida, operandosDisplay, maxIntLength, maxDecLength, anchoGridInCeldas, layoutParams, yPosMinuendo);

    // Dibujar signo de resta
    const signCol = displayWidth + 1;
    CommonOps.dibujarSignoOperacion(salida, "-", signCol, yPosDespuesDeOperandos, anchoGridInCeldas, layoutParams);
    
    await esperar(500);

    // --- 4. Animación de préstamos ---
    const borrowChains = calculateBorrows(n1Anim, n2Anim);
    const borrowNumberCells = {};

    for (const chain of borrowChains) {
        for (const step of chain) {
            const digitsToRight = n1Anim.length - 1 - step.index;
            const hasCommaToRight = maxDecLength > 0 && digitsToRight >= maxDecLength;
            const visualCellsToRight = digitsToRight + (hasCommaToRight ? 1 : 0);
            const visualCol = anchoGridInCeldas - 1 - visualCellsToRight;

            const xPos = layoutParams.offsetHorizontal + visualCol * tamCel + layoutParams.paddingLeft;
            const yNewNum = yPosMinuendo - tamCel * 0.7;

            if (borrowNumberCells[step.index]) {
                salida.removeChild(borrowNumberCells[step.index]);
            }
            
            salida.appendChild(crearTachadoAnimado({ left: `${xPos}px`, top: `${yPosMinuendo + tamCel / 2}px`, width: `${tamCel}px` }));
            await esperar(300);

            const numStr = step.newValue.toString();
            const widthMultiplier = numStr.length > 1 ? 1.4 : 1;
            const leftOffset = numStr.length > 1 ? -tamCel * 0.2 : 0;
            
            const newNumber = crearCeldaAnimada("output-grid__cell output-grid__cell--resto", numStr, {
                left: `${xPos + leftOffset}px`, top: `${yNewNum}px`, width: `${tamCel * widthMultiplier}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.7}px`
            }, 0);
            newNumber.classList.add('loop-anim-element');
            salida.appendChild(newNumber);
            borrowNumberCells[step.index] = newNumber;
            await esperar(300);
        }
        await esperar(500);
    }
    
    // --- 5. Dibujo de línea y resultado FINAL ---
    const yPosLinea = yPosDespuesDeOperandos;
    CommonOps.dibujarLinea(salida, signCol, yPosLinea, anchoGridInCeldas, layoutParams);
    await esperar(10);

    const yPosResultado = yPosLinea + tamCel * 0.2;
    const resultadoDisplay = formatWithComma(resultadoAbsStr, maxDecLength);
    const resultFontSize = `${tamFuente}px`; 
    
    if (isNegative) {
        const resultSignCol = anchoGridInCeldas - resultadoDisplay.length - 1;
        const resultSignLeft = layoutParams.offsetHorizontal + resultSignCol * tamCel + layoutParams.paddingLeft;
        salida.appendChild(crearCelda("output-grid__cell output-grid__cell--cociente", "-", {
            left: `${resultSignLeft}px`, top: `${yPosResultado}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: resultFontSize
        }));
    }
    
    // Dibujar el resultado final usando el helper
    CommonOps.dibujarResultado(salida, resultadoDisplay, yPosResultado, anchoGridInCeldas, layoutParams);
    
    const elementsToLoop = salida.querySelectorAll('.loop-anim-element');
    startBorrowLoopAnimation(elementsToLoop);
}