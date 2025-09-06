// =======================================================
// --- history.js (VERSIÓN COMPLETA Y CORREGIDA) ---
// Gestiona el historial de operaciones, incluyendo persistencia y renderizado.
// =======================================================
"use strict";

import { reExecuteOperationFromHistory } from './main.js';

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

        this.history.unshift(item);
        if (this.history.length > this.MAX_HISTORY_ITEMS) {
            this.history.pop();
        }
        this.saveHistory();
        HistoryPanel.renderHistory();
        HistoryPanel.highlightLastItem();
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
            li.innerHTML = `
                <span class="history-panel__input">${item.input}</span>
                <span class="history-panel__result">= ${item.result}</span>
            `;
            li.addEventListener('click', async () => {
                await reExecuteOperationFromHistory(item.input);
                this.close();
            });
            this.list.appendChild(li);
        });
    }

    // *** ¡FUNCIÓN CLAVE MEJORADA PARA RAÍZ CUADRADA, DIVISIÓN Y FACTORES! ***
    extractResultText(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

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
        
        // --- Caso 2: Factores Primos ---
        // Distintivo: tiene celdas de divisor pero NO de cociente.
        if (hasDivisorCells && !hasCocienteCells) {
            const factorCells = Array.from(tempDiv.querySelectorAll('.output-grid__cell--divisor'));
            factorCells.sort((a, b) => (parseFloat(a.style.top) || 0) - (parseFloat(b.style.top) || 0));
            const factors = factorCells.map(cell => cell.textContent);
            if (factors.length === 1 && factors[0] === '1') {
                return '1'; // Caso especial para factores(1)
            }
            return factors.join(' × ');
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

        return resultLineCells.map(cell => cell.textContent).join('');
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
        setTimeout(() => document.addEventListener('click', this.handleOutsideClick), 0);
    }

    close() {
        if (!this.isOpen()) return;
        this.panel.classList.remove('history-panel--open');
        document.removeEventListener('click', this.handleOutsideClick);
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