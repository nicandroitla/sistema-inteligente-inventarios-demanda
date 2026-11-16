
using System.IdentityModel.Tokens.Jwt;
using InventariosDemanda.Api.Modules.Alertas;
using InventariosDemanda.Api.Modules.Dashboard;
using InventariosDemanda.Api.Modules.Demanda;
using InventariosDemanda.Api.Modules.Inventario;
using InventariosDemanda.Api.Modules.Inventario.Data;
using InventariosDemanda.Api.Modules.Inventario.Movimientos;
using InventariosDemanda.Api.Modules.Inventario.Movimientos.Services;
using InventariosDemanda.Api.Modules.Inventario.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// 1. BASE DE DATOS SQL SERVER
// ============================================

builder.Services.AddDbContext<InventariosDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("InventariosDb")
    ));

// ============================================
// 2. CONFIGURACIÓN DE SUPABASE
// ============================================

var supabaseUrl = "https://qqwlhsbowvafuxeuwrhk.supabase.co";

// ============================================
// 3. AUTENTICACIÓN JWT CON CLAVES PÚBLICAS JWKS
// ============================================

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        // Obtener automáticamente las claves públicas de Supabase.
        options.MetadataAddress =
            $"{supabaseUrl}/auth/v1/.well-known/openid-configuration";

        options.RequireHttpsMetadata = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",

            ValidateAudience = true,
            ValidAudience = "authenticated",

            ValidateLifetime = true,
            RequireExpirationTime = true,

            ValidateIssuerSigningKey = true,
            RequireSignedTokens = true,

            // Supabase utiliza ES256 para los tokens firmados
            // mediante claves asimétricas.
            ValidAlgorithms = new[]
            {
                SecurityAlgorithms.EcdsaSha256
            },

            ClockSkew = TimeSpan.FromSeconds(30)
        };

        // Diagnóstico temporal sin mostrar el token.
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine(
                    "JWT ERROR: " +
                    context.Exception.GetType().Name);

                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                Console.WriteLine(
                    "JWT CHALLENGE: " +
                    (string.IsNullOrEmpty(context.Error)
                        ? "No especificado"
                        : context.Error));

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ============================================
// 4. CORS PARA EL FRONTEND
// ============================================

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

// ============================================
// 5. SERVICIOS DEL SISTEMA
// ============================================

builder.Services.AddScoped<ProductoService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<AlertaService>();
builder.Services.AddScoped<DemandaService>();
builder.Services.AddScoped<MovimientoInventarioService>();

builder.Services.AddOpenApi();

// ============================================
// 6. CONSTRUCCIÓN DE LA APLICACIÓN
// ============================================

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("Frontend");

// Autenticación antes de autorización.
app.UseAuthentication();
app.UseAuthorization();

// ============================================
// 7. ENDPOINTS DEL SISTEMA
// ============================================

app.MapProductoEndpoints();
app.MapDashboardEndpoints();
app.MapMovimientoInventarioEndpoints();
app.MapAlertaEndpoints();
app.MapDemandaEndpoints();

// ============================================
// 8. INICIAR API
// ============================================

app.Run();
