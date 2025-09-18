'use strict';

import { initDraggableButtons } from './draggable-buttons.js';
import { initInfoModal } from '../modal/bostraplectornumeros.js';

// Los otros scripts (sound-manager, settings, geometry, etc.) son cargados
// como dependencias de los módulos importados a continuación, por lo que no necesitamos
// importarlos aquí directamente. `settings.js` se instancia a sí mismo al ser importado,
// aplicando la configuración inicial.
/**
 * Aplica la configuración guardada para el botón de función especial al cargar la página.
 * Esto asegura que la preferencia del usuario sea persistente entre sesiones.
 */
function initSpecialFunctionButton() {
    const tmodButton = document.getElementById('tmod');
    const STORAGE_KEY = 'calculator_special_function';
    const savedFunctionValue = localStorage.getItem(STORAGE_KEY);

    // Si no hay botón o no hay valor guardado, no hacer nada.
    if (!tmodButton || !savedFunctionValue) return;

    // Para obtener los atributos (data-text, data-value, etc.),
    // buscamos la opción correspondiente en el template de configuración.
    const configTemplate = document.getElementById('config-modal-template');
    if (!configTemplate) return;

    const option = configTemplate.content.querySelector(`option[value="${savedFunctionValue}"]`);
    if (option) {
        const { text, action, value } = option.dataset;
        const ariaLabel = option.getAttribute('aria-label');

        // --- MEJORA: Usar un icono para funciones especiales como "Factores Primos" ---
        if (savedFunctionValue === 'primos') {
            tmodButton.innerHTML = '<i class="fa-solid fa-sitemap"></i>';
        } else {
            tmodButton.textContent = text;
        }
        tmodButton.dataset.action = action;
        tmodButton.dataset.value = value;
        tmodButton.setAttribute('aria-label', ariaLabel || text);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa la lógica para los botones arrastrables (herramientas, tema, historial)
    initDraggableButtons();

    // Inicializa la lógica para los modales (Lector de Números, Geometría, etc.)
    // Esto estaba originalmente en el DOMContentLoaded de bostraplectornumeros.js.
    initInfoModal();

    // Aplica la configuración del botón especial guardada por el usuario.
    initSpecialFunctionButton();
});