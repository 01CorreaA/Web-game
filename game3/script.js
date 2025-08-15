
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
let scaredGhostImage;

// X = wall, O = skip, P = pac man, 'C' = power
// Ghosts: b = blue, o = orange, p = pink, r = red
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X                 X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "O    X         XC O",
    "XXXX XXXX XXXX XXXX",
    "XXXX XXXX XXXX XXXX",
    "XXXX XCXXrXX X XXXX",
    "O      bp o       O",
    "XXXX X XXXXX X XXXX",
    "X            X   XX",    
    "XXXX X XXXXX X XXXX",
    "X          X      X",
    "X XX XXX X XXX XX X",
    "X X    P       X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X  C X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const teleportTiles = new Set(); 
const foods = new Set();
const ghosts = new Set();
let pacman;
let ghostArray = [];

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
    for (let ghost of ghostArray) {
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
    update();
    document.addEventListener("keyup", movePacman);
};

function loadImages() {
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
    scaredGhostImage = new Image();
    scaredGhostImage.src = "./Image/scaredGhost.png";


}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();
    ghostArray = [];            

    pacman = null;

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar == 'X') {
                walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            } else if (['b','o','p','r'].includes(tileMapChar)) {
                let img = tileMapChar === 'b' ? blueGhostImage :        
                        tileMapChar === 'o' ? orangeGhostImage :
                        tileMapChar === 'p' ? pinkGhostImage : redGhostImage;
                const ghost = new Block(img, x, y,tileSize, tileSize);
                ghost.active = false;
                ghosts.add(ghost);
                ghostArray.push(ghost);
            } else if (tileMapChar == 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            } else if (tileMapChar == ' ') {
                const food = new Block(null, x + 14, y + 14, 4, 4);
                foods.add(food);
            } else if (tileMapChar == 'O') {
                // Teletransporte (pared para fantasmas, especial para Pac-Man)
                const teleportTile = new Block(null, x, y, tileSize, tileSize);
                teleportTile.isTeleport = true;
                teleportTiles.add(teleportTile);
            } else if (tileMapChar == 'C') {
            const powerPellet = new Block(null, x + 8, y + 8, 16, 16);
            powerPellet.isPowerPellet = true;
            foods.add(powerPellet);
            }
        }
    }
    if (ghostArray[0]) ghostArray[0].active = true;
    if (ghostArray[1]) ghostArray[1].active = true;
}

setInterval(() => {
    for (let ghost of ghostArray) {
        if (!ghost.active) continue;

        const dx = pacman.x - ghost.x;
        const dy = pacman.y - ghost.y;
        const targetDx = scaredMode ? -dx : dx;
        const targetDy = scaredMode ? -dy : dy;
        const horizontalDir = targetDx > 0 ? 'R' : 'L';
        const verticalDir = targetDy > 0 ? 'D' : 'U';

        function canMove(direction) {
            let tempX = ghost.x;
            let tempY = ghost.y;
            const step = tileSize / 4;
            if (direction === 'U') tempY -= step;
            else if (direction === 'D') tempY += step;
            else if (direction === 'L') tempX -= step;
            else if (direction === 'R') tempX += step;

            for (let wall of walls) {
                if (collision({x: tempX, y: tempY, width: ghost.width, height: ghost.height}, wall)) {
                    return false;
                }
            }
            for (let teleport of teleportTiles) {
            if (collision({x: tempX, y: tempY, width: ghost.width, height: ghost.height}, teleport)) {
            return false; 
        }
    }

            return true;
        }

        let newDirection = Math.abs(targetDx) > Math.abs(targetDy) ? horizontalDir : verticalDir;
        if (!canMove(newDirection)) {
            const altDirection = newDirection === horizontalDir ? verticalDir : horizontalDir;
            if (canMove(altDirection)) {
                newDirection = altDirection;
            } else {
                if (canMove(ghost.direction)) {
                    newDirection = ghost.direction;
                } else {
                    const validDirections = directions.filter(dir => canMove(dir));
                    if (validDirections.length > 0) {
                        newDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
                    }
                }
            }
        }
        ghost.updateDirection(newDirection);
    }
}, 500); 


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
        if (wall.image) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
        }
    }

    for (let food of foods.values()) {
        if (food.isPowerPellet) {
        const gradient = context.createRadialGradient(
            food.x + food.width / 2, food.y + food.height / 2, 2,
            food.x + food.width / 2, food.y + food.height / 2, 8
        );
        gradient.addColorStop(0, 'white');

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(food.x + food.width / 2, food.y + food.height / 2, 8, 0, Math.PI * 2);
        context.fill();
    } else {
        context.fillStyle = "white";
        context.fillRect(food.x, food.y, food.width, food.height);
    }
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
    const isOnTeleport = [...teleportTiles].some(tp =>
    tp.x === pacman.x && tp.y === pacman.y
);
    if (pacman.nextDirection && onTile) {
    if (isOnTeleport && (pacman.nextDirection === 'U' || pacman.nextDirection === 'D')) {
        pacman.nextDirection = null;
    } else {
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
}

    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    if (pacman.x < -pacman.width) pacman.x = boardWidth;
    if (pacman.x > boardWidth) pacman.x = -pacman.width;

    for (let wall of walls.values()) {
        if (!wall.onlyForGhosts && collision(pacman, wall)) {   
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of Array.from(ghosts)) {
        if (!ghost.active) continue;
        const nextX = ghost.x + ghost.velocityX;
        const nextY = ghost.y + ghost.velocityY;
        let willCollide = false;
        for (let wall of walls.values()) {   
            if (collision({ x: nextX, y: nextY, width: ghost.width, height: ghost.height }, wall)) {
                willCollide = true;
                break;
            }
        } 
        if (!willCollide) {
        for (let teleport of teleportTiles) {
            if (collision({ x: nextX, y: nextY, width: ghost.width, height: ghost.height }, teleport)) {
                willCollide = true;
                break;
            }
        }
    }  
        if (!willCollide) {
        ghost.x = nextX;
        ghost.y = nextY;
        } else {
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
        if (collision(ghost, pacman)) {
            if (scaredMode) {
            ghost.active = false;
            ghosts.delete(ghost); 
            ghostArray = ghostArray.filter(g => g !== ghost);
            score += 200;
            for (let g of ghostArray) {
            if (!g.active) {
                g.active = true;
                const newDirection = directions[Math.floor(Math.random() * 4)];
                g.updateDirection(newDirection);
                break; 
            }
        }
        } else {
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
            break; 
        }
    }
}

    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            if (food.isPowerPellet) {
            activateScaredMode();
            score += 50;
        } else {
            score += 10;
        }
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

let scaredMode = false;
let scaredTimer;

function activateScaredMode() {
    scaredMode = true;
    for (let ghost of ghosts.values()) {
        ghost.image = scaredGhostImage;
    }

    clearTimeout(scaredTimer);
    scaredTimer = setTimeout(() => {
        scaredMode = false;
        for (let ghost of ghosts.values()) {
            ghost.resetImage(); // Restablece su imagen original
        }
    }, 6000); // 6 segundos de miedo
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
        <h2>¡Felicidades! Mor has ganado el juego </h2>
            Hola, gatito, ¿cómo estás? Jejeje <br>
            Mmm... otra vez hice un pequeño juego para ti. Espero que te haya gustado jsjs.<br>
            Y pues, solo quería desearte mucha suerte. No sé si el viernes nos veremos, <br>
            pero yo espero que sí. También quiero ver cómo juegas 😆 , WA<br><br>
            
            Bueno, suerte de verdad, ya sabes por tu viaje y todo eso. En fin...<br>
            <strong>¡FELIZ 1 AÑO Y 3 MESES, GATITOOOO! WAAAAAAAAAAAA</strong> <br><br>

            Todo esto me emociona, y estar contigo es simplemente increíble jejeje.<br>
            Me alegra muchísimo que seas mi pareja. Siento que hace tiempo no te hacía <br>
            un jueguito como este, pero sabes que siempre me tenés a tu lado. Quizá no físicamente, <br>
            pero siempre puedes escribirme o llamarme, y estaré ahí para escucharte y hablar contigo.<br><br>
            (Bueno, al menos por ahora, porque después me vas a ver hasta en tus sueños... <br>
            aunque creo que ya lo hago, tú sabes jajajaja )<br><br>

            En fin... ¡aaaaa es un waaa!<br>
            Cada día contigo es una emoción, una alegría, un wa constante.<br>
            Sos único, morcito. Único para mí, porque te convertiste en mi todo.<br>
            Te elegí, y te seguiría eligiendo siempre. Verte es hermoso. <br>
            Me escuchás, me hacés reír con tus ocurrencias, y contigo soy feliz.<br><br>

            No solo por momentos, no solo por las risas: incluso después de eso, <br>
            seguís alegrando mis días, mi vida. Como decís vos: hay que disfrutar el momento, <br>
            porque el futuro es incierto. Por eso a tu lado quiero estar, incluso en el cielo o en el infierno,<br>
            porque ni la vida ni la muerte nos podran separar, ya que en vos encontré a mi pareja, <br>
            mi compañero, mi confidente... mi todo. 
            B   ueno en fin de AMOOOO mucho    
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
        this.originalImage = image; 
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.startX = x;
        this.startY = y;

        this.direction = 'R';
        this.nextDirection = null; 
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
    resetImage() {
    this.image = this.originalImage;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = 'R';
        this.nextDirection = null; 
        this.velocityX = 0;
        this.velocityY = 0;
    }
}