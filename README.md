# La Calculadora de Facundo (V6)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2)

¡Bienvenido a **La Calculadora de Facundo V6**! Mucho más que una simple calculadora, es una herramienta educativa diseñada para desmitificar las matemáticas. Su principal característica es que no solo te da el resultado, sino que te **muestra visualmente y paso a paso** cómo se llega a él. Ideal para estudiantes, profesores y cualquier persona curiosa por entender el "porqué" detrás de las operaciones.

Este proyecto nació con la idea de hacer las matemáticas más accesibles e interactivas, transformando los cálculos abstractos en animaciones claras y fáciles de seguir.

## ✨ Galería de Funcionalidades

| Historial y Diseño Responsivo | Operaciones Detalladas | Funciones Avanzadas |
| :---: | :---: | :---: |
| ![Historial de operaciones](https://raw.githubusercontent.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/main/Img/Historial%20de%20operaciones.jpeg) | ![Suma con llevadas](https://raw.githubusercontent.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/main/Img/Suma%20proceso.jpeg) | ![Factores Primos](https://raw.githubusercontent.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/main/Img/Agrupar%20factores%20primos.jpeg) |
| **Historial Interactivo** | **Suma con Llevadas Visuales** | **Descomposición en Factores Primos** |
| <img src="https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V6/blob/main/Img/Vision%20movil%20responsiva.jpeg?raw=true" alt="Diseño móvil" width="250"> | ![Resta con llevadas](https://raw.githubusercontent.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/main/Img/Resta%20resuleta.jpeg) | ![Raíz Cuadrada](https://raw.githubusercontent.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/main/Img/Raiz%20cuadrada%20con%20numeros%20exactos%20solamente%2C%20por%20ahora...jpeg) |
| **Totalmente Responsivo** | **Resta con Préstamos Animados** | **Raíz Cuadrada (para cuadrados perfectos)** |
| ![Pantalla de inicio](https://raw.githubusercontent.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/main/Img/Inicio%20de%20calculadora.jpeg) | ![División paso a paso](https://raw.githubusercontent.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/main/Img/Division.jpeg) | ![Resultado final](https://raw.githubusercontent.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/main/Img/Suma%20fin%20y%20resultado%20interactivo.jpeg) |
| **Interfaz Limpia y Clara** | **División Larga Paso a Paso** | **Resultado Final Interactivo** |
| ![Modo Oscuro](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V6/blob/main/Img/Vistageneral.jpeg?raw=true) | ![Lector de Números](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V6/blob/main/Img/lectordenumeros.jpeg?raw=true) | ![Calculadora de Área y Perímetro](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V6/blob/main/Img/calculadoradeareayperimetro.jpeg?raw=true) |
| **Modo Oscuro** | **Lector de Números** | **Cálculo de Área y Perímetro** |

## 🚀 Funcionalidades Principales

-   **Visualización Paso a Paso:** La magia de la calculadora. Cada suma, resta, multiplicación o división se desglosa en el método tradicional que se enseña en la escuela, con animaciones que indican las "llevadas" o los "préstamos".
-   **Operaciones Soportadas:**
    -   Suma animada.
    -   Resta con llevadas (préstamos).
    -   Multiplicación con productos parciales.
    -   División larga visual.
-   **Funciones Avanzadas:**
    -   Descomposición en **factores primos**.
    -   Cálculo de **raíz cuadrada** para números exactos.
    -   Calculadora de **área y perímetro**.
-   **Interfaz y Accesibilidad:**
    -   **Modo Oscuro:** Para una mejor visualización en ambientes con poca luz.
    -   **Lector de Números:** Lee en voz alta los números y resultados para mejorar la accesibilidad.
    -   **Diseño Responsivo:** Funciona y se ve genial tanto en computadoras de escritorio como en dispositivos móviles.
-   **Historial de Operaciones:** Guarda todas tus operaciones para que puedas revisarlas más tarde.

## 🛠️ Estructura y Arquitectura del Proyecto

El proyecto está organizado en una estructura modular clara para facilitar el mantenimiento y la escalabilidad.

### Visión General de las Carpetas

-   `operations/` - **Módulo de Operaciones Matemáticas**
    -   Este es el corazón del proyecto, donde reside toda la lógica matemática. El archivo [`operations/index.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/operations/index.js#L1-L23) actúa como exportador central.
    -   `operations/modules/` - **Operaciones Específicas**
        -   [`division.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/operations/modules/division.js#L1-L6): Implementa división normal (`divide`) y extendida (`divideExt`) con visualización paso a paso.
        -   [`multiplication.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/operations/modules/multiplication.js#L1-L15): Realiza la multiplicación mostrando los productos parciales visuales.
        -   [`addition.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/operations/modules/addition.js#L107-L120): Ejecuta la suma con animaciones secuenciales para las llevadas.
        -   [`subtraction.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/operations/modules/subtraction.js#L1-L14): Gestiona la resta con efectos visuales animados para los préstamos.
        -   [`prime-factors.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/operations/modules/prime-factors.js#L1-L13): Contiene la lógica para la descomposición en factores primos.
        -   `square-root.js`: Realiza el cálculo de la raíz cuadrada.
    -   `operations/utils/` - **Utilidades de Soporte**
        -   [`dom-helpers.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/operations/utils/dom-helpers.js#L21-L37): Funciones para crear elementos visuales en el DOM (`crearCelda`, `crearCeldaAnimada`, `crearFlechaLlevada`).
        -   `layout-calculator.js`: Sistema para calcular el posicionamiento de los elementos en la grilla de operaciones.
        -   `parsers.js`: Utilidades para procesar la entrada numérica.

-   **Archivos Raíz del Proyecto**
    -   [`main.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/main.js#L1-L29): Es el orquestador principal de la aplicación. Maneja los eventos del usuario y coordina la ejecución de los módulos de operaciones.
    -   [`history.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/history.js#L51-L62): Implementa el sistema de historial a través de `HistoryManager` y `HistoryPanel`.
    -   `config.js`: Centraliza las referencias a elementos del DOM y los mensajes de error.
    -   `index.html`: La estructura principal de la página web.
    -   `style.css`: Contiene todos los estilos para la interfaz y el diseño responsivo.

### Patrón de Arquitectura

El sistema utiliza un **patrón de exportación centralizada**. El archivo [`operations/index.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/operations/index.js#L12-L23) re-exporta todas las funciones matemáticas de los submódulos. Esto permite importaciones mucho más limpias y organizadas en el archivo principal [`main.js`](https://github.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2/blob/main/main.js#L7-L10), mejorando la legibilidad y el mantenimiento del código.

## 💬 ¿Tienes Dudas? ¡Pregunta a la Comunidad!

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/HectorDanielAyarachiFuentes/Calculadora-Facundo-V2)

Este proyecto utiliza **DeepWiki** para crear una base de conocimiento colaborativa. Si tienes alguna pregunta sobre el código, una funcionalidad, una idea para mejorar o quieres saber cómo contribuir, ¡haz clic en el badge! Podrás ver las preguntas de otros y dejar la tuya para que la comunidad o los mantenedores del proyecto te ayuden. ¡Es la mejor forma de resolver dudas sobre nuestro trabajo!