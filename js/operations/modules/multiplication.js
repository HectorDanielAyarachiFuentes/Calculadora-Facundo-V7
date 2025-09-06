// =======================================================
// --- operations/modules/multiplication.js (VERSIÓN ADAPTADA PARA COMPATIBILIDAD CON HISTORIAL) ---
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda } from '../utils/dom-helpers.js';
import { salida, errorMessages } from '../../config.js';

function injectMultiplicationStyles() {
    const styleId = 'multiplication-styles';
    if (document.getElementById(styleId)) {
        return;
    }
    const cssStyles = `
        .color-operando { color: #ffab70; }
        .color-signo    { color: #9e9e9e; }
        .color-coma     { color: #f44336; font-weight: bold; }
        .color-resultado{ color: #4caf50; }
        .color-parcial-1 { color: #64b5f6; }
        .color-parcial-2 { color: #ba68c8; }
        .color-parcial-3 { color: #4db6ac; }
    `;
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = cssStyles;
    document.head.appendChild(styleElement);
}

export function multiplica(numerosAR) {
    injectMultiplicationStyles();
    salida.innerHTML = "";
    const fragment = document.createDocumentFragment();

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
    const anchuraEnCeldas = Math.max(num1Display.length, num2Display.length + 2, resultadoDisplay.length, maxPartialProductWidth + (partialProducts.length > 1 ? 1 : 0));
    const alturaEnCeldas = 3 + (partialProducts.length > 1 ? partialProducts.length + 1 : (partialProducts.length === 1 ? 1 : 0));
    
    const alturaReducida = alturaEnCeldas > 3 ? alturaEnCeldas - 1 : alturaEnCeldas;
    
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, anchuraEnCeldas, alturaReducida);
    
    let yPos = paddingTop;

    const dibujarNumero = (numeroStr, y, claseBase, claseDigito) => {
        for (let i = 0; i < numeroStr.length; i++) {
            const char = numeroStr[i];
            const esComa = char === ',';
            const claseColor = esComa ? 'color-coma' : claseDigito;
            const leftPos = offsetHorizontal + (anchuraEnCeldas - numeroStr.length + i - 1) * tamCel + paddingLeft;
            fragment.appendChild(crearCelda(`${claseBase} ${claseColor}`, char, { left: `${leftPos}px`, top: `${y}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
        }
    };

    dibujarNumero(num1Display, yPos, 'output-grid__cell output-grid__cell--operando', 'color-operando');
    yPos += tamCel;

    const signLeft = offsetHorizontal + (anchuraEnCeldas - num2Display.length - 2) * tamCel + paddingLeft;
    fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--signo color-signo", "x", { left: `${signLeft}px`, top: `${yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
    dibujarNumero(num2Display, yPos, 'output-grid__cell output-grid__cell--operando', 'color-operando');
    
    yPos += tamCel;
    const lineWidth1 = Math.max(num1Display.length, num2Display.length + 2) * tamCel;
    const lineLeft1 = offsetHorizontal + (anchuraEnCeldas * tamCel) - lineWidth1 + paddingLeft;
    fragment.appendChild(crearCelda("output-grid__line", "", { left: `${lineLeft1}px`, top: `${yPos}px`, width: `${lineWidth1}px`, height: `2px` }));
    yPos += tamCel * 0.2;
    
    if (partialProducts.length > 1) {
        partialProducts.reverse().forEach(({ product, offset }, index) => {
            const colorClass = coloresParciales[index % coloresParciales.length];
            
            if (index === 1) {
                const signPlusLeft = offsetHorizontal + (anchuraEnCeldas - maxPartialProductWidth - 1) * tamCel + paddingLeft;
                fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--signo color-signo", "+", { left: `${signPlusLeft}px`, top: `${yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
            }
            
            for (let j = 0; j < product.length; j++) {
                const leftPos = offsetHorizontal + (anchuraEnCeldas - product.length - offset + j) * tamCel + paddingLeft;
                fragment.appendChild(crearCelda(`output-grid__cell output-grid__cell--producto-parcial ${colorClass}`, product[j], { left: `${leftPos}px`, top: `${yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
            }

            // --- CORRECCIÓN APLICADA ---
            // La línea se movió aquí, al final del bucle.
            yPos += tamCel; 
        });

        // Se ajusta la posición de la línea final restando el último incremento.
        yPos -= tamCel; 
        yPos += tamCel;
        const lineWidth2 = Math.max(resultadoDisplay.length, maxPartialProductWidth + (partialProducts.length > 1 ? 1 : 0)) * tamCel;
        const lineLeft2 = offsetHorizontal + (anchuraEnCeldas * tamCel) - lineWidth2 + paddingLeft;
        fragment.appendChild(crearCelda("output-grid__line", "", { left: `${lineLeft2}px`, top: `${yPos}px`, width: `${lineWidth2}px`, height: `2px` }));
        yPos += tamCel * 0.2;
    } else if (partialProducts.length === 1 && num2.replace(/0/g, '').length > 0) {
        yPos += tamCel;
    }
    
    dibujarNumero(resultadoDisplay, yPos, 'output-grid__cell output-grid__cell--cociente', 'color-resultado');

    salida.appendChild(fragment);
}