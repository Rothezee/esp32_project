# Historial de Cambios del Proyecto

Este documento registra todos los cambios y mejoras significativas realizadas en el proyecto `esp32_project`.

---

## Versión 1.2.0 - Documentación del Sistema de Reportes

**Fecha:** 27 de Mayo de 2024

### Objetivo

Documentar la arquitectura actual del sistema de reportes, tanto del frontend como del backend, para tener un registro claro de su funcionamiento.

### Arquitectura del Frontend (JavaScript)

El frontend se compone de varios archivos JavaScript, cada uno especializado en un tipo de máquina, que se encargan de obtener y visualizar los datos de reportes.

*   **`script/report.js`**: Gestiona los reportes para máquinas tragamonedas estándar. Calcula cierres diarios, semanales y mensuales a partir de los contadores de `pesos`, `coin`, `premios` y `banco`.
*   **`script/reportVideojuegos.js`**: Especializado en máquinas de videojuegos. Se enfoca principalmente en el contador de `coin` para los cálculos de cierres.
*   **`script/reportTicketera.js`**: Diseñado para máquinas ticketeras. Calcula los cierres basándose en los contadores de `coin` y `premios`.
*   **`script/reportExpendedora.js`**: Maneja los reportes de máquinas expendedoras. Presenta una vista detallada que fusiona "cierres diarios" con "subcierres" (parciales) realizados por empleados, mostrando una jerarquía de datos.

### Arquitectura del Backend (PHP)

#### Limpieza Automática de Reportes

*   **Componente:** `Backend/cleanup_reports.php`
*   **Descripción:** Script que se ejecuta para eliminar registros de reportes con más de 3 meses de antigüedad de las tablas `datos`, `cierres_expendedoras` y `subcierres_expendedoras`.
*   **Uso:** Puede ejecutarse manualmente a través de su URL o de forma automática mediante un Cron Job en el servidor.

---

## Versión 1.1.0 - Creación de Script de Limpieza

**Fecha:** 27 de Mayo de 2024

### Objetivo

Implementar una funcionalidad para eliminar automáticamente los reportes con más de 3 meses de antigüedad, con el fin de optimizar el espacio en la base de datos y mejorar el rendimiento general del sistema.

### Cambios y Mejoras

#### 1. Creación de Script de Limpieza

*   **Archivo Creado:** `Backend/cleanup_reports.php`
*   **Descripción:** Se ha añadido un nuevo script PHP que se encarga de realizar la limpieza de la base de datos.

#### 2. Lógica de Eliminación de Registros Antiguos

*   **Archivo Modificado:** `Backend/cleanup_reports.php`
*   **Mejora:** El script calcula una fecha de corte (3 meses hacia atrás desde el día de ejecución) y elimina todos los registros de las siguientes tablas que sean más antiguos que dicha fecha:
    *   `datos` (columna `timestamp`)
    *   `cierres_expendedoras` (columna `timestamp`)
    *   `subcierres_expendedoras` (columna `created_at`)

#### 3. Adaptación y Corrección de la Conexión a la Base de Datos

*   **Archivo Modificado:** `Backend/cleanup_reports.php`
*   **Mejora:** Inicialmente, el script intentaba usar una conexión de tipo PDO. Se corrigió para que sea 100% compatible con la conexión **MySQLi** existente en el proyecto (`conn/connection.php`), solucionando un error fatal (`Call to undefined method mysqli::setAttribute()`).

### ¿Cómo se usa?

1.  **Manualmente:** Se puede ejecutar la limpieza accediendo a la URL: `http://localhost/esp32_project/Backend/cleanup_reports.php`.
2.  **Automáticamente (Recomendado):** Se puede configurar un **Cron Job** en el servidor para que ejecute este script de forma periódica (ej. una vez al día), manteniendo la base de datos optimizada sin intervención manual.