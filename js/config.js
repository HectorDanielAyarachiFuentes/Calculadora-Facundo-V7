// =======================================================
// --- config.js ---
// Define y EXPORTA constantes, elementos DOM y mensajes.
// Ya no depende del orden de carga, puede ser importado donde se necesite.
// =======================================================
"use strict";

// --- Elementos del DOM ---
export const display = document.getElementById("display");
export const salida = document.getElementById("salida");
export const contenedor = document.getElementById("contenedor");
export const teclado = document.getElementById("teclado");
export const divVolver = document.getElementById("divvolver");
export const botExp = document.getElementById("botexp");
export const botNor = document.getElementById("botnor");
export const header = document.getElementsByTagName("header")[0];

// --- Mensajes Centralizados ---
export const errorMessages = {
    division1: "<p class='error'>El dividendo es cero, por lo tanto el resultado es cero.</p>",
    division2: "<p class='error'>El divisor es cero, no existe solución.</p>",
    division3: "<p class='error'>El dividendo y el divisor son cero, no existe solución.</p>",
    multiplicacion1: "<p class='error'>Multiplicar por cero da como resultado cero.</p>",
    multiplicacion2: "<p class='error'>El resultado es demasiado grande.</p>",
    raiz1: "<p class='error'>La raíz cuadrada de cero es cero.</p>",
    dFactorial1: "<p class='error'>No se puede descomponer el cero.</p>",
    invalidOperation: "<p class='error'>Operación inválida.</p>",
    invalidSqrtInput: "<p class='error'>Esta función solo acepta un número simple.</p>",
    integerSqrtRequired: "<p class='error'>La raíz cuadrada solo funciona con números enteros.</p>",
    negativeSqrt: "<p class='error'>No se puede calcular la raíz de un número negativo.</p>",
    nonExactSqrt: "<p class='error'>Este número no tiene una raíz cuadrada entera exacta.</p>",
    noDivisionCalculated: "<p class='error'>Primero realiza una división para usar esta función.</p>"
};