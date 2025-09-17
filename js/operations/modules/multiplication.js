// =======================================================
// --- operations/modules/multiplication.js (VERSIÓN ADAPTADA PARA COMPATIBILIDAD CON HISTORIAL) ---
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda, crearCeldaAnimada, esperar } from '../utils/dom-helpers.js';
import { salida, errorMessages } from '../../config.js';

export async function multiplica(numerosAR) {
    salida.innerHTML = "";

    const coloresParciales = ['color-parcial-1', 'color-parcial-2', 'color-parcial-3'];

    const [num1, numDec1] = numerosAR[0];
    const [num2, numDec2] = numerosAR[1];

    if (num1 === "0" || num2 === "0") {
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.multiplicacion1}</p>`;
        return;
    }
    const resultadoS = (BigInt(num1) * BigInt(num2)).toString();
    if (resultadoS.length > 20) {
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.multiplicacion2}</p>`;
        return;
    }
    
    const totalDecimalesResultado = numDec1 + numDec2;
    let num1Display = num1; if (numDec1 > 0) num1Display = num1.slice(0, -numDec1) + ',' + num1.slice(-numDec1);
    let num2Display = num2; if (numDec2 > 0) num2Display = num2.slice(0, -numDec2) + ',' + num2.slice(-numDec2);
    
    let resultadoDisplay = resultadoS;
    if (totalDecimalesResultado > 0) {
        let padding = '0'.repeat(Math.max(0, totalDecimalesResultado - resultadoDisplay.length + 1));
        resultadoDisplay = padding + resultadoDisplay;
        resultadoDisplay = resultadoDisplay.slice(0, -totalDecimalesResultado) + ',' + resultadoDisplay.slice(-totalDecimalesResultado);
    }
    if (resultadoDisplay.startsWith(',')) resultadoDisplay = '0' + resultadoDisplay;
    if (resultadoDisplay.endsWith(',')) resultadoDisplay = resultadoDisplay.slice(0, -1);

    const partialProducts = [...num2].map((digit, index) => {
        const product = (BigInt(num1) * BigInt(digit)).toString();
        const offset = num2.length - 1 - index;
        return { product, offset, digit };
    }).filter(p => p.digit !== '0');
    
    if (num2.replace(/0/g, '').length === 0) partialProducts.push({product: '0', offset:0, digit:'0'});

    const maxPartialProductWidth = partialProducts.reduce((max, p) => Math.max(max, p.product.length + p.offset), 0);
    
    // --- MEJORA: Cálculo de dimensiones más robusto y claro ---
    const rightPadding = 1;
    const signPadding = 1; 
    const num2BlockWidth = num2Display.length + signPadding + 1; // +1 para el signo 'x'
    const partialsBlockWidth = (partialProducts.length > 1) ? maxPartialProductWidth + signPadding + 1 : maxPartialProductWidth;

    const anchuraEnCeldas = Math.max(num1Display.length, num2BlockWidth, resultadoDisplay.length, partialsBlockWidth) + rightPadding;
    
    const numPartials = partialProducts.length;
    const numRowsForPartials = (numPartials > 1) ? numPartials + 1 : 0; // N parciales + 1 línea
    const alturaEnCeldas = 2 + 1 + numRowsForPartials + 1; // 2 operandos, 1 línea, bloque de parciales, 1 resultado
    
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, anchuraEnCeldas, alturaEnCeldas);
    
    let yPos = paddingTop;

    // MEJORA: Función de dibujo unificada y corregida para alinear a la derecha del grid.
    const dibujarNumero = (fragment, numeroStr, y, claseBase, claseDigito, animado = false) => {
        const startCol = anchuraEnCeldas - rightPadding - numeroStr.length;
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
    };

    // --- DIBUJO DE ELEMENTOS ---
    const fragmentOperandos = document.createDocumentFragment();
    dibujarNumero(fragmentOperandos, num1Display, yPos, 'output-grid__cell output-grid__cell--operando', 'color-operando');
    yPos += tamCel;

    const signXCol = anchuraEnCeldas - rightPadding - num2Display.length - signPadding - 1;
    const signXLeft = offsetHorizontal + signXCol * tamCel + paddingLeft;
    fragmentOperandos.appendChild(crearCelda("output-grid__cell output-grid__cell--signo color-signo", "x", { left: `${signXLeft}px`, top: `${yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
    dibujarNumero(fragmentOperandos, num2Display, yPos, 'output-grid__cell output-grid__cell--operando', 'color-operando');
    salida.appendChild(fragmentOperandos);
    await esperar(800);
    
    yPos += tamCel;
    const line1Width = Math.max(num1Display.length, num2BlockWidth) * tamCel;
    const lineLeft1 = offsetHorizontal + (anchuraEnCeldas - rightPadding) * tamCel - line1Width + paddingLeft;
    salida.appendChild(crearCelda("output-grid__line", "", { left: `${lineLeft1}px`, top: `${yPos}px`, width: `${line1Width}px`, height: `2px` }));
    yPos += tamCel * 0.2;
    await esperar(500);
    
    if (partialProducts.length > 1) {
        for (const [index, { product, offset }] of partialProducts.reverse().entries()) {
            const fragmentParcial = document.createDocumentFragment();
            const colorClass = coloresParciales[index % coloresParciales.length];
            // --- CORRECCIÓN: Mostrar el signo '+' solo una vez y en la posición correcta ---
            if (index === 1) { // Mostrar '+' solo junto al segundo producto parcial para indicar la suma.
                const signPlusCol = anchuraEnCeldas - rightPadding - maxPartialProductWidth - signPadding - 1;
                const signPlusLeft = offsetHorizontal + signPlusCol * tamCel + paddingLeft;
                fragmentParcial.appendChild(crearCeldaAnimada("output-grid__cell output-grid__cell--signo color-signo", "+", { left: `${signPlusLeft}px`, top: `${yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
            }
            
            const startCol = anchuraEnCeldas - rightPadding - product.length - offset;
            for (let j = 0; j < product.length; j++) {
                const leftPos = offsetHorizontal + (startCol + j) * tamCel + paddingLeft;
                fragmentParcial.appendChild(crearCeldaAnimada(`output-grid__cell output-grid__cell--producto-parcial ${colorClass}`, product[j], { left: `${leftPos}px`, top: `${yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }, j * 50));
            }
            salida.appendChild(fragmentParcial);
            yPos += tamCel; 
            await esperar(1200);
        }

        const line2Width = Math.max(resultadoDisplay.length, partialsBlockWidth) * tamCel;
        const lineLeft2 = offsetHorizontal + (anchuraEnCeldas - rightPadding) * tamCel - line2Width + paddingLeft;
        salida.appendChild(crearCelda("output-grid__line", "", { left: `${lineLeft2}px`, top: `${yPos}px`, width: `${line2Width}px`, height: `2px` }));
        yPos += tamCel * 0.2;
        await esperar(500);
    } else if (partialProducts.length === 1 && num2.replace(/0/g, '').length > 0) {
        yPos += tamCel;
    }
    
    const fragmentResultado = document.createDocumentFragment();
    dibujarNumero(fragmentResultado, resultadoDisplay, yPos, 'output-grid__cell output-grid__cell--cociente', 'color-resultado', true);
    salida.appendChild(fragmentResultado);
}