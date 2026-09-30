using Microsoft.EntityFrameworkCore;
using InventariosDemanda.Api.Modules.Inventario.Models;

namespace InventariosDemanda.Api.Modules.Inventario.Data;

public class InventariosDbContext : DbContext
{
    public InventariosDbContext(DbContextOptions<InventariosDbContext> options)
        : base(options)
    {
    }

    public DbSet<Producto> Productos => Set<Producto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Producto>()
            .Property(p => p.Precio)
            .HasPrecision(18, 2);
    }
}
