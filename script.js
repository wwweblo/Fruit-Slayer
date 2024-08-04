const startButton = document.getElementById('start-button');
const backButton = document.getElementById('back-button');
const mainMenu = document.getElementById('main-menu');
const gameCanvas = document.getElementById('game-canvas');
const ctx = gameCanvas.getContext('2d');

let fruits = [];
let score = 0;
let scoreLastSecond = 0;
let isGameRunning = false;
let isMousePressed = false;
let mouseTrail = [];
let spawnIntervalId;
let secondCounterId;
let scoreLastSecondAlpha = 1; // To control the fading of the score last second text
const gameSpeed = 1.5;
const gravity = 0.15;
const trailDecay = 0.9; // Factor for fading out the trail
const scoreFadeDuration = 2000; // Duration for fading out the score last second (in milliseconds)

gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;

class Fruit {
    constructor(x, y, size, speedX, speedY, color, level = 1) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX * gameSpeed;
        this.speedY = speedY * gameSpeed;
        this.color = color;
        this.markedForDeletion = false;
        this.cut = false;
        this.parts = [];
        this.level = level;
    }

    update() {
        if (this.cut) {
            this.parts.forEach(part => {
                part.x += part.speedX;
                part.y += part.speedY;
                part.speedY += gravity;
                part.rotation += part.rotationSpeed;
            });
            this.parts = this.parts.filter(part => part.y <= gameCanvas.height + part.size);
            if (this.parts.length === 0) this.markedForDeletion = true;
        } else {
            this.x += this.speedX;
            this.y -= this.speedY;
            this.speedY -= gravity;
            if (this.y > gameCanvas.height + this.size) this.markedForDeletion = true;
        }
    }

    draw() {
        if (this.cut) {
            this.parts.forEach(part => {
                ctx.save();
                ctx.translate(part.x, part.y);
                ctx.rotate(part.rotation);
                ctx.fillStyle = part.color;
                ctx.beginPath();
                ctx.arc(0, 0, part.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    split(direction) {
        const angle = Math.random() * Math.PI;
        const part1 = new Fruit(
            this.x,
            this.y,
            this.size / 1.5,
            direction.x + Math.cos(angle) * 2,
            -Math.abs(this.speedY) + Math.sin(angle) * 2,
            this.getPastelColor(),
            this.level + 1
        );
        const part2 = new Fruit(
            this.x,
            this.y,
            this.size / 1.5,
            direction.x - Math.cos(angle) * 2,
            -Math.abs(this.speedY) - Math.sin(angle) * 2,
            this.getPastelColor(),
            this.level + 1
        );
        part1.cut = false;
        part2.cut = false;
        return [part1, part2];
    }

    getPastelColor() {
        const hue = Math.random() * 360;
        const saturation = 100;
        const lightness = 75;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
}

function spawnFruit() {
    const size = Math.random() * 20 + 20;
    const x = Math.random() * (gameCanvas.width - size * 2) + size;
    const y = gameCanvas.height + size;
    const speedX = Math.random() * 4 - 2;
    const speedY = Math.random() * 4 + 4;
    const color = getPastelColor();

    fruits.push(new Fruit(x, y, size, speedX, speedY, color));
}

function getPastelColor() {
    const hue = Math.random() * 360;
    const saturation = 100;
    const lightness = 75;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function handleFruits() {
    fruits.forEach(fruit => {
        fruit.update();
        fruit.draw();
    });

    fruits = fruits.filter(fruit => !fruit.markedForDeletion);
}

function handleCollision() {
    for (let i = 0; i < mouseTrail.length - 1; i++) {
        const start = mouseTrail[i];
        const end = mouseTrail[i + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        fruits.forEach(fruit => {
            const distance = Math.sqrt(Math.pow(start.x - fruit.x, 2) + Math.pow(start.y - fruit.y, 2));
            if (distance < fruit.size && !fruit.cut) {
                fruit.cut = true;
                const direction = { x: dx / Math.sqrt(dx * dx + dy * dy), y: dy / Math.sqrt(dx * dx + dy * dy) };
                const newParts = fruit.split(direction);
                fruits.push(...newParts);
                score += fruit.level;
                scoreLastSecond += fruit.level;
            }
        });
    }
}

function drawMouseTrail() {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < mouseTrail.length - 1; i++) {
        const start = mouseTrail[i];
        const end = mouseTrail[i + 1];
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    }
    ctx.stroke();

    // Fade out the mouse trail
    mouseTrail.forEach(point => {
        point.alpha = (point.alpha || 1) * trailDecay;
        if (point.alpha <= 0.1) {
            point.alpha = 0;
        }
    });

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    mouseTrail.forEach((point, index) => {
        if (point.alpha > 0) {
            ctx.globalAlpha = point.alpha;
            ctx.moveTo(point.x, point.y);
            if (index < mouseTrail.length - 1) {
                const nextPoint = mouseTrail[index + 1];
                ctx.lineTo(nextPoint.x, nextPoint.y);
            }
        }
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function fadeScoreLastSecond() {
        ctx.fillStyle = `rgba(255, 255, 255, ${scoreLastSecondAlpha})`;
        ctx.font = "30px 'Bebas Neue'";
        ctx.fillText(`+ ${scoreLastSecond}`, 10, 60);
}

function animate() {
    if (!isGameRunning) return;
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    drawMouseTrail();
    handleFruits();
    handleCollision();
    fadeScoreLastSecond();

    ctx.fillStyle = 'white';
    ctx.font = "30px 'Bebas Neue'";
    ctx.fillText(`Score: ${score}`, 10, 30);

    requestAnimationFrame(animate);
}

function startGame() {
    mainMenu.style.display = 'none';
    gameCanvas.style.display = 'block';
    backButton.style.display = 'block';
    isGameRunning = true;
    score = 0;
    scoreLastSecond = 0;
    scoreLastSecondAlpha = 1;
    fruits = [];
    mouseTrail = [];
    animate();

    spawnIntervalId = setInterval(spawnFruit, 1000);
    secondCounterId = setInterval(() => {
        scoreLastSecond = 0;
    }, 1000);
}

function stopGame() {
    isGameRunning = false;
    clearInterval(spawnIntervalId);
    clearInterval(secondCounterId);
    mainMenu.style.display = 'flex';
    gameCanvas.style.display = 'none';
    backButton.style.display = 'none';
}

// Event listeners for mouse events
gameCanvas.addEventListener('mousedown', (e) => {
    isMousePressed = true;
    handleStart(e);
});

gameCanvas.addEventListener('mouseup', () => {
    isMousePressed = false;
    mouseTrail = [];
});

gameCanvas.addEventListener('mousemove', (e) => {
    if (isMousePressed) {
        handleMove(e);
    }
});

// Event listeners for touch events
gameCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isMousePressed = true;
    handleStart(e);
});

gameCanvas.addEventListener('touchend', () => {
    isMousePressed = false;
    mouseTrail = [];
});

gameCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isMousePressed) {
        handleMove(e);
    }
});

function handleStart(event) {
    const rect = gameCanvas.getBoundingClientRect();
    const x = event.clientX || event.touches[0].clientX;
    const y = event.clientY || event.touches[0].clientY;
    mouseTrail = [{ x: x - rect.left, y: y - rect.top }];
}

function handleMove(event) {
    const rect = gameCanvas.getBoundingClientRect();
    const x = event.clientX || event.touches[0].clientX;
    const y = event.clientY || event.touches[0].clientY;
    mouseTrail.push({ x: x - rect.left, y: y - rect.top });
    if (mouseTrail.length > 10) mouseTrail.shift();
    handleCollision(); // Check for collision during mouse/touch move
}

startButton.addEventListener('click', startGame);
backButton.addEventListener('click', stopGame);