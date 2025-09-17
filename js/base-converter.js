// js/converters/base-converter.js
'use strict';

class BaseConverterApp {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.fields = {
            dec: this.container.querySelector('#base-dec'),
            bin: this.container.querySelector('#base-bin'),
            oct: this.container.querySelector('#base-oct'),
            hex: this.container.querySelector('#base-hex'),
        };

        this.bindEvents();
    }

    bindEvents() {
        this.container.addEventListener('input', (e) => {
            const sourceId = e.target.id.split('-')[1]; // dec, bin, oct, hex
            const value = e.target.value;
            this.convert(sourceId, value);
        });
    }

    convert(source, value) {
        if (value === '') {
            this.clearAll();
            return;
        }

        let decimalValue;

        // 1. Validate and convert input to a decimal number
        switch (source) {
            case 'dec':
                if (!/^\d+$/.test(value)) { this.clearAll(); return; }
                decimalValue = parseInt(value, 10);
                break;
            case 'bin':
                if (!/^[01]+$/.test(value)) { this.clearAll(); return; }
                decimalValue = parseInt(value, 2);
                break;
            case 'oct':
                if (!/^[0-7]+$/.test(value)) { this.clearAll(); return; }
                decimalValue = parseInt(value, 8);
                break;
            case 'hex':
                if (!/^[0-9a-fA-F]+$/.test(value)) { this.clearAll(); return; }
                decimalValue = parseInt(value, 16);
                break;
            default:
                return;
        }

        if (isNaN(decimalValue)) {
            this.clearAll();
            return;
        }

        // 2. Update all fields from the decimal value
        if (source !== 'dec') this.fields.dec.value = decimalValue;
        if (source !== 'bin') this.fields.bin.value = decimalValue.toString(2);
        if (source !== 'oct') this.fields.oct.value = decimalValue.toString(8);
        if (source !== 'hex') this.fields.hex.value = decimalValue.toString(16).toUpperCase();
    }

    clearAll() {
        for (const key in this.fields) {
            this.fields[key].value = '';
        }
    }
}

window.BaseConverterApp = BaseConverterApp;