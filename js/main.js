// =======================================================
// --- main.js (VERSIÓN OPTIMIZADA) ---
// =======================================================
'use strict';

// --- IMPORTACIONES ---
import {
  suma, resta, multiplica, divide, divideExt,
  desFacPri, raizCuadrada, parsearNumeros
} from './operations/index.js';
import {
  // *** CORRECCIÓN: 'display' se define aquí, así que lo quito de la importación para evitar duplicados.
  salida, contenedor, teclado, divVolver,
  botExp, botNor
} from './config.js';
import { crearMensajeError } from './operations/utils/dom-helpers.js';
import { HistoryManager, HistoryPanel } from './history.js';
import { ThemeSwitcher } from './theme-switcher.js';
import { ErrorHandlerCentralized } from './error-handler-centralized.js';

// --- ELEMENTOS DEL DOM (centralizados para evitar duplicados) ---
// *** CORRECCIÓN: Definimos 'display' aquí una sola vez.
const display = document.getElementById('display');

// --- VARIABLES DE ESTADO ---
let w;
let divext = false;
let lastDivisionState = {
    operacionInput: '',
    numerosAR: null,
    tipo: ''
};

// --- INICIALIZACIÓN Y EVENTOS ---
function alCargar() {
    // Inicializar dimensiones responsivas
    w = Math.min(window.innerHeight / 1.93, window.innerWidth / 1.5);
    contenedor.style.width = `${w}px`;
    contenedor.style.paddingTop = `${(w * 1.56) * 0.04}px`;
    display.style.fontSize = `${w * 0.085}px`;
    display.style.height = `${w * 0.11 * 1.11}px`;
    const cuerpoteclado = document.getElementById("cuerpoteclado");
    cuerpoteclado.style.width = `${0.95 * w}px`;
    cuerpoteclado.style.height = `${0.95 * w}px`;
    teclado.style.fontSize = `${0.1 * w}px`;
    const volver = document.getElementById("volver");
    volver.style.fontSize = `${0.15 * w}px`;
    volver.style.padding = `${0.05 * w}px ${0.03 * w}px`;
    botExp.style.fontSize = `${0.08 * w}px`;
    botExp.style.paddingTop = `${0.05 * w}px`;
    botNor.style.fontSize = `${0.08 * w}px`;
    botNor.style.paddingTop = `${0.05 * w}px`;
    contenedor.style.opacity = "1";
    
    // Inicializar el cambiador de tema
    new ThemeSwitcher();
    display.innerHTML = '0';
    activadoBotones('0');
    HistoryManager.init();
    HistoryPanel.init();
    actualizarEstadoDivisionUI(false);
    setupEventListeners();
    setupTitleAnimation(); // *** CORRECCIÓN: Centralizamos la inicialización de la animación del título.
}

function setupEventListeners() {
    teclado.addEventListener('click', handleButtonClick);
    divVolver.addEventListener('click', handleButtonClick);
    document.addEventListener('keydown', handleKeyboardInput);
    window.addEventListener('resize', alCargar);
    
    // *** CORRECCIÓN: El bucle para el efecto ripple va aquí, una sola vez.
    document.querySelectorAll('.keyboard__button').forEach(button => {
        button.addEventListener('click', handleRippleEffect);
    });
}

// --- MANEJADORES DE ACCIONES ---
function handleButtonClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const value = button.dataset.value;
    const action = button.dataset.action;
    if (value) {
        escribir(value);
    } else if (action) {
        handleAction(action);
    }
}

function handleKeyboardInput(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    const key = event.key;
    if (/[0-9+\-*/=.,cC]/.test(key) || ['Enter', 'Backspace', 'Delete', 'Escape', 'x', 'X'].includes(key)) {
        event.preventDefault();
    }
    if (/[0-9]/.test(key)) escribir(key);
    else if (key === '+') escribir('+');
    else if (key === '-') escribir('-');
    else if (key === '*' || key === 'x' || key === 'X') escribir('x');
    else if (key === '/') escribir('/');
    else if (key === '.' || key === ',') escribir(',');
    else if (key === 'Enter' || key === '=') {
        const btnIgual = document.querySelector('[data-action="calculate"]');
        if (btnIgual && !btnIgual.disabled) calcular();
    } else if (key === 'Backspace') escribir('del');
    else if (key === 'Delete' || key === 'Escape') escribir('c');
}

// *** CORRECCIÓN: Nueva función para manejar el efecto Ripple y mantener el código limpio.
function handleRippleEffect(e) {
    const button = e.currentTarget;
    const oldRipple = button.querySelector('.ripple');
    if (oldRipple) {
        oldRipple.remove();
    }

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(button.clientWidth, button.clientHeight);
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    ripple.style.width = ripple.style.height = `${size}px`;
    
    button.appendChild(ripple);
}

export async function reExecuteOperationFromHistory(historyInput) {
  bajarteclado();
  salida.innerHTML = '';
  let calculationSuccessful = false;
  const primosMatch = historyInput.match(/^factores\((\d+)\)$/);
  const raizMatch = historyInput.match(/^√\((.+)\)$/);
  const errorHandler = new ErrorHandlerCentralized(salida);
  
  try {
    if (primosMatch) {
      const numero = primosMatch[1];
      display.innerHTML = numero;
      // Validar factores primos antes de ejecutar
    if (errorHandler.validarFactoresPrimos && errorHandler.validarFactoresPrimos(salida, numero)) {
        await desFacPri(numero);
      }
    } else if (raizMatch) {
      const numero = raizMatch[1];
      display.innerHTML = numero;
      // Validar raíz cuadrada antes de ejecutar
    if (errorHandler.validarRaizCuadrada && errorHandler.validarRaizCuadrada(salida, numero)) {
        await raizCuadrada(numero);
      }
    } else {
      display.innerHTML = historyInput;
      await calcular(false);
    }
    calculationSuccessful = !salida.querySelector('.output-screen__error-message');
  } catch (error) {
    console.error('Error durante la re-ejecución:', error);
    errorHandler.mostrarError('invalidOperation', { error });
    calculationSuccessful = false;
  } finally {
    display.innerHTML = historyInput;
    activadoBotones(display.innerHTML);
  }
  return calculationSuccessful;
}

async function handleAction(action) {
    switch (action) {
        case 'view-screen': bajarteclado(); break;
        case 'calculate': await calcular(true); break;
        case 'clear': escribir('c'); break;
        case 'delete': escribir('del'); break;
        case 'hide-screen': subirteclado(); break;
        case 'divide-expanded':
        case 'divide-normal':
            divext = (action === 'divide-expanded');
            if (lastDivisionState.operacionInput) {
                await reExecuteOperationFromHistory(lastDivisionState.operacionInput);
            } else {
                actualizarEstadoDivisionUI(false);
            }
            break;
        case 'primos': {
            const numero = display.innerHTML;
            const inputParaHistorial = `factores(${numero})`;
            const success = await reExecuteOperationFromHistory(inputParaHistorial); 
            if (success) HistoryManager.add({ input: inputParaHistorial, visualHtml: salida.innerHTML });
            break;
        }
        case 'raiz': {
            const numero = display.innerHTML;
            const inputParaHistorial = `√(${numero})`;
            const success = await reExecuteOperationFromHistory(inputParaHistorial); 
            if (success) HistoryManager.add({ input: inputParaHistorial, visualHtml: salida.innerHTML });
            break;
        }
        default: console.warn(`Acción desconocida: ${action}`);
    }
}

// --- LÓGICA DE LA APLICACIÓN ---
function escribir(t) {
    const currentDisplay = display.innerHTML;
    const isOperator = ['+', '-', 'x', '/'].includes(t);
    const hasBinaryOperatorInExpression = /[+\-x/]/.test(currentDisplay.slice(currentDisplay.startsWith('-') ? 1 : 0).replace(/^[0-9,]+/, ''));

    if (t === "c") {
        display.innerHTML = "0";
    } else if (t === "del") {
        display.innerHTML = currentDisplay.slice(0, -1) || "0";
    }
    else if (isOperator) {
        const lastChar = currentDisplay.slice(-1);
        const lastCharIsOperator = ['+', '-', 'x', '/'].includes(lastChar);
        if (hasBinaryOperatorInExpression && !lastCharIsOperator) return;
        if (lastCharIsOperator) {
            if (lastChar === t) return;
            display.innerHTML = currentDisplay.slice(0, -1) + t;
        } else if (currentDisplay === "0") {
            if (t === '-') display.innerHTML = t;
            else return;
        } else if (currentDisplay.endsWith(',')) return;
        else display.innerHTML = currentDisplay + t;
    }
    else {
        if (t === ',' && currentDisplay.endsWith(',')) return;
        display.innerHTML = (currentDisplay === "0" && t !== ',') ? t : currentDisplay + t;
    }
    
    activadoBotones(display.innerHTML);
    actualizarEstadoDivisionUI(false); 
}

async function calcular(addToHistory = true) {
  const entrada = display.innerHTML;
  
const errorHandler = new ErrorHandlerCentralized(salida);

// Validar la operación usando el sistema centralizado de manejo de errores
if (!errorHandler.validarOperacion(entrada)) {
  bajarteclado();
  actualizarEstadoDivisionUI(false);
  errorHandler.mostrarError('invalidOperation');
  return;
}

  // Animación de glitch
  display.setAttribute('data-text', entrada);
  display.classList.add('glitch');
  setTimeout(() => {
    display.classList.remove('glitch');
  }, 300); // La duración debe coincidir con la animación CSS

  const operador = entrada.match(/[+\-x\/]/)[0];
  const numerosAR = parsearNumeros(entrada, operador);
  
  bajarteclado();
  salida.innerHTML = '';

  try {
    switch (operador) {
      case '+':
        await suma(numerosAR);
        break;
      case '-':
        await resta(numerosAR);
        break;
      case 'x':
        // Validar multiplicación antes de ejecutarla
        if (errorHandler.validarMultiplicacion(salida, numerosAR)) {
          await multiplica(numerosAR);
        }
        break;
      case '/':
        // Validar división antes de ejecutarla
        if (errorHandler.validarDivision(salida, numerosAR)) {
          lastDivisionState = { operacionInput: entrada, numerosAR, tipo: 'division' };
          divext ? await divideExt(numerosAR) : await divide(numerosAR);
        }
        break;
      default:
    errorHandler.mostrarError('invalidOperation');
    }
} catch (error) {
  console.error('Error durante el cálculo:', error);
  errorHandler.mostrarError('invalidOperation', { error });
}
  
  const calculationError = salida.querySelector('.output-screen__error-message');
  actualizarEstadoDivisionUI(operador === '/' && !calculationError);

  if (addToHistory && !calculationError) {
    HistoryManager.add({ input: entrada, visualHtml: salida.innerHTML });
  }
  activadoBotones(display.innerHTML);
}

// --- FUNCIONES DE UI ---
function subirteclado() {
    teclado.classList.remove('keyboard--hidden');
    salida.classList.remove('output-screen--visible');
    divVolver.classList.remove('bottom-nav--visible');
    activadoBotones(display.innerHTML); 
}

function bajarteclado() {
    teclado.classList.add('keyboard--hidden');
    salida.classList.add('output-screen--visible');
    divVolver.classList.add('bottom-nav--visible');
}

function actualizarEstadoDivisionUI(esDivisionValida) {
    if (esDivisionValida) {
        botExp.style.display = divext ? "none" : "inline-block";
        botNor.style.display = divext ? "inline-block" : "none";
    }
    else if (botExp && botNor) { 
        botExp.style.display = "none";
        botNor.style.display = "none";
        lastDivisionState = { operacionInput: '', numerosAR: null, tipo: '' }; 
    }
}

function activadoBotones(contDisplay) {
    const esSoloCero = contDisplay === '0';
    const hasBinaryOperatorInExpression = /[+\-x/]/.test(contDisplay.slice(contDisplay.startsWith('-') ? 1 : 0).replace(/^[0-9,]+/, ''));
    const partes = contDisplay.split(/[+\-x/]/);
    const ultimoNumero = partes[partes.length - 1];
    const demasiadosCaracteres = contDisplay.length >= 21;
    const ultimoNumeroDemasiadoLargo = ultimoNumero.length >= 15;
    const deshabilitarNumeros = demasiadosCaracteres || ultimoNumeroDemasiadoLargo;

    document.querySelectorAll('.keyboard__button--number').forEach(btn => {
        btn.disabled = deshabilitarNumeros;
    });

    document.querySelectorAll('[data-value="+"], [data-value="-"], [data-value="x"], [data-value="/"]').forEach(btn => {
        if (demasiadosCaracteres || hasBinaryOperatorInExpression || esSoloCero || contDisplay.endsWith(',')) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });

    const puedeAnadirComa = !ultimoNumero.includes(',');
    const btnComa = document.querySelector('[data-value=","]');
    if (btnComa) btnComa.disabled = !puedeAnadirComa || deshabilitarNumeros;

    const esNumeroEnteroSimple = /^\d+$/.test(contDisplay) && !esSoloCero && !hasBinaryOperatorInExpression;
    document.querySelectorAll('[data-action="primos"], [data-action="raiz"]').forEach(btn => {
        btn.disabled = !esNumeroEnteroSimple;
    });

    const esCalculable = /^-?[0-9,]+\s*[+\-x/]\s*-?[0-9,]+$/.test(contDisplay);
    const btnIgual = document.querySelector('[data-action="calculate"]');
    if (btnIgual) btnIgual.disabled = !esCalculable;
}

// --- CÓDIGO DE ANIMACIÓN DEL TÍTULO (Refactorizado) ---
function setupTitleAnimation() {
    let baseTitle = "Calculadora Facundo 🧮";
    let altTitle = "¡Regresa! 😢 🧮 ";
    let scrollTitle = altTitle + " ";
    let interval;
    let pos = 0;
    let timeout;

    function startTitleAnimation() {
        clearInterval(interval);
        clearTimeout(timeout);
        pos = 0;
        interval = setInterval(() => {
            document.title = scrollTitle.substring(pos) + scrollTitle.substring(0, pos);
            pos = (pos + 1) % scrollTitle.length;
        }, 400); // *** CORRECCIÓN: Ajusté el tiempo a 400ms para que sea menos frenético
    }

    function stopTitleAnimation() {
        clearInterval(interval);
        clearTimeout(timeout);
        document.title = "Gracias por volver 😊";
        timeout = setTimeout(() => {
            document.title = baseTitle;
        }, 2000);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            startTitleAnimation();
        } else {
            stopTitleAnimation();
        }
    });
}

// --- INICIO DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', alCargar);