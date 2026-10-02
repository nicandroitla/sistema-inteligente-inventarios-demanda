using InventariosDemanda.Api.Modules.Inventario.Data;
using InventariosDemanda.Api.Modules.Inventario.Models;
using Microsoft.EntityFrameworkCore;

namespace InventariosDemanda.Api.Modules.Inventario.Services;

public class ProductoService
{
    private readonly InventariosDbContext _context;

    public ProductoService(InventariosDbContext context)
    {
        _context = context;
    }

    public string? ValidarProducto(Producto producto)
    {
        if (string.IsNullOrWhiteSpace(producto.Nombre))
        {
            return "El nombre del producto es obligatorio.";
        }

        if (producto.StockActual < 0)
        {
            return "El stock actual no puede ser negativo.";
        }

        if (producto.StockMinimo < 0)
        {
            return "El stock mínimo no puede ser negativo.";
        }

        if (producto.StockMaximo < 0)
        {
            return "El stock máximo no puede ser negativo.";
        }

        if (producto.StockMaximo < producto.StockMinimo)
        {
            return "El stock máximo no puede ser menor que el stock mínimo.";
        }

        if (producto.Precio < 0)
        {
            return "El precio no puede ser negativo.";
        }

        return null;
    }

    public async Task<List<Producto>> ObtenerTodosAsync()
    {
        return await _context.Productos
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Producto?> ObtenerPorIdAsync(int id)
    {
        return await _context.Productos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Producto> CrearAsync(Producto producto)
    {
        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();

        return producto;
    }

    public async Task<Producto?> ActualizarAsync(int id, Producto datos)
    {
        var producto = await _context.Productos.FindAsync(id);

        if (producto is null)
        {
            return null;
        }

        producto.Nombre = datos.Nombre;
        producto.Categoria = datos.Categoria;
        producto.StockActual = datos.StockActual;
        producto.StockMinimo = datos.StockMinimo;
        producto.StockMaximo = datos.StockMaximo;
        producto.Precio = datos.Precio;

        await _context.SaveChangesAsync();

        return producto;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        var producto = await _context.Productos.FindAsync(id);

        if (producto is null)
        {
            return false;
        }

        _context.Productos.Remove(producto);
        await _context.SaveChangesAsync();

        return true;
    }
}