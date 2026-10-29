
using System.ComponentModel.DataAnnotations;
using InventariosDemanda.Api.Modules.Inventario.Models;

namespace InventariosDemanda.Api.Modules.Inventario.Movimientos;

public class MovimientoInventario
{
    public int Id { get; set; }

    [Required]
    [StringLength(10)]
    public string Tipo { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Cantidad { get; set; }

    public DateTime Fecha { get; set; } = DateTime.Now;

    [StringLength(250)]
    public string Descripcion { get; set; } = string.Empty;

    public int ProductoId { get; set; }

    public Producto? Producto { get; set; }
}
