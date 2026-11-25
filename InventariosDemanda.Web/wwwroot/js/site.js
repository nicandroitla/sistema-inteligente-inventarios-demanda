"use strict";

(() => {

    const sidebar = document.getElementById("appSidebar");
    const botonAbrir = document.getElementById("sidebarToggle");
    const botonCerrar = document.getElementById("sidebarClose");
    const fondo = document.getElementById("sidebarOverlay");
    const workspace = document.querySelector(".workspace");

    if (!sidebar || !botonAbrir || !botonCerrar ||
        !fondo || !workspace) {
        return;
    }

    const pantallaMovil = window.matchMedia(
        "(max-width: 900px)"
    );

    let menuAbierto = false;

    function abrirMenu() {

        if (!pantallaMovil.matches || menuAbierto) {
            return;
        }

        menuAbierto = true;

        sidebar.inert = false;
        sidebar.removeAttribute("aria-hidden");

        document.body.classList.add("sidebar-open");

        fondo.hidden = false;

        botonAbrir.setAttribute(
            "aria-expanded", "true"
        );

        botonCerrar.focus();

        workspace.inert = true;
    }

    function cerrarMenu(devolverFoco = true) {

        const estabaAbierto = menuAbierto;

        menuAbierto = false;

        workspace.inert = false;

        document.body.classList.remove("sidebar-open");

        fondo.hidden = true;

        botonAbrir.setAttribute(
            "aria-expanded", "false"
        );

        if (pantallaMovil.matches) {

            if (estabaAbierto && devolverFoco) {
                botonAbrir.focus();
            }

            sidebar.inert = true;

            sidebar.setAttribute(
                "aria-hidden", "true"
            );

        } else {

            sidebar.inert = false;

            sidebar.removeAttribute("aria-hidden");
        }
    }

    function adaptarPantalla() {

        const esMovil = pantallaMovil.matches;

        botonAbrir.hidden = !esMovil;
        botonCerrar.hidden = !esMovil;

        if (esMovil &&
            sidebar.contains(document.activeElement)) {

            botonAbrir.focus();
        }

        cerrarMenu(false);
    }

    botonAbrir.addEventListener("click", () => {

        if (menuAbierto) {
            cerrarMenu();
        } else {
            abrirMenu();
        }
    });

    botonCerrar.addEventListener("click", () => {
        cerrarMenu();
    });

    fondo.addEventListener("click", () => {
        cerrarMenu();
    });

    document.addEventListener("keydown", evento => {

        if (!menuAbierto) return;

        if (evento.key === "Escape") {

            evento.preventDefault();
            cerrarMenu();
            return;
        }

        if (evento.key === "Tab") {

            const elementos = Array.from(
                sidebar.querySelectorAll(
                    'a[href], button:not([disabled]), [tabindex="0"]'
                )
            ).filter(elemento =>
                !elemento.hidden &&
                elemento.getClientRects().length > 0
            );

            if (!elementos.length) return;

            const primero = elementos[0];
            const ultimo = elementos[elementos.length - 1];

            if (evento.shiftKey &&
                document.activeElement === primero) {

                evento.preventDefault();
                ultimo.focus();

            } else if (!evento.shiftKey &&
                document.activeElement === ultimo) {

                evento.preventDefault();
                primero.focus();
            }
        }
    });

    sidebar.querySelectorAll("a[href]").forEach(enlace => {

        enlace.addEventListener("click", () => {

            if (pantallaMovil.matches) {
                cerrarMenu();
            }
        });
    });

    pantallaMovil.addEventListener(
        "change", adaptarPantalla
    );

    window.addEventListener("pageshow", adaptarPantalla);

    document.body.classList.add("mobile-nav-ready");

    adaptarPantalla();

})();
