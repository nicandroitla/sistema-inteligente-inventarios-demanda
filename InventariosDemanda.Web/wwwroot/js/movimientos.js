// ========================================
        // CONFIGURACIÓN
        // ========================================

        const apiProductos = "/api-proxy/productos";
        const apiMovimientos = "/api-proxy/movimientos";

        const formulario =
            document.getElementById("formularioMovimiento");

        const botonGuardar =
            document.getElementById("botonGuardar");

        const botonActualizar =
            document.getElementById("botonActualizar");

        let csrfToken = null;
        let registrando = false;
        let eliminando = false;
        let cargando = false;

        // ========================================
        // TOKEN CSRF
        // ========================================

        async function obtenerCsrfToken() {
            if (csrfToken) {
                return csrfToken;
            }

            const respuesta = await fetch(
                "/api-proxy/csrf-token",
                {
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

            if (respuesta.status === 401) {
                throw new Error(
                    "Tu sesión ha expirado. Inicia sesión nuevamente."
                );
            }

            if (!respuesta.ok) {
                throw new Error(
                    "No fue posible obtener el token de seguridad."
                );
            }

            const datos = await respuesta.json();

            if (!datos.token) {
                throw new Error(
                    "El servidor no devolvió un token de seguridad."
                );
            }

            csrfToken = datos.token;

            return csrfToken;
        }

        // ========================================
        // MENSAJES
        // ========================================

        function mostrarMensaje(texto, tipo) {
            const mensaje = document.getElementById("mensaje");

            mensaje.textContent = texto;
            mensaje.className = `alert alert-${tipo}`;
        }

        function ocultarMensaje() {
            const mensaje = document.getElementById("mensaje");

            mensaje.textContent = "";
            mensaje.className = "alert d-none";
        }

        // ========================================
        // LEER RESPUESTA
        // ========================================

        async function leerRespuesta(respuesta) {
            const texto = await respuesta.text();

            let datos = {};

            try {
                datos = texto ? JSON.parse(texto) : {};
            } catch {
                datos = {};
            }

            if (!respuesta.ok) {
                if (respuesta.status === 401) {
                    throw new Error(
                        "Tu sesión ha expirado. Inicia sesión nuevamente."
                    );
                }

                if (respuesta.status === 403) {
                    throw new Error(
                        "No tienes autorización para realizar esta operación."
                    );
                }

                if (respuesta.status === 400 &&
                    (datos.mensaje || "").includes("Token de seguridad")) {
                    csrfToken = null;
                }

                throw new Error(
                    datos.mensaje ||
                    datos.message ||
                    datos.detail ||
                    datos.title ||
                    `Error HTTP ${respuesta.status}.`
                );
            }

            return datos;
        }

        // ========================================
        // CARGAR PRODUCTOS
        // ========================================

        async function cargarProductos() {
            const respuesta = await fetch(apiProductos, {
                credentials: "same-origin",
                cache: "no-store"
            });

            const resultado = await leerRespuesta(respuesta);

            const productos = Array.isArray(resultado)
                ? resultado
                : Array.isArray(resultado.value)
                    ? resultado.value
                    : [];

            const selector = document.getElementById("productoId");

            const seleccionAnterior = selector.value;

            selector.replaceChildren();

            const inicial = document.createElement("option");
            inicial.value = "";
            inicial.textContent = "Selecciona un producto";

            selector.appendChild(inicial);

            productos.forEach(producto => {
                const opcion = document.createElement("option");

                opcion.value = producto.id;
                opcion.textContent =
                    `${producto.nombre} — Stock: ${producto.stockActual}`;

                selector.appendChild(opcion);
            });

            if (productos.some(p =>
                String(p.id) === seleccionAnterior)) {
                selector.value = seleccionAnterior;
            }

            document.getElementById(
                "totalProductos"
            ).textContent = productos.length;
        }

        // ========================================
        // CARGAR MOVIMIENTOS
        // ========================================

        let movimientosCatalogo = [];
let historialCargado = false;

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function obtenerNombreProducto(movimiento) {
    return movimiento.producto?.nombre ??
        `Producto ${movimiento.productoId}`;
}

function obtenerTipoMovimiento(movimiento) {
    return String(movimiento.tipo ?? "")
        .trim()
        .toUpperCase();
}

function formatearNumero(valor) {
    return Number(valor).toLocaleString("es-DO");
}

function obtenerFechaLocal(valor) {
    if (!valor) {
        return "";
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return "";
    }

    const anio = fecha.getFullYear();

    const mes = String(
        fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        fecha.getDate()
    ).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function actualizarIndicadores() {
    let entradas = 0;
    let salidas = 0;

    movimientosCatalogo.forEach(movimiento => {
        const tipo = obtenerTipoMovimiento(movimiento);
        const cantidad = Number(movimiento.cantidad ?? 0);

        if (tipo === "ENTRADA") {
            entradas += cantidad;
        }

        if (tipo === "SALIDA") {
            salidas += cantidad;
        }
    });

    const balance = entradas - salidas;

    document.getElementById("totalMovimientos").textContent =
        formatearNumero(movimientosCatalogo.length);

    document.getElementById("totalEntradas").textContent =
        formatearNumero(entradas);

    document.getElementById("totalSalidas").textContent =
        formatearNumero(salidas);

    const indicadorBalance =
        document.getElementById("balanceNeto");

    indicadorBalance.textContent =
        `${balance > 0 ? "+" : ""}${formatearNumero(balance)}`;

    indicadorBalance.style.color =
        balance < 0
            ? "#dc2626"
            : balance > 0
                ? "#16a34a"
                : "#64748b";
}

function mostrarTablaVacia(texto) {
    const tabla =
        document.getElementById("tablaMovimientos");

    tabla.replaceChildren();

    const fila = tabla.insertRow();
    const celda = fila.insertCell();

    celda.colSpan = 7;
    celda.className = "mv-empty-message";
    celda.textContent = texto;
}

function agregarCelda(fila, texto, clase = "") {
    const celda = fila.insertCell();

    celda.textContent = texto ?? "";

    if (clase) {
        celda.className = clase;
    }

    return celda;
}

function renderizarMovimientos(movimientos) {
    const tabla =
        document.getElementById("tablaMovimientos");

    tabla.replaceChildren();

    if (movimientos.length === 0) {
        mostrarTablaVacia(
            movimientosCatalogo.length === 0
                ? "No hay movimientos registrados."
                : "No se encontraron movimientos con estos filtros."
        );

        return;
    }

    movimientos.forEach(movimiento => {
        const fila = tabla.insertRow();

        const tipo =
            obtenerTipoMovimiento(movimiento);

        const entrada = tipo === "ENTRADA";
        const salida = tipo === "SALIDA";

        agregarCelda(fila, movimiento.id);

        const fecha = movimiento.fecha
            ? new Date(movimiento.fecha)
            : null;

        agregarCelda(
            fila,
            fecha && !Number.isNaN(fecha.getTime())
                ? fecha.toLocaleString("es-DO")
                : "Sin fecha",
            "mv-fecha"
        );

        const celdaProducto = fila.insertCell();

        const nombre = document.createElement("strong");

        nombre.textContent =
            obtenerNombreProducto(movimiento);

        celdaProducto.appendChild(nombre);

        const celdaTipo = fila.insertCell();

        const etiqueta = document.createElement("span");

        etiqueta.className = entrada
            ? "mv-status mv-entrada"
            : salida
                ? "mv-status mv-salida"
                : "mv-status";

        etiqueta.textContent = entrada
            ? "Entrada"
            : salida
                ? "Salida"
                : tipo || "Desconocido";

        celdaTipo.appendChild(etiqueta);

        const cantidad =
            Number(movimiento.cantidad ?? 0);

        const signo = entrada
            ? "+"
            : salida
                ? "-"
                : "";

        agregarCelda(
            fila,
            `${signo}${formatearNumero(cantidad)}`,
            entrada
                ? "mv-cantidad mv-positivo"
                : salida
                    ? "mv-cantidad mv-negativo"
                    : "mv-cantidad"
        );

        agregarCelda(
            fila,
            movimiento.descripcion || "Sin descripcion",
            "mv-descripcion"
        );

        const acciones = fila.insertCell();

        acciones.className = "text-end";

        const btnEliminar =
            document.createElement("button");

        btnEliminar.type = "button";

        btnEliminar.className =
            "btn btn-outline-danger btn-sm";

        btnEliminar.textContent = "Eliminar";

        btnEliminar.addEventListener("click", () => {
            eliminarMovimiento(
                movimiento.id,
                btnEliminar
            );
        });

        acciones.appendChild(btnEliminar);
    });
}

function aplicarFiltros() {
    if (!historialCargado) {
        return;
    }

    const busqueda = normalizarTexto(
        document.getElementById("buscarMovimiento").value
    );

    const tipo =
        document.getElementById("filtroTipo").value;

    const desde =
        document.getElementById("fechaDesde").value;

    const hasta =
        document.getElementById("fechaHasta").value;

    const mensajeFiltros =
        document.getElementById("mensajeFiltros");

    const contador =
        document.getElementById("contadorMovimientos");

    mensajeFiltros.textContent = "";

    if (desde && hasta && desde > hasta) {
        mensajeFiltros.textContent =
            "La fecha inicial no puede superar la fecha final.";

        contador.textContent = "Rango de fechas incorrecto";

        mostrarTablaVacia(
            "Corrige el rango de fechas para consultar el historial."
        );

        return;
    }

    const filtrados = movimientosCatalogo.filter(movimiento => {
        const nombre = normalizarTexto(
            obtenerNombreProducto(movimiento)
        );

        const fecha =
            obtenerFechaLocal(movimiento.fecha);

        const coincideProducto =
            nombre.includes(busqueda);

        const coincideTipo =
            !tipo ||
            obtenerTipoMovimiento(movimiento) === tipo;

        const coincideDesde =
            !desde || (fecha && fecha >= desde);

        const coincideHasta =
            !hasta || (fecha && fecha <= hasta);

        return coincideProducto &&
            coincideTipo &&
            coincideDesde &&
            coincideHasta;
    });

    contador.textContent =
        `Mostrando ${filtrados.length} de ${movimientosCatalogo.length} movimientos`;

    renderizarMovimientos(filtrados);
}

function limpiarFiltros() {
    [
        "buscarMovimiento",
        "filtroTipo",
        "fechaDesde",
        "fechaHasta"
    ].forEach(id => {
        document.getElementById(id).value = "";
    });

    document.getElementById(
        "mensajeFiltros"
    ).textContent = "";

    aplicarFiltros();
}

async function cargarMovimientos() {
    historialCargado = false;

    try {
        const respuesta = await fetch(apiMovimientos, {
            credentials: "same-origin",
            cache: "no-store"
        });

        const resultado =
            await leerRespuesta(respuesta);

        if (Array.isArray(resultado)) {
            movimientosCatalogo = resultado;
        } else if (Array.isArray(resultado?.value)) {
            movimientosCatalogo = resultado.value;
        } else {
            throw new Error(
                "Respuesta de movimientos no valida."
            );
        }

        movimientosCatalogo.sort((a, b) => {
            const fechaA =
                new Date(a.fecha).getTime() || 0;

            const fechaB =
                new Date(b.fecha).getTime() || 0;

            return fechaB - fechaA ||
                Number(b.id) - Number(a.id);
        });

        actualizarIndicadores();

        historialCargado = true;

        aplicarFiltros();

    } catch (error) {
        movimientosCatalogo = [];
        historialCargado = false;

        [
            "totalMovimientos",
            "totalEntradas",
            "totalSalidas",
            "balanceNeto"
        ].forEach(id => {
            document.getElementById(id).textContent = "—";
        });

        document.getElementById(
            "contadorMovimientos"
        ).textContent = "Historial no disponible";

        mostrarTablaVacia(
            "No fue posible cargar los movimientos."
        );

        throw error;
    }
}


async function cargarDatos() {
            if (cargando) {
                return;
            }

            cargando = true;
            botonActualizar.disabled = true;

            try {
                await Promise.all([
                    cargarProductos(),
                    cargarMovimientos()
                ]);
            } catch (error) {
                mostrarMensaje(error.message, "danger");
            } finally {
                cargando = false;
                botonActualizar.disabled = false;
            }
        }

        // ========================================
        // ELIMINAR MOVIMIENTO
        // ========================================

        async function eliminarMovimiento(id, boton) {
            if (eliminando || registrando) {
                return;
            }

            if (!confirm(
                `¿Eliminar el movimiento #${id}? Esta acción revertirá su efecto sobre el stock.`
            )) {
                return;
            }

            eliminando = true;
            ocultarMensaje();

            boton.disabled = true;
            boton.textContent = "Eliminando...";

            try {
                const token = await obtenerCsrfToken();

                const respuesta = await fetch(
                    `${apiMovimientos}/${id}`,
                    {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "X-CSRF-TOKEN": token
                        }
                    }
                );

                const resultado = await leerRespuesta(respuesta);

                await cargarDatos();

                mostrarMensaje(
                    resultado.mensaje ||
                    "Movimiento eliminado correctamente.",
                    "success"
                );

            } catch (error) {
                mostrarMensaje(error.message, "danger");
                boton.disabled = false;
                boton.textContent = "Eliminar";

            } finally {
                eliminando = false;
            }
        }

        // ========================================
        // REGISTRAR ENTRADA O SALIDA
        // ========================================

        formulario.addEventListener("submit", async evento => {
            evento.preventDefault();

            if (registrando || eliminando) {
                return;
            }

            ocultarMensaje();

            const cantidad = Number(
                document.getElementById("cantidad").value
            );

            const productoId = Number(
                document.getElementById("productoId").value
            );

            const tipo =
                document.getElementById("tipo").value;

            if (
                !Number.isInteger(cantidad) ||
                cantidad <= 0 ||
                !Number.isInteger(productoId) ||
                productoId <= 0
            ) {
                mostrarMensaje(
                    "Selecciona un producto e introduce una cantidad válida.",
                    "warning"
                );
                return;
            }

            if (tipo !== "ENTRADA" && tipo !== "SALIDA") {
                mostrarMensaje(
                    "Selecciona un tipo de movimiento válido.",
                    "warning"
                );
                return;
            }

            const datos = {
                productoId,
                tipo,
                cantidad,
                descripcion:
                    document.getElementById("descripcion").value.trim()
            };

            registrando = true;
            botonGuardar.disabled = true;
            botonGuardar.textContent = "Registrando...";

            try {
                const token = await obtenerCsrfToken();

                const respuesta = await fetch(
                    apiMovimientos,
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": token
                        },
                        body: JSON.stringify(datos)
                    }
                );

                await leerRespuesta(respuesta);

                formulario.reset();

                await cargarDatos();

                mostrarMensaje(
                    "Movimiento registrado correctamente.",
                    "success"
                );

            } catch (error) {
                mostrarMensaje(error.message, "danger");

            } finally {
                registrando = false;
                botonGuardar.disabled = false;
                botonGuardar.textContent = "Registrar movimiento";
            }
        });

        // ========================================
        // INICIALIZAR PÁGINA
        // ========================================

        document.getElementById("buscarMovimiento")
    .addEventListener("input", aplicarFiltros);

document.getElementById("filtroTipo")
    .addEventListener("change", aplicarFiltros);

document.getElementById("fechaDesde")
    .addEventListener("change", aplicarFiltros);

document.getElementById("fechaHasta")
    .addEventListener("change", aplicarFiltros);

document.getElementById("btnLimpiarFiltros")
    .addEventListener("click", limpiarFiltros);

cargarDatos();
