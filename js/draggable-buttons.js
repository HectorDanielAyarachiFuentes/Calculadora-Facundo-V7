
document.addEventListener('DOMContentLoaded', () => {
    const draggableElements = [
        document.querySelector('.bubble-main'),
        document.getElementById('theme-toggle-btn'),
        document.getElementById('history-toggle-btn')
    ];

    draggableElements.forEach(element => {
        if (!element) return;

        let isDragging = false;
        let offsetX, offsetY;
        const originalPosition = {
            position: window.getComputedStyle(element).position,
            top: element.style.top,
            left: element.style.left
        };

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            element.style.position = 'absolute';
            element.style.zIndex = 1000;
            
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // Prevent default action to avoid text selection
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                element.style.left = `${e.clientX - offsetX}px`;
                element.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                // Restore original position
                element.style.position = originalPosition.position;
                element.style.top = originalPosition.top;
                element.style.left = originalPosition.left;
                element.style.zIndex = '';
            }
        });

        // Prevent click event from firing after drag
        let clickPrevented = false;
        element.addEventListener('mousemove', () => {
            if (isDragging) {
                clickPrevented = true;
            }
        });

        element.addEventListener('click', (e) => {
            if (clickPrevented) {
                e.preventDefault();
                e.stopPropagation();
                clickPrevented = false;
            }
        }, true); // Use capture phase to stop event early
    });
});
