
using System.ComponentModel.DataAnnotations;
using InventariosDemanda.Web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace InventariosDemanda.Web.Pages
{
    public class RegistroModel : PageModel
    {
        private readonly SupabaseAuthService _authService;

        public RegistroModel(SupabaseAuthService authService)
        {
            _authService = authService;
        }

        [BindProperty]
        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "Introduce un correo electrónico válido.")]
        public string Correo { get; set; } = string.Empty;

        [BindProperty]
        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
        [DataType(DataType.Password)]
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

            var resultado = await _authService.RegistrarAsync(
                Correo,
                Contrasena
            );

            Mensaje = resultado.Mensaje;

            if (resultado.Exito)
            {
                ModelState.Clear();
                Correo = string.Empty;
                Contrasena = string.Empty;
            }

            return Page();
        }
    }
}
