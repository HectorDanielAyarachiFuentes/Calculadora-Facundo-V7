// =======================================================
// --- error-handler.js ---
// Sistema centralizado de manejo de errores para la calculadora
// =======================================================
'use strict';

import { errorMessages } from './config.js';

/**
 * Clase que maneja los errores de la aplicación de forma centralizada
 */
export class ErrorHandler {
  /**
   * Muestra un mensaje de error en el elemento de salida
   * @param {HTMLElement} outputElement - Elemento donde mostrar el error
   * @param {string} errorCode - Código del error definido en config.js
   * @param {Object} details - Detalles adicionales del error (opcional)
   * @returns {HTMLElement} - El elemento de error creado
   */
  static mostrarError(outputElement, errorCode, details = {}) {
    if (!errorMessages[errorCode]) {
      console.error(`Código de error no definido: ${errorCode}`, details);
      errorCode = 'invalidOperation'; // Código de error por defecto
    }
    
    // Registrar el error para depuración
    console.error(`Error: ${errorCode}`, details);
    
    // Crear y mostrar el mensaje de error
    const errorMessageElement = document.createElement('p');
    errorMessageElement.className = 'output-screen__error-message';
    errorMessageElement.innerHTML = errorMessages[errorCode];
    
    // Aplicar estilos
    errorMessageElement.style.position = 'absolute';
    errorMessageElement.style.width = '100%';
    errorMessageElement.style.height = '100%';
    errorMessageElement.style.display = 'flex';
    errorMessageElement.style.justifyContent = 'center';
    errorMessageElement.style.alignItems = 'center';
    
    // Limpiar el contenedor y añadir el mensaje
    outputElement.innerHTML = '';
    outputElement.appendChild(errorMessageElement);
    
    return errorMessageElement;
  }
  
  /**
   * Valida una operación y muestra un error si es inválida
   * @param {HTMLElement} outputElement - Elemento donde mostrar el error
   * @param {string} input - Entrada a validar
   * @returns {boolean} - true si la operación es válida, false si no
   */
  static validarOperacion(outputElement, input) {
    const operadorMatch = input.match(/[+\-x\/]/);
    
    if (!operadorMatch || 
        !/^-?[0-9,]+\s*[+\-x\/]\s*-?[0-9,]+$/.test(input) || 
        ['+', '-', 'x', '/'].includes(input.slice(-1)) || 
        input.endsWith(',')) {
      this.mostrarError(outputElement, 'invalidOperation');
      return false;
    }
    
    return true;
  }
  
  /**
   * Maneja errores específicos de la división
   * @param {HTMLElement} outputElement - Elemento donde mostrar el error
   * @param {Array} numerosAR - Array con los números a dividir
   * @returns {boolean} - true si no hay errores, false si los hay
   */
  static validarDivision(outputElement, numerosAR) {
    const [num1] = numerosAR[0];
    const [num2] = numerosAR[1];
    
    if (num1 === '0' && num2 === '0') {
      this.mostrarError(outputElement, 'division3');
      return false;
    } else if (num2 === '0') {
      this.mostrarError(outputElement, 'division2');
      return false;
    } else if (num1 === '0') {
      this.mostrarError(outputElement, 'division1');
      return false;
    }
    
    return true;
  }
  
  /**
   * Maneja errores específicos de la multiplicación
   * @param {HTMLElement} outputElement - Elemento donde mostrar el error
   * @param {Array} numerosAR - Array con los números a multiplicar
   * @returns {boolean} - true si no hay errores, false si los hay
   */
  static validarMultiplicacion(outputElement, numerosAR) {
    const [num1] = numerosAR[0];
    const [num2] = numerosAR[1];
    
    if (num1 === '0' || num2 === '0') {
      this.mostrarError(outputElement, 'multiplicacion1');
      return false;
    }
    
    const resultadoS = (BigInt(num1) * BigInt(num2)).toString();
    if (resultadoS.length > 20) {
      this.mostrarError(outputElement, 'multiplicacion2');
      return false;
    }
    
    return true;
  }
  
  /**
   * Maneja errores específicos de la raíz cuadrada
   * @param {HTMLElement} outputElement - Elemento donde mostrar el error
   * @param {string} numero - Número a calcular su raíz
   * @returns {boolean} - true si no hay errores, false si los hay
   */
  static validarRaizCuadrada(outputElement, numero) {
    if (!/^\d+$/.test(numero)) {
      this.mostrarError(outputElement, 'integerSqrtRequired');
      return false;
    }
    
    if (numero === '0') {
      this.mostrarError(outputElement, 'raiz1');
      return false;
    }
    
    if (numero.startsWith('-')) {
      this.mostrarError(outputElement, 'negativeSqrt');
      return false;
    }
    
    return true;
  }
  
  /**
   * Maneja errores específicos de la descomposición en factores primos
   * @param {HTMLElement} outputElement - Elemento donde mostrar el error
   * @param {string} numero - Número a descomponer
   * @returns {boolean} - true si no hay errores, false si los hay
   */
  static validarFactoresPrimos(outputElement, numero) {
    if (numero === '0' || numero === '1') {
      this.mostrarError(outputElement, 'dFactorial1');
      return false;
    }
    
    return true;
  }
}