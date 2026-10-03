// =======================================================
// --- geometry.js (PRO EDUCATIVO Y BLUEPRINT CAD) ---
// =======================================================

const GeometryCalculator = {
    square: {
        area: (side) => side * side,
        perimeter: (side) => 4 * side,
        formulaArea: (vals) => `${vals.side || 'L'} × ${vals.side || 'L'}`,
        formulaPerim: (vals) => `4 × ${vals.side || 'L'}`,
        baseFormula: { area: 'A = L²', perimeter: 'P = 4L' }
    },
    rectangle: {
        area: (length, width) => length * width,
        perimeter: (length, width) => 2 * (length + width),
        formulaArea: (vals) => `${vals.length || 'b'} × ${vals.width || 'h'}`,
        formulaPerim: (vals) => `2 × (${vals.length || 'b'} + ${vals.width || 'h'})`,
        baseFormula: { area: 'A = b · h', perimeter: 'P = 2(b + h)' }
    },
    triangle: {
        area: (base, height) => (base * height) / 2,
        perimeter: (side1, side2, side3) => side1 + side2 + side3,
        formulaArea: (vals) => `(${vals.base || 'b'} × ${vals.height || 'h'}) / 2`,
        formulaPerim: (vals) => `${vals.side1 || 'a'} + ${vals.side2 || 'b'} + ${vals.side3 || 'c'}`,
        baseFormula: { area: 'A = (b · h) / 2', perimeter: 'P = a + b + c' }
    },
    circle: {
        area: (radius) => Math.PI * radius * radius,
        perimeter: (radius) => 2 * Math.PI * radius,
        formulaArea: (vals) => `π × (${vals.radius || 'r'})²`,
        formulaPerim: (vals) => `2 × π × ${vals.radius || 'r'}`,
        baseFormula: { area: 'A = π · r²', perimeter: 'P = 2πr' }
    },
    trapezoid: {
        area: (base1, base2, height) => ((base1 + base2) / 2) * height,
        perimeter: (side1, side2, base1, base2) => side1 + side2 + base1 + base2,
        formulaArea: (vals) => `((${vals.base1 || 'B'} + ${vals.base2 || 'b'}) / 2) × ${vals.height || 'h'}`,
        formulaPerim: (vals) => `${vals.base1 || 'B'} + ${vals.base2 || 'b'} + ${vals.side1 || 's1'} + ${vals.side2 || 's2'}`,
        baseFormula: { area: 'A = ((B + b) / 2) · h', perimeter: 'P = B + b + l₁ + l₂' }
    },
    rhombus: {
        area: (d1, d2) => (d1 * d2) / 2,
        perimeter: (side) => 4 * side,
        formulaArea: (vals) => `(${vals.d1 || 'D'} × ${vals.d2 || 'd'}) / 2`,
        formulaPerim: (vals) => `4 × ${vals.side || 'L'}`,
        baseFormula: { area: 'A = (D · d) / 2', perimeter: 'P = 4L' }
    }
};

class GeometryApp {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.state = {
            shape: 'square',
            calculationType: 'area',
            unit: 'cm',
            values: { side: 5 }
        };
        this.init();
    }

    init() {
        this.renderBaseLayout();
        this.bindEvents();
        this.updateUIForShape(this.state.shape);
    }

    renderBaseLayout() {
        this.container.innerHTML = `
            <div class="geometry-app">
                <div class="geometry-controls">
                    <div class="geom-top-row">
                        <div class="control-group flex-1">
                            <label for="shapeSelect" class="form-label"><i class="fa-solid fa-shapes me-1"></i> Figura</label>
                            <select id="shapeSelect" class="form-select form-select-sm">
                                <option value="square" selected>Cuadrado</option>
                                <option value="rectangle">Rectángulo</option>
                                <option value="triangle">Triángulo</option>
                                <option value="circle">Círculo</option>
                                <option value="trapezoid">Trapecio</option>
                                <option value="rhombus">Rombo</option>
                            </select>
                        </div>
                        <div class="control-group flex-1">
                            <label for="unitSelect" class="form-label"><i class="fa-solid fa-ruler me-1"></i> Unidad</label>
                            <select id="unitSelect" class="form-select form-select-sm">
                                <option value="cm" selected>Centímetros (cm)</option>
                                <option value="m">Metros (m)</option>
                                <option value="km">Kilómetros (km)</option>
                                <option value="mm">Milímetros (mm)</option>
                            </select>
                        </div>
                    </div>

                    <div class="calculation-type-toggle">
                        <div class="btn-group w-100" role="group" aria-label="Tipo de cálculo">
                            <button type="button" class="btn btn-sm btn-outline-success active" data-calc-type="area">
                                <i class="fa-solid fa-vector-square me-1"></i> Área
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-success" data-calc-type="perimeter">
                                <i class="fa-solid fa-draw-polygon me-1"></i> Perímetro
                            </button>
                        </div>
                    </div>

                    <div id="geometry-inputs" class="geometry-inputs"></div>

                    <div class="geom-formula-card">
                        <div class="geom-formula-header">
                            <span class="geom-formula-title"><i class="fa-solid fa-square-root-variable me-1"></i> Fórmula:</span>
                            <span id="geom-base-formula" class="geom-badge-formula">A = L²</span>
                        </div>
                        <div id="geom-step-by-step" class="geom-step-text">5 cm × 5 cm = 25.00 cm²</div>
                    </div>
                </div>

                <div class="geometry-display-section">
                    <div class="visualization-wrapper">
                        <button class="export-btn" id="exportSvgBtn" title="Exportar como PNG">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <div id="geometry-visualization" class="geometry-visualization highlight-area"></div>
                    </div>
                    <div id="geometry-results" class="geometry-results"></div>
                </div>
            </div>
        `;

        this.elements = {
            shapeSelect: this.container.querySelector('#shapeSelect'),
            unitSelect: this.container.querySelector('#unitSelect'),
            calcTypeButtons: this.container.querySelectorAll('.calculation-type-toggle button'),
            inputsContainer: this.container.querySelector('#geometry-inputs'),
            resultsContainer: this.container.querySelector('#geometry-results'),
            visualizationContainer: this.container.querySelector('#geometry-visualization'),
            exportBtn: this.container.querySelector('#exportSvgBtn'),
            baseFormulaBadge: this.container.querySelector('#geom-base-formula'),
            stepByStepDiv: this.container.querySelector('#geom-step-by-step')
        };
    }

    bindEvents() {
        this.elements.shapeSelect.addEventListener('change', (e) => {
            this.state.shape = e.target.value;
            this.updateUIForShape(this.state.shape);
        });

        this.elements.unitSelect.addEventListener('change', (e) => {
            this.state.unit = e.target.value;
            this.container.querySelectorAll('.input-unit').forEach(el => el.textContent = this.state.unit);
            this.calculate();
        });

        this.elements.calcTypeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                this.elements.calcTypeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.calculationType = btn.dataset.calcType;
                
                this.elements.visualizationContainer.classList.toggle('highlight-area', this.state.calculationType === 'area');
                this.elements.visualizationContainer.classList.toggle('highlight-perimeter', this.state.calculationType === 'perimeter');
                
                this.calculate();
            });
        });

        this.elements.inputsContainer.addEventListener('input', () => this.calculate());

        this.elements.resultsContainer.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('.copy-btn');
            if (copyBtn) {
                const resultType = copyBtn.dataset.resultType;
                const resultSpan = this.elements.resultsContainer.querySelector(`#${resultType}Result`);
                if (resultSpan) {
                    this.copyToClipboard(resultSpan.textContent, copyBtn);
                }
            }
        });

        this.elements.exportBtn.addEventListener('click', () => this.exportSVGAsImage());
    }

    updateUIForShape(shape) {
        let inputsHtml = '';
        const defaults = {
            square: { side: 5 },
            rectangle: { length: 8, width: 5 },
            triangle: { base: 6, height: 5, side1: 5, side2: 5, side3: 6 },
            circle: { radius: 5 },
            trapezoid: { base1: 8, base2: 5, height: 4, side1: 5, side2: 5 },
            rhombus: { d1: 8, d2: 6, side: 5 }
        };

        const def = defaults[shape] || {};
        this.state.values = { ...def };

        switch (shape) {
            case 'square':
                inputsHtml = this._createInput('side', 'Lado', def.side);
                break;
            case 'rectangle':
                inputsHtml = this._createInput('length', 'Base / Largo', def.length) +
                             this._createInput('width', 'Altura / Ancho', def.width);
                break;
            case 'triangle':
                inputsHtml = this._createInput('base', 'Base', def.base) +
                             this._createInput('height', 'Altura', def.height);
                if (this.state.calculationType === 'perimeter') {
                    inputsHtml += this._createInput('side1', 'Lado 1', def.side1) +
                                  this._createInput('side2', 'Lado 2', def.side2) +
                                  this._createInput('side3', 'Lado 3', def.side3);
                }
                break;
            case 'circle':
                inputsHtml = this._createInput('radius', 'Radio (r)', def.radius);
                break;
            case 'trapezoid':
                inputsHtml = this._createInput('base1', 'Base Mayor (B)', def.base1) +
                             this._createInput('base2', 'Base Menor (b)', def.base2) +
                             this._createInput('height', 'Altura (h)', def.height);
                if (this.state.calculationType === 'perimeter') {
                    inputsHtml += this._createInput('side1', 'Lado Lateral 1', def.side1) +
                                  this._createInput('side2', 'Lado Lateral 2', def.side2);
                }
                break;
            case 'rhombus':
                inputsHtml = this._createInput('d1', 'Diagonal Mayor (D)', def.d1) +
                             this._createInput('d2', 'Diagonal Menor (d)', def.d2) +
                             this._createInput('side', 'Lado', def.side);
                break;
        }

        this.elements.inputsContainer.innerHTML = inputsHtml;
        this.calculate();
    }

    _createInput(name, label, defaultValue = 5) {
        return `
            <div class="geom-input-card">
                <label for="input-${name}" class="geom-input-label">${label}</label>
                <div class="geom-input-wrapper">
                    <input type="number" id="input-${name}" name="${name}" class="form-control form-control-sm" value="${defaultValue}" min="0.1" step="any" required>
                    <span class="input-unit">${this.state.unit}</span>
                </div>
            </div>
        `;
    }

    _getValue(name) {
        const input = this.elements.inputsContainer.querySelector(`#input-${name}`);
        return input ? parseFloat(input.value) || 0 : (this.state.values[name] || 0);
    }

    calculate() {
        const { shape, unit, calculationType } = this.state;
        let area = 0;
        let perimeter = 0;
        const calcConfig = GeometryCalculator[shape];

        switch (shape) {
            case 'square':
                const sVal = this._getValue('side');
                area = GeometryCalculator.square.area(sVal);
                perimeter = GeometryCalculator.square.perimeter(sVal);
                this.state.values = { side: sVal };
                break;
            case 'rectangle':
                const lVal = this._getValue('length');
                const wVal = this._getValue('width');
                area = GeometryCalculator.rectangle.area(lVal, wVal);
                perimeter = GeometryCalculator.rectangle.perimeter(lVal, wVal);
                this.state.values = { length: lVal, width: wVal };
                break;
            case 'triangle':
                const bVal = this._getValue('base');
                const hVal = this._getValue('height');
                const s1 = this._getValue('side1') || bVal;
                const s2 = this._getValue('side2') || bVal;
                const s3 = this._getValue('side3') || bVal;
                area = GeometryCalculator.triangle.area(bVal, hVal);
                perimeter = GeometryCalculator.triangle.perimeter(s1, s2, s3);
                this.state.values = { base: bVal, height: hVal, side1: s1, side2: s2, side3: s3 };
                break;
            case 'circle':
                const rVal = this._getValue('radius');
                area = GeometryCalculator.circle.area(rVal);
                perimeter = GeometryCalculator.circle.perimeter(rVal);
                this.state.values = { radius: rVal };
                break;
            case 'trapezoid':
                const BVal = this._getValue('base1');
                const bMin = this._getValue('base2');
                const hTrap = this._getValue('height');
                const ts1 = this._getValue('side1') || hTrap;
                const ts2 = this._getValue('side2') || hTrap;
                area = GeometryCalculator.trapezoid.area(BVal, bMin, hTrap);
                perimeter = GeometryCalculator.trapezoid.perimeter(ts1, ts2, BVal, bMin);
                this.state.values = { base1: BVal, base2: bMin, height: hTrap, side1: ts1, side2: ts2 };
                break;
            case 'rhombus':
                const d1Val = this._getValue('d1');
                const d2Val = this._getValue('d2');
                const rSide = this._getValue('side') || Math.sqrt(Math.pow(d1Val/2, 2) + Math.pow(d2Val/2, 2));
                area = GeometryCalculator.rhombus.area(d1Val, d2Val);
                perimeter = GeometryCalculator.rhombus.perimeter(rSide);
                this.state.values = { d1: d1Val, d2: d2Val, side: rSide };
                break;
        }

        if (this.elements.baseFormulaBadge && calcConfig) {
            this.elements.baseFormulaBadge.textContent = calcConfig.baseFormula[calculationType] || '';
            const stepExpr = calculationType === 'area'
                ? calcConfig.formulaArea(this.state.values)
                : calcConfig.formulaPerim(this.state.values);
            const activeVal = calculationType === 'area' ? area : perimeter;
            const activeUnit = calculationType === 'area' ? `${unit}²` : unit;
            this.elements.stepByStepDiv.innerHTML = `Paso a paso: <strong>${stepExpr} = ${activeVal.toFixed(2)} ${activeUnit}</strong>`;
        }

        this.elements.resultsContainer.innerHTML = `
            <div class="result-item ${calculationType === 'area' ? 'result-highlight' : ''}">
                <p><i class="fa-solid fa-vector-square me-1 text-success"></i> Área: <span id="areaResult">${area.toFixed(2)} ${unit}²</span></p>
                <button class="copy-btn" data-result-type="area" title="Copiar área"><i class="fa-regular fa-copy"></i></button>
            </div>
            <div class="result-item ${calculationType === 'perimeter' ? 'result-highlight' : ''}">
                <p><i class="fa-solid fa-draw-polygon me-1 text-primary"></i> Perímetro: <span id="perimeterResult">${perimeter.toFixed(2)} ${unit}</span></p>
                <button class="copy-btn" data-result-type="perimeter" title="Copiar perímetro"><i class="fa-regular fa-copy"></i></button>
            </div>
        `;
        this.updateVisualization();
    }

    updateVisualization() {
        const { shape, values, unit } = this.state;
        let svg = '';
        const viewBoxSize = 140;
        const center = viewBoxSize / 2;

        const gridDef = `
            <defs>
                <pattern id="cadGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="0.5"/>
                </pattern>
                <linearGradient id="neonShapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--focus-color, #4caf50)" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="var(--btn-special-bg, #2196f3)" stop-opacity="0.15"/>
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#cadGrid)" />
        `;

        switch (shape) {
            case 'square':
                const s = 65;
                const sqX = (viewBoxSize - s) / 2;
                const sqY = (viewBoxSize - s) / 2;
                svg = `<svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
                    ${gridDef}
                    <rect x="${sqX}" y="${sqY}" width="${s}" height="${s}" rx="4" class="shape" fill="url(#neonShapeGrad)"/>
                    <line x1="${sqX}" y1="${sqY - 6}" x2="${sqX + s}" y2="${sqY - 6}" class="helper-line"/>
                    <text x="${center}" y="${sqY - 9}" class="label">${values.side || 5} ${unit}</text>
                    <line x1="${sqX - 6}" y1="${sqY}" x2="${sqX - 6}" y2="${sqY + s}" class="helper-line"/>
                    <text x="${sqX - 10}" y="${center + 4}" class="label" transform="rotate(-90 ${sqX - 10},${center + 4})">${values.side || 5} ${unit}</text>
                </svg>`;
                break;
            case 'rectangle':
                const rw = 80;
                const rh = 50;
                const rx = (viewBoxSize - rw) / 2;
                const ry = (viewBoxSize - rh) / 2;
                svg = `<svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
                    ${gridDef}
                    <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="4" class="shape" fill="url(#neonShapeGrad)"/>
                    <line x1="${rx}" y1="${ry - 6}" x2="${rx + rw}" y2="${ry - 6}" class="helper-line"/>
                    <text x="${center}" y="${ry - 9}" class="label">${values.length || 8} ${unit}</text>
                    <line x1="${rx - 6}" y1="${ry}" x2="${rx - 6}" y2="${ry + rh}" class="helper-line"/>
                    <text x="${rx - 10}" y="${center + 4}" class="label" transform="rotate(-90 ${rx - 10},${center + 4})">${values.width || 5} ${unit}</text>
                </svg>`;
                break;
            case 'triangle':
                const tb = 75;
                const th = 60;
                const tx1 = (viewBoxSize - tb) / 2;
                const tx2 = tx1 + tb;
                const tyBase = center + th / 2;
                const tyApex = center - th / 2;
                svg = `<svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
                    ${gridDef}
                    <path d="M${tx1} ${tyBase} L${tx2} ${tyBase} L${center} ${tyApex} Z" class="shape" fill="url(#neonShapeGrad)"/>
                    <line x1="${center}" y1="${tyBase}" x2="${center}" y2="${tyApex}" class="helper-line" stroke-dasharray="3,3"/>
                    <text x="${center + 12}" y="${center}" class="label">h:${values.height || 5}</text>
                    <text x="${center}" y="${tyBase + 14}" class="label">b: ${values.base || 6} ${unit}</text>
                </svg>`;
                break;
            case 'circle':
                const cr = 36;
                svg = `<svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
                    ${gridDef}
                    <circle cx="${center}" cy="${center}" r="${cr}" class="shape" fill="url(#neonShapeGrad)"/>
                    <line x1="${center}" y1="${center}" x2="${center + cr}" y2="${center}" class="helper-line"/>
                    <circle cx="${center}" cy="${center}" r="2" fill="var(--focus-color)"/>
                    <text x="${center + cr / 2}" y="${center - 5}" class="label">r: ${values.radius || 5} ${unit}</text>
                </svg>`;
                break;
            case 'trapezoid':
                const trB = 80;
                const trb = 48;
                const trH = 50;
                const trX1 = (viewBoxSize - trB) / 2;
                const trX2 = trX1 + trB;
                const trTopX1 = (viewBoxSize - trb) / 2;
                const trTopX2 = trTopX1 + trb;
                const trYBottom = center + trH / 2;
                const trYTop = center - trH / 2;
                svg = `<svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
                    ${gridDef}
                    <path d="M${trX1} ${trYBottom} L${trX2} ${trYBottom} L${trTopX2} ${trYTop} L${trTopX1} ${trYTop} Z" class="shape" fill="url(#neonShapeGrad)"/>
                    <line x1="${trTopX1}" y1="${trYBottom}" x2="${trTopX1}" y2="${trYTop}" class="helper-line" stroke-dasharray="3,3"/>
                    <text x="${trTopX1 + 10}" y="${center}" class="label">h:${values.height || 4}</text>
                    <text x="${center}" y="${trYBottom + 13}" class="label">B: ${values.base1 || 8}</text>
                    <text x="${center}" y="${trYTop - 5}" class="label">b: ${values.base2 || 5}</text>
                </svg>`;
                break;
            case 'rhombus':
                const rd1 = 76;
                const rd2 = 50;
                svg = `<svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
                    ${gridDef}
                    <path d="M${center} ${center - rd2 / 2} L${center + rd1 / 2} ${center} L${center} ${center + rd2 / 2} L${center - rd1 / 2} ${center} Z" class="shape" fill="url(#neonShapeGrad)"/>
                    <line x1="${center - rd1 / 2}" y1="${center}" x2="${center + rd1 / 2}" y2="${center}" class="helper-line" stroke-dasharray="3,3"/>
                    <line x1="${center}" y1="${center - rd2 / 2}" x2="${center}" y2="${center + rd2 / 2}" class="helper-line" stroke-dasharray="3,3"/>
                    <text x="${center + 14}" y="${center - 6}" class="label">d:${values.d2 || 6}</text>
                    <text x="${center}" y="${center + rd2 / 2 + 12}" class="label">D:${values.d1 || 8}</text>
                </svg>`;
                break;
        }
        this.elements.visualizationContainer.innerHTML = svg;
    }

    async copyToClipboard(text, button) {
        await navigator.clipboard.writeText(text);
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i>';
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.classList.remove('copied');
        }, 1500);
    }
    
    async exportSVGAsImage(format = 'png') {
        const svgElement = this.elements.visualizationContainer.querySelector('svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const desiredWidth = 600;
        const { width, height } = svgElement.viewBox.baseVal || { width: 140, height: 140 };
        canvas.width = desiredWidth;
        canvas.height = (height / width) * desiredWidth;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            ctx.fillStyle = '#141923';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);

            const link = document.createElement('a');
            link.href = canvas.toDataURL(`image/${format}`);
            link.download = `geometria-${this.state.shape}.${format}`;
            link.click();
        };

        img.onerror = () => {
            console.error("Error al exportar la imagen SVG.");
            URL.revokeObjectURL(url);
        };

        img.src = url;
    }
}
export { GeometryApp };
