
using Microsoft.AspNetCore.Mvc;

namespace InventariosDemanda.Api.Modules.Demanda;

public static class DemandaEndpoints
{
    public static IEndpointRouteBuilder MapDemandaEndpoints(
        this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/demanda")
            .WithTags("Demanda");

        grupo.MapGet("/", async (DemandaService servicio) =>
        {
            var demandas = await servicio.ObtenerTodasAsync();
            return Results.Ok(demandas);
        });

        grupo.MapGet("/{id:int}", async (
            int id,
            DemandaService servicio) =>
        {
            var demanda = await servicio.ObtenerPorIdAsync(id);

            return demanda is null
                ? Results.NotFound(new { mensaje = "Estimación no encontrada." })
                : Results.Ok(demanda);
        });

        grupo.MapPost("/", async (
            [FromBody] DemandaProducto demanda,
            DemandaService servicio) =>
        {
            try
            {
                var creada = await servicio.CrearAsync(demanda);

                return Results.Created(
                    $"/api/demanda/{creada.Id}",
                    creada);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { mensaje = ex.Message });
            }
        });

        return app;
    }
}
