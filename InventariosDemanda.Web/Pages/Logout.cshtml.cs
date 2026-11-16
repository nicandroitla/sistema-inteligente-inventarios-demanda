
using InventariosDemanda.Web.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace InventariosDemanda.Web.Pages
{
    [Authorize]
    public class LogoutModel : PageModel
    {
        private readonly SupabaseTokenStore _tokenStore;

        public LogoutModel(SupabaseTokenStore tokenStore)
        {
            _tokenStore = tokenStore;
        }

        public void OnGet()
        {
        }

        public async Task<IActionResult> OnPostAsync()
        {
            // Obtener el identificador de la sesión actual.
            var sessionId = User.FindFirst("session_id")?.Value;

            // Eliminar el token almacenado en el servidor.
            if (!string.IsNullOrWhiteSpace(sessionId))
            {
                _tokenStore.Eliminar(sessionId);
            }

            // Cerrar la sesión de ASP.NET Core.
            await HttpContext.SignOutAsync(
                CookieAuthenticationDefaults.AuthenticationScheme);

            // Regresar a la pantalla de inicio de sesión.
            return RedirectToPage("/Login");
        }
    }
}
