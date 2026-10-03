// =======================================================
// --- main.js (Punto de Entrada Principal) ---
// =======================================================
'use strict';

// --- IMPORTACIONES ---
// Módulos principales de la aplicación
import { HistoryManager, HistoryPanel, registerReExecuteHandler } from './history.js';
import { reExecuteOperationFromHistory } from './calculator-engine.js';
import { ThemeSwitcher } from './theme-switcher.js';
import * as UIManager from './ui-manager.js';
import { setupEventListeners } from './event-handler.js';
import { initApp } from './app.js';


// --- INICIALIZACIÓN Y EVENTOS ---

/**
 * Función principal que se ejecuta cuando el DOM está completamente cargado.
 * Se encarga de inicializar todos los módulos de la aplicación.
 */
function alCargar() {
    // 1. Inicializa los componentes de la UI (estilos, animaciones, etc.)
    UIManager.init();
    // 2. Inicializa el gestor del historial y el panel visual
    HistoryManager.init();
    HistoryPanel.init();
    registerReExecuteHandler(reExecuteOperationFromHistory);
    // 3. Inicializa el cambiador de tema (claro/oscuro)
    new ThemeSwitcher();
    // 4. Configura todos los manejadores de eventos (clics, teclado, etc.)
    setupEventListeners();
    // 6. Inicializa lógica adicional de UI y configuración (app.js)
    initApp();


    // 5. Configura manejadores globales de errores para una depuración más robusta.
    window.addEventListener('error', (event) => {
        console.log('ERROR GLOBAL CAPTURADO:', {
            mensaje: event.message,
            archivo: event.filename,
            linea: event.lineno,
            columna: event.colno,
            error: event.error,
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.log('PROMESA RECHAZADA SIN MANEJAR:', {
            motivo: event.reason,
        });
    });
    // 6. Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('SW registrado correctamente:', registration.scope);
                })
                .catch(error => {
                    console.log('Fallo en registro SW:', error);
                });
        });
    }
}



// --- INICIO DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', alCargar);

// --- RE-EXPORTACIONES ---
// Se re-exporta `reExecuteOperationFromHistory` para que otros módulos, como
// `history.js`, puedan importarla directamente desde `main.js` y evitar
// dependencias circulares complejas.
// Re-exportación circular removida para cumplir con directivas ECC y grafo limpio GitNexus