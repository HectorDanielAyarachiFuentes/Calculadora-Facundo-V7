# Ejemplos de Implementación para Mejoras

Este documento proporciona ejemplos concretos de código para implementar algunas de las mejoras recomendadas en el documento principal.

## Optimización de Código

### Función de Utilidad Compartida para Operaciones

```javascript
// operations/utils/operation-helpers.js
"use strict";

import { calculateLayout } from './layout-calculator.js';
import { crearCelda, crearFlechaLlevada, esperar } from './dom-helpers.js';
import { salida, errorMessages } from '../../config.js';

/**
 * Prepara los operandos normalizando su formato para alinear decimales
 * @param {Array<[string, number]>} numerosAR - Array de tuplas [valor, decimales]
 * @returns {Object} Objeto con operandos normalizados y metadatos
 */
export function prepararOperandos(numerosAR) {
    // Normalización para alinear decimales
    const partesOperandos = numerosAR.map(([valor, dec]) => {
        const valStr = valor.toString();
        const intPart = (dec === 0) ? valStr : ((valStr.length > dec) ? valStr.slice(0, valStr.length - dec) : '0');
        const decPart = (dec === 0) ? '' : valStr.slice(valStr.length - dec).padStart(dec, '0');
        return { intPart, decPart };
    });

    const maxIntLength = Math.max(...partesOperandos.map(p => p.intPart.length));
    const maxDecLength = Math.max(...partesOperandos.map(p => p.decPart.length));
    
    const displayWidth = maxIntLength + (maxDecLength > 0 ? 1 + maxDecLength : 0);
    const anchoGridEnCeldas = displayWidth + 1;
    const altoGridEnCeldas = numerosAR.length + 4;

    const operandosParaCalcular = partesOperandos.map(p =>
        p.intPart.padStart(maxIntLength, '0') + p.decPart.padEnd(maxDecLength, '0')
    );

    return {
        partesOperandos,
        maxIntLength,
        maxDecLength,
        displayWidth,
        anchoGridEnCeldas,
        altoGridEnCeldas,
        operandosParaCalcular
    };
}

/**
 * Dibuja los operandos en la pantalla de salida
 * @param {DocumentFragment} fragment - Fragmento donde añadir los elementos
 * @param {Array} partesOperandos - Partes de los operandos (enteros y decimales)
 * @param {Object} layout - Objeto con información de layout
 * @param {number} yPosInicial - Posición Y inicial
 * @param {string} operador - Símbolo del operador
 * @returns {number} Nueva posición Y después de dibujar
 */
export function dibujarOperandos(fragment, partesOperandos, layout, yPosInicial, operador) {
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, maxIntLength, maxDecLength } = layout;
    let yPos = yPosInicial;
    
    // Dibujar operandos
    partesOperandos.forEach((p, index) => {
        // Rellenamos las partes con espacios para alinear
        const intPadded = p.intPart.padStart(maxIntLength, ' ');
        const decPadded = p.decPart.padEnd(maxDecLength, ' ');
        
        // Posición X inicial (alineada a la derecha)
        let xPos = paddingLeft + offsetHorizontal + (layout.anchoGridEnCeldas - 1) * tamCel;
        
        // Dibujar parte entera
        for (let i = 0; i < intPadded.length; i++) {
            const char = intPadded[i];
            if (char !== ' ') {
                const celda = crearCelda('output-grid__cell', char, {
                    left: `${xPos}px`,
                    top: `${yPos}px`,
                    width: `${tamCel}px`,
                    height: `${tamCel}px`,
                    fontSize: `${tamFuente}px`
                });
                fragment.appendChild(celda);
            }
            xPos -= tamCel; // Movemos a la izquierda para el siguiente dígito
        }
        
        // Si hay decimales, dibujar la coma y la parte decimal
        if (maxDecLength > 0) {
            // Dibujar coma decimal
            const celdaComa = crearCelda('output-grid__cell output-grid__cell--comma', ',', {
                left: `${xPos}px`,
                top: `${yPos}px`,
                width: `${tamCel}px`,
                height: `${tamCel}px`,
                fontSize: `${tamFuente}px`
            });
            fragment.appendChild(celdaComa);
            xPos -= tamCel;
            
            // Dibujar parte decimal
            for (let i = 0; i < decPadded.length; i++) {
                const char = decPadded[i];
                if (char !== ' ') {
                    const celda = crearCelda('output-grid__cell', char, {
                        left: `${xPos}px`,
                        top: `${yPos}px`,
                        width: `${tamCel}px`,
                        height: `${tamCel}px`,
                        fontSize: `${tamFuente}px`
                    });
                    fragment.appendChild(celda);
                }
                xPos -= tamCel;
            }
        }
        
        yPos += tamCel;
    });
    
    // Dibujar operador
    const xPosOperador = paddingLeft + offsetHorizontal;
    const celdaOperador = crearCelda('output-grid__cell output-grid__cell--operator', operador, {
        left: `${xPosOperador}px`,
        top: `${yPosInicial + (partesOperandos.length - 1) * tamCel}px`,
        width: `${tamCel}px`,
        height: `${tamCel}px`,
        fontSize: `${tamFuente}px`
    });
    fragment.appendChild(celdaOperador);
    
    // Dibujar línea horizontal
    const lineaHorizontal = document.createElement('div');
    lineaHorizontal.className = 'output-grid__line';
    lineaHorizontal.style.position = 'absolute';
    lineaHorizontal.style.left = `${xPosOperador}px`;
    lineaHorizontal.style.top = `${yPos}px`;
    lineaHorizontal.style.width = `${tamCel * (layout.anchoGridEnCeldas - 1)}px`;
    lineaHorizontal.style.height = '2px';
    lineaHorizontal.style.backgroundColor = '#ddd';
    fragment.appendChild(lineaHorizontal);
    
    return yPos + tamCel; // Devolver la nueva posición Y
}
```

## Sistema de Manejo de Errores Mejorado

```javascript
// error-handler.js
"use strict";

import { errorMessages } from './config.js';

export class ErrorHandler {
    /**
     * Muestra un mensaje de error en el contenedor de salida
     * @param {string} codigo - Código del error en errorMessages
     * @param {HTMLElement} container - Contenedor donde mostrar el error
     * @param {Object} detalles - Detalles adicionales del error
     * @returns {void}
     */
    static mostrarError(codigo, container, detalles = {}) {
        if (!errorMessages[codigo]) {
            console.error(`Código de error no definido: ${codigo}`);
            codigo = 'invalidOperation';
        }
        
        // Registrar el error para depuración
        console.error(`Error: ${codigo}`, detalles);
        
        // Mostrar el error en la interfaz
        container.innerHTML = errorMessages[codigo];
        
        // Añadir clase de animación para destacar el error
        const errorElement = container.querySelector('.error');
        if (errorElement) {
            errorElement.classList.add('error--animated');
            setTimeout(() => {
                errorElement.classList.remove('error--animated');
            }, 1000);
        }
    }
    
    /**
     * Valida la entrada para operaciones matemáticas
     * @param {string} input - Entrada a validar
     * @param {string} operacion - Tipo de operación
     * @returns {Object} Objeto con estado de validación y mensaje de error
     */
    static validarEntrada(input, operacion) {
        // Validaciones comunes para todas las operaciones
        if (!input || input === '0') {
            return { valido: false, codigo: 'invalidOperation' };
        }
        
        // Validaciones específicas por tipo de operación
        switch (operacion) {
            case 'raizCuadrada':
                if (input.includes('+') || input.includes('-') || 
                    input.includes('×') || input.includes('÷')) {
                    return { valido: false, codigo: 'invalidSqrtInput' };
                }
                if (input.includes(',')) {
                    return { valido: false, codigo: 'integerSqrtRequired' };
                }
                if (parseFloat(input) < 0) {
                    return { valido: false, codigo: 'negativeSqrt' };
                }
                break;
                
            case 'division':
                const partes = input.split('÷');
                if (partes.length !== 2) {
                    return { valido: false, codigo: 'invalidOperation' };
                }
                if (partes[0] === '0' && partes[1] === '0') {
                    return { valido: false, codigo: 'division3' };
                }
                if (partes[1] === '0') {
                    return { valido: false, codigo: 'division2' };
                }
                if (partes[0] === '0') {
                    return { valido: false, codigo: 'division1' };
                }
                break;
                
            // Añadir más casos según sea necesario
        }
        
        return { valido: true };
    }
}
```

## Tema Oscuro/Claro

```scss
/* scss/base/_variables.scss */

/* Variables de Tema */
:root {
    /* Tema Oscuro (por defecto) */
    --bg-main: #{$bg-main};
    --bg-grid-lines: #{$bg-grid-lines};
    --bg-display: #{$bg-display};
    --bg-keyboard: #{$bg-keyboard};
    --bg-output-screen: #{$bg-output-screen};
    --history-panel-bg: #{$history-panel-bg};
    --history-header-bg: #{$history-header-bg};
    --nav-bg: #{$nav-bg};
    
    --color-display-text: #{$color-display-text};
    --history-text-color: #{$history-text-color};
    --history-input-color: #{$history-input-color};
    --history-border-color: #{$history-border-color};
    --history-hover-bg: #{$history-hover-bg};
    --color-lineas-output: #{$color-lineas-output};
    --color-error: #{$color-error};
    --focus-color: #{$focus-color};
    
    --btn-num-bg: #{$btn-num-bg};
    --btn-op-bg: #{$btn-op-bg};
    --btn-special-bg: #{$btn-special-bg};
    --btn-equal-bg: #{$btn-equal-bg};
    --btn-text-color: #{$btn-text-color};
    --btn-disabled-bg: #{$btn-disabled-bg};
    --btn-disabled-text: #{$btn-disabled-text};
}

/* Tema Claro */
[data-theme="light"] {
    --bg-main: #f5f5f5;
    --bg-grid-lines: rgba(0, 0, 0, 0.04);
    --bg-display: #ffffff;
    --bg-keyboard: #e0e0e0;
    --bg-output-screen: #f8f8f8;
    --history-panel-bg: #ffffff;
    --history-header-bg: #f0f0f0;
    --nav-bg: #f0f0f0;
    
    --color-display-text: #333333;
    --history-text-color: #333333;
    --history-input-color: #555555;
    --history-border-color: #dddddd;
    --history-hover-bg: #f5f5f5;
    --color-lineas-output: #555555;
    --color-error: #d32f2f;
    --focus-color: #4caf50;
    
    --btn-num-bg: #ffeb3b;
    --btn-op-bg: #ff5252;
    --btn-special-bg: #5c6bc0;
    --btn-equal-bg: #4caf50;
    --btn-text-color: #333333;
    --btn-disabled-bg: #cccccc;
    --btn-disabled-text: #999999;
}
```

```javascript
// theme-switcher.js
"use strict";

export class ThemeSwitcher {
    constructor() {
        this.themeKey = 'calculadora-facundo-theme';
        this.defaultTheme = 'dark';
        this.initTheme();
    }
    
    initTheme() {
        // Cargar tema guardado o usar el predeterminado
        const savedTheme = localStorage.getItem(this.themeKey) || this.defaultTheme;
        this.setTheme(savedTheme);
        
        // Crear y añadir el botón de cambio de tema
        this.createThemeToggle();
    }
    
    setTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem(this.themeKey, theme);
    }
    
    toggleTheme() {
        const currentTheme = localStorage.getItem(this.themeKey) || this.defaultTheme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.updateToggleButton(newTheme);
    }
    
    createThemeToggle() {
        const header = document.querySelector('header');
        if (!header) return;
        
        const themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Cambiar tema');
        
        const currentTheme = localStorage.getItem(this.themeKey) || this.defaultTheme;
        this.updateToggleButton(currentTheme, themeToggle);
        
        themeToggle.addEventListener('click', () => this.toggleTheme());
        header.appendChild(themeToggle);
    }
    
    updateToggleButton(theme, button = null) {
        const themeToggle = button || document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        themeToggle.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
}
```

## Mejoras de Accesibilidad

```javascript
// accessibility.js
"use strict";

export class AccessibilityManager {
    constructor() {
        this.setupKeyboardNavigation();
        this.setupScreenReaderAnnouncements();
        this.setupHighContrastMode();
    }
    
    setupKeyboardNavigation() {
        // Mejorar navegación por teclado
        document.addEventListener('keydown', (e) => {
            // Atajos para operaciones
            if (e.key === '+') {
                this.triggerButtonClick('btn-suma');
            } else if (e.key === '-') {
                this.triggerButtonClick('btn-resta');
            } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
                this.triggerButtonClick('btn-multiplica');
            } else if (e.key === '/') {
                this.triggerButtonClick('btn-divide');
            } else if (e.key === '=' || e.key === 'Enter') {
                this.triggerButtonClick('btn-igual');
            } else if (e.key === 'Escape') {
                this.triggerButtonClick('btn-clear');
            } else if (e.key >= '0' && e.key <= '9') {
                this.triggerButtonClick(`btn-${e.key}`);
            } else if (e.key === ',' || e.key === '.') {
                this.triggerButtonClick('btn-coma');
            }
        });
    }
    
    setupScreenReaderAnnouncements() {
        // Crear un elemento para anuncios de lector de pantalla
        const announcer = document.createElement('div');
        announcer.id = 'sr-announcer';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
        
        // Método para anunciar resultados
        this.announce = (message) => {
            announcer.textContent = message;
        };
    }
    
    setupHighContrastMode() {
        // Añadir botón para modo de alto contraste
        const header = document.querySelector('header');
        if (!header) return;
        
        const contrastToggle = document.createElement('button');
        contrastToggle.id = 'contrast-toggle';
        contrastToggle.className = 'contrast-toggle';
        contrastToggle.setAttribute('aria-label', 'Activar modo de alto contraste');
        contrastToggle.innerHTML = '<i class="fas fa-adjust"></i>';
        
        contrastToggle.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast');
            const isHighContrast = document.body.classList.contains('high-contrast');
            localStorage.setItem('calculadora-facundo-high-contrast', isHighContrast ? 'true' : 'false');
            contrastToggle.setAttribute('aria-label', 
                isHighContrast ? 'Desactivar modo de alto contraste' : 'Activar modo de alto contraste');
        });
        
        // Cargar preferencia guardada
        const savedPreference = localStorage.getItem('calculadora-facundo-high-contrast');
        if (savedPreference === 'true') {
            document.body.classList.add('high-contrast');
            contrastToggle.setAttribute('aria-label', 'Desactivar modo de alto contraste');
        }
        
        header.appendChild(contrastToggle);
    }
    
    triggerButtonClick(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.click();
            button.focus();
        }
    }
}
```

## Modo Científico (Ejemplo Básico)

```javascript
// operations/modules/scientific.js
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda } from '../utils/dom-helpers.js';
import { salida, errorMessages } from '../../config.js';
import { ErrorHandler } from '../../error-handler.js';

/**
 * Calcula el seno de un ángulo y muestra el proceso
 * @param {string} input - Ángulo en grados
 * @returns {Promise<void>}
 */
export async function calcularSeno(input) {
    salida.innerHTML = "";
    
    // Validar entrada
    const validacion = ErrorHandler.validarEntrada(input, 'seno');
    if (!validacion.valido) {
        ErrorHandler.mostrarError(validacion.codigo, salida);
        return;
    }
    
    // Convertir a radianes y calcular
    const anguloGrados = parseFloat(input.replace(',', '.'));
    const anguloRadianes = anguloGrados * Math.PI / 180;
    const resultado = Math.sin(anguloRadianes);
    
    // Preparar visualización
    const anchoGridEnCeldas = 10;
    const altoGridEnCeldas = 6;
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = 
        calculateLayout(salida, anchoGridEnCeldas, altoGridEnCeldas);
    
    // Crear fragmento para añadir elementos
    const fragment = document.createDocumentFragment();
    
    // Mostrar fórmula
    const formulaText = `sen(${anguloGrados}°) = sen(${anguloGrados} × π/180)`;
    const formula = crearCelda('output-grid__formula', formulaText, {
        left: `${paddingLeft + offsetHorizontal}px`,
        top: `${paddingTop}px`,
        width: `${tamCel * anchoGridEnCeldas}px`,
        height: `${tamCel}px`,
        fontSize: `${tamFuente * 0.8}px`,
        textAlign: 'left'
    });
    fragment.appendChild(formula);
    
    // Mostrar conversión a radianes
    const radianesText = `sen(${anguloRadianes.toFixed(6)} rad)`;
    const radianes = crearCelda('output-grid__formula', radianesText, {
        left: `${paddingLeft + offsetHorizontal}px`,
        top: `${paddingTop + tamCel}px`,
        width: `${tamCel * anchoGridEnCeldas}px`,
        height: `${tamCel}px`,
        fontSize: `${tamFuente * 0.8}px`,
        textAlign: 'left'
    });
    fragment.appendChild(radianes);
    
    // Mostrar resultado
    const resultadoText = `= ${resultado.toFixed(6)}`;
    const resultadoEl = crearCelda('output-grid__result', resultadoText, {
        left: `${paddingLeft + offsetHorizontal}px`,
        top: `${paddingTop + tamCel * 3}px`,
        width: `${tamCel * anchoGridEnCeldas}px`,
        height: `${tamCel}px`,
        fontSize: `${tamFuente}px`,
        textAlign: 'left',
        fontWeight: 'bold'
    });
    fragment.appendChild(resultadoEl);
    
    // Añadir todo al contenedor de salida
    salida.appendChild(fragment);
    
    // Anunciar para lectores de pantalla
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
        announcer.textContent = `Seno de ${anguloGrados} grados es ${resultado.toFixed(6)}`;
    }
    
    return resultado.toString();
}
```

## Pruebas Unitarias (Ejemplo con Jest)

```javascript
// tests/parsers.test.js
"use strict";

import { parsearNumeros } from '../operations/utils/parsers.js';

describe('Función parsearNumeros', () => {
    test('parsea correctamente números enteros', () => {
        const resultado = parsearNumeros('123+456', '+');
        expect(resultado).toEqual([['123', 0], ['456', 0]]);
    });
    
    test('parsea correctamente números con decimales', () => {
        const resultado = parsearNumeros('12,34+5,67', '+');
        expect(resultado).toEqual([['1234', 2], ['567', 2]]);
    });
    
    test('maneja ceros a la izquierda correctamente', () => {
        const resultado = parsearNumeros('007+00,5', '+');
        expect(resultado).toEqual([['7', 0], ['05', 1]]);
    });
    
    test('maneja comas al inicio correctamente', () => {
        const resultado = parsearNumeros(',5+,25', '+');
        expect(resultado).toEqual([['5', 1], ['25', 2]]);
    });
    
    test('maneja entradas vacías correctamente', () => {
        const resultado = parsearNumeros('+5', '+');
        expect(resultado).toEqual([['0', 0], ['5', 0]]);
    });
});
```

## Documentación JSDoc Mejorada

```javascript
/**
 * @fileoverview Módulo de operación de suma con visualización paso a paso.
 * @module operations/modules/addition
 * @requires operations/utils/layout-calculator
 * @requires operations/utils/dom-helpers
 * @requires config
 */

"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda, crearFlechaLlevada, esperar } from '../utils/dom-helpers.js';
import { salida } from '../../config.js';

/**
 * Realiza una suma con visualización paso a paso del proceso.
 * 
 * @async
 * @function suma
 * @param {Array<[string, number]>} numerosAR - Array de tuplas [valor, decimales]
 *   donde 'valor' es el número sin coma decimal y 'decimales' es la cantidad
 *   de posiciones decimales.
 * @returns {Promise<void>} - Promesa que se resuelve cuando se completa la visualización
 * 
 * @example
 * // Suma 123,45 + 67,8
 * await suma([['12345', 2], ['678', 1]]);
 */
export async function suma(numerosAR) {
    // Implementación...
}
```

Estos ejemplos de implementación proporcionan un punto de partida concreto para aplicar las mejoras recomendadas en el documento principal. Cada ejemplo está diseñado para integrarse con la estructura existente del proyecto mientras introduce mejoras significativas en términos de mantenibilidad, rendimiento y experiencia de usuario.