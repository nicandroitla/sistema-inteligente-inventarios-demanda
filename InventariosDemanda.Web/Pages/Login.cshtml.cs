
using InventariosDemanda.Web.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace InventariosDemanda.Web.Pages
{
    public class LoginModel : PageModel
    {
        private readonly SupabaseAuthService _authService;
        private readonly SupabaseTokenStore _tokenStore;

        public LoginModel(
            SupabaseAuthService authService,
            SupabaseTokenStore tokenStore)
        {
            _authService = authService;
            _tokenStore = tokenStore;
        }

        [BindProperty]
        [Required(ErrorMessage = "El correo es obligatorio.")]
        [EmailAddress(ErrorMessage = "Introduce un correo válido.")]
        public string Correo { get; set; } = string.Empty;

        [BindProperty]
        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        public string Contrasena { get; set; } = string.Empty;

        public string Mensaje { get; set; } = string.Empty;

        public void OnGet()
        {
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            var resultado = await _authService.IniciarSesionAsync(
                Correo,
                Contrasena);

            if (!resultado.Exito ||
                string.IsNullOrWhiteSpace(resultado.Token) ||
                resultado.DuracionSegundos <= 0)
            {
                Mensaje = resultado.Mensaje;
                return Page();
            }

            // Identificador único de la sesión.
            var sessionId = Guid.NewGuid().ToString("N");

            // Guardar el token en memoria del servidor.
            // Se utiliza un margen de 60 segundos antes de su vencimiento.
            var duracionToken = TimeSpan.FromSeconds(
                Math.Max(1, resultado.DuracionSegundos - 60));

            _tokenStore.Guardar(
                sessionId,
                resultado.Token,
                duracionToken);

            // Crear la identidad del usuario.
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, Correo),
                new Claim(ClaimTypes.Email, Correo),
                new Claim("session_id", sessionId)
            };

            var identidad = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);

            var principal = new ClaimsPrincipal(identidad);

            var propiedades = new AuthenticationProperties
            {
                IsPersistent = false,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(2)
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                propiedades);

            return RedirectToPage("/Index");
        }
    }
}
