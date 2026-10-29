
using Microsoft.EntityFrameworkCore;
using InventariosDemanda.Api.Modules.Inventario.Models;
using InventariosDemanda.Api.Modules.Inventario.Movimientos;
using InventariosDemanda.Api.Modules.Demanda;

namespace InventariosDemanda.Api.Modules.Inventario.Data;

public class InventariosDbContext : DbContext
{
    public InventariosDbContext(DbContextOptions<InventariosDbContext> options)
        : base(options)
    {
    }

    public DbSet<Producto> Productos => Set<Producto>();

    public DbSet<MovimientoInventario> MovimientosInventario =>
        Set<MovimientoInventario>();

    public DbSet<DemandaProducto> DemandasProducto =>
    Set<DemandaProducto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Producto>()
            .Property(p => p.Precio)
            .HasPrecision(18, 2);

        modelBuilder.Entity<MovimientoInventario>()
            .Property(m => m.Tipo)
            .HasMaxLength(10)
            .IsRequired();

        modelBuilder.Entity<MovimientoInventario>()
            .Property(m => m.Descripcion)
            .HasMaxLength(250);

        modelBuilder.Entity<MovimientoInventario>()
            .HasOne(m => m.Producto)
            .WithMany()
            .HasForeignKey(m => m.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
