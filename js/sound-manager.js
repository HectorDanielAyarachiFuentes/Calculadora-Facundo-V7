'use strict';

/**
 * Gestiona la carga y reproducción de efectos de sonido en la aplicación.
 */
class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = true; // Por defecto, los sonidos están desactivados hasta que los ajustes lo indiquen.

        // NOTA: Debes crear una carpeta 'sounds' en la raíz de tu proyecto y añadir
        // estos archivos de audio. Puedes encontrar sonidos gratuitos en freesound.org.
        this.soundPaths = {
            click: 'sounds/click.wav',
            clear: 'sounds/clear.wav',
            error: 'sounds/error.wav',
            success: 'sounds/success.wav'
        };
        this.preloadSounds();
    }

    preloadSounds() {
        for (const key in this.soundPaths) {
            this.sounds[key] = new Audio(this.soundPaths[key]);
            this.sounds[key].volume = 0.4; // Ajusta el volumen para que no sea muy alto.
        }
    }

    playSound(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0; // Rebobina para poder reproducir rápidamente.
            this.sounds[soundName].play().catch(e => console.warn(`No se pudo reproducir el sonido '${soundName}':`, e.message));
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
    }
}

window.soundManager = new SoundManager();