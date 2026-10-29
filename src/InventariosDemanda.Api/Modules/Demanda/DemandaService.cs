
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
}
