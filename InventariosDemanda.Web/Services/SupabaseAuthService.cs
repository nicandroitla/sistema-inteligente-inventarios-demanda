
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace InventariosDemanda.Web.Services;

public class SupabaseAuthService
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _publishableKey;

    public SupabaseAuthService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;

        _supabaseUrl = configuration["Supabase:Url"]
            ?? throw new InvalidOperationException(
                "No se configuró la URL de Supabase.");

        _publishableKey = configuration["Supabase:PublishableKey"]
            ?? throw new InvalidOperationException(
                "No se configuró la clave pública de Supabase.");

        _httpClient.DefaultRequestHeaders.Add(
            "apikey", _publishableKey);
    }

    public async Task<(bool Exito, string Mensaje)> RegistrarAsync(
        string correo,
        string contrasena)
    {
        var datos = new
        {
            email = correo,
            password = contrasena
        };

        try
        {
            using var respuesta = await _httpClient.PostAsJsonAsync(
                $"{_supabaseUrl}/auth/v1/signup",
                datos);

            if (respuesta.IsSuccessStatusCode)
            {
                return (true,
                    "Registro recibido. Revisa tu correo si se requiere confirmación.");
            }

            // No mostrar datos sensibles de la respuesta.
            Console.WriteLine(
                $"Error de Supabase Auth: {(int)respuesta.StatusCode}");

            return (false,
                "Supabase rechazó el registro. Revisa los datos ingresados.");
        }
        catch (HttpRequestException)
        {
            return (false,
                "No se pudo conectar con el servicio de autenticación.");
        }
    }

    public async Task<(
        bool Exito,
        string Mensaje,
        string? Token,
        int DuracionSegundos)> IniciarSesionAsync(
        string correo,
        string contrasena)
    {
        var datos = new
        {
            email = correo,
            password = contrasena
        };

        try
        {
            using var respuesta = await _httpClient.PostAsJsonAsync(
                $"{_supabaseUrl}/auth/v1/token?grant_type=password",
                datos);

            if (!respuesta.IsSuccessStatusCode)
            {
                return (
                    false,
                    "Correo o contraseña incorrectos, o cuenta pendiente de confirmación.",
                    null,
                    0);
            }

            using var contenido =
                await respuesta.Content.ReadFromJsonAsync<JsonDocument>();

            if (contenido == null)
            {
                return (false, "La respuesta está vacía.", null, 0);
            }

            var raiz = contenido.RootElement;

            if (!raiz.TryGetProperty("access_token", out var tokenJson) ||
                !raiz.TryGetProperty("expires_in", out var duracionJson))
            {
                return (
                    false,
                    "La respuesta no contiene los datos de autenticación esperados.",
                    null,
                    0);
            }

            var token = tokenJson.GetString();

            if (!duracionJson.TryGetInt32(out int duracionSegundos) ||
                duracionSegundos <= 0 ||
                string.IsNullOrWhiteSpace(token))
            {
                return (
                    false,
                    "No se recibió un token válido.",
                    null,
                    0);
            }

            return (
                true,
                "Inicio de sesión correcto.",
                token,
                duracionSegundos);
        }
        catch (HttpRequestException)
        {
            return (
                false,
                "No se pudo conectar con el servicio de autenticación.",
                null,
                0);
        }
        catch (JsonException)
        {
            return (
                false,
                "La respuesta del servicio no tiene el formato esperado.",
                null,
                0);
        }
    }
}
