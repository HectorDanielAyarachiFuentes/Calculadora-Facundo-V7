'use strict';

import * as operations from '../operations/index.js';
import { ErrorHandlerCentralized } from './error-handler-centralized.js';
import { HistoryManager } from './history.js';
import * as UIManager from './ui-manager.js';
import { display, salida } from './dom-elements.js';

// --- Estado del Módulo ---
let divext = false;
let lastDivisionState = { operacionInput: '', numerosAR: null, tipo: '' };
const errorHandler = new ErrorHandlerCentralized(salida); // Instancia única

/**
 * Procesa la entrada de un token (número, operador, 'c', 'del').
 * @param {string} t - El token a procesar.
 */
export function writeToDisplay(t) {
    const currentDisplay = display.innerHTML;
    const isOperator = ['+', '-', 'x', '/', '%', '^'].includes(t);
    const hasBinaryOperator = /[+\-x/%^]/.test(currentDisplay.slice(currentDisplay.startsWith('-') ? 1 : 0).replace(/^[0-9,]+/, ''));

    if (t === "c") {
        display.innerHTML = "0";
    } else if (t === "del") {
        display.innerHTML = currentDisplay.slice(0, -1) || "0";
    } else if (isOperator) {
        const lastChar = currentDisplay.slice(-1);
        if (hasBinaryOperator && !['+', '-', 'x', '/', '%', '^'].includes(lastChar)) return;
        if (['+', '-', 'x', '/', '%', '^'].includes(lastChar)) {
            if (lastChar !== t) display.innerHTML = currentDisplay.slice(0, -1) + t;
        } else if (currentDisplay === "0" && t === '-') {
            display.innerHTML = t;
        } else if (currentDisplay !== "0" && !currentDisplay.endsWith(',')) {
            display.innerHTML += t;
        }
    } else {
        if (t === ',' && currentDisplay.split(/[+\-x/%^]/).pop().includes(',')) return;
        display.innerHTML = (currentDisplay === "0" && t !== ',') ? t : currentDisplay + t;
    }
    
    UIManager.updateKeyboardState(display.innerHTML);
    UIManager.updateDivisionButtons(false, divext); 
    if (t === 'c') {
        lastDivisionState = { operacionInput: '', numerosAR: null, tipo: '' };
    }
}

/**
 * Realiza el cálculo principal basado en el contenido del display.
 * @param {boolean} [addToHistory=true] - Si se debe añadir la operación al historial.
 */
export async function calculate(addToHistory = true) {
    const entrada = display.innerHTML;
    // Se elimina la redeclaración de errorHandler para usar la instancia única del módulo.
    
    errorHandler.limpiarErrores();

    if (!errorHandler.validarOperacion(entrada)) {
        UIManager.showResultScreen();
        UIManager.updateDivisionButtons(false, divext);
        // La validación ya muestra el error, solo hace falta salir.
        return;
    }

    UIManager.triggerGlitchEffect(entrada);
    const operador = entrada.match(/(?!^-)[+\-x/%^]/)[0];
    const numerosAR = operations.parsearNumeros(entrada, operador);
    
    UIManager.showResultScreen();
    // La limpieza de errores ya se hace al inicio. No es necesario limpiar la salida aquí.

    let operationSuccess = false;
    try {
        operationSuccess = await operations.executeVisualOperation(operador, numerosAR, { isShortDivision: divext });
        if (operador === '/' && operationSuccess) lastDivisionState = { operacionInput: entrada, numerosAR, tipo: 'division' };
    } catch (error) {
        console.error('Error durante el cálculo:', error);
        errorHandler.mostrarError('invalidOperation', { error });
    }
    
    UIManager.updateDivisionButtons(operador === '/' && operationSuccess, divext);

    if (addToHistory && operationSuccess) {
        HistoryManager.add({ input: entrada, visualHtml: salida.innerHTML });
    }
    UIManager.updateKeyboardState(display.innerHTML);
}

/**
 * Re-ejecuta una operación desde el historial.
 * @param {string} historyInput - La expresión a calcular.
 * @returns {Promise<boolean>} - True si la operación fue exitosa.
 */
export async function reExecuteOperationFromHistory(historyInput) {
    UIManager.showResultScreen();
    errorHandler.limpiarErrores();

    // --- MEJORA DE UX: Mostrar el número relevante en el display, no la entrada interna ---
    // Para operaciones especiales como 'factores(120)', el display debe mostrar '120',
    // no la cadena interna. Esto evita dejar la calculadora en un estado inválido
    // que causa comportamientos extraños si el usuario intenta seguir calculando.
    const primosMatch = historyInput.match(/^factores\((\d+)\)$/);
    const raizMatch = historyInput.match(/^√\((.+)\)$/);

    if (primosMatch) {
        display.innerHTML = primosMatch[1];
    } else if (raizMatch) {
        display.innerHTML = raizMatch[1];
    } else {
        display.innerHTML = historyInput; // Comportamiento normal para operaciones aritméticas
    }

    let successful = false;
    
    try {
        if (primosMatch) {
            const numero = primosMatch[1];
            if (errorHandler.validarFactoresPrimos(numero)) {
                await operations.desFacPri(numero);
                successful = true;
            }
        } else if (raizMatch) {
            const numero = raizMatch[1];
            if (errorHandler.validarRaizCuadrada(numero)) {
                await operations.raizCuadrada(numero);
                successful = true;
            }
        } else {
            await calculate(false);
            // `calculate` no retorna éxito, así que lo comprobamos por la ausencia de error.
            successful = !salida.querySelector('.output-screen__error-message');
        }
    } catch (error) {
        console.error('Error durante la re-ejecución:', error);
        errorHandler.mostrarError('invalidOperation', { error });
        successful = false;
    } finally {
        // Usar el contenido actualizado del display para gestionar el estado del teclado.
        // Antes usaba `historyInput`, que podía ser 'factores(120)', deshabilitando botones incorrectamente.
        UIManager.updateKeyboardState(display.innerHTML);
    }
    return successful;
}

/**
 * Maneja las acciones de los botones que no son de escritura directa.
 * @param {string} action - La acción a realizar.
 */
export async function handleAction(action) {
    switch (action) {
        case 'view-screen': UIManager.showResultScreen(); break;
        case 'calculate': await calculate(true); break;
        case 'clear': writeToDisplay('c'); break;
        case 'delete': writeToDisplay('del'); break;
        case 'hide-screen': 
            UIManager.showKeyboardScreen(); 
            UIManager.updateKeyboardState(display.innerHTML);
            break;
        case 'divide-expanded':
        case 'divide-normal':
            divext = (action === 'divide-expanded');
            if (lastDivisionState.operacionInput) {
                await reExecuteOperationFromHistory(lastDivisionState.operacionInput);
            } else {
                UIManager.updateDivisionButtons(false, divext);
            }
            break;
        case 'primos':
        case 'raiz': {
            const numero = display.innerHTML;
            const inputParaHistorial = action === 'primos' ? `factores(${numero})` : `√(${numero})`;
            const success = await reExecuteOperationFromHistory(inputParaHistorial); 
            if (success) {
                HistoryManager.add({ input: inputParaHistorial, visualHtml: salida.innerHTML });
            }
            break;
        }
        default: console.warn(`Acción desconocida: ${action}`);
    }
}