
//board
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

let blueGhostImage;
let orangeGhostImage;
let pinkGhostImage;
let redGhostImage;
let pacmanUpImage;
let pacmanDownImage;
let pacmanLeftImage;
let pacmanRightImage;
let wallImage;

// X = wall, O = skip, P = pac man, ' ' = food
// Ghosts: b = blue, o = orange, p = pink, r = red
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X                 X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "O    X         X  O",
    "XXXX XXXX XXXX XXXX",
    "XXXX XXXX XXXX XXXX",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
    "XXXX X XXXXX X XXXX",
    "X            X   XX",    
    "XXXX X XXXXX X XXXX",
    "X          X      X",
    "X XX XXX X XXX XX X",
    "X X    P       X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let gameOver = false;
let gameWon = false;
let messageContainer;
let victoryMessage;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    messageContainer = document.getElementById("message-container");
    victoryMessage = document.getElementById("victory-message");

    loadImages();
    loadMap();
    for (let ghost of ghosts.values()) {
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
    update();
    document.addEventListener("keyup", movePacman);
};

function loadImages() {
    // Rutas de imágenes corregidas
    wallImage = new Image();
    wallImage.src = "./Image/wall.png";
    blueGhostImage = new Image();
    blueGhostImage.src = "./Image/blueGhost.png";
    orangeGhostImage = new Image();
    orangeGhostImage.src = "./Image/orangeGhost.png";
    pinkGhostImage = new Image();
    pinkGhostImage.src = "./Image/pinkGhost.png";
    redGhostImage = new Image();
    redGhostImage.src = "./Image/redGhost.png";
    pacmanUpImage = new Image();
    pacmanUpImage.src = "./Image/pacmanUp.png";
    pacmanDownImage = new Image();
    pacmanDownImage.src = "./Image/pacmanDown.png";
    pacmanLeftImage = new Image();
    pacmanLeftImage.src = "./Image/pacmanLeft.png";
    pacmanRightImage = new Image();
    pacmanRightImage.src = "./Image/pacmanRight.png";
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();

    pacman = null;

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar == 'X') {
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);
            } else if (tileMapChar == 'b') {
                const ghost = new Block(blueGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            } else if (tileMapChar == 'o') {
                const ghost = new Block(orangeGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            } else if (tileMapChar == 'p') {
                const ghost = new Block(pinkGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            } else if (tileMapChar == 'r') {
                const ghost = new Block(redGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            } else if (tileMapChar == 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            } else if (tileMapChar == ' ') {
                const food = new Block(null, x + 14, y + 14, 4, 4);
                foods.add(food);
            }
        }
    }
}

function update() {
    if (gameOver || gameWon) {
        return;
    }
    move();
    draw();
    setTimeout(update, 50);
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    if (pacman.x < 0) {
    context.drawImage(pacman.image, pacman.x + boardWidth, pacman.y, pacman.width, pacman.height);
} else if (pacman.x + pacman.width > boardWidth) {
    context.drawImage(pacman.image, pacman.x - boardWidth, pacman.y, pacman.width, pacman.height);
}
    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }

    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }

    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    context.fillStyle = "white";
    context.font = "14px sans-serif";
    if (gameOver) {
        context.fillText("Game Over: " + String(score), tileSize / 2, tileSize / 2);
    } else {
        context.fillText("x" + String(lives) + " " + String(score), tileSize / 2, tileSize / 2);
    }
}

function move() {
    // Lógica para el siguiente movimiento de Pac-Man
    const onTile = (pacman.x % tileSize === 0 && pacman.y % tileSize === 0);
    if (pacman.nextDirection && onTile)  {
        let tempVx = 0;
        let tempVy = 0;
        if (pacman.nextDirection === 'U') {
            tempVy = -tileSize / 4;
        } else if (pacman.nextDirection === 'D') {
            tempVy = tileSize / 4;
        } else if (pacman.nextDirection === 'L') {
            tempVx = -tileSize / 4; 
        } else if (pacman.nextDirection === 'R') {
            tempVx = tileSize / 4;
        }

        let newX = pacman.x + tempVx;
        let newY = pacman.y + tempVy;
        let collisionDetected = false;
        for (let wall of walls.values()) {
            if (collision({ x: newX, y: newY, width: pacman.width, height: pacman.height }, wall)) {
                collisionDetected = true;
                break;
            }
        }

        if (!collisionDetected) {
            if (pacman.nextDirection === 'U') pacman.image = pacmanUpImage;
            else if (pacman.nextDirection === 'D') pacman.image = pacmanDownImage;
            else if (pacman.nextDirection === 'L') pacman.image = pacmanLeftImage;
            else if (pacman.nextDirection === 'R') pacman.image = pacmanRightImage;
            
            pacman.updateDirection(pacman.nextDirection);
            pacman.nextDirection = null;
        }
    }

    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    if (pacman.x < -pacman.width) pacman.x = boardWidth;
    if (pacman.x > boardWidth) pacman.x = -pacman.width;

    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            lives -= 1;
            if (lives <= 0) {
                gameOver = true;
                alert("GAME OVER");
                setTimeout(function () {
                    alert("Solo tienes 3 vidas para el juego 3, se reiniciará por completo al pasar esas vidas");
                    window.location.href = "../game2/index.html";
                }, 100);
                return;
            }
            resetPositions();
        }

        if (ghost.y == tileSize * 9 && ghost.direction != 'U' && ghost.direction != 'D') {
            ghost.updateDirection('U');
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                const newDirection = directions[Math.floor(Math.random() * 4)];
                ghost.updateDirection(newDirection);
            }
        }
    }

    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    foods.delete(foodEaten);

    if (foods.size == 0) {
        gameWon = true;
        showVictoryMessage();
        createConfettiEffect();
        gameOver = true;
    }
}

function movePacman(e) {
    if (gameOver) {
        if (e.code === "Enter") {
            resetGame();
        }
        return;
    }

    if (e.code == "ArrowUp" || e.code == "KeyW") {
        pacman.nextDirection = 'U';
    } else if (e.code == "ArrowDown" || e.code == "KeyS") {
        pacman.nextDirection = 'D';
    } else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        pacman.nextDirection = 'L';
    } else if (e.code == "ArrowRight" || e.code == "KeyD") {
        pacman.nextDirection = 'R';
    }
}

function collision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    for (let ghost of ghosts.values()) {
        ghost.reset();
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
}

function resetGame() {
    loadMap();
    resetPositions();
    lives = 3;
    score = 0;
    gameOver = false;
    gameWon = false;

    messageContainer.classList.add('hidden');
    const confettiElements = document.querySelectorAll('.confetti');
    confettiElements.forEach(c => c.remove());

    update();
}

function showVictoryMessage() {
    messageContainer.classList.remove("hidden");
    victoryMessage.innerHTML = `
        <h2>¡Felicidades! Mor haz ganado el juego  🥳</h2>
        <p>Hola, gatito. Como estas? aca un nuevo juego pa ti jejeje <br>
        mmm otra vez hice un pequeño juego para usted, espero le guste jsjs y <br>
        </p>
    `;
}

function createConfettiEffect() {
    const numConfetti = 200;
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F1C40F", "#9B59B6", "#1ABC9C"];
    const container = document.getElementById("confetti-container");
    container.classList.remove('hidden');

    for (let i = 0; i < numConfetti; i++) {
        let confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * -window.innerHeight;

        confetti.style.left = `${startX}px`;
        confetti.style.top = `${startY}px`;

        const animationDuration = Math.random() * 3 + 2;
        confetti.style.animation = `confetti-fall ${animationDuration}s linear forwards`;

        container.appendChild(confetti);

        setTimeout(() => {
            confetti.remove();
        }, animationDuration * 1000);
    }
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.startX = x;
        this.startY = y;

        this.direction = 'R';
        this.nextDirection = null; // Nuevo
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction) {
        this.direction = direction;
        if (this.direction == 'U') {
            this.velocityX = 0;
            this.velocityY = -tileSize / 4;
        } else if (this.direction == 'D') {
            this.velocityX = 0;
            this.velocityY = tileSize / 4;
        } else if (this.direction == 'L') {
            this.velocityX = -tileSize / 4;
            this.velocityY = 0;
        } else if (this.direction == 'R') {
            this.velocityX = tileSize / 4;
            this.velocityY = 0;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = 'R';
        this.nextDirection = null; // Nuevo
        this.velocityX = 0;
        this.velocityY = 0;
    }
}