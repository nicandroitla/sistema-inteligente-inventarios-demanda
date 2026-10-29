
namespace InventariosDemanda.Api.Modules.Demanda;

public class DemandaProducto
{
    public int Id { get; set; }

    public int ProductoId { get; set; }

    public int CantidadEstimada { get; set; }

    public DateTime FechaEstimacion { get; set; } = DateTime.Now;

    public string Periodo { get; set; } = "Mensual";

    public string Observacion { get; set; } = string.Empty;
}
