<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sky Catcher</title>

  <style>
    body {
      margin: 0;
      background: #182033;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    }

    h1 {
      margin-bottom: 5px;
    }

    #info {
      margin: 10px;
      font-size: 18px;
    }

    canvas {
      display: block;
      width: min(95vw, 500px);
      height: auto;
      margin: auto;
      background: linear-gradient(#75cfff, #eafaff);
      border: 4px solid white;
      border-radius: 10px;
    }

    button {
      margin: 15px;
      padding: 10px 22px;
      font-size: 17px;
      cursor: pointer;
    }

    #power {
      color: #ffe45c;
      font-weight: bold;
    }
  </style>
</head>

<body>
  <h1>Sky Catcher</h1>
  <p>Move with ← → or A/D. Catch stars and avoid bombs.</p>

  <div id="info">
    Score: <span id="score">0</span> |
    Lives: <span id="lives">3</span> |
    Caught: <span id="caught">0</span>
    <br>
    <span id="power">No power-up</span>
  </div>

  <canvas id="game" width="500" height="600"></canvas>

  <button id="restart">Restart Game</button>

  <script>
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const scoreText = document.getElementById("score");
    const livesText = document.getElementById("lives");
    const caughtText = document.getElementById("caught");
    const powerText = document.getElementById("power");

    const keys = {};
    let animationId;

    let player;
    let items;
    let score;
    let lives;
    let caught;
    let frame;
    let gameOver;
    let powerUp;
    let powerEnd;

    function startGame() {
      cancelAnimationFrame(animationId);

      player = {
        x: 205,
        y: 545,
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
      powerUp = null;
      powerEnd = 0;

      updateDisplay();
      animationId = requestAnimationFrame(gameLoop);
    }

    function createItem() {
      const isBomb = Math.random() < 0.18;

      items.push({
        x: Math.random() * (canvas.width - 32),
        y: -35,
        size: 32,
        speed: 2.5 + Math.random() * 2,
        type: isBomb ? "bomb" : "star"
      });
    }

    function activatePowerUp() {
      const powers = ["wide", "slow", "double"];
      powerUp = powers[Math.floor(Math.random() * powers.length)];
      powerEnd = Date.now() + 6000;

      if (powerUp === "wide") {
        player.width = 160;
        powerText.textContent = "POWER-UP: Giant Basket!";
      }

      if (powerUp === "slow") {
        powerText.textContent = "POWER-UP: Slow Motion!";
      }

      if (powerUp === "double") {
        powerText.textContent = "POWER-UP: Double Points!";
      }
    }

    function removePowerUp() {
      powerUp = null;
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

      if (keys["ArrowLeft"] || keys["a"]) {
        player.x -= player.speed;
      }

      if (keys["ArrowRight"] || keys["d"]) {
        player.x += player.speed;
      }

      player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, player.x)
      );

      if (frame % 45 === 0) {
        createItem();
      }

      if (powerUp && Date.now() > powerEnd) {
        removePowerUp();
      }

      const speedMultiplier = powerUp === "slow" ? 0.45 : 1;

      items.forEach(item => {
        item.y += item.speed * speedMultiplier;

        if (collision(item)) {
          item.remove = true;

          if (item.type === "bomb") {
            lives--;
          } else {
            caught++;
            score += powerUp === "double" ? 20 : 10;

            if (caught % 8 === 0) {
              activatePowerUp();
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

      updateDisplay();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Clouds
      ctx.font = "45px Arial";
      ctx.fillText("☁️", 40, 80);
      ctx.fillText("☁️", 360, 150);
      ctx.fillText("☁️", 170, 240);

      // Player basket
      ctx.fillStyle = powerUp === "wide" ? "#ffd43b" : "#9b5c2e";
      ctx.fillRect(player.x, player.y, player.width, player.height);

      ctx.fillStyle = "#613819";
      ctx.fillRect(
        player.x + 8,
        player.y - 10,
        player.width - 16,
        10
      );

      // Falling items
      ctx.font = "30px Arial";

      items.forEach(item => {
        ctx.fillText(
          item.type === "bomb" ? "💣" : "⭐",
          item.x,
          item.y + item.size
        );
      });
    }

    function drawGameOver() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.font = "42px Arial";
      ctx.fillText("Game Over!", canvas.width / 2, 270);

      ctx.font = "25px Arial";
      ctx.fillText(
        "Final score: " + score,
        canvas.width / 2,
        320
      );

      ctx.textAlign = "left";
    }

    function updateDisplay() {
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
      keys[event.key.toLowerCase()] = true;

      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
      }
    });

    document.addEventListener("keyup", event => {
      keys[event.key.toLowerCase()] = false;
    });

    canvas.addEventListener("mousemove", event => {
      const scale = canvas.width / canvas.getBoundingClientRect().width;
      const mouseX =
        (event.clientX - canvas.getBoundingClientRect().left) * scale;

      player.x = mouseX - player.width / 2;
    });

    canvas.addEventListener("touchmove", event => {
      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const touchX = (event.touches[0].clientX - rect.left) * scale;

      player.x = touchX - player.width / 2;
    }, { passive: false });

    document
      .getElementById("restart")
      .addEventListener("click", startGame);

    startGame();
  </script>
</body>
</html>
