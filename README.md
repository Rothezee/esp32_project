# ESP32 Project - Monitoreo de Máquinas de Premios y Videojuegos

Este proyecto consiste en una web de monitoreo en tiempo real para sistemas basados en ESP32, como grúas de peluches, maquinitas de premios, ticketeras y videojuegos similares. Permite visualizar el estado de cada máquina conectada (encendida, jugando, entrega de premio, etc.) y generar reportes de uso y actividades.

## Características principales

- **Monitoreo en tiempo real** del funcionamiento de máquinas conectadas vía ESP32.
- Detección de eventos: encendido, actividad de juego, entrega de premios, etc.
- Dashboard y reportes visuales para administración.
- Soporte para múltiples tipos de máquinas (grúa, ticketera, videojuegos).
- Acceso mediante sistema de login.

## Estructura del proyecto

- Archivos PHP para gestión de datos, usuarios y reportes.
- Archivos HTML para interfaces de dashboard, login y reportes.
- Archivos de configuración (`config.php`, `config.json`, `users.json`).
- Scripts SQL y base de datos para almacenamiento y consultas.
- Carpetas auxiliares:  
  - `conn/`: conexiones de base de datos  
  - `css/`: estilos  
  - `img/`: imágenes  
  - `expendedora/`, `script/`: scripts y utilidades varias

## Requisitos

- **Servidor web con soporte PHP y MySQL** (por ejemplo, AppServ, XAMPP, WAMP, etc.).
- Una o varias máquinas con ESP32, programadas para enviar datos a la web.
- Navegador web moderno para visualizar el dashboard.

## Instalación

1. **Clona o descarga el repositorio** en tu servidor web.
2. **Importa los scripts SQL** (`esp32_report (3).sql`, `login_system.sql`) en tu base de datos MySQL.
3. **Configura la conexión a la base de datos** editando los archivos `config.php` y/o `config.json`.
4. **Asegúrate de que los ESP32 estén configurados** para enviar datos HTTP a las rutas correspondientes de esta web.
5. Accede mediante el navegador a `login.html` o `dashboard.html` para comenzar a usar el sistema.

## Uso

- Ingresa con tu usuario y contraseña.
- Visualiza el estado de todas las máquinas conectadas desde el dashboard.
- Consulta reportes de actividad, premios entregados y más.
- Administra usuarios y configuraciones según permisos (No tiene sistema de registro dado que solo es una pagina para administradores).

## Notas

- El sistema es extendible y puedes agregar más tipos de máquinas o sensores conectados al ESP32.

---

¿Dudas, sugerencias o quieres contribuir? ¡Abre un issue o pull request!
