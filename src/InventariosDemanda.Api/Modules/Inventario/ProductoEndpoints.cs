using InventariosDemanda.Api.Modules.Inventario.Models;
using InventariosDemanda.Api.Modules.Inventario.Services;

namespace InventariosDemanda.Api.Modules.Inventario;

public static class ProductoEndpoints
{
    public static void MapProductoEndpoints(this WebApplication app)
    {
        app.MapGet("/api/productos", async (ProductoService service) =>
        {
            var productos = await service.ObtenerTodosAsync();

            return Results.Ok(productos);
        });

        app.MapGet("/api/productos/{id:int}", async (int id, ProductoService service) =>
        {
            var producto = await service.ObtenerPorIdAsync(id);

            return producto is null
                ? Results.NotFound(new { mensaje = "Producto no encontrado." })
                : Results.Ok(producto);
        });

        app.MapPost("/api/productos", async (Producto producto, ProductoService service) =>
        {
            var nuevoProducto = await service.CrearAsync(producto);

            return Results.Created(
                $"/api/productos/{nuevoProducto.Id}",
                nuevoProducto
            );
        });

        app.MapPut("/api/productos/{id:int}", async (
            int id,
            Producto datos,
            ProductoService service) =>
        {
            var productoActualizado = await service.ActualizarAsync(id, datos);

            return productoActualizado is null
                ? Results.NotFound(new { mensaje = "Producto no encontrado." })
                : Results.Ok(productoActualizado);
        });

        app.MapDelete("/api/productos/{id:int}", async (int id, ProductoService service) =>
        {
            var eliminado = await service.EliminarAsync(id);

            return eliminado
                ? Results.NoContent()
                : Results.NotFound(new { mensaje = "Producto no encontrado." });
        });
    }
}