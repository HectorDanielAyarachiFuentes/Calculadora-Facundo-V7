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

/**
 * Servicio de Diálogos y Notificaciones Ultra-Modernos (Reemplazo de alert() y confirm()).
 * Diseñado con estética Glassmorphism, iluminación ambiental de neón y accesibilidad completa.
 */
export class DialogService {
    static _toastContainer = null;

    /**
     * Sanitiza texto básico para evitar inyecciones HTML accidentales en mensajes.
     * @private
     */
    static _escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Muestra un diálogo de confirmación asíncrono con estética cyberpunk/glassmorphism.
     * @param {Object} options
     * @param {string} options.title - Título del diálogo
     * @param {string} options.message - Mensaje explicativo
     * @param {string} [options.confirmText='Aceptar'] - Texto del botón afirmativo
     * @param {string} [options.cancelText='Cancelar'] - Texto del botón de cancelación
     * @param {'danger'|'warning'|'info'|'success'} [options.type='danger'] - Tono visual
     * @param {string} [options.icon] - Icono FontAwesome opcional
     * @returns {Promise<boolean>}
     */
    static confirm({
        title = '¿Confirmar acción?',
        message = '',
        confirmText = 'Aceptar',
        cancelText = 'Cancelar',
        type = 'danger',
        icon = null
    } = {}) {
        return DialogService._renderDialog({
            title,
            message,
            confirmText,
            cancelText,
            type,
            icon,
            isConfirm: true
        });
    }

    /**
     * Muestra una alerta modal estilizada.
     * @param {Object} options
     * @param {string} options.title - Título de la alerta
     * @param {string} options.message - Mensaje informativo
     * @param {string} [options.confirmText='Entendido'] - Texto del botón
     * @param {'danger'|'warning'|'info'|'success'} [options.type='info'] - Tono visual
     * @param {string} [options.icon] - Icono FontAwesome opcional
     * @returns {Promise<void>}
     */
    static alert({
        title = 'Notificación',
        message = '',
        confirmText = 'Entendido',
        type = 'info',
        icon = null
    } = {}) {
        return DialogService._renderDialog({
            title,
            message,
            confirmText,
            cancelText: null,
            type,
            icon,
            isConfirm: false
        });
    }

    /**
     * Renderizador del diálogo interactivo.
     * @private
     */
    static _renderDialog({ title, message, confirmText, cancelText, type, icon, isConfirm }) {
        return new Promise((resolve) => {
            const previousActiveElement = document.activeElement;

            const defaultIcons = {
                danger: 'fa-triangle-exclamation',
                warning: 'fa-circle-exclamation',
                info: 'fa-circle-info',
                success: 'fa-circle-check'
            };
            const iconClass = icon || defaultIcons[type] || defaultIcons.info;

            const escapedLines = DialogService._escapeHTML(message).split('\n').filter(Boolean);
            const messageHtml = escapedLines.length > 0
                ? escapedLines.map(line => `<p class="calc-dialog-text">${line}</p>`).join('')
                : '';

            const overlay = document.createElement('div');
            overlay.className = 'calc-dialog-overlay';
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'calc-dialog-title');

            overlay.innerHTML = `
                <div class="calc-dialog-card calc-dialog-card--${type}">
                    <div class="calc-dialog-glow"></div>
                    <div class="calc-dialog-icon calc-dialog-icon--${type}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <h3 id="calc-dialog-title" class="calc-dialog-title">${DialogService._escapeHTML(title)}</h3>
                    <div class="calc-dialog-message">${messageHtml}</div>
                    <div class="calc-dialog-actions">
                        ${isConfirm ? `<button type="button" class="calc-dialog-btn calc-dialog-btn--cancel">${DialogService._escapeHTML(cancelText)}</button>` : ''}
                        <button type="button" class="calc-dialog-btn calc-dialog-btn--confirm calc-dialog-btn--${type}">${DialogService._escapeHTML(confirmText)}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            void overlay.offsetWidth;
            overlay.classList.add('calc-dialog-overlay--show');

            const card = overlay.querySelector('.calc-dialog-card');
            const confirmBtn = overlay.querySelector('.calc-dialog-btn--confirm');
            const cancelBtn = overlay.querySelector('.calc-dialog-btn--cancel');

            if (isConfirm && type === 'danger' && cancelBtn) {
                cancelBtn.focus();
            } else if (confirmBtn) {
                confirmBtn.focus();
            }

            let isClosed = false;
            const cleanup = (result) => {
                if (isClosed) return;
                isClosed = true;

                document.removeEventListener('keydown', onKeyDown);
                overlay.classList.remove('calc-dialog-overlay--show');
                overlay.classList.add('calc-dialog-overlay--hide');

                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
                        try { previousActiveElement.focus(); } catch (e) {}
                    }
                    resolve(result);
                }, 220);
            };

            const onKeyDown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cleanup(false);
                } else if (e.key === 'Tab') {
                    const focusable = overlay.querySelectorAll('button');
                    if (focusable.length > 1) {
                        const first = focusable[0];
                        const last = focusable[focusable.length - 1];
                        if (e.shiftKey && document.activeElement === first) {
                            e.preventDefault();
                            last.focus();
                        } else if (!e.shiftKey && document.activeElement === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                }
            };
            document.addEventListener('keydown', onKeyDown);

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => cleanup(false));
            }
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => cleanup(true));
            }

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (card) {
                        card.classList.remove('calc-dialog-card--shake');
                        void card.offsetWidth;
                        card.classList.add('calc-dialog-card--shake');
                    }
                }
            });
        });
    }

    /**
     * Muestra una notificación Toast flotante con diseño de píldora translúcida.
     * @param {string} message - Texto a comunicar
     * @param {Object} options
     * @param {'info'|'success'|'warning'|'danger'} [options.type='info']
     * @param {number} [options.duration=2800]
     * @param {string} [options.icon]
     */
    static toast(message, { type = 'info', duration = 2800, icon = null } = {}) {
        if (!DialogService._toastContainer || !document.body.contains(DialogService._toastContainer)) {
            DialogService._toastContainer = document.createElement('div');
            DialogService._toastContainer.className = 'calc-toast-container';
            document.body.appendChild(DialogService._toastContainer);
        }

        const defaultIcons = {
            danger: 'fa-triangle-exclamation',
            warning: 'fa-circle-exclamation',
            info: 'fa-circle-info',
            success: 'fa-check'
        };
        const iconClass = icon || defaultIcons[type] || defaultIcons.info;

        const toastEl = document.createElement('div');
        toastEl.className = `calc-toast calc-toast--${type}`;
        toastEl.setAttribute('role', 'status');
        toastEl.innerHTML = `
            <span class="calc-toast-icon"><i class="fa-solid ${iconClass}"></i></span>
            <span class="calc-toast-message">${DialogService._escapeHTML(message)}</span>
        `;

        DialogService._toastContainer.appendChild(toastEl);

        void toastEl.offsetWidth;
        toastEl.classList.add('calc-toast--show');

        const dismiss = () => {
            if (toastEl.classList.contains('calc-toast--hiding')) return;
            toastEl.classList.add('calc-toast--hiding');
            toastEl.classList.remove('calc-toast--show');
            setTimeout(() => {
                if (toastEl.parentNode) {
                    toastEl.parentNode.removeChild(toastEl);
                }
            }, 250);
        };

        toastEl.addEventListener('click', dismiss);
        setTimeout(dismiss, duration);
    }
}
