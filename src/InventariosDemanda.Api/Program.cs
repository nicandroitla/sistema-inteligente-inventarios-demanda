using InventariosDemanda.Api.Modules.Dashboard;
using InventariosDemanda.Api.Modules.Inventario;
using InventariosDemanda.Api.Modules.Inventario.Data;
using InventariosDemanda.Api.Modules.Inventario.Movimientos;
using InventariosDemanda.Api.Modules.Inventario.Movimientos.Services;
using InventariosDemanda.Api.Modules.Inventario.Services;
using Microsoft.EntityFrameworkCore;
using InventariosDemanda.Api.Modules.Alertas;
using InventariosDemanda.Api.Modules.Demanda;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<InventariosDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("InventariosDb")
    ));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5146")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<ProductoService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<AlertaService>();
builder.Services.AddScoped<DemandaService>();

builder.Services.AddOpenApi();
builder.Services.AddScoped<MovimientoInventarioService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.MapProductoEndpoints();
app.MapDashboardEndpoints();
app.MapMovimientoInventarioEndpoints();
app.MapAlertaEndpoints();
app.MapDemandaEndpoints();

app.Run();