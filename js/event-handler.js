'use strict';

import { teclado, divVolver, keyboardButtons } from './dom-elements.js';
import * as Engine from './calculator-engine.js';
import * as UIManager from './ui-manager.js';

function handleButtonClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value) {
        Engine.writeToDisplay(value);
    } else if (action) {
        Engine.handleAction(action);
    }
}

function handleKeyboardInput(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    const key = event.key;
    const keyMap = {
        '+': '+', '-': '-', '*': 'x', 'x': 'x', 'X': 'x', '/': '/', '%': '%',
        '.': ',', ',': ',',
        'Enter': 'calculate', '=': 'calculate',
        'Backspace': 'delete',
        'Delete': 'clear', 'Escape': 'clear', 'c': 'clear', 'C': 'clear'
    };

    if (/[0-9]/.test(key)) {
        event.preventDefault();
        Engine.writeToDisplay(key);
    } else if (keyMap[key]) {
        event.preventDefault();
        const actionOrValue = keyMap[key];
        if (['calculate', 'delete', 'clear'].includes(actionOrValue)) {
            Engine.handleAction(actionOrValue);
        } else {
            Engine.writeToDisplay(actionOrValue);
        }
    }
}

export function setupEventListeners() {
    teclado.addEventListener('click', handleButtonClick);
    divVolver.addEventListener('click', handleButtonClick);
    document.addEventListener('keydown', handleKeyboardInput);
    window.addEventListener('resize', UIManager.applyResponsiveStyles);
    
    keyboardButtons.forEach(button => {
        button.addEventListener('click', UIManager.handleRippleEffect);
    });
}