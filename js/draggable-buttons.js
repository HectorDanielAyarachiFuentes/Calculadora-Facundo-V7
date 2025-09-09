document.addEventListener('DOMContentLoaded', () => {
    const mainOptionsCollapseEl = document.getElementById('mainOptions');
    const mainOptionsCollapse = new bootstrap.Collapse(mainOptionsCollapseEl, { toggle: false });

    const elementConfigs = [
        { id: 'bubble-main', selector: '.bubble-main', type: 'collapse-toggle' },
        { id: 'theme-toggle-btn', selector: '#theme-toggle-btn', type: 'button' },
        { id: 'history-toggle-btn', selector: '#history-toggle-btn', type: 'button' }
    ];

    const circles = [];
    const friction = 0.97;
    const bounce = 0.9;
    const restitution = 1.1;
    const STORAGE_KEY = 'physicsCirclesState';
    const dragThreshold = 5; // Pixels to move before a drag starts

    let prevMouseX = 0, prevMouseY = 0;

    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    elementConfigs.forEach(config => {
        const element = document.querySelector(config.selector);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        const savedCircle = savedState.find(s => s.id === config.id);

        const circle = {
            id: config.id, el: element, type: config.type,
            x: savedCircle ? savedCircle.x : rect.left, y: savedCircle ? savedCircle.y : rect.top,
            vx: 0, vy: 0, radius: rect.width / 2, mass: 1,
            isBeingDragged: false, hasDragged: false, physicsEnabled: !!savedCircle,
            startX: 0, startY: 0, // For drag threshold
            original: {
                x: rect.left, y: rect.top,
                position: computedStyle.position, top: computedStyle.top,
                left: computedStyle.left, zIndex: computedStyle.zIndex
            }
        };
        circles.push(circle);

        if (circle.physicsEnabled) element.style.position = 'absolute';

        element.addEventListener('mousedown', (e) => {
            if (circle.type === 'collapse-toggle' && mainOptionsCollapseEl.classList.contains('show')) return;
            
            circle.isBeingDragged = true;
            circle.hasDragged = false;
            circle.startX = e.clientX;
            circle.startY = e.clientY;
            prevMouseX = e.clientX;
            prevMouseY = e.clientY;
        });

        element.addEventListener('click', (e) => {
            if (circle.hasDragged) {
                e.preventDefault();
                e.stopImmediatePropagation();
            } else {
                circle.physicsEnabled = false;
                circle.x = circle.original.x; circle.y = circle.original.y;
                circle.vx = 0; circle.vy = 0;
                element.style.position = circle.original.position;
                element.style.top = circle.original.top;
                element.style.left = circle.original.left;
                element.style.zIndex = circle.original.zIndex;
                if (circle.type === 'collapse-toggle') mainOptionsCollapse.toggle();
            }
        }, true);
    });

    document.addEventListener('mousemove', (e) => {
        const draggedCircle = circles.find(c => c.isBeingDragged);
        if (draggedCircle) {
            if (!draggedCircle.hasDragged) {
                const dx = e.clientX - draggedCircle.startX;
                const dy = e.clientY - draggedCircle.startY;
                if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
                    draggedCircle.hasDragged = true;
                    if (!draggedCircle.physicsEnabled) {
                        draggedCircle.physicsEnabled = true;
                        draggedCircle.el.style.position = 'absolute';
                    }
                    draggedCircle.el.style.zIndex = 1000;
                }
            }

            if (draggedCircle.hasDragged) {
                const mouseVX = e.clientX - prevMouseX;
                const mouseVY = e.clientY - prevMouseY;

                draggedCircle.x = e.clientX - draggedCircle.radius;
                draggedCircle.y = e.clientY - draggedCircle.radius;
                draggedCircle.vx = mouseVX;
                draggedCircle.vy = mouseVY;
            }
        }
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
        const draggedCircle = circles.find(c => c.isBeingDragged);
        if (draggedCircle) {
            draggedCircle.isBeingDragged = false;
        }
    });

    window.addEventListener('beforeunload', () => {
        const stateToSave = circles.map(c => ({ id: c.id, x: c.x, y: c.y }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    });

    function update() {
        circles.forEach(circle => {
            if (!circle.physicsEnabled) return;

            if (!circle.isBeingDragged) {
                circle.vx *= friction;
                circle.vy *= friction;
                circle.x += circle.vx;
                circle.y += circle.vy;
                circle.el.style.zIndex = circle.original.zIndex;
            }

            if (circle.x < 0) { circle.x = 0; circle.vx *= -bounce; }
            if (circle.x > window.innerWidth - circle.radius * 2) { circle.x = window.innerWidth - circle.radius * 2; circle.vx *= -bounce; }
            if (circle.y < 0) { circle.y = 0; circle.vy *= -bounce; }
            if (circle.y > window.innerHeight - circle.radius * 2) { circle.y = window.innerHeight - circle.radius * 2; circle.vy *= -bounce; }

            circle.el.style.left = `${circle.x}px`;
            circle.el.style.top = `${circle.y}px`;
        });

        for (let i = 0; i < circles.length; i++) {
            const c1 = circles[i];
            if (!c1.physicsEnabled) continue;
            for (let j = i + 1; j < circles.length; j++) {
                const c2 = circles[j];
                if (!c2.physicsEnabled) continue;

                const dx = c2.x - c1.x, dy = c2.y - c1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = c1.radius + c2.radius;

                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDistance - distance;
                    const separateX = overlap * Math.cos(angle), separateY = overlap * Math.sin(angle);

                    if (!c1.isBeingDragged) { c1.x -= separateX / 2; c1.y -= separateY / 2; }
                    if (!c2.isBeingDragged) { c2.x += separateX / 2; c2.y += separateY / 2; }
                    
                    const newVelX1 = c1.vx * Math.cos(angle) + c1.vy * Math.sin(angle), newVelY1 = c1.vy * Math.cos(angle) - c1.vx * Math.sin(angle);
                    const newVelX2 = c2.vx * Math.cos(angle) + c2.vy * Math.sin(angle), newVelY2 = c2.vy * Math.cos(angle) - c2.vx * Math.sin(angle);
                    const finalVelX1 = ((c1.mass - c2.mass) * newVelX1 + (c2.mass + c2.mass) * newVelX2) / (c1.mass + c2.mass);
                    const finalVelX2 = ((c1.mass + c1.mass) * newVelX1 + (c2.mass - c1.mass) * newVelX2) / (c1.mass + c2.mass);

                    if (!c1.isBeingDragged) {
                        c1.vx = (finalVelX2 * Math.cos(angle) - newVelY1 * Math.sin(angle)) * restitution;
                        c1.vy = (newVelY1 * Math.cos(angle) + finalVelX2 * Math.sin(angle)) * restitution;
                    }
                    if (!c2.isBeingDragged) {
                        c2.vx = (finalVelX1 * Math.cos(angle) - newVelY2 * Math.sin(angle)) * restitution;
                        c2.vy = (newVelY2 * Math.cos(angle) + finalVelX1 * Math.sin(angle)) * restitution;
                    }
                }
            }
        }
        requestAnimationFrame(update);
    }
    update();
});