using InventariosDemanda.Api.Modules.Inventario.Data;
using Microsoft.EntityFrameworkCore;

namespace InventariosDemanda.Api.Modules.Dashboard;

public class DashboardService
{
    private readonly InventariosDbContext _context;

    public DashboardService(InventariosDbContext context)
    {
        _context = context;
    }

    public async Task<object> ObtenerResumenAsync()
    {
        var productos = await _context.Productos
            .AsNoTracking()
            .ToListAsync();

        var totalProductos = productos.Count;

        var productosStockBajo = productos.Count(p =>
            p.StockActual > 0 &&
            p.StockActual <= p.StockMinimo);

        var productosSinStock = productos.Count(p =>
            p.StockActual == 0);

        var valorInventario = productos.Sum(p =>
            p.StockActual * p.Precio);

        var totalUnidades = productos.Sum(p =>
            p.StockActual);

        var productosExcesoStock = productos.Count(p =>
            p.StockActual > p.StockMaximo);

        var hoy = DateTime.Today;
        var fechaInicio = hoy.AddDays(-6);
        var fechaFin = hoy.AddDays(1);

        var movimientos = await _context.MovimientosInventario
            .AsNoTracking()
            .Where(m => m.Fecha >= fechaInicio &&
                        m.Fecha < fechaFin)
            .Select(m => new
            {
                m.ProductoId,
                m.Tipo,
                m.Cantidad,
                m.Fecha
            })
            .ToListAsync();

        var totalEntradas = movimientos
            .Where(m => m.Tipo == "ENTRADA")
            .Sum(m => m.Cantidad);

        var totalSalidas = movimientos
            .Where(m => m.Tipo == "SALIDA")
            .Sum(m => m.Cantidad);

        var movimientosPorDia = Enumerable.Range(0, 7)
            .Select(i =>
            {
                var fecha = fechaInicio.AddDays(i);

                var movimientosDia = movimientos
                    .Where(m => m.Fecha.Date == fecha);

                return new
                {
                    fecha = fecha.ToString("dd/MM"),

                    entradas = movimientosDia
                        .Where(m => m.Tipo == "ENTRADA")
                        .Sum(m => m.Cantidad),

                    salidas = movimientosDia
                        .Where(m => m.Tipo == "SALIDA")
                        .Sum(m => m.Cantidad)
                };
            })
            .ToList();

        var distribucionInventario = productos
            .GroupBy(p => p.Categoria)
            .Select(g => new
            {
                categoria = g.Key,
                unidades = g.Sum(p => p.StockActual),
                valor = g.Sum(p => p.StockActual * p.Precio)
            })
            .OrderByDescending(g => g.unidades)
            .ToList();

        var rankingDemanda = productos
            .Select(p => new
            {
                productoId = p.Id,
                producto = p.Nombre,

                unidadesVendidas = movimientos
                    .Where(m =>
                        m.ProductoId == p.Id &&
                        m.Tipo == "SALIDA")
                    .Sum(m => m.Cantidad)
            })
            .Where(p => p.unidadesVendidas > 0)
            .OrderByDescending(p => p.unidadesVendidas)
            .Take(5)
            .ToList();

        var estadoExistencias = productos
            .Select(p => new
            {
                productoId = p.Id,
                producto = p.Nombre,
                stockActual = p.StockActual,
                stockMinimo = p.StockMinimo,
                stockMaximo = p.StockMaximo,

                estado = p.StockActual == 0
                    ? "Agotado"
                    : p.StockActual <= p.StockMinimo
                        ? "Stock bajo"
                        : p.StockActual > p.StockMaximo
                            ? "Exceso de stock"
                            : "Stock suficiente"
            })
            .OrderBy(p => p.stockActual)
            .ToList();

        return new
        {
            totalProductos,
            productosStockBajo,
            productosSinStock,
            valorInventario,
            totalUnidades,
            productosExcesoStock,
            totalEntradas,
            totalSalidas,
            movimientosPorDia,
            distribucionInventario,
            rankingDemanda,
            estadoExistencias,
            ultimaActualizacion = DateTimeOffset.Now
        };
    }
}
