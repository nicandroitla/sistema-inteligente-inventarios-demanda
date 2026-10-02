using InventariosDemanda.Api.Modules.Dashboard;

namespace InventariosDemanda.Api.Modules.Dashboard;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet("/api/dashboard", async (DashboardService service) =>
        {
            var resumen = await service.ObtenerResumenAsync();

            return Results.Ok(resumen);
        });
    }
}