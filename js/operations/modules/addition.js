// =======================================================
// --- operations/modules/addition.js (VERSIÓN CON ALINEACIÓN CORREGIDA) ---
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda, crearFlechaLlevada, esperar } from '../utils/dom-helpers.js';
import { salida } from '../../config.js';

export async function suma(numerosAR) {
    salida.innerHTML = "";

    // --- 1. Normalización para alinear decimales ---
    const partesOperandos = numerosAR.map(([valor, dec]) => {
        const valStr = valor.toString();
        // Un número entero (dec=0) tiene toda su longitud como parte entera.
        const intPart = (dec === 0) ? valStr : ((valStr.length > dec) ? valStr.slice(0, valStr.length - dec) : '0');
        const decPart = (dec === 0) ? '' : valStr.slice(valStr.length - dec).padStart(dec, '0');
        return { intPart, decPart };
    });

    const maxIntLength = Math.max(...partesOperandos.map(p => p.intPart.length));
    const maxDecLength = Math.max(...partesOperandos.map(p => p.decPart.length));
    
    // <-- CORRECCIÓN 1: Calcular el ancho total de la pantalla de forma robusta.
    const displayWidth = maxIntLength + (maxDecLength > 0 ? 1 + maxDecLength : 0);
    // El ancho de la cuadrícula es el del número más largo + 1 para el signo de suma
    const anchoGridEnCeldas = displayWidth + 1;
    const altoGridEnCeldas = numerosAR.length + 4;

    const operandosParaCalcular = partesOperandos.map(p =>
        p.intPart.padStart(maxIntLength, '0') + p.decPart.padEnd(maxDecLength, '0')
    );
    const longitudMaximaTotal = operandosParaCalcular[0].length;

    // --- 2. CÁLCULOS Y LAYOUT ---
    let total = 0n;
    operandosParaCalcular.forEach(n => total += BigInt(n));
    let resultadoRaw = total.toString();
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, anchoGridEnCeldas, altoGridEnCeldas);
    
    // --- 3. DIBUJO DE ELEMENTOS ESTÁTICOS ---
    const fragmentEstatico = document.createDocumentFragment();
    let yPos = paddingTop + 2.5 * tamCel; 

    // <-- CORRECCIÓN 2: Dibujar operandos usando una plantilla común para alinear la coma.
    partesOperandos.forEach((p) => {
        // Rellenamos las partes con espacios para que todas tengan el mismo ancho
        const intPadded = p.intPart.padStart(maxIntLength, ' ');
        const decPadded = p.decPart.padEnd(maxDecLength, ' ');

        let displayStr;
        if (maxDecLength > 0) {
            displayStr = `${intPadded},${decPadded}`;
        } else {
            displayStr = intPadded;
        }
        
        for (let i = 0; i < displayStr.length; i++) {
            const char = displayStr[displayStr.length - 1 - i];
            
            // No dibujamos los espacios de relleno
            if (char === ' ') continue;

            const col = anchoGridEnCeldas - 1 - i;
            const cellLeft = offsetHorizontal + col * tamCel + paddingLeft;
            const cellClass = (char === ',') ? "output-grid__cell--producto" : "output-grid__cell--dividendo";
            fragmentEstatico.appendChild(crearCelda(`output-grid__cell ${cellClass}`, char, { left: `${cellLeft}px`, top: `${yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
        }
        yPos += tamCel;
    });

    // Dibujar el signo de suma (+) en la columna correcta
    const signCol = anchoGridEnCeldas - displayWidth - 1; // <-- CORRECCIÓN 3: Usar el ancho calculado
    const signLeft = offsetHorizontal + signCol * tamCel + paddingLeft;
    const signTop = yPos - tamCel;
    fragmentEstatico.appendChild(crearCelda("output-grid__cell output-grid__cell--producto", "+", { left: `${signLeft}px`, top: `${signTop}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, textAlign: 'center' }));
    
    // Dibujar línea de suma
    const lineLeft = offsetHorizontal + signCol * tamCel + paddingLeft;
    const lineWidth = (anchoGridEnCeldas - signCol) * tamCel;
    fragmentEstatico.appendChild(crearCelda("output-grid__line", "", { left: `${lineLeft}px`, top: `${yPos}px`, width: `${lineWidth}px`, height: `2px` }));
    salida.appendChild(fragmentEstatico);

    // --- 4. LÓGICA DE VISUALIZACIÓN INTERACTIVA (SUMAS Y LLEVADAS) ---
    let carry = 0;
    const topPosSumaIntermedia = paddingTop + 0.1 * tamCel;
    const topPosLlevada = paddingTop + 1.1 * tamCel;
    const sumasIntermediasData = [];
    
    for (let i = longitudMaximaTotal - 1; i >= 0; i--) {
        let sumaColumna = carry;
        operandosParaCalcular.forEach(n => sumaColumna += parseInt(n[i] || '0'));
        
        const sumaStr = sumaColumna.toString();
        const newCarry = Math.floor(sumaColumna / 10);
        
        const digitsToTheRight = (longitudMaximaTotal - 1) - i;
        const hasCommaToTheRight = maxDecLength > 0 && digitsToTheRight >= maxDecLength;
        const visualCellsToTheRight = digitsToTheRight + (hasCommaToTheRight ? 1 : 0);
        const visualCol = anchoGridEnCeldas - 1 - visualCellsToTheRight;

        const xPosColumna = offsetHorizontal + visualCol * tamCel + paddingLeft;
        
        const centroDeColumna = xPosColumna + (tamCel / 2);
        const anchoCeldaTemp = tamCel * sumaStr.length * 0.7;
        const leftPosTemp = centroDeColumna - (anchoCeldaTemp / 2);
        const celdaTemp = crearCelda("output-grid__cell output-grid__cell--suma-intermedia", sumaStr, { left: `${leftPosTemp}px`, top: `${topPosSumaIntermedia}px`, width: `${anchoCeldaTemp}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.8}px` });
        salida.appendChild(celdaTemp);
        await esperar(1500);
        celdaTemp.remove();
        sumasIntermediasData.push({ value: sumaStr, x: leftPosTemp, width: anchoCeldaTemp });

        if (newCarry > 0) {
            const carryDigitsToRight = digitsToTheRight + 1;
            const carryHasCommaToRight = maxDecLength > 0 && carryDigitsToRight >= maxDecLength;
            const carryVisualCellsToRight = carryDigitsToRight + (carryHasCommaToRight ? 1 : 0);
            const carryVisualCol = anchoGridEnCeldas - 1 - carryVisualCellsToRight;
            
            const leftBase = offsetHorizontal + carryVisualCol * tamCel + paddingLeft;
            const numeroLlevada = crearCelda("output-grid__cell output-grid__cell--resto", newCarry.toString(), { left: `${leftBase}px`, top: `${topPosLlevada}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.7}px`, textAlign: 'center' });
            const topFlecha = topPosLlevada + tamCel * 0.8;
            const altoFlecha = (paddingTop + 2.5 * tamCel) - topFlecha; 
            const anchoFlecha = tamCel * 0.8;
            const leftFlecha = leftBase + (tamCel * 1 - anchoFlecha); 
            const flecha = crearFlechaLlevada(leftFlecha, topFlecha, anchoFlecha, altoFlecha);
            salida.appendChild(numeroLlevada);
            salida.appendChild(flecha);
        }
        carry = newCarry;
        await esperar(500);
    }
    
    // --- 5. DIBUJO DEL RESULTADO FINAL ---
    let resultadoDisplay = resultadoRaw;
    if (maxDecLength > 0) {
        let resPadded = resultadoRaw.padStart(maxDecLength + 1, '0');
        resultadoDisplay = resPadded.slice(0, resPadded.length - maxDecLength) + ',' + resPadded.slice(resPadded.length - maxDecLength);
    }
    
    const yPosResultado = yPos + tamCel * 0.2;
    for (let i = 0; i < resultadoDisplay.length; i++) {
        const char = resultadoDisplay[resultadoDisplay.length - 1 - i];
        const col = anchoGridEnCeldas - 1 - i;
        const cellLeft = offsetHorizontal + col * tamCel + paddingLeft;
        const cellClass = (char === ',') ? "output-grid__cell--producto" : "output-grid__cell--cociente";
        salida.appendChild(crearCelda(`output-grid__cell ${cellClass}`, char, { left: `${cellLeft}px`, top: `${yPosResultado}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
    }

    // --- 6. VISTA FINAL ESTÁTICA ---
    await esperar(100);
    sumasIntermediasData.forEach(data => {
        const celdaFinal = crearCelda("output-grid__cell output-grid__cell--suma-intermedia", data.value, { left: `${data.x}px`, top: `${topPosSumaIntermedia}px`, width: `${data.width}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.8}px` });
        celdaFinal.style.opacity = '0';
        salida.appendChild(celdaFinal);
        setTimeout(() => {
            celdaFinal.style.transition = 'opacity 0.5s ease-in';
            celdaFinal.style.opacity = '1';
        }, 100);
    });
}