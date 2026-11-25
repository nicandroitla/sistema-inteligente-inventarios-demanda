(function () {
    "use strict";

    const $ = id => document.getElementById(id);
    const API = "/api-proxy/demanda/predicciones";

    const numero = n => Number(n).toLocaleString("es-DO", {
        maximumFractionDigits: 4
    });

    const moneda = n => "$" + Number(n).toLocaleString("es-DO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const normalizar = texto => String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const indicadores = [
        "totalProductos",
        "totalSalidas",
        "productosRequierenReposicion",
        "productosEnRiesgo",
        "demandaTotal30Dias",
        "totalUnidadesReposicion",
        "costoTotalReposicion",
        "productosSinSalidas"
    ];

    let productos = [];
    let cargando = false;
    let disponible = false;

    function elemento(tag, clase, texto) {
        const e = document.createElement(tag);
        e.className = clase || "";

        if (texto !== undefined) {
            e.textContent = texto;
        }

        return e;
    }

    function celda(fila, texto, clase = "") {
        const td = elemento("td", clase, texto);
        fila.appendChild(td);
        return td;
    }

    function estado(texto) {
        const colores = {
            "Alta": "red",
            "Media": "orange",
            "Baja": "blue",
            "Sin salidas": "gray",
            "Agotado": "red",
            "Stock bajo": "orange",
            "Riesgo de agotamiento": "red",
            "Reposicion preventiva": "blue",
            "Stock suficiente": "green",
            "Exceso de stock": "purple"
        };

        return elemento(
            "span",
            "dm-status dm-status-" + (colores[texto] || "gray"),
            texto
        );
    }

    function tablaVacia(id, mensaje) {
        const fila = document.createElement("tr");
        const td = celda(fila, mensaje, "dm-empty-message");
        td.colSpan = 9;
        $(id).replaceChildren(fila);
    }

    function barra(nombre, valor, maximo, color = "") {
        const fila = elemento("div", "dm-chart-row");
        const etiqueta = elemento("div", "dm-chart-label");

        etiqueta.append(
            elemento("span", "", nombre),
            elemento("span", "", numero(valor) + " uds.")
        );

        const pista = elemento("div", "dm-chart-track");
        const progreso = elemento("div", "dm-chart-bar " + color);

        progreso.style.width = (
            maximo > 0
                ? Math.min(100, Math.max(0, valor / maximo * 100))
                : 0
        ) + "%";

        pista.appendChild(progreso);
        fila.append(etiqueta, pista);

        return fila;
    }

    function validar(datos) {
        if (!datos || !Array.isArray(datos.predicciones)) {
            throw new Error("Respuesta de predicciones invalida.");
        }

        const campos = [
            ...indicadores,
            "demandaTotal7Dias",
            "demandaTotal15Dias"
        ];

        for (const campo of campos) {
            if (!Number.isFinite(datos[campo])) {
                throw new Error("Indicador invalido: " + campo);
            }
        }

        const camposProducto = [
            "stockActual", "stockMinimo", "stockMaximo",
            "unidadesSalida", "promedioDiario",
            "demanda7Dias", "demanda15Dias", "demanda30Dias",
            "participacion", "stockObjetivo",
            "reposicionSugerida", "demandaNoCubierta",
            "costoReposicion"
        ];

        for (const p of datos.predicciones) {
            if (!p ||
                typeof p.producto !== "string" ||
                typeof p.estado !== "string" ||
                typeof p.nivelDemanda !== "string") {
                throw new Error("Producto invalido.");
            }

            for (const campo of camposProducto) {
                if (!Number.isFinite(p[campo])) {
                    throw new Error("Dato invalido: " + campo);
                }
            }

            if (p.diasCobertura !== null &&
                !Number.isFinite(p.diasCobertura)) {
                throw new Error("Cobertura invalida.");
            }
        }
    }

    function graficos(datos) {
        const proyecciones = $("graficoProyecciones");
        const ranking = $("graficoRanking");

        proyecciones.replaceChildren();
        ranking.replaceChildren();

        const maximo = Math.max(
            datos.demandaTotal7Dias,
            datos.demandaTotal15Dias,
            datos.demandaTotal30Dias,
            0
        );

        proyecciones.append(
            barra("7 dias", datos.demandaTotal7Dias, maximo),
            barra("15 dias", datos.demandaTotal15Dias, maximo,
                "dm-chart-bar-purple"),
            barra("30 dias", datos.demandaTotal30Dias, maximo,
                "dm-chart-bar-green")
        );

        const mejores = [...productos]
            .filter(p => p.unidadesSalida > 0)
            .sort((a, b) => b.unidadesSalida - a.unidadesSalida)
            .slice(0, 5);

        if (!mejores.length) {
            ranking.textContent = "No hay salidas registradas.";
            return;
        }

        for (const p of mejores) {
            ranking.appendChild(
                barra(
                    p.producto,
                    p.unidadesSalida,
                    mejores[0].unidadesSalida,
                    "dm-chart-bar-purple"
                )
            );
        }
    }

    function renderizar() {
        if (!disponible) return;

        const buscar = normalizar($("buscarProducto").value);
        const nivel = $("filtroNivel").value;
        const filtro = $("filtroEstado").value;

        const filtrados = productos.filter(p =>
            normalizar(p.producto).includes(buscar) &&
            (!nivel || p.nivelDemanda === nivel) &&
            (!filtro || p.estado === filtro)
        );

        $("contadorProductos").textContent =
            "Mostrando " + filtrados.length +
            " de " + productos.length + " productos";

        const tabla = $("tablaPredicciones");
        const reposicion = $("tablaReposicion");

        tabla.replaceChildren();
        reposicion.replaceChildren();

        if (!filtrados.length) {
            tablaVacia("tablaPredicciones", "No hay coincidencias.");
            tablaVacia("tablaReposicion", "No hay coincidencias.");
            return;
        }

        for (const p of filtrados) {
            const fila = document.createElement("tr");

            celda(fila, p.producto, "dm-product");
            celda(fila, numero(p.unidadesSalida), "dm-number");
            celda(fila, numero(p.promedioDiario));
            celda(fila, numero(p.demanda7Dias));
            celda(fila, numero(p.demanda15Dias));
            celda(fila, numero(p.demanda30Dias), "dm-number");

            celda(fila, p.diasCobertura === null
                ? "Sin salidas"
                : numero(p.diasCobertura) + " dias");

            celda(fila, numero(p.participacion) + "%");
            celda(fila, "").appendChild(estado(p.nivelDemanda));

            tabla.appendChild(fila);
        }

        const ordenados = [...filtrados].sort(
            (a, b) => b.reposicionSugerida - a.reposicionSugerida ||
                b.demandaNoCubierta - a.demandaNoCubierta
        );

        for (const p of ordenados) {
            const fila = document.createElement("tr");

            celda(fila, p.producto, "dm-product");
            celda(fila, numero(p.stockActual), "dm-number");
            celda(fila, numero(p.stockMinimo));
            celda(fila, numero(p.stockMaximo));
            celda(fila, numero(p.stockObjetivo));

            celda(fila, numero(p.reposicionSugerida),
                "dm-replenishment");

            celda(fila, numero(p.demandaNoCubierta),
                p.demandaNoCubierta > 0 ? "text-danger fw-bold" : "");

            celda(fila, moneda(p.costoReposicion), "dm-cost");
            celda(fila, "").appendChild(estado(p.estado));

            reposicion.appendChild(fila);
        }
    }

    function fecha(valor) {
        const partes = String(valor ?? "").slice(0, 10).split("-");
        return partes.length === 3
            ? partes.reverse().join("/")
            : "No disponible";
    }

    function limpiarDatos() {
        productos = [];
        disponible = false;

        for (const id of indicadores) {
            $(id).textContent = "\u2014";
        }

        $("graficoProyecciones").textContent = "No disponible.";
        $("graficoRanking").textContent = "No disponible.";
        $("periodoAnalisis").textContent = "Periodo no disponible";
        $("contadorProductos").textContent = "Datos no disponibles";
        $("ultimaActualizacion").textContent =
            "Ultima actualizacion: no disponible";

        tablaVacia("tablaPredicciones", "No se pudieron cargar los datos.");
        tablaVacia("tablaReposicion", "No se pudo calcular la reposicion.");
    }

    async function cargar() {
        if (cargando) return;

        cargando = true;

        $("botonActualizar").disabled = true;
        $("botonActualizar").textContent = "Actualizando...";
        $("mensaje").className = "alert d-none";

        try {
            const respuesta = await fetch(API, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: { "Accept": "application/json" }
            });

            if (respuesta.status === 401 ||
                respuesta.status === 403 ||
                respuesta.redirected) {
                throw new Error("Sesion no autorizada.");
            }

            if ([502, 503, 504].includes(respuesta.status)) {
                throw new Error("El backend no esta disponible.");
            }

            if (!respuesta.ok) {
                throw new Error("Error HTTP: " + respuesta.status);
            }

            if (!(respuesta.headers.get("content-type") || "")
                .includes("application/json")) {
                throw new Error("La respuesta no es JSON.");
            }

            const datos = await respuesta.json();

            validar(datos);

            productos = datos.predicciones;
            disponible = true;

            for (const id of indicadores) {
                $(id).textContent = id === "costoTotalReposicion"
                    ? moneda(datos[id])
                    : numero(datos[id]);
            }

            $("periodoAnalisis").textContent =
                fecha(datos.fechaDesde) + " - " + fecha(datos.fechaHasta);

            const actualizacion = new Date(datos.fechaAnalisis);

            $("ultimaActualizacion").textContent =
                "Ultima actualizacion: " +
                (Number.isNaN(actualizacion.getTime())
                    ? "No disponible"
                    : actualizacion.toLocaleString("es-DO"));

            graficos(datos);
            renderizar();

        } catch (error) {
            limpiarDatos();

            $("mensaje").className = "alert alert-danger";
            $("mensaje").textContent = error.message;

            console.error(error);

        } finally {
            cargando = false;
            $("botonActualizar").disabled = false;
            $("botonActualizar").textContent = "Actualizar analisis";
        }
    }

    $("botonActualizar").addEventListener("click", cargar);
    $("buscarProducto").addEventListener("input", renderizar);
    $("filtroNivel").addEventListener("change", renderizar);
    $("filtroEstado").addEventListener("change", renderizar);

    $("btnLimpiarFiltros").addEventListener("click", function () {
        $("buscarProducto").value = "";
        $("filtroNivel").value = "";
        $("filtroEstado").value = "";
        renderizar();
    });

    cargar();

})();
