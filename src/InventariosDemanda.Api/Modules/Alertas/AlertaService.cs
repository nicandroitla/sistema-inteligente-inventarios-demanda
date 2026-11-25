using InventariosDemanda.Api.Modules.Demanda;

namespace InventariosDemanda.Api.Modules.Alertas;

public class AlertaService
{
    private readonly DemandaService _demandaService;

    public AlertaService(DemandaService demandaService)
    {
        _demandaService = demandaService;
    }

    public async Task<object> ObtenerAlertasAsync()
    {
        var resumen =
            await _demandaService.ObtenerPrediccionesAsync();

        var alertas = resumen.Predicciones
            .Where(p => p.Estado != "Stock suficiente")
            .Select(p =>
            {
                var prioridad = p.Estado switch
                {
                    "Agotado" => "Critica",
                    "Stock bajo" => "Alta",
                    "Riesgo de agotamiento" => "Alta",
                    "Reposicion preventiva" => "Media",
                    "Exceso de stock" => "Informativa",
                    _ => "Informativa"
                };

                var ordenPrioridad = prioridad switch
                {
                    "Critica" => 1,
                    "Alta" => 2,
                    "Media" => 3,
                    _ => 4
                };

                var mensaje = p.Estado switch
                {
                    "Agotado" =>
                        "Producto agotado",

                    "Stock bajo" =>
                        "Existencias en el limite minimo o por debajo",

                    "Riesgo de agotamiento" =>
                        "Cobertura estimada de 7 dias o menos",

                    "Reposicion preventiva" =>
                        "Se recomienda anticipar la reposicion",

                    "Exceso de stock" =>
                        "Existencias superiores al stock maximo",

                    _ => "Revisar existencias"
                };

                var recomendacion = p.Estado switch
                {
                    "Agotado" =>
                        $"Gestionar reposicion urgente. Unidades sugeridas: {p.ReposicionSugerida}.",

                    "Stock bajo" =>
                        $"Revisar existencias y reponer {p.ReposicionSugerida} unidades sugeridas.",

                    "Riesgo de agotamiento" =>
                        "Revisar la cobertura y planificar el abastecimiento.",

                    "Reposicion preventiva" =>
                        $"Planificar la reposicion de {p.ReposicionSugerida} unidades.",

                    "Exceso de stock" =>
                        $"Revisar compras y rotacion. Exceso: {p.StockActual - p.StockMaximo} unidades.",

                    _ => "Supervisar el comportamiento del inventario."
                };

                if (p.DemandaNoCubierta > 0)
                {
                    recomendacion +=
                        $" Revisar capacidad: {p.DemandaNoCubierta} unidades del objetivo no cubiertas.";
                }

                return new
                {
                    id = p.ProductoId,
                    nombre = p.Producto,
                    categoria = p.Categoria,
                    stockActual = p.StockActual,
                    stockMinimo = p.StockMinimo,
                    stockMaximo = p.StockMaximo,
                    tipo = p.Estado,
                    prioridad,
                    ordenPrioridad,
                    mensaje,
                    recomendacion,
                    diasCobertura = p.DiasCobertura,
                    demanda7Dias = p.Demanda7Dias,
                    demanda30Dias = p.Demanda30Dias,
                    reposicionSugerida = p.ReposicionSugerida,
                    demandaNoCubierta = p.DemandaNoCubierta,
                    costoReposicion = p.CostoReposicion,
                    excesoUnidades = Math.Max(
                        0, p.StockActual - p.StockMaximo)
                };
            })
            .OrderBy(a => a.ordenPrioridad)
            .ThenBy(a => a.diasCobertura ?? decimal.MaxValue)
            .ThenBy(a => a.nombre)
            .ToList();

        var agotados = alertas
            .Where(a => a.tipo == "Agotado")
            .ToList();

        var stockBajo = alertas
            .Where(a => a.tipo == "Stock bajo")
            .ToList();

        return new
        {
            totalProductos = resumen.TotalProductos,

            totalAlertas = alertas.Count,

            totalAgotados = agotados.Count,

            totalStockBajo = stockBajo.Count,

            totalRiesgoAgotamiento = alertas.Count(
                a => a.tipo == "Riesgo de agotamiento"),

            totalReposicionPreventiva = alertas.Count(
                a => a.tipo == "Reposicion preventiva"),

            totalExcesoStock = alertas.Count(
                a => a.tipo == "Exceso de stock"),

            totalCriticas = alertas.Count(
                a => a.prioridad == "Critica"),

            totalAltas = alertas.Count(
                a => a.prioridad == "Alta"),

            totalMedias = alertas.Count(
                a => a.prioridad == "Media"),

            totalInformativas = alertas.Count(
                a => a.prioridad == "Informativa"),

            productosSinAlertas =
                resumen.TotalProductos - alertas.Count,

            totalUnidadesReposicion =
                resumen.TotalUnidadesReposicion,

            costoTotalReposicion =
                resumen.CostoTotalReposicion,

            diasHistorial = resumen.DiasHistorial,

            fechaDesde = resumen.FechaDesde,

            fechaHasta = resumen.FechaHasta,

            ultimaActualizacion = resumen.FechaAnalisis,

            productosAgotados = agotados,

            productosStockBajo = stockBajo,

            alertas
        };
    }
}
