<?php
// Código PHP para obtener los datos de los cierres diarios
$servername = "localhost";
$username = "root";
$password = "39090169";
$dbname = "esp32_report";

// Crear conexión a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar la conexión
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Consultar los cierres diarios
$sql_closes = "SELECT close_date FROM daily_closes ORDER BY close_date ASC";
$result_closes = $conn->query($sql_closes);

$cierres = [];
if ($result_closes->num_rows > 0) {
    while ($row = $result_closes->fetch_assoc()) {
        $cierres[] = $row['close_date'];
    }
}

// Eliminar fechas duplicadas
$cierres = array_unique($cierres);

// Generar el HTML para los cierres diarios
$cierres_html = "";
foreach ($cierres as $fecha_cierre) {
    $cierres_html .= "
        <div class='row'>
            <div class='cell-group'>
                <div class='cell title'>Cierre Diario</div>
                <div class='cell content'>$fecha_cierre</div>
            </div>
        </div>
    ";
}

// Devolver el HTML en formato JSON
echo json_encode([
    'cierres' => $cierres_html
]);
?>