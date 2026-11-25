
using InventariosDemanda.Web.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Net;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// 1. CONFIGURACIÓN DE RAZOR PAGES
// ========================================

builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizePage("/Index");
    options.Conventions.AuthorizePage("/Productos");
    options.Conventions.AuthorizePage("/Movimientos");
    options.Conventions.AuthorizePage("/Demanda");
    options.Conventions.AuthorizePage("/Alertas");
    options.Conventions.AuthorizePage("/Reportes");

    options.Conventions.AllowAnonymousToPage("/Login");
    options.Conventions.AllowAnonymousToPage("/Registro");
});

// ========================================
// 2. SERVICIOS
// ========================================

builder.Services.AddHttpClient<SupabaseAuthService>();


builder.Services.AddHttpClient("InventariosApi", client =>
{
    var apiBaseUrl = builder.Configuration["InventariosApi:BaseUrl"]
        ?? "http://localhost:5014/";

    client.BaseAddress = new Uri(apiBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddMemoryCache();
builder.Services.AddSingleton<SupabaseTokenStore>();

// ========================================
// 3. AUTENTICACIÓN CON COOKIES
// ========================================

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Login";
        options.AccessDeniedPath = "/Login";

        options.Cookie.Name = "InventariosDemanda.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy =
            CookieSecurePolicy.SameAsRequest;

        options.ExpireTimeSpan = TimeSpan.FromHours(2);
        options.SlidingExpiration = true;

        // Validar que la sesión conserve su token.
        options.Events.OnValidatePrincipal = async context =>
        {
            var sessionId = context.Principal?
                .FindFirst("session_id")?.Value;

            var tokenStore = context.HttpContext
                .RequestServices
                .GetRequiredService<SupabaseTokenStore>();

            if (string.IsNullOrWhiteSpace(sessionId) ||
                string.IsNullOrWhiteSpace(
                    tokenStore.Obtener(sessionId)))
            {
                context.RejectPrincipal();

                await context.HttpContext.SignOutAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };

        // Las rutas API devuelven códigos HTTP,
        // no redirecciones a páginas HTML.
        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api-proxy"))
            {
                context.Response.StatusCode =
                    StatusCodes.Status401Unauthorized;

                return Task.CompletedTask;
            }

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api-proxy"))
            {
                context.Response.StatusCode =
                    StatusCodes.Status403Forbidden;

                return Task.CompletedTask;
            }

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

// ========================================
// 4. PROTECCIÓN ANTIFALSIFICACIÓN CSRF
// ========================================

// IMPORTANTE: registrar ANTES de builder.Build().
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "InventariosDemanda.Antiforgery";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy =
        CookieSecurePolicy.SameAsRequest;
});

// ========================================
// 5. CONSTRUIR APLICACIÓN
// ========================================

var app = builder.Build();

// ========================================
// 6. MIDDLEWARE
// ========================================

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseAntiforgery();

app.MapRazorPages();

// ========================================
// 7. OBTENER TOKEN CSRF
// ========================================

app.MapGet("/api-proxy/csrf-token", (
    HttpContext context,
    IAntiforgery antiforgery) =>
{
    var tokens = antiforgery.GetAndStoreTokens(context);

    context.Response.Headers.CacheControl = "no-store";

    return Results.Ok(new
    {
        token = tokens.RequestToken
    });
})
.RequireAuthorization();

// ========================================
// 8. FUNCIÓN COMPARTIDA DEL PROXY
// ========================================

async Task<IResult> EnviarSolicitudApiAsync(
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory,
    HttpMethod metodo,
    string ruta,
    bool incluirCuerpo = false)
{
    // ------------------------------------
    // VALIDACIÓN DE SESIÓN
    // ------------------------------------

    var sessionId =
        context.User.FindFirst("session_id")?.Value;

    if (string.IsNullOrWhiteSpace(sessionId))
    {
        return Results.Unauthorized();
    }

    var token = tokenStore.Obtener(sessionId);

    if (string.IsNullOrWhiteSpace(token))
    {
        return Results.Unauthorized();
    }

    // ------------------------------------
    // VALIDACIÓN CSRF
    // ------------------------------------

    // Las operaciones que modifican datos
    // deben presentar un token CSRF válido.
    if (metodo != HttpMethod.Get &&
        metodo != HttpMethod.Head &&
        metodo != HttpMethod.Options)
    {
        var antiforgery = context.RequestServices
            .GetRequiredService<IAntiforgery>();

        try
        {
            await antiforgery.ValidateRequestAsync(context);
        }
        catch (AntiforgeryValidationException)
        {
            return Results.Json(
                new
                {
                    mensaje = "Token de seguridad inválido o ausente. Actualiza la página e inténtalo nuevamente."
                },
                statusCode: StatusCodes.Status400BadRequest);
        }
    }

    // ------------------------------------
    // PREPARAR SOLICITUD AL BACKEND
    // ------------------------------------

    var client =
        httpClientFactory.CreateClient("InventariosApi");

    using var request = new HttpRequestMessage(
        metodo,
        ruta);

    request.Headers.Authorization =
        new AuthenticationHeaderValue("Bearer", token);

    // ------------------------------------
    // REENVIAR CUERPO JSON
    // ------------------------------------

    if (incluirCuerpo)
    {
        if (context.Request.ContentType is null ||
            !context.Request.ContentType.StartsWith(
                "application/json",
                StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest(new
            {
                mensaje = "La solicitud debe contener JSON."
            });
        }

        using var lector = new StreamReader(context.Request.Body);

        var contenidoJson = await lector.ReadToEndAsync();

        if (string.IsNullOrWhiteSpace(contenidoJson))
        {
            return Results.BadRequest(new
            {
                mensaje = "El cuerpo de la solicitud está vacío."
            });
        }

        request.Content = new StringContent(
            contenidoJson,
            System.Text.Encoding.UTF8,
            "application/json");
    }

    // ------------------------------------
    // ENVIAR SOLICITUD
    // ------------------------------------

    try
    {
        using var response = await client.SendAsync(
            request,
            context.RequestAborted);

        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            return Results.Unauthorized();
        }

        if (response.StatusCode == HttpStatusCode.Forbidden)
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden);
        }

        var contenido = await response.Content
            .ReadAsStringAsync(context.RequestAborted);

        var tipoContenido =
            response.Content.Headers.ContentType?.MediaType
            ?? "application/json";

        if (!response.IsSuccessStatusCode &&
            (int)response.StatusCode >= 500)
        {
            return Results.Json(
                new
                {
                    mensaje = "Ocurrió un error en la API."
                },
                statusCode: StatusCodes.Status502BadGateway);
        }

        return Results.Content(
            contenido,
            tipoContenido,
            statusCode: (int)response.StatusCode);
    }
    catch (HttpRequestException)
    {
        return Results.Json(
            new
            {
                mensaje = "No fue posible conectar con la API."
            },
            statusCode: StatusCodes.Status502BadGateway);
    }
    catch (TaskCanceledException)
        when (!context.RequestAborted.IsCancellationRequested)
    {
        return Results.Json(
            new
            {
                mensaje = "La API tardó demasiado en responder."
            },
            statusCode: StatusCodes.Status504GatewayTimeout);
    }
}

// ========================================
// 9. PROXY DEL DASHBOARD
// ========================================

app.MapGet("/api-proxy/dashboard", async (
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Get,
        "api/dashboard");
})
.RequireAuthorization();

// ========================================
// 10. PROXY DE PRODUCTOS
// ========================================

// Obtener todos los productos.
app.MapGet("/api-proxy/productos", async (
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Get,
        "api/productos");
})
.RequireAuthorization();

// Obtener un producto por ID.
app.MapGet("/api-proxy/productos/{id:int}", async (
    int id,
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Get,
        $"api/productos/{id}");
})
.RequireAuthorization();

// Registrar un producto.
app.MapPost("/api-proxy/productos", async (
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Post,
        "api/productos",
        incluirCuerpo: true);
})
.RequireAuthorization();

// Actualizar un producto.
app.MapPut("/api-proxy/productos/{id:int}", async (
    int id,
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Put,
        $"api/productos/{id}",
        incluirCuerpo: true);
})
.RequireAuthorization();

// Eliminar un producto.
app.MapDelete("/api-proxy/productos/{id:int}", async (
    int id,
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Delete,
        $"api/productos/{id}");
})
.RequireAuthorization();

// ========================================
// 11. PROXY DE MOVIMIENTOS
// ========================================

// Obtener todos los movimientos.
app.MapGet("/api-proxy/movimientos", async (
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Get,
        "api/movimientos");
})
.RequireAuthorization();

// Obtener movimiento por ID.
app.MapGet("/api-proxy/movimientos/{id:int}", async (
    int id,
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Get,
        $"api/movimientos/{id}");
})
.RequireAuthorization();

// Registrar entrada o salida de inventario.
app.MapPost("/api-proxy/movimientos", async (
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Post,
        "api/movimientos",
        incluirCuerpo: true);
})
.RequireAuthorization();

// Eliminar un movimiento.
app.MapDelete("/api-proxy/movimientos/{id:int}", async (
    int id,
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Delete,
        $"api/movimientos/{id}");
})
.RequireAuthorization();

// ========================================
// 12. PROXY DE ALERTAS
// ========================================

app.MapGet("/api-proxy/alertas", async (
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Get,
        "api/alertas");
})
.RequireAuthorization();

// ========================================
// 13. INICIAR APLICACIÓN
// ========================================


// ========================================
// PROXY DE DEMANDA INTELIGENTE
// ========================================

app.MapGet("/api-proxy/demanda/predicciones", async (
    HttpContext context,
    SupabaseTokenStore tokenStore,
    IHttpClientFactory httpClientFactory) =>
{
    return await EnviarSolicitudApiAsync(
        context,
        tokenStore,
        httpClientFactory,
        HttpMethod.Get,
        "api/demanda/predicciones");
})
.RequireAuthorization();

app.Run();


