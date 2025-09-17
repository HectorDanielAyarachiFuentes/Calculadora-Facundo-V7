'use strict';

function initializeDraggableButtons() {
    const draggableElements = document.querySelectorAll('.bubble-main, .history-toggle-btn, .theme-toggle-btn');

    draggableElements.forEach(element => {
        if (!element.id) {
            console.warn('Elemento arrastrable no tiene ID, no se guardará su posición:', element);
            return;
        }

        const storageKey = `draggable-pos-${element.id}`;
        let isDragging = false;
        let offsetX, offsetY;

        // 1. Cargar y aplicar posición guardada al inicio
        const savedPosition = localStorage.getItem(storageKey);
        if (savedPosition) {
            const { top, left } = JSON.parse(savedPosition);
            element.style.top = top;
            element.style.left = left;
            // El CSS original usa 'right' para algunos botones, así que lo reseteamos para que 'left' tenga efecto.
            element.style.right = 'auto';
        }

        element.addEventListener('mousedown', (e) => {
            // Prevenir el inicio del arrastre si el clic es en un elemento hijo como un ícono
            if (e.target !== element && e.target.closest('i')) return;

            isDragging = true;
            element.classList.add('dragging');
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        });

        function onMouseMove(e) {
            if (!isDragging) return;

            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // Limitar la posición para que el botón no se salga de la ventana
            const elemWidth = element.offsetWidth;
            const elemHeight = element.offsetHeight;
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;

            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft + elemWidth > winWidth) newLeft = winWidth - elemWidth;
            if (newTop + elemHeight > winHeight) newTop = winHeight - elemHeight;

            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
            // Asegurarse de que 'right' no interfiera con la nueva posición 'left'
            element.style.right = 'auto';
        }

        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;

            element.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Guardar la posición final en localStorage en PORCENTAJES para adaptabilidad
            const finalRect = element.getBoundingClientRect();
            const pos = {
                top: `${(finalRect.top / window.innerHeight) * 100}%`,
                left: `${(finalRect.left / window.innerWidth) * 100}%`,
            };

            localStorage.setItem(storageKey, JSON.stringify(pos));

            document.removeEventListener('mousemove', onMouseMove);
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeDraggableButtons);