namespace InventariosDemanda.Api.Modules.Inventario.Models;

public class Producto
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Categoria { get; set; } = string.Empty;

    public int StockActual { get; set; }

    public int StockMinimo { get; set; }

    public int StockMaximo { get; set; }

    public decimal Precio { get; set; }
}
