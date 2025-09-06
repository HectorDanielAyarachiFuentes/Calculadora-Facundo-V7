// =======================================================
// --- error-handler-centralized.js ---
// Módulo centralizado para manejo de errores
// =======================================================
"use strict";

export class ErrorHandlerCentralized {
    constructor(outputElement) {
        this.outputElement = outputElement;
    }

    mostrarError(tipo, detalles = {}) {
        const mensaje = this.obtenerMensajeError(tipo, detalles);
        this.limpiarErrores();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'output-screen__error-message';
        errorDiv.textContent = mensaje;
        this.outputElement.appendChild(errorDiv);
        console.error('Error:', mensaje, detalles.error || detalles);
    }

    obtenerMensajeError(tipo, detalles) {
        switch (tipo) {
            case 'invalidOperation':
                return 'Operación inválida. Por favor, revise la entrada.';
            case 'divisionByZero':
                return 'Error: División por cero no permitida.';
            case 'invalidInput':
                return 'Entrada inválida.';
            default:
                return 'Error desconocido.';
        }
    }

    limpiarErrores() {
        const errores = this.outputElement.querySelectorAll('.output-screen__error-message');
        errores.forEach(e => e.remove());
    }

    validarOperacion(entrada) {
        // Validar que la operación sea una expresión matemática básica válida
        const regex = /^-?[0-9,]+[+\-x\/]-?[0-9,]+$/;
        return regex.test(entrada);
    }

    validarMultiplicacion(salida, numerosAR) {
        // Validar multiplicación: no hay restricciones específicas, siempre true
        return true;
    }

    validarDivision(salida, numerosAR) {
        // Validar división: evitar división por cero
        if (numerosAR[1] === 0) {
            this.mostrarError('divisionByZero');
            return false;
        }
        return true;
    }

    validarFactoresPrimos(salida, numero) {
        // Validar factores primos: el número debe ser entero positivo mayor que 1
        const num = parseInt(numero);
        if (isNaN(num) || num <= 1) {
            this.mostrarError('invalidInput');
            return false;
        }
        return true;
    }

    validarRaizCuadrada(salida, numero) {
        // Validar raíz cuadrada: el número debe ser no negativo
        const num = parseFloat(numero.replace(',', '.'));
        if (isNaN(num) || num < 0) {
            this.mostrarError('invalidInput');
            return false;
        }
        return true;
    }
}
