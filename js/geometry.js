// =======================================================
// --- geometry.js (REFACTORIZADO Y MEJORADO) ---
// Gestiona la calculadora de geometría con una interfaz mejorada.
// =======================================================

const GeometryCalculator = {
    square: {
        area: (side) => side * side,
        perimeter: (side) => 4 * side
    },
    rectangle: {
        area: (length, width) => length * width,
        perimeter: (length, width) => 2 * (length + width)
    },
    triangle: {
        area: (base, height) => (base * height) / 2,
        perimeter: (side1, side2, side3) => side1 + side2 + side3
    },
    circle: {
        area: (radius) => Math.PI * radius * radius,
        perimeter: (radius) => 2 * Math.PI * radius
    },
    trapezoid: {
        area: (base1, base2, height) => ((base1 + base2) / 2) * height,
        perimeter: (side1, side2, base1, base2) => side1 + side2 + base1 + base2
    },
    rhombus: {
        area: (d1, d2) => (d1 * d2) / 2,
        perimeter: (side) => 4 * side
    }
};

class GeometryApp {
    /**
     * @param {string} containerId El ID del elemento que contendrá la aplicación de geometría.
     */
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('GeometryApp: El contenedor no fue encontrado.');
            return;
        }
        this.state = {
            shape: 'square',
            calculationType: 'area', // 'area' o 'perimeter'
            unit: 'cm',
            values: {}
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
                    <div class="control-group">
                        <label for="shapeSelect" class="form-label">Figura</label>
                        <select id="shapeSelect" class="form-select">
                            <option value="square" selected>Cuadrado</option>
                            <option value="rectangle">Rectángulo</option>
                            <option value="triangle">Triángulo</option>
                            <option value="circle">Círculo</option>
                            <option value="trapezoid">Trapecio</option>
                            <option value="rhombus">Rombo</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label for="unitSelect" class="form-label">Unidad</label>
                        <select id="unitSelect" class="form-select">
                            <option value="cm" selected>Centímetros (cm)</option>
                            <option value="m">Metros (m)</option>
                            <option value="km">Kilómetros (km)</option>
                        </select>
                    </div>
                </div>
                <div class="geometry-main">
                    <div class="geometry-inputs-section">
                        <div id="calculation-tabs" class="calculation-tabs"></div>
                        <div id="geometry-inputs" class="geometry-inputs"></div>
                    </div>
                    <div class="geometry-display-section">
                        <div class="visualization-wrapper">
                            <div id="geometry-visualization" class="geometry-visualization"></div>
                            <button id="export-svg-btn" class="export-btn" title="Exportar como PNG"><i class="fa-solid fa-download"></i></button>
                        </div>
                        <div id="geometry-results" class="geometry-results"></div>
                    </div>
                </div>
            </div>
        `;
        this.elements = {
            shapeSelect: document.getElementById('shapeSelect'),
            unitSelect: document.getElementById('unitSelect'),
            tabsContainer: document.getElementById('calculation-tabs'),
            inputsContainer: document.getElementById('geometry-inputs'),
            visualizationContainer: document.getElementById('geometry-visualization'),
            resultsContainer: document.getElementById('geometry-results'),
            exportBtn: document.getElementById('export-svg-btn'),
        };
    }

    bindEvents() {
        this.elements.shapeSelect.addEventListener('change', (e) => {
            this.state.shape = e.target.value;
            this.updateUIForShape(this.state.shape);
        });

        this.elements.unitSelect.addEventListener('change', (e) => {
            this.state.unit = e.target.value;
            this.calculate();
        });

        this.elements.tabsContainer.addEventListener('click', (e) => {
            if (e.target.matches('.tab')) {
                this.state.calculationType = e.target.dataset.type;
                this.renderInputs(this.state.shape, this.state.calculationType);
            }
        });

        this.elements.inputsContainer.addEventListener('input', (e) => {
            if (e.target.matches('.geometry-input')) {
                this.calculate();
            }
        });

        // Listener para los botones de copiar
        this.elements.resultsContainer.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('.copy-btn');
            if (copyBtn) {
                const resultType = copyBtn.dataset.resultType;
                const resultElement = document.getElementById(`${resultType}Result`);
                if (resultElement) {
                    this.copyToClipboard(resultElement.textContent, copyBtn);
                }
            }
        });
    }

    updateUIForShape(shape) {
        this.renderTabs(shape);
        this.renderInputs(shape, this.state.calculationType);
    }

    renderTabs() {
        const tabs = [
            { type: 'area', label: 'Área' },
            { type: 'perimeter', label: 'Perímetro' }
        ];

        this.elements.tabsContainer.innerHTML = tabs.map(tab => `
            <button class="tab ${this.state.calculationType === tab.type ? 'active' : ''}" data-type="${tab.type}">
                ${tab.label}
            </button>
        `).join('');
    }

    renderInputs(shape, calculationType) {
        this.elements.tabsContainer.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === calculationType);
        });

        // --- MEJORA INTERACTIVA ---
        // Añadimos una clase al contenedor de la visualización para poder
        // resaltar el área o el perímetro con CSS según la pestaña activa.
        this.elements.visualizationContainer.classList.remove('highlight-area', 'highlight-perimeter');
        this.elements.visualizationContainer.classList.add(
            calculationType === 'area' ? 'highlight-area' : 'highlight-perimeter'
        );

        const inputConfigs = {
            square: {
                area: [{ label: 'Lado', id: 'side' }],
                perimeter: [{ label: 'Lado', id: 'side' }]
            },
            rectangle: {
                area: [{ label: 'Largo', id: 'length' }, { label: 'Ancho', id: 'width' }],
                perimeter: [{ label: 'Largo', id: 'length' }, { label: 'Ancho', id: 'width' }]
            },
            triangle: {
                area: [{ label: 'Base', id: 'base' }, { label: 'Altura', id: 'height' }],
                perimeter: [{ label: 'Lado 1', id: 'side1' }, { label: 'Lado 2', id: 'side2' }, { label: 'Lado 3', id: 'side3' }]
            },
            circle: {
                area: [{ label: 'Radio', id: 'radius' }],
                perimeter: [{ label: 'Radio', id: 'radius' }]
            },
            trapezoid: {
                area: [{ label: 'Base Mayor', id: 'base1' }, { label: 'Base Menor', id: 'base2' }, { label: 'Altura', id: 'height' }],
                perimeter: [{ label: 'Lado 1', id: 'side1' }, { label: 'Lado 2', id: 'side2' }, { label: 'Base Mayor', id: 'base1' }, { label: 'Base Menor', id: 'base2' }]
            },
            rhombus: {
                area: [{ label: 'Diagonal Mayor', id: 'd1' }, { label: 'Diagonal Menor', id: 'd2' }],
                perimeter: [{ label: 'Lado', id: 'side' }]
            }
        };

        const inputsToRender = inputConfigs[shape][calculationType];
        this.elements.inputsContainer.innerHTML = inputsToRender.map(input => `
            <div class="input-group">
                <label for="${input.id}" class="form-label">${input.label}</label>
                <div class="input-wrapper">
                    <input type="number" class="form-control geometry-input" id="${input.id}" step="0.1" min="0" value="0">
                    <span class="input-unit">${this.state.unit}</span>
                </div>
            </div>
        `).join('');
        
        this.calculate();
    }

    _getValue(id) {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value) || 0 : 0;
    }

    calculate() {
        const values = {};
        this.elements.inputsContainer.querySelectorAll('.geometry-input').forEach(input => {
            values[input.id] = parseFloat(input.value) || 0;
        });
        this.state.values = { ...this.state.values, ...values };

        let area = 0;
        let perimeter = 0;
        const { shape, unit } = this.state;

        switch (shape) {
            case 'square':
                area = GeometryCalculator.square.area(values.side);
                perimeter = GeometryCalculator.square.perimeter(values.side);
                break;
            case 'rectangle':
                area = GeometryCalculator.rectangle.area(values.length, values.width);
                perimeter = GeometryCalculator.rectangle.perimeter(values.length, values.width);
                break;
            case 'triangle':
                const allTriangleValues = {
                    base: this._getValue('base'),
                    height: this._getValue('height'),
                    side1: this._getValue('side1'),
                    side2: this._getValue('side2'),
                    side3: this._getValue('side3'),
                };
                area = GeometryCalculator.triangle.area(allTriangleValues.base, allTriangleValues.height);
                perimeter = GeometryCalculator.triangle.perimeter(allTriangleValues.side1, allTriangleValues.side2, allTriangleValues.side3);
                this.state.values = allTriangleValues;
                break;
            case 'circle':
                area = GeometryCalculator.circle.area(values.radius);
                perimeter = GeometryCalculator.circle.perimeter(values.radius);
                break;
            case 'trapezoid':
                const allTrapezoidValues = {
                    base1: this._getValue('base1'),
                    base2: this._getValue('base2'),
                    height: this._getValue('height'),
                    side1: this._getValue('side1'),
                    side2: this._getValue('side2'),
                };
                area = GeometryCalculator.trapezoid.area(allTrapezoidValues.base1, allTrapezoidValues.base2, allTrapezoidValues.height);
                perimeter = GeometryCalculator.trapezoid.perimeter(allTrapezoidValues.side1, allTrapezoidValues.side2, allTrapezoidValues.base1, allTrapezoidValues.base2);
                this.state.values = allTrapezoidValues;
                break;
            case 'rhombus':
                const allRhombusValues = {
                    d1: this._getValue('d1'),
                    d2: this._getValue('d2'),
                    side: this._getValue('side'),
                };
                area = GeometryCalculator.rhombus.area(allRhombusValues.d1, allRhombusValues.d2);
                perimeter = GeometryCalculator.rhombus.perimeter(allRhombusValues.side);
                this.state.values = allRhombusValues;
                break;
        }

        this.elements.resultsContainer.innerHTML = `
            <div class="result-item">
                <p>Área: <span id="areaResult">${area.toFixed(2)} ${unit}²</span></p>
                <button class="copy-btn" data-result-type="area" title="Copiar área"><i class="fa-regular fa-copy"></i></button>
            </div>
            <div class="result-item">
                <p>Perímetro: <span id="perimeterResult">${perimeter.toFixed(2)} ${unit}</span></p>
                <button class="copy-btn" data-result-type="perimeter" title="Copiar perímetro"><i class="fa-regular fa-copy"></i></button>
            </div>
        `;
        this.updateVisualization();
    }

    updateVisualization() {
        const { shape, values } = this.state;
        let svg = '';
        const maxDim = Math.max(...Object.values(values).filter(v => v > 0), 1);
        const scale = 80 / maxDim;

        switch (shape) {
            case 'square':
                const s = (values.side || 10) * scale;
                svg = `<svg viewBox="0 0 120 120">
                    <rect x="${(110-s)/2}" y="${(110-s)/2}" width="${s}" height="${s}" class="shape"/>
                    <text x="55" y="${(110-s)/2 - 5}" class="label">${values.side || 'L'}</text>
                </svg>`;
                break;
            case 'rectangle':
                const l = (values.length || 16) * scale;
                const w = (values.width || 10) * scale;
                svg = `<svg viewBox="0 0 120 120">
                    <rect x="${(110-l)/2}" y="${(110-w)/2}" width="${l}" height="${w}" class="shape"/>
                    <text x="55" y="${(110-w)/2 - 5}" class="label">${values.length || 'L'}</text>
                    <text x="${(110-l)/2 - 15}" y="55" class="label">${values.width || 'A'}</text>
                </svg>`;
                break;
            case 'triangle':
                const b = values.base || 15;
                const h = values.height || 10;
                const triangleScale = 80 / Math.max(b, h, 1);
                svg = `<svg viewBox="0 0 120 120">
                    <path d="M10 100 L${10+b*triangleScale} 100 L${10+(b*triangleScale/2)} ${100-h*triangleScale} Z" class="shape"/>
                    <text x="${10 + (b*triangleScale/2)}" y="115" class="label">Base: ${values.base || 'b'}</text>
                    <line x1="${10+(b*triangleScale/2)}" y1="100" x2="${10+(b*triangleScale/2)}" y2="${100-h*triangleScale}" class="helper-line"/>
                    <text x="${15+(b*triangleScale/2)}" y="${100-(h*triangleScale/2)}" class="label">h: ${values.height || 'h'}</text>
                </svg>`;
                break;
            case 'circle':
                const r = values.radius || 10;
                const circleScale = 40 / Math.max(r, 1);
                svg = `<svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="${r*circleScale}" class="shape"/>
                    <line x1="60" y1="60" x2="${60 + r*circleScale}" y2="60" class="helper-line"/>
                    <text x="${60 + (r*circleScale/2)}" y="55" class="label">r: ${r || 'r'}</text>
                </svg>`;
                break;
            case 'trapezoid':
                const b1 = (values.base1 || 16);
                const b2 = (values.base2 || 10);
                const h_trap = (values.height || 8);
                const trapScale = 80 / Math.max(b1, b2, h_trap, 1);
                const scaledB1 = b1 * trapScale;
                const scaledB2 = b2 * trapScale;
                const scaledH = h_trap * trapScale;
                const offset = (scaledB1 - scaledB2) / 2;
                svg = `<svg viewBox="0 0 120 120">
                    <path d="M${(120-scaledB1)/2} ${60+scaledH/2} L${(120+scaledB1)/2} ${60+scaledH/2} L${(120+scaledB1)/2 - offset} ${60-scaledH/2} L${(120-scaledB1)/2 + offset} ${60-scaledH/2} Z" class="shape"/>
                    <text x="60" y="${60+scaledH/2 + 15}" class="label">B: ${values.base1 || 'B'}</text>
                    <text x="60" y="${60-scaledH/2 - 5}" class="label">b: ${values.base2 || 'b'}</text>
                    <line x1="${(120-scaledB1)/2 + offset}" y1="${60+scaledH/2}" x2="${(120-scaledB1)/2 + offset}" y2="${60-scaledH/2}" class="helper-line"/>
                    <text x="${(120-scaledB1)/2 + offset + 10}" y="60" class="label">h: ${values.height || 'h'}</text>
                </svg>`;
                break;
            case 'rhombus':
                const d1 = (values.d1 || 16) * scale;
                const d2 = (values.d2 || 10) * scale;
                svg = `<svg viewBox="0 0 120 120">
                    <path d="M60 ${60-d2/2} L${60+d1/2} 60 L60 ${60+d2/2} L${60-d1/2} 60 Z" class="shape"/>
                    <line x1="${60-d1/2}" y1="60" x2="${60+d1/2}" y2="60" class="helper-line"/>
                    <line x1="60" y1="${60-d2/2}" x2="60" y2="${60+d2/2}" class="helper-line"/>
                    <text x="60" y="${60-d2/2 - 5}" class="label">d2: ${values.d2 || 'd2'}</text>
                    <text x="${60+d1/2 + 10}" y="65" class="label">d1: ${values.d1 || 'd1'}</text>
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
        if (!svgElement) {
            alert('No hay ninguna visualización para exportar.');
            return;
        }

        // 1. Obtener datos del SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);

        // 2. Crear un canvas con dimensiones adecuadas para una buena calidad
        const canvas = document.createElement('canvas');
        const desiredWidth = 600;
        const { width, height } = svgElement.viewBox.baseVal;
        canvas.width = desiredWidth;
        canvas.height = (height / width) * desiredWidth;
        const ctx = canvas.getContext('2d');

        // 3. Crear una imagen a partir de los datos del SVG
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            // Aplicar el color de fondo del tema actual al canvas
            const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--history-hover-bg').trim();
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);

            // 4. Crear y simular clic en un enlace de descarga
            const link = document.createElement('a');
            link.href = canvas.toDataURL(`image/${format}`);
            link.download = `calculadora-facundo-${this.state.shape}.${format}`;
            link.click();
        };

        img.onerror = () => {
            console.error("Error al cargar la imagen SVG para exportación.");
            URL.revokeObjectURL(url);
        };

        img.src = url;
    }
}
export { GeometryApp };