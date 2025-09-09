
document.addEventListener('DOMContentLoaded', () => {
    // Get the collapse element and initialize a Bootstrap instance
    const mainOptionsCollapseEl = document.getElementById('mainOptions');
    const mainOptionsCollapse = new bootstrap.Collapse(mainOptionsCollapseEl, {
        toggle: false // Initialize but don't toggle on creation
    });

    const draggableElements = [
        { el: document.querySelector('.bubble-main'), id: 'bubble-main-pos', type: 'collapse-toggle' },
        { el: document.getElementById('theme-toggle-btn'), id: 'theme-toggle-btn-pos', type: 'button' },
        { el: document.getElementById('history-toggle-btn'), id: 'history-toggle-btn-pos', type: 'button' }
    ];

    draggableElements.forEach(({ el: element, id: storageKey, type }) => {
        if (!element) return;

        const originalStyles = {
            position: window.getComputedStyle(element).position,
            top: element.style.top,
            left: element.style.left,
            zIndex: element.style.zIndex
        };

        const savedPosition = localStorage.getItem(storageKey);
        if (savedPosition) {
            const { top, left } = JSON.parse(savedPosition);
            element.style.position = 'absolute';
            element.style.top = top;
            element.style.left = left;
            element.style.zIndex = 1000;
        }

        let isDragging = false;
        let hasDragged = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
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
            element.style.zIndex = 1000;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                // Add a small threshold to prevent accidental drags
                if (!hasDragged) {
                    hasDragged = true;
                }
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
                // This was a drag, not a click. Prevent everything.
                e.preventDefault();
                e.stopImmediatePropagation();
            } else {
                // This is a real click.
                // 1. Reset position.
                localStorage.removeItem(storageKey);
                element.style.position = originalStyles.position;
                element.style.top = originalStyles.top;
                element.style.left = originalStyles.left;
                element.style.zIndex = originalStyles.zIndex;

                // 2. Manually trigger the action for the specific button.
                if (type === 'collapse-toggle') {
                    mainOptionsCollapse.toggle();
                }
                // For other buttons, their default behavior is not prevented
                // so the theme will still switch and the history will still open.
            }
        }, true); // Use capture phase.
    });
});
