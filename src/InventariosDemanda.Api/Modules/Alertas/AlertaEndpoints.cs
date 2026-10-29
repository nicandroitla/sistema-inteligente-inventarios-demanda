using InventariosDemanda.Api.Modules.Alertas;

namespace InventariosDemanda.Api.Modules.Alertas;

public static class AlertaEndpoints
{
    public static void MapAlertaEndpoints(this WebApplication app)
    {
        app.MapGet("/api/alertas", async (AlertaService servicio) =>
        {
            var alertas = await servicio.ObtenerAlertasAsync();
            return Results.Ok(alertas);
        })
        .WithTags("Alertas");
    }
}