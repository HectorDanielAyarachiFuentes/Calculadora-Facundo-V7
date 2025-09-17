const elementConfigs = [
    { id: 'bubble-main', selector: '.bubble-main', type: 'collapse-toggle' },
    { id: 'theme-toggle-btn', selector: '#theme-toggle-btn', type: 'button' },
    { id: 'history-toggle-btn', selector: '#history-toggle-btn', type: 'button' }
];

const draggables = [];
const STORAGE_KEY_PREFIX = 'draggable_pos_';
const DRAG_THRESHOLD = 5; // Píxeles a mover antes de que comience un arrastre

// --- Manejadores Globales de Arrastre ---
function onMouseMove(e) {
    const activeDraggable = draggables.find(d => d.isDragging);
    if (!activeDraggable) return;

    // Comprobar si se ha superado el umbral de arrastre
    if (!activeDraggable.hasDragged) {
        const dx = e.clientX - activeDraggable.startX;
        const dy = e.clientY - activeDraggable.startY;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
            activeDraggable.hasDragged = true;
            activeDraggable.el.classList.add('dragging'); // Añadir feedback visual
            document.body.style.userSelect = 'none'; // Prevenir selección de texto
        }
    }

    // Si se está arrastrando, actualizar posición
    if (activeDraggable.hasDragged) {
        let newLeft = e.clientX - activeDraggable.offsetX;
        let newTop = e.clientY - activeDraggable.offsetY;

        // Limitar al viewport
        const elemWidth = activeDraggable.el.offsetWidth;
        const elemHeight = activeDraggable.el.offsetHeight;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft + elemWidth > winWidth) newLeft = winWidth - elemWidth;
        if (newTop + elemHeight > winHeight) newTop = winHeight - elemHeight;

        activeDraggable.el.style.left = `${newLeft}px`;
        activeDraggable.el.style.top = `${newTop}px`;
        // Asegurar que la posición sea fija para que no se mueva con el scroll
        activeDraggable.el.style.position = 'fixed';
        activeDraggable.el.style.right = 'auto';
    }
}

function onMouseUp() {
    const activeDraggable = draggables.find(d => d.isDragging);
    if (!activeDraggable) return;

    activeDraggable.isDragging = false;
    activeDraggable.el.classList.remove('dragging');
    document.body.style.userSelect = '';

    if (activeDraggable.hasDragged) {
        savePosition(activeDraggable);
    }

    document.removeEventListener('mousemove', onMouseMove);
}

// --- Gestión de Posición ---
function resetPosition(draggable) {
    // Añade la clase para activar la animación de rebote en el CSS.
    draggable.el.classList.add('bouncing-back');

    // Elimina los estilos en línea para que el botón vuelva a su posición original definida por CSS.
    // El navegador aplicará la animación al cambiar de una posición fija a la original.
    draggable.el.style.position = '';
    draggable.el.style.top = '';
    draggable.el.style.left = '';
    draggable.el.style.right = '';

    // Limpia la clase de animación una vez que termine para no interferir con futuros arrastres.
    draggable.el.addEventListener('animationend', () => {
        draggable.el.classList.remove('bouncing-back');
    }, { once: true });

    // Elimina la posición guardada para que no se restaure en la próxima recarga.
    localStorage.removeItem(STORAGE_KEY_PREFIX + draggable.id);
}

function savePosition(draggable) {
    const rect = draggable.el.getBoundingClientRect();
    const pos = {
        // Guardar como porcentaje para ser responsivo
        top: `${(rect.top / window.innerHeight) * 100}%`,
        left: `${(rect.left / window.innerWidth) * 100}%`,
    };
    localStorage.setItem(STORAGE_KEY_PREFIX + draggable.id, JSON.stringify(pos));
}

function loadPosition(draggable) {
    const savedPosition = localStorage.getItem(STORAGE_KEY_PREFIX + draggable.id);
    if (savedPosition) {
        const { top, left } = JSON.parse(savedPosition);
        draggable.el.style.position = 'fixed';
        draggable.el.style.top = top;
        draggable.el.style.left = left;
        draggable.el.style.right = 'auto'; // Sobrescribir CSS que use 'right'
    }
}

/**
 * Inicializa la funcionalidad de los botones arrastrables.
 */
export function initDraggableButtons() {
    // Instancia de Bootstrap Collapse para el menú principal
    const mainOptionsCollapseEl = document.getElementById('mainOptions');
    const mainOptionsCollapse = new bootstrap.Collapse(mainOptionsCollapseEl, { toggle: false });

    // Inicializa cada elemento arrastrable
    elementConfigs.forEach(config => {
        const element = document.querySelector(config.selector);
        if (!element) return;

        const draggable = {
            id: config.id,
            el: element,
            type: config.type,
            isDragging: false,
            hasDragged: false,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0,
        };
        draggables.push(draggable);

        // Cargar posición guardada
        loadPosition(draggable);

        // --- Event Listeners ---
        element.addEventListener('mousedown', (e) => {
            // Prevenir arrastre si el menú principal está abierto
            if (draggable.type === 'collapse-toggle' && mainOptionsCollapseEl.classList.contains('show')) {
                return;
            }
            // Prevenir arrastre con clic derecho
            if (e.button !== 0) return;

            draggable.isDragging = true;
            draggable.hasDragged = false;
            draggable.startX = e.clientX;
            draggable.startY = e.clientY;

            const rect = element.getBoundingClientRect();
            draggable.offsetX = e.clientX - rect.left;
            draggable.offsetY = e.clientY - rect.top;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        });

        element.addEventListener('click', (e) => {
            // Si el elemento fue arrastrado, prevenir la acción de clic (ej. abrir menú)
            if (draggable.hasDragged) {
                e.preventDefault();
                e.stopImmediatePropagation();
            } else {
                // Para cualquier clic simple (sin arrastre), resetea la posición con la animación de rebote.
                resetPosition(draggable);

                // Si es el botón de herramientas, también se encarga de alternar el menú.
                if (draggable.type === 'collapse-toggle') {
                    mainOptionsCollapse.toggle();
                }
                // Para los otros botones (tema, historial), su acción de clic normal
                // se ejecutará después, ya que no se detiene la propagación del evento.
            }
        }, true); // Usar fase de captura para detener la propagación antes
    });

    // Recalcular posiciones si la ventana cambia de tamaño
    window.addEventListener('resize', () => {
        draggables.forEach(loadPosition);
    });
}

/**
 * Restaura las posiciones de los botones arrastrables a su estado original.
 */
export function resetDraggableButtonPositions() {
    if (confirm('¿Restaurar las posiciones de todos los botones flotantes a su estado original?')) {
        draggables.forEach(resetPosition);
        alert('Posiciones restauradas. Se aplicarán al recargar la página.');
        window.location.reload();
    }
}