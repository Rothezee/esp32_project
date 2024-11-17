<?php
// Configuración de la conexión a la base de datos
$servername = "localhost";  // Cambia si es necesario
$username = "root";   // Cambia por tu usuario de la base de datos
$password = "39090169"; // Cambia por tu contraseña de la base de datos
$dbname = "esp32_report"; // Cambia por el nombre de tu base de datos

// Crear la conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar si la conexión tuvo éxito
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Obtener la fecha y hora actual
$fecha_actual = date('Y-m-d H:i:s');

// Insertar la fecha actual en la tabla daily_closes
$sql = "INSERT INTO daily_closes (close_date) VALUES ('$fecha_actual')";

if ($conn->query($sql) === TRUE) {
    echo "Cierre diario registrado correctamente: $fecha_actual";
} else {
    echo "Error al registrar el cierre: " . $conn->error;
}

// Cerrar la conexión
$conn->close();
?>
