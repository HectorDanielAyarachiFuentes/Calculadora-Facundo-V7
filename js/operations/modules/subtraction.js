// =======================================================
// --- operations/modules/subtraction.js (VERSIÓN CON CORRECCIÓN FINAL DE DIBUJO) ---
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda, crearCeldaAnimada, esperar, crearFlechaLlevada } from '../utils/dom-helpers.js';
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
    const fragment = document.createDocumentFragment();
    if (animationLoopId) clearTimeout(animationLoopId);

    // --- 1. Normalización de operandos ---
    const [minuendoStrRaw, minuendoDec] = numerosAR[0];
    const [sustraendoStrRaw, sustraendoDec] = numerosAR[1];
    
    const maxDec = Math.max(minuendoDec, sustraendoDec);

    const minuendoPadded = minuendoStrRaw.padEnd(minuendoStrRaw.length + maxDec - minuendoDec, '0');
    const sustraendoPadded = sustraendoStrRaw.padEnd(sustraendoStrRaw.length + maxDec - sustraendoDec, '0');

    const maxLen = Math.max(minuendoPadded.length, sustraendoPadded.length);

    const n1 = minuendoPadded.padStart(maxLen, '0');
    const n2 = sustraendoPadded.padStart(maxLen, '0');

    const minuendoBigInt = BigInt(n1);
    const sustraendoBigInt = BigInt(n2);

    const isNegative = minuendoBigInt < sustraendoBigInt;
    const n1Anim = isNegative ? n2 : n1; 
    const n2Anim = isNegative ? n1 : n2; 
    const resultadoAbsStr = (isNegative ? sustraendoBigInt - minuendoBigInt : minuendoBigInt - sustraendoBigInt).toString();
    
    // --- 2. Cálculo del Layout ---
    const n1Display = formatWithComma(n1Anim, maxDec);
    const n2Display = formatWithComma(n2Anim, maxDec);
    const maxDisplayLength = Math.max(n1Display.length, n2Display.length);
    
    const anchoGridInCeldas = maxDisplayLength + 1; 
    const altoGridInRows = 5;
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, anchoGridInCeldas, altoGridInRows);
    
    // --- 3. Dibujo de elementos estáticos ---
    const yPosMinuendo = paddingTop + tamCel;
    const yPosSustraendo = yPosMinuendo + tamCel;

    for (let i = 0; i < n1Display.length; i++) {
        const char = n1Display[n1Display.length - 1 - i];
        const col = anchoGridInCeldas - 1 - i;
        const leftPos = offsetHorizontal + col * tamCel + paddingLeft;
        const cellClass = char === ',' ? 'output-grid__cell--producto' : 'output-grid__cell--dividendo';
        fragment.appendChild(crearCelda(cellClass, char, { left: `${leftPos}px`, top: `${yPosMinuendo}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: tamFuente + 'px' }));
    }
    
    const signCol = anchoGridInCeldas - maxDisplayLength - 1;
    const signLeft = offsetHorizontal + signCol * tamCel + paddingLeft;
    fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--producto", "-", { left: `${signLeft}px`, top: `${yPosSustraendo}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: tamFuente + 'px' }));
    
    for (let i = 0; i < n2Display.length; i++) {
        const char = n2Display[n2Display.length - 1 - i];
        const col = anchoGridInCeldas - 1 - i;
        const leftPos = offsetHorizontal + col * tamCel + paddingLeft;
        const cellClass = char === ',' ? 'output-grid__cell--producto' : 'output-grid__cell--dividendo';
        fragment.appendChild(crearCelda(cellClass, char, { left: `${leftPos}px`, top: `${yPosSustraendo}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: tamFuente + 'px' }));
    }
    salida.appendChild(fragment);
    await esperar(500);

    // --- 4. Animación de préstamos ---
    const borrowChains = calculateBorrows(n1Anim, n2Anim);
    const borrowNumberCells = {};

    for (const chain of borrowChains) {
        for (const step of chain) {
            const digitsToRight = n1Anim.length - 1 - step.index;
            const hasCommaToRight = maxDec > 0 && digitsToRight >= maxDec;
            const visualCellsToRight = digitsToRight + (hasCommaToRight ? 1 : 0);
            const visualCol = anchoGridInCeldas - 1 - visualCellsToRight;

            const xPos = offsetHorizontal + visualCol * tamCel + paddingLeft;
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
    const yPosLinea = yPosSustraendo + tamCel;
    const lineLeft = offsetHorizontal + signCol * tamCel + paddingLeft;
    const totalBlockWidth = (anchoGridInCeldas - signCol) * tamCel;
    const linea = crearCelda("output-grid__line", "", { left: `${lineLeft}px`, top: `${yPosLinea}px`, width: `${totalBlockWidth}px`, height: `2px`});
    salida.appendChild(linea);
    await esperar(10); // Pequeña espera para asegurar que la línea se renderiza

    const yPosResultado = yPosLinea + tamCel * 0.2;
    const resultadoDisplay = formatWithComma(resultadoAbsStr, maxDec);
    // === CORRECCIÓN CLAVE: Usar la fuente estándar (tamFuente), sin escalar a 0.9 ===
    const resultFontSize = `${tamFuente}px`; 
    
    if (isNegative) {
        const resultSignCol = anchoGridInCeldas - resultadoDisplay.length - 1;
        const resultSignLeft = offsetHorizontal + resultSignCol * tamCel + paddingLeft;
        // Usar crearCelda normal (sin animación) y la fuente estándar para consistencia
        salida.appendChild(crearCelda("output-grid__cell output-grid__cell--cociente", "-", {
            left: `${resultSignLeft}px`, top: `${yPosResultado}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: resultFontSize
        }));
    }
    
    for (let i = 0; i < resultadoDisplay.length; i++) {
        const char = resultadoDisplay[resultadoDisplay.length - 1 - i];
        const col = anchoGridInCeldas - 1 - i;
        const leftPos = offsetHorizontal + col * tamCel + paddingLeft;
        const cellClass = char === ',' ? 'output-grid__cell--producto' : 'output-grid__cell--cociente';
        // Usar crearCelda normal (sin animación) y la fuente estándar
        salida.appendChild(crearCelda(cellClass, char, {
            left: `${leftPos}px`, top: `${yPosResultado}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: resultFontSize
        }));
    }
    
    const elementsToLoop = salida.querySelectorAll('.loop-anim-element');
    startBorrowLoopAnimation(elementsToLoop);
}