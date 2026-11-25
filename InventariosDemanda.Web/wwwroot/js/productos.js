// ========================================
        // CONFIGURACIÓN
        // ========================================

        const API_URL = "/api-proxy/productos";

        let csrfToken = null;
        let guardando = false;
        let eliminando = false;

        // ========================================
        // OBTENER TOKEN CSRF
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
        // MOSTRAR MENSAJES
        // ========================================

        function mostrarMensaje(texto, tipo) {
            const contenedor =
                document.getElementById("mensaje");

            contenedor.replaceChildren();

            const alerta = document.createElement("div");
            alerta.className = `alert alert-${tipo}`;
            alerta.textContent = texto;

            contenedor.appendChild(alerta);
        }

        // ========================================
        // LEER RESPUESTA DE LA API
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

        let productosCatalogo = [];
let catalogoCargado = false;

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function obtenerEstado(producto) {
    const actual = Number(producto.stockActual ?? 0);
    const minimo = Number(producto.stockMinimo ?? 0);
    const maximo = Number(producto.stockMaximo ?? 0);

    if (actual <= 0) {
        return {
            codigo: "agotado",
            texto: "Agotado",
            clase: "pr-empty",
            color: "#dc2626"
        };
    }

    if (actual <= minimo) {
        return {
            codigo: "bajo",
            texto: "Stock bajo",
            clase: "pr-low",
            color: "#d97706"
        };
    }

    if (actual > maximo) {
        return {
            codigo: "exceso",
            texto: "Exceso de stock",
            clase: "pr-excess",
            color: "#7c3aed"
        };
    }

    return {
        codigo: "normal",
        texto: "Stock suficiente",
        clase: "pr-normal",
        color: "#16a34a"
    };
}

function actualizarIndicadores() {
    const estados = productosCatalogo.map(
        p => obtenerEstado(p).codigo
    );

    document.getElementById("prTotal").textContent =
        productosCatalogo.length;

    document.getElementById("prDisponibles").textContent =
        estados.filter(e => e === "normal").length;

    document.getElementById("prStockBajo").textContent =
        estados.filter(e => e === "bajo").length;

    document.getElementById("prAgotados").textContent =
        estados.filter(e => e === "agotado").length;
}

function actualizarCategorias() {
    const selector =
        document.getElementById("filtroCategoria");

    const seleccionAnterior = selector.value;

    const categorias = new Map();

    productosCatalogo.forEach(producto => {
        const nombre = String(
            producto.categoria ?? ""
        ).trim();

        const clave = normalizarTexto(nombre);

        if (clave && !categorias.has(clave)) {
            categorias.set(clave, nombre);
        }
    });

    selector.replaceChildren();

    selector.add(
        new Option("Todas las categorias", "")
    );

    [...categorias.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "es"))
        .forEach(([clave, nombre]) => {
            selector.add(new Option(nombre, clave));
        });

    selector.value = categorias.has(seleccionAnterior)
        ? seleccionAnterior
        : "";
}

function mostrarTablaVacia(texto) {
    const tabla =
        document.getElementById("tablaProductos");

    tabla.replaceChildren();

    const fila = tabla.insertRow();
    const celda = fila.insertCell();

    celda.colSpan = 9;
    celda.className = "pr-empty-message";
    celda.textContent = texto;
}

function agregarCelda(fila, texto, clase = "") {
    const celda = fila.insertCell();

    celda.textContent = texto;

    if (clase) {
        celda.className = clase;
    }

    return celda;
}

function renderizarProductos(productos) {
    const tabla =
        document.getElementById("tablaProductos");

    tabla.replaceChildren();

    if (productos.length === 0) {
        mostrarTablaVacia(
            productosCatalogo.length === 0
                ? "No hay productos registrados."
                : "No se encontraron productos con estos filtros."
        );

        return;
    }

    productos.forEach(producto => {
        const fila = tabla.insertRow();
        const estado = obtenerEstado(producto);

        const actual = Number(producto.stockActual ?? 0);
        const maximo = Number(producto.stockMaximo ?? 0);

        agregarCelda(fila, producto.id);

        const celdaNombre = fila.insertCell();
        const nombre = document.createElement("strong");

        nombre.textContent = producto.nombre ?? "";
        celdaNombre.appendChild(nombre);

        const celdaCategoria = fila.insertCell();
        const categoria = document.createElement("span");

        categoria.className = "pr-category";
        categoria.textContent = producto.categoria ?? "";
        celdaCategoria.appendChild(categoria);

        const celdaStock = fila.insertCell();

        const numero = document.createElement("div");
        numero.className = "pr-stock-number";
        numero.textContent = actual;
        numero.style.color = estado.color;

        const progreso = document.createElement("div");
        progreso.className = "pr-progress";
        progreso.setAttribute("aria-hidden", "true");

        const barra = document.createElement("div");
        barra.className = "pr-progress-fill";

        const porcentaje = maximo > 0
            ? Math.min(100, Math.max(0, actual / maximo * 100))
            : actual > 0 ? 100 : 0;

        barra.style.width = `${porcentaje}%`;
        barra.style.backgroundColor = estado.color;

        progreso.appendChild(barra);
        celdaStock.append(numero, progreso);

        agregarCelda(fila, producto.stockMinimo ?? 0);
        agregarCelda(fila, producto.stockMaximo ?? 0);

        const celdaEstado = fila.insertCell();
        const etiqueta = document.createElement("span");

        etiqueta.className = `pr-status ${estado.clase}`;
        etiqueta.textContent = estado.texto;

        celdaEstado.appendChild(etiqueta);

        const precio = Number(
            producto.precio ?? 0
        ).toLocaleString("es-DO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        agregarCelda(fila, `$${precio}`, "pr-price");

        const celdaAcciones = fila.insertCell();
        const acciones = document.createElement("div");

        acciones.className = "pr-actions";

        const btnEditar = document.createElement("button");

        btnEditar.type = "button";
        btnEditar.className = "btn btn-sm btn-outline-primary";
        btnEditar.textContent = "Editar";

        btnEditar.addEventListener(
            "click",
            () => editarProducto(producto.id)
        );

        const btnEliminar = document.createElement("button");

        btnEliminar.type = "button";
        btnEliminar.className = "btn btn-sm btn-outline-danger";
        btnEliminar.textContent = "Eliminar";

        btnEliminar.addEventListener(
            "click",
            () => eliminarProducto(producto.id)
        );

        acciones.append(btnEditar, btnEliminar);
        celdaAcciones.appendChild(acciones);
    });
}

function aplicarFiltros() {
    if (!catalogoCargado) {
        return;
    }

    const busqueda = normalizarTexto(
        document.getElementById("buscarProducto").value
    );

    const categoria =
        document.getElementById("filtroCategoria").value;

    const estado =
        document.getElementById("filtroEstado").value;

    const filtrados = productosCatalogo.filter(producto => {
        const coincideNombre = normalizarTexto(
            producto.nombre
        ).includes(busqueda);

        const coincideCategoria =
            !categoria ||
            normalizarTexto(producto.categoria) === categoria;

        const coincideEstado =
            !estado ||
            obtenerEstado(producto).codigo === estado;

        return coincideNombre &&
            coincideCategoria &&
            coincideEstado;
    });

    document.getElementById("contadorProductos").textContent =
        `Mostrando ${filtrados.length} de ${productosCatalogo.length} productos`;

    renderizarProductos(filtrados);
}

function limpiarFiltros() {
    document.getElementById("buscarProducto").value = "";
    document.getElementById("filtroCategoria").value = "";
    document.getElementById("filtroEstado").value = "";

    aplicarFiltros();
}

async function cargarProductos() {
    catalogoCargado = false;

    try {
        const respuesta = await fetch(API_URL, {
            credentials: "same-origin",
            cache: "no-store"
        });

        const resultado = await leerRespuesta(respuesta);

        if (Array.isArray(resultado)) {
            productosCatalogo = resultado;
        } else if (Array.isArray(resultado.value)) {
            productosCatalogo = resultado.value;
        } else {
            throw new Error("Respuesta de productos no valida.");
        }

        actualizarIndicadores();
        actualizarCategorias();

        catalogoCargado = true;
        aplicarFiltros();

    } catch (error) {
        productosCatalogo = [];
        catalogoCargado = false;

        [
            "prTotal",
            "prDisponibles",
            "prStockBajo",
            "prAgotados"
        ].forEach(id => {
            document.getElementById(id).textContent = "—";
        });

        actualizarCategorias();

        document.getElementById(
            "contadorProductos"
        ).textContent = "Productos no disponibles";

        mostrarTablaVacia(
            "No fue posible cargar los productos."
        );

        mostrarMensaje(error.message, "danger");
    }
}


function limpiarFormulario() {
            [
                "productoId",
                "nombre",
                "categoria",
                "stockActual",
                "stockMinimo",
                "stockMaximo",
                "precio"
            ].forEach(id => {
                document.getElementById(id).value = "";
            });
        }

        function mostrarFormulario() {
            limpiarFormulario();

            document.getElementById(
                "tituloFormulario"
            ).textContent = "Registrar producto";

            document.getElementById(
                "formularioProducto"
            ).style.display = "block";
        }

        function cancelarFormulario() {
            limpiarFormulario();

            document.getElementById(
                "formularioProducto"
            ).style.display = "none";
        }

        // ========================================
        // GUARDAR O ACTUALIZAR
        // ========================================

        async function guardarProducto() {
            if (guardando) {
                return;
            }

            const id =
                document.getElementById("productoId").value;

            const nombre =
                document.getElementById("nombre").value.trim();

            const categoria =
                document.getElementById("categoria").value.trim();

            const stockActualTexto =
                document.getElementById("stockActual").value;

            const stockMinimoTexto =
                document.getElementById("stockMinimo").value;

            const stockMaximoTexto =
                document.getElementById("stockMaximo").value;

            const precioTexto =
                document.getElementById("precio").value;

            if (!nombre || !categoria) {
                mostrarMensaje(
                    "El nombre y la categoría son obligatorios.",
                    "warning"
                );
                return;
            }

            if (
                stockActualTexto === "" ||
                stockMinimoTexto === "" ||
                stockMaximoTexto === "" ||
                precioTexto === ""
            ) {
                mostrarMensaje(
                    "Completa todos los campos numéricos.",
                    "warning"
                );
                return;
            }

            const stockActual = Number(stockActualTexto);
            const stockMinimo = Number(stockMinimoTexto);
            const stockMaximo = Number(stockMaximoTexto);
            const precio = Number(precioTexto);

            if (
                !Number.isInteger(stockActual) ||
                !Number.isInteger(stockMinimo) ||
                !Number.isInteger(stockMaximo) ||
                stockActual < 0 ||
                stockMinimo < 0 ||
                stockMaximo < 0 ||
                !Number.isFinite(precio) ||
                precio < 0
            ) {
                mostrarMensaje(
                    "Introduce valores numéricos válidos y no negativos.",
                    "warning"
                );
                return;
            }

            if (stockMinimo > stockMaximo) {
                mostrarMensaje(
                    "El stock mínimo no puede superar el stock máximo.",
                    "warning"
                );
                return;
            }

            if (stockActual > stockMaximo) {
                mostrarMensaje(
                    "El stock actual no puede superar el stock máximo.",
                    "warning"
                );
                return;
            }

            const producto = {
                nombre,
                categoria,
                stockActual,
                stockMinimo,
                stockMaximo,
                precio
            };

            const btnGuardar =
                document.getElementById("btnGuardar");

            guardando = true;
            btnGuardar.disabled = true;
            btnGuardar.textContent = "Guardando...";

            try {
                const token = await obtenerCsrfToken();

                const respuesta = await fetch(
                    id ? `${API_URL}/${id}` : API_URL,
                    {
                        method: id ? "PUT" : "POST",
                        credentials: "same-origin",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": token
                        },
                        body: JSON.stringify(producto)
                    }
                );

                await leerRespuesta(respuesta);

                cancelarFormulario();

                mostrarMensaje(
                    id
                        ? "Producto actualizado correctamente."
                        : "Producto guardado correctamente.",
                    "success"
                );

                await cargarProductos();

            } catch (error) {
                mostrarMensaje(error.message, "danger");

            } finally {
                guardando = false;
                btnGuardar.disabled = false;
                btnGuardar.textContent = "Guardar";
            }
        }

        // ========================================
        // EDITAR PRODUCTO
        // ========================================

        async function editarProducto(id) {
            try {
                const respuesta = await fetch(
                    `${API_URL}/${id}`,
                    {
                        credentials: "same-origin",
                        cache: "no-store"
                    }
                );

                const producto =
                    await leerRespuesta(respuesta);

                document.getElementById(
                    "productoId"
                ).value = producto.id;

                document.getElementById(
                    "nombre"
                ).value = producto.nombre ?? "";

                document.getElementById(
                    "categoria"
                ).value = producto.categoria ?? "";

                document.getElementById(
                    "stockActual"
                ).value = producto.stockActual ?? 0;

                document.getElementById(
                    "stockMinimo"
                ).value = producto.stockMinimo ?? 0;

                document.getElementById(
                    "stockMaximo"
                ).value = producto.stockMaximo ?? 0;

                document.getElementById(
                    "precio"
                ).value = producto.precio ?? 0;

                document.getElementById(
                    "tituloFormulario"
                ).textContent = "Editar producto";

                const formulario =
                    document.getElementById("formularioProducto");

                formulario.style.display = "block";

                formulario.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            } catch (error) {
                mostrarMensaje(error.message, "danger");
            }
        }

        // ========================================
        // ELIMINAR PRODUCTO
        // ========================================

        async function eliminarProducto(id) {
            if (eliminando) {
                return;
            }

            if (!confirm(
                "¿Deseas eliminar este producto?"
            )) {
                return;
            }

            eliminando = true;

            try {
                const token = await obtenerCsrfToken();

                const respuesta = await fetch(
                    `${API_URL}/${id}`,
                    {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "X-CSRF-TOKEN": token
                        }
                    }
                );

                await leerRespuesta(respuesta);

                mostrarMensaje(
                    "Producto eliminado correctamente.",
                    "success"
                );

                await cargarProductos();

            } catch (error) {
                mostrarMensaje(error.message, "danger");

            } finally {
                eliminando = false;
            }
        }

        // ========================================
        // INICIALIZAR
        // ========================================

        document.getElementById("buscarProducto")
    .addEventListener("input", aplicarFiltros);

document.getElementById("filtroCategoria")
    .addEventListener("change", aplicarFiltros);

document.getElementById("filtroEstado")
    .addEventListener("change", aplicarFiltros);

document.getElementById("btnLimpiarFiltros")
    .addEventListener("click", limpiarFiltros);

cargarProductos();
