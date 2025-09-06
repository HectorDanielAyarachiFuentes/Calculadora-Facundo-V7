const GeometryCalculator = {
    // Cuadrado
    square: {
        area: (side) => side * side,
        perimeter: (side) => 4 * side
    },
    // Rectángulo
    rectangle: {
        area: (length, width) => length * width,
        perimeter: (length, width) => 2 * (length + width)
    },
    // Triángulo
    triangle: {
        area: (base, height) => (base * height) / 2,
        perimeter: (side1, side2, side3) => side1 + side2 + side3
    },
    // Círculo
    circle: {
        area: (radius) => Math.PI * radius * radius,
        perimeter: (radius) => 2 * Math.PI * radius
    }
};

const GeometryUI = {
    init() {
        console.log('GeometryUI.init() llamado');
        const modalBody = document.getElementById('infoModalBody');
        if (!modalBody) {
            console.error('No se encontró el elemento modalBody');
            return;
        }

        // Reemplazamos el contenido del modal con nuestra interfaz
        modalBody.innerHTML = `
            <div class="geometry-container">
                <div class="geometry-selector">
                    <select id="shapeSelect" class="form-select mb-3">
                        <option value="square">Cuadrado</option>
                        <option value="rectangle">Rectángulo</option>
                        <option value="triangle">Triángulo</option>
                        <option value="circle">Círculo</option>
                    </select>
                </div>
                <div class="unit-selector mb-3">
                    <label for="unitSelect" class="form-label">Unidad de Medida</label>
                    <select id="unitSelect" class="form-select">
                        <option value="cm">Centímetros (cm)</option>
                        <option value="m">Metros (m)</option>
                        <option value="km">Kilómetros (km)</option>
                    </select>
                </div>
                <div class="geometry-inputs" id="geometryInputs"></div>
                <div class="geometry-results" id="geometryResults">
                    <p>Área: <span id="areaResult">-</span></p>
                    <p>Perímetro: <span id="perimeterResult">-</span></p>
                </div>
                <div class="geometry-visualization" id="geometryVisualization"></div>
            </div>
        `;

        // Asegurarse de que los elementos estén en el DOM antes de configurar los listeners
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
    },

    setupEventListeners() {
        console.log('Configurando event listeners');
        const shapeSelect = document.getElementById('shapeSelect');
        if (!shapeSelect) {
            console.error('No se encontró el elemento shapeSelect');
            return;
        }

        shapeSelect.addEventListener('change', () => {
            console.log('Cambio de forma detectado:', shapeSelect.value);
            this.updateInputs(shapeSelect.value);
        });

        const unitSelect = document.getElementById('unitSelect');
        if (unitSelect) {
            unitSelect.addEventListener('change', () => {
                this.calculate(document.getElementById('shapeSelect').value);
            });
        }
        
        // Inicializar con la forma seleccionada actualmente
        this.updateInputs(shapeSelect.value);
    },

    updateInputs(shape) {
        console.log('Actualizando inputs para:', shape);
        const inputsDiv = document.getElementById('geometryInputs');
        if (!inputsDiv) {
            console.error('No se encontró el elemento geometryInputs');
            return;
        }

        const inputConfigs = {
            square: [{ label: 'Lado', id: 'side' }],
            rectangle: [
                { label: 'Largo', id: 'length' },
                { label: 'Ancho', id: 'width' }
            ],
            triangle: [
                { label: 'Base', id: 'base' },
                { label: 'Altura', id: 'height' },
                { label: 'Lado 1', id: 'side1' },
                { label: 'Lado 2', id: 'side2' },
                { label: 'Lado 3', id: 'side3' }
            ],
            circle: [{ label: 'Radio', id: 'radius' }]
        };

        // Crear los campos de entrada para la forma seleccionada
        let inputsHTML = '';
        inputConfigs[shape].forEach(input => {
            inputsHTML += `
                <div class="mb-3">
                    <label for="${input.id}" class="form-label">${input.label}</label>
                    <input type="number" class="form-control geometry-input" id="${input.id}" step="0.1" min="0" value="0">
                </div>
            `;
        });
        inputsDiv.innerHTML = inputsHTML;

        // Configurar los listeners para los nuevos campos
        this.setupCalculationListeners(shape);
        
        // Calcular inicialmente con valores por defecto
        this.calculate(shape);
        this.updateVisualization(shape);
    },

    setupCalculationListeners(shape) {
        console.log('Configurando listeners de cálculo para:', shape);
        const inputs = document.querySelectorAll('.geometry-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                console.log('Input detectado en:', input.id, 'valor:', input.value);
                this.calculate(shape);
            });
        });
    },

    calculate(shape) {
        console.log('Calculando para:', shape);
        const values = {};
        document.querySelectorAll('.geometry-input').forEach(input => {
            values[input.id] = parseFloat(input.value) || 0;
        });

        const areaResult = document.getElementById('areaResult');
        const perimeterResult = document.getElementById('perimeterResult');
        const unitSelect = document.getElementById('unitSelect');
        const unit = unitSelect ? unitSelect.value : 'cm';

        if (!areaResult || !perimeterResult) {
            console.error('No se encontraron elementos de resultado');
            return;
        }

        let area = 0;
        let perimeter = 0;

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
                area = GeometryCalculator.triangle.area(values.base, values.height);
                // Para el perímetro necesitamos los tres lados
                perimeter = GeometryCalculator.triangle.perimeter(
                    values.side1 || values.base, 
                    values.side2 || 0, 
                    values.side3 || 0
                );
                break;
            case 'circle':
                area = GeometryCalculator.circle.area(values.radius);
                perimeter = GeometryCalculator.circle.perimeter(values.radius);
                break;
        }

        console.log('Resultados calculados:', { area, perimeter });
        areaResult.textContent = `${area.toFixed(2)} ${unit}²`;
        perimeterResult.textContent = `${perimeter.toFixed(2)} ${unit}`;
        this.updateVisualization(shape, values);
    },

    updateVisualization(shape, values = {}) {
        console.log('Actualizando visualización para:', shape, values);
        const visualizationDiv = document.getElementById('geometryVisualization');
        if (!visualizationDiv) {
            console.error('No se encontró el elemento geometryVisualization');
            return;
        }

        const size = 200; // Tamaño base para la visualización
        let svg = '';

        switch (shape) {
            case 'square':
                const sideLength = values.side || 0;
                svg = `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
                    <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2"/>
                    <text x="50" y="50" text-anchor="middle" dominant-baseline="middle">${sideLength ? sideLength : ''}</text>
                </svg>`;
                break;
            case 'rectangle':
                const rectLength = values.length || 0;
                const rectWidth = values.width || 0;
                svg = `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
                    <rect x="10" y="20" width="80" height="60" fill="none" stroke="currentColor" stroke-width="2"/>
                    <text x="50" y="50" text-anchor="middle" dominant-baseline="middle">${rectLength && rectWidth ? `${rectLength} x ${rectWidth}` : ''}</text>
                </svg>`;
                break;
            case 'triangle':
                const base = values.base || 0;
                const height = values.height || 0;
                svg = `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
                    <path d="M50 10 L10 90 L90 90 Z" fill="none" stroke="currentColor" stroke-width="2"/>
                    <text x="50" y="60" text-anchor="middle" dominant-baseline="middle">${base && height ? `b:${base} h:${height}` : ''}</text>
                </svg>`;
                break;
            case 'circle':
                const radius = values.radius || 0;
                svg = `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="2"/>
                    <text x="50" y="50" text-anchor="middle" dominant-baseline="middle">${radius ? `r:${radius}` : ''}</text>
                </svg>`;
                break;
        }

        visualizationDiv.innerHTML = svg;
    }
};

// Exponer GeometryUI globalmente para que pueda ser accedido desde bostraplectornumeros.js
window.GeometryUI = GeometryUI;

// Eliminar este evento ya que ahora lo manejamos desde bostraplectornumeros.js
// document.addEventListener('DOMContentLoaded', () => {
//     const infoModalEl = document.getElementById('infoModal');
//     if (infoModalEl) {
//         infoModalEl.addEventListener('shown.bs.modal', (event) => {
//             if (event.target.querySelector('#infoModalLabel').textContent === 'Conceptos de Geometría') {
//                 GeometryUI.init();
//             }
//         });
//     }
// });