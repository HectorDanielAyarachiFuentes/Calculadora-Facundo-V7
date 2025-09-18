// =======================================================
// --- operations/index.js ---
// Punto de entrada principal para el módulo de operaciones.
//
// Este archivo utiliza la sintaxis 'export * from ...' para re-exportar
// todas las funciones de los submódulos. Esto permite que otros archivos
// (como main.js) importen todo lo que necesitan con una sola línea, así:
// import { suma, resta, parsearNumeros } from './operations/index.js';
// =======================================================
"use strict";

// --- Re-exportar todas las funciones de los módulos de operaciones ---
export * from './modules/addition.js';
export * from './modules/subtraction.js';
export * from './modules/multiplication.js';
export * from './modules/division.js';
export * from './modules/prime-factors.js';
export * from './modules/square-root.js';
export * from './modules/potencia.js';
export * from './modules/logaritmo.js';
export * from './modules/logaritmolog.js';
export * from './modules/seno.js';

// --- Re-exportar utilidades que sean útiles fuera del módulo ---
// `parsearNumeros` es un buen candidato porque se usa para preparar
// los datos ANTES de llamar a las funciones de operación.
export * from './utils/parsers.js';

export * from './modules/modulo.js'; // Exportar la nueva operación

// --- FÁBRICA DE OPERACIONES (NUEVO) ---
import { SumaOperation } from './modules/addition.js';
import { RestaOperation } from './modules/subtraction.js';
import { MultiplicationOperation } from './modules/multiplication.js';
import { DivisionOperation } from './modules/division.js';
import { ModuloOperation } from './modules/modulo.js';
import { PotenciaOperation } from './modules/potencia.js';
import { LogaritmoOperation } from './modules/logaritmo.js';
import { LogaritmoLogOperation } from './modules/logaritmolog.js';
import { SenoOperation } from './modules/seno.js';
import { salida } from '../calculadora/config.js';
import { ErrorHandlerCentralized } from '../calculadora/error-handler-centralized.js';

const errorHandler = new ErrorHandlerCentralized(salida);

const operationClassMap = {
    '+': SumaOperation,
    '-': RestaOperation,
    'x': MultiplicationOperation,
    '/': DivisionOperation,
    '%': ModuloOperation,
    '^': PotenciaOperation
};

/**
 * Crea y ejecuta la operación visual correspondiente al operador.
 * @param {string} operator - El operador matemático ('+', '-', 'x', '/').
 * @param {Array<[string, number]>} numerosAR - Los operandos.
 * @param {object} [options={}] - Opciones adicionales, como `isShortDivision`.
 * @returns {Promise<boolean>} - `true` si la operación se ejecutó, `false` si hubo un error de validación.
 */
export async function executeVisualOperation(operator, numerosAR, options = {}) {
    const OperationClass = operationClassMap[operator];
    if (!OperationClass) {
        errorHandler.mostrarError('invalidOperation');
        return false;
    }

    if (operator === 'x' && !errorHandler.validarMultiplicacion(numerosAR)) return false;
    if (operator === '/' && !errorHandler.validarDivision(numerosAR)) return false;
    if (operator === '%' && !errorHandler.validarModulo(numerosAR)) return false;
    if (operator === '^' && !errorHandler.validarPotencia(numerosAR)) return false;

    const op = (operator === '/') ? new OperationClass(numerosAR, salida, options.isShortDivision || false) : new OperationClass(numerosAR, salida);
    await op.execute();
    return true;
}