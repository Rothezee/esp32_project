<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <title>Information to Machine</title>
</head>
<body>
<header>
<nav class="navbar">
            <div class="container_navbar">
                <div class="navbar-header">
                    <button class="navbar-toggler" data-toggle="open-navbar1">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    
                </div>
                <div class="navbar-menu" id="open-navbar1">
                    <ul class="navbar-nav">
                        <li class="active"><a href="dashboard.php">Home</a></li> 
                        <li><a href="#reportes" onclick="mostrarSeccion('reportes')">Reportes</a></li>
                        <li><a href="#diarios" onclick="mostrarSeccion('diarios')">Cierres Diarios</a></li>
                        <li><a href="#semanales" onclick="mostrarSeccion('semanales')">Cierres Semanales</a></li>
                        <li><a href="#mensuales" onclick="mostrarSeccion('mensuales')">Cierres Mensuales</a></li>
                        <li><a href="#graficas" onclick="mostrarSeccion('graficas')">Gráficas Comparativas</a></li>
                    </ul>
                </div>
            </div>
        </nav>
</header>
<br><br>
<center><h1 id="machine_name">Machine</h1></center>
<main>
    <section id="reportes" class="seccion">
        <table id="report_table">
            <thead>
                <tr>
                    <th>Date and Time</th>
                    <th>PESOS</th>
                    <th>COIN</th>
                    <th>PREMIOS</th>
                    <th>BANCO</th>
                </tr>
            </thead>
            <tbody>
                <!-- Los datos serán insertados aquí para pantallas grandes -->
            </tbody>
        </table>

</section>

<section id="diarios" class="seccion">
            <h2>Cierres Diarios</h2>
        <div class="reportsContainer">
            <table id="tabla-diarios">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Pesos</th>
                        <th>Coin</th>
                        <th>Premios</th>
                        <th>Banco</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Datos de cierres diarios se cargarán aquí -->
                </tbody>
            </table>
        </div>
        </section>

        <section id="semanales" class="seccion">
            <h2>Cierres Semanales</h2>
            <label for="selector-inicio-semana">Seleccione el día de inicio de la semana:</label>
            <input type="text" id="selector-inicio-semana" placeholder="Seleccionar fecha de inicio">
        
            <table id="tabla-semanales">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Pesos</th>
                        <th>Coin</th>
                        <th>Premios</th>
                        <th>Banco</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Datos de cierres semanales se cargarán aquí -->
                </tbody>
            </table>
        </section>
        
        <section id="mensuales" class="seccion">
            <h2>Cierres Mensuales</h2>
            <label for="selector-inicio-mes">Seleccione un mes:</label>
            <input type="month" id="selector-inicio-mes" placeholder="Seleccionar mes">

            <table id="tabla-mensuales">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Pesos</th>
                        <th>Coin</th>
                        <th>Premios</th>
                        <th>Banco</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Datos de cierres mensuales se cargarán aquí -->
                </tbody>
            </table>
        </section>
        
        <section id="graficas" class="seccion">
            <h2>Gráficas Comparativas</h2>
        
            <!-- Gráfica de Ganancias Diarias -->
            <h3>Ganancias Diarias</h3>
            <canvas id="grafica-ganancias-diarias" width="400" height="200"></canvas>
        
            <!-- Gráfica de Ganancias Semanales -->
            <h3>Ganancias Semanales</h3>
            <canvas id="grafica-ganancias-semanales" width="400" height="200"></canvas>
        
            <!-- Gráfica de Ganancias Mensuales -->
            <h3>Ganancias Mensuales</h3>
            <canvas id="grafica-ganancias-mensuales" width="400" height="200"></canvas>
        
            <!-- Gráfica Comparativa General -->
            <h3>Comparativa General</h3>
            <canvas id="grafica-comparativa" width="400" height="200"></canvas>
        </section>
</main>
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/plugins/monthSelect/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="script/main.js"></script>
<script src="script/report.js"></script>
<script src="script/navbar.js"></script>
</body>
</html>
