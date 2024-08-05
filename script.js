// Получаем ссылки на элементы управления
const startButton = document.getElementById('start-button');
const backButton = document.getElementById('back-button');
const mainMenu = document.getElementById('main-menu');
const gameCanvas = document.getElementById('game-canvas');
const ctx = gameCanvas.getContext('2d');

// Инициализация переменных игры
let fruits = [];
let score = 0;
let scoreLastThreeSeconds = 0;
let isGameRunning = false;
let isMousePressed = false;
let mouseTrail = [];
let spawnIntervalId;
let scoreCounterId;
let scoreLastThreeSecondsAlpha = 1; // Для управления затуханием текста счета за последние три секунды
const gameSpeed = 1.5;
const gravity = 0.15;
const trailDecay = 0.9; // Фактор затухания следа мыши
const scoreFadeDuration = 3000; // Продолжительность затухания счета за последние три секунды (в миллисекундах)

// Установка размеров игрового холста
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;

// Класс Fruit для управления объектами фруктов в игре
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

    // Обновление состояния фрукта
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

    // Рисование фрукта на холсте
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

    // Разделение фрукта на части при разрезании
    split(direction) {
        const part1 = new Fruit(
            this.x,
            this.y,
            this.size / 1.5,
            direction.x * 4 + Math.random() * 2 - 1, // Увеличена скорость
            direction.y * 4 + Math.random() * 2 - 1, // Увеличена скорость
            this.getPastelColor(),
            this.level + 1
        );
        const part2 = new Fruit(
            this.x,
            this.y,
            this.size / 1.5,
            direction.x * 4 - Math.random() * 2 + 1, // Увеличена скорость
            direction.y * 4 - Math.random() * 2 + 1, // Увеличена скорость
            this.getPastelColor(),
            this.level + 1
        );
        part1.cut = false;
        part2.cut = false;
        return [part1, part2];
    }

    // Генерация случайного пастельного цвета для части фрукта
    getPastelColor() {
        const hue = Math.random() * 360;
        const saturation = 100;
        const lightness = 75;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
}

// Функция для создания новых фруктов
function spawnFruit() {
    const size = Math.random() * 20 + 20;
    const x = Math.random() * (gameCanvas.width - size * 2) + size;
    const y = gameCanvas.height + size;
    const speedX = Math.random() * 4 - 2;
    const speedY = Math.random() * 4 + 4;
    const color = getPastelColor();

    fruits.push(new Fruit(x, y, size, speedX, speedY, color));
}

// Функция для генерации случайного пастельного цвета
function getPastelColor() {
    const hue = Math.random() * 360;
    const saturation = 100;
    const lightness = 75;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Функция для обработки фруктов (обновление и рисование)
function handleFruits() {
    fruits.forEach(fruit => {
        fruit.update();
        fruit.draw();
    });

    fruits = fruits.filter(fruit => !fruit.markedForDeletion);
}

// Функция для обработки столкновений мыши с фруктами
function handleCollision() {
    for (let i = 0; i < mouseTrail.length - 1; i++) {
        const start = mouseTrail[i];
        const end = mouseTrail[i + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const direction = { x: dx / magnitude, y: dy / magnitude };

        fruits.forEach(fruit => {
            const distance = Math.sqrt(Math.pow(start.x - fruit.x, 2) + Math.pow(start.y - fruit.y, 2));
            if (distance < fruit.size && !fruit.cut) {
                fruit.cut = true;
                const newParts = fruit.split(direction);
                fruits.push(...newParts);
                score += fruit.level;
                scoreLastThreeSeconds += fruit.level;
            }
        });
    }
}

// Функция для рисования следа мыши
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

    // Затухание следа мыши
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

// Функция для плавного отображения счета за последние три секунды
function fadeScoreLastThreeSeconds() {
    ctx.fillStyle = `rgba(255, 255, 255, ${scoreLastThreeSecondsAlpha})`;
    ctx.font = "30px 'Bebas Neue'";
    ctx.fillText(`+ ${scoreLastThreeSeconds}`, 10, 60);
}

// Основная функция анимации игры
function animate() {
    if (!isGameRunning) return;
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    drawMouseTrail();
    handleFruits();
    handleCollision();
    fadeScoreLastThreeSeconds();

    ctx.fillStyle = 'white';
    ctx.font = "30px 'Bebas Neue'";
    ctx.fillText(`Score: ${score}`, 10, 30);

    requestAnimationFrame(animate);
}

// Функция для начала игры
function startGame() {
    mainMenu.style.display = 'none';
    gameCanvas.style.display = 'block';
    backButton.style.display = 'block';
    isGameRunning = true;
    score = 0;
    scoreLastThreeSeconds = 0;
    scoreLastThreeSecondsAlpha = 1;
    fruits = [];
    mouseTrail = [];
    animate();

    spawnIntervalId = setInterval(spawnFruit, 500); // Увеличена частота появления фруктов
    scoreCounterId = setInterval(() => {
        scoreLastThreeSecondsAlpha = 1;
        setTimeout(() => {
            scoreLastThreeSecondsAlpha = 0;
        }, scoreFadeDuration);
        scoreLastThreeSeconds = 0;
    }, 3000); // Изменено на 3 секунды
}

// Функция для остановки игры
function stopGame() {
    isGameRunning = false;
    clearInterval(spawnIntervalId);
    clearInterval(scoreCounterId);
    mainMenu.style.display = 'flex';
    gameCanvas.style.display = 'none';
    backButton.style.display = 'none';
}

// Обработчики событий для мыши
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

// Обработчики событий для сенсорных устройств
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

// Обработчик начала ввода (мышь или сенсорный экран)
function handleStart(event) {
    const rect = gameCanvas.getBoundingClientRect();
    const x = event.clientX || event.touches[0].clientX;
    const y = event.clientY || event.touches[0].clientY;
    mouseTrail = [{ x: x - rect.left, y: y - rect.top }];
}

// Обработчик движения ввода (мышь или сенсорный экран)
function handleMove(event) {
    const rect = gameCanvas.getBoundingClientRect();
    const x = event.clientX || event.touches[0].clientX;
    const y = event.clientY || event.touches[0].clientY;
    mouseTrail.push({ x: x - rect.left, y: y - rect.top });
    if (mouseTrail.length > 10) mouseTrail.shift();
    handleCollision(); // Проверка столкновений при движении мыши/сенсора
}

// Назначение обработчиков событий кнопкам
startButton.addEventListener('click', startGame);
backButton.addEventListener('click', stopGame);
ВА