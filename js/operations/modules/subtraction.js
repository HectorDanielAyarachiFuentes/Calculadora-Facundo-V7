// =======================================================
// --- operations/modules/subtraction.js (REFACTORIZADO) ---
// Utiliza la clase base VisualOperation para una estructura OOP.
// =======================================================
"use strict";

import { crearCelda, crearCeldaAnimada, esperar } from '../utils/dom-helpers.js';
import { VisualOperation } from '../utils/VisualOperation.js';
import { salida } from '../../calculadora/config.js';

let animationLoopId = null;

async function startBorrowLoopAnimation(elements) {
    if (animationLoopId) clearTimeout(animationLoopId);
    if (elements.length === 0) return;

    const loop = async () => {
        for (const element of elements) {
            if (element.tagName.toLowerCase() === 'svg') {
                const path = element.querySelector('path[d^="M"]');
                if (path) {
                    const length = path.getTotalLength();
                    path.style.transition = 'none';
                    path.style.strokeDashoffset = length;
                    path.offsetHeight;
                    path.style.transition = 'stroke-dashoffset .8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
                    path.style.strokeDashoffset = '0';
                }
            } else {
                element.classList.add('pulse');
                setTimeout(() => element.classList.remove('pulse'), 500);
            }
            await esperar(200);
        }
        animationLoopId = setTimeout(loop, 3000);
    };
    loop();
}

function calculateBorrows(n1Str, n2Str) {
    const borrowChains = [];
    let n1Array = n1Str.split('').map(Number);
    let n2Array = n2Str.split('').map(Number);

    for (let i = n1Array.length - 1; i >= 0; i--) {
        if (n1Array[i] < n2Array[i]) {
            let chain = [];
            let j = i - 1;
            while (j >= 0 && n1Array[j] === 0) { j--; }

            if (j >= 0) {
                chain.push({ index: j, newValue: n1Array[j] - 1 });
                n1Array[j]--;
                for (let k = j + 1; k < i; k++) {
                    chain.push({ index: k, newValue: 9 });
                    n1Array[k] = 9;
                }
                chain.push({ index: i, newValue: n1Array[i] + 10 });
                n1Array[i] += 10;
                borrowChains.push(chain);
            }
        }
    }
    return borrowChains;
}

function crearTachadoAnimado(styles) {
    const line = document.createElement('div');
    line.className = 'output-grid__cross-out';
    Object.assign(line.style, {
        position: 'absolute', backgroundColor: '#e84d4d', height: '2px',
        transform: 'rotate(-25deg)', transformOrigin: 'left center',
        transition: 'width 0.3s ease-out', width: '0px', ...styles
    });
    requestAnimationFrame(() => { line.style.width = styles.width; });
    return line;
}

function formatWithComma(numStr, dec) {
    if (dec === 0) return numStr;
    const padded = numStr.padStart(dec + 1, '0');
    return `${padded.slice(0, -dec)},${padded.slice(-dec)}`;
}

export class RestaOperation extends VisualOperation {
    constructor(numerosAR, salida) {
        super(numerosAR, salida);
        if (animationLoopId) clearTimeout(animationLoopId);
    }

    _getGridDimensions() {
        return {
            width: this.displayWidth + 1,
            height: 5 // Altura suficiente para los préstamos
        };
    }

    _getOperatorSign() {
        return "-";
    }

    _getOperandsForDisplay() {
        // Si el resultado es negativo, intercambiamos los operandos para la visualización.
        return this.resultado.esNegativo ? [this.partesOperandos[1], this.partesOperandos[0]] : this.partesOperandos;
    }

    _calculateResult() {
        const [n1, n2] = this.operandosParaCalcular;
        const minuendoBigInt = BigInt(n1);
        const sustraendoBigInt = BigInt(n2);

        this.resultado.esNegativo = minuendoBigInt < sustraendoBigInt;
        this.resultado.raw = (this.resultado.esNegativo ? sustraendoBigInt - minuendoBigInt : minuendoBigInt - sustraendoBigInt).toString();
        this.resultado.display = formatWithComma(this.resultado.raw, this.maxDecLength);
    }

    async _animateSteps() {
        await esperar(500);

        const [n1, n2] = this.operandosParaCalcular;
        const n1Anim = this.resultado.esNegativo ? n2 : n1;
        const n2Anim = this.resultado.esNegativo ? n1 : n2;

        const borrowChains = calculateBorrows(n1Anim, n2Anim);
        const borrowNumberCells = {};
        const yPosMinuendo = this.layoutParams.paddingTop + this.layoutParams.tamCel;

        for (const chain of borrowChains) {
            for (const step of chain) {
                const digitsToRight = n1Anim.length - 1 - step.index;
                const hasCommaToRight = this.maxDecLength > 0 && digitsToRight >= this.maxDecLength;
                const visualCellsToRight = digitsToRight + (hasCommaToRight ? 1 : 0);
                const visualCol = this._getGridDimensions().width - 1 - visualCellsToRight;

                const xPos = this.layoutParams.offsetHorizontal + visualCol * this.layoutParams.tamCel + this.layoutParams.paddingLeft;
                const yNewNum = yPosMinuendo - this.layoutParams.tamCel * 0.7;

                if (borrowNumberCells[step.index]) {
                    this.salida.removeChild(borrowNumberCells[step.index]);
                }
                
                this.salida.appendChild(crearTachadoAnimado({ left: `${xPos}px`, top: `${yPosMinuendo + this.layoutParams.tamCel / 2}px`, width: `${this.layoutParams.tamCel}px` }));
                await esperar(300);

                const numStr = step.newValue.toString();
                const widthMultiplier = numStr.length > 1 ? 1.4 : 1;
                const leftOffset = numStr.length > 1 ? -this.layoutParams.tamCel * 0.2 : 0;
                
                const newNumber = crearCeldaAnimada("output-grid__cell output-grid__cell--resto", numStr, {
                    left: `${xPos + leftOffset}px`, top: `${yNewNum}px`, width: `${this.layoutParams.tamCel * widthMultiplier}px`, height: `${this.layoutParams.tamCel}px`, fontSize: `${this.layoutParams.tamFuente * 0.7}px`
                }, 0);
                newNumber.classList.add('loop-anim-element');
                this.salida.appendChild(newNumber);
                borrowNumberCells[step.index] = newNumber;
                await esperar(300);
            }
            await esperar(500);
        }
        await esperar(10); // Pequeña pausa antes de dibujar el resultado
    }

    _finalize() {
        const elementsToLoop = this.salida.querySelectorAll('.loop-anim-element');
        startBorrowLoopAnimation(elementsToLoop);
    }
}

export async function resta(numerosAR) {
    const op = new RestaOperation(numerosAR, salida);
    await op.execute();
}