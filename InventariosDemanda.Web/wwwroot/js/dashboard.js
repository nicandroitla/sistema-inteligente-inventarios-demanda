(function () {
    "use strict";

    let cargando = false;

    const colores = [
        "#2563eb",
        "#14b8a6",
        "#f59e0b",
        "#7c3aed",
        "#ec4899",
        "#0891b2",
        "#64748b",
        "#16a34a"
    ];

    const indicadores = [
        "totalProductos",
        "productosStockBajo",
        "productosSinStock",
        "valorInventario",
        "totalUnidades",
        "productosExcesoStock",
        "totalEntradas",
        "totalSalidas"
    ];

    const formatoNumero = new Intl.NumberFormat("es-DO");

    function obtener(id) {
        return document.getElementById(id);
    }

    function numero(valor) {
        const resultado = Number(valor);
        return Number.isFinite(resultado) ? resultado : 0;
    }

    function formatear(valor) {
        return formatoNumero.format(numero(valor));
    }

    function elemento(etiqueta, clase, texto) {
        const nodo = document.createElement(etiqueta);

        if (clase) {
            nodo.className = clase;
        }

        if (texto !== undefined) {
            nodo.textContent = texto;
        }

        return nodo;
    }

    function mensajeVacio(contenedor, mensaje) {
        contenedor.replaceChildren(
            elemento("div", "db-empty-message", mensaje)
        );
    }

    function actualizarEstado(mensaje, color) {
        obtener("estadoSistema").textContent = mensaje;
        obtener("indicadorEstado").style.backgroundColor = color;
    }

    function mostrarIndicadores(datos) {
        indicadores.forEach(id => {
            obtener(id).textContent = formatear(datos[id]);
        });

        obtener("valorInventario").textContent =
            "$" + numero(datos.valorInventario).toLocaleString("es-DO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
    }

    function mostrarMovimientos(datos) {
        const contenedor = obtener("graficoMovimientos");
        contenedor.replaceChildren();

        if (!datos.length || datos.every(d =>
            numero(d.entradas) === 0 && numero(d.salidas) === 0)) {

            mensajeVacio(
                contenedor,
                "No hay movimientos registrados en los últimos siete días."
            );

            return;
        }

        const maximo = Math.max(
            1,
            ...datos.map(d => Math.max(
                numero(d.entradas),
                numero(d.salidas)
            ))
        );

        datos.forEach(dia => {
            const grupo = elemento("div", "db-day");
            const barras = elemento("div", "db-bars");

            const entrada = elemento("div", "db-bar db-entry");
            const salida = elemento("div", "db-bar db-exit");

            entrada.style.height =
                (numero(dia.entradas) / maximo * 100) + "%";

            salida.style.height =
                (numero(dia.salidas) / maximo * 100) + "%";

            entrada.title =
                dia.fecha + " - Entradas: " + formatear(dia.entradas);

            salida.title =
                dia.fecha + " - Salidas: " + formatear(dia.salidas);

            entrada.setAttribute("aria-label", entrada.title);
            salida.setAttribute("aria-label", salida.title);

            entrada.setAttribute("role", "img");
            salida.setAttribute("role", "img");

            barras.append(entrada, salida);

            grupo.append(
                barras,
                elemento("span", "db-day-label", dia.fecha),
                elemento(
                    "small",
                    "db-day-label",
                    formatear(dia.entradas) + " / " +
                    formatear(dia.salidas)
                )
            );

            contenedor.appendChild(grupo);
        });
    }

    function mostrarDistribucion(datos) {
        const grafico = obtener("graficoDistribucion");
        const leyenda = obtener("leyendaDistribucion");

        leyenda.replaceChildren();

        const total = datos.reduce(
            (suma, item) => suma + Math.max(0, numero(item.unidades)),
            0
        );

        obtener("donutTotal").textContent = formatear(total);

        grafico.style.background = "#e2e8f0";

        if (total <= 0) {
            mensajeVacio(leyenda, "No hay unidades disponibles.");
            return;
        }

        let acumulado = 0;
        const segmentos = [];

        datos.forEach((item, indice) => {
            const color = colores[indice % colores.length];

            const porcentaje =
                Math.max(0, numero(item.unidades)) / total * 100;

            const inicio = acumulado;
            acumulado += porcentaje;

            if (porcentaje > 0) {
                segmentos.push(
                    color + " " + inicio + "% " + acumulado + "%"
                );
            }

            const fila = elemento("div", "db-category-row");
            const nombre = elemento("div", "db-legend-item");
            const indicador = elemento("span", "db-color");

            indicador.style.backgroundColor = color;

            nombre.append(
                indicador,
                elemento(
                    "span",
                    "",
                    item.categoria || "Sin categoría"
                )
            );

            fila.append(
                nombre,
                elemento(
                    "strong",
                    "",
                    formatear(item.unidades) +
                    " (" + porcentaje.toFixed(1) + "%)"
                )
            );

            leyenda.appendChild(fila);
        });

        grafico.style.background =
            "conic-gradient(" + segmentos.join(", ") + ")";
    }

    function crearBarra(porcentaje, color) {
        const barra = elemento("div", "db-progress");
        const relleno = elemento("div", "db-progress-fill");

        const valor = Math.max(0, Math.min(100, porcentaje));

        relleno.style.width = valor + "%";
        relleno.style.backgroundColor = color;

        barra.setAttribute("role", "progressbar");
        barra.setAttribute("aria-valuemin", "0");
        barra.setAttribute("aria-valuemax", "100");
        barra.setAttribute("aria-valuenow", valor.toFixed(1));

        barra.appendChild(relleno);

        return barra;
    }

    function mostrarRanking(datos) {
        const contenedor = obtener("rankingDemanda");

        contenedor.replaceChildren();

        if (!datos.length) {
            mensajeVacio(
                contenedor,
                "No hay salidas registradas durante este período."
            );

            return;
        }

        const maximo = Math.max(
            1,
            ...datos.map(p => numero(p.unidadesVendidas))
        );

        datos.forEach((producto, indice) => {
            const fila = elemento("div", "db-ranking-row");

            fila.append(
                elemento(
                    "strong",
                    "",
                    (indice + 1) + ". " + producto.producto
                ),
                elemento(
                    "span",
                    "",
                    formatear(producto.unidadesVendidas) + " unidades"
                )
            );

            contenedor.append(
                fila,
                crearBarra(
                    numero(producto.unidadesVendidas) / maximo * 100,
                    colores[indice % colores.length]
                )
            );
        });
    }

    function mostrarExistencias(datos) {
        const contenedor = obtener("estadoExistencias");

        contenedor.replaceChildren();

        if (!datos.length) {
            mensajeVacio(contenedor, "No hay productos registrados.");
            return;
        }

        datos.forEach(producto => {
            let color = "#16a34a";
            let clase = "db-normal";

            switch (producto.estado) {
                case "Agotado":
                    color = "#dc2626";
                    clase = "db-empty";
                    break;

                case "Stock bajo":
                    color = "#d97706";
                    clase = "db-low";
                    break;

                case "Exceso de stock":
                    color = "#7c3aed";
                    clase = "db-excess";
                    break;
            }

            const actual = numero(producto.stockActual);
            const maximo = numero(producto.stockMaximo);

            const porcentaje = maximo > 0
                ? actual / maximo * 100
                : (actual > 0 ? 100 : 0);

            const fila = elemento("div", "db-stock-row");
            const encabezado = elemento("div", "db-stock-heading");

            encabezado.append(
                elemento("strong", "", producto.producto),
                elemento(
                    "span",
                    "db-status " + clase,
                    producto.estado
                )
            );

            const detalles = elemento(
                "div",
                "db-stock-details",
                "Actual: " + formatear(actual) +
                " | Mínimo: " + formatear(producto.stockMinimo) +
                " | Máximo: " + formatear(maximo)
            );

            fila.append(
                encabezado,
                crearBarra(porcentaje, color),
                detalles
            );

            contenedor.appendChild(fila);
        });
    }

    function limpiarDashboard() {
        indicadores.forEach(id => {
            obtener(id).textContent = "—";
        });

        obtener("donutTotal").textContent = "—";
        obtener("ultimaActualizacion").textContent = "—";

        obtener("graficoDistribucion").style.background = "#e2e8f0";

        [
            "graficoMovimientos",
            "leyendaDistribucion",
            "rankingDemanda",
            "estadoExistencias"
        ].forEach(id => {
            mensajeVacio(obtener(id), "Datos no disponibles.");
        });
    }

    async function cargarDashboard() {
        if (cargando) {
            return;
        }

        cargando = true;

        const boton = obtener("btnActualizarDashboard");

        boton.disabled = true;
        boton.textContent = "Actualizando...";

        actualizarEstado(
            "Consultando datos del inventario...",
            "#d97706"
        );

        try {
            const respuesta = await fetch("/api-proxy/dashboard", {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (respuesta.status === 401) {
                throw new Error(
                    "Sesión no válida. Inicia sesión nuevamente."
                );
            }

            if (respuesta.status === 403) {
                throw new Error(
                    "No tienes autorización para consultar el Dashboard."
                );
            }

            if (respuesta.status === 502) {
                throw new Error(
                    "No fue posible establecer comunicación con la API."
                );
            }

            if (!respuesta.ok) {
                throw new Error("Error HTTP " + respuesta.status);
            }

            const contenido =
                respuesta.headers.get("content-type") || "";

            if (!contenido.includes("application/json")) {
                throw new Error("La respuesta no contiene JSON válido.");
            }

            const datos = await respuesta.json();

            if (!datos || typeof datos !== "object") {
                throw new Error("La API devolvió datos incorrectos.");
            }

            if (!indicadores.every(id =>
                typeof datos[id] === "number" &&
                Number.isFinite(datos[id]))) {

                throw new Error("Los indicadores están incompletos.");
            }

            const colecciones = [
                "movimientosPorDia",
                "distribucionInventario",
                "rankingDemanda",
                "estadoExistencias"
            ];

            if (!colecciones.every(id => Array.isArray(datos[id]))) {
                throw new Error(
                    "La API no devolvió los datos de los gráficos."
                );
            }

            mostrarIndicadores(datos);
            mostrarMovimientos(datos.movimientosPorDia);
            mostrarDistribucion(datos.distribucionInventario);
            mostrarRanking(datos.rankingDemanda);
            mostrarExistencias(datos.estadoExistencias);

            const fecha = new Date(datos.ultimaActualizacion);

            obtener("ultimaActualizacion").textContent =
                Number.isNaN(fecha.getTime())
                    ? "No disponible"
                    : fecha.toLocaleString("es-DO");

            actualizarEstado(
                "API conectada correctamente. Datos actualizados.",
                "#16a34a"
            );

        } catch (error) {
            console.error("Dashboard:", error);

            limpiarDashboard();

            actualizarEstado(
                error.message || "No fue posible cargar los datos.",
                "#dc2626"
            );

        } finally {
            boton.disabled = false;
            boton.textContent = "↻ Actualizar datos";
            cargando = false;
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        obtener("btnActualizarDashboard")
            .addEventListener("click", cargarDashboard);

        cargarDashboard();
    });

})();
