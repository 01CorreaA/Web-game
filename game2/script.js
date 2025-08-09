document.addEventListener("DOMContentLoaded", () => {
    // Elementos del DOM (pantallas, botón, mensaje)
    const startScreen = document.getElementById("startScreen");
    const gameScreen = document.getElementById("gameScreen");
    const startButton = document.getElementById("startButton");


    // Canvas y contexto
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Variables del juego Breakout / Arkanoid
    let ballX = canvas.width / 2;
    let ballY = canvas.height - 30;
    let dx = 2;
    let dy = -2;
    const ballRadius = 8;

    // Paleta
    const paddleHeight = 10;
    const paddleWidth = 75;
    let paddleX = (canvas.width - paddleWidth) / 2;
    let rightPressed = false;
    let leftPressed = false;

    // Ladrillos
    const brickRowCount = 4;
    const brickColumnCount = 6;
    const brickWidth = 60;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 35;
    let score = 0;

    const bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }

    // Variables para control de pausa y toques en pantalla
    let gamePaused = false;
    let screenTouches = 0;

    // Eventos del teclado para mover la paleta
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    function keyDownHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
        else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    }

    function keyUpHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
        else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
    }

    // Función para reiniciar el juego
    function resetGame() {
        ballX = canvas.width / 2;
        ballY = canvas.height - 30;
        dx = 2;
        dy = -2;
        paddleX = (canvas.width - paddleWidth) / 2;
        score = 0;
        // Reactivar todos los ladrillos
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                bricks[c][r].status = 1;
            }
        }
        gamePaused = false;
        screenTouches = 0;
        startScreen.style.display = "flex";
        gameScreen.style.display = "none";
        message.classList.add("hidden");
        message.style.display = "none";
        message.innerHTML = "";
    }

    // Funciones de dibujo en el canvas
    function drawBall() {
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#09f";
        ctx.fill();
        ctx.closePath();
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = "#0f0";
        ctx.fill();
        ctx.closePath();
    }

    function drawBricks() {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                if (bricks[c][r].status === 1) {
                    let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                    let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                    bricks[c][r].x = brickX;
                    bricks[c][r].y = brickY;
                    ctx.beginPath();
                    ctx.rect(brickX, brickY, brickWidth, brickHeight);
                    ctx.fillStyle = "#f33";
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    function drawScore() {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText("Puntos: " + score, 8, 20);
    }

    // Detección de colisiones entre la bola y los ladrillos
    function collisionDetection() {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    if (
                        ballX > b.x &&
                        ballX < b.x + brickWidth &&
                        ballY > b.y &&
                        ballY < b.y + brickHeight
                    ) {
                        dy = -dy;
                        b.status = 0;
                        score++;
                        // Si se destruyen todos los ladrillos, cambia de pagina
                        if (score === brickRowCount * brickColumnCount) {
                            window.location.href = "../game3/index.html";
                        }
                    }
                }
            }
        }
    }


    // Bucle principal del juego
    function draw() {
        if (gamePaused) {
            // Si el juego está en pausa, se detiene la actualización
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        collisionDetection();

        // Rebotes en los bordes laterales y superior
        if (ballX + dx > canvas.width - ballRadius || ballX + dx < ballRadius) {
            dx = -dx;
        }
        if (ballY + dy < ballRadius) {
            dy = -dy;
        } else if (ballY + dy > canvas.height - ballRadius) {
            // Comprueba colisión con la paleta en el fondo
            if (ballX > paddleX && ballX < paddleX + paddleWidth) {
                dy = -dy;
            } else {
                alert("💥 Game Over");
                resetGame();  // Reinicia el juego automáticamente tras aceptar el alert
                return;
            }
        }

        // Movimiento de la paleta
        if (rightPressed && paddleX < canvas.width - paddleWidth) {
            paddleX += 5;
        } else if (leftPressed && paddleX > 0) {
            paddleX -= 5;
        }

        ballX += dx;
        ballY += dy;
        requestAnimationFrame(draw);
    }

    // Función para pausar/reanudar el juego al tocar la pantalla
    function touchScreen() {
        gamePaused = !gamePaused;
        screenTouches++;
        if (gamePaused) {
            createConfettiEffect();
        }
        if (screenTouches >= 4) {
            alert("GAME OVER... El juego se reinicia.");
            resetGame();
        }
    }

    // Escuchar toques/clics en la pantalla del juego
    gameScreen.addEventListener("click", touchScreen);


    // Inicia el juego al pulsar el botón de inicio: cambia de pantalla y comienza el bucle
    startButton.addEventListener("click", function () {
        startScreen.style.display = "none"; // Oculta la pantalla de inicio
        gameScreen.style.display = "flex";   // Muestra la pantalla del juego
        draw(); // Inicia el bucle del juego
    });
});
