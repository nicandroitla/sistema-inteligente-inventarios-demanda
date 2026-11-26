# Documentación de pruebas del sistema

## 1. Objetivo

Verificar el funcionamiento de los módulos del Sistema Inteligente de Inventarios y Demanda, comprobando las reglas de negocio, la integración de componentes y los mecanismos de seguridad implementados.

## 2. Entorno de pruebas

- Sistema operativo: Windows 11.
- Entorno de desarrollo: Visual Studio 2022.
- Backend: ASP.NET Core .NET 9.
- Frontend: ASP.NET Core .NET 8.
- Base de datos: SQL Server.
- Autenticación: Supabase.
- Dispositivos: computadora y teléfono móvil.
- Metodología: pruebas funcionales manuales.

## 3. Pruebas funcionales

| ID | Prueba | Resultado |
|---|---|---|
| PF-01 | Inicio de sesión | Aprobada |
| PF-02 | Visualización del Dashboard | Aprobada |
| PF-03 | Registro de productos | Aprobada |
| PF-04 | Actualización de productos | Aprobada |
| PF-05 | Eliminación de producto de prueba | Aprobada |
| PF-06 | Búsqueda y filtrado de productos | Aprobada |
| PF-07 | Registro de entradas | Aprobada |
| PF-08 | Registro de salidas | Aprobada |
| PF-09 | Rechazo de salidas con stock insuficiente | Aprobada |
| PF-10 | Reversión de movimientos | Aprobada |
| PF-11 | Filtrado de movimientos | Aprobada |
| PF-12 | Visualización de predicciones de demanda | Aprobada |
| PF-13 | Recomendaciones de reposición | Aprobada |
| PF-14 | Generación de alertas críticas | Aprobada |
| PF-15 | Generación de alertas por stock bajo | Aprobada |
| PF-16 | Resolución de alertas al recuperar existencias | Aprobada |
| PF-17 | Visualización de reportes | Aprobada |
| PF-18 | Exportación CSV y apertura en Excel | Aprobada |
| PF-19 | Vista previa de impresión PDF | Aprobada |
| PF-20 | Cierre de sesión | Aprobada |

## 4. Pruebas de integración

Se creó un producto temporal para verificar la comunicación entre los módulos.

| Operación | Stock esperado | Stock obtenido |
|---|---:|---:|
| Registro inicial | 10 | 10 |
| Entrada de 15 unidades | 25 | 25 |
| Salida de 22 unidades | 3 | 3 |
| Intento de salida de 10 unidades | 3 | 3 |
| Eliminación de la salida | 25 | 25 |
| Eliminación de la entrada | 10 | 10 |

El sistema rechazó correctamente la salida que superaba las existencias disponibles.

## 5. Pruebas de alertas y reposición

Se utilizó un producto temporal con stock mínimo de 5 unidades y precio de 150.

| Stock actual | Estado esperado | Reposición sugerida | Resultado |
|---:|---|---:|---|
| 0 | Agotado | 5 | Aprobada |
| 2 | Stock bajo | 3 | Aprobada |
| 10 | Stock suficiente | 0 | Aprobada |

Se verificó la actualización de los módulos de Productos, Dashboard, Demanda, Alertas y Reportes.

## 6. Pruebas de seguridad

### Protección de páginas

Se verificó que los siguientes módulos requieren autenticación:

- Dashboard.
- Productos.
- Movimientos.
- Demanda.
- Alertas.
- Reportes.

### Protección de endpoints

| Endpoint | Respuesta sin autenticación |
|---|---|
| GET /api/dashboard | HTTP 401 |
| GET /api/productos | HTTP 401 |
| GET /api/movimientos | HTTP 401 |
| GET /api/demanda | HTTP 401 |
| GET /api/demanda/predicciones | HTTP 401 |
| GET /api/alertas | HTTP 401 |

Todos los endpoints evaluados rechazaron las solicitudes sin autenticación.

### Protección CSRF

Se realizó una solicitud POST al proxy de productos desde una sesión autenticada, sin proporcionar el token antifalsificación.

Resultado obtenido: HTTP 400 Bad Request.

El sistema rechazó la solicitud por ausencia del token de seguridad.

### Validación de información

Se intentó registrar un producto con un stock mínimo superior al stock máximo.

Resultado: la interfaz rechazó los datos y el producto no fue registrado.

### Cierre de sesión

Se verificó el cierre de sesión, la redirección al login y la restricción de acceso posterior a las páginas protegidas.

## 7. Pruebas de diseño responsive

| Prueba | Resultado |
|---|---|
| Visualización del Dashboard en teléfono | Aprobada |
| Apertura del menú móvil | Aprobada |
| Cierre del menú móvil | Aprobada |
| Navegación entre módulos | Aprobada |
| Desplazamiento horizontal de tablas | Aprobada |
| Visualización de formularios | Aprobada |
| Visualización de reportes | Aprobada |
| Navegación mediante teclado en escritorio | Aprobada |

## 8. Pruebas de compilación

Se ejecutó la compilación de la solución completa mediante dotnet build.

Resultado:

- Backend compilado correctamente.
- Frontend compilado correctamente.
- Cero errores de compilación en la última verificación.

También se verificó la sintaxis de los archivos JavaScript modificados durante las correcciones finales.

## 9. Limpieza de datos de prueba

Después de finalizar las verificaciones, se eliminaron los movimientos y el producto temporal.

Se comprobó la recuperación del estado original:

- Total de productos: 3.
- Total de unidades: 26.
- Valor del inventario: 14,100.
- Productos agotados: 0.

## 10. Limitaciones de las pruebas

- Las verificaciones fueron principalmente manuales.
- No existe una suite automatizada de pruebas versionada.
- Está pendiente la validación predictiva con datos históricos controlados.
- No se realizó una auditoría integral de seguridad.
- No se realizaron pruebas de carga o estrés.
- La exportación PDF se verificó mediante la vista previa de impresión.

## 11. Conclusión

Las pruebas realizadas permitieron comprobar el funcionamiento de los módulos principales, las operaciones de inventario, la integración de componentes y los mecanismos de seguridad evaluados.

Los resultados respaldan la presentación del sistema como proyecto académico funcional, dentro del alcance de las verificaciones realizadas.
