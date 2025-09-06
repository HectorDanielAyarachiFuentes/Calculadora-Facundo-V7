# Registro de Cambios - Calculadora Facundo v-7

## Cambios realizados

### Reorganización de Archivos
- Se movieron todos los archivos JavaScript a una carpeta centralizada llamada `js`.
- La carpeta `operations` fue movida dentro de `js` para mantener una estructura organizada.
- Se actualizaron las rutas de los scripts en `index.html` para reflejar la nueva estructura.

### Manejo Centralizado de Errores
- Se creó el módulo `error-handler-centralized.js` para un manejo unificado y consistente de errores.
- Se implementaron métodos para validar operaciones, multiplicación, división, factores primos y raíz cuadrada.
- Se actualizaron los módulos de operaciones para usar el nuevo manejador de errores centralizado.

### Correcciones y Mejoras en Operaciones Matemáticas
- **Multiplicación:**
  - Se corrigió un espacio incorrecto en la visualización que afectaba la experiencia de usuario.
  - Se ajustó la altura del layout para eliminar espacio extra debajo de la multiplicación.
- **División:**
  - Se mejoró la visualización y cálculo de la división larga y corta, incluyendo manejo de decimales.
- **Factores Primos:**
  - Se optimizó la función de factorización y se mejoró la visualización.
  - Se ajustó la validación para aceptar parámetros opcionales.
- **Raíz Cuadrada:**
  - Se mejoró la visualización paso a paso con animaciones y manejo correcto de decimales.
  - Se ajustó la validación para aceptar parámetros opcionales.

### Actualizaciones en `main.js`
- Se actualizó la importación para usar el manejador de errores centralizado.
- Se mejoró la función `reExecuteOperationFromHistory` para validar correctamente antes de ejecutar operaciones avanzadas.
- Se centralizó la gestión de eventos y animaciones para mejorar la experiencia de usuario.

---

Este registro documenta los cambios principales realizados para mejorar la funcionalidad, organización y experiencia de usuario de la calculadora.

