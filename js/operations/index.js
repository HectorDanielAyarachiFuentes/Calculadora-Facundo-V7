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

// --- Re-exportar utilidades que sean útiles fuera del módulo ---
// `parsearNumeros` es un buen candidato porque se usa para preparar
// los datos ANTES de llamar a las funciones de operación.
export * from './utils/parsers.js';