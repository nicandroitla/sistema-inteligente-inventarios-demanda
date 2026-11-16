
using InventariosDemanda.Api.Modules.Dashboard;

namespace InventariosDemanda.Api.Modules.Dashboard;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this WebApplication app)
    {
        // Endpoint protegido con autenticación JWT de Supabase
        app.MapGet("/api/dashboard", async (DashboardService service) =>
        {
            // Obtener el resumen general del inventario
            var resumen = await service.ObtenerResumenAsync();

            // Devolver los indicadores del Dashboard
            return Results.Ok(resumen);
        })
        .RequireAuthorization();
    }
}
