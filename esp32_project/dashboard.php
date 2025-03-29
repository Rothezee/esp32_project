<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Dashboard</title>
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
                    </ul>
                </div>
            </div>
        </nav>
    </header>
    
<main>
    <div class="container">
        <!-- Sección para las máquinas del 1 al 5 -->
        <div class="item">
            <h2 class="aaa">Maquina 1</h2>
            <span id="status_maquina_1" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_1">N/A</span></p> <br>
                <p><strong>COIN:</strong> <span id="coin_maquina_1">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_1">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_1">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_001'">Ver Reporte</button>
        </div>
        <div class="item">
            <h2 class="aaa">Maquina 2</h2>
            <span id="status_maquina_2" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_2">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_2">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_2">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_2">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_002'">Ver Reporte</button>
        </div>
        <div class="item">
            <h2 class="aaa">Maquina 3</h2>
            <span id="status_maquina_3" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_3">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_3">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_3">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_3">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_003'">Ver Reporte</button>
        </div>
        <div class="item">
            <h2 class="aaa">Maquina 4</h2>
            <span id="status_maquina_4" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_4">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_4">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_4">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_4">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_004'">Ver Reporte</button>
        </div>
        <div class="item">
            <h2 class="aaa">Maquina 5</h2>
            <span id="status_maquina_5" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_5">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_5">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_5">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_5">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_005'">Ver Reporte</button>
        </div>
    </div>

    <div class="container">
        <!-- Sección para las máquinas del 6 al 10 -->
        <div class="item">
            <h2 class="aaa">Maquina 6</h2>
            <span id="status_maquina_6" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_6">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_6">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_6">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_6">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_006'">Ver Reporte</button>
        </div>
        <div class="item">
            <h2 class="aaa">Maquina 7</h2>
            <span id="status_maquina_7" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_7">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_7">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_7">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_7">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_007'">Ver Reporte</button>
        </div>
        <div class="item">
            <h2 class="aaa">Maquina 8</h2>
            <span id="status_maquina_8" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_8">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_8">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_8">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_8">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_008'">Ver Reporte</button>
        </div>
        <div class="item">
            <h2 class="aaa">Maquina 9</h2>
            <span id="status_maquina_9" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_9">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_9">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_9">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_9">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_009'">Ver Reporte</button>
        </div>
        <div class="item">
            <h2 class="aaa">Maquina 10</h2>
            <span id="status_maquina_10" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>PESOS:</strong> <span id="pesos_maquina_10">N/A</span></p><br>
                <p><strong>COIN:</strong> <span id="coin_maquina_10">N/A</span></p><br>
                <p><strong>PREMIOS:</strong> <span id="premios_maquina_10">N/A</span></p><br>
                <p><strong>BANCO:</strong> <span id="banco_maquina_10">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report.php?device_id=ESP32_010'">Ver Reporte</button>
        </div>
    </div>

<div class="container">
    <!-- Sección para las EXPENDEDORAS -->
    <div class="item">
        <h2 class="aaa">EXPENDEDORA 1</h2>
        <span id="status_expendedora_1" class="status">Desconectado</span><br><br>
        <div class="machine-stats">
            <p><strong>FICHAS:</strong> <span id="fichas_expendedora_1">N/A</span></p><br>
            <p><strong>DINERO:</strong> <span id="dinero_expendedora_1">N/A</span></p><br>
        </div>
        <button onclick="window.location.href='expendedora/report_expendedora.php?device_id=EXPENDEDORA_1'">Ver Reporte</button>
    </div>
    
    <!-- Sección para otras máquinas expendedoras -->
    <div class="item">
        <h2 class="aaa">EXPENDEDORA 2</h2>
        <span id="status_expendedora_2" class="status">Desconectado</span><br><br>
        <div class="machine-stats">
            <p><strong>FICHAS:</strong> <span id="fichas_expendedora_2">N/A</span></p><br>
            <p><strong>DINERO:</strong> <span id="dinero_expendedora_2">N/A</span></p><br>
        </div>
        <button onclick="window.location.href='report_expendedora.php?device_id=EXPENDEDORA_2'">Ver Reporte</button>
    </div>
    
    <div class="item">
        <h2 class="aaa">EXPENDEDORA 3</h2>
        <span id="status_expendedora_3" class="status">Desconectado</span><br><br>
        <div class="machine-stats">
            <p><strong>FICHAS:</strong> <span id="fichas_expendedora_3">N/A</span></p><br>
            <p><strong>DINERO:</strong> <span id="dinero_expendedora_3">N/A</span></p><br>
        </div>
        <button onclick="window.location.href='report_expendedora.php?device_id=EXPENDEDORA_3'">Ver Reporte</button>
    </div>

    <div class="item">
        <h2 class="aaa">EXPENDEDORA 4</h2>
        <span id="status_expendedora_4" class="status">Desconectado</span><br><br>
        <div class="machine-stats">
            <p><strong>FICHAS:</strong> <span id="fichas_expendedora_4">N/A</span></p><br>
            <p><strong>DINERO:</strong> <span id="dinero_expendedora_4">N/A</span></p><br>
        </div>
        <button onclick="window.location.href='report_expendedora.php?device_id=EXPENDEDORA_4'">Ver Reporte</button>
    </div>
    <div class="item">
    <h2 class="aaa">EXPENDEDORA 5</h2>
    <span id="status_expendedora_5" class="status">Desconectado</span><br><br>
    <div class="machine-stats">
        <p><strong>FICHAS:</strong> <span id="fichas_expendedora_5">N/A</span></p><br>
        <p><strong>DINERO:</strong> <span id="dinero_expendedora_5">N/A</span></p><br>
    </div>
    <button onclick="window.location.href='report_expendedora.php?device_id=EXPENDEDORA_5'">Ver Reporte</button>
</div>

</div>

    <!-- VIDEOJUEGOS -->

    <div class="container">
        <!-- Sección para la máquina de videojuegos 1 -->
        <div class="item">
            <h2 class="aaa">Máquina de Videojuegos 1</h2>
            <span id="status_maquina_videojuego_1" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_videojuego_1">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_videojuegos.html?device_id=Videojuego_1'">Ver Reporte</button>
        </div>

        <!-- Sección para la máquina de videojuegos 2 -->
        <div class="item">
            <h2 class="aaa">Máquina de Videojuegos 2</h2>
            <span id="status_maquina_videojuego_2" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_videojuego_2">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_videojuegos.html?device_id=Videojuego_2'">Ver Reporte</button>
        </div>

        <!-- Sección para la máquina de videojuegos 3 -->
        <div class="item">
            <h2 class="aaa">Máquina de Videojuegos 3</h2>
            <span id="status_maquina_videojuego_3" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_videojuego_3">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_videojuegos.html?device_id=Videojuego_3'">Ver Reporte</button>
        </div>

        <!-- Sección para la máquina de videojuegos 4 -->
        <div class="item">
            <h2 class="aaa">Máquina de Videojuegos 4</h2>
            <span id="status_maquina_videojuego_4" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_videojuego_4">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_videojuegos.html?device_id=Videojuego_4'">Ver Reporte</button>
        </div>

        <!-- Sección para la máquina de videojuegos 5 -->
        <div class="item">
            <h2 class="aaa">Máquina de Videojuegos 5</h2>
            <span id="status_maquina_videojuego_5" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_videojuego_5">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_videojuegos.html?device_id=Videojuego_5'">Ver Reporte</button>
        </div>
    </div>

    <!-- Seccion para ticketeras -->

    <div class="container">
        <div class="item">
            <h2 class="aaa">Máquina de Tickets 1</h2>
            <span id="status_maquina_ticket_1" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_ticket_1">N/A</span></p><br>
                <p><strong>TICKETS:</strong> <span id="ticket_maquina_ticket_1">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_ticketera.html?device_id=Ticket_1'">Ver Reporte</button>
        </div>


        <div class="item">
            <h2 class="aaa">Máquina de Tickets 2</h2>
            <span id="status_maquina_ticket_2" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_ticket_2">N/A</span></p><br>
                <p><strong>TICKETS:</strong> <span id="ticket_maquina_ticket_2">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_ticketera.html?device_id=Ticket_2'">Ver Reporte</button>
        </div>

        <div class="item">
            <h2 class="aaa">Máquina de Tickets 3</h2>
            <span id="status_maquina_ticket_3" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_ticket_3">N/A</span></p><br>
                <p><strong>TICKETS:</strong> <span id="ticket_maquina_ticket_3">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_ticketera.html?device_id=Ticket_3'">Ver Reporte</button>
        </div>


        <div class="item">
            <h2 class="aaa">Máquina de Tickets 4</h2>
            <span id="status_maquina_ticket_4" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_ticket_4">N/A</span></p><br>
                <p><strong>TICKETS:</strong> <span id="ticket_maquina_ticket_4">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_ticketera.html?device_id=Ticket_4'">Ver Reporte</button>
        </div>

        <div class="item">
            <h2 class="aaa">Máquina de Tickets 5</h2>
            <span id="status_maquina_ticket_5" class="status">Desconectado</span><br><br>
            <div class="machine-stats">
                <p><strong>COIN:</strong> <span id="coin_maquina_ticket_5">N/A</span></p><br>
                <p><strong>TICKETS:</strong> <span id="ticket_maquina_ticket_5">N/A</span></p><br>
            </div>
            <button onclick="window.location.href='report_ticketera.html?device_id=Ticket_5'">Ver Reporte</button>
        </div>
    </div>
</main>
<!-- Importar el archivo main.js -->
<script src="script/main.js"></script>
<script src="script/navbar.js"></script>
</body>
</html>
