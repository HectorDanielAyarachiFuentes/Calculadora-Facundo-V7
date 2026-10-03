// =======================================================
// --- CLASES DE UTILIDAD (Refactorizadas) ---
// =======================================================
import { settingsManager } from '../calculadora/settings.js';
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
    static playbackRate = 1.0;

    /**
     * Configura la velocidad de reproducción de voz.
     * @param {number|string} rate
     */
    static setSpeed(rate) {
        SpeechService.playbackRate = parseFloat(rate) || 1.0;
    }

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
        utterance.rate = SpeechService.playbackRate || 1.0;
        if (onBoundaryCallback) {
            utterance.onboundary = onBoundaryCallback;
        }
        if (onEndCallback) {
            utterance.onend = onEndCallback;
            utterance.onerror = onEndCallback;
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
     * Inicializa el Lector de Números Avanzado con navegación instantánea por pestañas,
     * controles de velocidad de voz, acciones rápidas y análisis matemático en tiempo real.
     */
    constructor() {
        this.elements = {
            input: document.getElementById("numero"),
            simpleResultDiv: document.getElementById("resultado"),
            playSimpleBtn: document.getElementById("play-simple-btn"),
            playPhoneticBtn: document.getElementById("play-phonetic-btn"),
            playFormalBtn: document.getElementById("play-formal-btn"),
            clearBtn: document.getElementById("ln-clear-btn"),
            importCalcBtn: document.getElementById("ln-import-calc-btn"),
            randomBtn: document.getElementById("ln-random-btn"),
            copySimpleBtn: document.getElementById("ln-copy-simple-btn"),
            mathContentDiv: document.getElementById("ln-math-content"),
            tabsBar: document.querySelector(".ln-tabs-bar"),
            tabPanes: document.querySelectorAll(".ln-tab-pane"),
            speedButtons: document.querySelectorAll(".ln-speed-btn")
        };

        if (!this.elements.input) return;

        this.state = {
            simpleText: "",
            formalText: "",
            integerText: "",
            decimalText: "",
            unitText: "",
            pEnteraStr: "",
            pDecimalStr: ""
        };

        this.placeholders = {
            simple: '<span class="placeholder-text">Introduce un número para ver su lectura aquí.</span>',
            math: '<div class="ln-math-empty placeholder-text">Ingresa un número para calcular su análisis.</div>'
        };

        this.phoneticMode = new PhoneticMode("#aprendizaje-fonetico-resultado");
        this.formalMode = new FormalMode("#aprendizaje-formal-wrapper");

        this.bindEvents();
        this.initTabs();
        this.initSpeedControls();
        this.initQuickActions();

        // Si ya hay un valor ingresado, procesarlo inmediatamente
        if (this.elements.input.value && this.elements.input.value.trim() !== '') {
            this.handleInput();
        } else {
            this.resetUI();
        }
    }

    /**
     * Vincula los manejadores de eventos principales
     */
    bindEvents() {
        this.elements.input.addEventListener("input", this.handleInput.bind(this));
        if (this.elements.playSimpleBtn) this.elements.playSimpleBtn.addEventListener("click", this.playSimple.bind(this));
        if (this.elements.playPhoneticBtn) this.elements.playPhoneticBtn.addEventListener("click", this.playPhonetic.bind(this));
        if (this.elements.playFormalBtn) this.elements.playFormalBtn.addEventListener("click", this.playFormal.bind(this));
    }

    /**
     * Navegación por pestañas por delegación de eventos garantizada
     */
    initTabs() {
        if (!this.elements.tabsBar) return;

        this.elements.tabsBar.addEventListener("click", (e) => {
            const btn = e.target.closest(".ln-tab-btn");
            if (!btn) return;
            e.preventDefault();

            const targetTab = btn.getAttribute("data-tab");
            if (!targetTab) return;

            // Actualizar botones de pestaña
            this.elements.tabsBar.querySelectorAll(".ln-tab-btn").forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");

            // Actualizar paneles de contenido
            document.querySelectorAll(".ln-tab-pane").forEach(p => p.classList.remove("active"));
            const targetPane = document.getElementById(`ln-pane-${targetTab}`);
            if (targetPane) {
                targetPane.classList.add("active");
            }
        });
    }

    /**
     * Controles de velocidad para síntesis de voz (0.8x, 1.0x, 1.25x)
     */
    initSpeedControls() {
        this.elements.speedButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const speed = parseFloat(btn.getAttribute("data-speed")) || 1.0;
                SpeechService.setSpeed(speed);
                document.querySelectorAll(".ln-speed-btn").forEach(b => {
                    b.classList.toggle("active", b.getAttribute("data-speed") === String(speed));
                });
            });
        });
    }

    /**
     * Acciones rápidas: Limpiar, Cargar de Calculadora, Número al Azar y Copiar
     */
    initQuickActions() {
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.elements.input.value = "";
                this.elements.input.focus();
                this.resetUI();
            });
        }

        if (this.elements.importCalcBtn) {
            this.elements.importCalcBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const display = document.getElementById("display");
                let text = display ? display.innerText.trim() : "";
                text = text.replace(/[^0-9.,-]/g, '').replace(/\./g, ',');
                if (text && text !== "0" && text !== "Error" && text !== "NaN") {
                    this.elements.input.value = text;
                    this.handleInput();
                    this.showToastFeedback(this.elements.importCalcBtn, "¡Cargado!");
                } else {
                    this.showToastFeedback(this.elements.importCalcBtn, "Vacío", true);
                }
            });
        }

        if (this.elements.randomBtn) {
            const examples = ["42", "128", "564", "1024", "1492,50", "2048", "3,1416", "9876543,21", "500000", "777,7"];
            this.elements.randomBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const randomVal = examples[Math.floor(Math.random() * examples.length)];
                this.elements.input.value = randomVal;
                this.handleInput();
            });
        }

        if (this.elements.copySimpleBtn) {
            this.elements.copySimpleBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (!this.state.simpleText) return;
                const copyTextEl = this.elements.copySimpleBtn.querySelector(".copy-text");
                const formatted = this.state.simpleText.charAt(0).toUpperCase() + this.state.simpleText.slice(1);
                const showDone = () => {
                    if (copyTextEl) copyTextEl.textContent = "¡Copiado!";
                    this.elements.copySimpleBtn.classList.add("copied");
                    setTimeout(() => {
                        if (copyTextEl) copyTextEl.textContent = "Copiar";
                        this.elements.copySimpleBtn.classList.remove("copied");
                    }, 1800);
                };

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(formatted).then(showDone).catch(() => {
                        this.copyFallback(formatted);
                        showDone();
                    });
                } else {
                    this.copyFallback(formatted);
                    showDone();
                }
            });
        }
    }

    copyFallback(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
    }

    showToastFeedback(btn, message, isError = false) {
        const originalText = btn.innerHTML;
        btn.innerHTML = isError
            ? `<i class="fa-solid fa-triangle-exclamation me-1"></i> ${message}`
            : `<i class="fa-solid fa-check me-1"></i> ${message}`;
        setTimeout(() => { btn.innerHTML = originalText; }, 1500);
    }

    /**
     * Maneja el evento 'input' del campo de texto
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

        this.state.pEnteraStr = pEnteraStr;
        this.state.pDecimalStr = pDecimalStr;
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
        this.renderMathAnalysis(pEnteraStr, pDecimalStr);
    }

    /**
     * Actualiza la interfaz con el estado actual
     */
    renderUI(pEnteraStr, pDecimalStr) {
        if (this.elements.simpleResultDiv) {
            this.elements.simpleResultDiv.textContent = this.state.simpleText.charAt(0).toUpperCase() + this.state.simpleText.slice(1);
        }
        this.phoneticMode.render(this.state.simpleText);
        this.formalMode.render(pEnteraStr, pDecimalStr);
    }

    /**
     * Calcula y presenta el análisis matemático
     */
    renderMathAnalysis(pEnteraStr, pDecimalStr) {
        if (!this.elements.mathContentDiv) return;
        const numVal = parseFloat(`${pEnteraStr}.${pDecimalStr || '0'}`);
        if (isNaN(numVal)) {
            this.elements.mathContentDiv.innerHTML = this.placeholders.math;
            return;
        }

        const isInteger = !pDecimalStr || parseInt(pDecimalStr, 10) === 0;
        const intNum = parseInt(pEnteraStr, 10);
        const isPar = isInteger && (intNum % 2 === 0);
        const paridadText = isInteger ? (isPar ? "Par" : "Impar") : "Decimal";
        const paridadIcon = isInteger ? (isPar ? "fa-equals text-success" : "fa-not-equal text-warning") : "fa-circle-dot text-info";

        // Notación científica
        let scientificStr = "";
        try {
            const exp = numVal.toExponential(4);
            const [base, power] = exp.split('e');
            scientificStr = `${base} × 10<sup>${parseInt(power, 10)}</sup>`;
        } catch {
            scientificStr = "-";
        }

        // Descomposición polinómica
        let polynomialChips = [];
        const digits = pEnteraStr.split('');
        const len = digits.length;
        digits.forEach((d, i) => {
            const digitInt = parseInt(d, 10);
            if (digitInt > 0) {
                const placeVal = digitInt * Math.pow(10, len - 1 - i);
                polynomialChips.push(`<span class="ln-poly-chip">${placeVal}</span>`);
            }
        });
        if (pDecimalStr) {
            pDecimalStr.split('').forEach((d, i) => {
                const digitInt = parseInt(d, 10);
                if (digitInt > 0) {
                    const decVal = (digitInt / Math.pow(10, i + 1)).toFixed(i + 1);
                    polynomialChips.push(`<span class="ln-poly-chip dec">${decVal}</span>`);
                }
            });
        }
        if (polynomialChips.length === 0) {
            polynomialChips.push(`<span class="ln-poly-chip">0</span>`);
        }
        const polynomialHtml = polynomialChips.join('<span class="ln-poly-plus">+</span>');

        // Divisibilidad rápida
        let divisibilityBadges = [];
        if (isInteger && intNum > 0) {
            [2, 3, 5, 10].forEach(d => {
                if (intNum % d === 0) {
                    divisibilityBadges.push(`<span class="ln-chip-badge">÷${d}</span>`);
                }
            });
        }

        this.elements.mathContentDiv.innerHTML = `
            <div class="ln-math-grid">
                <div class="ln-math-tile">
                    <i class="fa-solid ${paridadIcon} ln-math-tile-icon"></i>
                    <div class="ln-math-tile-info">
                        <span class="ln-math-tile-label">Tipo</span>
                        <strong class="ln-math-tile-val">${paridadText}</strong>
                    </div>
                </div>

                <div class="ln-math-tile">
                    <i class="fa-solid fa-calculator text-primary ln-math-tile-icon"></i>
                    <div class="ln-math-tile-info">
                        <span class="ln-math-tile-label">Cifras</span>
                        <strong class="ln-math-tile-val">${pEnteraStr.length}E${pDecimalStr ? ` | ${pDecimalStr.length}D` : ''}</strong>
                    </div>
                </div>

                <div class="ln-math-tile">
                    <i class="fa-solid fa-atom text-info ln-math-tile-icon"></i>
                    <div class="ln-math-tile-info">
                        <span class="ln-math-tile-label">Científica</span>
                        <strong class="ln-math-tile-val">${scientificStr}</strong>
                    </div>
                </div>

                ${isInteger && divisibilityBadges.length > 0 ? `
                <div class="ln-math-tile">
                    <i class="fa-solid fa-divide text-warning ln-math-tile-icon"></i>
                    <div class="ln-math-tile-info">
                        <span class="ln-math-tile-label">Divisible</span>
                        <div class="ln-chips-wrap">${divisibilityBadges.join(' ')}</div>
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="ln-poly-section">
                <span class="ln-poly-label"><i class="fa-solid fa-cubes-stacked me-1"></i> Descomposición:</span>
                <div class="ln-poly-container">${polynomialHtml}</div>
            </div>
        `;
    }

    /**
     * Restablece el estado de la interfaz
     */
    resetUI() {
        this.state = {
            simpleText: "",
            formalText: "",
            integerText: "",
            decimalText: "",
            unitText: "",
            pEnteraStr: "",
            pDecimalStr: ""
        };
        if (this.elements.simpleResultDiv) this.elements.simpleResultDiv.innerHTML = this.placeholders.simple;
        if (this.elements.mathContentDiv) this.elements.mathContentDiv.innerHTML = this.placeholders.math;
        this.phoneticMode.reset();
        this.formalMode.reset();
    }

    playSimple() {
        if (!this.state.simpleText) return;
        SpeechService.speak(this.state.simpleText);
    }

    playPhonetic() {
        if (!this.state.simpleText) return;
        this.phoneticMode.play(this.state.simpleText);
    }

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
            // =======================================================
            // --- LÓGICA PARA GESTIONAR TEMAS DE COLOR ---
            // =======================================================
            const themeManager = {
                STORAGE_KEY_NAME: 'calculator_theme_name',
                STORAGE_KEY_CUSTOM: 'calculator_custom_theme',
                
                predefinedThemes: {
                    ocean: {
                        '--btn-num-bg': '#87CEEB', // SkyBlue
                        '--btn-op-bg': '#20B2AA',  // LightSeaGreen
                        '--btn-special-bg': '#4682B4', // SteelBlue
                        '--btn-equal-bg': '#00CED1', // DarkTurquoise
                        '--btn-text-color': '#000',
                    },
                    sunset: {
                        '--btn-num-bg': '#FFD700', // Gold
                        '--btn-op-bg': '#E32636',  // Alizarin Crimson
                        '--btn-special-bg': '#8A2BE2', // BlueViolet
                        '--btn-equal-bg': '#FF4500', // OrangeRed
                        '--btn-text-color': '#fff',
                    },
                    forest: {
                        '--btn-num-bg': '#90EE90', // LightGreen
                        '--btn-op-bg': '#8B4513',  // SaddleBrown
                        '--btn-special-bg': '#006400', // DarkGreen
                        '--btn-equal-bg': '#556B2F', // DarkOliveGreen
                        '--btn-text-color': '#fff',
                    },
                    grayscale: {
                        '--btn-num-bg': '#DCDCDC',
                        '--btn-op-bg': '#A9A9A9',
                        '--btn-special-bg': '#808080',
                        '--btn-equal-bg': '#696969',
                        '--btn-text-color': '#000',
                    },
                    hacker: {
                        '--btn-num-bg': '#1C1C1C',
                        '--btn-op-bg': '#101010',
                        '--btn-special-bg': '#0A0A0A',
                        '--btn-equal-bg': '#003300',
                        '--btn-text-color': '#00FF00',
                    },
                    martian: {
                        '--btn-num-bg': '#D27D2D',
                        '--btn-op-bg': '#8B0000',
                        '--btn-special-bg': '#C1440E',
                        '--btn-equal-bg': '#FF4500',
                        '--btn-text-color': '#F5DEB3',
                    },
                    trump: {
                        '--btn-num-bg': '#FFD700', // Gold
                        '--btn-op-bg': '#E0162B',  // Red
                        '--btn-special-bg': '#002868', // Blue
                        '--btn-equal-bg': '#FFFFFF', // White
                        '--btn-text-color': '#000000', // Black
                    }
                },
        
                applyTheme(theme) {
                    const root = document.documentElement;
                    Object.entries(theme).forEach(([key, value]) => {
                        root.style.setProperty(key, value);
                    });
                },
        
                resetTheme() {
                    const root = document.documentElement;
                    const themeKeys = ['--btn-num-bg', '--btn-op-bg', '--btn-special-bg', '--btn-equal-bg', '--btn-text-color'];
                    themeKeys.forEach(key => root.style.removeProperty(key));
                },
        
                generateRandomTheme() {
                    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                    const theme = {
                        '--btn-num-bg': randomColor(),
                        '--btn-op-bg': randomColor(),
                        '--btn-special-bg': randomColor(),
                        '--btn-equal-bg': randomColor(),
                        '--btn-text-color': '#000', // Se puede mejorar con un cálculo de luminancia
                    };
                    this.applyTheme(theme);
                    localStorage.setItem(this.STORAGE_KEY_NAME, 'custom');
                    localStorage.setItem(this.STORAGE_KEY_CUSTOM, JSON.stringify(theme));
                    return theme;
                },
        
                init() {
                    const themeName = localStorage.getItem(this.STORAGE_KEY_NAME);
                    if (!themeName || themeName === 'default') { this.resetTheme(); return; }
                    if (themeName === 'custom') {
                        const customTheme = localStorage.getItem(this.STORAGE_KEY_CUSTOM);
                        if (customTheme) { this.applyTheme(JSON.parse(customTheme)); }
                    } else if (this.predefinedThemes[themeName]) {
                        this.applyTheme(this.predefinedThemes[themeName]);
                    }
                }
            };
        
            // Cargar y aplicar el tema guardado al iniciar la aplicación.
            themeManager.init();

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
                        <div class="ln-hub">
                            <!-- Barra Superior Compacta: Input + Acciones en una sola fila -->
                            <div class="ln-top-bar">
                                <div class="ln-input-group">
                                    <i class="fa-solid fa-calculator ln-input-icon"></i>
                                    <input type="text" id="numero" class="ln-input" placeholder="Ej: 564 o 1234,56" autocomplete="off" aria-label="Número para leer">
                                    <button id="ln-clear-btn" class="ln-btn-ghost" type="button" title="Limpiar" aria-label="Limpiar">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <div class="ln-quick-actions">
                                    <button id="ln-import-calc-btn" class="ln-badge-btn" type="button" title="Pegar número de la calculadora">
                                        <i class="fa-solid fa-arrow-down-to-bracket me-1"></i> Cargar de Calculadora
                                    </button>
                                    <button id="ln-random-btn" class="ln-badge-btn" type="button" title="Generar número al azar">
                                        <i class="fa-solid fa-dice me-1"></i> Ejemplo al azar
                                    </button>
                                </div>
                            </div>

                            <!-- Barra de Pestañas Segmentada Compacta -->
                            <div class="ln-tabs-bar" role="tablist">
                                <button class="ln-tab-btn active" data-tab="simple" type="button" role="tab" aria-selected="true">
                                    <i class="fa-solid fa-book-open me-1"></i> Lectura Escrita
                                </button>
                                <button class="ln-tab-btn" data-tab="phonetic" type="button" role="tab" aria-selected="false">
                                    <i class="fa-solid fa-microphone-lines me-1"></i> Fonética & Sílabas
                                </button>
                                <button class="ln-tab-btn" data-tab="formal" type="button" role="tab" aria-selected="false">
                                    <i class="fa-solid fa-chart-column me-1"></i> Gráfico Posicional
                                </button>
                                <button class="ln-tab-btn" data-tab="math" type="button" role="tab" aria-selected="false">
                                    <i class="fa-solid fa-square-root-variable me-1"></i> Análisis Matemático
                                </button>
                            </div>

                            <!-- Área de Paneles (Todo Visible, CERO Scroll) -->
                            <div class="ln-tab-content">
                                <!-- Panel 1: Lectura Escrita -->
                                <div class="ln-tab-pane active" id="ln-pane-simple">
                                    <div class="ln-card">
                                        <div class="ln-card-header">
                                            <span id="resultado-label" class="ln-card-title">
                                                <i class="fa-solid fa-quote-left me-1"></i> Lectura en palabras:
                                            </span>
                                            <button id="ln-copy-simple-btn" class="ln-btn-sm" type="button" title="Copiar lectura">
                                                <i class="fa-regular fa-copy me-1"></i> <span class="copy-text">Copiar</span>
                                            </button>
                                        </div>
                                        <div id="resultado" class="result-box ln-readable-box" aria-live="polite">
                                            <span class="placeholder-text">Introduce un número para ver su lectura aquí.</span>
                                        </div>
                                        <div class="ln-audio-bar">
                                            <button id="play-simple-btn" class="play-btn ln-play-main" type="button" aria-label="Escuchar lectura">
                                                <i class="fa-solid fa-volume-high me-1"></i> Escuchar Lectura
                                            </button>
                                            <div class="ln-speed-controls" title="Velocidad de voz">
                                                <span class="ln-speed-label">Velocidad:</span>
                                                <button class="ln-speed-btn" type="button" data-speed="0.8">0.8x</button>
                                                <button class="ln-speed-btn active" type="button" data-speed="1.0">1.0x</button>
                                                <button class="ln-speed-btn" type="button" data-speed="1.25">1.25x</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Panel 2: Modo Fonético -->
                                <div class="ln-tab-pane" id="ln-pane-phonetic">
                                    <div class="ln-card">
                                        <div class="ln-card-header">
                                            <span id="fonetico-label" class="ln-card-title">
                                                <i class="fa-solid fa-spell-check me-1"></i> Desglose Fonético & Sílabas:
                                            </span>
                                            <span class="ln-badge-info"><i class="fa-solid fa-wand-magic-sparkles me-1"></i> Sincronizado</span>
                                        </div>
                                        <div id="aprendizaje-fonetico-resultado" class="result-box phonetic-box ln-phonetic-glow" aria-live="polite">
                                            <span class="placeholder-text">El desglose fonético aparecerá aquí.</span>
                                        </div>
                                        <div class="ln-audio-bar">
                                            <button id="play-phonetic-btn" class="play-btn ln-play-main" type="button" aria-label="Escuchar sílabas">
                                                <i class="fa-solid fa-headphones me-1"></i> Escuchar Sílabas
                                            </button>
                                            <div class="ln-speed-controls" title="Velocidad de voz">
                                                <span class="ln-speed-label">Velocidad:</span>
                                                <button class="ln-speed-btn" type="button" data-speed="0.8">0.8x</button>
                                                <button class="ln-speed-btn active" type="button" data-speed="1.0">1.0x</button>
                                                <button class="ln-speed-btn" type="button" data-speed="1.25">1.25x</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Panel 3: Modo Formal Gráfico -->
                                <div class="ln-tab-pane" id="ln-pane-formal">
                                    <div class="ln-card">
                                        <div class="ln-card-header">
                                            <span id="formal-label" class="ln-card-title">
                                                <i class="fa-solid fa-shapes me-1"></i> Valor Posicional y Notación Formal:
                                            </span>
                                            <span class="ln-badge-info"><i class="fa-solid fa-eye me-1"></i> Gráfico</span>
                                        </div>
                                        <div id="aprendizaje-formal-wrapper" class="result-box svg-box ln-svg-wrapper" aria-live="polite">
                                            <span class="placeholder-text">Gráfico de valor posicional...</span>
                                        </div>
                                        <div class="ln-audio-bar">
                                            <button id="play-formal-btn" class="play-btn ln-play-main" type="button" aria-label="Explicar gráfico">
                                                <i class="fa-solid fa-chalkboard-user me-1"></i> Explicar Gráfica
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Panel 4: Análisis Matemático -->
                                <div class="ln-tab-pane" id="ln-pane-math">
                                    <div class="ln-card">
                                        <div class="ln-card-header">
                                            <span class="ln-card-title">
                                                <i class="fa-solid fa-chart-pie me-1"></i> Propiedades y Análisis Matemático:
                                            </span>
                                            <span class="ln-badge-info"><i class="fa-solid fa-brain me-1"></i> En tiempo real</span>
                                        </div>
                                        <div id="ln-math-content" class="ln-math-container">
                                            <div class="ln-math-empty placeholder-text">Ingresa un número para calcular su análisis.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    onShow: () => {
                        new NumberReaderApp();
                        const numberInput = document.getElementById('numero');
                        if (numberInput) {
                            setTimeout(() => numberInput.focus(), 80);
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
                    // El cuerpo ahora se llenará dinámicamente desde el template.
                    body: `<div id="config-panel-container"></div>`,
                    onShow: () => {
                        // 1. Inyectar el contenido del template en el modal
                        const container = document.getElementById('config-panel-container');
                        const template = document.getElementById('config-modal-template');
                        if (container && template) {
                            const clone = template.content.cloneNode(true);
                            container.appendChild(clone);
                        }

                        // 2. Inicializar la lógica de los ajustes existentes (velocidad, sonido, etc.)
                        // Esto ahora funciona sobre el contenido que acabamos de inyectar.
                        settingsManager.initUI();

                        // 3. Implementar la nueva lógica para el botón de función especial
                        const specialFunctionSelect = document.getElementById('special-function-select');
                        const tmodButton = document.getElementById('tmod');
                        const STORAGE_KEY = 'calculator_special_function';

                        if (!specialFunctionSelect || !tmodButton) return;

                        // Función para actualizar el botón en el teclado
                        const updateSpecialButton = (selectedOption) => {
                            if (!selectedOption) return;
                            const { text, action, value } = selectedOption.dataset; // El 'value' del option es la clave (ej: 'primos')
                            const ariaLabel = selectedOption.getAttribute('aria-label');

                            // --- MEJORA: Usar un icono para funciones especiales como "Factores Primos" ---
                            if (selectedOption.value === 'primos') {
                                tmodButton.innerHTML = '<i class="fa-solid fa-sitemap"></i>';
                            } else {
                                tmodButton.textContent = text;
                            }
                            tmodButton.dataset.action = action;
                            tmodButton.dataset.value = value;
                            tmodButton.setAttribute('aria-label', ariaLabel || text);
                        };

                        // Evento para cuando el usuario cambia la selección
                        specialFunctionSelect.addEventListener('change', (e) => {
                            const selectedOption = e.target.selectedOptions[0];
                            updateSpecialButton(selectedOption);
                            localStorage.setItem(STORAGE_KEY, selectedOption.value);
                        });

                        // Cargar y aplicar la configuración guardada al abrir el modal
                        const savedFunction = localStorage.getItem(STORAGE_KEY);
                        if (savedFunction) {
                            specialFunctionSelect.value = savedFunction;
                        }

                        // Aplicar el estado inicial (ya sea guardado o por defecto)
                        updateSpecialButton(specialFunctionSelect.selectedOptions[0]);

                        // 4. Implementar la nueva lógica para el cambio de tema
                        const themeSelect = document.getElementById('theme-select');
                        const randomThemeBtn = document.getElementById('random-theme-btn');
                        const resetThemeBtn = document.getElementById('reset-theme-btn');

                        if (themeSelect && randomThemeBtn && resetThemeBtn) {
                            const customOption = themeSelect.querySelector('option[value="custom"]');

                            // Cargar el estado guardado en el select
                            const savedThemeName = localStorage.getItem(themeManager.STORAGE_KEY_NAME) || 'default';
                            themeSelect.value = savedThemeName;
                            customOption.disabled = savedThemeName !== 'custom';

                            // Evento para el selector de temas predefinidos
                            themeSelect.addEventListener('change', (e) => {
                                const selectedTheme = e.target.value;
                                customOption.disabled = true;
                                if (selectedTheme === 'default') {
                                    themeManager.resetTheme();
                                    localStorage.setItem(themeManager.STORAGE_KEY_NAME, 'default');
                                    localStorage.removeItem(themeManager.STORAGE_KEY_CUSTOM);
                                } else if (themeManager.predefinedThemes[selectedTheme]) {
                                    themeManager.applyTheme(themeManager.predefinedThemes[selectedTheme]);
                                    localStorage.setItem(themeManager.STORAGE_KEY_NAME, selectedTheme);
                                    localStorage.removeItem(themeManager.STORAGE_KEY_CUSTOM);
                                }
                            });

                            // Evento para el botón de tema aleatorio
                            randomThemeBtn.addEventListener('click', () => {
                                themeManager.generateRandomTheme();
                                customOption.disabled = false;
                                themeSelect.value = 'custom';
                            });

                            // Evento para el botón de restaurar tema por defecto
                            resetThemeBtn.addEventListener('click', () => {
                                // Simular el cambio en el select para reutilizar la lógica
                                themeSelect.value = 'default';
                                themeSelect.dispatchEvent(new Event('change'));
                            });
                        }
                    }
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
                        modalTitle.textContent = data.title;
                        modalBody.innerHTML = data.body;
                        infoModal.show();
                        if (data.onShow) {
                            try { data.onShow(); } catch (err) { console.error('Error onShow:', err); }
                        }
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
