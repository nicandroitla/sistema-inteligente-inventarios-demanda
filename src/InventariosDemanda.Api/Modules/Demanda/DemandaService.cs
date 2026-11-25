
using InventariosDemanda.Api.Modules.Inventario.Data;
using Microsoft.EntityFrameworkCore;

namespace InventariosDemanda.Api.Modules.Demanda;

public class DemandaService
{
    private readonly InventariosDbContext _context;

    public DemandaService(InventariosDbContext context)
    {
        _context = context;
    }

    public async Task<List<DemandaProducto>> ObtenerTodasAsync()
    {
        return await _context.DemandasProducto
            .OrderByDescending(d => d.FechaEstimacion)
            .ToListAsync();
    }

    public async Task<DemandaProducto?> ObtenerPorIdAsync(int id)
    {
        return await _context.DemandasProducto
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<DemandaProducto> CrearAsync(DemandaProducto demanda)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.Id == demanda.ProductoId);

        if (producto is null)
        {
            throw new ArgumentException("El producto indicado no existe.");
        }

        if (demanda.CantidadEstimada < 0)
        {
            throw new ArgumentException(
                "La cantidad estimada no puede ser negativa.");
        }

        if (string.IsNullOrWhiteSpace(demanda.Periodo))
        {
            throw new ArgumentException(
                "Debes indicar el periodo de estimación.");
        }

        demanda.FechaEstimacion = DateTime.Now;

        _context.DemandasProducto.Add(demanda);
        await _context.SaveChangesAsync();

        return demanda;
    }


    // Motor estadistico de prediccion de demanda.
    public async Task<ResumenPrediccionesDto> ObtenerPrediccionesAsync()
    {
        const int diasHistorial = 30;

        var hoy = DateTime.Today;
        var desde = hoy.AddDays(-diasHistorial);
        var hasta = hoy;

        var productos = await _context.Productos
            .AsNoTracking()
            .ToListAsync();

        var movimientos = await _context.MovimientosInventario
            .AsNoTracking()
            .Where(m =>
                m.Fecha >= desde &&
                m.Fecha < hasta &&
                m.Tipo == "SALIDA")
            .ToListAsync();

        var resumen = productos.Select(producto =>
        {
            var salidas = movimientos
                .Where(m => m.ProductoId == producto.Id)
                .ToList();

            var unidadesSalida = salidas.Sum(m => m.Cantidad);

            var promedioDiario =
                (decimal)unidadesSalida / diasHistorial;

            var demanda7Dias =
                (int)Math.Ceiling((decimal)unidadesSalida * 7 / diasHistorial);

            var demanda15Dias =
                (int)Math.Ceiling((decimal)unidadesSalida * 15 / diasHistorial);

            var demanda30Dias =
                (int)Math.Ceiling((decimal)unidadesSalida * 30 / diasHistorial);

            decimal? diasCobertura = promedioDiario > 0
                ? Math.Round(
                    producto.StockActual / promedioDiario, 1)
                : null;

            var stockObjetivo = Math.Min(
                producto.StockMaximo,
                demanda30Dias + producto.StockMinimo);

            var reposicionSugerida = Math.Max(
                0,
                stockObjetivo - producto.StockActual);

            var demandaNoCubierta = Math.Max(
                0,
                demanda30Dias + producto.StockMinimo -
                producto.StockActual - reposicionSugerida);

            var estado = producto.StockActual <= 0
                ? "Agotado"
                : producto.StockActual > producto.StockMaximo
                    ? "Exceso de stock"
                    : producto.StockActual <= producto.StockMinimo
                        ? "Stock bajo"
                        : diasCobertura.HasValue &&
                          diasCobertura.Value <= 7
                            ? "Riesgo de agotamiento"
                            : reposicionSugerida > 0
                                ? "Reposicion preventiva"
                                : "Stock suficiente";

            return new
            {
                productoId = producto.Id,
                producto = producto.Nombre,
                categoria = producto.Categoria,
                stockActual = producto.StockActual,
                stockMinimo = producto.StockMinimo,
                stockMaximo = producto.StockMaximo,
                movimientosSalida = salidas.Count,
                unidadesSalida,
                promedioDiario = Math.Round(promedioDiario, 4),
                demanda7Dias,
                demanda15Dias,
                demanda30Dias,
                diasCobertura,
                stockObjetivo,
                reposicionSugerida,
                demandaNoCubierta,
                costoReposicion =
                    reposicionSugerida * producto.Precio,
                estado,
                tieneSalidas = unidadesSalida > 0
            };
        })
        .OrderByDescending(p => p.unidadesSalida)
        .ThenBy(p => p.producto)
        .ToList();

        var totalSalidas = resumen.Sum(p => p.unidadesSalida);

        var maximoSalidas = resumen.Count > 0
            ? resumen.Max(p => p.unidadesSalida)
            : 0;

        var predicciones = resumen.Select(p => new PrediccionProductoDto
        {
            ProductoId = p.productoId,
            Producto = p.producto,
            Categoria = p.categoria,
            StockActual = p.stockActual,
            StockMinimo = p.stockMinimo,
            StockMaximo = p.stockMaximo,
            MovimientosSalida = p.movimientosSalida,
            UnidadesSalida = p.unidadesSalida,
            PromedioDiario = p.promedioDiario,
            Demanda7Dias = p.demanda7Dias,
            Demanda15Dias = p.demanda15Dias,
            Demanda30Dias = p.demanda30Dias,
            DiasCobertura = p.diasCobertura,
            StockObjetivo = p.stockObjetivo,
            ReposicionSugerida = p.reposicionSugerida,
            DemandaNoCubierta = p.demandaNoCubierta,
            CostoReposicion = p.costoReposicion,
            Estado = p.estado,
            TieneSalidas = p.tieneSalidas,

            Participacion = totalSalidas > 0
                ? Math.Round(
                    p.unidadesSalida * 100m / totalSalidas, 1)
                : 0m,

            NivelDemanda = p.unidadesSalida == 0
                ? "Sin salidas"
                : p.unidadesSalida >= maximoSalidas * 0.70m
                    ? "Alta"
                    : p.unidadesSalida >= maximoSalidas * 0.30m
                        ? "Media"
                        : "Baja"
        })
        .ToList();

        return new ResumenPrediccionesDto
        {
            Metodo = "Promedio diario historico",
            DiasHistorial = diasHistorial,
            FechaDesde = desde,
            FechaHasta = hasta.AddDays(-1),
            FechaAnalisis = DateTimeOffset.Now,

            TotalProductos = resumen.Count,
            TotalSalidas = totalSalidas,

            ProductosConSalidas =
                resumen.Count(p => p.tieneSalidas),

            ProductosSinSalidas =
                resumen.Count(p => !p.tieneSalidas),

            ProductosRequierenReposicion =
                resumen.Count(p => p.reposicionSugerida > 0),

            ProductosEnRiesgo =
                resumen.Count(p =>
                    p.stockActual <= 0 ||
                    (p.diasCobertura.HasValue &&
                     p.diasCobertura.Value <= 7)),

            DemandaTotal7Dias =
                resumen.Sum(p => p.demanda7Dias),

            DemandaTotal15Dias =
                resumen.Sum(p => p.demanda15Dias),

            DemandaTotal30Dias =
                resumen.Sum(p => p.demanda30Dias),

            TotalUnidadesReposicion =
                resumen.Sum(p => p.reposicionSugerida),

            CostoTotalReposicion =
                resumen.Sum(p => p.costoReposicion),

            Predicciones = predicciones
        };
    }
}
