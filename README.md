# Sistema Inteligente de Inventarios y Demanda

## Descripción del proyecto

Sistema web desarrollado para optimizar la gestión de inventarios, analizar el comportamiento histórico de la demanda y facilitar la toma de decisiones mediante indicadores, predicciones, alertas inteligentes y reportes dinámicos.

Proyecto académico desarrollado para el Instituto Tecnológico de las Américas (ITLA).

## Objetivo general

Desarrollar una solución tecnológica que permita administrar las existencias, anticipar necesidades de reposición y reducir los riesgos asociados al agotamiento y exceso de productos.

## Tecnologías utilizadas

| Tecnología | Aplicación |
|---|---|
| C# | Lenguaje principal del backend |
| ASP.NET Core .NET 9 | API REST |
| ASP.NET Core .NET 8 | Frontend con Razor Pages |
| SQL Server | Base de datos relacional |
| Entity Framework Core | Acceso a datos |
| Supabase | Autenticación |
| JavaScript | Interactividad y gráficos dinámicos |
| HTML5 y CSS3 | Interfaz y diseño responsive |
| Bootstrap | Componentes visuales |
| Git y GitHub | Control de versiones |
| Visual Studio 2022 | Entorno de desarrollo |
| Microsoft Dev Tunnels | Demostración remota temporal |

## Funcionalidades principales

### 1. Dashboard

- Ocho indicadores dinámicos de inventario.
- Gráficos de entradas y salidas.
- Distribución del inventario por categorías.
- Ranking de productos con mayores salidas.
- Indicadores visuales de existencias.

### 2. Productos

- Registro, consulta, actualización y eliminación.
- Búsqueda y filtros dinámicos.
- Clasificación por estado de stock.
- Indicadores visuales de disponibilidad.
- Validación de datos.

### 3. Movimientos de inventario

- Registro de entradas y salidas.
- Actualización de existencias.
- Validación de stock disponible.
- Reversión de movimientos eliminados.
- Filtros por producto, tipo y fecha.
- Balance neto histórico.

### 4. Demanda inteligente

- Análisis de los últimos 30 días completos.
- Predicciones de demanda a 7, 15 y 30 días.
- Clasificación por nivel de demanda.
- Estimación de cobertura de existencias.
- Recomendaciones de reposición.
- Estimación del valor de reposición.

### 5. Alertas inteligentes

- Productos agotados.
- Existencias por debajo del mínimo o iguales a este.
- Riesgo de agotamiento.
- Reposición preventiva.
- Exceso de inventario.
- Clasificación de alertas por prioridad.
- Recomendaciones automáticas.

### 6. Reportes

- Reporte de inventario.
- Reporte de movimientos.
- Reporte de demanda.
- Reporte de alertas.
- Reporte de reposición.
- Filtros personalizados.
- Exportación CSV compatible con Excel.
- Impresión y guardado en PDF desde el navegador.

## Arquitectura del sistema

El proyecto utiliza una arquitectura cliente-servidor con separación entre la interfaz web, la API y la capa de persistencia.

    Usuario
       |
       v
    Frontend - Razor Pages (.NET 8)
       |
       v
    Backend - API REST (.NET 9)
       |
       v
    Entity Framework Core
       |
       v
    SQL Server

Supabase proporciona los servicios de autenticación utilizados para proteger el acceso al sistema.

## Estructura del proyecto

    sistema-inteligente-inventarios-demanda/
    |
    |-- src/
    |   |-- InventariosDemanda.Api/
    |       |-- Modules/
    |       |   |-- Dashboard/
    |       |   |-- Inventario/
    |       |   |-- Demanda/
    |       |   |-- Alertas/
    |
    |-- InventariosDemanda.Web/
    |   |-- Pages/
    |   |-- wwwroot/
    |       |-- css/
    |       |-- js/
    |
    |-- docs/
    |   |-- roadmap-tecnico.md
    |
    |-- README.md
    |-- SistemaInteligenteInventariosDemanda.sln
    |-- SistemaInteligenteInventariosDemanda.slnLaunch

## Metodología de predicción

El sistema utiliza un modelo estadístico basado en el promedio diario de las salidas registradas durante los últimos 30 días completos.

Promedio diario = Unidades de salida / 30

Demanda estimada = Promedio diario x Horizonte de predicción

Las cantidades proyectadas se redondean hacia arriba para trabajar con unidades enteras.

La reposición sugerida considera la demanda estimada, el stock actual y los límites mínimos y máximos de inventario.

Este método constituye una estimación estadística y no un modelo de aprendizaje automático.

## Seguridad

- Autenticación mediante Supabase.
- Protección de páginas y endpoints.
- Validación de tokens de autenticación.
- Comunicación HTTPS.
- Protección antifalsificación CSRF.
- Validaciones de datos y existencias.
- Cierre de sesión.

Las credenciales y configuraciones sensibles deben mantenerse fuera del repositorio público.

## Requisitos de ejecución

- Visual Studio 2022.
- SDK de .NET 8 y .NET 9.
- SQL Server.
- Base de datos configurada.
- Proyecto Supabase configurado.
- Certificados HTTPS de desarrollo.

## Instalación y ejecución

1. Clonar el repositorio:

       git clone https://github.com/nicandroitla/sistema-inteligente-inventarios-demanda.git

2. Abrir SistemaInteligenteInventariosDemanda.sln en Visual Studio 2022.

3. Configurar la conexión a SQL Server y los parámetros de autenticación de Supabase.

4. Preparar la base de datos mediante las migraciones de Entity Framework Core:

       dotnet tool install --global dotnet-ef --version 9.0.13

       dotnet ef database update --project src/InventariosDemanda.Api

   Si dotnet-ef ya está instalado, no es necesario instalarlo nuevamente.
   Verificar previamente la cadena de conexión y los permisos de SQL Server.

5. Restaurar las dependencias:

       dotnet restore

6. Compilar la solución:

       dotnet build

7. Seleccionar el perfil de inicio simultáneo del frontend y backend.

8. Ejecutar mediante Ctrl + F5.

## Direcciones locales

| Componente | Dirección |
|---|---|
| Frontend | https://localhost:7060 |
| Backend HTTPS | https://localhost:7298 |
| Backend HTTP | http://localhost:5014 |

## Diseño responsive

La interfaz se adapta a computadoras y dispositivos móviles mediante:

- Menú lateral desplegable.
- Indicadores adaptables.
- Tablas con desplazamiento horizontal.
- Formularios optimizados para pantallas táctiles.
- Navegación mediante teclado.

## Pruebas realizadas

| Prueba | Resultado |
|---|---|
| Registro de productos | Satisfactorio |
| Actualización de productos | Satisfactorio |
| Eliminación de productos de prueba | Satisfactorio |
| Registro de entradas y salidas | Satisfactorio |
| Rechazo de salidas con stock insuficiente | Satisfactorio |
| Reversión de movimientos | Satisfactorio |
| Generación de alertas por agotamiento | Satisfactorio |
| Generación de alertas por stock bajo | Satisfactorio |
| Protección de páginas | Satisfactorio |
| Rechazo de consultas API sin autenticación | Satisfactorio |
| Rechazo de solicitud POST sin token CSRF | Satisfactorio |
| Validación de datos desde la interfaz | Satisfactorio |
| Exportación CSV | Satisfactorio |
| Vista previa de impresión PDF | Satisfactorio |
| Diseño móvil | Satisfactorio |
| Compilación de la solución | Satisfactorio |

Las pruebas documentadas corresponden a verificaciones funcionales y manuales.

## Dificultades y soluciones

| Dificultad | Solución implementada |
|---|---|
| Comunicación entre frontend y backend | Configuración de HTTPS y clientes HTTP |
| Protección de los módulos | Integración de Supabase y autorización |
| Archivos bloqueados durante la compilación | Detención de los procesos activos |
| Imprecisión en el redondeo de predicciones | Ajuste del orden de las operaciones matemáticas |
| Visualización en dispositivos móviles | Diseño responsive y menú desplegable |
| Exportación de información | Implementación de CSV y reportes imprimibles |
| Presentación de indicadores | Formato dinámico y correcciones gramaticales |

## Limitaciones actuales

- Las predicciones dependen de la cantidad y calidad de los datos históricos.
- El modelo no contempla estacionalidad ni factores externos.
- Está pendiente una validación predictiva con datos históricos controlados.
- Las pruebas realizadas no constituyen una auditoría integral de seguridad.
- No se dispone de una suite de pruebas automatizadas versionada.
- El acceso mediante Dev Tunnels requiere que el entorno local permanezca activo.
- El valor de reposición utiliza el precio registrado del producto, no necesariamente su costo de adquisición.

## Mejoras futuras

- Incorporación de modelos avanzados de predicción.
- Integración de proveedores y órdenes de compra.
- Notificaciones automáticas.
- Pruebas unitarias y de integración.
- Automatización de compilaciones y despliegues.
- Publicación permanente en la nube.

## Desarrollador

- Nombre: Nicandro de los Santos De los Santos.
- Matrícula: 2023-1814.
- Institución: Instituto Tecnológico de las Américas (ITLA).
- Carrera: Desarrollo de Software.
- Modalidad: Proyecto individual.

## Repositorio

https://github.com/nicandroitla/sistema-inteligente-inventarios-demanda

---
Proyecto académico orientado a la gestión inteligente de inventarios y al análisis de demanda.


## Documentación técnica complementaria

- [Roadmap técnico](docs/roadmap-tecnico.md)
- [Arquitectura técnica](docs/arquitectura-tecnica.md)
- [Pruebas funcionales](docs/pruebas-funcionales.md)
- [Dificultades y soluciones](docs/dificultades-y-soluciones.md)
