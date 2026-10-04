// =======================================================
// --- native-ui.js ---
// Reemplazo 100% nativo y sin dependencias para Bootstrap
// Modal, Collapse, Accordion y Tooltips.
// =======================================================
"use strict";

/**
 * Controlador de Modal Nativo y Accesible.
 */
export class NativeModal {
    constructor(modalEl) {
        this.element = typeof modalEl === 'string' ? document.querySelector(modalEl) : modalEl;
        this.isOpen = false;
        this.backdrop = null;
        this.setupEvents();
    }

    setupEvents() {
        if (!this.element) return;

        // Botones de cierre (data-bs-dismiss="modal", data-modal-dismiss, .btn-close)
        this.element.querySelectorAll('[data-bs-dismiss="modal"], [data-modal-dismiss], .btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hide();
            });
        });

        // Clic fuera del contenido (en el overlay del modal)
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });

        // Tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    }

    show() {
        if (!this.element) return;
        this.isOpen = true;

        // Mostrar backdrop
        if (!this.backdrop) {
            this.backdrop = document.createElement('div');
            this.backdrop.className = 'modal-backdrop fade';
            document.body.appendChild(this.backdrop);
            // Trigger reflow para animación CSS
            void this.backdrop.offsetWidth;
            this.backdrop.classList.add('show');
            this.backdrop.addEventListener('click', () => this.hide());
        }

        // Mostrar modal
        this.element.style.display = 'flex';
        void this.element.offsetWidth; // Reflow para transición suave
        this.element.classList.add('show');
        this.element.removeAttribute('aria-hidden');
        this.element.setAttribute('aria-modal', 'true');
        document.body.classList.add('modal-open');

        // Enfocar primer elemento interactivo dentro del cuerpo del modal si existe
        const bodyFocusable = this.element.querySelector('.modal-body input:not([type="hidden"]):not([disabled]), .modal-body select:not([disabled]), .modal-body textarea:not([disabled]), .modal-body button:not([disabled])');
        if (bodyFocusable) {
            setTimeout(() => bodyFocusable.focus(), 60);
        } else {
            const fallbackFocusable = this.element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (fallbackFocusable) {
                fallbackFocusable.focus();
            }
        }
    }

    hide() {
        if (!this.element || !this.isOpen) return;
        this.isOpen = false;

        // Disparar evento hide.bs.modal para compatibilidad de limpieza (cancelar síntesis de voz, etc.)
        this.element.dispatchEvent(new CustomEvent('hide.bs.modal'));

        this.element.classList.remove('show');
        this.element.style.display = 'none';
        this.element.setAttribute('aria-hidden', 'true');
        this.element.removeAttribute('aria-modal');
        document.body.classList.remove('modal-open');

        // Remover backdrop con transición
        if (this.backdrop) {
            this.backdrop.classList.remove('show');
            setTimeout(() => {
                if (this.backdrop && this.backdrop.parentNode) {
                    this.backdrop.parentNode.removeChild(this.backdrop);
                }
                this.backdrop = null;
            }, 200);
        }
    }
}

/**
 * Controlador de Colapso / Acordeón Nativo.
 */
export class NativeCollapse {
    constructor(element, options = { toggle: false }) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.element) return;

        if (options && options.toggle) {
            this.toggle();
        }
    }

    toggle() {
        if (!this.element) return;
        if (this.element.classList.contains('show')) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (!this.element) return;
        this.element.classList.add('show');
        const triggers = document.querySelectorAll(`[data-bs-target="#${this.element.id}"], [data-collapse-target="#${this.element.id}"]`);
        triggers.forEach(tr => {
            tr.setAttribute('aria-expanded', 'true');
            tr.classList.remove('collapsed');
        });
    }

    hide() {
        if (!this.element) return;
        this.element.classList.remove('show');
        const triggers = document.querySelectorAll(`[data-bs-target="#${this.element.id}"], [data-collapse-target="#${this.element.id}"]`);
        triggers.forEach(tr => {
            tr.setAttribute('aria-expanded', 'false');
            tr.classList.add('collapsed');
        });
    }
}

/**
 * Inicializa la delegación global para botones con data-bs-toggle="collapse"
 * y soporte para acordeones con data-bs-parent.
 */
export function setupCollapseDelegation() {
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-bs-toggle="collapse"], [data-collapse-toggle]');
        if (!toggleBtn) return;

        const targetSelector = toggleBtn.getAttribute('data-bs-target') || toggleBtn.getAttribute('data-collapse-target');
        if (!targetSelector) return;

        const targetEl = document.querySelector(targetSelector);
        if (!targetEl) return;

        e.preventDefault();

        // Si pertenece a un acordeón con contenedor padre
        const parentSelector = targetEl.getAttribute('data-bs-parent');
        if (parentSelector) {
            const parent = document.querySelector(parentSelector);
            if (parent) {
                parent.querySelectorAll('.collapse.show').forEach(openEl => {
                    if (openEl !== targetEl) {
                        openEl.classList.remove('show');
                        const otherBtn = parent.querySelector(`[data-bs-target="#${openEl.id}"]`);
                        if (otherBtn) {
                            otherBtn.classList.add('collapsed');
                            otherBtn.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
            }
        }

        const isNowOpen = targetEl.classList.toggle('show');
        toggleBtn.setAttribute('aria-expanded', isNowOpen ? 'true' : 'false');
        toggleBtn.classList.toggle('collapsed', !isNowOpen);
    });
}
