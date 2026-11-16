
using InventariosDemanda.Api.Modules.Inventario.Models;
using InventariosDemanda.Api.Modules.Inventario.Services;

namespace InventariosDemanda.Api.Modules.Inventario;

public static class ProductoEndpoints
{
    public static void MapProductoEndpoints(this WebApplication app)
    {
        // ========================================
        // GRUPO DE ENDPOINTS PROTEGIDO CON SUPABASE
        // ========================================

        var grupo = app.MapGroup("/api/productos")
            .WithTags("Productos")
            .RequireAuthorization();

        // ========================================
        // OBTENER TODOS LOS PRODUCTOS
        // ========================================

        grupo.MapGet("/", async (
            ProductoService service) =>
        {
            var productos = await service.ObtenerTodosAsync();

            return Results.Ok(productos);
        });

        // ========================================
        // OBTENER PRODUCTO POR ID
        // ========================================

        grupo.MapGet("/{id:int}", async (
            int id,
            ProductoService service) =>
        {
            var producto = await service.ObtenerPorIdAsync(id);

            return producto is null
                ? Results.NotFound(new
                {
                    mensaje = "Producto no encontrado."
                })
                : Results.Ok(producto);
        });

        // ========================================
        // REGISTRAR PRODUCTO
        // ========================================

        grupo.MapPost("/", async (
            Producto producto,
            ProductoService service) =>
        {
            var error = service.ValidarProducto(producto);

            if (error is not null)
            {
                return Results.BadRequest(new
                {
                    mensaje = error
                });
            }

            var nuevoProducto =
                await service.CrearAsync(producto);

            return Results.Created(
                $"/api/productos/{nuevoProducto.Id}",
                nuevoProducto
            );
        });

        // ========================================
        // ACTUALIZAR PRODUCTO
        // ========================================

        grupo.MapPut("/{id:int}", async (
            int id,
            Producto datos,
            ProductoService service) =>
        {
            var error = service.ValidarProducto(datos);

            if (error is not null)
            {
                return Results.BadRequest(new
                {
                    mensaje = error
                });
            }

            var productoActualizado =
                await service.ActualizarAsync(id, datos);

            return productoActualizado is null
                ? Results.NotFound(new
                {
                    mensaje = "Producto no encontrado."
                })
                : Results.Ok(productoActualizado);
        });

        // ========================================
        // ELIMINAR PRODUCTO
        // ========================================

        grupo.MapDelete("/{id:int}", async (
            int id,
            ProductoService service) =>
        {
            var eliminado = await service.EliminarAsync(id);

            return eliminado
                ? Results.NoContent()
                : Results.NotFound(new
                {
                    mensaje = "Producto no encontrado."
                });
        });
    }
}
