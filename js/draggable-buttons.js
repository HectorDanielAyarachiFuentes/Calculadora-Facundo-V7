document.addEventListener('DOMContentLoaded', () => {
    // --- SETUP ---
    const mainOptionsCollapseEl = document.getElementById('mainOptions');
    const mainOptionsCollapse = new bootstrap.Collapse(mainOptionsCollapseEl, { toggle: false });

    const elementConfigs = [
        { selector: '.bubble-main', type: 'collapse-toggle' },
        { selector: '#theme-toggle-btn', type: 'button' },
        { selector: '#history-toggle-btn', type: 'button' }
    ];

    const circles = [];
    const friction = 0.95;
    const bounce = 0.8;

    // --- INITIALIZATION ---
    elementConfigs.forEach(config => {
        const element = document.querySelector(config.selector);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        const circle = {
            el: element,
            type: config.type,
            x: rect.left,
            y: rect.top,
            vx: 0,
            vy: 0,
            radius: rect.width / 2,
            mass: 1,
            isBeingDragged: false,
            hasDragged: false,
            physicsEnabled: false, // STATE FLAG: Governed by physics?

            // Store all original styles for perfect reset
            original: {
                x: rect.left,
                y: rect.top,
                position: computedStyle.position,
                top: computedStyle.top,
                left: computedStyle.left,
                zIndex: computedStyle.zIndex
            }
        };
        circles.push(circle);

        // --- EVENT LISTENERS ---
        element.addEventListener('mousedown', (e) => {
            if (circle.type === 'collapse-toggle' && mainOptionsCollapseEl.classList.contains('show')) {
                return;
            }
            // Enable physics on this object
            circle.physicsEnabled = true;
            element.style.position = 'absolute';
            element.style.zIndex = 1000;

            circle.isBeingDragged = true;
            circle.hasDragged = false;
        });

        element.addEventListener('click', (e) => {
            if (circle.hasDragged) {
                e.preventDefault();
                e.stopImmediatePropagation();
            } else {
                // --- RESET TO ORIGINAL STATE ---
                // 1. Disable physics
                circle.physicsEnabled = false;

                // 2. Reset physics state
                circle.x = circle.original.x;
                circle.y = circle.original.y;
                circle.vx = 0;
                circle.vy = 0;

                // 3. Reset all DOM styles
                element.style.position = circle.original.position;
                element.style.top = circle.original.top;
                element.style.left = circle.original.left;
                element.style.zIndex = circle.original.zIndex;

                // 4. Perform click action
                if (circle.type === 'collapse-toggle') {
                    mainOptionsCollapse.toggle();
                }
            }
        }, true);
    });

    document.addEventListener('mousemove', (e) => {
        const draggedCircle = circles.find(c => c.isBeingDragged);
        if (draggedCircle) {
            draggedCircle.hasDragged = true;
            draggedCircle.x = e.clientX - draggedCircle.radius;
            draggedCircle.y = e.clientY - draggedCircle.radius;
        }
    });

    document.addEventListener('mouseup', () => {
        const draggedCircle = circles.find(c => c.isBeingDragged);
        if (draggedCircle) {
            draggedCircle.isBeingDragged = false;
            // Don't reset z-index immediately, let physics loop handle it
        }
    });

    // --- PHYSICS ENGINE ---
    function update() {
        circles.forEach(circle => {
            // Only apply physics and rendering if enabled
            if (!circle.physicsEnabled) return;

            if (!circle.isBeingDragged) {
                circle.vx *= friction;
                circle.vy *= friction;
                circle.x += circle.vx;
                circle.y += circle.vy;
                circle.el.style.zIndex = circle.original.zIndex;
            }

            // Wall collisions
            if (circle.x < 0) { circle.x = 0; circle.vx *= -bounce; }
            if (circle.x > window.innerWidth - circle.radius * 2) { circle.x = window.innerWidth - circle.radius * 2; circle.vx *= -bounce; }
            if (circle.y < 0) { circle.y = 0; circle.vy *= -bounce; }
            if (circle.y > window.innerHeight - circle.radius * 2) { circle.y = window.innerHeight - circle.radius * 2; circle.vy *= -bounce; }

            // Render
            circle.el.style.left = `${circle.x}px`;
            circle.el.style.top = `${circle.y}px`;
        });

        // Object collisions (in a separate loop for clarity)
        for (let i = 0; i < circles.length; i++) {
            const c1 = circles[i];
            if (!c1.physicsEnabled) continue;

            for (let j = i + 1; j < circles.length; j++) {
                const c2 = circles[j];
                if (!c2.physicsEnabled) continue;

                const dx = c2.x - c1.x;
                const dy = c2.y - c1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = c1.radius + c2.radius;

                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDistance - distance;
                    const separateX = overlap * Math.cos(angle);
                    const separateY = overlap * Math.sin(angle);

                    if (!c1.isBeingDragged) { c1.x -= separateX / 2; c1.y -= separateY / 2; }
                    if (!c2.isBeingDragged) { c2.x += separateX / 2; c2.y += separateY / 2; }
                    
                    const newVelX1 = c1.vx * Math.cos(angle) + c1.vy * Math.sin(angle);
                    const newVelY1 = c1.vy * Math.cos(angle) - c1.vx * Math.sin(angle);
                    const newVelX2 = c2.vx * Math.cos(angle) + c2.vy * Math.sin(angle);
                    const newVelY2 = c2.vy * Math.cos(angle) - c2.vx * Math.sin(angle);

                    const finalVelX1 = ((c1.mass - c2.mass) * newVelX1 + (c2.mass + c2.mass) * newVelX2) / (c1.mass + c2.mass);
                    const finalVelX2 = ((c1.mass + c1.mass) * newVelX1 + (c2.mass - c1.mass) * newVelX2) / (c1.mass + c2.mass);

                    if (!c1.isBeingDragged) { c1.vx = finalVelX2 * Math.cos(angle) - newVelY1 * Math.sin(angle); c1.vy = newVelY1 * Math.cos(angle) + finalVelX2 * Math.sin(angle); }
                    if (!c2.isBeingDragged) { c2.vx = finalVelX1 * Math.cos(angle) - newVelY2 * Math.sin(angle); c2.vy = newVelY2 * Math.cos(angle) + finalVelX1 * Math.sin(angle); }
                }
            }
        }

        requestAnimationFrame(update);
    }

    update();
});