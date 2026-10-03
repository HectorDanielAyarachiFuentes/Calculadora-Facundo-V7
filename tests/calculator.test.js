
import { jest } from '@jest/globals';

// Setup DOM before imports
document.body.innerHTML = `
    <div id="display">0</div>
    <div id="salida"></div>
    <div id="cuerpoteclado"></div>
    <div id="divvolver"></div>
    <button id="botexp"></button>
    <button id="botnor"></button>
    <div id="teclado"></div>
    <div id="container"></div>
`;

// Mock Config to avoid other dependencies
jest.unstable_mockModule('../js/calculadora/config.js', () => ({
    salida: document.getElementById('salida'),
    contenedor: document.getElementById('container'),
    teclado: document.getElementById('teclado'),
    divVolver: document.getElementById('divvolver'),
    botExp: document.getElementById('botexp'),
    botNor: document.getElementById('botnor'),
    errorMessages: {}
}));


// Mock Operations to avoid complex visual logic execution
const mockExecuteVisualOperation = jest.fn().mockResolvedValue(true);
const mockParsearNumeros = jest.fn().mockReturnValue([1, 2]);

jest.unstable_mockModule('../js/operations/index.js', () => ({
    parsearNumeros: mockParsearNumeros,
    executeVisualOperation: mockExecuteVisualOperation,
    desFacPri: jest.fn().mockResolvedValue(true),
    raizCuadrada: jest.fn().mockResolvedValue(true),
    logaritmo: jest.fn().mockResolvedValue(true),
    logaritmoLog: jest.fn().mockResolvedValue(true),
    seno: jest.fn().mockResolvedValue(true),
    coseno: jest.fn().mockResolvedValue(true)
}));

// Mock HistoryManager
const mockHistoryAdd = jest.fn();
jest.unstable_mockModule('../js/calculadora/history.js', () => ({
    HistoryManager: {
        add: mockHistoryAdd,
        init: jest.fn()
    }
}));

// Mock UI Manager
jest.unstable_mockModule('../js/calculadora/ui-manager.js', () => ({
    updateKeyboardState: jest.fn(),
    updateDivisionButtons: jest.fn(),
    showResultScreen: jest.fn(),
    triggerGlitchEffect: jest.fn(),
    showKeyboardScreen: jest.fn()
}));

// Dynamic import of the module under test
const { writeToDisplay, calculate } = await import('../js/calculadora/calculator-engine.js');
const { display } = await import('../js/calculadora/dom-elements.js');

describe('Calculator Engine', () => {
    beforeEach(() => {
        display.innerHTML = '0';
        mockExecuteVisualOperation.mockClear();
        mockHistoryAdd.mockClear();
    });

    test('writeToDisplay should update display with numbers', () => {
        writeToDisplay('1');
        expect(display.innerHTML).toBe('1');
        writeToDisplay('2');
        expect(display.innerHTML).toBe('12');
    });

    test('writeToDisplay should handle operators', () => {
        writeToDisplay('5');
        writeToDisplay('+');
        expect(display.innerHTML).toBe('5+');
        writeToDisplay('3');
        expect(display.innerHTML).toBe('5+3');
    });

    test('writeToDisplay should clear display with "c"', () => {
        writeToDisplay('5');
        writeToDisplay('c');
        expect(display.innerHTML).toBe('0');
    });

    test('calculate should trigger operation execution', async () => {
        // Setup inputs
        display.innerHTML = "5+5";

        await calculate();

        expect(mockExecuteVisualOperation).toHaveBeenCalled();
        expect(mockHistoryAdd).toHaveBeenCalled();
    });

    test('calculate should gracefully handle input without operators without throwing error', async () => {
        display.innerHTML = "42";
        await expect(calculate()).resolves.not.toThrow();
        expect(mockExecuteVisualOperation).not.toHaveBeenCalled();
    });

    test('writeToDisplay should delete character with "del"', () => {
        display.innerHTML = "123";
        writeToDisplay('del');
        expect(display.innerHTML).toBe('12');
    });
});
