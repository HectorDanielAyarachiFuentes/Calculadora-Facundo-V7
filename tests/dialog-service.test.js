import { DialogService } from '../js/modal/native-ui.js';

describe('DialogService', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        DialogService._toastContainer = null;
    });

    test('confirm should render modal and resolve true when clicking confirm button', async () => {
        const confirmPromise = DialogService.confirm({
            title: '¿Borrar historial?',
            message: 'Acción irreversible',
            confirmText: 'Sí, borrar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        const overlay = document.querySelector('.calc-dialog-overlay');
        expect(overlay).not.toBeNull();
        expect(overlay.querySelector('.calc-dialog-title').textContent).toBe('¿Borrar historial?');
        expect(overlay.querySelector('.calc-dialog-card--danger')).not.toBeNull();

        const confirmBtn = overlay.querySelector('.calc-dialog-btn--confirm');
        confirmBtn.click();

        const result = await confirmPromise;
        expect(result).toBe(true);
        expect(document.querySelector('.calc-dialog-overlay')).toBeNull();
    });

    test('confirm should resolve false when clicking cancel button', async () => {
        const confirmPromise = DialogService.confirm({
            title: '¿Restaurar botones?',
            message: 'Volver a posiciones iniciales',
            type: 'warning'
        });

        const overlay = document.querySelector('.calc-dialog-overlay');
        const cancelBtn = overlay.querySelector('.calc-dialog-btn--cancel');
        cancelBtn.click();

        const result = await confirmPromise;
        expect(result).toBe(false);
        expect(document.querySelector('.calc-dialog-overlay')).toBeNull();
    });

    test('alert should render informative modal with single action button and clean up on dismiss', async () => {
        const alertPromise = DialogService.alert({
            title: 'Operación duplicada',
            message: 'Ya existe en el historial',
            confirmText: 'Entendido',
            type: 'info'
        });

        const overlay = document.querySelector('.calc-dialog-overlay');
        expect(overlay.querySelector('.calc-dialog-btn--cancel')).toBeNull();
        const confirmBtn = overlay.querySelector('.calc-dialog-btn--confirm');
        confirmBtn.click();

        await alertPromise;
        expect(document.querySelector('.calc-dialog-overlay')).toBeNull();
    });

    test('toast should create toast notification pill with correct class and message', () => {
        DialogService.toast('Operación copiada', { type: 'success' });

        const container = document.querySelector('.calc-toast-container');
        expect(container).not.toBeNull();

        const toast = container.querySelector('.calc-toast--success');
        expect(toast).not.toBeNull();
        expect(toast.textContent).toContain('Operación copiada');
    });
});
