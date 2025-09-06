// operations/utils/dom-helpers.js (VERSIÓN DEFINITIVA Y CORREGIDA PARA ALINEAMIENTO)
"use strict";

export const esperar = ms => new Promise(res => setTimeout(res, ms));

export function crearCelda(classNames, content, styles) {
    const celda = document.createElement('div');
    celda.className = classNames;
    celda.textContent = content;
    
    celda.style.position = "absolute"; 
    
    // Aplicar estilos pasados primero
    Object.assign(celda.style, styles);

    // LÓGICA DE AJUSTE CLAVE PARA ALINEAR EL TEXTO VISUALMENTE CON EL TOP DEL DIV
    if (classNames.includes("output-grid__cell") && styles.top && styles.height && styles.fontSize) {
        const cellHeight = parseFloat(styles.height); 
        const fontSize = parseFloat(styles.fontSize); 
        
        const verticalCenteringOffset = (cellHeight - fontSize) / 2;
        
        const currentTop = parseFloat(celda.style.top); 
        celda.style.top = `${currentTop - verticalCenteringOffset}px`;
    }
    
    return celda;
}

export function crearCeldaAnimada(classNames, content, styles, delay = 0) {
    const celda = crearCelda(classNames, content, styles); 
    celda.classList.add('animate-fade-in-scale');
    celda.style.animationDelay = `${delay}ms`;
    return celda;
}

export function crearFlechaLlevada(left, top, width, height) {
    const svgNS = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(svgNS, "svg");
    s.setAttribute("width", width);
    s.setAttribute("height", height);
    s.style.position = "absolute";
    s.style.left = `${left}px`;
    s.style.top = `${top}px`;
    s.style.overflow = "visible";

    const d = document.createElementNS(svgNS, "defs");
    const m = document.createElementNS(svgNS, "marker");
    const i = "arrowhead-" + Math.random().toString(36).substring(2, 9);
    m.setAttribute("id", i);
    m.setAttribute("viewBox", "0 0 10 10");
    m.setAttribute("refX", 8);
    m.setAttribute("refY", 5);
    m.setAttribute("markerWidth", 5);
    m.setAttribute("markerHeight", 5);
    m.setAttribute("orient", "auto-start-reverse");

    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    p.setAttribute("fill", "#ff5555");

    m.appendChild(p);
    d.appendChild(m);
    s.appendChild(d);

    const h = document.createElementNS(svgNS, "path");
    const x1 = width * 0.9, y1 = height, cx = width * 0.1, cy = height, x2 = width * 0.2, y2 = height * 0.15;
    h.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    h.setAttribute("stroke", "#ff5555");
    h.setAttribute("stroke-width", 2.5);
    h.setAttribute("stroke-linecap", "round");
    h.setAttribute("fill", "none");
    h.setAttribute("marker-end", `url(#${i})`);

    s.appendChild(h);

    const l = h.getTotalLength();
    h.style.strokeDasharray = l;
    h.style.strokeDashoffset = l;
    h.style.transition = "stroke-dashoffset .8s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
    requestAnimationFrame(() => {
        h.style.strokeDashoffset = "0";
    });

    return s;
}

export function crearMensajeError(message) {
    const errorMessageElement = document.createElement('p');
    errorMessageElement.className = 'output-screen__error-message'; 
    errorMessageElement.innerHTML = message; 
    
    errorMessageElement.style.position = 'absolute'; 
    errorMessageElement.style.width = '100%';
    errorMessageElement.style.height = '100%';
    errorMessageElement.style.display = 'flex';
    errorMessageElement.style.justifyContent = 'center';
    errorMessageElement.style.alignItems = 'center';
    
    return errorMessageElement;
}