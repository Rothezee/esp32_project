<?php
// Habilitar informes de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include('config.php');
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];
    
    // Preparar la consulta utilizando PDO
    $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = :username");
    $stmt->bindValue(':username', $username);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $hashed_password = $user['password'];
        
        if (password_verify($password, $hashed_password)) {
            $_SESSION['username'] = $username;
            header("Location: dashboard.php");
            exit();
        } else {
            echo "Invalid credentials";
        }
    } else {
        echo "No user found";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">    
    <title>Login</title>    
</head>
<body>
    <div class="container-login">
        <div class="login-container">
            <h2>Login</h2>
            <form method="post" action="">
                <div class="input-group">
                    Username: <input type="text" name="username" required><br>
                </div>
                <div class="input-group">
                    Password: <input type="password" name="password" required><br>
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    </div>
    <script src="script/main.js"></script>
</body>
</html>
