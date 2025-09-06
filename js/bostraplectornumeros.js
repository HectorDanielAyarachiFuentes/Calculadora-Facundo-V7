// ====== INICIO: CÓDIGO COMPLETO DE LA APP "LECTOR DE NÚMEROS" ======
        const NumberConverter = {
            _unidades: ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"],
            _especiales: ["diez", "once", "doce", "trece", "catorce", "quince"],
            _decenas: ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"],
            _centenas: ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"],
            _decimalPlaces: ["", "DÉCIMOS", "CENTÉSIMOS", "MILÉSIMOS", "DIEZMILÉSIMOS", "CIENMILÉSIMOS", "MILLONÉSIMOS"],
            toLetters(n) { if (isNaN(n) || n === null) return ""; if (n === 0) return "cero"; if (n < 0) return "menos " + this.toLetters(Math.abs(n)); let t = ""; if (n >= 1e6) { const o = Math.floor(n / 1e6); t += (1 === o ? "un millón" : this.toLetters(o) + " millones"); n %= 1e6; if (n > 0) t += " "; } if (n >= 1e3) { const o = Math.floor(n / 1e3); if (1 === o) { t += "mil"; } else { let e = this.toLetters(o); if (e.endsWith("uno")) e = e.slice(0, -1) + "ún"; t += e + " mil"; } n %= 1e3; if (n > 0) t += " "; } if (n >= 100) { const o = Math.floor(n / 100); t += (1 === o && n % 100 > 0 ? "ciento" : this._centenas[o]); n %= 100; if (n > 0) t += " "; } if (n > 0) { if (n >= 10 && n <= 15) t += this._especiales[n - 10]; else if (n >= 16 && n <= 19) t += "dieci" + this._unidades[n - 10]; else if (n === 20) t += "veinte"; else if (n > 20 && n < 30) t += "veinti" + this._unidades[n - 20]; else if (n >= 30) { const o = Math.floor(n / 10); t += this._decenas[o]; if ((n %= 10) > 0) t += " y " + this._unidades[n]; } else { t += this._unidades[n]; } } return t.trim(); },
            formalDecimalsToLetters(d) { if (!d) return { texto: "", unidad: "" }; const n = parseInt(d, 10); const l = d.length; let t = this.toLetters(n); let u = this._decimalPlaces[l] ? this._decimalPlaces[l].toLowerCase().replace("_", "") : ""; if (n === 1 && u.endsWith("s")) { u = u.slice(0, -1); } return { texto: t, unidad: u }; },
            simpleDecimalsToLetters(d) { return d.split('').map(c => this._unidades[parseInt(c, 10)]).join(' '); }
        };
        const Syllabifier = { syllabify(p) { p = p.toLowerCase().trim(); if (p.length <= 3) return [p]; p = p.replace(/y/g, "i"); let s = [], i = 0; while (i < p.length) { let t = i; while (t < p.length && !/[aeiouáéíóú]/.test(p[t])) t++; while (t < p.length && /[aeiouáéíóú]/.test(p[t])) t++; let c = t; if (t < p.length - 1) { const e = p.substring(t).match(/^[^aeiouáéíóú]+/); if (e) { const n = e[0]; if (n.length === 1 || (n.length === 2 && /^(ll|rr|ch|[bcdfghprt]l|[bcdfghprt]r)$/.test(n))) c = t; else if (n.length >= 2) c = t + 1; } } else c = p.length; s.push(p.substring(i, c)); i = c; } return s.filter(Boolean); } };
        const SpeechService = { speak(text, lang = 'es-ES', onBoundaryCallback = null, onEndCallback = null) { if (!text || typeof window.speechSynthesis === 'undefined') { if(onEndCallback) onEndCallback(); return; } window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang; if (onBoundaryCallback) { utterance.onboundary = onBoundaryCallback; } if (onEndCallback) { utterance.onend = onEndCallback; } window.speechSynthesis.speak(utterance); } };
        const FormalMode = {
            element: null, placeholder: '<span class="placeholder-text">Representación gráfica...</span>', init(selector) { this.element = document.querySelector(selector); this.reset(); }, reset() { this.element.innerHTML = this.placeholder; },
            render(pEnteraStr, pDecimalStr) { this.element.innerHTML = ''; const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); this.element.appendChild(svg); const digitWidth = 55, startX = 40, numY = 160, mainLabelY = 100, verticalLabelY = 80, fontSize = 72, viewBoxHeight = 220; let currentX = startX; const integerBlockWidth = pEnteraStr.length * digitWidth; const integerBlockCenterX = currentX + (integerBlockWidth / 2); svg.innerHTML += `<text x="${integerBlockCenterX}" y="${mainLabelY}" class="svg-etiqueta-principal" text-anchor="middle">PARTE ENTERA</text>`; svg.innerHTML += `<rect x="${currentX - 5}" y="${numY - fontSize + 10}" width="${integerBlockWidth + 10}" height="${fontSize}" fill="transparent" />`; svg.innerHTML += `<text id="svg-entero-texto" x="${integerBlockCenterX}" y="${numY}" class="svg-numero" style="fill: var(--ln-color-entero)" text-anchor="middle">${pEnteraStr}</text>`; currentX += integerBlockWidth + 20; // Aumentamos el espacio inicial

    if (pEnteraStr && pDecimalStr) { 
        // Línea divisoria vertical con estilo más prominente
        svg.innerHTML += `
            <line 
                x1="${currentX}"
                y1="30"
                x2="${currentX}"
                y2="${viewBoxHeight}"
                stroke="#333"
                stroke-width="4"
                stroke-dasharray="none"
            />`;
        
        // Mayor espacio antes de la coma
        currentX += 40;
        
        // Coma con posicionamiento explícito y tamaño ajustado
        svg.innerHTML += `
            <text 
                x="${currentX}" 
                y="${numY}" 
                class="svg-numero" 
                style="fill: var(--ln-color-coma); font-size: 72px;"
            >,</text>`;
        
        // Mayor espacio después de la coma
        currentX += 40;
    }

    // Eliminar la segunda línea divisoria que podría estar causando conflicto
    // Comentar o eliminar la línea que comienza con gEtiquetas.innerHTML += `<line x1="${startDecimalX - 15}"...
    
    const gDecimales = document.createElementNS("http://www.w3.org/2000/svg", "g"); gDecimales.id = "svg-decimales-g"; const gEtiquetas = document.createElementNS("http://www.w3.org/2000/svg", "g"); gEtiquetas.id = "svg-etiquetas-g"; svg.appendChild(gDecimales); svg.appendChild(gEtiquetas); let startDecimalX = currentX; const decimalPlaces = NumberConverter._decimalPlaces; pDecimalStr.split('').forEach((digit, index) => { if (index < decimalPlaces.length - 1) { const digitCenterX = currentX + (digitWidth / 2); gDecimales.innerHTML += `<rect x="${currentX}" y="${numY - fontSize + 10}" width="${digitWidth}" height="${fontSize}" fill="transparent" />`; gDecimales.innerHTML += `<text x="${digitCenterX}" y="${numY}" class="svg-numero" style="fill: var(--ln-color-decimal)" text-anchor="middle">${digit}</text>`; gEtiquetas.innerHTML += `<line x1="${currentX + digitWidth}" y1="40" x2="${currentX + digitWidth}" y2="${viewBoxHeight}" stroke="#ccc" stroke-dasharray="5,5" />`; gEtiquetas.innerHTML += `<text x="${digitCenterX}" y="${verticalLabelY}" class="svg-etiqueta-vertical" transform="rotate(-90 ${digitCenterX},${verticalLabelY})">${decimalPlaces[index + 1].replace("_", "")}</text>`; currentX += digitWidth; } }); gEtiquetas.innerHTML += `
    <line 
        x1="${startDecimalX - 15}" 
        y1="40" 
        x2="${startDecimalX - 15}" 
        y2="${viewBoxHeight}" 
        stroke="var(--ln-color-entero)" 
        stroke-width="2" 
        stroke-dasharray="8,4"
    />`; svg.setAttribute('viewBox', `0 0 ${currentX + 20} ${viewBoxHeight}`); },
            play({ fullText, integerText, decimalText, unitText }) { if (!fullText) return; const enteroSVG = document.getElementById('svg-entero-texto'); const decimalSVG = document.getElementById('svg-decimales-g'); const etiquetaSVG = document.getElementById('svg-etiquetas-g'); const onBoundary = (e) => { if (e.name !== 'word') return; const currentText = fullText.substring(0, e.charIndex + e.charLength); [enteroSVG, decimalSVG, etiquetaSVG].forEach(el => el && el.classList.remove('highlight')); if(decimalSVG) Array.from(decimalSVG.children).forEach(el => el.classList.remove('highlight')); if (enteroSVG && integerText && currentText.includes(integerText)) enteroSVG.classList.add('highlight'); if (decimalSVG && decimalText && currentText.includes(decimalText)) decimalSVG.querySelectorAll('text').forEach(el => el.classList.add('highlight')); if (etiquetaSVG && unitText && currentText.includes(unitText)) { decimalSVG.querySelectorAll('text').forEach(el => el.classList.remove('highlight')); etiquetaSVG.classList.add('highlight'); } }; const onEnd = () => [enteroSVG, decimalSVG, etiquetaSVG].forEach(el => el && el.classList.remove('highlight')); SpeechService.speak(fullText, 'es-ES', onBoundary, onEnd); }
        };
        const PhoneticMode = {
            element: null, placeholder: '<span class="placeholder-text">Desglose fonético...</span>', init(selector) { this.element = document.querySelector(selector); this.reset(); },
            reset() { this.element.innerHTML = this.placeholder; }, render(text) { this.element.innerHTML = ''; if (!text) { this.reset(); return; } text.split(/\s+/).filter(Boolean).forEach((palabra, index) => { const span = document.createElement('span'); span.className = 'palabra-fonetica'; let silabas = Syllabifier.syllabify(palabra).join('-'); span.textContent = (index === 0) ? silabas.charAt(0).toUpperCase() + silabas.slice(1) : silabas; this.element.appendChild(span); }); },
            play(text) { if (!text) return; const syllables = Array.from(this.element.querySelectorAll('.palabra-fonetica')); let wordIndex = 0; const onBoundary = (event) => { if (event.name === 'word') { syllables.forEach(s => s.classList.remove('highlight')); if (syllables[wordIndex]) { syllables[wordIndex].classList.add('highlight'); } wordIndex++; } }; const onEnd = () => syllables.forEach(s => s.classList.remove('highlight')); SpeechService.speak(text, 'es-ES', onBoundary, onEnd); }
        };
        const App = {
            elements: { input: null, simpleResultDiv: null, playSimpleBtn: null, playPhoneticBtn: null, playFormalBtn: null }, state: { simpleText: "", formalText: "", integerText: "", decimalText: "", unitText: "" },
            placeholders: { simple: '<span class="placeholder-text">La lectura del número aparecerá aquí.</span>' }, init() { this.elements.input = document.getElementById("numero"); this.elements.simpleResultDiv = document.getElementById("resultado"); this.elements.playSimpleBtn = document.getElementById("play-simple-btn"); this.elements.playPhoneticBtn = document.getElementById("play-phonetic-btn"); this.elements.playFormalBtn = document.getElementById("play-formal-btn"); if(!this.elements.input) return; PhoneticMode.init("#aprendizaje-fonetico-resultado"); FormalMode.init("#aprendizaje-formal-wrapper"); this.elements.input.addEventListener("input", this.handleInput.bind(this)); this.elements.playSimpleBtn.addEventListener("click", this.playSimple.bind(this)); this.elements.playPhoneticBtn.addEventListener("click", this.playPhonetic.bind(this)); this.elements.playFormalBtn.addEventListener("click", this.playFormal.bind(this)); this.resetUI(); },
            handleInput() { let val = this.elements.input.value.replace(/[^0-9,]/g, '').replace(/,/g, (m, o, s) => o === s.indexOf(',') ? ',' : ''); if (this.elements.input.value !== val) { this.elements.input.value = val; } if (!val) { this.resetUI(); return; } const parts = val.split(','); const pEnteraStr = parts[0] || '0'; const pDecimalStr = parts[1] || ''; const pEnteraNum = parseInt(pEnteraStr, 10); this.state.integerText = NumberConverter.toLetters(pEnteraNum); const simpleDecimalText = pDecimalStr ? ` coma ${NumberConverter.simpleDecimalsToLetters(pDecimalStr)}` : ""; this.state.simpleText = this.state.integerText + simpleDecimalText; const { texto, unidad } = NumberConverter.formalDecimalsToLetters(pDecimalStr); this.state.decimalText = texto; this.state.unitText = unidad; let fraseEntera = pEnteraNum === 1 && pEnteraStr.length === 1 ? "un entero" : `${this.state.integerText} enteros`; if (pEnteraStr === "0" && pDecimalStr.length > 0) fraseEntera = "cero enteros"; if (pDecimalStr) { this.state.formalText = `${fraseEntera} y ${this.state.decimalText} ${this.state.unitText}`; } else { this.state.formalText = this.state.integerText; } this.renderUI(pEnteraStr, pDecimalStr); },
            renderUI(pEnteraStr, pDecimalStr) { this.elements.simpleResultDiv.textContent = this.state.simpleText.charAt(0).toUpperCase() + this.state.simpleText.slice(1); PhoneticMode.render(this.state.simpleText); FormalMode.render(pEnteraStr, pDecimalStr); },
            resetUI() { this.state = { simpleText: "", formalText: "", integerText: "", decimalText: "", unitText: "" }; if(this.elements.simpleResultDiv) this.elements.simpleResultDiv.innerHTML = this.placeholders.simple; PhoneticMode.reset(); FormalMode.reset(); },
            playSimple() { if (!this.state.simpleText) return; SpeechService.speak(this.state.simpleText); }, playPhonetic() { if (!this.state.simpleText) return; PhoneticMode.play(this.state.simpleText); },
            playFormal() { if (!this.state.formalText) return; FormalMode.play({ fullText: this.state.formalText, integerText: this.state.integerText, decimalText: this.state.decimalText, unitText: this.state.unitText }); }
        };

        // ====== ORQUESTADOR PRINCIPAL DE BOOTSTRAP ======
        document.addEventListener('DOMContentLoaded', () => {
            const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

            const infoModalEl = document.getElementById('infoModal');
            const infoModal = new bootstrap.Modal(infoModalEl);
            const modalTitle = document.getElementById('infoModalLabel');
            const modalBody = document.getElementById('infoModalBody');
            
            const infoData = {
                readNumbers: { title: "Lector de Números Avanzado", body: `<div class="input-section"><label for="numero">Introduce el número:</label><input type="text" id="numero" placeholder="Ej: 1234,56" autocomplete="off"></div><div class="card"><h2>Lectura Simple</h2><div id="resultado" class="result-box"><span class="placeholder-text">...</span></div><button id="play-simple-btn" class="play-btn">▶️ Escuchar</button></div><div class="card"><h2>Modo de Aprendizaje Fonético</h2><div id="aprendizaje-fonetico-resultado" class="result-box phonetic-box"><span class="placeholder-text">...</span></div><button id="play-phonetic-btn" class="play-btn">▶️ Escuchar y Resaltar</button></div><div class="card"><h2>Modo de Aprendizaje Formal (Gráfico)</h2><div id="aprendizaje-formal-wrapper" class="result-box svg-box"><span class="placeholder-text">...</span></div><button id="play-formal-btn" class="play-btn">▶️ Escuchar y Resaltar</button></div>`, onShow: App.init.bind(App) },
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
