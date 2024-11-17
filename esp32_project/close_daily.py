import mysql.connector
import time
from datetime import datetime

def subir_fecha():
    # Conectar a la base de datos MySQL
    conexion = mysql.connector.connect(
        host='localhost',
        user='root',          # Reemplaza con tu usuario de MySQL
        password='39090169',  # Reemplaza con tu contraseña de MySQL
        database='esp32_report'  # Reemplaza con el nombre de tu base de datos
    )
    cursor = conexion.cursor()

    # Obtener la fecha y hora actual
    fecha_actual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Insertar la fecha actual en la tabla daily_closes
    cursor.execute('INSERT INTO daily_closes (close_date) VALUES (%s)', (fecha_actual,))
    
    # Guardar (commit) los cambios y cerrar la conexión
    conexion.commit()
    cursor.close()
    conexion.close()

    print(f"Fecha {fecha_actual} subida a la tabla daily_closes.")

# Ejecutar el script cada 24 horas
while True:
    # Obtener la hora actual
    hora_actual = datetime.now().strftime('%H:%M')
    
    # Comprobar si es exactamente 23:59
    if hora_actual == '23:59':
        subir_fecha()
        time.sleep(60)  # Esperar 1 minuto para evitar múltiples inserciones en el mismo minuto
    
    time.sleep(10)  # Esperar 10 segundos antes de volver a comprobar la hora
