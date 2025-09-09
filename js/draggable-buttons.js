document.addEventListener('DOMContentLoaded', () => {
    const draggableElements = [
        { el: document.querySelector('.bubble-main'), id: 'bubble-main-pos' },
        { el: document.getElementById('theme-toggle-btn'), id: 'theme-toggle-btn-pos' },
        { el: document.getElementById('history-toggle-btn'), id: 'history-toggle-btn-pos' }
    ];

    draggableElements.forEach(({ el: element, id: storageKey }) => {
        if (!element) return;

        // Store original styles to revert to.
        const originalStyles = {
            position: window.getComputedStyle(element).position,
            top: element.style.top,
            left: element.style.left,
            zIndex: element.style.zIndex
        };

        // Load saved position from localStorage
        const savedPosition = localStorage.getItem(storageKey);
        if (savedPosition) {
            const { top, left } = JSON.parse(savedPosition);
            element.style.position = 'absolute';
            element.style.top = top;
            element.style.left = left;
            element.style.zIndex = 1000;
        }

        let isDragging = false;
        let hasDragged = false; // To distinguish a click from a drag
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            hasDragged = false; // Reset on new mousedown
            
            const rect = element.getBoundingClientRect();
            // If the element is not 'absolute' yet, we calculate offset differently
            if (window.getComputedStyle(element).position !== 'absolute') {
                 offsetX = e.clientX - rect.left;
                 offsetY = e.clientY - rect.top;
            } else {
                // If it's already absolute, the offset is relative to the page
                offsetX = e.clientX - parseFloat(element.style.left);
                offsetY = e.clientY - parseFloat(element.style.top);
            }
            
            // We make it absolute to allow dragging
            element.style.position = 'absolute';
            element.style.zIndex = 1000;

            // Don't prevent default here, as it can interfere with the click event logic
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                hasDragged = true; // It's a drag, not a click
                element.style.left = `${e.clientX - offsetX}px`;
                element.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                if (hasDragged) {
                    // If it was dragged, save the new position
                    const pos = { top: element.style.top, left: element.style.left };
                    localStorage.setItem(storageKey, JSON.stringify(pos));
                }
                isDragging = false;
            }
        });

        element.addEventListener('click', (e) => {
            if (hasDragged) {
                // If the element was dragged, prevent the default click action
                e.preventDefault();
                e.stopPropagation();
            } else {
                // If it was a simple click (no drag), reset position
                localStorage.removeItem(storageKey);
                element.style.position = originalStyles.position;
                element.style.top = originalStyles.top;
                element.style.left = originalStyles.left;
                element.style.zIndex = originalStyles.zIndex;
            }
        }, true); // Use capture phase
    });
});