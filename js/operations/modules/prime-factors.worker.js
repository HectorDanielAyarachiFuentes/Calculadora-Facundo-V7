// =======================================================
// --- js/workers/prime-factors.worker.js ---
// Este script se ejecuta en un hilo separado (Worker).
// Su única responsabilidad es calcular los factores primos.
// =======================================================
"use strict";

/**
 * Factoriza un número en sus factores primos de manera optimizada.
 * @param {number} n - El número a factorizar.
 * @returns {number[]} - Array de factores primos.
 */
function factorizarPrimos(n) {
    const factores = [];
    while (n % 2 === 0) {
        factores.push(2);
        n /= 2;
    }
    for (let i = 3; i * i <= n; i += 2) {
        while (n % i === 0) {
            factores.push(i);
            n /= i;
        }
    }
    if (n > 2) {
        factores.push(n);
    }
    return factores;
}

// 1. Escucha los mensajes que le envía el hilo principal.
self.onmessage = function(event) {
    const numero = event.data;
    if (typeof numero !== 'number' || isNaN(numero)) {
        self.postMessage({ error: 'Entrada inválida. Se esperaba un número.' });
        return;
    }

    // 2. Realiza el cálculo pesado y envía el resultado de vuelta.
    self.postMessage({ factores: factorizarPrimos(numero) });
};

// Export vacío para que sea un módulo válido
export {};
