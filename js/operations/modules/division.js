// =======================================================
// --- operations/modules/division.js (VERSIÓN OPTIMIZADA Y MEJORADA) ---
// Refactorizado para usar la clase base VisualOperation.
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda, crearCeldaAnimada, esperar } from '../utils/dom-helpers.js';
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
async function renderFullDivisionSteps(container, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset }, dividendoStr, cocienteStr) {
    // Detectar la posición del punto decimal en el cociente para ajustar `colEnd` si es necesario
    const decimalPointIndexInCociente = cocienteStr.indexOf('.');
    
    for (const step of displaySteps) {
        const yStart = paddingTop + step.row * tamCel;
        const clase = `output-grid__cell output-grid__cell--${step.type}`;

        if (step.type === 'dividendo') {
             // El dividendo va al inicio del bloque izquierdo
            const xStart = offsetHorizontal + 0 * tamCel + paddingLeft; 
            const fragmento = document.createDocumentFragment();
            for (let i = 0; i < step.text.length; i++) {
                fragmento.appendChild(crearCelda(clase, step.text[i], {
                    left: `${xStart + i * tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }));
            }
            container.appendChild(fragmento);
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
            
            const fragmento = document.createDocumentFragment();
            for (let i = 0; i < step.text.length; i++) {
                // Usamos crearCeldaAnimada para los pasos de la resta
                fragmento.appendChild(crearCeldaAnimada(clase, step.text[i], {
                    left: `${xStart + i * tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }, i * 50));
            }
            container.appendChild(fragmento);

            // Si es un producto, añadir el signo menos y la línea
            if (step.type === 'producto') {
                container.appendChild(crearCelda("output-grid__cell output-grid__cell--producto", "-", {
                    left: `${xStart - tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }));
                
                container.appendChild(crearCelda("output-grid__line", "", {
                    left: `${xStart}px`, 
                    top: `${yStart + tamCel}px`,
                    width: `${step.text.length * tamCel}px`, 
                    height: `2px`
                }));
                await esperar(800); // Pausa después de mostrar el número a restar
            } else if (step.type === 'resto') {
                await esperar(1200); // Pausa más larga después de mostrar el resto
            }
        }
    }
}

/**
 * `renderShortDivisionSteps`: Dibuja los pasos de la división corta (solo dividendos y restos, sin productos ni líneas).
 * @param {DocumentFragment} fragment
 * @param {Array<object>} displaySteps - Array de objetos con {text, row, colEnd, type} (de `calculateShortDivisionSteps`)
 * @param {object} layoutParams - Contiene tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset (que aquí será 0)
 */
async function renderShortDivisionSteps(container, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset }) {
    for (const step of displaySteps) {
        const yStart = paddingTop + step.row * tamCel;
        const clase = `output-grid__cell output-grid__cell--${step.type}`;

        // La `colEnd` de `calculateShortDivisionSteps` es el índice exclusivo de la columna final.
        // Restamos `text.length` para encontrar el inicio. `signColumnOffset` es 0 aquí.
        const colStart = step.colEnd - step.text.length + signColumnOffset; 
        const xStart = offsetHorizontal + colStart * tamCel + paddingLeft;
        
        const fragmento = document.createDocumentFragment();
        for (let i = 0; i < step.text.length; i++) {
            const celda = (step.type === 'dividendo') 
                ? crearCelda(clase, step.text[i], { left: `${xStart + i * tamCel}px`, top: `${yStart}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` })
                : crearCeldaAnimada(clase, step.text[i], { left: `${xStart + i * tamCel}px`, top: `${yStart}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }, i * 50);
            fragmento.appendChild(celda);
        }
        container.appendChild(fragmento);

        if (step.type === 'resto') {
            await esperar(1000); // Pausa después de mostrar cada resto/número bajado
        }
    }
}

function validarDivision(numerosAR) {
    const [dividendoStr, ] = numerosAR[0];
    const [divisorStr, ] = numerosAR[1];

    if (BigInt(divisorStr) === 0n) { 
        salida.innerHTML = errorMessages.division2; 
        return false; 
    }
    if (BigInt(dividendoStr) === 0n) { 
        salida.innerHTML = errorMessages.division1; 
        return false; 
    }
    return true;
}

class DivisionOperation extends VisualOperation {
    constructor(numerosAR, salida, isShortDivision) {
        super(numerosAR, salida);
        this.isShortDivision = isShortDivision;
    }

    async execute() {
        this._clearOutput();
        this._prepareOperands();
        this._calculateResult(); // Se ejecuta antes para obtener dimensiones
        this._calculateLayout();
        await this._drawStaticElements();
        await this._animateSteps();
        this._drawResult();
        this._finalize();
    }

    _prepareOperands() {
        this.dividendoStr = this.numerosAR[0][0];
        this.divisorStr = this.numerosAR[1][0];
    }

    _calculateResult() {
        if (this.isShortDivision) {
            const { cociente, displaySteps, totalRows } = calculateShortDivisionSteps(this.dividendoStr, this.divisorStr);
            this.resultado.display = cociente;
            this.displaySteps = displaySteps;
            this.totalRows = totalRows;
        } else {
            const { cociente, displaySteps, totalRows } = calculateDisplaySteps(this.dividendoStr, this.divisorStr, DECIMAL_PLACES);
            this.resultado.display = cociente;
            this.displaySteps = displaySteps;
            this.totalRows = totalRows;
        }
    }

    _getGridDimensions() {
        const cociente = this.resultado.display;
        if (this.isShortDivision) {
            const anchoIzquierdo = this.dividendoStr.length;
            const anchoDerecho = Math.max(this.divisorStr.length, cociente.length) + 1;
            const separatorWidth = 2;
            const totalCols = anchoIzquierdo + separatorWidth + anchoDerecho;
            const actualTotalRowsForLayout = this.totalRows + 1;
            return { width: totalCols, height: actualTotalRowsForLayout };
        } else {
            const signColumnOffset = 1;
            const anchoIzquierdo = this.dividendoStr.length + signColumnOffset + DECIMAL_PLACES + (DECIMAL_PLACES > 0 ? 1 : 0);
            const anchoDerecho = Math.max(this.divisorStr.length, cociente.length) + 1;
            const separatorWidth = 2;
            const totalCols = anchoIzquierdo + separatorWidth + anchoDerecho;
            return { width: totalCols, height: this.totalRows };
        }
    }

    async _drawStaticElements() {
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = this.layoutParams;
        const cociente = this.resultado.display;

        let anchoIzquierdo, anchoDerecho, separatorWidth, xBloqueDerecho;
        if (this.isShortDivision) {
            anchoIzquierdo = this.dividendoStr.length;
            anchoDerecho = Math.max(this.divisorStr.length, cociente.length) + 1;
            separatorWidth = 2;
            xBloqueDerecho = offsetHorizontal + (anchoIzquierdo + separatorWidth) * tamCel + paddingLeft;
        } else {
            const signColumnOffset = 1;
            anchoIzquierdo = this.dividendoStr.length + signColumnOffset + DECIMAL_PLACES + (DECIMAL_PLACES > 0 ? 1 : 0);
            anchoDerecho = Math.max(this.divisorStr.length, cociente.length) + 1;
            separatorWidth = 2;
            xBloqueDerecho = offsetHorizontal + (anchoIzquierdo + separatorWidth) * tamCel + paddingLeft;
        }
        
        let headerTop = paddingTop;
        if (!this.isShortDivision) {
            const resultadoFinal = `${this.dividendoStr} ÷ ${this.divisorStr} = ${cociente}`;
            this.salida.appendChild(crearCelda("output-grid__result--division-final", resultadoFinal, {}));
            headerTop += 50;
        }

        const headerFragment = document.createDocumentFragment();
        drawHeader(headerFragment, { 
            divisorStr: this.divisorStr, cociente, tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop: headerTop, 
            xBloqueDerecho, anchoIzquierdo, anchoDerecho, separatorWidth 
        });
        this.salida.appendChild(headerFragment);
        this.headerTop = headerTop;
    }

    async _animateSteps() {
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft } = this.layoutParams;
        const cociente = this.resultado.display;

        if (this.isShortDivision) {
            const signColumnOffset = 0;
            await renderShortDivisionSteps(this.salida, this.displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop: this.headerTop, signColumnOffset });
        } else {
            const signColumnOffset = 1;
            await renderFullDivisionSteps(this.salida, this.displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop: this.headerTop, signColumnOffset }, this.dividendoStr, cociente);
        }
    }

    _drawResult() { /* El resultado se dibuja en el header */ }
}

/**
 * `divide` (DIVISIÓN EXTENDIDA "EXPAND"): Muestra el proceso de la división larga paso a paso, incluyendo decimales configurables.
 * @param {Array<[string, number]>} numerosAR - Array con [dividendo, posición] y [divisor, posición]
 */
export async function divide(numerosAR) {
    if (!validarDivision(numerosAR)) return;
    const op = new DivisionOperation(numerosAR, salida, false);
    await op.execute();
}

/**
 * `divideExt` (DIVISIÓN NORMAL): Muestra el proceso paso a paso, pero sin signos de resta ni líneas bajo los productos.
 * @param {Array<[string, number]>} numerosAR - Array con [dividendo, posición] y [divisor, posición]
 */
export async function divideExt(numerosAR) {
    if (!validarDivision(numerosAR)) return;
    const op = new DivisionOperation(numerosAR, salida, true);
    await op.execute();
}