'use strict';

import { initDraggableButtons } from './draggable-buttons.js';
import { initInfoModal } from '../modal/bostraplectornumeros.js';

// Los otros scripts (sound-manager, settings, geometry, etc.) son cargados
// como dependencias de los módulos importados a continuación, por lo que no necesitamos
// importarlos aquí directamente. `settings.js` se instancia a sí mismo al ser importado,
// aplicando la configuración inicial.

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa la lógica para los botones arrastrables (herramientas, tema, historial)
    initDraggableButtons();

    // Inicializa la lógica para los modales (Lector de Números, Geometría, etc.)
    // Esto estaba originalmente en el DOMContentLoaded de bostraplectornumeros.js.
    initInfoModal();
});