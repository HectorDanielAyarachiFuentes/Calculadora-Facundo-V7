// js/converters/unit-converter.js
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
        };

        this.units = {
            length: {
                name: 'Longitud',
                base: 'meters',
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
        };

        this.bindEvents();
        this.updateUnitSelectors();
    }

    bindEvents() {
        this.elements.categorySelect.addEventListener('change', () => this.updateUnitSelectors());
        this.elements.fromSelect.addEventListener('change', () => this.convert());
        this.elements.toSelect.addEventListener('change', () => this.convert());
        this.elements.fromInput.addEventListener('input', () => this.convert());
        this.elements.toInput.addEventListener('input', (e) => this.convert(e, true));
    }

    updateUnitSelectors() {
        const category = this.elements.categorySelect.value;
        const unitData = this.units[category];
        if (!unitData) return;

        const optionsHtml = Object.keys(unitData.factors).map(key => 
            `<option value="${key}">${unitData.labels[key]}</option>`
        ).join('');

        this.elements.fromSelect.innerHTML = optionsHtml;
        this.elements.toSelect.innerHTML = optionsHtml;
        this.elements.toSelect.value = Object.keys(unitData.factors)[1]; // Select second option by default
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
            return;
        }

        // Convert 'from' value to base unit
        const valueInBase = fromValue * (isReverse ? unitData.factors[toUnit] : unitData.factors[fromUnit]);
        
        // Convert from base unit to 'to' value
        const result = valueInBase / (isReverse ? unitData.factors[fromUnit] : unitData.factors[toUnit]);

        toInput.value = parseFloat(result.toPrecision(6));
    }
}

window.UnitConverterApp = UnitConverterApp;