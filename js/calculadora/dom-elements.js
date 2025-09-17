'use strict';

// Importa elementos del DOM desde el archivo de configuración central.
// Esto mantiene la consistencia y evita la duplicación de selectores.
import {
    salida as salidaElement,
    contenedor as contenedorElement,
    teclado as tecladoElement,
    divVolver as divVolverElement,
    botExp as botExpElement,
    botNor as botNorElement
} from './config.js';

// Re-exporta los elementos con nombres más genéricos y añade los que faltan.
export const display = document.getElementById('display');
export const salida = salidaElement;
export const teclado = tecladoElement;
export const divVolver = divVolverElement;
export const botExp = botExpElement;
export const botNor = botNorElement;
export const keyboardButtons = document.querySelectorAll('.keyboard__button');
export const calculatorContainer = contenedorElement;
export const keyboardContainer = document.getElementById('cuerpoteclado');