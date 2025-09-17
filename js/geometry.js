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
                        <div id="geometry-visualization" class="geometry-visualization"></div>
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

    calculate() {
        const values = {};
        this.elements.inputsContainer.querySelectorAll('.geometry-input').forEach(input => {
            values[input.id] = parseFloat(input.value) || 0;
        });
        this.state.values = values;

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
                    base: parseFloat(document.getElementById('base')?.value) || 0,
                    height: parseFloat(document.getElementById('height')?.value) || 0,
                    side1: parseFloat(document.getElementById('side1')?.value) || 0,
                    side2: parseFloat(document.getElementById('side2')?.value) || 0,
                    side3: parseFloat(document.getElementById('side3')?.value) || 0,
                };
                area = GeometryCalculator.triangle.area(allTriangleValues.base, allTriangleValues.height);
                perimeter = GeometryCalculator.triangle.perimeter(allTriangleValues.side1, allTriangleValues.side2, allTriangleValues.side3);
                this.state.values = allTriangleValues;
                break;
            case 'circle':
                area = GeometryCalculator.circle.area(values.radius);
                perimeter = GeometryCalculator.circle.perimeter(values.radius);
                break;
        }

        this.elements.resultsContainer.innerHTML = `
            <p>Área: <span id="areaResult">${area.toFixed(2)} ${unit}²</span></p>
            <p>Perímetro: <span id="perimeterResult">${perimeter.toFixed(2)} ${unit}</span></p>
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
        }
        this.elements.visualizationContainer.innerHTML = svg;
    }
}

window.GeometryApp = GeometryApp;