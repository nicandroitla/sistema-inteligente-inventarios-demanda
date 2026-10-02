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

        return new
        {
            totalProductos,
            productosStockBajo,
            productosSinStock,
            valorInventario
        };
    }
}