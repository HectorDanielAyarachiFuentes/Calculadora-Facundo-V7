// =======================================================
// --- history.js (VERSIÓN COMPLETA Y CORREGIDA) ---
// Gestiona el historial de operaciones, incluyendo persistencia y renderizado.
// =======================================================
"use strict";

import { reExecuteOperationFromHistory } from './main.js';
import { SpeechService } from '../modal/bostraplectornumeros.js';

/**
 * Genera textos legibles para la operación y para el lector de pantalla.
 * @param {{input: string, result: string}} item - El objeto del historial.
 * @returns {{operation: string, fullText: string}} - Objeto con el texto de la operación y el texto completo para hablar.
 */
function generateReadableText(item) {
    // --- MEJORA DE ROBUSTEZ: Asegurarse de que input y result sean cadenas ---
    // Si item o sus propiedades son undefined, se usarán cadenas vacías para evitar errores.
    const input = item?.input || '';
    const result = item?.result || '';

    // --- Helpers para frases y lectura de números ---
    const getEqualsPhrase = () => {
        const phrases = ["es igual a", "nos da como resultado", "resulta en", "es"];
        return phrases[Math.floor(Math.random() * phrases.length)];
    };
    // Se añade `(res || '')` para evitar errores si el resultado es undefined.
    const readResult = (res) => (res || '').replace(/,/g, ' coma ');

    // --- Casos especiales ---
    const primeMatch = input.match(/^factores\((\d+)\)$/);
    if (primeMatch) {
        const number = primeMatch[1];
        // --- CORRECCIÓN: Asegurarse de que 'result' no esté vacío antes de procesarlo ---
        // Si 'result' es una cadena vacía, 'readableResult' será una cadena vacía también,
        // evitando que se convierta en 'undefined' y se concatene erróneamente.
        const readableResult = result ? result.replace(/\^/g, ' elevado a ').replace(/×/g, ' por ') : '';
        return {
            operation: `Factores de ${number}`,
            fullText: `La descomposición en factores primos de ${number} es ${readableResult}`
        };
    }

    const sqrtMatch = input.match(/^√\((.+)\)$/);
    if (sqrtMatch) {
        const number = sqrtMatch[1];
        return {
            operation: `Raíz de ${number}`,
            fullText: `La raíz cuadrada de ${number} ${getEqualsPhrase()} ${readResult(result)}`
        };
    }

    const logMatch = input.match(/^log\((.+)\)$/);
    if (logMatch) {
        const number = logMatch[1];
        return {
            operation: `log(${number})`,
            fullText: `El logaritmo en base 10 de ${number} ${getEqualsPhrase()} ${readResult(result)}`
        };
    }

    const lnMatch = input.match(/^ln\((.+)\)$/);
    if (lnMatch) {
        const number = lnMatch[1];
        return {
            operation: `ln(${number})`,
            fullText: `El logaritmo natural de ${number} ${getEqualsPhrase()} ${readResult(result)}`
        };
    }

    if (input.includes('^')) {
        const parts = input.split('^');
        const base = parts[0].trim();
        const exponente = parts[1].trim();
        return {
            operation: `${base} ^ ${exponente}`,
            fullText: `${base} elevado a ${exponente} ${getEqualsPhrase()} ${readResult(result)}`
        };
    }

    if (input.includes('%')) {
        const parts = input.split('%');
        const dividendo = parts[0].trim();
        const divisor = parts[1].trim();
        return {
            operation: `${dividendo} % ${divisor}`,
            fullText: `El resto de dividir ${dividendo} entre ${divisor} ${getEqualsPhrase()} ${readResult(result)}`
        };
    }

    // --- Default para operaciones aritméticas ---
    const readableInput = input.replace(/\+/g, ' más ').replace(/(?<!^)-/g, ' menos ').replace(/x/g, ' por ').replace(/\//g, ' dividido entre ');
    return {
        operation: readableInput,
        fullText: `La operación ${readableInput}, ${getEqualsPhrase()} ${readResult(result)}`
    };
}

class HistoryManagerClass {
    constructor() {
        this.history = [];
        this.MAX_HISTORY_ITEMS = 10;
        this.HISTORY_STORAGE_KEY = 'calculatorHistory';
    }

    init() {
        this.loadHistory();
        HistoryPanel.renderHistory();
    }

    async add(item) {
        // Evita añadir duplicados consecutivos
        const duplicateIndex = this.history.findIndex(existingItem => existingItem.input === item.input);
        if (duplicateIndex !== -1) {
            alert('¡Oye! Ya has realizado esta operación antes. ¡Mira el historial!');
            if (!HistoryPanel.isOpen()) {
                HistoryPanel.open();
            }
            HistoryPanel.highlightItem(duplicateIndex);
            await reExecuteOperationFromHistory(this.history[duplicateIndex].input);
            return;
        }

        // Si el resultado no viene pre-calculado, lo extraemos del HTML visual.
        // Esta es la parte crítica que ahora funcionará correctamente.
        if (!item.result) {
            item.result = HistoryPanel.extractResultText(item.visualHtml);
        }

        // SOLUCIÓN: Eliminar el HTML visual antes de guardar en el historial.
        // El `visualHtml` es muy grande y llena el localStorage rápidamente.
        // Solo lo necesitamos para extraer el texto del resultado; una vez hecho,
        // podemos descartarlo para evitar el error 'QuotaExceededError'.
        delete item.visualHtml;

        this.history.unshift(item);
        if (this.history.length > this.MAX_HISTORY_ITEMS) {
            this.history.pop();
        }
        this.saveHistory();
        HistoryPanel.renderHistory();
        HistoryPanel.highlightLastItem();
        HistoryPanel.announceNewItem(item);

        // --- MEJORA: Reproducir sonido de éxito ---
        if (window.soundManager) {
            window.soundManager.playSound('success');
        }
    }

    getHistory() { return this.history; }

    clearAll() {
        this.history = [];
        this.saveHistory();
        HistoryPanel.renderHistory();
    }

    loadHistory() {
        const storedHistory = localStorage.getItem(this.HISTORY_STORAGE_KEY);
        this.history = storedHistory ? JSON.parse(storedHistory) : [];
    }

    saveHistory() {
        localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(this.history));
    }
}

class HistoryPanelClass {
    constructor() {
        this.panel = document.getElementById('history-panel');
        this.list = document.getElementById('history-list');
        this.toggleButton = document.getElementById('history-toggle-btn');
        this.clearButton = document.getElementById('clear-history-btn');
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.confirmAndClear = this.confirmAndClear.bind(this);
    }

    init() {
        this.addEventListeners();
        this.renderHistory();
    }

    addEventListeners() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }
        if (this.clearButton) {
            this.clearButton.addEventListener('click', this.confirmAndClear);
        }
    }

    confirmAndClear() {
        if (window.confirm('¿Estás seguro de que quieres borrar todo el historial?\n\nEsta acción no se puede deshacer.')) {
            HistoryManager.clearAll();
        }
    }

    renderHistory() {
        if (!this.list) return;
        this.list.innerHTML = '';
        HistoryManager.getHistory().forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'history-panel__item';
            li.dataset.index = index;
 
            const { fullText } = generateReadableText(item);
 
            li.innerHTML = `
                <div class="history-panel__content" role="button" tabindex="0" aria-label="Re-ejecutar: ${item.input}">
                    <span class="history-panel__input">${item.input}</span>
                    <span class="history-panel__result">= ${item.result}</span>
                </div>
                <button class="history-panel__speak-btn" aria-label="Escuchar: ${fullText}">
                    <i class="fa-solid fa-volume-high"></i>
                </button>
            `;
 
            const contentDiv = li.querySelector('.history-panel__content');
            const speakBtn = li.querySelector('.history-panel__speak-btn');
 
            if (contentDiv) {
                const reExecute = async () => {
                    await reExecuteOperationFromHistory(item.input);
                    this.close();
                };
                contentDiv.addEventListener('click', reExecute);
                contentDiv.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        reExecute();
                    }
                });
            }
 
            if (speakBtn) {
                speakBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita que el clic se propague y re-ejecute la operación
                    // Detener cualquier otra reproducción en curso
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                    SpeechService.speak(fullText, 'es-ES');
                });
            }
 
            this.list.appendChild(li);
        });
    }

    announceNewItem(item) {
        const announcer = document.getElementById('sr-announcer');
        if (announcer) {
            const { fullText } = generateReadableText(item);
            announcer.textContent = `Nueva operación guardada: ${fullText}`;
        }
    }

    // *** ¡FUNCIÓN CLAVE MEJORADA PARA RAÍZ CUADRADA, DIVISIÓN Y FACTORES! ***
    extractResultText(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        // --- Caso para resultados simples (como potencia) ---
        const simpleResultEl = tempDiv.querySelector('.output-grid__result--simple');
        if (simpleResultEl) {
            // El texto es "base ^ exp = resultado"
            const text = simpleResultEl.textContent;
            const resultPart = text.split('=').pop();
            if (resultPart) return resultPart.trim();
        }

        // --- Caso nuevo y prioritario: Factores Primos (usa un elemento de resultado dedicado) ---
        const primeResultEl = tempDiv.querySelector('.output-grid__result');
        if (primeResultEl && primeResultEl.textContent.includes('Factores primos:')) {
            // El texto es "Factores primos: 2^2 × 5"
            const text = primeResultEl.textContent;
            const resultPart = text.split(': ')[1];
            if (resultPart) return resultPart.trim();
        }

        // --- Caso prioritario: Raíz Cuadrada ---
        // Distintivo: tiene el elemento con clase 'output-grid__radical'.
        const isSquareRoot = tempDiv.querySelector('.output-grid__radical');
        if (isSquareRoot) {
            const resultCells = Array.from(tempDiv.querySelectorAll('.output-grid__cell--cociente'));
            
            if (resultCells.length === 0) {
                 const error = tempDiv.querySelector('.output-screen__error-message');
                 if (error) return error.textContent.trim();
                 return 'Resultado no disponible';
            }
            
            // Ordenar las celdas del resultado por su posición horizontal.
            resultCells.sort((a, b) => (parseFloat(a.style.left) || 0) - (parseFloat(b.style.left) || 0));
            
            // Unir el texto de cada celda para formar el resultado final.
            const rawResult = resultCells.map(cell => cell.textContent).join('');
            
            return rawResult.replace('.', ',');
        }

        // --- Caso 1: División ---
        // Distintivo: tiene celdas de divisor Y de cociente.
        const hasDivisorCells = tempDiv.querySelector('.output-grid__cell--divisor');
        const hasCocienteCells = tempDiv.querySelector('.output-grid__cell--cociente');
        
        if (hasDivisorCells && hasCocienteCells) {
            const cocienteCellsArr = Array.from(tempDiv.querySelectorAll('.output-grid__cell--cociente'));
            cocienteCellsArr.sort((a, b) => (parseFloat(a.style.left) || 0) - (parseFloat(b.style.left) || 0));
            const rawResult = cocienteCellsArr.map(cell => cell.textContent).join('');
            return rawResult.replace('.', ',');
        }
        
        // --- Caso 3: Resto de operaciones (Suma, Resta, Multiplicación) ---
        // El resultado está en la línea más baja de celdas 'cociente' o 'producto'.
        const candidateCells = tempDiv.querySelectorAll('.output-grid__cell--cociente, .output-grid__cell--producto');

        if (candidateCells.length === 0) {
            const error = tempDiv.querySelector('.output-screen__error-message');
            if (error) return error.textContent.trim();
            return 'Resultado no disponible'; 
        }

        const lines = new Map();
        candidateCells.forEach(cell => {
            const top = Math.round(parseFloat(cell.style.top) || 0);
            if (!lines.has(top)) {
                lines.set(top, []);
            }
            lines.get(top).push(cell);
        });

        if (lines.size === 0) return "Error al procesar resultado";

        const lowestLineY = Math.max(...lines.keys());
        const resultLineCells = lines.get(lowestLineY);

        resultLineCells.sort((a, b) => {
            const leftA = parseFloat(a.style.left) || 0;
            const leftB = parseFloat(b.style.left) || 0;
            return leftA - leftB;
        });

        // --- CORRECCIÓN DE ROBUSTEZ DEFINITIVA ---
        // Al mapear las celdas, filtramos cualquier texto que sea literalmente "undefined".
        // Esto puede ser generado por módulos de operación con errores y es la causa
        // de resultados extraños como "123undefined45". Con este filtro, el resultado será limpio.
        return resultLineCells.map(cell => cell.textContent).filter(text => text !== 'undefined').join('');
    }

    // --- Lógica del panel (sin cambios) ---
    handleOutsideClick(event) {
        if (this.isOpen() && !this.panel.contains(event.target) && !this.toggleButton.contains(event.target)) {
            this.close();
        }
    }

    isOpen() {
        return this.panel.classList.contains('history-panel--open');
    }

    open() {
        if (this.isOpen()) return;
        this.panel.classList.add('history-panel--open');
        this.panel.setAttribute('aria-hidden', 'false');
        this.toggleButton.setAttribute('aria-expanded', 'true');
        setTimeout(() => document.addEventListener('click', this.handleOutsideClick), 0);

        // Mover foco al panel para navegación por teclado
        const firstItem = this.list.querySelector('.history-panel__item');
        if (firstItem) {
            firstItem.focus();
        } else {
            this.panel.focus();
        }
    }

    close() {
        if (!this.isOpen()) return;
        this.panel.classList.remove('history-panel--open');
        this.panel.setAttribute('aria-hidden', 'true');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', this.handleOutsideClick);

        // Devolver el foco al botón que abrió el panel
        this.toggleButton.focus();
    }

    toggle() {
        this.isOpen() ? this.close() : this.open();
    }

    highlightItem(index) {
        const itemToHighlight = this.list.querySelector(`.history-panel__item[data-index="${index}"]`);
        if (itemToHighlight) {
            itemToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            itemToHighlight.classList.add('history-item-highlight');
            setTimeout(() => {
                itemToHighlight.classList.remove('history-item-highlight');
            }, 1500);
        }
    }

    highlightLastItem() {
        this.highlightItem(0);
    }
}

export const HistoryManager = new HistoryManagerClass();
export const HistoryPanel = new HistoryPanelClass();