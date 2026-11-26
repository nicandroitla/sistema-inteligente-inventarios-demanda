# Arquitectura técnica del sistema

## 1. Introducción

El Sistema Inteligente de Inventarios y Demanda utiliza una arquitectura cliente-servidor modular, separando la presentación, la lógica de negocio, la autenticación y la persistencia de datos.

## 2. Componentes principales

### Frontend - .NET 8

Desarrollado mediante ASP.NET Core Razor Pages.

Responsabilidades:

- Presentación de información.
- Formularios de registro y actualización.
- Indicadores y gráficos dinámicos.
- Búsqueda y filtrado.
- Exportación de reportes.
- Gestión de sesiones.
- Comunicación con el backend.
- Adaptación a dispositivos móviles.

### Backend - .NET 9

Desarrollado mediante ASP.NET Core Minimal API.

Responsabilidades:

- Exposición de endpoints REST.
- Aplicación de reglas de negocio.
- Validación de información.
- Gestión de productos y movimientos.
- Cálculo de indicadores.
- Predicción de demanda.
- Generación de alertas.

### Persistencia

El sistema utiliza SQL Server y Entity Framework Core.

El archivo InventariosDbContext.cs administra el acceso a las entidades del sistema.

### Autenticación

Supabase proporciona los servicios de autenticación.

El frontend utiliza los siguientes servicios:

- SupabaseAuthService.cs
- SupabaseTokenStore.cs

La API protege sus endpoints mediante autorización y validación de tokens.

## 3. Diagrama de arquitectura

    Usuario
       |
       v
    Frontend Razor Pages (.NET 8) <--> Supabase Auth
       |
       | HTTPS y JWT
       v
    Backend Minimal API (.NET 9)
       |
       |-- Dashboard
       |-- Inventario
       |-- Demanda
       |-- Alertas
       |
       v
    Entity Framework Core
       |
       v
    SQL Server - InventariosDemandaDb

## 4. Organización modular

| Módulo | Archivos principales | Responsabilidad |
|---|---|---|
| Dashboard | DashboardEndpoints.cs y DashboardService.cs | Indicadores y estadísticas |
| Inventario | ProductoEndpoints.cs y ProductoService.cs | Administración de productos |
| Movimientos | MovimientoInventarioEndpoints.cs y MovimientoInventarioService.cs | Entradas y salidas |
| Demanda | DemandaEndpoints.cs, DemandaService.cs y PrediccionDto.cs | Predicciones y reposición |
| Alertas | AlertaEndpoints.cs y AlertaService.cs | Identificación de riesgos |

## 5. Modelo conceptual de datos

    Producto (1)
       |
       |---- (N) MovimientoInventario
       |
       |---- (N) DemandaProducto

### Entidad Producto

- Identificador.
- Nombre.
- Categoría.
- Stock actual.
- Stock mínimo.
- Stock máximo.
- Precio.

### Entidad MovimientoInventario

- Identificador.
- Producto asociado.
- Tipo de movimiento.
- Cantidad.
- Fecha.
- Descripción.

### Entidad DemandaProducto

- Identificador.
- Producto asociado.
- Cantidad estimada.
- Fecha de estimación.
- Período.
- Observación.

## 6. Migraciones de base de datos

El proyecto dispone de tres migraciones versionadas:

1. 20260929012012_InitialCreate
2. 20261012124354_AddMovimientosInventario
3. 20261018142254_AgregarDemandasProducto

También incluye InventariosDbContextModelSnapshot.cs.

Estas migraciones permiten administrar la evolución del esquema mediante Entity Framework Core.

## 7. Endpoints principales

| Método | Ruta | Función |
|---|---|---|
| GET | /api/dashboard | Consultar indicadores |
| GET | /api/productos | Consultar productos |
| POST | /api/productos | Registrar productos |
| PUT | /api/productos/{id} | Actualizar productos |
| DELETE | /api/productos/{id} | Eliminar productos |
| GET | /api/movimientos | Consultar movimientos |
| POST | /api/movimientos | Registrar movimientos |
| DELETE | /api/movimientos/{id} | Eliminar y revertir movimientos |
| GET | /api/demanda | Consultar estimaciones |
| GET | /api/demanda/predicciones | Consultar predicciones |
| GET | /api/alertas | Consultar alertas |

El frontend utiliza rutas proxy protegidas para comunicarse con la API.

## 8. Flujo de movimientos

1. El usuario selecciona un producto.
2. Introduce el tipo y cantidad del movimiento.
3. El sistema valida los datos.
4. El backend comprueba las existencias disponibles cuando corresponde.
5. Se registra el movimiento válido.
6. Se actualiza el stock.
7. Los módulos consultan la información actualizada.

## 9. Motor de predicción

El sistema analiza las salidas de los últimos 30 días completos.

Promedio diario = Total de unidades de salida / 30.

Demanda estimada = Redondeo superior de las unidades de salida multiplicadas por el horizonte y divididas entre 30.

Horizontes disponibles:

- 7 días.
- 15 días.
- 30 días.

Stock objetivo = Mínimo entre el stock máximo y la suma de la demanda proyectada a 30 días con el stock mínimo.

Reposición sugerida = Máximo entre cero y la diferencia del stock objetivo menos el stock actual.

El cálculo utiliza un método estadístico basado en consumo histórico.

## 10. Motor de alertas

| Prioridad | Condición principal |
|---|---|
| Crítica | Producto agotado |
| Alta | Stock bajo o riesgo de agotamiento |
| Media | Reposición preventiva |
| Informativa | Exceso de inventario |

El sistema selecciona una alerta principal por producto según la clasificación implementada.

## 11. Seguridad

- Autenticación mediante Supabase.
- Autorización de páginas y endpoints.
- Validación de tokens JWT.
- Comunicación HTTPS.
- Protección antifalsificación CSRF.
- Validación de información.
- Cierre de sesión.

## 12. Reportes

El frontend integra información de los endpoints existentes para generar cinco tipos de reportes:

- Inventario.
- Movimientos.
- Demanda.
- Alertas.
- Reposición.

La exportación CSV se realiza desde el navegador, mientras que la impresión permite guardar los resultados en formato PDF.

## 13. Entorno de ejecución

| Servicio | Dirección |
|---|---|
| Frontend | https://localhost:7060 |
| API HTTPS | https://localhost:7298 |
| API HTTP | http://localhost:5014 |
| Base de datos | SQL Server local |

La demostración remota utiliza Microsoft Dev Tunnels para exponer temporalmente el frontend.

## 14. Limitaciones técnicas

- Dependencia de la información histórica disponible.
- Modelo predictivo sin aprendizaje automático.
- Validación predictiva controlada pendiente.
- Pruebas principalmente manuales.
- Publicación remota temporal.
- Valor de reposición estimado mediante el precio registrado.

## 15. Conclusión

La arquitectura modular facilita el mantenimiento, la ampliación de funcionalidades y la separación de responsabilidades entre los componentes del sistema.
