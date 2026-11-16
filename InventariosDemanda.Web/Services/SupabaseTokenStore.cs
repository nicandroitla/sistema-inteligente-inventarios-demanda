
using Microsoft.Extensions.Caching.Memory;

namespace InventariosDemanda.Web.Services;

public class SupabaseTokenStore
{
    private readonly IMemoryCache _cache;

    public SupabaseTokenStore(IMemoryCache cache)
    {
        _cache = cache;
    }

    public void Guardar(
        string sessionId,
        string accessToken,
        TimeSpan duracion)
    {
        if (string.IsNullOrWhiteSpace(sessionId) ||
            string.IsNullOrWhiteSpace(accessToken))
        {
            throw new ArgumentException(
                "La sesión y el token son obligatorios.");
        }

        if (duracion <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(
                nameof(duracion),
                "La duración debe ser mayor que cero.");
        }

        _cache.Set(
            $"supabase-token:{sessionId}",
            accessToken,
            duracion);
    }

    public string? Obtener(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
        {
            return null;
        }

        return _cache.Get<string>(
            $"supabase-token:{sessionId}");
    }

    public void Eliminar(string sessionId)
    {
        if (!string.IsNullOrWhiteSpace(sessionId))
        {
            _cache.Remove(
                $"supabase-token:{sessionId}");
        }
    }
}
