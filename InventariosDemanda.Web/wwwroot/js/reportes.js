"use strict";

window.ReportesDatos = (() => {

    const configuraciones = {

        inventario: {
            titulo: "Reporte de inventario",
            descripcion: "Existencias actuales y valor del inventario.",
            endpoint: "/api-proxy/productos",
            columnas: [
                ["id", "ID"],
                ["producto", "Producto"],
                ["categoria", "Categoria"],
                ["stockActual", "Stock actual"],
                ["stockMinimo", "Stock minimo"],
                ["stockMaximo", "Stock maximo"],
                ["precio", "Precio unitario"],
                ["valor", "Valor total"],
                ["estado", "Estado"]
            ]
        },

        movimientos: {
            titulo: "Reporte de movimientos",
            descripcion: "Historial de entradas y salidas.",
            endpoint: "/api-proxy/movimientos",
            columnas: [
                ["id", "ID"],
                ["fecha", "Fecha"],
                ["producto", "Producto"],
                ["categoria", "Categoria"],
                ["tipo", "Tipo"],
                ["cantidad", "Cantidad"],
                ["descripcion", "Descripcion"]
            ]
        },

        demanda: {
            titulo: "Reporte de demanda",
            descripcion: "Proyecciones basadas en el consumo historico.",
            endpoint: "/api-proxy/demanda/predicciones",
            columnas: [
                ["producto", "Producto"],
                ["categoria", "Categoria"],
                ["stockActual", "Stock actual"],
                ["unidadesSalida", "Salidas historicas"],
                ["demanda7Dias", "Demanda 7 dias"],
                ["demanda15Dias", "Demanda 15 dias"],
                ["demanda30Dias", "Demanda 30 dias"],
                ["diasCobertura", "Dias de cobertura"],
                ["nivelDemanda", "Nivel de demanda"],
                ["estado", "Estado"]
            ]
        },

        alertas: {
            titulo: "Reporte de alertas",
            descripcion: "Riesgos y recomendaciones del inventario.",
            endpoint: "/api-proxy/alertas",
            columnas: [
                ["producto", "Producto"],
                ["categoria", "Categoria"],
                ["stockActual", "Stock actual"],
                ["stockMinimo", "Stock minimo"],
                ["tipo", "Tipo de alerta"],
                ["prioridad", "Prioridad"],
                ["reposicionSugerida", "Reposicion"],
                ["recomendacion", "Recomendacion"]
            ]
        },

        reposicion: {
            titulo: "Reporte de reposicion",
            descripcion: "Plan sugerido de abastecimiento.",
            endpoint: "/api-proxy/demanda/predicciones",
            columnas: [
                ["producto", "Producto"],
                ["categoria", "Categoria"],
                ["stockActual", "Stock actual"],
                ["stockObjetivo", "Stock objetivo"],
                ["demanda30Dias", "Demanda 30 dias"],
                ["reposicionSugerida", "Unidades sugeridas"],
                ["demandaNoCubierta", "Objetivo no cubierto"],
                ["costoReposicion", "Valor estimado"],
                ["estado", "Estado"]
            ]
        }
    };

    async function consultar(endpoint) {

        const respuesta = await fetch(endpoint, {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                "Accept": "application/json"
            }
        });

        if (respuesta.status === 401) {
            throw new Error(
                "La sesion ha expirado. Inicie sesion nuevamente."
            );
        }

        if (respuesta.status === 403) {
            throw new Error(
                "No tiene permisos para consultar este reporte."
            );
        }

        if (!respuesta.ok) {
            throw new Error(
                `No se pudo consultar el reporte. HTTP ${respuesta.status}.`
            );
        }

        const contenido =
            respuesta.headers.get("content-type") || "";

        if (!contenido.includes("application/json")) {
            throw new Error(
                "El servidor no devolvio informacion JSON."
            );
        }

        return await respuesta.json();
    }

    function validarLista(datos) {
        if (!Array.isArray(datos)) {
            throw new Error(
                "La estructura de datos recibida no es valida."
            );
        }

        return datos;
    }

    function numero(valor) {
        if (typeof valor !== "number" ||
            !Number.isFinite(valor)) {
            throw new Error(
                "Se recibio un valor numerico no valido."
            );
        }

        return valor;
    }

    function estadoInventario(producto) {

        if (producto.stockActual <= 0) {
            return "Agotado";
        }

        if (producto.stockActual > producto.stockMaximo) {
            return "Exceso de stock";
        }

        if (producto.stockActual <= producto.stockMinimo) {
            return "Stock bajo";
        }

        return "Stock suficiente";
    }

    function prepararInventario(datos) {

        return validarLista(datos).map(p => ({
            id: p.id,
            producto: p.nombre,
            categoria: p.categoria,
            stockActual: numero(p.stockActual),
            stockMinimo: numero(p.stockMinimo),
            stockMaximo: numero(p.stockMaximo),
            precio: numero(p.precio),
            valor: Math.round(
                numero(p.stockActual) * numero(p.precio) * 100
            ) / 100,
            estado: estadoInventario(p)
        }));
    }

    function prepararMovimientos(datos) {

        return validarLista(datos).map(m => ({
            id: m.id,
            fecha: m.fecha,
            producto: m.producto?.nombre ??
                `Producto #${m.productoId}`,
            categoria: m.producto?.categoria ?? "Sin categoria",
            tipo: m.tipo,
            cantidad: numero(m.cantidad),
            descripcion: m.descripcion ?? ""
        }));
    }

    function prepararDemanda(datos) {

        return validarLista(datos.predicciones).map(p => ({
            producto: p.producto,
            categoria: p.categoria,
            stockActual: numero(p.stockActual),
            unidadesSalida: numero(p.unidadesSalida),
            demanda7Dias: numero(p.demanda7Dias),
            demanda15Dias: numero(p.demanda15Dias),
            demanda30Dias: numero(p.demanda30Dias),
            diasCobertura: p.diasCobertura == null
                ? null
                : numero(p.diasCobertura),
            nivelDemanda: p.nivelDemanda,
            estado: p.estado
        }));
    }

    function prepararAlertas(datos) {

        return validarLista(datos.alertas).map(a => ({
            producto: a.nombre,
            categoria: a.categoria,
            stockActual: numero(a.stockActual),
            stockMinimo: numero(a.stockMinimo),
            tipo: a.tipo,
            prioridad: a.prioridad,
            reposicionSugerida: numero(a.reposicionSugerida),
            recomendacion: a.recomendacion
        }));
    }

    function prepararReposicion(datos) {

        return validarLista(datos.predicciones)
            .map(p => ({
                producto: p.producto,
                categoria: p.categoria,
                stockActual: numero(p.stockActual),
                stockObjetivo: numero(p.stockObjetivo),
                demanda30Dias: numero(p.demanda30Dias),
                reposicionSugerida: numero(p.reposicionSugerida),
                demandaNoCubierta: numero(p.demandaNoCubierta),
                costoReposicion: numero(p.costoReposicion),
                estado: p.estado
            }))
            .filter(p =>
                p.reposicionSugerida > 0 ||
                p.demandaNoCubierta > 0
            );
    }

    const preparadores = {
        inventario: prepararInventario,
        movimientos: prepararMovimientos,
        demanda: prepararDemanda,
        alertas: prepararAlertas,
        reposicion: prepararReposicion
    };

    async function obtenerReporte(tipo) {

        if (!Object.prototype.hasOwnProperty.call(
            configuraciones, tipo
        )) {
            throw new Error("Tipo de reporte no valido.");
        }

        const configuracion = configuraciones[tipo];

        const datos = await consultar(
            configuracion.endpoint
        );

        const registros = preparadores[tipo](datos);

        return {
            tipo,
            titulo: configuracion.titulo,
            descripcion: configuracion.descripcion,
            columnas: configuracion.columnas,
            registros,
            fechaGeneracion: new Date(),
            periodo: {
                desde: datos.fechaDesde ?? null,
                hasta: datos.fechaHasta ?? null,
                dias: datos.diasHistorial ?? null
            }
        };
    }

    return {
        configuraciones,
        obtenerReporte
    };

})();

(() => {

    "use strict";

    const $ = id => document.getElementById(id);

    const botones = document.querySelectorAll(
        "[data-reporte]"
    );

    let tipoActual = "inventario";
    let reporteActual = null;
    let registrosFiltrados = [];
    let solicitudActual = 0;

    const formatoNumero = new Intl.NumberFormat("es-DO", {
        maximumFractionDigits: 2
    });

    const formatoMoneda = new Intl.NumberFormat("es-DO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const moneda = valor =>
        "$" + formatoMoneda.format(valor);

    const normalizar = valor =>
        String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    function crearElemento(etiqueta, clase, texto) {
        const elemento = document.createElement(etiqueta);

        if (clase) {
            elemento.className = clase;
        }

        if (texto !== undefined) {
            elemento.textContent = texto;
        }

        return elemento;
    }

    function mostrarMensaje(texto, tipo = "danger") {

        const mensaje = $("mensajeReporte");

        mensaje.className =
            `alert alert-${tipo} rp-no-print`;

        mensaje.textContent = texto;
        mensaje.hidden = !texto;
    }

    function fechaClave(valor) {

        const coincidencia =
            String(valor ?? "").match(/^\d{4}-\d{2}-\d{2}/);

        return coincidencia ? coincidencia[0] : "";
    }

    function fechaCorta(valor) {

        const clave = fechaClave(valor);

        if (!clave) return "No disponible";

        const partes = clave.split("-");

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function sumar(registros, campo) {

        return registros.reduce(
            (total, registro) =>
                total + Number(registro[campo] ?? 0),
            0
        );
    }

    function campoEstado() {

        if (tipoActual === "movimientos") {
            return "tipo";
        }

        if (tipoActual === "alertas") {
            return "prioridad";
        }

        return "estado";
    }

    function llenarSelect(elemento, valores, etiqueta) {

        const anterior = elemento.value;

        elemento.replaceChildren();

        const opcionInicial =
            crearElemento("option", "", etiqueta);

        opcionInicial.value = "";

        elemento.appendChild(opcionInicial);

        const opciones = [...new Set(
            valores.filter(v => v != null && v !== "")
        )].sort((a, b) =>
            String(a).localeCompare(String(b), "es")
        );

        opciones.forEach(valor => {

            const opcion = crearElemento(
                "option", "", valor
            );

            opcion.value = valor;

            elemento.appendChild(opcion);
        });

        elemento.value =
            opciones.includes(anterior) ? anterior : "";
    }

    function configurarFiltros() {

        const registros = reporteActual.registros;

        llenarSelect(
            $("filtroCategoria"),
            registros.map(r => r.categoria),
            "Todas las categorias"
        );

        const campo = campoEstado();

        $("labelFiltroEstado").textContent =
            tipoActual === "movimientos"
                ? "Tipo de movimiento"
                : tipoActual === "alertas"
                    ? "Prioridad"
                    : "Estado";

        llenarSelect(
            $("filtroEstado"),
            registros.map(r => r[campo]),
            "Todos"
        );

        $("filtrosFecha").hidden =
            tipoActual !== "movimientos";
    }

    function reiniciarFiltros() {

        $("buscarReporte").value = "";
        $("filtroCategoria").value = "";
        $("filtroEstado").value = "";
        $("fechaDesde").value = "";
        $("fechaHasta").value = "";
    }

    function indicadores(registros) {

        switch (tipoActual) {

            case "inventario":

                return [
                    ["Productos", registros.length],
                    ["Unidades", sumar(registros, "stockActual")],
                    ["Valor del inventario",
                        moneda(sumar(registros, "valor"))],
                    ["Stock bajo",
                        registros.filter(r =>
                            r.estado === "Stock bajo"
                        ).length]
                ];

            case "movimientos": {

                const entradas = sumar(
                    registros.filter(r =>
                        r.tipo === "ENTRADA"),
                    "cantidad"
                );

                const salidas = sumar(
                    registros.filter(r =>
                        r.tipo === "SALIDA"),
                    "cantidad"
                );

                return [
                    ["Movimientos", registros.length],
                    ["Unidades de entrada", entradas],
                    ["Unidades de salida", salidas],
                    ["Balance neto", entradas - salidas]
                ];
            }

            case "demanda":

                return [
                    ["Productos analizados", registros.length],
                    ["Demanda a 7 dias",
                        sumar(registros, "demanda7Dias")],
                    ["Demanda a 15 dias",
                        sumar(registros, "demanda15Dias")],
                    ["Demanda a 30 dias",
                        sumar(registros, "demanda30Dias")]
                ];

            case "alertas":

                return [
                    ["Alertas", registros.length],
                    ["Criticas",
                        registros.filter(r =>
                            r.prioridad === "Critica"
                        ).length],
                    ["Prioridad alta",
                        registros.filter(r =>
                            r.prioridad === "Alta"
                        ).length],
                    ["Unidades sugeridas",
                        sumar(registros, "reposicionSugerida")]
                ];

            case "reposicion":

                return [
                    ["Productos incluidos", registros.length],
                    ["Unidades sugeridas",
                        sumar(registros, "reposicionSugerida")],
                    ["Valor estimado",
                        moneda(sumar(registros, "costoReposicion"))],
                    ["Objetivo no cubierto",
                        sumar(registros, "demandaNoCubierta")]
                ];

            default:
                return [];
        }
    }

    function renderizarIndicadores(registros) {

        const contenedor = $("resumenReporte");

        contenedor.replaceChildren();

        indicadores(registros).forEach(([nombre, valor]) => {

            const tarjeta =
                crearElemento("div", "rp-kpi");

            tarjeta.appendChild(
                crearElemento(
                    "span", "rp-kpi-label", nombre
                )
            );

            tarjeta.appendChild(
                crearElemento(
                    "strong",
                    "rp-kpi-value",
                    typeof valor === "number"
                        ? formatoNumero.format(valor)
                        : valor
                )
            );

            contenedor.appendChild(tarjeta);
        });
    }

    function formatearCelda(campo, valor) {

        if (valor == null) {
            return campo === "diasCobertura"
                ? "Sin salidas"
                : "";
        }

        if (campo === "fecha") {

            const hora = String(valor).match(
                /T(\d{2}:\d{2})/
            );

            return fechaCorta(valor) +
                (hora ? " " + hora[1] : "");
        }

        if (["precio", "valor", "costoReposicion"]
            .includes(campo)) {
            return moneda(valor);
        }

        if (campo === "id") {
            return String(valor);
        }

        if (typeof valor === "number") {
            return formatoNumero.format(valor);
        }

        return String(valor);
    }

    function renderizarTabla(registros) {

        const encabezado = $("encabezadoReporte");
        const cuerpo = $("tablaReporte");

        encabezado.replaceChildren();
        cuerpo.replaceChildren();

        const filaEncabezado =
            document.createElement("tr");

        reporteActual.columnas.forEach(
            ([campo, titulo]) => {

                const th = crearElemento(
                    "th", "", titulo
                );

                th.scope = "col";

                filaEncabezado.appendChild(th);
            }
        );

        encabezado.appendChild(filaEncabezado);

        if (!registros.length) {

            const fila = document.createElement("tr");

            const celda = crearElemento(
                "td",
                "rp-empty",
                "No hay registros para los filtros seleccionados."
            );

            celda.colSpan =
                reporteActual.columnas.length;

            fila.appendChild(celda);
            cuerpo.appendChild(fila);

            return;
        }

        const fragmento =
            document.createDocumentFragment();

        registros.forEach(registro => {

            const fila = document.createElement("tr");

            reporteActual.columnas.forEach(([campo]) => {

                fila.appendChild(
                    crearElemento(
                        "td",
                        "",
                        formatearCelda(
                            campo,
                            registro[campo]
                        )
                    )
                );
            });

            fragmento.appendChild(fila);
        });

        cuerpo.appendChild(fragmento);
    }

    function actualizarMetadatos() {

        $("fechaGeneracion").textContent =
            reporteActual.fechaGeneracion
                .toLocaleString("es-DO");

        const desde = $("fechaDesde").value;
        const hasta = $("fechaHasta").value;

        const periodo = reporteActual.periodo;

        if (tipoActual === "movimientos") {

            $("periodoReporte").textContent =
                desde || hasta
                    ? `${desde ? fechaCorta(desde) : "Inicio del historial"} - ${hasta ? fechaCorta(hasta) : "Ultimo registro"}`
                    : "Historial completo";

        } else if (periodo.desde && periodo.hasta) {

            $("periodoReporte").textContent =
                `${fechaCorta(periodo.desde)} - ${fechaCorta(periodo.hasta)} (${periodo.dias} dias)`;

        } else {

            $("periodoReporte").textContent =
                "Existencias al momento de la consulta";
        }

        $("totalRegistrosReporte").textContent =
            formatoNumero.format(
                registrosFiltrados.length
            );

        const filtros = [];

        if ($("buscarReporte").value.trim()) {
            filtros.push(
                "Busqueda: " + $("buscarReporte").value.trim()
            );
        }

        if ($("filtroCategoria").value) {
            filtros.push(
                "Categoria: " + $("filtroCategoria").value
            );
        }

        if ($("filtroEstado").value) {
            filtros.push(
                $("labelFiltroEstado").textContent +
                ": " + $("filtroEstado").value
            );
        }

        if (tipoActual === "movimientos") {

            if (desde) {
                filtros.push("Desde: " + fechaCorta(desde));
            }

            if (hasta) {
                filtros.push("Hasta: " + fechaCorta(hasta));
            }
        }

        $("detalleFiltros").textContent =
            filtros.join(" | ") || "Ninguno";
    }

    function aplicarFiltros() {

        if (!reporteActual) return;

        const busqueda = normalizar(
            $("buscarReporte").value
        );

        const categoria = $("filtroCategoria").value;
        const estado = $("filtroEstado").value;
        const desde = $("fechaDesde").value;
        const hasta = $("fechaHasta").value;

        const rangoInvalido =
            tipoActual === "movimientos" &&
            desde && hasta && desde > hasta;

        if (rangoInvalido) {

            mostrarMensaje(
                "La fecha inicial no puede ser posterior a la fecha final.",
                "warning"
            );

            registrosFiltrados = [];

        } else {

            mostrarMensaje("");

            registrosFiltrados =
                reporteActual.registros.filter(r => {

                    if (busqueda &&
                        !normalizar(r.producto)
                            .includes(busqueda)) {
                        return false;
                    }

                    if (categoria &&
                        r.categoria !== categoria) {
                        return false;
                    }

                    if (estado &&
                        r[campoEstado()] !== estado) {
                        return false;
                    }

                    if (tipoActual === "movimientos") {

                        const fecha = fechaClave(r.fecha);

                        if ((desde || hasta) && !fecha) {
                            return false;
                        }

                        if (desde && fecha < desde) {
                            return false;
                        }

                        if (hasta && fecha > hasta) {
                            return false;
                        }
                    }

                    return true;
                });
        }

        $("contadorRegistros").textContent =
            `${registrosFiltrados.length} de ${reporteActual.registros.length} registros`;

        renderizarIndicadores(registrosFiltrados);
        renderizarTabla(registrosFiltrados);
        actualizarMetadatos();

        $("btnExportarCsv").disabled =
            registrosFiltrados.length === 0;

        $("btnImprimirReporte").disabled =
            registrosFiltrados.length === 0;
    }

    function escaparCsv(valor) {

        if (valor == null) {
            return '""';
        }

        let texto = String(valor);

        if (typeof valor !== "number") {

            if (/^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/.test(texto)) {
                texto = "'" + texto;
            }
        }

        return '"' + texto.replace(/"/g, '""') + '"';
    }

    function exportarCsv() {

        if (!reporteActual || !registrosFiltrados.length) {
            return;
        }

        try {

            const columnas = reporteActual.columnas;

            const encabezados = columnas.map(
                ([campo, titulo]) => escaparCsv(titulo)
            ).join(",");

            const filas = registrosFiltrados.map(registro => {

                return columnas.map(([campo]) => {

                    let valor = registro[campo];

                    if (campo === "diasCobertura" &&
                        valor == null) {
                        valor = "Sin salidas";
                    }

                    return escaparCsv(valor);

                }).join(",");
            });

            const contenidoCsv =
                "\uFEFF" +
                [encabezados, ...filas].join("\r\n");

            const archivo = new Blob(
                [contenidoCsv],
                { type: "text/csv;charset=utf-8;" }
            );

            const ahora = new Date();

            const completar = n =>
                String(n).padStart(2, "0");

            const fecha =
                ahora.getFullYear() + "-" +
                completar(ahora.getMonth() + 1) + "-" +
                completar(ahora.getDate());

            const hora =
                completar(ahora.getHours()) +
                completar(ahora.getMinutes()) +
                completar(ahora.getSeconds());

            const nombreArchivo =
                `reporte_${tipoActual}_${fecha}_${hora}.csv`;

            const url = URL.createObjectURL(archivo);

            const enlace = document.createElement("a");

            enlace.href = url;
            enlace.download = nombreArchivo;

            document.body.appendChild(enlace);

            enlace.click();
            enlace.remove();

            setTimeout(
                () => URL.revokeObjectURL(url),
                1000
            );

            mostrarMensaje(
                "Archivo CSV generado correctamente.",
                "success"
            );

        } catch (error) {

            mostrarMensaje(
                "No se pudo generar el archivo CSV."
            );
        }
    }

    function imprimirReporte() {

        if (!reporteActual || !registrosFiltrados.length) {
            return;
        }

        const tituloAnterior = document.title;

        try {

            document.title =
                reporteActual.titulo +
                " - Inventarios Inteligentes";

            window.print();

        } catch (error) {

            mostrarMensaje(
                "No se pudo imprimir el reporte."
            );

        } finally {

            document.title = tituloAnterior;
        }
    }

    function limpiarVista(texto) {

        registrosFiltrados = [];

        $("resumenReporte").replaceChildren();
        $("encabezadoReporte").replaceChildren();
        $("tablaReporte").replaceChildren();

        const fila = document.createElement("tr");

        fila.appendChild(
            crearElemento("td", "rp-empty", texto)
        );

        $("tablaReporte").appendChild(fila);

        $("contadorRegistros").textContent =
            "0 registros";

        $("totalRegistrosReporte").textContent = "0";
        $("fechaGeneracion").textContent = "Pendiente";
        $("periodoReporte").textContent = "Pendiente";
        $("detalleFiltros").textContent = "Ninguno";

        $("btnExportarCsv").disabled = true;
        $("btnImprimirReporte").disabled = true;
    }

    async function cargarReporte() {

        const solicitud = ++solicitudActual;
        const tipoSolicitado = tipoActual;

        reporteActual = null;

        limpiarVista("Cargando informacion...");
        mostrarMensaje("");

        $("btnActualizarReporte").disabled = true;

        const configuracion =
            window.ReportesDatos.configuraciones[tipoActual];

        $("tituloReporte").textContent =
            configuracion.titulo;

        $("descripcionReporte").textContent =
            configuracion.descripcion;

        try {

            const resultado =
                await window.ReportesDatos.obtenerReporte(
                    tipoSolicitado
                );

            if (solicitud !== solicitudActual) return;

            reporteActual = resultado;

            configurarFiltros();
            aplicarFiltros();

        } catch (error) {

            if (solicitud !== solicitudActual) return;

            limpiarVista("No se pudo generar el reporte.");

            mostrarMensaje(
                error.message || "Error de conexion."
            );

        } finally {

            if (solicitud === solicitudActual) {

                $("btnActualizarReporte").disabled = false;
            }
        }
    }

    botones.forEach(boton => {

        boton.addEventListener("click", () => {

            const nuevoTipo = boton.dataset.reporte;

            if (nuevoTipo === tipoActual) return;

            tipoActual = nuevoTipo;

            botones.forEach(b => {

                const activo =
                    b.dataset.reporte === tipoActual;

                b.classList.toggle("active", activo);

                b.setAttribute(
                    "aria-pressed",
                    String(activo)
                );
            });

            reiniciarFiltros();

            $("filtrosFecha").hidden =
                tipoActual !== "movimientos";

            cargarReporte();
        });
    });

    $("buscarReporte").addEventListener(
        "input", aplicarFiltros
    );

    [
        "filtroCategoria",
        "filtroEstado",
        "fechaDesde",
        "fechaHasta"
    ].forEach(id => {

        $(id).addEventListener(
            "change", aplicarFiltros
        );
    });

    $("btnLimpiarFiltros").addEventListener(
        "click",
        () => {
            reiniciarFiltros();
            aplicarFiltros();
        }
    );

    $("btnExportarCsv").addEventListener(
        "click", exportarCsv
    );

    $("btnImprimirReporte").addEventListener(
        "click", imprimirReporte
    );

    $("btnActualizarReporte").addEventListener(
        "click", cargarReporte
    );

    cargarReporte();

})();





