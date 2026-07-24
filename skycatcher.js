const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const caughtText = document.getElementById("caught");
const powerText = document.getElementById("power");

const keys = {};

let player;
let items;
let score;
let lives;
let caught;
let frame;
let gameOver;
let power;
let powerEnd;
let animationId;

function startGame() {
  cancelAnimationFrame(animationId);

  player = {
    x: 205,
    y: 550,
    width: 90,
    height: 25,
    speed: 7
  };

  items = [];
  score = 0;
  lives = 3;
  caught = 0;
  frame = 0;
  gameOver = false;
  power = null;
  powerEnd = 0;

  updateText();
  animationId = requestAnimationFrame(gameLoop);
}

function createItem() {
  const isBomb = Math.random() < 0.2;

  items.push({
    x: Math.random() * 460,
    y: -35,
    size: 35,
    speed: 2.5 + Math.random() * 2,
    type: isBomb ? "bomb" : "star"
  });
}

function activatePower() {
  const choices = ["wide", "slow", "double"];
  power = choices[Math.floor(Math.random() * choices.length)];
  powerEnd = Date.now() + 6000;

  if (power === "wide") {
    player.width = 160;
    powerText.textContent = "Power-up: Giant Basket!";
  }

  if (power === "slow") {
    powerText.textContent = "Power-up: Slow Motion!";
  }

  if (power === "double") {
    powerText.textContent = "Power-up: Double Points!";
  }
}

function removePower() {
  power = null;
  player.width = 90;
  powerText.textContent = "No power-up";
}

function collision(item) {
  return (
    item.x < player.x + player.width &&
    item.x + item.size > player.x &&
    item.y < player.y + player.height &&
    item.y + item.size > player.y
  );
}

function update() {
  frame++;

  if (keys.ArrowLeft || keys.a) {
    player.x -= player.speed;
  }

  if (keys.ArrowRight || keys.d) {
    player.x += player.speed;
  }

  player.x = Math.max(
    0,
    Math.min(canvas.width - player.width, player.x)
  );

  if (frame % 45 === 0) {
    createItem();
  }

  if (power && Date.now() > powerEnd) {
    removePower();
  }

  const speedMultiplier = power === "slow" ? 0.45 : 1;

  items.forEach(item => {
    item.y += item.speed * speedMultiplier;

    if (collision(item)) {
      item.remove = true;

      if (item.type === "bomb") {
        lives--;
      } else {
        caught++;
        score += power === "double" ? 20 : 10;

        if (caught % 8 === 0) {
          activatePower();
        }
      }
    }

    if (item.y > canvas.height) {
      item.remove = true;

      if (item.type === "star") {
        lives--;
      }
    }
  });

  items = items.filter(item => !item.remove);

  if (lives <= 0) {
    gameOver = true;
  }

  updateText();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Clouds
  ctx.font = "45px Arial";
  ctx.fillText("☁️", 40, 90);
  ctx.fillText("☁️", 350, 160);
  ctx.fillText("☁️", 170, 260);

  // Basket
  ctx.fillStyle = power === "wide" ? "gold" : "#9b5c2e";
  ctx.fillRect(
    player.x,
    player.y,
    player.width,
    player.height
  );

  ctx.fillStyle = "#603719";
  ctx.fillRect(
    player.x + 8,
    player.y - 10,
    player.width - 16,
    10
  );

  // Falling objects
  ctx.font = "32px Arial";

  items.forEach(item => {
    ctx.fillText(
      item.type === "bomb" ? "💣" : "⭐",
      item.x,
      item.y + item.size
    );
  });
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "40px Arial";
  ctx.fillText("Game Over!", canvas.width / 2, 270);

  ctx.font = "24px Arial";
  ctx.fillText(
    `Final score: ${score}`,
    canvas.width / 2,
    315
  );

  ctx.textAlign = "left";
}

function updateText() {
  scoreText.textContent = score;
  livesText.textContent = lives;
  caughtText.textContent = caught;
}

function gameLoop() {
  if (gameOver) {
    draw();
    drawGameOver();
    return;
  }

  update();
  draw();

  animationId = requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", event => {
  keys[event.key] = true;
  keys[event.key.toLowerCase()] = true;

  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", event => {
  keys[event.key] = false;
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", event => {
  const rectangle = canvas.getBoundingClientRect();
  const scale = canvas.width / rectangle.width;

  const mouseX =
    (event.clientX - rectangle.left) * scale;

  player.x = mouseX - player.width / 2;
});

document
  .getElementById("restart")
  .addEventListener("click", startGame);

startGame();
