'use strict';

import {
    display,
    salida,
    teclado,
    divVolver,
    botExp,
    botNor,
    calculatorContainer,
    keyboardContainer
} from './dom-elements.js';
import { esperar } from '../operations/utils/dom-helpers.js';
import { settingsManager } from './settings.js';
import { soundManager } from './sound-manager.js';
 
/**
 * Muestra la pantalla de resultados y oculta el teclado.
 */
export function showResultScreen() {
    teclado.classList.add('keyboard--hidden');
    salida.classList.add('output-screen--visible');
    divVolver.classList.add('bottom-nav--visible');
}

/**
 * Muestra el teclado y oculta la pantalla de resultados.
 */
export function showKeyboardScreen() {
    teclado.classList.remove('keyboard--hidden');
    salida.classList.remove('output-screen--visible');
    divVolver.classList.remove('bottom-nav--visible');
}

/**
 * Actualiza la visibilidad de los botones de división (normal/expandida).
 * @param {boolean} isDivisionValid - Indica si la operación actual es una división válida.
 * @param {boolean} isDivext - Indica si el modo de división expandida está activo.
 */
export function updateDivisionButtons(isDivisionValid, isDivext) {
    if (isDivisionValid) {
        botExp.style.display = isDivext ? "none" : "inline-block";
        botNor.style.display = isDivext ? "inline-block" : "none";
    } else if (botExp && botNor) {
        botExp.style.display = "none";
        botNor.style.display = "none";
    }
}

/**
 * Habilita o deshabilita los botones del teclado según el estado del display.
 * @param {string} displayContent - El contenido actual del display.
 */
export function updateKeyboardState(displayContent) {
    const esSoloCero = displayContent === '0';
    const hasBinaryOperatorInExpression = /[+\-x/%^]/.test(displayContent.slice(displayContent.startsWith('-') ? 1 : 0).replace(/^[0-9,]+/, ''));
    const partes = displayContent.split(/[+\-x/%^]/);
    const ultimoNumero = partes[partes.length - 1];
    const demasiadosCaracteres = displayContent.length >= 21;
    const ultimoNumeroDemasiadoLargo = ultimoNumero.length >= 15;
    const deshabilitarNumeros = demasiadosCaracteres || ultimoNumeroDemasiadoLargo;

    document.querySelectorAll('.keyboard__button--number').forEach(btn => {
        btn.disabled = deshabilitarNumeros;
    });

    document.querySelectorAll('[data-value="+"], [data-value="-"], [data-value="x"], [data-value="/"], [data-value="%"], [data-value="^"]').forEach(btn => {
        btn.disabled = demasiadosCaracteres || hasBinaryOperatorInExpression || esSoloCero || displayContent.endsWith(',');
    });

    const puedeAnadirComa = !ultimoNumero.includes(',');
    const btnComa = document.querySelector('[data-value=","]');
    if (btnComa) btnComa.disabled = !puedeAnadirComa || deshabilitarNumeros;

    const esNumeroEnteroSimple = /^\d+$/.test(displayContent) && !esSoloCero && !hasBinaryOperatorInExpression;
    document.querySelectorAll('[data-action="primos"], [data-action="raiz"]').forEach(btn => {
        btn.disabled = !esNumeroEnteroSimple;
    });

    // Validar funciones unarias que aceptan decimales
    const esNumeroPositivo = /^[0-9,]+$/.test(displayContent) && !esSoloCero && !hasBinaryOperatorInExpression && parseFloat(displayContent.replace(',', '.')) > 0;
    document.querySelectorAll('[data-action="ln"], [data-action="log"]').forEach(btn => {
        btn.disabled = !esNumeroPositivo;
    });

    // Validar funciones unarias que aceptan cualquier número (positivo, negativo, decimal)
    const esNumeroValido = /^-?[0-9,]+$/.test(displayContent) && !hasBinaryOperatorInExpression && !displayContent.endsWith(',');
    document.querySelectorAll('[data-action="sin"], [data-action="cos"]').forEach(btn => {
        btn.disabled = !esNumeroValido || esSoloCero;
    });

    const esCalculable = /^-?[0-9,]+\s*[+\-x/%^]\s*-?[0-9,]+$/.test(displayContent);
    const btnIgual = document.querySelector('[data-action="calculate"]');
    if (btnIgual) btnIgual.disabled = !esCalculable;
}

/**
 * Aplica estilos dinámicos para la vista de escritorio o los resetea para móvil.
 */
export function applyResponsiveStyles() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Marcadores de estado en el body para control granular y accesible
    document.body.classList.toggle('is-mobile', width <= 600);
    document.body.classList.toggle('is-tablet', width > 600 && width <= 1024);
    document.body.classList.toggle('is-desktop', width > 1024);
    document.body.classList.toggle('is-landscape-mobile', height <= 540 && width > height);

    // Dynamic viewport units para navegadores móviles con barra de dirección plegable
    const vh = height * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Limpieza de estilos inline antiguos para permitir que SCSS controle el diseño de forma fluida
    if (calculatorContainer) {
        calculatorContainer.style.width = '';
        calculatorContainer.style.paddingTop = '';
    }
    if (display) {
        display.style.height = '';
        display.style.fontSize = '';
    }
    if (keyboardContainer) {
        keyboardContainer.style.width = '';
        keyboardContainer.style.height = '';
    }
    if (teclado) {
        teclado.style.fontSize = '';
    }
    if (botExp) {
        botExp.style.fontSize = '';
        botExp.style.paddingTop = '';
    }
    if (botNor) {
        botNor.style.fontSize = '';
        botNor.style.paddingTop = '';
    }
}
}

/**
 * Configura la animación del título de la página cuando la pestaña pierde el foco.
 */
export function setupTitleAnimation() {
    let baseTitle = "Calculadora Facundo 🧮";
    let altTitle = "¡Regresa! 😢 🧮 ";
    let scrollTitle = altTitle + " ";
    let interval, timeout, pos = 0;

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearInterval(interval);
            clearTimeout(timeout);
            pos = 0;
            interval = setInterval(() => {
                document.title = scrollTitle.substring(pos) + scrollTitle.substring(0, pos);
                pos = (pos + 1) % scrollTitle.length;
            }, 400);
        } else {
            clearInterval(interval);
            clearTimeout(timeout);
            document.title = "Gracias por volver 😊";
            timeout = setTimeout(() => { document.title = baseTitle; }, 2000);
        }
    });
}

/**
 * Añade un efecto de onda (ripple) a los botones al hacer clic.
 * @param {Event} e - El evento de clic.
 */
export function handleRippleEffect(e) {
    // Disparar feedback sensorial usando los módulos importados
    settingsManager.triggerHapticFeedback();
    soundManager.playSound('click');

    const button = e.currentTarget;
    if (button.querySelector('.ripple')) button.querySelector('.ripple').remove();
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.width = ripple.style.height = `${Math.max(button.clientWidth, button.clientHeight)}px`;
    ripple.style.left = `${e.clientX - rect.left - ripple.offsetWidth / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - ripple.offsetHeight / 2}px`;
    button.appendChild(ripple);
}

/**
 * Activa un efecto "glitch" en el display.
 * @param {string} text - El texto a mostrar durante el glitch.
 */
export async function triggerGlitchEffect(text) {
    // Respetar el ajuste del usuario
    if (!settingsManager.settings.glitchEffectEnabled) {
        return;
    }

    display.setAttribute('data-text', text);
    display.classList.add('glitch');
    await esperar(300); // Usamos esperar() para que la duración respete el multiplicador
    display.classList.remove('glitch');
}

/**
 * Inicializa el estado de la UI al cargar la página.
 */
export function init() {
    applyResponsiveStyles();
    setupTitleAnimation();
    display.innerHTML = '0';
    updateKeyboardState('0');
    updateDivisionButtons(false, false);
    calculatorContainer.style.opacity = "1";
}