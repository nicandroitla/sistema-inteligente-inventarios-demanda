namespace InventariosDemanda.Api.Modules.Demanda;

public class PrediccionProductoDto
{
    public int ProductoId { get; set; }

    public string Producto { get; set; } = string.Empty;

    public string Categoria { get; set; } = string.Empty;

    public int StockActual { get; set; }

    public int StockMinimo { get; set; }

    public int StockMaximo { get; set; }

    public int MovimientosSalida { get; set; }

    public int UnidadesSalida { get; set; }

    public decimal PromedioDiario { get; set; }

    public int Demanda7Dias { get; set; }

    public int Demanda15Dias { get; set; }

    public int Demanda30Dias { get; set; }

    public decimal? DiasCobertura { get; set; }

    public int StockObjetivo { get; set; }

    public int ReposicionSugerida { get; set; }

    public int DemandaNoCubierta { get; set; }

    public decimal CostoReposicion { get; set; }

    public string Estado { get; set; } = string.Empty;

    public bool TieneSalidas { get; set; }

    public decimal Participacion { get; set; }

    public string NivelDemanda { get; set; } = string.Empty;
}

public class ResumenPrediccionesDto
{
    public string Metodo { get; set; } = string.Empty;

    public int DiasHistorial { get; set; }

    public DateTime FechaDesde { get; set; }

    public DateTime FechaHasta { get; set; }

    public DateTimeOffset FechaAnalisis { get; set; }

    public int TotalProductos { get; set; }

    public int TotalSalidas { get; set; }

    public int ProductosConSalidas { get; set; }

    public int ProductosSinSalidas { get; set; }

    public int ProductosRequierenReposicion { get; set; }

    public int ProductosEnRiesgo { get; set; }

    public int DemandaTotal7Dias { get; set; }

    public int DemandaTotal15Dias { get; set; }

    public int DemandaTotal30Dias { get; set; }

    public int TotalUnidadesReposicion { get; set; }

    public decimal CostoTotalReposicion { get; set; }

    public List<PrediccionProductoDto> Predicciones { get; set; } = new();
}
