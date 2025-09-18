// =======================================================
// --- error-handler-centralized.js ---
// Módulo centralizado para manejo de errores (Versión Refactorizada)
// =======================================================
"use strict";

import { errorMessages } from './config.js';

export class ErrorHandlerCentralized {
    /**
     * @param {HTMLElement} outputElement El elemento del DOM donde se mostrarán los errores.
     */
    constructor(outputElement) {
        if (!outputElement) {
            throw new Error("ErrorHandlerCentralized requiere un elemento de salida (outputElement).");
        }
        this.outputElement = outputElement;
    }

    /**
     * Muestra un mensaje de error en el elemento de salida.
     * @param {keyof typeof errorMessages} errorCode - El código del error definido en config.js.
     * @param {object} [details={}] - Detalles adicionales para registrar en la consola.
     * @returns {false} Retorna siempre false para poder usarlo en una condición: `if (!handler.validar(...)) return;`
     */
    mostrarError(errorCode, details = {}) {
        const message = errorMessages[errorCode] || errorMessages.invalidOperation;
        
        console.error(`Error: ${errorCode}`, details);
        
        this.outputElement.innerHTML = message; // Usar innerHTML para renderizar las etiquetas <p>
        
        // Añadir clase para posible animación de error
        const errorElement = this.outputElement.querySelector('.error');
        if (errorElement) {
            errorElement.classList.add('pulse');
            setTimeout(() => errorElement.classList.remove('pulse'), 500);
        }
        
        return false; // Facilita el encadenamiento de validaciones
    }

    /**
     * Limpia cualquier mensaje de error previo del elemento de salida.
     */
    limpiarErrores() {
        this.outputElement.innerHTML = '';
    }

    /**
     * Valida una operación matemática básica.
     * @param {string} input - La cadena de entrada de la operación.
     * @returns {boolean} `true` si es válida, de lo contrario muestra un error y retorna `false`.
     */
    validarOperacion(input) {
        const isValid = /^-?[0-9,]+\s*[+\-x/%^]\s*-?[0-9,]+$/.test(input) && !/[+\-x/%^]$/.test(input.trim()) && !input.endsWith(',');
        if (!isValid) {
            return this.mostrarError('invalidOperation', { input });
        }
        return true;
    }

    /**
     * Valida una operación de multiplicación.
     * @param {Array<[string, number]>} numerosAR - Array con los operandos.
     * @returns {boolean} `true` si es válida, de lo contrario muestra un error y retorna `false`.
     */
    validarMultiplicacion(numerosAR) {
        const [num1] = numerosAR[0];
        const [num2] = numerosAR[1];

        if (num1 === '0' || num2 === '0') return this.mostrarError('multiplicacion1');
        
        const resultadoS = (BigInt(num1) * BigInt(num2)).toString();
        if (resultadoS.length > 20) { // Límite arbitrario para la visualización
            return this.mostrarError('multiplicacion2', { length: resultadoS.length });
        }
        
        return true;
    }

    /**
     * Valida una operación de división.
     * @param {Array<[string, number]>} numerosAR - Array con los operandos.
     * @returns {boolean} `true` si es válida, de lo contrario muestra un error y retorna `false`.
     */
    validarDivision(numerosAR) {
        const [dividendo] = numerosAR[0];
        const [divisor] = numerosAR[1];

        if (dividendo === '0' && divisor === '0') return this.mostrarError('division3');
        if (divisor === '0') return this.mostrarError('division2');
        if (dividendo === '0') return this.mostrarError('division1');
        
        return true;
    }

    /**
     * Valida una operación de módulo.
     * @param {Array<[string, number]>} numerosAR - Array con los operandos.
     * @returns {boolean} `true` si es válida, de lo contrario muestra un error y retorna `false`.
     */
    validarModulo(numerosAR) {
        const [divisorValue, ] = numerosAR[1];
        if (divisorValue === '0') {
            return this.mostrarError('moduloPorCero');
        }
        return true;
    }

    /**
     * Valida la entrada para la operación de potencia.
     * @param {Array<[string, number]>} numerosAR - Array con los operandos.
     * @returns {boolean} `true` si es válida, de lo contrario muestra un error y retorna `false`.
     */
    validarPotencia(numerosAR) {
        const [, baseDec] = numerosAR[0];
        const [, expDec] = numerosAR[1];

        if (baseDec > 0 || expDec > 0) {
            return this.mostrarError('invalidOperation', { customMessage: 'La potencia solo soporta números enteros por ahora.' });
        }
        // La implementación de PotenciaOperation ya maneja otros casos como exponentes negativos
        // o resultados demasiado grandes, por lo que no es necesario duplicar esa lógica aquí.
        return true;
    }

    /**
     * Valida la entrada para la descomposición en factores primos.
     * @param {string} numero - El número a validar.
     * @returns {boolean} `true` si es válida, de lo contrario muestra un error y retorna `false`.
     */
    validarFactoresPrimos(numero) {
        if (!/^\d+$/.test(numero) || numero.includes(',')) return this.mostrarError('invalidOperation');
        if (numero === '0' || numero === '1') return this.mostrarError('dFactorial1');
        
        return true;
    }

    /**
     * Valida la entrada para el cálculo de raíz cuadrada.
     * @param {string} numero - El número a validar.
     * @returns {boolean} `true` si es válida, de lo contrario muestra un error y retorna `false`.
     */
    validarRaizCuadrada(numero) {
        if (!/^\d+$/.test(numero)) return this.mostrarError('invalidSqrtInput');
        if (numero.includes(',')) return this.mostrarError('integerSqrtRequired');
        if (numero.startsWith('-')) return this.mostrarError('negativeSqrt');
        if (numero === '0') return this.mostrarError('raiz1');

        return true;
    }
}
