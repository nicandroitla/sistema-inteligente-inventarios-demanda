
using InventariosDemanda.Api.Modules.Inventario.Movimientos.Services;

namespace InventariosDemanda.Api.Modules.Inventario.Movimientos;

public static class MovimientoInventarioEndpoints
{
    public static void MapMovimientoInventarioEndpoints(
        this WebApplication app)
    {
        var grupo = app.MapGroup("/api/movimientos")
            .WithTags("Movimientos de inventario");

        grupo.MapGet("/", async (
            MovimientoInventarioService servicio) =>
        {
            var movimientos = await servicio.ObtenerTodosAsync();

            return Results.Ok(movimientos);
        });

        grupo.MapGet("/{id:int}", async (
            int id,
            MovimientoInventarioService servicio) =>
        {
            var movimiento = await servicio.ObtenerPorIdAsync(id);

            return movimiento is null
                ? Results.NotFound(new
                {
                    mensaje = "El movimiento no existe."
                })
                : Results.Ok(movimiento);
        });

        grupo.MapPost("/", async (
            MovimientoInventario movimiento,
            MovimientoInventarioService servicio) =>
        {
            try
            {
                var creado = await servicio.RegistrarAsync(movimiento);

                return Results.Created(
                    $"/api/movimientos/{creado.Id}",
                    creado);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new
                {
                    mensaje = ex.Message
                });
            }
        });

        grupo.MapDelete("/{id:int}", async (
            int id,
            MovimientoInventarioService servicio) =>
        {
            try
            {
                var eliminado = await servicio.EliminarAsync(id);

                return eliminado
                    ? Results.Ok(new
                    {
                        mensaje = "Movimiento eliminado correctamente."
                    })
                    : Results.NotFound(new
                    {
                        mensaje = "El movimiento no existe."
                    });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new
                {
                    mensaje = ex.Message
                });
            }
        });
    }
}
