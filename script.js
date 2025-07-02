// --- 1. Variables Globales y Referencias a Elementos del HTML ---
const contenedorBarras = document.getElementById('contenedor-barras');
const btnOrdenar = document.getElementById('btn-ordenar');
const btnReiniciar = document.getElementById('btn-reiniciar');
const numBarrasInput = document.getElementById('num-barras'); // Nuevo: input para cantidad de barras
const velocidadSlider = document.getElementById('velocidad');   // Nuevo: deslizador de velocidad
const velocidadValorSpan = document.getElementById('velocidad-valor'); // Nuevo: para mostrar el valor de velocidad
const mensajeEstadoDiv = document.getElementById('mensaje-estado'); // Nuevo: para mostrar mensajes al usuario

let arrayOriginal = [];
let arrayActual = [];
let velocidadAnimacion = parseInt(velocidadSlider.value); // Obtener valor inicial del slider

// --- 2. Funciones de Ayuda ---

// Función para pausar la ejecución (controla la velocidad de la animación)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para mostrar mensajes al usuario
function mostrarMensaje(texto, tipo = 'info') {
    mensajeEstadoDiv.textContent = texto;
    // Opcional: añadir clases para diferentes estilos de mensaje (ej. éxito, error)
    // mensajeEstadoDiv.className = `mensaje ${tipo}`; 
}

// Función para deshabilitar/habilitar botones
function setBotonesEstado(deshabilitar) {
    btnOrdenar.disabled = deshabilitar;
    btnReiniciar.disabled = deshabilitar;
    numBarrasInput.disabled = deshabilitar;
    velocidadSlider.disabled = deshabilitar;
}

// --- 3. Generar Números Aleatorios y Dibujar las Barras ---
function generarBarras() {
    setBotonesEstado(false); // Asegúrate de que los botones estén habilitados al reiniciar
    mostrarMensaje(''); // Borra cualquier mensaje anterior

    const cantidad = parseInt(numBarrasInput.value); // Obtener cantidad del input

    // Validar cantidad de barras
    if (isNaN(cantidad) || cantidad < parseInt(numBarrasInput.min) || cantidad > parseInt(numBarrasInput.max)) {
        mostrarMensaje(`Por favor, introduce un número de barras entre ${numBarrasInput.min} y ${numBarrasInput.max}.`, 'error');
        numBarrasInput.value = arrayActual.length || 10; // Restaura al valor anterior o 10
        return; 
    }

    contenedorBarras.innerHTML = '';
    arrayOriginal = [];
    for (let i = 0; i < cantidad; i++) {
        let valor = Math.floor(Math.random() * (300 - 10 + 1)) + 10; // Valores entre 10 y 300
        arrayOriginal.push(valor);
    }
    arrayActual = [...arrayOriginal]; // Usar spread operator para copiar el array
    dibujarBarras(arrayActual);
}

// Función para dibujar o actualizar las barras en la pantalla
function dibujarBarras(arr, indicesComparando = [], indicesIntercambiando = [], indicesOrdenados = []) {
    contenedorBarras.innerHTML = '';
    const maxVal = Math.max(...arr); // Para normalizar la altura de las barras si cambian los valores
    arr.forEach((valor, indice) => {
        const barra = document.createElement('div');
        barra.classList.add('barra');
        // Escalar la altura para que ocupe el 100% del contenedor si es necesario
        // Pero mantenemos fijo el max 300px como antes para consistencia visual
        barra.style.height = `${valor}px`; 

        // Añade clases CSS para cambiar colores
        if (indicesComparando.includes(indice)) {
            barra.classList.add('comparando');
        } else if (indicesIntercambiando.includes(indice)) { // Usamos else if para priorizar colores
            barra.classList.add('intercambiando');
        } else if (indicesOrdenados.includes(indice)) {
            barra.classList.add('ordenado');
        }
        // Si no está en ningún estado especial, se usa el color por defecto (CSS)

        const textoNumero = document.createElement('span');
        // Validar si el número es demasiado pequeño para mostrar el texto (UX)
        if (valor > 20) { // Solo muestra el número si la barra es lo suficientemente alta
            textoNumero.textContent = valor;
        } else {
            textoNumero.textContent = ''; // O no mostrar nada si es muy pequeña
        }
        
        barra.appendChild(textoNumero);
        contenedorBarras.appendChild(barra);
    });
}

// --- 4. El Algoritmo de Ordenamiento de Burbuja (con animaciones) ---
async function bubbleSort(arr) {
    let n = arr.length;
    let ordenado = false; // Flag para optimización

    mostrarMensaje('Ordenando burbujas...');
    setBotonesEstado(true); // Deshabilita los botones durante la ordenación

    for (let i = 0; i < n - 1 && !ordenado; i++) {
        ordenado = true; // Asume que esta pasada dejará todo ordenado
        for (let j = 0; j < n - 1 - i; j++) {
            // Paso 1: Comparando
            dibujarBarras(arr, [j, j + 1], [], getIndicesOrdenados(n, i)); // Mantener los ya ordenados verdes
            await sleep(velocidadAnimacion);

            if (arr[j] > arr[j + 1]) {
                // Paso 2: Intercambiando
                dibujarBarras(arr, [], [j, j + 1], getIndicesOrdenados(n, i));
                await sleep(velocidadAnimacion);

                // Realizar el intercambio
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                ordenado = false; // Hubo un intercambio, no está totalmente ordenado aún
            }
            // Paso 3: Después de la comparación/intercambio, volver al estado normal (sin comparar/intercambiar)
            // Esto es crucial para que el color de "comparando" o "intercambiando" no persista
            dibujarBarras(arr, [], [], getIndicesOrdenados(n, i));
            await sleep(velocidadAnimacion / 2); // Un pequeño delay después de cada paso
        }
        // Después de cada pasada exterior, la última 'i+1' elementos están ordenados
        // No es necesario llamar dibujarBarras aquí de nuevo si ya lo hace getIndicesOrdenados
    }
    // Finalización: Marcar todo como ordenado
    dibujarBarras(arr, [], [], Array.from({length: n}, (_, k) => k));
    mostrarMensaje("¡Ordenamiento Completado!");
    setBotonesEstado(false); // Habilita los botones de nuevo
}

// Función auxiliar para obtener los índices de las barras ya ordenadas
function getIndicesOrdenados(n, pasadaActual) {
    const indices = [];
    for (let k = 0; k < pasadaActual + 1; k++) {
        indices.push(n - 1 - k);
    }
    return indices;
}


// --- 5. Conectar Eventos (¡La Interacción del Usuario!) ---

// Botón Ordenar
btnOrdenar.addEventListener('click', async () => {
    // Validar que haya barras para ordenar
    if (arrayActual.length === 0) {
        mostrarMensaje('¡Genera las barras primero haciendo clic en Reiniciar!', 'info');
        return;
    }
    await bubbleSort(arrayActual);
});

// Botón Reiniciar
btnReiniciar.addEventListener('click', () => {
    generarBarras();
});

// Deslizador de Velocidad
velocidadSlider.addEventListener('input', () => {
    velocidadAnimacion = parseInt(velocidadSlider.value);
    velocidadValorSpan.textContent = `${velocidadAnimacion}ms`;
});

// Input de Cantidad de Barras
numBarrasInput.addEventListener('change', () => { // Usar 'change' para reaccionar al soltar el foco
    generarBarras(); // Regenerar barras con la nueva cantidad
});


// --- 6. Iniciar el Visualizador al cargar la página ---
generarBarras();