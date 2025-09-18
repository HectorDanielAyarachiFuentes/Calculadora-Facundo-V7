// =======================================================
// --- operations/modules/potencia.js ---
// Implementa la operación de potencia (a elevado a b).
// =======================================================
"use strict";

import { VisualOperation } from '../utils/VisualOperation.js';
import { crearCelda, esperar } from '../utils/dom-helpers.js';
import { salida } from '../../calculadora/config.js';
import { ErrorHandlerCentralized } from '../../calculadora/error-handler-centralized.js';
import { showKeyboardScreen } from '../../calculadora/ui-manager.js';

const errorHandler = new ErrorHandlerCentralized(salida);

export class PotenciaOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
        this.operando1 = this.numerosAR[0][0];
        this.operando2 = this.numerosAR[1][0];
        this.steps = []; // Almacenará los pasos intermedios del cálculo
        this.isLargeOperation = false; // Flag para operaciones muy grandes
        this.expandButton = null;
        this.backButton = null;
        this.contentContainer = null;
    }

    _calculateResult() {
        try {
            const base = BigInt(this.operando1);
            const exponente = parseInt(this.operando2, 10);

            // --- MEJORA: Usar la vista minimalista si el exponente tiene 2 o más dígitos. ---
            this.isLargeOperation = this.operando2.length >= 2;

            if (exponente < 0) {
                this.error = 'Exponentes negativos no soportados.';
            } else if (exponente === 0) {
                this.resultado.raw = '1';
                this.resultado.display = '1';
            } else {
                let currentResult;

                // Solo calcular los pasos si no es una operación grande, para ahorrar rendimiento.
                if (!this.isLargeOperation) {
                    currentResult = base;
                    for (let i = 1; i < exponente; i++) {
                        const prevResult = currentResult;
                        currentResult *= base;
                        this.steps.push({ expression: `${prevResult} × ${this.operando1}`, result: currentResult.toString() });
                    }
                } else {
                    // Si es grande, calcular el resultado directamente sin guardar pasos.
                    currentResult = base ** BigInt(exponente);
                }
                
                const finalResultStr = currentResult.toString();
                // Se establece un límite práctico (200 dígitos) para evitar problemas de rendimiento
                // del navegador al intentar renderizar un número con miles de dígitos.
                if (finalResultStr.length > 200) {
                    this.error = 'El resultado es un número demasiado grande para ser mostrado.';
                } else {
                    this.resultado.raw = finalResultStr;
                    this.resultado.display = finalResultStr;
                }
            }
        } catch (e) {
            this.error = 'Entrada inválida para la potencia.';
        }

        if (this.error) { this.resultado.display = "Error"; this.resultado.raw = "Error"; }
    }

    _getGridDimensions() {
        const baseStr = this.operando1.toString();
        const expStr = this.operando2.toString();
        const resStr = this.resultado.display;
        const title = `Calculando ${baseStr} ^ ${expStr}`;
        const exponente = parseInt(expStr, 10);

        if (this.isLargeOperation) {
            const message = "Operación muy grande para mostrar todos los pasos.";
            const resultText = `Resultado: ${resStr}`;
            const maxWidth = Math.max(title.length, message.length, resultText.length);
            // --- MEJORA VISUAL: Aumentar la altura para dar más espacio y permitir fuentes más grandes ---
            return { width: maxWidth + 8, height: 16 };
        } else {
            // Lógica existente para la vista detallada
            const expandedExpression = exponente > 1 ? Array(exponente).fill(baseStr).join(' × ') : '';
            let maxWidth = Math.max(title.length, expandedExpression.length, resStr.length + "Resultado: ".length);
            for (const step of this.steps) {
                const stepExpression = `${step.expression} = ${step.result}`;
                maxWidth = Math.max(maxWidth, stepExpression.length);
            }
            // --- MEJORA VISUAL: Aumentar la altura en celdas para dar más espacio a fuentes más grandes ---
            let heightInCells = 4; // Más espacio para el título
            if (exponente > 1) heightInCells += 2.5; // Más espacio para la expansión
            heightInCells += this.steps.length * 3.5; // Más espacio por paso
            if (exponente >= 0) heightInCells += 5; // Más espacio para el resultado
            return { width: maxWidth + 8, height: Math.ceil(heightInCells) };
        }
    }

    async execute() {
        this._clearOutput();
        this._calculateResult();

        if (this.error) {
            errorHandler.mostrarError('invalidOperation', { customMessage: this.error });
            return false;
        }

        // --- MEJORA: Crear botones de UI (expandir y volver) ---
        const expandButton = document.createElement('button');
        expandButton.innerHTML = '<i class="fa-solid fa-expand"></i>';
        expandButton.className = 'output-screen__expand-btn';
        expandButton.setAttribute('aria-label', 'Ampliar visualización');
        expandButton.onclick = () => this.toggleExpandedView();
        this.salida.appendChild(expandButton);
        this.expandButton = expandButton;

        // --- NUEVO: Botón para volver a la calculadora ---
        const backButton = document.createElement('button');
        backButton.innerHTML = '<i class="fa-solid fa-calculator"></i>';
        backButton.className = 'output-screen__back-btn d-none'; // Oculto por defecto
        backButton.setAttribute('aria-label', 'Volver a la calculadora');
        backButton.onclick = () => this.goBackToCalculator(); // Usar método de la clase
        this.salida.appendChild(backButton);
        this.backButton = backButton;

        const contentContainer = document.createElement('div');
        contentContainer.className = 'operation-content';
        this.salida.appendChild(contentContainer);
        this.contentContainer = contentContainer;

        // Realizar el dibujado inicial
        await this._draw();

        return true;
    }

    async toggleExpandedView() {
        this.salida.classList.toggle('output-screen--expanded');

        if (this.salida.classList.contains('output-screen--expanded')) {
            this.expandButton.innerHTML = '<i class="fa-solid fa-compress"></i>';
            this.expandButton.setAttribute('aria-label', 'Reducir visualización');
            this.backButton.classList.remove('d-none'); // Mostrar botón de volver
        } else {
            this.expandButton.innerHTML = '<i class="fa-solid fa-expand"></i>';
            this.expandButton.setAttribute('aria-label', 'Ampliar visualización');
            this.backButton.classList.add('d-none'); // Ocultar botón de volver
        }

        await esperar(400); // Esperar a que termine la transición CSS

        await this._draw(); // Volver a dibujar la operación con el nuevo tamaño
    }

    // --- NUEVO MÉTODO ---
    goBackToCalculator() {
        // 1. Quitar el estado expandido si está activo
        if (this.salida.classList.contains('output-screen--expanded')) {
            this.salida.classList.remove('output-screen--expanded');
            // También resetear los botones de la UI para la próxima vez
            this.expandButton.innerHTML = '<i class="fa-solid fa-expand"></i>';
            this.expandButton.setAttribute('aria-label', 'Ampliar visualización');
            this.backButton.classList.add('d-none');
        }
        // 2. Volver a la pantalla del teclado
        showKeyboardScreen();
    }

    async _draw() {
        this.contentContainer.innerHTML = ''; // Limpiar solo el contenido de la operación
        this._calculateLayout();
        const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = this.layoutParams;
        let yPos = paddingTop + tamCel;

        // 1. Mostrar título (adaptativo a la vista)
        let titleText = `Calculando ${this.operando1} ^ ${this.operando2}`;
        if (this.salida.classList.contains('output-screen--expanded') && !this.isLargeOperation) {
            titleText = `Procedimiento Detallado: Potencia de ${this.operando1}`;
        }
        this.contentContainer.appendChild(crearCelda('output-grid__result--division-final', titleText, {
            left: `${paddingLeft}px`, 
            top: `${yPos}px`, 
            width: '100%', 
            textAlign: 'center', 
            fontSize: `${tamFuente * 1.8}px` // Aún más grande
        }));
        yPos += tamCel * 3;

        // --- Bifurcación de la lógica de visualización ---
        if (this.isLargeOperation) {
            // VISTA MINIMALISTA
            const message = "Operación muy grande para mostrar todos los pasos.";
            this.contentContainer.appendChild(crearCelda('output-grid__cell', message, { 
                left: `${paddingLeft}px`, top: `${yPos}px`, width: '100%', textAlign: 'center', 
                fontSize: `${tamFuente * 1.3}px`, color: '#95a5a6' // Más grande
            }));
            yPos += tamCel * 3.5;
        } else {
            // VISTA DETALLADA
            const exponente = parseInt(this.operando2, 10);
            if (exponente > 1) {
                const expansion = Array(exponente).fill(this.operando1).join(' × ');
                this.contentContainer.appendChild(crearCelda('output-grid__cell', `= ${expansion}`, { 
                    left: `${offsetHorizontal + paddingLeft}px`, 
                    top: `${yPos}px`, 
                    fontSize: `${tamFuente * 1.4}px`, // Más grande
                    color: '#95a5a6', // Color más sutil
                    width: 'auto', 
                    height: `${tamCel}px`, 
                    whiteSpace: 'nowrap' 
                }));
                yPos += tamCel * 2.5;

                // MEJORA: Añadir subtítulo en la vista expandida
                if (this.salida.classList.contains('output-screen--expanded')) {
                    const subtitle = `Multiplicaciones sucesivas:`;
                    this.contentContainer.appendChild(crearCelda('power-subtitle', subtitle, {
                        left: `${offsetHorizontal + paddingLeft}px`, top: `${yPos}px`, fontSize: `${tamFuente * 1.2}px`, color: '#bdc3c7'
                    }));
                    yPos += tamCel * 2;
                }
            }

            for (const step of this.steps) {
                const stepText = `${step.expression} = ${step.result}`;
                const stepCard = crearCelda('output-grid__cell animate-fade-in-scale power-step-card', stepText, {
                    left: `${offsetHorizontal + paddingLeft}px`, 
                    top: `${yPos}px`, 
                    fontSize: `${tamFuente * 1.6}px`, // Más grande
                    width: 'auto', 
                    height: 'auto', // La altura se ajusta al contenido
                    padding: `${tamCel * 0.25}px ${tamCel * 0.5}px`,
                    whiteSpace: 'nowrap' 
                });
                this.contentContainer.appendChild(stepCard);
                yPos += tamCel * 3.5;
                await esperar(800);
            }
        }

        // 4. Mostrar resultado final (común a ambas vistas)
        const exponente = parseInt(this.operando2, 10);
        if (exponente >= 0) { // Mostrar para 0 también (resultado 1)
            const finalResultText = `= ${this.resultado.display}`;
            const finalResultCard = crearCelda('output-grid__cell output-grid__cell--cociente animate-fade-in-scale power-result-card', finalResultText, {
                top: `${yPos}px`, 
                fontSize: `${tamFuente * 2.0}px`, // Mucho más grande
                fontWeight: 'bold', 
                width: 'auto', 
                height: 'auto',
                padding: `${tamCel * 0.3}px ${tamCel * 0.6}px`,
                whiteSpace: 'nowrap' 
            });

            finalResultCard.style.left = '50%';
            finalResultCard.style.transform = 'translateX(-50%)';

            this.contentContainer.appendChild(finalResultCard);
        }
    }

    _getOperatorSign() { return '^'; }
    async _animateSteps() { /* Implementado en execute */ }
    async _drawStaticElements() { /* Implementado en execute */ }
    _drawResult() { /* Implementado en execute */ }
}

export async function potencia(numerosAR) {
    const op = new PotenciaOperation(numerosAR, salida);
    return await op.execute();
}