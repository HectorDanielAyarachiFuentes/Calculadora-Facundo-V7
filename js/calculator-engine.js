'use strict';

import * as operations from './operations/index.js';
import { ErrorHandlerCentralized } from './error-handler-centralized.js';
import { HistoryManager } from './history.js';
import * as UIManager from './ui-manager.js';
import { display, salida } from './dom-elements.js';

// --- Estado del Módulo ---
let divext = false;
let lastDivisionState = { operacionInput: '', numerosAR: null, tipo: '' };

/**
 * Procesa la entrada de un token (número, operador, 'c', 'del').
 * @param {string} t - El token a procesar.
 */
export function writeToDisplay(t) {
    const currentDisplay = display.innerHTML;
    const isOperator = ['+', '-', 'x', '/'].includes(t);
    const hasBinaryOperator = /[+\-x/]/.test(currentDisplay.slice(currentDisplay.startsWith('-') ? 1 : 0).replace(/^[0-9,]+/, ''));

    if (t === "c") {
        display.innerHTML = "0";
    } else if (t === "del") {
        display.innerHTML = currentDisplay.slice(0, -1) || "0";
    } else if (isOperator) {
        const lastChar = currentDisplay.slice(-1);
        if (hasBinaryOperator && !['+', '-', 'x', '/'].includes(lastChar)) return;
        if (['+', '-', 'x', '/'].includes(lastChar)) {
            if (lastChar !== t) display.innerHTML = currentDisplay.slice(0, -1) + t;
        } else if (currentDisplay === "0" && t === '-') {
            display.innerHTML = t;
        } else if (currentDisplay !== "0" && !currentDisplay.endsWith(',')) {
            display.innerHTML += t;
        }
    } else {
        if (t === ',' && currentDisplay.split(/[+\-x/]/).pop().includes(',')) return;
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
    const errorHandler = new ErrorHandlerCentralized(salida);

    if (!errorHandler.validarOperacion(entrada)) {
        UIManager.showResultScreen();
        UIManager.updateDivisionButtons(false, divext);
        return errorHandler.mostrarError('invalidOperation');
    }

    UIManager.triggerGlitchEffect(entrada);
    const operador = entrada.match(/(?!^-)[+\-x/]/)[0];
    const numerosAR = operations.parsearNumeros(entrada, operador);
    
    UIManager.showResultScreen();
    salida.innerHTML = '';

    try {
        switch (operador) {
            case '+': await operations.suma(numerosAR); break;
            case '-': await operations.resta(numerosAR); break;
            case 'x':
                if (errorHandler.validarMultiplicacion(salida, numerosAR)) await operations.multiplica(numerosAR);
                break;
            case '/':
                if (errorHandler.validarDivision(salida, numerosAR)) {
                    lastDivisionState = { operacionInput: entrada, numerosAR, tipo: 'division' };
                    divext ? await operations.divideExt(numerosAR) : await operations.divide(numerosAR);
                }
                break;
            default: errorHandler.mostrarError('invalidOperation');
        }
    } catch (error) {
        console.error('Error durante el cálculo:', error);
        errorHandler.mostrarError('invalidOperation', { error });
    }
    
    const calculationError = salida.querySelector('.output-screen__error-message');
    UIManager.updateDivisionButtons(operador === '/' && !calculationError, divext);

    if (addToHistory && !calculationError) {
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
    salida.innerHTML = '';
    let successful = false;
    const errorHandler = new ErrorHandlerCentralized(salida);
    
    try {
        const primosMatch = historyInput.match(/^factores\((\d+)\)$/);
        const raizMatch = historyInput.match(/^√\((.+)\)$/);

        if (primosMatch) {
            if (errorHandler.validarFactoresPrimos(salida, primosMatch[1])) await operations.desFacPri(primosMatch[1]);
        } else if (raizMatch) {
            if (errorHandler.validarRaizCuadrada(salida, raizMatch[1])) await operations.raizCuadrada(raizMatch[1]);
        } else {
            await calculate(false);
        }
        successful = !salida.querySelector('.output-screen__error-message');
    } catch (error) {
        console.error('Error durante la re-ejecución:', error);
        errorHandler.mostrarError('invalidOperation', { error });
    } finally {
        display.innerHTML = historyInput;
        UIManager.updateKeyboardState(historyInput);
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
            if (success) HistoryManager.add({ input: inputParaHistorial, visualHtml: salida.innerHTML });
            break;
        }
        default: console.warn(`Acción desconocida: ${action}`);
    }
}