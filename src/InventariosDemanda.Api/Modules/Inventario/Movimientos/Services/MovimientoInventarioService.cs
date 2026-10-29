
using InventariosDemanda.Api.Modules.Inventario.Data;
using InventariosDemanda.Api.Modules.Inventario.Movimientos;
using Microsoft.EntityFrameworkCore;

namespace InventariosDemanda.Api.Modules.Inventario.Movimientos.Services;

public class MovimientoInventarioService
{
    private readonly InventariosDbContext _context;

    public MovimientoInventarioService(InventariosDbContext context)
    {
        _context = context;
    }

    public async Task<List<MovimientoInventario>> ObtenerTodosAsync()
    {
        return await _context.MovimientosInventario
            .Include(m => m.Producto)
            .OrderByDescending(m => m.Fecha)
            .ToListAsync();
    }

    public async Task<MovimientoInventario?> ObtenerPorIdAsync(int id)
    {
        return await _context.MovimientosInventario
            .Include(m => m.Producto)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<MovimientoInventario> RegistrarAsync(
        MovimientoInventario movimiento)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.Id == movimiento.ProductoId);

        if (producto is null)
        {
            throw new ArgumentException(
                "El producto indicado no existe.");
        }

        if (movimiento.Cantidad <= 0)
        {
            throw new ArgumentException(
                "La cantidad debe ser mayor que cero.");
        }

        if (string.IsNullOrWhiteSpace(movimiento.Tipo))
        {
            throw new ArgumentException(
                "El tipo de movimiento es obligatorio.");
        }

        var tipo = movimiento.Tipo.Trim().ToUpperInvariant();

        if (tipo != "ENTRADA" && tipo != "SALIDA")
        {
            throw new ArgumentException(
                "El tipo debe ser ENTRADA o SALIDA.");
        }

        if (tipo == "SALIDA" &&
            movimiento.Cantidad > producto.StockActual)
        {
            throw new ArgumentException(
                "No hay suficiente stock para registrar esta salida.");
        }

        if (tipo == "ENTRADA")
        {
            producto.StockActual += movimiento.Cantidad;
        }
        else
        {
            producto.StockActual -= movimiento.Cantidad;
        }

        movimiento.Tipo = tipo;
        movimiento.Fecha = DateTime.Now;
        movimiento.Producto = null;

        _context.MovimientosInventario.Add(movimiento);

        await _context.SaveChangesAsync();

        return await ObtenerPorIdAsync(movimiento.Id)
            ?? movimiento;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        await using var transaccion =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var movimiento = await _context.MovimientosInventario
                .FirstOrDefaultAsync(m => m.Id == id);

            if (movimiento is null)
            {
                await transaccion.RollbackAsync();
                return false;
            }

            var producto = await _context.Productos
                .FirstOrDefaultAsync(p => p.Id == movimiento.ProductoId);

            if (producto is null)
            {
                throw new InvalidOperationException(
                    "No se encontró el producto asociado al movimiento.");
            }

            if (movimiento.Cantidad <= 0)
            {
                throw new InvalidOperationException(
                    "La cantidad del movimiento no es válida.");
            }

            var tipo = movimiento.Tipo?.Trim().ToUpperInvariant();

            if (tipo == "ENTRADA")
            {
                if (producto.StockActual < movimiento.Cantidad)
                {
                    throw new InvalidOperationException(
                        "No se puede eliminar esta entrada porque dejaría el stock negativo.");
                }

                producto.StockActual -= movimiento.Cantidad;
            }
            else if (tipo == "SALIDA")
            {
                producto.StockActual += movimiento.Cantidad;
            }
            else
            {
                throw new InvalidOperationException(
                    "El tipo de movimiento no es válido.");
            }

            _context.MovimientosInventario.Remove(movimiento);

            await _context.SaveChangesAsync();
            await transaccion.CommitAsync();

            return true;
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }
}
