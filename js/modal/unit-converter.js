'use strict';

class UnitConverterApp {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.elements = {
            categorySelect: this.container.querySelector('#unit-category'),
            fromSelect: this.container.querySelector('#unit-from'),
            toSelect: this.container.querySelector('#unit-to'),
            fromInput: this.container.querySelector('#unit-from-value'),
            toInput: this.container.querySelector('#unit-to-value'),
            swapBtn: this.container.querySelector('#converter-swap-btn'),
            formulaText: this.container.querySelector('#conv-formula-text'),
            copyBtn: this.container.querySelector('#conv-copy-btn')
        };

        this.units = {
            length: {
                name: 'Longitud',
                base: 'meters',
                type: 'linear',
                factors: {
                    meters: 1,
                    kilometers: 1000,
                    centimeters: 0.01,
                    millimeters: 0.001,
                    miles: 1609.34,
                    yards: 0.9144,
                    feet: 0.3048,
                    inches: 0.0254,
                },
                labels: {
                    meters: 'Metros (m)',
                    kilometers: 'Kilómetros (km)',
                    centimeters: 'Centímetros (cm)',
                    millimeters: 'Milímetros (mm)',
                    miles: 'Millas (mi)',
                    yards: 'Yardas (yd)',
                    feet: 'Pies (ft)',
                    inches: 'Pulgadas (in)',
                }
            },
            mass: {
                name: 'Masa',
                base: 'grams',
                type: 'linear',
                factors: {
                    grams: 1,
                    kilograms: 1000,
                    milligrams: 0.001,
                    pounds: 453.592,
                    ounces: 28.3495,
                },
                labels: {
                    grams: 'Gramos (g)',
                    kilograms: 'Kilogramos (kg)',
                    milligrams: 'Miligramos (mg)',
                    pounds: 'Libras (lb)',
                    ounces: 'Onzas (oz)',
                }
            },
            temperature: {
                name: 'Temperatura',
                type: 'temperature',
                labels: {
                    celsius: 'Celsius (°C)',
                    fahrenheit: 'Fahrenheit (°F)',
                    kelvin: 'Kelvin (K)'
                }
            },
            time: {
                name: 'Tiempo',
                base: 'seconds',
                type: 'linear',
                factors: {
                    seconds: 1,
                    minutes: 60,
                    hours: 3600,
                    days: 86400,
                    weeks: 604800
                },
                labels: {
                    seconds: 'Segundos (s)',
                    minutes: 'Minutos (min)',
                    hours: 'Horas (h)',
                    days: 'Días (d)',
                    weeks: 'Semanas (sem)'
                }
            },
            data: {
                name: 'Almacenamiento Digital',
                base: 'bytes',
                type: 'linear',
                factors: {
                    bytes: 1,
                    kilobytes: 1024,
                    megabytes: 1048576,
                    gigabytes: 1073741824,
                    terabytes: 1099511627776
                },
                labels: {
                    bytes: 'Bytes (B)',
                    kilobytes: 'Kilobytes (KB)',
                    megabytes: 'Megabytes (MB)',
                    gigabytes: 'Gigabytes (GB)',
                    terabytes: 'Terabytes (TB)'
                }
            },
            speed: {
                name: 'Velocidad',
                base: 'kmh',
                type: 'linear',
                factors: {
                    kmh: 1,
                    ms: 3.6,
                    mph: 1.60934,
                    knots: 1.852
                },
                labels: {
                    kmh: 'Kilómetros/hora (km/h)',
                    ms: 'Metros/segundo (m/s)',
                    mph: 'Millas/hora (mph)',
                    knots: 'Nudos (kt)'
                }
            }
        };

        this.bindEvents();
        this.updateUnitSelectors();
    }

    bindEvents() {
        if (this.elements.categorySelect) {
            this.elements.categorySelect.addEventListener('change', () => this.updateUnitSelectors());
        }
        if (this.elements.fromSelect) {
            this.elements.fromSelect.addEventListener('change', () => this.convert());
        }
        if (this.elements.toSelect) {
            this.elements.toSelect.addEventListener('change', () => this.convert());
        }
        if (this.elements.fromInput) {
            this.elements.fromInput.addEventListener('input', () => this.convert());
        }
        if (this.elements.toInput) {
            this.elements.toInput.addEventListener('input', (e) => this.convert(e, true));
        }

        if (this.elements.swapBtn) {
            this.elements.swapBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const tempUnit = this.elements.fromSelect.value;
                this.elements.fromSelect.value = this.elements.toSelect.value;
                this.elements.toSelect.value = tempUnit;

                // Animación de rotación
                const icon = this.elements.swapBtn.querySelector('i');
                if (icon) {
                    icon.style.transform = 'rotate(180deg)';
                    setTimeout(() => icon.style.transform = '', 300);
                }

                this.convert();
            });
        }

        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => {
                if (!this.elements.toInput.value) return;
                navigator.clipboard.writeText(this.elements.toInput.value).then(() => {
                    const original = this.elements.copyBtn.innerHTML;
                    this.elements.copyBtn.innerHTML = '<i class="fa-solid fa-check text-success"></i>';
                    setTimeout(() => this.elements.copyBtn.innerHTML = original, 1500);
                });
            });
        }
    }

    updateUnitSelectors() {
        const category = this.elements.categorySelect.value;
        const unitData = this.units[category];
        if (!unitData) return;

        const keys = Object.keys(unitData.labels);
        const optionsHtml = keys.map(key => `<option value="${key}">${unitData.labels[key]}</option>`).join('');

        this.elements.fromSelect.innerHTML = optionsHtml;
        this.elements.toSelect.innerHTML = optionsHtml;
        
        // Seleccionar una unidad de destino distinta por defecto
        if (keys.length > 1) {
            this.elements.toSelect.value = keys[1];
        }

        this.convert();
    }

    convert(event, isReverse = false) {
        const category = this.elements.categorySelect.value;
        const unitData = this.units[category];
        if (!unitData) return;

        const fromUnit = this.elements.fromSelect.value;
        const toUnit = this.elements.toSelect.value;
        
        const fromInput = isReverse ? this.elements.toInput : this.elements.fromInput;
        const toInput = isReverse ? this.elements.fromInput : this.elements.toInput;

        const fromValue = parseFloat(fromInput.value);
        if (isNaN(fromValue)) {
            toInput.value = '';
            if (this.elements.formulaText) this.elements.formulaText.textContent = '-';
            return;
        }

        let result = 0;

        if (unitData.type === 'temperature') {
            result = this._convertTemperature(fromValue, fromUnit, toUnit);
        } else {
            // Conversión lineal usando factores base
            const valInBase = fromValue * (isReverse ? unitData.factors[toUnit] : unitData.factors[fromUnit]);
            result = valInBase / (isReverse ? unitData.factors[fromUnit] : unitData.factors[toUnit]);
        }

        toInput.value = Number.isInteger(result) ? result : parseFloat(result.toPrecision(6));

        // Actualizar chip de fórmula
        if (this.elements.formulaText) {
            const sample = unitData.type === 'temperature'
                ? `1 ${unitData.labels[fromUnit].split(' ')[0]} = ${this._convertTemperature(1, fromUnit, toUnit).toFixed(2)} ${unitData.labels[toUnit].split(' ')[0]}`
                : `1 ${unitData.labels[fromUnit].split(' ')[0]} = ${(unitData.factors[fromUnit] / unitData.factors[toUnit]).toPrecision(5)} ${unitData.labels[toUnit].split(' ')[0]}`;
            this.elements.formulaText.textContent = sample;
        }
    }

    _convertTemperature(val, from, to) {
        if (from === to) return val;
        // 1. A Celsius
        let inCelsius = val;
        if (from === 'fahrenheit') inCelsius = (val - 32) * (5 / 9);
        else if (from === 'kelvin') inCelsius = val - 273.15;

        // 2. De Celsius a destino
        if (to === 'celsius') return inCelsius;
        if (to === 'fahrenheit') return (inCelsius * (9 / 5)) + 32;
        if (to === 'kelvin') return inCelsius + 273.15;
        return val;
    }
}
export { UnitConverterApp };
