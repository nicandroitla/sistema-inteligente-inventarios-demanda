using InventariosDemanda.Api.Modules.Inventario.Data;
using Microsoft.EntityFrameworkCore;

namespace InventariosDemanda.Api.Modules.Alertas;

public class AlertaService
{
    private readonly InventariosDbContext _context;

    public AlertaService(InventariosDbContext context)
    {
        _context = context;
    }

    public async Task<object> ObtenerAlertasAsync()
    {
        var productos = await _context.Productos
            .AsNoTracking()
            .ToListAsync();

        var agotados = productos
            .Where(p => p.StockActual <= 0)
            .Select(p => new
            {
                p.Id,
                p.Nombre,
                p.Categoria,
                p.StockActual,
                p.StockMinimo,
                Mensaje = "Producto agotado"
            })
            .ToList();

        var stockBajo = productos
            .Where(p => p.StockActual > 0 &&
                        p.StockActual <= p.StockMinimo)
            .Select(p => new
            {
                p.Id,
                p.Nombre,
                p.Categoria,
                p.StockActual,
                p.StockMinimo,
                Mensaje = "Stock bajo"
            })
            .ToList();

        return new
        {
            TotalAgotados = agotados.Count,
            TotalStockBajo = stockBajo.Count,
            ProductosAgotados = agotados,
            ProductosStockBajo = stockBajo
        };
    }
}