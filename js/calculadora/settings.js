'use strict';

import { soundManager } from './sound-manager.js';
import { resetDraggableButtonPositions } from './draggable-buttons.js';
import { DialogService } from '../modal/native-ui.js';

class SettingsManager {
    constructor() {
        this.SETTINGS_KEY = 'calculator_settings';
        this.defaultSettings = {
            animationSpeed: 1,      // 1 = normal, 0.5 = fast, 2 = slow
            soundEffectsEnabled: true,
            hapticFeedbackEnabled: true,
            glitchEffectEnabled: true,
        };
        this.settings = this.loadSettings();
        this.applyAllSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem(this.SETTINGS_KEY);
        return saved ? { ...this.defaultSettings, ...JSON.parse(saved) } : { ...this.defaultSettings };
    }

    saveSettings() {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySetting(key);
    }

    applySetting(key) {
        switch (key) {
            case 'animationSpeed':
                this.applyAnimationSpeed();
                break;
            case 'soundEffectsEnabled':
                soundManager.setMuted(!this.settings.soundEffectsEnabled);
                break;
        }
    }

    applyAllSettings() {
        Object.keys(this.settings).forEach(key => this.applySetting(key));
    }

    applyAnimationSpeed() {
        // Usamos una variable CSS global para que sea fácil de acceder desde cualquier parte
        document.documentElement.style.setProperty('--animation-speed-multiplier', this.settings.animationSpeed);
    }

    initUI() {
        const speedSelector = document.getElementById('animationSpeedSelector');
        const resetPositionsBtn = document.getElementById('resetPositionsBtn');
        const clearAllDataBtn = document.getElementById('clearAllDataBtn');
        const soundToggle = document.getElementById('soundEffectsToggle');
        const hapticToggle = document.getElementById('hapticFeedbackToggle');
        const glitchToggle = document.getElementById('glitchEffectToggle');

        if (speedSelector) {
            speedSelector.value = this.settings.animationSpeed;
            speedSelector.addEventListener('change', (e) => {
                this.updateSetting('animationSpeed', parseFloat(e.target.value));
            });
        }

        if (resetPositionsBtn) {
            resetPositionsBtn.addEventListener('click', () => {
                if (resetDraggableButtonPositions) {
                    resetDraggableButtonPositions();
                } else {
                    console.error('La función para restaurar posiciones no está disponible.');
                }
            });
        }

        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', async () => {
                const confirmed = await DialogService.confirm({
                    title: '¿Borrar todos los datos?',
                    message: '¿Estás seguro de que quieres borrar TODOS los datos de la aplicación? (Historial, tema, ajustes y posiciones de botones).\n\nEsta acción no se puede deshacer.',
                    confirmText: 'Sí, borrar todo',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    icon: 'fa-triangle-exclamation'
                });
                if (confirmed) {
                    localStorage.removeItem('calculatorHistory');
                    localStorage.removeItem('calculadora-facundo-theme');
                    localStorage.removeItem(this.SETTINGS_KEY);
                    
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('draggable_pos_')) localStorage.removeItem(key);
                    });
                    
                    DialogService.toast('Restableciendo aplicación...', { type: 'warning', icon: 'fa-arrows-rotate' });
                    setTimeout(() => window.location.reload(), 900);
                }
            });
        }

        if (soundToggle) {
            soundToggle.checked = this.settings.soundEffectsEnabled;
            soundToggle.addEventListener('change', (e) => {
                this.updateSetting('soundEffectsEnabled', e.target.checked);
            });
        }

        if (hapticToggle) {
            hapticToggle.checked = this.settings.hapticFeedbackEnabled;
            hapticToggle.addEventListener('change', (e) => {
                this.updateSetting('hapticFeedbackEnabled', e.target.checked);
            });
        }

        if (glitchToggle) {
            glitchToggle.checked = this.settings.glitchEffectEnabled;
            glitchToggle.addEventListener('change', (e) => {
                this.updateSetting('glitchEffectEnabled', e.target.checked);
            });
        }
    }

    triggerHapticFeedback(duration = 50) {
        if (this.settings.hapticFeedbackEnabled && 'vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }
}

export const settingsManager = new SettingsManager();