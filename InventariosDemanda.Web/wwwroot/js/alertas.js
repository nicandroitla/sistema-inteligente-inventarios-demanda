(() => {
    "use strict";

    const API_URL = "/api-proxy/alertas";

    let alertas = [];
    let cargando = false;
    let datosCargados = false;

    const $ = id => document.getElementById(id);

    const indicadores = [
        "totalAlertas",
        "totalAgotados",
        "totalStockBajo",
        "totalRiesgoAgotamiento",
        "totalReposicionPreventiva",
        "totalExcesoStock",
        "totalUnidadesReposicion",
        "productosSinAlertas"
    ];

    const prioridades = [
        {
            nombre: "Critica",
            etiqueta: "Critica",
            campo: "totalCriticas",
            clase: "al-critical"
        },
        {
            nombre: "Alta",
            etiqueta: "Alta",
            campo: "totalAltas",
            clase: "al-high"
        },
        {
            nombre: "Media",
            etiqueta: "Media",
            campo: "totalMedias",
            clase: "al-medium"
        },
        {
            nombre: "Informativa",
            etiqueta: "Informativa",
            campo: "totalInformativas",
            clase: "al-info"
        }
    ];

    function numero(valor) {
        return Number(valor).toLocaleString("es-DO", {
            maximumFractionDigits: 2
        });
    }

    function moneda(valor) {
        return "$" + Number(valor).toLocaleString("es-DO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function normalizar(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

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
        $("mensaje").textContent = texto;
        $("mensaje").className = `alert alert-${tipo}`;
    }

    function limpiarMensaje() {
        $("mensaje").textContent = "";
        $("mensaje").className = "alert d-none";
    }

    function mostrarVacio(contenedor, texto) {
        contenedor.replaceChildren(
            crearElemento("div", "al-empty", texto)
        );
    }

    function actualizarIndicadores(datos) {
        indicadores.forEach(id => {
            $(id).textContent = numero(datos[id]);
        });
    }

    function dibujarPrioridades(datos) {
        const contenedor = $("graficoPrioridades");

        contenedor.replaceChildren();

        const total = datos.totalAlertas;

        prioridades.forEach(prioridad => {
            const cantidad = datos[prioridad.campo];

            const porcentaje = total > 0
                ? cantidad * 100 / total
                : 0;

            const fila = crearElemento(
                "div",
                "al-chart-row " + prioridad.clase
            );

            const etiqueta = crearElemento(
                "div",
                "al-chart-label"
            );

            etiqueta.append(
                crearElemento("span", "", prioridad.etiqueta),
                crearElemento(
                    "strong",
                    "",
                    `${numero(cantidad)} ${cantidad === 1 ? "alerta" : "alertas"} (${numero(porcentaje)}%)`
                )
            );

            const pista = crearElemento(
                "div",
                "al-chart-track"
            );

            const barra = crearElemento(
                "div",
                "al-chart-bar"
            );

            barra.style.width =
                `${Math.max(0, Math.min(100, porcentaje))}%`;

            pista.appendChild(barra);
            fila.append(etiqueta, pista);
            contenedor.appendChild(fila);
        });
    }

    function crearMetrica(nombre, valor) {
        const metrica = crearElemento(
            "div",
            "al-metric"
        );

        metrica.append(
            crearElemento(
                "div",
                "al-metric-label",
                nombre
            ),
            crearElemento(
                "div",
                "al-metric-value",
                valor
            )
        );

        return metrica;
    }

    function crearTarjeta(alerta) {
        const prioridad = prioridades.find(
            p => p.nombre === alerta.prioridad
        );

        const tarjeta = crearElemento(
            "article",
            "al-alert-card " +
            (prioridad?.clase ?? "al-info")
        );

        const encabezado = crearElemento(
            "div",
            "al-alert-header"
        );

        const informacion = crearElemento("div");

        informacion.append(
            crearElemento(
                "div",
                "al-product",
                alerta.nombre
            ),
            crearElemento(
                "div",
                "al-category",
                `${alerta.tipo} | ${alerta.categoria}`
            )
        );

        const etiqueta = crearElemento(
            "span",
            "al-priority",
            `Prioridad ${alerta.prioridad.toLowerCase()}`
        );

        encabezado.append(informacion, etiqueta);

        const mensaje = crearElemento(
            "div",
            "text-secondary small",
            alerta.mensaje
        );

        const metricas = crearElemento(
            "div",
            "al-metrics"
        );

        metricas.append(
            crearMetrica(
                "Stock actual",
                numero(alerta.stockActual)
            ),
            crearMetrica(
                "Stock minimo",
                numero(alerta.stockMinimo)
            ),
            crearMetrica(
                "Stock maximo",
                numero(alerta.stockMaximo)
            ),
            crearMetrica(
                "Unidades a reponer",
                numero(alerta.reposicionSugerida)
            ),
            crearMetrica(
                "Cobertura estimada",
                alerta.diasCobertura === null
                    ? "Sin salidas"
                    : numero(alerta.diasCobertura) + " dias"
            ),
            crearMetrica(
                "Demanda a 7 dias",
                numero(alerta.demanda7Dias)
            ),
            crearMetrica(
                "Demanda a 30 dias",
                numero(alerta.demanda30Dias)
            ),
            crearMetrica(
                "Valor referencial",
                moneda(alerta.costoReposicion)
            )
        );

        if (alerta.excesoUnidades > 0) {
            metricas.appendChild(
                crearMetrica(
                    "Unidades excedentes",
                    numero(alerta.excesoUnidades)
                )
            );
        }

        if (alerta.demandaNoCubierta > 0) {
            metricas.appendChild(
                crearMetrica(
                    "Objetivo no cubierto",
                    numero(alerta.demandaNoCubierta)
                )
            );
        }

        const recomendacion = crearElemento(
            "div",
            "al-recommendation"
        );

        recomendacion.append(
            crearElemento("strong", "", "Recomendacion: "),
            document.createTextNode(alerta.recomendacion)
        );

        tarjeta.append(
            encabezado,
            mensaje,
            metricas,
            recomendacion
        );

        return tarjeta;
    }

    function aplicarFiltros() {
        if (!datosCargados) {
            return;
        }

        const busqueda = normalizar(
            $("buscarProducto").value
        );

        const tipo = $("filtroTipo").value;
        const prioridad = $("filtroPrioridad").value;

        const filtradas = alertas.filter(alerta => {
            const texto = normalizar(
                alerta.nombre + " " + alerta.categoria
            );

            return (
                (!busqueda || texto.includes(busqueda)) &&
                (!tipo || alerta.tipo === tipo) &&
                (!prioridad || alerta.prioridad === prioridad)
            );
        });

        const lista = $("listaAlertas");

        lista.replaceChildren();

        $("contadorAlertas").textContent =
            `Mostrando ${filtradas.length} de ${alertas.length} ${alertas.length === 1 ? "alerta" : "alertas"}`;

        if (filtradas.length === 0) {
            mostrarVacio(
                lista,
                alertas.length === 0
                    ? "No hay alertas activas en el inventario."
                    : "No se encontraron alertas con los filtros seleccionados."
            );

            return;
        }

        filtradas.forEach(alerta => {
            lista.appendChild(crearTarjeta(alerta));
        });
    }

    function limpiarFiltros() {
        $("buscarProducto").value = "";
        $("filtroTipo").value = "";
        $("filtroPrioridad").value = "";

        aplicarFiltros();
    }

    function fechaCorta(valor) {
        return String(valor)
            .substring(0, 10)
            .split("-")
            .reverse()
            .join("/");
    }

    function validarDatos(datos) {
        const camposNumericos = [
            ...indicadores,
            ...prioridades.map(p => p.campo),
            "diasHistorial"
        ];

        if (!datos ||
            !Array.isArray(datos.alertas) ||
            !camposNumericos.every(campo =>
                typeof datos[campo] === "number" &&
                Number.isFinite(datos[campo])
            )) {
            throw new Error(
                "La API devolvio una estructura de datos no valida."
            );
        }

        const camposAlerta = [
            "stockActual",
            "stockMinimo",
            "stockMaximo",
            "reposicionSugerida",
            "demanda7Dias",
            "demanda30Dias",
            "costoReposicion",
            "excesoUnidades",
            "demandaNoCubierta",
            "ordenPrioridad"
        ];

        const camposTexto = [
            "nombre",
            "categoria",
            "tipo",
            "prioridad",
            "mensaje",
            "recomendacion"
        ];

        const validas = datos.alertas.every(alerta =>
            alerta &&
            camposAlerta.every(campo =>
                typeof alerta[campo] === "number" &&
                Number.isFinite(alerta[campo])
            ) &&
            camposTexto.every(campo =>
                typeof alerta[campo] === "string"
            ) &&
            (
                alerta.diasCobertura === null ||
                Number.isFinite(alerta.diasCobertura)
            )
        );

        if (!validas ||
            datos.totalAlertas !== datos.alertas.length ||
            !datos.fechaDesde ||
            !datos.fechaHasta ||
            !Number.isFinite(
                Date.parse(datos.ultimaActualizacion)
            )) {
            throw new Error(
                "La informacion de alertas esta incompleta."
            );
        }
    }

    async function cargarAlertas() {
        if (cargando) {
            return;
        }

        cargando = true;

        const boton = $("botonActualizar");

        boton.disabled = true;
        boton.textContent = "Actualizando...";

        limpiarMensaje();

        try {
            const respuesta = await fetch(API_URL, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    Accept: "application/json"
                }
            });

            if (respuesta.status === 401) {
                throw new Error(
                    "Tu sesion ha expirado. Inicia sesion nuevamente."
                );
            }

            if (respuesta.status === 403) {
                throw new Error(
                    "No tienes autorizacion para consultar las alertas."
                );
            }

            if ([502, 503, 504].includes(respuesta.status)) {
                throw new Error(
                    "No se pudo establecer comunicacion con la API."
                );
            }

            if (!respuesta.ok) {
                throw new Error(
                    `Error al consultar alertas. HTTP ${respuesta.status}.`
                );
            }

            const contenido =
                respuesta.headers.get("content-type") ?? "";

            if (!contenido.includes("application/json")) {
                throw new Error(
                    "Respuesta inesperada. Verifica tu sesion."
                );
            }

            const datos = await respuesta.json();

            validarDatos(datos);

            alertas = [...datos.alertas].sort((a, b) =>
                a.ordenPrioridad - b.ordenPrioridad ||
                (a.diasCobertura ?? Infinity) -
                (b.diasCobertura ?? Infinity) ||
                a.nombre.localeCompare(b.nombre, "es")
            );

            datosCargados = true;

            actualizarIndicadores(datos);
            dibujarPrioridades(datos);
            aplicarFiltros();

            $("periodoAnalisis").textContent =
                `Periodo historico: ${fechaCorta(datos.fechaDesde)} al ${fechaCorta(datos.fechaHasta)} (${datos.diasHistorial} dias completos).`;

            $("ultimaActualizacion").textContent =
                "Ultima actualizacion: " +
                new Date(datos.ultimaActualizacion)
                    .toLocaleString("es-DO");

        } catch (error) {
            alertas = [];
            datosCargados = false;

            indicadores.forEach(id => {
                $(id).textContent = "—";
            });

            mostrarVacio(
                $("graficoPrioridades"),
                "No se pudo cargar la distribucion."
            );

            mostrarVacio(
                $("listaAlertas"),
                "No se pudieron cargar las alertas."
            );

            $("contadorAlertas").textContent =
                "Informacion no disponible.";

            $("periodoAnalisis").textContent =
                "Periodo de analisis no disponible.";

            $("ultimaActualizacion").textContent =
                "Ultima actualizacion: no disponible.";

            mostrarMensaje(
                error.message || "Error al consultar alertas."
            );

        } finally {
            cargando = false;
            boton.disabled = false;
            boton.textContent = "Actualizar alertas";
        }
    }

    $("buscarProducto").addEventListener(
        "input",
        aplicarFiltros
    );

    $("filtroTipo").addEventListener(
        "change",
        aplicarFiltros
    );

    $("filtroPrioridad").addEventListener(
        "change",
        aplicarFiltros
    );

    $("btnLimpiarFiltros").addEventListener(
        "click",
        limpiarFiltros
    );

    $("botonActualizar").addEventListener(
        "click",
        cargarAlertas
    );

    cargarAlertas();
})();

