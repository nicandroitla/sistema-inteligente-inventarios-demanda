# Dificultades y soluciones del proyecto

## 1. Introducción

Durante el desarrollo del Sistema Inteligente de Inventarios y Demanda se presentaron diferentes dificultades técnicas que requirieron procesos de investigación, diagnóstico, corrección y validación.

## 2. Dificultades identificadas

### D01 - Comunicación entre frontend y backend

Problema:
Dificultades para establecer la comunicación entre los componentes del sistema.

Solución:
Configuración de las direcciones HTTPS y del cliente HTTP utilizado por el frontend.

Resultado:
Comunicación funcional entre Razor Pages y la API REST.

### D02 - Ejecución simultánea de proyectos

Problema:
El frontend y el backend requerían iniciarse de manera independiente.

Solución:
Configuración de un perfil de inicio múltiple en Visual Studio 2022.

Resultado:
Ejecución simultánea de ambos proyectos.

### D03 - Protección de los módulos

Problema:
Necesidad de restringir el acceso a usuarios no autenticados.

Solución:
Integración de Supabase, validación de tokens JWT y autorización de páginas y endpoints.

Resultado:
Las solicitudes no autenticadas evaluadas fueron rechazadas correctamente.

### D04 - Archivos bloqueados durante la compilación

Problema:
Los procesos activos impedían reemplazar determinados archivos ejecutables.

Solución:
Detención de los procesos correspondientes antes de realizar nuevas compilaciones.

Resultado:
Compilación satisfactoria de la solución.

### D05 - Duplicación de clases

Problema:
Durante la actualización del Dashboard se produjo una duplicación de clases y métodos.

Solución:
Corrección de los archivos de endpoints y servicios, respetando la separación de responsabilidades.

Resultado:
Eliminación de los errores de compilación.

### D06 - Precisión de las predicciones

Problema:
El orden de las operaciones decimales generaba diferencias en el redondeo de algunas estimaciones.

Solución:
Multiplicación de las unidades históricas por el horizonte de predicción antes de realizar la división y el redondeo superior.

Resultado:
Corrección de las proyecciones en los casos observados.

### D07 - Control de existencias

Problema:
Necesidad de evitar movimientos de salida superiores al stock disponible.

Solución:
Implementación de validaciones de existencias en la lógica de negocio.

Resultado:
Rechazo satisfactorio de las operaciones inválidas evaluadas.

### D08 - Integración de alertas y demanda

Problema:
Necesidad de relacionar las existencias actuales con las proyecciones de consumo.

Solución:
Integración del servicio de alertas con el servicio de predicciones.

Resultado:
Generación de alertas clasificadas por prioridad y recomendaciones de reposición.

### D09 - Protección de solicitudes de modificación

Problema:
Necesidad de proteger las operaciones del frontend contra solicitudes falsificadas.

Solución:
Implementación de tokens antifalsificación CSRF.

Resultado:
La solicitud POST evaluada sin token fue rechazada mediante HTTP 400.

### D10 - Adaptación a dispositivos móviles

Problema:
La distribución original de los componentes dificultaba la navegación en pantallas pequeñas.

Solución:
Implementación de estilos responsive, menú lateral desplegable y tablas con desplazamiento horizontal.

Resultado:
Navegación funcional desde dispositivos móviles.

### D11 - Acceso remoto al sistema

Problema:
La aplicación se ejecutaba únicamente en el entorno local.

Solución:
Configuración de Microsoft Dev Tunnels para exponer temporalmente el frontend.

Resultado:
Acceso remoto verificado desde un teléfono móvil.

### D12 - Generación de reportes

Problema:
Necesidad de consultar y exportar información de diferentes módulos.

Solución:
Implementación de un centro de reportes con filtros, exportación CSV y estilos de impresión.

Resultado:
Exportación CSV y vista previa de impresión verificadas.

### D13 - Conectividad con GitHub

Problema:
Fallos temporales de resolución DNS durante la sincronización del repositorio.

Solución:
Verificación de conectividad y repetición de la operación de sincronización.

Resultado:
Actualización satisfactoria de la rama remota.

### D14 - Presentación de información

Problema:
Inconsistencias en la presentación de identificadores y textos en singular y plural.

Solución:
Ajuste de las funciones de formato y presentación de indicadores.

Resultado:
Mayor claridad y consistencia visual.

## 3. Aprendizajes obtenidos

- Organización de aplicaciones mediante arquitectura modular.
- Desarrollo de servicios REST.
- Integración de autenticación externa.
- Administración de bases de datos mediante Entity Framework Core.
- Implementación de reglas de negocio.
- Análisis estadístico de demanda.
- Desarrollo de interfaces responsive.
- Aplicación de pruebas funcionales.
- Diagnóstico y resolución de errores.
- Control de versiones mediante Git y GitHub.
- Elaboración de documentación técnica.

## 4. Aspectos pendientes de mejora

- Automatización de pruebas.
- Validación predictiva con datos históricos controlados.
- Auditoría integral de seguridad.
- Publicación permanente en la nube.

## 5. Conclusión

Las dificultades encontradas durante el desarrollo permitieron fortalecer las competencias técnicas y mejorar la funcionalidad, organización, seguridad y presentación del sistema dentro del alcance académico establecido.
