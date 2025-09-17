// js/converters/temperature-converter.js
'use strict';

class TemperatureConverterApp {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.fields = {
            celsius: this.container.querySelector('#temp-celsius'),
            fahrenheit: this.container.querySelector('#temp-fahrenheit'),
            kelvin: this.container.querySelector('#temp-kelvin'),
        };

        this.bindEvents();
    }

    bindEvents() {
        this.container.addEventListener('input', (e) => {
            const sourceId = e.target.id.split('-')[1];
            const value = parseFloat(e.target.value);
            this.convert(sourceId, value);
        });
    }

    convert(source, value) {
        if (isNaN(value)) {
            this.clearAll();
            return;
        }

        let celsius, fahrenheit, kelvin;

        switch (source) {
            case 'celsius':
                celsius = value;
                fahrenheit = (celsius * 9/5) + 32;
                kelvin = celsius + 273.15;
                break;
            case 'fahrenheit':
                fahrenheit = value;
                celsius = (fahrenheit - 32) * 5/9;
                kelvin = celsius + 273.15;
                break;
            case 'kelvin':
                kelvin = value;
                celsius = kelvin - 273.15;
                fahrenheit = (celsius * 9/5) + 32;
                break;
            default:
                return;
        }

        this.updateFields({ celsius, fahrenheit, kelvin }, source);
    }

    updateFields(values, source) {
        const format = (num) => parseFloat(num.toFixed(2));

        if (source !== 'celsius') this.fields.celsius.value = format(values.celsius);
        if (source !== 'fahrenheit') this.fields.fahrenheit.value = format(values.fahrenheit);
        if (source !== 'kelvin') this.fields.kelvin.value = format(values.kelvin);
    }

    clearAll() {
        for (const key in this.fields) {
            this.fields[key].value = '';
        }
    }
}

window.TemperatureConverterApp = TemperatureConverterApp;