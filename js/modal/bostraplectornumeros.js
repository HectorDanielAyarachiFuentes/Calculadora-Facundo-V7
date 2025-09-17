// =======================================================
// --- CLASES DE UTILIDAD (Refactorizadas) ---
// =======================================================
import { settingsManager } from '../settings.js';
import { GeometryApp } from './geometry.js';
import { UnitConverterApp } from './unit-converter.js';

/**
 * Proporciona métodos estáticos para convertir números a su representación en letras.
 * No necesita ser instanciada.
 */
class NumberConverter {
    static _unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    static _especiales = ["diez", "once", "doce", "trece", "catorce", "quince"];
    static _decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    static _centenas = ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
    static _decimalPlaces = ["", "DÉCIMOS", "CENTÉSIMOS", "MILÉSIMOS", "DIEZMILÉSIMOS", "CIENMILÉSIMOS", "MILLONÉSIMOS"];

    /**
     * Convierte un número (entero o parte entera de un decimal) a su forma escrita en español.
     * @param {number} n - El número a convertir.
     * @returns {string} El número en letras.
     */
    static toLetters(n) {
        if (isNaN(n) || n === null) return "";
        if (n === 0) return "cero";
        if (n < 0) return "menos " + this.toLetters(Math.abs(n));

        let letters = "";

        if (n >= 1e6) {
            const millions = Math.floor(n / 1e6);
            letters += (millions === 1 ? "un millón" : this.toLetters(millions) + " millones");
            n %= 1e6;
            if (n > 0) letters += " ";
        }

        if (n >= 1e3) {
            const thousands = Math.floor(n / 1e3);
            if (thousands === 1) {
                letters += "mil";
            } else {
                let thousandsText = this.toLetters(thousands);
                if (thousandsText.endsWith("uno")) {
                    thousandsText = thousandsText.slice(0, -1) + "ún";
                }
                letters += thousandsText + " mil";
            }
            n %= 1e3;
            if (n > 0) letters += " ";
        }

        if (n >= 100) {
            const hundreds = Math.floor(n / 100);
            letters += (hundreds === 1 && n % 100 > 0 ? "ciento" : this._centenas[hundreds]);
            n %= 100;
            if (n > 0) letters += " ";
        }

        if (n > 0) {
            if (n >= 10 && n <= 15) {
                letters += this._especiales[n - 10];
            } else if (n >= 16 && n <= 19) {
                letters += "dieci" + this._unidades[n - 10];
            } else if (n === 20) {
                letters += "veinte";
            } else if (n > 20 && n < 30) {
                letters += "veinti" + this._unidades[n - 20];
            } else if (n >= 30) {
                const tens = Math.floor(n / 10);
                letters += this._decenas[tens];
                if ((n %= 10) > 0) {
                    letters += " y " + this._unidades[n];
                }
            } else {
                letters += this._unidades[n];
            }
        }
        return letters.trim();
    }

    /**
     * Convierte la parte decimal de un número a su forma escrita formal (ej: "doce centésimos").
     * @param {string} d - La parte decimal como una cadena de texto.
     * @returns {{texto: string, unidad: string}} Un objeto con el texto y la unidad decimal.
     */
    static formalDecimalsToLetters(d) {
        if (!d) return { texto: "", unidad: "" };
        const n = parseInt(d, 10);
        const l = d.length;
        let texto = this.toLetters(n);
        let unidad = this._decimalPlaces[l] ? this._decimalPlaces[l].toLowerCase().replace("_", "") : "";
        if (n === 1 && unidad.endsWith("s")) {
            unidad = unidad.slice(0, -1);
        }
        return { texto, unidad };
    }

    /**
     * Convierte la parte decimal de un número a su forma simple, dígito por dígito (ej: "uno dos").
     * @param {string} d - La parte decimal como una cadena de texto.
     * @returns {string} Los dígitos en letras, separados por espacios.
     */
    static simpleDecimalsToLetters(d) {
        return d.split('').map(c => this._unidades[parseInt(c, 10)]).join(' ');
    }
}

/**
 * Proporciona un método estático para separar palabras en sílabas.
 * Utiliza un algoritmo simple basado en vocales y consonantes.
 */
class Syllabifier {
    /**
     * Separa una palabra en un array de sílabas.
     * @param {string} word - La palabra a silabificar.
     * @returns {string[]} Un array con las sílabas de la palabra.
     */
    static syllabify(word) {
        // Implementación mejorada que considera diptongos y hiatos.
        // Referencia de reglas: https://www.rae.es/dpd/diptongo
        const VOWELS = 'aeiouáéíóú';
        const STRONG_VOWELS = 'aeoáéó';
        const WEAK_VOWELS = 'iuíú';

        word = word.toLowerCase().trim().replace(/y/g, 'i');
        if (word.length <= 2) return [word];

        let syllables = [];
        let currentSyllable = '';

        for (let i = 0; i < word.length; i++) {
            currentSyllable += word[i];

            // Buscamos la siguiente vocal para decidir si cortar la sílaba
            const nextVowelIndex = word.slice(i + 1).search(`[${VOWELS}]`);
            const hasNextVowel = nextVowelIndex !== -1;

            // Si no hay más vocales, el resto de la palabra es parte de la sílaba actual
            if (!hasNextVowel) {
                currentSyllable += word.slice(i + 1);
                break;
            }

            // Si el caracter actual es una vocal, analizamos el contexto
            if (VOWELS.includes(word[i])) {
                const nextChar = word[i + 1];
                const nextNextChar = word[i + 2];
                const isNextCharVowel = VOWELS.includes(nextChar);

                // Regla de HIATO: dos vocales fuertes se separan (po-e-ta)
                if (isNextCharVowel && STRONG_VOWELS.includes(word[i]) && STRONG_VOWELS.includes(nextChar)) {
                    syllables.push(currentSyllable);
                    currentSyllable = '';
                    continue;
                }

                // Regla de HIATO: vocal fuerte + vocal débil acentuada (ca-í-da)
                if (isNextCharVowel && ((STRONG_VOWELS.includes(word[i]) && 'íú'.includes(nextChar)) || ('íú'.includes(word[i]) && STRONG_VOWELS.includes(nextChar)))) {
                    syllables.push(currentSyllable);
                    currentSyllable = '';
                    continue;
                }
            }

            // Analizar el grupo de consonantes entre la vocal actual y la siguiente
            const consonants = word.substring(i + 1, i + 1 + nextVowelIndex);
            if (consonants.length > 1) {
                // Grupos inseparables (bl, cr, ll, ch, rr)
                if (/^(ll|rr|ch|[bcdfghprt]l|[bcdfghprt]r)$/.test(consonants)) {
                    // La sílaba se corta ANTES del grupo inseparable
                    syllables.push(currentSyllable);
                    currentSyllable = '';
                } else {
                    // Grupos separables (ns, st, rd). La primera consonante se queda.
                    currentSyllable += consonants[0];
                    syllables.push(currentSyllable);
                    currentSyllable = '';
                    // Ajustar el índice para no procesar la consonante dos veces
                    i++;
                }
            } else if (consonants.length === 1) {
                // Si solo hay una consonante, la sílaba se corta antes de ella.
                syllables.push(currentSyllable);
                currentSyllable = '';
            }
        }

        if (currentSyllable) {
            syllables.push(currentSyllable);
        }

        // Post-procesamiento para unir sílabas que quedaron de una sola consonante
        // (Ej: "a-c-ti-vo" -> "ac-ti-vo")
        for (let i = syllables.length - 2; i >= 0; i--) {
            if (syllables[i+1].length === 1 && !VOWELS.includes(syllables[i+1])) {
                syllables[i] += syllables[i+1];
                syllables.splice(i+1, 1);
            }
        }

        return syllables;
    }
}

/**
 * Proporciona una interfaz estática para la API de Síntesis de Voz del navegador.
 * Permite reproducir texto con callbacks para eventos de límite de palabra y finalización.
 */
export class SpeechService {
    /**
     * Reproduce un texto utilizando la síntesis de voz del navegador.
     * @param {string} text - El texto a reproducir.
     * @param {string} [lang='es-ES'] - El código de idioma para la voz.
     * @param {function(SpeechSynthesisEvent): void | null} [onBoundaryCallback=null] - Callback que se ejecuta en los límites de las palabras.
     * @param {function(SpeechSynthesisEvent): void | null} [onEndCallback=null] - Callback que se ejecuta cuando la reproducción termina.
     */
    static speak(text, lang = 'es-ES', onBoundaryCallback = null, onEndCallback = null) {
        if (!text || typeof window.speechSynthesis === 'undefined') {
            if (onEndCallback) onEndCallback();
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        if (onBoundaryCallback) {
            utterance.onboundary = onBoundaryCallback;
        }
        if (onEndCallback) {
            utterance.onend = onEndCallback;
        }
        window.speechSynthesis.speak(utterance);
    }
}

// =======================================================
// --- CLASES DE MODO DE APRENDIZAJE (Refactorizadas) ---
// =======================================================

/**
 * Gestiona la interfaz de usuario y la lógica para el "Modo de Aprendizaje Fonético".
 * Muestra las palabras separadas por sílabas y las resalta durante la reproducción de voz.
 */
class PhoneticMode {
    /**
     * @param {string} selector - El selector CSS del elemento contenedor para este modo.
     */
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.placeholder = '<span class="placeholder-text">Desglose fonético...</span>';
        this.reset();
    }

    /**
     * Restablece el contenido del elemento al marcador de posición inicial.
     */
    reset() {
        this.element.innerHTML = this.placeholder;
    }

    /**
     * Renderiza el texto de entrada como una serie de palabras silabificadas.
     * @param {string} text - El texto completo a renderizar.
     */
    render(text) {
        this.element.innerHTML = '';
        if (!text) {
            this.reset();
            return;
        }
        text.split(/\s+/).filter(Boolean).forEach((palabra, index) => {
            const span = document.createElement('span');
            span.className = 'palabra-fonetica';
            const silabas = Syllabifier.syllabify(palabra).join('-');
            span.textContent = (index === 0) ? silabas.charAt(0).toUpperCase() + silabas.slice(1) : silabas;
            this.element.appendChild(span);
        });
    }

    /**
     * Reproduce el texto y resalta cada palabra a medida que se pronuncia.
     * @param {string} text - El texto a reproducir.
     */
    play(text) {
        if (!text) return;
        const syllables = Array.from(this.element.querySelectorAll('.palabra-fonetica'));
        let wordIndex = 0;
        const onBoundary = (event) => {
            if (event.name === 'word') {
                syllables.forEach(s => s.classList.remove('highlight'));
                if (syllables[wordIndex]) {
                    syllables[wordIndex].classList.add('highlight');
                }
                wordIndex++;
            }
        };
        const onEnd = () => syllables.forEach(s => s.classList.remove('highlight'));
        SpeechService.speak(text, 'es-ES', onBoundary, onEnd);
    }
}

/**
 * Gestiona la interfaz de usuario y la lógica para el "Modo de Aprendizaje Formal".
 * Crea una representación gráfica en SVG del número, separando partes enteras y decimales,
 * y las resalta durante la reproducción de voz.
 */
class FormalMode {
    /**
     * @param {string} selector - El selector CSS del elemento contenedor para este modo.
     */
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.placeholder = '<span class="placeholder-text">Representación gráfica...</span>';
        this.reset();
    }

    /**
     * Restablece el contenido del elemento al marcador de posición inicial.
     */
    reset() {
        this.element.innerHTML = this.placeholder;
    }

    /**
     * Renderiza la representación gráfica SVG del número.
     * @param {string} pEnteraStr - La parte entera del número como cadena.
     * @param {string} pDecimalStr - La parte decimal del número como cadena.
     */
    render(pEnteraStr, pDecimalStr) {
        this.element.innerHTML = '';
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.element.appendChild(svg);

        const digitWidth = 55, startX = 40, numY = 160, mainLabelY = 100, verticalLabelY = 80, fontSize = 72, viewBoxHeight = 220;
        let currentX = startX;
        let svgContent = '';

        // --- MEJORA DE ACCESIBILIDAD: Añadir título y descripción para lectores de pantalla ---
        const titleId = "svg-title-" + Math.random().toString(36).substring(2, 9);
        const descId = "svg-desc-" + Math.random().toString(36).substring(2, 9);
        const fullNumberStr = pDecimalStr ? `${pEnteraStr},${pDecimalStr}` : pEnteraStr;

        svgContent += `<title id="${titleId}">Representación gráfica del número ${fullNumberStr}</title>`;
        svgContent += `<desc id="${descId}">Gráfico que muestra la parte entera (${pEnteraStr}) y la parte decimal (${pDecimalStr}).</desc>`;

        // Parte Entera
        const integerBlockWidth = pEnteraStr.length * digitWidth;
        const integerBlockCenterX = currentX + (integerBlockWidth / 2);
        svgContent += `<text x="${integerBlockCenterX}" y="${mainLabelY}" class="svg-etiqueta-principal" text-anchor="middle">PARTE ENTERA</text>`;
        svgContent += `<rect x="${currentX - 5}" y="${numY - fontSize + 10}" width="${integerBlockWidth + 10}" height="${fontSize}" fill="transparent" />`;
        svgContent += `<text id="svg-entero-texto" x="${integerBlockCenterX}" y="${numY}" class="svg-numero" style="fill: var(--ln-color-entero)" text-anchor="middle">${pEnteraStr}</text>`;
        currentX += integerBlockWidth + 20;

        // Coma y separador
        if (pEnteraStr && pDecimalStr) {
            svgContent += `<line x1="${currentX}" y1="30" x2="${currentX}" y2="${viewBoxHeight}" stroke="#333" stroke-width="4" />`;
            currentX += 40;
            svgContent += `<text x="${currentX}" y="${numY}" class="svg-numero" style="fill: var(--ln-color-coma); font-size: 72px;">,</text>`;
            currentX += 40;
        }

        // Parte Decimal
        const startDecimalX = currentX;
        let decimalDigitsContent = '';
        let decimalLabelsContent = '';
        const decimalPlaces = NumberConverter._decimalPlaces;

        pDecimalStr.split('').forEach((digit, index) => {
            if (index < decimalPlaces.length - 1) {
                const digitCenterX = currentX + (digitWidth / 2);
                decimalDigitsContent += `<rect x="${currentX}" y="${numY - fontSize + 10}" width="${digitWidth}" height="${fontSize}" fill="transparent" />`;
                decimalDigitsContent += `<text x="${digitCenterX}" y="${numY}" class="svg-numero" style="fill: var(--ln-color-decimal)" text-anchor="middle">${digit}</text>`;
                decimalLabelsContent += `<line x1="${currentX + digitWidth}" y1="40" x2="${currentX + digitWidth}" y2="${viewBoxHeight}" stroke="#ccc" stroke-dasharray="5,5" />`;
                decimalLabelsContent += `<text x="${digitCenterX}" y="${verticalLabelY}" class="svg-etiqueta-vertical" transform="rotate(-90 ${digitCenterX},${verticalLabelY})">${decimalPlaces[index + 1].replace("_", "")}</text>`;
                currentX += digitWidth;
            }
        });

        svgContent += `<g id="svg-decimales-g">${decimalDigitsContent}</g>`;
        svgContent += `<g id="svg-etiquetas-g">${decimalLabelsContent}</g>`;

        svg.innerHTML = svgContent;
        svg.setAttribute('viewBox', `0 0 ${currentX + 20} ${viewBoxHeight}`);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-labelledby', `${titleId} ${descId}`);
    }

    /**
     * Reproduce la lectura formal del número y resalta las partes correspondientes en el SVG.
     * @param {object} params - Objeto con los textos a reproducir.
     * @param {string} params.fullText - El texto completo para la síntesis de voz.
     * @param {string} params.integerText - El texto de la parte entera.
     * @param {string} params.decimalText - El texto de la parte decimal.
     * @param {string} params.unitText - El texto de la unidad decimal (ej: "centésimos").
     */
    play({ fullText, integerText, decimalText, unitText }) {
        if (!fullText) return;
        const enteroSVG = document.getElementById('svg-entero-texto');
        const decimalSVG = document.getElementById('svg-decimales-g');
        const etiquetaSVG = document.getElementById('svg-etiquetas-g');

        const onBoundary = (e) => {
            if (e.name !== 'word') return;
            const currentText = fullText.substring(0, e.charIndex + e.charLength);
            [enteroSVG, decimalSVG, etiquetaSVG].forEach(el => el && el.classList.remove('highlight'));
            if (decimalSVG) Array.from(decimalSVG.children).forEach(el => el.classList.remove('highlight'));

            if (enteroSVG && integerText && currentText.includes(integerText)) enteroSVG.classList.add('highlight');
            if (decimalSVG && decimalText && currentText.includes(decimalText)) decimalSVG.querySelectorAll('text').forEach(el => el.classList.add('highlight'));
            if (etiquetaSVG && unitText && currentText.includes(unitText)) {
                decimalSVG.querySelectorAll('text').forEach(el => el.classList.remove('highlight'));
                etiquetaSVG.classList.add('highlight');
            }
        };
        const onEnd = () => [enteroSVG, decimalSVG, etiquetaSVG].forEach(el => el && el.classList.remove('highlight'));
        SpeechService.speak(fullText, 'es-ES', onBoundary, onEnd);
    }
}

// =======================================================
// --- CLASE PRINCIPAL DE LA APLICACIÓN (Refactorizada) ---
// =======================================================

/**
 * Clase principal que orquesta toda la funcionalidad del "Lector de Números".
 * Se instancia cada vez que se abre el modal para asegurar un estado limpio.
 * Gestiona la entrada del usuario, el estado de la aplicación y la interacción entre los diferentes modos.
 */
class NumberReaderApp {
    /**
     * Inicializa la aplicación, obtiene referencias a los elementos del DOM,
     * instancia los modos de aprendizaje y vincula los eventos.
     */
    constructor() {
        this.elements = {
            input: document.getElementById("numero"),
            simpleResultDiv: document.getElementById("resultado"),
            playSimpleBtn: document.getElementById("play-simple-btn"),
            playPhoneticBtn: document.getElementById("play-phonetic-btn"),
            playFormalBtn: document.getElementById("play-formal-btn")
        };

        if (!this.elements.input) return; // Salir si los elementos no existen

        this.state = { simpleText: "", formalText: "", integerText: "", decimalText: "", unitText: "" };
        this.placeholders = { simple: '<span class="placeholder-text">La lectura del número aparecerá aquí.</span>' };

        this.phoneticMode = new PhoneticMode("#aprendizaje-fonetico-resultado");
        this.formalMode = new FormalMode("#aprendizaje-formal-wrapper");

        this.bindEvents();
        this.resetUI();
    }

    /**
     * Vincula los manejadores de eventos a los elementos de la interfaz (input, botones de play).
     */
    bindEvents() {
        this.elements.input.addEventListener("input", this.handleInput.bind(this));
        this.elements.playSimpleBtn.addEventListener("click", this.playSimple.bind(this));
        this.elements.playPhoneticBtn.addEventListener("click", this.playPhonetic.bind(this));
        this.elements.playFormalBtn.addEventListener("click", this.playFormal.bind(this));
    }

    /**
     * Maneja el evento 'input' del campo de texto.
     * Limpia la entrada, procesa el número, actualiza el estado y dispara el renderizado.
     */
    handleInput() {
        let val = this.elements.input.value.replace(/[^0-9,]/g, '').replace(/,/g, (m, o, s) => o === s.indexOf(',') ? ',' : '');
        if (this.elements.input.value !== val) {
            this.elements.input.value = val;
        }
        if (!val) {
            this.resetUI();
            return;
        }

        const parts = val.split(',');
        const pEnteraStr = parts[0] || '0';
        const pDecimalStr = parts[1] || '';
        const pEnteraNum = parseInt(pEnteraStr, 10);

        this.state.integerText = NumberConverter.toLetters(pEnteraNum);
        const simpleDecimalText = pDecimalStr ? ` coma ${NumberConverter.simpleDecimalsToLetters(pDecimalStr)}` : "";
        this.state.simpleText = this.state.integerText + simpleDecimalText;

        const { texto, unidad } = NumberConverter.formalDecimalsToLetters(pDecimalStr);
        this.state.decimalText = texto;
        this.state.unitText = unidad;

        let fraseEntera = pEnteraNum === 1 && pEnteraStr.length === 1 ? "un entero" : `${this.state.integerText} enteros`;
        if (pEnteraStr === "0" && pDecimalStr.length > 0) fraseEntera = "cero enteros";

        if (pDecimalStr) {
            this.state.formalText = `${fraseEntera} y ${this.state.decimalText} ${this.state.unitText}`;
        } else {
            this.state.formalText = this.state.integerText;
        }

        this.renderUI(pEnteraStr, pDecimalStr);
    }

    /**
     * Actualiza todas las partes de la interfaz de usuario con el estado actual.
     * Llama a los métodos `render` de los modos fonético y formal.
     * @param {string} pEnteraStr - La parte entera del número para pasar al modo formal.
     * @param {string} pDecimalStr - La parte decimal del número para pasar al modo formal.
     */
    renderUI(pEnteraStr, pDecimalStr) {
        this.elements.simpleResultDiv.textContent = this.state.simpleText.charAt(0).toUpperCase() + this.state.simpleText.slice(1);
        this.phoneticMode.render(this.state.simpleText);
        this.formalMode.render(pEnteraStr, pDecimalStr);
    }

    /**
     * Restablece el estado de la aplicación y la interfaz a sus valores iniciales.
     */
    resetUI() {
        this.state = { simpleText: "", formalText: "", integerText: "", decimalText: "", unitText: "" };
        if (this.elements.simpleResultDiv) this.elements.simpleResultDiv.innerHTML = this.placeholders.simple;
        this.phoneticMode.reset();
        this.formalMode.reset();
    }

    /**
     * Inicia la reproducción de la lectura simple del número.
     */
    playSimple() {
        if (!this.state.simpleText) return;
        SpeechService.speak(this.state.simpleText);
    }

    /**
     * Inicia la reproducción y el resaltado en el modo fonético.
     */
    playPhonetic() {
        if (!this.state.simpleText) return;
        this.phoneticMode.play(this.state.simpleText);
    }

    /**
     * Inicia la reproducción y el resaltado en el modo formal (gráfico).
     */
    playFormal() {
        if (!this.state.formalText) return;
        this.formalMode.play({
            fullText: this.state.formalText,
            integerText: this.state.integerText,
            decimalText: this.state.decimalText,
            unitText: this.state.unitText
        });
    }
}

// =======================================================
// --- ORQUESTADOR PRINCIPAL DE BOOTSTRAP E INTEGRACIÓN ---
// =======================================================
        export function initInfoModal() {
            const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

            const infoModalEl = document.getElementById('infoModal');
            const infoModal = new bootstrap.Modal(infoModalEl);
            const modalTitle = document.getElementById('infoModalLabel');
            const modalBody = document.getElementById('infoModalBody');
            
            const infoData = {
                readNumbers: {
                    title: "Lector de Números Avanzado",
                    body: `
                        <div class="input-section"><label for="numero">Introduce el número:</label><input type="text" id="numero" placeholder="Ej: 1234,56" autocomplete="off" aria-describedby="resultado-label fonetico-label formal-label"></div>
                        <div class="card"><h2 id="resultado-label">Lectura Simple</h2><div id="resultado" class="result-box" aria-live="polite"><span class="placeholder-text">...</span></div><button id="play-simple-btn" class="play-btn" aria-label="Escuchar la lectura simple del número">▶️ Escuchar</button></div>
                        <div class="card"><h2 id="fonetico-label">Modo de Aprendizaje Fonético</h2><div id="aprendizaje-fonetico-resultado" class="result-box phonetic-box" aria-live="polite"><span class="placeholder-text">...</span></div><button id="play-phonetic-btn" class="play-btn" aria-label="Escuchar el desglose fonético y resaltar sílabas">▶️ Escuchar y Resaltar</button></div>
                        <div class="card"><h2 id="formal-label">Modo de Aprendizaje Formal (Gráfico)</h2><div id="aprendizaje-formal-wrapper" class="result-box svg-box" aria-live="polite"><span class="placeholder-text">...</span></div><button id="play-formal-btn" class="play-btn" aria-label="Escuchar la lectura formal y resaltar la gráfica">▶️ Escuchar y Resaltar</button></div>
                    `,
                    onShow: () => {
                        new NumberReaderApp();
                        // --- MEJORA DE ACCESIBILIDAD: Mover el foco al campo de entrada ---
                        const numberInput = document.getElementById('numero');
                        if (numberInput) {
                            // Usamos un pequeño timeout para asegurar que el modal es completamente visible
                            // antes de mover el foco, evitando conflictos con la animación del modal.
                            setTimeout(() => numberInput.focus(), 150);
                        }
                    }
                },
                geometry: { 
                    title: "Conceptos de Geometría", 
                    body: `<div id="geometry-container"></div>`,
                    onShow: () => new GeometryApp('geometry-container')
                },
                unitConverter: {
                    title: "Conversor de Unidades",
                    body: `
                        <div id="unit-converter-container" class="converter-app">
                            <div class="row g-3 align-items-center">
                                <div class="col-12">
                                    <label for="unit-category" class="form-label">Tipo de Medida</label>
                                    <select id="unit-category" class="form-select">
                                        <option value="length">Longitud</option>
                                        <option value="mass">Masa</option>
                                    </select>
                                </div>
                                <div class="col-md-5">
                                    <label for="unit-from" class="form-label">De:</label>
                                    <select id="unit-from" class="form-select"></select>
                                    <input type="number" id="unit-from-value" class="form-control mt-2" value="1">
                                </div>
                                <div class="col-md-2 text-center d-flex align-items-center justify-content-center pt-4">
                                    <i class="fa-solid fa-right-left fs-2 text-secondary converter-app__arrow"></i>
                                </div>
                                <div class="col-md-5">
                                    <label for="unit-to" class="form-label">A:</label>
                                    <select id="unit-to" class="form-select"></select>
                                    <input type="number" id="unit-to-value" class="form-control mt-2">
                                </div>
                            </div>
                        </div>
                    `,
                    onShow: () => new UnitConverterApp('unit-converter-container')
                },
                config: { 
                    title: "Panel de Configuración", 
                    body: `
                        <div class="settings-panel">
                            <div class="settings-group">
                                <h4><i class="fa-solid fa-gauge-high"></i> Velocidad de Animación</h4>
                                <p>Controla la velocidad de las animaciones en las operaciones visuales.</p>
                                <select id="animationSpeedSelector" class="form-select">
                                    <option value="2">Lenta (para aprender)</option>
                                    <option value="1" selected>Normal</option>
                                    <option value="0.5">Rápida</option>
                                    <option value="0">Instantánea (sin animación)</option>
                                </select>
                            </div>
                            <div class="settings-group">
                                <h4><i class="fa-solid fa-volume-high"></i> Experiencia Sensorial</h4>
                                <p>Activa o desactiva los efectos de sonido y la vibración en los botones.</p>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" role="switch" id="soundEffectsToggle">
                                    <label class="form-check-label" for="soundEffectsToggle">Efectos de Sonido</label>
                                </div>
                                <div class="form-check form-switch mt-2">
                                    <input class="form-check-input" type="checkbox" role="switch" id="hapticFeedbackToggle">
                                    <label class="form-check-label" for="hapticFeedbackToggle">Respuesta Táctil (Vibración)</label>
                                </div>
                            </div>
                            <div class="settings-group">
                                <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Efectos Visuales</h4>
                                <p>Activa o desactiva efectos visuales como el "glitch" en el display.</p>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" role="switch" id="glitchEffectToggle">
                                    <label class="form-check-label" for="glitchEffectToggle">Efecto Glitch del Display</label>
                                </div>
                            </div>
                            <div class="settings-group">
                                <h4><i class="fa-solid fa-arrows-up-down-left-right"></i> Posiciones de Botones</h4>
                                <p>Restaura la posición original de los botones flotantes (herramientas, tema, historial).</p>
                                <button id="resetPositionsBtn" class="btn btn-warning">Restaurar Posiciones</button>
                            </div>
                            <div class="settings-group">
                                <h4><i class="fa-solid fa-trash-can"></i> Gestión de Datos</h4>
                                <p>Borra todos los datos guardados en tu navegador por esta aplicación.</p>
                                <button id="clearAllDataBtn" class="btn btn-danger">Borrar Todos los Datos</button>
                            </div>
                        </div>`,
                    onShow: () => settingsManager.initUI()
                },
                help: { 
                    title: "Centro de Ayuda", 
                    body: `
                        <div class="help-center">
                            <p class="help-intro">¡Bienvenido a la Calculadora de Facundo! Aquí encontrarás respuestas a las preguntas más comunes para sacar el máximo provecho de todas las herramientas.</p>
                            <div class="accordion" id="helpAccordion">
                                <!-- Item 1: Uso Básico -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header" id="headingOne">
                                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                            <i class="fa-solid fa-keyboard me-2"></i> Uso Básico de la Calculadora
                                        </button>
                                    </h2>
                                    <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#helpAccordion">
                                        <div class="accordion-body">
                                            <strong>Realizar cálculos:</strong> Usa el teclado numérico para introducir operaciones como <code>123 + 45</code>. El resultado se mostrará en el display.<br>
                                            <strong>Operaciones visuales:</strong> Pulsa el botón <strong>'='</strong> para ver la operación resuelta paso a paso en una cuadrícula detallada. Esto es ideal para aprender cómo funcionan las sumas, restas, multiplicaciones, divisiones y raíces.<br>
                                            <strong>Borrar:</strong> El botón <strong>'C'</strong> limpia toda la entrada. El botón <strong>'⌫'</strong> borra el último carácter.
                                        </div>
                                    </div>
                                </div>
                                <!-- Item 2: Herramientas -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header" id="headingTwo">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                            <i class="fa-solid fa-screwdriver-wrench me-2"></i> Herramientas Adicionales
                                        </button>
                                    </h2>
                                    <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#helpAccordion">
                                        <div class="accordion-body">
                                            Accede a herramientas avanzadas desde el menú de la esquina superior izquierda (<i class="fa-solid fa-screwdriver-wrench"></i>):
                                            <ul>
                                                <li><strong>Lector de Números:</strong> Convierte cualquier número a su forma escrita, con desglose fonético y una increíble representación gráfica.</li>
                                                <li><strong>Calculadora de Geometría:</strong> Calcula el área y perímetro de varias figuras geométricas con una visualización interactiva.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <!-- Item 3: Personalización -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header" id="headingThree">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                            <i class="fa-solid fa-palette me-2"></i> Personalización y Ajustes
                                        </button>
                                    </h2>
                                    <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#helpAccordion">
                                        <div class="accordion-body">
                                            <strong>Botones Flotantes:</strong> ¡Puedes arrastrar los botones de herramientas, tema e historial a cualquier lugar de la pantalla! Tu configuración se guardará.<br>
                                            <strong>Panel de Configuración (<i class="fa-solid fa-gears"></i>):</strong> Aquí puedes ajustar la velocidad de las animaciones, activar/desactivar sonidos, restaurar las posiciones de los botones y más.<br>
                                            <strong>Cambio de Tema (<i class="fa-solid fa-moon"></i>):</strong> Alterna entre el modo claro y oscuro para tu comodidad visual.
                                        </div>
                                    </div>
                                </div>
                                 <!-- Item 4: Solución de Problemas -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header" id="headingFour">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                                            <i class="fa-solid fa-circle-exclamation me-2"></i> Solución de Problemas
                                        </button>
                                    </h2>
                                    <div id="collapseFour" class="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#helpAccordion">
                                        <div class="accordion-body">
                                            <strong>Aparece 'NaN' o 'Error':</strong> Esto suele ocurrir si la operación introducida no es válida (ej. <code>5++3</code>). Usa el botón 'C' para limpiar y empezar de nuevo.<br>
                                            <strong>La aplicación va lenta:</strong> Si has realizado muchos cálculos complejos, prueba a limpiar el historial desde su panel. También puedes borrar todos los datos desde el panel de configuración para un reinicio completo.<br>
                                            <strong>Un botón no está donde lo dejé:</strong> Si cambias el tamaño de la ventana, las posiciones se recalculan. Puedes restaurarlas a su estado original desde el panel de configuración.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>` 
                }
            };
            
            document.querySelectorAll('[data-modal-target]').forEach(trigger => {
                trigger.addEventListener('click', () => {
                    const targetKey = trigger.dataset.modalTarget; const data = infoData[targetKey];
                    if (data) {
                        modalTitle.textContent = data.title; modalBody.innerHTML = data.body; infoModal.show();
                        if (data.onShow) { infoModalEl.addEventListener('shown.bs.modal', data.onShow, { once: true }); }
                    }
                });
            });

            infoModalEl.addEventListener('hide.bs.modal', () => {
                // Detener cualquier síntesis de voz en curso al cerrar el modal.
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
                // SOLUCIÓN: Eliminar el foco del elemento activo antes de que el modal se oculte.
                // Esto previene la advertencia de accesibilidad donde un elemento con foco
                // está dentro de un contenedor con `aria-hidden="true"`.
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            });

            // ===================================================================
            // === LÓGICA PARA CONECTAR HISTORIAL CON LECTOR DE NÚMEROS ===
            // ===================================================================
            const historyList = document.getElementById('history-list');
            const historyPanel = document.getElementById('history-panel');

            historyList.addEventListener('click', (event) => {
                // 1. Comprobar si el modal del lector de números está visible
                // y si el campo de entrada del lector existe (por si es otro modal)
                if (!infoModalEl.classList.contains('show') || !document.getElementById('numero')) {
                    return; 
                }

                // 2. Encontrar el item del historial y el resultado en el que se hizo clic
                const clickedItem = event.target.closest('.history-panel__item');
                if (!clickedItem) return;

                const resultSpan = clickedItem.querySelector('.history-panel__result');
                if (!resultSpan) return;
                
                // 3. Obtener el número y prepararlo para el lector (usa ',' en vez de '.')
                let numberToSet = resultSpan.textContent.trim().replace(/\./g, ',');
                
                // 4. Encontrar el campo de entrada del lector y poner el número
                const numberReaderInput = document.getElementById('numero');
                numberReaderInput.value = numberToSet;
                
                // 5. ¡CRÍTICO! Disparar el evento 'input' para que la App del lector reaccione
                // Esto simula que el usuario ha tecleado el número, forzando la actualización.
                numberReaderInput.dispatchEvent(new Event('input', { bubbles: true }));

                // 6. (Opcional) Cerrar el panel de historial para una mejor experiencia de usuario
                historyPanel.classList.remove('history-panel--open');
            });
        }
