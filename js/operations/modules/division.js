// =======================================================
// --- operations/modules/division.js (VERSIÓN OPTIMIZADA Y MEJORADA) ---
// Contiene la lógica y la visualización para la operación de división.
// `divide`: Muestra el proceso completo de la división larga (extendida) con decimales configurables.
// `divideExt`: Muestra el layout clásico de la división finalizada (usual).
// Mejoras: Mejor organización del código, JSDoc completo, configuración de decimales, visualización mejorada.
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda } from '../utils/dom-helpers.js';
import { salida, errorMessages } from '../../config.js';

// Configuración
const DECIMAL_PLACES = 2; // Número de decimales a calcular en la división extendida

/**
 * Función de cálculo que genera un array de todos los elementos a dibujar
 * para la división paso a paso (modo extendido), incluyendo 2 decimales.
 * Retorna productos y restos para cada paso.
 * @param {string} dividendoStr
 * @param {string} divisorStr
 * @param {number} [decimalPlaces=2] - Número de lugares decimales a calcular.
 * @returns {{cociente: string, displaySteps: Array<object>, totalRows: number}}
 */
function calculateDisplaySteps(dividendoStr, divisorStr, decimalPlaces = 2) {
    const divisor = BigInt(divisorStr);
    
    const displaySteps = [];
    let currentRow = 0; // Fila visual

    // 1. Añadir el dividendo inicial
    displaySteps.push({ 
        text: dividendoStr, 
        row: currentRow, 
        colEnd: dividendoStr.length, 
        type: 'dividendo' 
    });
    currentRow++;

    let restoActual = 0n; // El número actual que estamos tratando de dividir
    let posicionEnDividendo = 0; // Índice exclusivo del último dígito del dividendo usado/considerado
    let cocienteCompleto = "";
    let isDecimalPart = false;
    let decimalDigitsCalculated = 0;

    // Caso especial: si el dividendo es menor que el divisor
    if (BigInt(dividendoStr) < divisor) {
        // El cociente es 0. Calculamos los decimales.
        cocienteCompleto = "0.";
        let currentResto = BigInt(dividendoStr);

        for (let i = 0; i < decimalPlaces; i++) {
            currentResto = currentResto * 10n;
            const digitoCociente = currentResto / divisor;
            cocienteCompleto += digitoCociente.toString();
            const producto = digitoCociente * divisor;
            currentResto = currentResto - producto;
            
            // Añadir el producto a restar (para la parte decimal)
            // La colEnd se ajusta para reflejar la posición del decimal.
            displaySteps.push({ 
                text: producto.toString(), 
                row: currentRow, 
                colEnd: dividendoStr.length + 1 + i, // Posición después del dividendo, +1 por el punto
                type: 'producto' 
            });
            currentRow++;

            // Añadir el resto del paso actual
            displaySteps.push({ 
                text: currentResto.toString(), 
                row: currentRow, 
                colEnd: dividendoStr.length + 1 + i, // Posición después del dividendo, +1 por el punto
                type: 'resto' 
            });
            currentRow++;

            if (currentResto === 0n) break; // Si el resto es cero, terminamos
        }
        
        return { 
            cociente: cocienteCompleto, 
            displaySteps, 
            totalRows: currentRow 
        };
    }

    // Parte entera de la división
    while (posicionEnDividendo < dividendoStr.length || (restoActual > 0n && decimalDigitsCalculated < decimalPlaces)) {
        let currentDigit = null;

        if (posicionEnDividendo < dividendoStr.length) {
            // Bajando dígitos de la parte entera
            restoActual = restoActual * 10n + BigInt(dividendoStr[posicionEnDividendo]);
            posicionEnDividendo++;
        } else if (restoActual > 0n && decimalDigitsCalculated < decimalPlaces) {
            // Bajando ceros para la parte decimal
            if (!isDecimalPart) {
                cocienteCompleto += ".";
                isDecimalPart = true;
            }
            restoActual = restoActual * 10n;
            decimalDigitsCalculated++;
        } else {
            break; // Terminamos si no hay más dígitos y no se necesitan más decimales
        }
        
        // Si el resto actual es 0 (ej. primera iteración con 0 inicial) y aún no es suficiente,
        // o si hemos bajado un dígito pero el número aún no es suficiente para dividir.
        // Ojo: Esto podría necesitar un ajuste más fino para casos como 12/100, donde se espera 0.12.
        // Para simplificar, la lógica de `posicionEnDividendo` y `restoActual` ya cubre esto en el for-loop de abajo.
        
        // Determinar el dígito del cociente
        let digitoCociente = 0n;
        if (restoActual >= divisor) {
            digitoCociente = restoActual / divisor;
        } else if (cocienteCompleto.length > 0 || isDecimalPart) {
            // Si ya hemos empezado a formar el cociente (o estamos en la parte decimal)
            // y el número actual no es divisible, el dígito es 0.
            digitoCociente = 0n;
        } else {
            // Caso inicial donde el primer segmento es menor que el divisor, y debemos "bajar" más
            // (ej. 123/456, primero tratamos 1, luego 12, luego 123)
            // Esto lo maneja el bucle while superior, así que aquí no deberíamos entrar.
            continue; // Saltar el cálculo de producto/resto si aún no podemos dividir
        }

        const producto = digitoCociente * divisor;
        const nuevoResto = restoActual - producto;

        cocienteCompleto += digitoCociente.toString();

        // Determinar la columna donde termina el producto/resto
        // Esto necesita ser dinámico ya que el cociente puede tener más dígitos que el dividendo.
        // El `colEnd` representa la posición en la 'línea imaginaria' del dividendo.
        let currentColEnd;
        if (isDecimalPart) {
            // La posición final para productos/restos en la parte decimal
            // es `longitud_dividendo + 1 (por el punto) + #decimales_calculados_hasta_ahora`
            currentColEnd = dividendoStr.length + 1 + decimalDigitsCalculated;
        } else {
            // Para la parte entera, es la `posicionEnDividendo`
            currentColEnd = posicionEnDividendo;
        }
        
        // Añadir el producto a restar
        displaySteps.push({ 
            text: producto.toString(), 
            row: currentRow, 
            colEnd: currentColEnd, 
            type: 'producto' 
        });
        currentRow++;

        // Añadir el resto del paso actual
        displaySteps.push({ 
            text: nuevoResto.toString(), 
            row: currentRow, 
            colEnd: currentColEnd, 
            type: 'resto' 
        });
        restoActual = nuevoResto; // Actualizar restoActual para la siguiente iteración
        currentRow++;

        if (restoActual === 0n && posicionEnDividendo === dividendoStr.length && decimalDigitsCalculated >= decimalPlaces) {
            break; // Si el resto es cero y ya hemos terminado los decimales, salir
        }
    }
    
    // Asegurarse de que el cociente tenga los decimales correctos si termina antes
    if (isDecimalPart) {
        // Si el cociente termina en un punto decimal, quitarlo
        if (cocienteCompleto.endsWith(".")) {
             cocienteCompleto = cocienteCompleto.slice(0, -1);
        }
        // Rellenar con ceros si no se alcanzaron los decimales deseados
        let parts = cocienteCompleto.split('.');
        if (parts.length === 2 && parts[1].length < decimalPlaces) {
            cocienteCompleto += '0'.repeat(decimalPlaces - parts[1].length);
        } else if (parts.length === 1 && decimalPlaces > 0) {
            cocienteCompleto += '.' + '0'.repeat(decimalPlaces);
        }
    }

    return { 
        cociente: cocienteCompleto, 
        displaySteps, 
        totalRows: currentRow 
    };
}

/**
 * Función de cálculo que genera un array de elementos para la "división corta".
 * Retorna solo el dividendo inicial y los restos intermedios/finales con los dígitos bajados.
 * @param {string} dividendoStr
 * @param {string} divisorStr
 * @returns {{cociente: string, displaySteps: Array<object>, totalRows: number}}
 */
function calculateShortDivisionSteps(dividendoStr, divisorStr) {
    const divisor = BigInt(divisorStr);
    const cocienteCompleto = (BigInt(dividendoStr) / divisor).toString();
    
    const shortDisplaySteps = [];
    let currentRow = 0;

    // 1. Añadir el dividendo inicial
    shortDisplaySteps.push({ 
        text: dividendoStr, 
        row: currentRow, 
        colEnd: dividendoStr.length, 
        type: 'dividendo' 
    });
    currentRow++; // Fila visual 0 para el dividendo

    let currentNumberToDivide = 0n;
    let posicionEnDividendo = 0; // Índice exclusivo del último dígito del dividendo usado/considerado

    // Determinar el primer segmento a dividir (ej., para 945/5, es 9; para 654/8, es 65)
    // Se toma un dígito a la vez hasta que `currentNumberToDivide` sea >= `divisor`
    while (posicionEnDividendo < dividendoStr.length) {
        currentNumberToDivide = currentNumberToDivide * 10n + BigInt(dividendoStr[posicionEnDividendo]);
        posicionEnDividendo++;
        if (currentNumberToDivide >= divisor) break;
        // Si el cociente completo ya tiene un dígito y aún no hemos bajado suficientes dígitos
        // significa que los dígitos iniciales eran muy pequeños y el cociente comienza con un 0.
        // Pero para la división corta, bajamos hasta que sea divisible.
        if (posicionEnDividendo === dividendoStr.length && currentNumberToDivide < divisor && cocienteCompleto === "0") {
             // Caso como 5/10, donde no se puede dividir y el cociente es 0, y el resto es 5.
             // Aquí currentNumberToDivide es el dividendo original.
             break;
        }
    }
    
    // Si el dividendo es menor que el divisor, el cociente es 0 y el resto es el dividendo.
    if (BigInt(dividendoStr) < divisor) {
        // Ya se añadió el dividendo en la row 0. El resto es el dividendo.
        // `calculateDisplaySteps` ya maneja esto, pero `calculateShortDivisionSteps` lo simplifica.
        shortDisplaySteps.push({ 
            text: dividendoStr, 
            row: currentRow, 
            colEnd: dividendoStr.length, 
            type: 'resto' 
        });
        currentRow++;
        return { 
            cociente: "0", 
            displaySteps: shortDisplaySteps, 
            totalRows: currentRow 
        };
    }

    // Loop a través de cada dígito del cociente
    for (let i = 0; i < cocienteCompleto.length; i++) {
        const digitoCociente = BigInt(cocienteCompleto[i]);
        const producto = digitoCociente * divisor;
        const remainderFromPreviousCalc = currentNumberToDivide - producto;

        let numberToShowAsResto;
        let colEndForResto;

        if (posicionEnDividendo < dividendoStr.length) {
            // Aún hay dígitos para bajar
            numberToShowAsResto = remainderFromPreviousCalc * 10n + BigInt(dividendoStr[posicionEnDividendo]);
            colEndForResto = posicionEnDividendo + 1; 
            posicionEnDividendo++; // Mover al siguiente dígito del dividendo
        } else {
            // Último paso, este es el resto final
            numberToShowAsResto = remainderFromPreviousCalc;
            colEndForResto = posicionEnDividendo;
        }

        shortDisplaySteps.push({
            text: numberToShowAsResto.toString(),
            row: currentRow, // Cada resto en una nueva fila visual
            colEnd: colEndForResto, 
            type: 'resto' 
        });
        currentRow++;
        
        currentNumberToDivide = numberToShowAsResto; // El resto actual es el número para la siguiente división
    }

    return { 
        cociente: cocienteCompleto, 
        displaySteps: shortDisplaySteps, 
        totalRows: currentRow 
    };
}

/**
 * `drawHeader`: Dibuja la parte superior de la división con el formato de galera latinoamericano.
 * @param {DocumentFragment} fragment
 * @param {object} params
 */
function drawHeader(fragment, { divisorStr, cociente, tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, xBloqueDerecho, anchoIzquierdo, separatorWidth }) {
    const yPosTopRow = paddingTop;
    const yPosCociente = paddingTop + tamCel;

    // Dibujar divisor
    for (let i = 0; i < divisorStr.length; i++) {
        fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--divisor", divisorStr[i], {
            left: `${xBloqueDerecho + i * tamCel}px`, 
            top: `${yPosTopRow}px`, 
            width: `${tamCel}px`, 
            height: `${tamCel}px`, 
            fontSize: `${tamFuente}px`
        }));
    }

    // Calcular posiciones de las líneas
    const xLineaVertical = offsetHorizontal + anchoIzquierdo * tamCel + (separatorWidth / 2) * tamCel + paddingLeft;
    // El ancho del bloque derecho es variable, usamos cociente.length
    const xEndOfRightBlock = xBloqueDerecho + Math.max(divisorStr.length, cociente.length) * tamCel; 
    const anchoLineasHorizontales = xEndOfRightBlock - xLineaVertical;

    // Línea vertical de la galera
    fragment.appendChild(crearCelda("output-grid__line", "", {
        left: `${xLineaVertical}px`, 
        top: `${yPosTopRow}px`, 
        width: `2px`, 
        height: `${tamCel}px`
    }));
    
    // Línea horizontal (entre divisor y cociente)
    fragment.appendChild(crearCelda("output-grid__line", "", {
        left: `${xLineaVertical}px`, 
        top: `${yPosCociente}px`, 
        width: `${anchoLineasHorizontales}px`, 
        height: `2px`
    }));

    // Dibujar cociente
    for (let i = 0; i < cociente.length; i++) {
        fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--cociente", cociente[i], {
            left: `${xBloqueDerecho + i * tamCel}px`, 
            top: `${yPosCociente}px`, 
            width: `${tamCel}px`, 
            height: `${tamCel}px`, 
            fontSize: `${tamFuente}px`
        }));
    }
}

/**
 * `renderFullDivisionSteps`: Dibuja los pasos completos de la división (productos con '-' y líneas).
 * @param {DocumentFragment} fragment
 * @param {Array<object>} displaySteps - Array de objetos con {text, row, colEnd, type}
 * @param {object} layoutParams - Contiene tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset
 * @param {string} dividendoStr - Se necesita para calcular la posición del punto decimal
 * @param {string} cocienteStr - Se necesita para ubicar el punto decimal en el cociente
 */
function renderFullDivisionSteps(fragment, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset }, dividendoStr, cocienteStr) {
    // Detectar la posición del punto decimal en el cociente para ajustar `colEnd` si es necesario
    const decimalPointIndexInCociente = cocienteStr.indexOf('.');
    
    displaySteps.forEach(step => {
        const yStart = paddingTop + step.row * tamCel;
        const clase = `output-grid__cell output-grid__cell--${step.type}`;

        if (step.type === 'dividendo') {
             // El dividendo va al inicio del bloque izquierdo
            const xStart = offsetHorizontal + 0 * tamCel + paddingLeft; 
            for (let i = 0; i < step.text.length; i++) {
                fragment.appendChild(crearCelda(clase, step.text[i], {
                    left: `${xStart + i * tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }));
            }
        } else {
            // Para productos y restos, `colEnd` indica dónde termina el número en relación al dividendo original
            // o a la posición donde se "baja" el siguiente dígito (incluidos los ceros para decimales).
            let actualColEnd = step.colEnd;
            if (decimalPointIndexInCociente !== -1 && actualColEnd > dividendoStr.length) {
                 // Si estamos en la parte decimal de la división, ajustamos `colEnd`
                 // ya que los dígitos "bajados" y los restos/productos se desplazan
                 // un lugar por cada decimal calculado (más el punto).
                 // La lógica de `calculateDisplaySteps` ya debería generar un `colEnd`
                 // que "simula" esta posición en el dividendo extendido con ceros.
                 // Aquí, simplemente usamos el `colEnd` proporcionado por `calculateDisplaySteps`.
            }

            const colStart = actualColEnd - step.text.length + signColumnOffset;
            const xStart = offsetHorizontal + colStart * tamCel + paddingLeft;

            for (let i = 0; i < step.text.length; i++) {
                fragment.appendChild(crearCelda(clase, step.text[i], {
                    left: `${xStart + i * tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }));
            }

            // Si es un producto, añadir el signo menos y la línea
            if (step.type === 'producto') {
                fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--producto", "-", {
                    left: `${xStart - tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }));
                
                fragment.appendChild(crearCelda("output-grid__line", "", {
                    left: `${xStart}px`, 
                    top: `${yStart + tamCel}px`,
                    width: `${step.text.length * tamCel}px`, 
                    height: `2px`
                }));
            }
        }
    });
}

/**
 * `renderShortDivisionSteps`: Dibuja los pasos de la división corta (solo dividendos y restos, sin productos ni líneas).
 * @param {DocumentFragment} fragment
 * @param {Array<object>} displaySteps - Array de objetos con {text, row, colEnd, type} (de `calculateShortDivisionSteps`)
 * @param {object} layoutParams - Contiene tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset (que aquí será 0)
 */
function renderShortDivisionSteps(fragment, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset }) {
    displaySteps.forEach(step => {
        const yStart = paddingTop + step.row * tamCel;
        const clase = `output-grid__cell output-grid__cell--${step.type}`;

        // La `colEnd` de `calculateShortDivisionSteps` es el índice exclusivo de la columna final.
        // Restamos `text.length` para encontrar el inicio. `signColumnOffset` es 0 aquí.
        const colStart = step.colEnd - step.text.length + signColumnOffset; 
        const xStart = offsetHorizontal + colStart * tamCel + paddingLeft;

        for (let i = 0; i < step.text.length; i++) {
            fragment.appendChild(crearCelda(clase, step.text[i], {
                left: `${xStart + i * tamCel}px`, 
                top: `${yStart}px`,
                width: `${tamCel}px`, 
                height: `${tamCel}px`, 
                fontSize: `${tamFuente}px`
            }));
        }
    });
}

/**
 * `divide` (DIVISIÓN EXTENDIDA "EXPAND"): Muestra el proceso de la división larga paso a paso, incluyendo decimales configurables.
 * @param {Array<[string, number]>} numerosAR - Array con [dividendo, posición] y [divisor, posición]
 */
export function divide(numerosAR) {
    salida.innerHTML = "";
    const fragment = document.createDocumentFragment();

    const [dividendoStr, ] = numerosAR[0];
    const [divisorStr, ] = numerosAR[1];

    // Validaciones
    if (BigInt(divisorStr) === 0n) { 
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.division2}</p>`; 
        return; 
    }
    if (BigInt(dividendoStr) === 0n) { 
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.division1}</p>`; 
        return; 
    }

    // Calcular los pasos de la división con decimales configurables
    const { cociente, displaySteps, totalRows } = calculateDisplaySteps(dividendoStr, divisorStr, DECIMAL_PLACES);
    
    // Calcular dimensiones para la división extendida
    const signColumnOffset = 1; // Espacio para el signo menos
    const anchoIzquierdo = dividendoStr.length + signColumnOffset + DECIMAL_PLACES + (DECIMAL_PLACES > 0 ? 1 : 0);
    const anchoDerecho = Math.max(divisorStr.length, cociente.length) + 1;
    const separatorWidth = 2;
    const totalCols = anchoIzquierdo + separatorWidth + anchoDerecho;
    
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, totalCols, totalRows);

    // X-posición de inicio para el bloque derecho (divisor/cociente)
    const xBloqueDerecho = offsetHorizontal + (anchoIzquierdo + separatorWidth) * tamCel + paddingLeft;

    // Mostrar el resultado final con estilo mejorado
    const resultadoFinal = `${dividendoStr} ÷ ${divisorStr} = ${cociente}`;
    const resultadoElement = crearCelda("output-grid__result improved-division-result", resultadoFinal, {
        left: '10px',
        top: '10px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#66FF66',
        fontFamily: 'Courier New, monospace'
    });
    fragment.appendChild(resultadoElement);

    // Dibujar el Header (Divisor, Cociente y Galera) con mejor alineación y colores
    const headerTop = paddingTop + 50; // Espacio para el resultado
    drawHeader(fragment, {
        divisorStr, cociente, tamCel, tamFuente,
        offsetHorizontal, paddingLeft, paddingTop: headerTop, xBloqueDerecho,
        anchoIzquierdo, anchoDerecho, separatorWidth
    });

    // Dibujar los pasos completos de la división con mejor visualización
    renderFullDivisionSteps(fragment, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop: headerTop, signColumnOffset }, dividendoStr, cociente);
    
    salida.appendChild(fragment);
}

/**
 * `divideExt` (DIVISIÓN NORMAL): Muestra el proceso paso a paso, pero sin signos de resta ni líneas bajo los productos.
 * @param {Array<[string, number]>} numerosAR - Array con [dividendo, posición] y [divisor, posición]
 */
export function divideExt(numerosAR) {
    salida.innerHTML = "";
    const fragment = document.createDocumentFragment();

    const [dividendoStr, ] = numerosAR[0];
    const [divisorStr, ] = numerosAR[1];

    // Validaciones
    if (BigInt(divisorStr) === 0n) { 
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.division2}</p>`; 
        return; 
    }
    if (BigInt(dividendoStr) === 0n) { 
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.division1}</p>`; 
        return; 
    }

    // Usar la función de cálculo específica para la división corta
    const { cociente, displaySteps, totalRows } = calculateShortDivisionSteps(dividendoStr, divisorStr);

    // Calcular dimensiones para la división corta
    const signColumnOffset = 0; // No hay signo menos explícito en este modo, por lo que no se necesita offset
    // El ancho izquierdo es solo la longitud del dividendo (no hay espacio para el signo)
    const anchoIzquierdo = dividendoStr.length; 
    const anchoDerecho = Math.max(divisorStr.length, cociente.length) + 1; 
    const separatorWidth = 2; 
    
    // totalRows: La altura visual para el layout debe incluir la fila del dividendo, la fila del cociente/divisor
    // y luego todas las filas de restos calculadas por `calculateShortDivisionSteps`.
    // Si `totalRows` de `calculateShortDivisionSteps` es 1 (solo dividendo, para resto 0),
    // entonces `actualTotalRowsForLayout` debe ser 2 (dividendo y cociente/divisor).
    // Si `totalRows` de `calculateShortDivisionSteps` es > 1, entonces cada resto ocupa una fila adicional.
    const actualTotalRowsForLayout = totalRows + 1; // +1 para la fila del cociente/divisor
    
    const totalCols = anchoIzquierdo + separatorWidth + anchoDerecho;
    
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, totalCols, actualTotalRowsForLayout);

    // X-posición de inicio para el bloque derecho (divisor/cociente)
    const xBloqueDerecho = offsetHorizontal + (anchoIzquierdo + separatorWidth) * tamCel + paddingLeft;

    // Dibujar Header (Divisor, Cociente y Galera)
    drawHeader(fragment, { 
        divisorStr, cociente, tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, 
        xBloqueDerecho, anchoIzquierdo, anchoDerecho, separatorWidth 
    });

    // Dibujar los pasos de la división corta
    renderShortDivisionSteps(fragment, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset });
    
    salida.appendChild(fragment);
}