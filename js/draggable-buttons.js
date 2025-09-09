document.addEventListener('DOMContentLoaded', () => {
    const mainOptionsCollapseEl = document.getElementById('mainOptions');
    const mainOptionsCollapse = new bootstrap.Collapse(mainOptionsCollapseEl, {
        toggle: false
    });

    const draggableElements = [
        { el: document.querySelector('.bubble-main'), id: 'bubble-main-pos', type: 'collapse-toggle' },
        { el: document.getElementById('theme-toggle-btn'), id: 'theme-toggle-btn-pos', type: 'button' },
        { el: document.getElementById('history-toggle-btn'), id: 'history-toggle-btn-pos', type: 'button' }
    ];

    draggableElements.forEach(({ el: element, id: storageKey, type }) => {
        if (!element) return;

        // Correctly capture original styles using getComputedStyle for properties set in CSS
        const originalStyles = {
            position: window.getComputedStyle(element).position,
            top: window.getComputedStyle(element).top,
            left: window.getComputedStyle(element).left,
            zIndex: window.getComputedStyle(element).zIndex
        };

        const savedPosition = localStorage.getItem(storageKey);
        if (savedPosition) {
            const { top, left } = JSON.parse(savedPosition);
            element.style.position = 'absolute';
            element.style.top = top;
            element.style.left = left;
            element.style.zIndex = 1000; // High z-index for dragging
        }

        let isDragging = false;
        let hasDragged = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            // 1. Disable dragging if the tools menu is already open
            if (type === 'collapse-toggle' && mainOptionsCollapseEl.classList.contains('show')) {
                return; // Do not start dragging
            }

            isDragging = true;
            hasDragged = false;
            
            const rect = element.getBoundingClientRect();
            if (window.getComputedStyle(element).position !== 'absolute') {
                 offsetX = e.clientX - rect.left;
                 offsetY = e.clientY - rect.top;
            } else {
                offsetX = e.clientX - parseFloat(element.style.left);
                offsetY = e.clientY - parseFloat(element.style.top);
            }
            
            element.style.position = 'absolute';
            element.style.zIndex = 1000; // Set high z-index for dragging
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                hasDragged = true;
                element.style.left = `${e.clientX - offsetX}px`;
                element.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                if (hasDragged) {
                    const pos = { top: element.style.top, left: element.style.left };
                    localStorage.setItem(storageKey, JSON.stringify(pos));
                }
                isDragging = false;
            }
        });

        element.addEventListener('click', (e) => {
            if (hasDragged) {
                e.preventDefault();
                e.stopImmediatePropagation();
            } else {
                localStorage.removeItem(storageKey);
                // Restore all original styles
                element.style.position = originalStyles.position;
                element.style.top = originalStyles.top;
                element.style.left = originalStyles.left;
                element.style.zIndex = originalStyles.zIndex;

                if (type === 'collapse-toggle') {
                    mainOptionsCollapse.toggle();
                }
            }
        }, true);
    });
});