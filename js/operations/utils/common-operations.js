// =======================================================
// --- operations/utils/common-operations.js ---
// Funciones de utilidad compartidas para operaciones matemáticas
// =======================================================
'use strict';

import { calculateLayout } from './layout-calculator.js';
import { crearCelda } from './dom-helpers.js';

/**
 * Prepara los operandos para su visualización, normalizando decimales
 * @param {Array<[string, number]>} numerosAR - Array de tuplas [valor, decimales]
 * @returns {Object} - Objeto con partes enteras, decimales y datos formateados
 */
export function prepararOperandos(numerosAR) {
  // Normalización para alinear decimales
  const partesOperandos = numerosAR.map(([valor, dec]) => {
    const valStr = valor.toString();
    // Un número entero (dec=0) tiene toda su longitud como parte entera
    const intPart = (dec === 0) ? valStr : ((valStr.length > dec) ? valStr.slice(0, valStr.length - dec) : '0');
    const decPart = (dec === 0) ? '' : valStr.slice(valStr.length - dec).padStart(dec, '0');
    return { intPart, decPart };
  });

  const maxIntLength = Math.max(...partesOperandos.map(p => p.intPart.length));
  const maxDecLength = Math.max(...partesOperandos.map(p => p.decPart.length));
  
  // Calcular el ancho total de la pantalla
  const displayWidth = maxIntLength + (maxDecLength > 0 ? 1 + maxDecLength : 0);
  
  // Preparar operandos para cálculos
  const operandosParaCalcular = partesOperandos.map(p =>
    p.intPart.padStart(maxIntLength, '0') + p.decPart.padEnd(maxDecLength, '0')
  );
  
  return {
    partesOperandos,
    maxIntLength,
    maxDecLength,
    displayWidth,
    operandosParaCalcular,
    longitudMaximaTotal: operandosParaCalcular[0].length
  };
}

/**
 * Dibuja los operandos en el elemento de salida
 * @param {HTMLElement} salida - Elemento donde dibujar
 * @param {Array} partesOperandos - Array con las partes de los operandos
 * @param {number} maxIntLength - Longitud máxima de la parte entera
 * @param {number} maxDecLength - Longitud máxima de la parte decimal
 * @param {number} anchoGridEnCeldas - Ancho de la cuadrícula en celdas
 * @param {Object} layoutParams - Parámetros de layout (tamCel, tamFuente, etc.)
 * @param {number} yPosInicial - Posición Y inicial
 * @returns {number} - Nueva posición Y después de dibujar
 */
export function dibujarOperandos(salida, partesOperandos, maxIntLength, maxDecLength, anchoGridEnCeldas, layoutParams, yPosInicial) {
  const { tamCel, tamFuente, offsetHorizontal, paddingLeft } = layoutParams;
  const fragment = document.createDocumentFragment();
  let yPos = yPosInicial;
  
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
      const cellClass = (char === ',') ? 'output-grid__cell--producto' : 'output-grid__cell--dividendo';
      fragment.appendChild(crearCelda(`output-grid__cell ${cellClass}`, char, { 
        left: `${cellLeft}px`, 
        top: `${yPos}px`, 
        width: `${tamCel}px`, 
        height: `${tamCel}px`, 
        fontSize: `${tamFuente}px` 
      }));
    }
    yPos += tamCel;
  });
  
  salida.appendChild(fragment);
  return yPos;
}

/**
 * Dibuja un signo de operación (como +, -, x, ÷)
 * @param {HTMLElement} salida - Elemento donde dibujar
 * @param {string} signo - Signo a dibujar
 * @param {number} col - Columna donde dibujar
 * @param {number} yPos - Posición Y donde dibujar
 * @param {number} anchoGridEnCeldas - Ancho de la cuadrícula en celdas
 * @param {Object} layoutParams - Parámetros de layout
 */
export function dibujarSignoOperacion(salida, signo, col, yPos, anchoGridEnCeldas, layoutParams) {
  const { tamCel, tamFuente, offsetHorizontal, paddingLeft } = layoutParams;
  const signCol = anchoGridEnCeldas - col;
  const signLeft = offsetHorizontal + signCol * tamCel + paddingLeft;
  const signTop = yPos - tamCel;
  
  const signoElement = crearCelda('output-grid__cell output-grid__cell--producto', signo, { 
    left: `${signLeft}px`, 
    top: `${signTop}px`, 
    width: `${tamCel}px`, 
    height: `${tamCel}px`, 
    fontSize: `${tamFuente}px`, 
    textAlign: 'center' 
  });
  
  salida.appendChild(signoElement);
}

/**
 * Dibuja una línea horizontal (como la línea de suma o división)
 * @param {HTMLElement} salida - Elemento donde dibujar
 * @param {number} col - Columna donde comienza la línea
 * @param {number} yPos - Posición Y donde dibujar
 * @param {number} anchoGridEnCeldas - Ancho de la cuadrícula en celdas
 * @param {Object} layoutParams - Parámetros de layout
 */
export function dibujarLinea(salida, col, yPos, anchoGridEnCeldas, layoutParams) {
  const { tamCel, offsetHorizontal, paddingLeft } = layoutParams;
  const signCol = anchoGridEnCeldas - col;
  const lineLeft = offsetHorizontal + signCol * tamCel + paddingLeft;
  const lineWidth = (anchoGridEnCeldas - signCol) * tamCel;
  
  const lineaElement = crearCelda('output-grid__line', '', { 
    left: `${lineLeft}px`, 
    top: `${yPos}px`, 
    width: `${lineWidth}px`, 
    height: '2px' 
  });
  
  salida.appendChild(lineaElement);
}

/**
 * Dibuja el resultado de una operación
 * @param {HTMLElement} salida - Elemento donde dibujar
 * @param {string} resultado - Resultado a dibujar
 * @param {number} yPos - Posición Y donde dibujar
 * @param {number} anchoGridEnCeldas - Ancho de la cuadrícula en celdas
 * @param {Object} layoutParams - Parámetros de layout
 */
export function dibujarResultado(salida, resultado, yPos, anchoGridEnCeldas, layoutParams) {
  const { tamCel, tamFuente, offsetHorizontal, paddingLeft } = layoutParams;
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < resultado.length; i++) {
    const char = resultado[resultado.length - 1 - i];
    const col = anchoGridEnCeldas - 1 - i;
    const cellLeft = offsetHorizontal + col * tamCel + paddingLeft;
    const cellClass = (char === ',') ? 'output-grid__cell--producto' : 'output-grid__cell--cociente';
    
    fragment.appendChild(crearCelda(`output-grid__cell ${cellClass}`, char, { 
      left: `${cellLeft}px`, 
      top: `${yPos}px`, 
      width: `${tamCel}px`, 
      height: `${tamCel}px`, 
      fontSize: `${tamFuente}px` 
    }));
  }
  
  salida.appendChild(fragment);
}

/**
 * Calcula el layout para una operación
 * @param {HTMLElement} salida - Elemento donde se dibujará
 * @param {number} anchoGridEnCeldas - Ancho de la cuadrícula en celdas
 * @param {number} altoGridEnCeldas - Alto de la cuadrícula en celdas
 * @returns {Object} - Parámetros de layout calculados
 */
export function calcularLayout(salida, anchoGridEnCeldas, altoGridEnCeldas) {
  return calculateLayout(salida, anchoGridEnCeldas, altoGridEnCeldas);
}