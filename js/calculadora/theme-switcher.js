// =======================================================
// --- theme-switcher.js ---
// Maneja el cambio entre tema claro y oscuro
// =======================================================
"use strict";

/**
 * Clase para gestionar el cambio de tema (claro/oscuro)
 */
export class ThemeSwitcher {
    constructor() {
        this.themeKey = 'calculadora-facundo-theme';
        this.defaultTheme = 'dark';
        this.initTheme();
    }
    
    /**
     * Inicializa el tema basado en la preferencia guardada o el tema por defecto
     */
    initTheme() {
        // Cargar tema guardado o usar el predeterminado
        const savedTheme = localStorage.getItem(this.themeKey) || this.defaultTheme;
        this.setTheme(savedTheme);
        
        // Configurar el botón de cambio de tema existente
        this.setupThemeToggle();
    }
    
    /**
     * Establece el tema especificado
     * @param {string} theme - 'light' o 'dark'
     */
    setTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem(this.themeKey, theme);
    }
    
    /**
     * Alterna entre tema claro y oscuro
     */
    toggleTheme() {
        const currentTheme = localStorage.getItem(this.themeKey) || this.defaultTheme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.updateToggleButton(newTheme);
    }
    
    /**
     * Configura el botón existente para cambiar de tema
     */
    setupThemeToggle() {
        // Obtener el botón de cambio de tema existente
        const themeToggle = document.getElementById('theme-toggle-btn');
        if (!themeToggle) return;
        
        // Establecer el icono inicial según el tema actual
        const currentTheme = localStorage.getItem(this.themeKey) || this.defaultTheme;
        this.updateToggleButton(currentTheme, themeToggle);
        
        // Añadir evento de clic para cambiar el tema
        themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    /**
     * Actualiza el icono del botón según el tema actual
     * @param {string} theme - El tema actual ('light' o 'dark')
     * @param {HTMLElement} button - El botón a actualizar (opcional)
     */
    updateToggleButton(theme, button = null) {
        const themeToggle = button || document.getElementById('theme-toggle-btn');
        if (!themeToggle) return;
        
        // Cambiar el icono según el tema
        themeToggle.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-sun"></i>' // Icono de sol para tema oscuro (cambiar a claro)
            : '<i class="fas fa-moon"></i>'; // Icono de luna para tema claro (cambiar a oscuro)
    }
}