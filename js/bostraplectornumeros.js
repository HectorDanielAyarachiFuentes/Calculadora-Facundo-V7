// =======================================================
// --- CLASES DE UTILIDAD (Refactorizadas) ---
// =======================================================

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
        word = word.toLowerCase().trim();
        if (word.length <= 3) return [word];
        word = word.replace(/y/g, "i");
        const syllables = [];
        let i = 0;
        while (i < word.length) {
            let start = i;
            while (start < word.length && !/[aeiouáéíóú]/.test(word[start])) start++;
            while (start < word.length && /[aeiouáéíóú]/.test(word[start])) start++;
            let end = start;
            if (start < word.length - 1) {
                const consonantCluster = word.substring(start).match(/^[^aeiouáéíóú]+/);
                if (consonantCluster) {
                    const cluster = consonantCluster[0];
                    if (cluster.length === 1 || (cluster.length === 2 && /^(ll|rr|ch|[bcdfghprt]l|[bcdfghprt]r)$/.test(cluster))) {
                        end = start;
                    } else if (cluster.length >= 2) {
                        end = start + 1;
                    }
                }
            } else {
                end = word.length;
            }
            syllables.push(word.substring(i, end));
            i = end;
        }
        return syllables.filter(Boolean);
    }
}

/**
 * Proporciona una interfaz estática para la API de Síntesis de Voz del navegador.
 * Permite reproducir texto con callbacks para eventos de límite de palabra y finalización.
 */
class SpeechService {
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
        document.addEventListener('DOMContentLoaded', () => {
            const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

            const infoModalEl = document.getElementById('infoModal');
            const infoModal = new bootstrap.Modal(infoModalEl);
            const modalTitle = document.getElementById('infoModalLabel');
            const modalBody = document.getElementById('infoModalBody');
            
            const infoData = {
                readNumbers: {
                    title: "Lector de Números Avanzado",
                    body: `<div class="input-section"><label for="numero">Introduce el número:</label><input type="text" id="numero" placeholder="Ej: 1234,56" autocomplete="off"></div><div class="card"><h2>Lectura Simple</h2><div id="resultado" class="result-box"><span class="placeholder-text">...</span></div><button id="play-simple-btn" class="play-btn">▶️ Escuchar</button></div><div class="card"><h2>Modo de Aprendizaje Fonético</h2><div id="aprendizaje-fonetico-resultado" class="result-box phonetic-box"><span class="placeholder-text">...</span></div><button id="play-phonetic-btn" class="play-btn">▶️ Escuchar y Resaltar</button></div><div class="card"><h2>Modo de Aprendizaje Formal (Gráfico)</h2><div id="aprendizaje-formal-wrapper" class="result-box svg-box"><span class="placeholder-text">...</span></div><button id="play-formal-btn" class="play-btn">▶️ Escuchar y Resaltar</button></div>`,
                    onShow: () => {
                        // La inicialización ahora es crear una nueva instancia de la app.
                        // Esto asegura un estado limpio cada vez que se abre el modal.
                        new NumberReaderApp();
                    }
                },
                geometry: { 
                    title: "Conceptos de Geometría", 
                    body: `<div id="geometry-container" class="geometry-container"></div>`,
                    onShow: function() {
                        console.log('Modal de geometría mostrado');
                        // Aumentar el tiempo de espera para asegurar que el DOM esté listo
                        setTimeout(() => {
                            if (window.GeometryUI && typeof window.GeometryUI.init === 'function') {
                                try {
                                    window.GeometryUI.init();
                                    console.log('GeometryUI inicializado correctamente');
                                } catch (error) {
                                    console.error('Error al inicializar GeometryUI:', error);
                                }
                            } else {
                                console.error('GeometryUI no está disponible');
                            }
                        }, 300); // Aumentar el retraso para asegurar que el DOM esté completamente listo
                    }
                },
                config: { title: "Panel de Configuración", body: `<p>Modulo en construccion 🧐.</p>` },
                help: { title: "Centro de Ayuda", body: `<p>Encuentra respuestas a preguntas frecuentes (FAQ).</p>` }
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

            infoModalEl.addEventListener('hide.bs.modal', () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); });
            
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
        });
