using InventariosDemanda.Api.Modules.Dashboard;
using InventariosDemanda.Api.Modules.Inventario;
using InventariosDemanda.Api.Modules.Inventario.Data;
using InventariosDemanda.Api.Modules.Inventario.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<InventariosDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("InventariosDb")
    ));

builder.Services.AddScoped<ProductoService>();
builder.Services.AddScoped<DashboardService>();

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapProductoEndpoints();
app.MapDashboardEndpoints();

app.Run();