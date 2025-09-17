// =======================================================
// --- operations/modules/addition.js (REFACTORIZADO) ---
// Utiliza helpers comunes para reducir duplicación y mejorar la legibilidad.
// =======================================================
"use strict";

import { crearCelda, crearFlechaLlevada, esperar } from '../utils/dom-helpers.js';
import * as CommonOps from '../utils/common-operations.js';
import { salida } from '../../config.js';

export async function suma(numerosAR) {
    salida.innerHTML = "";

    // --- 1. Preparar operandos y layout usando helpers ---
    const {
        partesOperandos,
        maxIntLength,
        maxDecLength,
        displayWidth,
        operandosParaCalcular,
        longitudMaximaTotal
    } = CommonOps.prepararOperandos(numerosAR);

    const anchoGridEnCeldas = displayWidth + 1;
    const altoGridEnCeldas = numerosAR.length + 4;
    const layoutParams = CommonOps.calcularLayout(salida, anchoGridEnCeldas, altoGridEnCeldas);

    // --- 2. CÁLCULO ---
    let total = 0n;
    operandosParaCalcular.forEach(n => total += BigInt(n));
    let resultadoRaw = total.toString();
    
    // --- 3. DIBUJO DE ELEMENTOS ESTÁTICOS usando helpers ---
    let yPos = layoutParams.paddingTop + 2.5 * layoutParams.tamCel;

    // Dibujar operandos
    yPos = CommonOps.dibujarOperandos(salida, partesOperandos, maxIntLength, maxDecLength, anchoGridEnCeldas, layoutParams, yPos);
    
    // Dibujar signo y línea
    const signAndLineCol = displayWidth + 1;
    CommonOps.dibujarSignoOperacion(salida, "+", signAndLineCol, yPos, anchoGridEnCeldas, layoutParams);
    CommonOps.dibujarLinea(salida, signAndLineCol, yPos, anchoGridEnCeldas, layoutParams);

    // --- 4. LÓGICA DE VISUALIZACIÓN INTERACTIVA (SUMAS Y LLEVADAS) ---
    // (Esta parte es específica de la suma y se mantiene)
    let carry = 0;
    const topPosSumaIntermedia = layoutParams.paddingTop + 0.1 * layoutParams.tamCel;
    const topPosLlevada = layoutParams.paddingTop + 1.1 * layoutParams.tamCel;
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

        const xPosColumna = layoutParams.offsetHorizontal + visualCol * layoutParams.tamCel + layoutParams.paddingLeft;

        const centroDeColumna = xPosColumna + (layoutParams.tamCel / 2);
        const anchoCeldaTemp = layoutParams.tamCel * sumaStr.length * 0.7;
        const leftPosTemp = centroDeColumna - (anchoCeldaTemp / 2);
        const celdaTemp = crearCelda("output-grid__cell output-grid__cell--suma-intermedia", sumaStr, { left: `${leftPosTemp}px`, top: `${topPosSumaIntermedia}px`, width: `${anchoCeldaTemp}px`, height: `${layoutParams.tamCel}px`, fontSize: `${layoutParams.tamFuente * 0.8}px` });
        salida.appendChild(celdaTemp);
        await esperar(1500);
        celdaTemp.remove();
        sumasIntermediasData.push({ value: sumaStr, x: leftPosTemp, width: anchoCeldaTemp });

        if (newCarry > 0) {
            const carryDigitsToRight = digitsToTheRight + 1;
            const carryHasCommaToRight = maxDecLength > 0 && carryDigitsToRight >= maxDecLength;
            const carryVisualCellsToRight = carryDigitsToRight + (carryHasCommaToRight ? 1 : 0);
            const carryVisualCol = anchoGridEnCeldas - 1 - carryVisualCellsToRight;

            const leftBase = layoutParams.offsetHorizontal + carryVisualCol * layoutParams.tamCel + layoutParams.paddingLeft;
            const numeroLlevada = crearCelda("output-grid__cell output-grid__cell--resto", newCarry.toString(), { left: `${leftBase}px`, top: `${topPosLlevada}px`, width: `${layoutParams.tamCel}px`, height: `${layoutParams.tamCel}px`, fontSize: `${layoutParams.tamFuente * 0.7}px`, textAlign: 'center' });
            const topFlecha = topPosLlevada + layoutParams.tamCel * 0.8;
            const altoFlecha = (layoutParams.paddingTop + 2.5 * layoutParams.tamCel) - topFlecha;
            const anchoFlecha = layoutParams.tamCel * 0.8;
            const leftFlecha = leftBase + (layoutParams.tamCel * 1 - anchoFlecha);
            const flecha = crearFlechaLlevada(leftFlecha, topFlecha, anchoFlecha, altoFlecha);
            salida.appendChild(numeroLlevada);
            salida.appendChild(flecha);
        }
        carry = newCarry;
        await esperar(500);
    }
    
    // --- 5. DIBUJO DEL RESULTADO FINAL usando helper ---
    let resultadoDisplay = resultadoRaw;
    if (maxDecLength > 0) {
        let resPadded = resultadoRaw.padStart(maxDecLength + 1, '0');
        resultadoDisplay = resPadded.slice(0, resPadded.length - maxDecLength) + ',' + resPadded.slice(resPadded.length - maxDecLength);
    }
    
    const yPosResultado = yPos + layoutParams.tamCel * 0.2;
    CommonOps.dibujarResultado(salida, resultadoDisplay, yPosResultado, anchoGridEnCeldas, layoutParams);

    // --- 6. VISTA FINAL ESTÁTICA --- (Esta parte es específica de la suma y se mantiene)
    await esperar(100);
    sumasIntermediasData.forEach(data => {
        const celdaFinal = crearCelda("output-grid__cell output-grid__cell--suma-intermedia", data.value, { left: `${data.x}px`, top: `${topPosSumaIntermedia}px`, width: `${data.width}px`, height: `${layoutParams.tamCel}px`, fontSize: `${layoutParams.tamFuente * 0.8}px` });
        celdaFinal.style.opacity = '0';
        salida.appendChild(celdaFinal);
        setTimeout(() => {
            celdaFinal.style.transition = 'opacity 0.5s ease-in';
            celdaFinal.style.opacity = '1';
        }, 100);
    });
}