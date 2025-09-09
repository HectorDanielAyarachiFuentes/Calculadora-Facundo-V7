# Historial de Cambios (Changelog)

Este archivo documenta los cambios más importantes realizados en el proyecto.

---

## 2024-05-21: Mejora del Layout en Escritorio

### 🐛 Corrección de Errores

*   **Footer no visible en la versión de escritorio**: Se ha solucionado un problema de layout que causaba que el pie de página (footer) no fuera visible en pantallas de escritorio con alturas reducidas.
    *   **Causa del problema**: El `body` de la página utilizaba `justify-content: center` junto con `overflow: hidden`, lo que provocaba que si el contenido total (calculadora + footer) era más alto que la ventana del navegador, el footer se recortaba y quedaba inaccesible.
    *   **Solución implementada**:
        1.  Se eliminó la propiedad `justify-content: center` del `body` para permitir que el contenido se distribuya de forma natural en el eje vertical.
        2.  Se modificó el contenedor principal (`#contenedor`) para que ocupe el espacio vertical disponible (`flex-grow: 1`).
        3.  El centrado vertical de la calculadora ahora se gestiona dentro de este contenedor principal, asegurando que la calculadora permanezca centrada mientras el footer se mantiene siempre visible en la parte inferior de la página.

Este cambio mejora la robustez del diseño en diferentes resoluciones de escritorio sin afectar la vista móvil.