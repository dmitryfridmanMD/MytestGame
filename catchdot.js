<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Neon Parkour</title>

  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #080b18;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    }

    canvas {
      width: min(96vw, 900px);
      height: auto;
      border: 3px solid #54f7ff;
      background: #10152c;
      box-shadow: 0 0 20px #19dbea;
    }

    #hud {
      margin: 10px;
      font-size: 17px;
    }

    #power {
      color: #ffe25c;
      font-weight: bold;
    }

    button {
      margin-top: 12px;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>

<body>
  <h1>Neon Parkour</h1>

  <p>
    Move: A/D or ←/→ |
    Jump/Jetpack: Space |
    Dash: Shift |
    Shoot: F
  </p>

  <div id="hud">
    Health: <span id="health">3</span> |
    Score: <span id="score">0</span> |
    <span id="power">No gadget active</span>
  </div>

  <canvas id="game" width="900" height="500"></canvas>

  <br>
  <button id="restart">Restart</button>

  <script>
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const healthText = document.getElementById("health");
    const scoreText = document.getElementById("score");
    const powerText = document.getElementById("power");

    const WORLD_WIDTH = 2350;
    const GRAVITY = 0.65;

    const keys = {};
    let jumpPressed = false;
    let dashPressed = false;
    let cameraX = 0;

    let player;
    let platforms;
    let spikes;
    let lasers;
    let gadgets;
    let enemies;
    let bullets;
    let enemyBullets;
    let checkpoints;

    let score;
    let gameState;
    let lastTime = 0;

    function resetGame() {
      player = {
        x: 50,
        y: 350,
        width: 34,
        height: 48,
        vx: 0,
        vy: 0,
        speed: 5,
        jumpPower: 13,
        onGround: false,
        facing: 1,
        health: 3,
        checkpointX: 50,
        checkpointY: 350,
        invulnerableUntil: 0,
        power: null,
        powerUntil: 0,
        shootCooldown: 0,
        dashCooldown: 0
      };

      platforms = [
        { x: 0,    y: 450, width: 300, height: 50 },
        { x: 380,  y: 420, width: 260, height: 80 },
        { x: 720,  y: 350, width: 220, height: 20 },
        { x: 980,  y: 430, width: 300, height: 70 },
        { x: 1320, y: 340, width: 230, height: 20 },
        { x: 1600, y: 420, width: 260, height: 80 },
        { x: 1900, y: 350, width: 230, height: 20 },
        { x: 2170, y: 450, width: 180, height: 50 }
      ];

      spikes = [
        { x: 520,  y: 398, width: 70, height: 22 },
        { x: 1110, y: 408, width: 75, height: 22 },
        { x: 1690, y: 398, width: 80, height: 22 },
        { x: 2010, y: 328, width: 65, height: 22 }
      ];

      lasers = [
        { x: 875,  y: 210, width: 12, height: 140, phase: 0 },
        { x: 1490, y: 170, width: 12, height: 170, phase: 1200 },
        { x: 2085, y: 200, width: 12, height: 150, phase: 2200 }
      ];

      gadgets = [
        { x: 470,  y: 370, width: 28, height: 28, collected: false },
        { x: 790,  y: 300, width: 28, height: 28, collected: false },
        { x: 1380, y: 290, width: 28, height: 28, collected: false },
        { x: 1940, y: 300, width: 28, height: 28, collected: false }
      ];

      enemies = [
        createEnemy(430, 384, 410, 590),
        createEnemy(750, 314, 730, 900),
        createEnemy(1370, 304, 1340, 1510),
        createEnemy(1940, 314, 1920, 2090)
      ];

      checkpoints = [
        { x: 1010, y: 380, activated: false },
        { x: 1630, y: 370, activated: false }
      ];

      bullets = [];
      enemyBullets = [];
      score = 0;
      gameState = "playing";
      cameraX = 0;

      updateHud(performance.now());
    }

    function createEnemy(x, y, minX, maxX) {
      return {
        x,
        y,
        width: 38,
        height: 36,
        direction: 1,
        speed: 1.4,
        minX,
        maxX,
        health: 2,
        lastShot: 0,
        dead: false
      };
    }

    function rectanglesTouch(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    function laserActive(laser, now) {
      const cycle = (now + laser.phase) % 3000;
      return cycle < 1900;
    }

    function activateRandomGadget(now) {
      const powers = ["Jetpack", "Shield", "Overdrive", "Time Warp"];
      const selected = powers[Math.floor(Math.random() * powers.length)];

      player.power = selected;
      player.powerUntil = now + 8000;
    }

    function updatePower(now) {
      if (player.power && now > player.powerUntil) {
        player.power = null;
      }
    }

    function damagePlayer(now, sourceX) {
      if (player.power === "Shield") {
        return;
      }

      if (now < player.invulnerableUntil) {
        return;
      }

      player.health--;
      player.invulnerableUntil = now + 1200;
      player.vy = -8;
      player.vx = player.x < sourceX ? -7 : 7;

      if (player.health <= 0) {
        gameState = "lost";
      }
    }

    function respawnPlayer(now) {
      player.health--;
      player.x = player.checkpointX;
      player.y = player.checkpointY;
      player.vx = 0;
      player.vy = 0;
      player.invulnerableUntil = now + 1500;

      if (player.health <= 0) {
        gameState = "lost";
      }
    }

    function movePlayer(now) {
      const overdrive = player.power === "Overdrive";
      const movementSpeed = overdrive ? 8 : player.speed;

      if (keys["a"] || keys["arrowleft"]) {
        player.vx = -movementSpeed;
        player.facing = -1;
      } else if (keys["d"] || keys["arrowright"]) {
        player.vx = movementSpeed;
        player.facing = 1;
      } else {
        player.vx *= 0.75;
      }

      if (jumpPressed && player.onGround) {
        player.vy = -player.jumpPower;
        player.onGround = false;
      }

      if (
        player.power === "Jetpack" &&
        keys[" "] &&
        !player.onGround
      ) {
        player.vy -= 0.45;
        player.vy = Math.max(player.vy, -7);
      }

      if (
        dashPressed &&
        now > player.dashCooldown
      ) {
        player.vx = player.facing * 15;
        player.dashCooldown = now + 1000;
      }

      player.vy += GRAVITY;

      movePlayerHorizontally();
      movePlayerVertically();

      if (player.y > canvas.height + 150) {
        respawnPlayer(now);
      }

      player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));

      jumpPressed = false;
      dashPressed = false;
    }

    function movePlayerHorizontally() {
      player.x += player.vx;

      platforms.forEach(platform => {
        if (!rectanglesTouch(player, platform)) return;

        if (player.vx > 0) {
          player.x = platform.x - player.width;
        } else if (player.vx < 0) {
          player.x = platform.x + platform.width;
        }

        player.vx = 0;
      });
    }

    function movePlayerVertically() {
      const previousY = player.y;
      player.y += player.vy;
      player.onGround = false;

      platforms.forEach(platform => {
        if (!rectanglesTouch(player, platform)) return;

        const previousBottom = previousY + player.height;
        const previousTop = previousY;

        if (
          player.vy >= 0 &&
          previousBottom <= platform.y + 8
        ) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.onGround = true;
        } else if (
          player.vy < 0 &&
          previousTop >= platform.y + platform.height - 8
        ) {
          player.y = platform.y + platform.height;
          player.vy = 0;
        }
      });
    }

    function shootPlayerBullet(now) {
      if (!keys["f"]) return;
      if (now < player.shootCooldown) return;

      const overdrive = player.power === "Overdrive";

      bullets.push({
        x: player.x + player.width / 2,
        y: player.y + 18,
        width: 15,
        height: 5,
        vx: player.facing * (overdrive ? 14 : 10),
        remove: false
      });

      player.shootCooldown = now + (overdrive ? 130 : 280);
    }

    function updateBullets() {
      bullets.forEach(bullet => {
        bullet.x += bullet.vx;

        enemies.forEach(enemy => {
          if (
            !enemy.dead &&
            rectanglesTouch(bullet, enemy)
          ) {
            bullet.remove = true;
            enemy.health--;

            if (enemy.health <= 0) {
              enemy.dead = true;
              score += 100;
            }
          }
        });

        platforms.forEach(platform => {
          if (rectanglesTouch(bullet, platform)) {
            bullet.remove = true;
          }
        });

        if (
          bullet.x < 0 ||
          bullet.x > WORLD_WIDTH
        ) {
          bullet.remove = true;
        }
      });

      bullets = bullets.filter(bullet => !bullet.remove);
    }

    function updateEnemies(now) {
      const timeScale = player.power === "Time Warp" ? 0.4 : 1;

      enemies.forEach(enemy => {
        if (enemy.dead) return;

        enemy.x += enemy.speed * enemy.direction * timeScale;

        if (enemy.x < enemy.minX) {
          enemy.x = enemy.minX;
          enemy.direction = 1;
        }

        if (enemy.x > enemy.maxX) {
          enemy.x = enemy.maxX;
          enemy.direction = -1;
        }

        const distance = Math.abs(player.x - enemy.x);

        if (
          distance < 430 &&
          now - enemy.lastShot > 1500
        ) {
          const direction = player.x < enemy.x ? -1 : 1;

          enemyBullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + 15,
            width: 12,
            height: 5,
            vx: direction * 5,
            remove: false
          });

          enemy.lastShot = now;
        }

        if (rectanglesTouch(player, enemy)) {
          damagePlayer(now, enemy.x);
        }
      });
    }

    function updateEnemyBullets(now) {
      const timeScale = player.power === "Time Warp" ? 0.4 : 1;

      enemyBullets.forEach(bullet => {
        bullet.x += bullet.vx * timeScale;

        if (rectanglesTouch(player, bullet)) {
          bullet.remove = true;
          damagePlayer(now, bullet.x);
        }

        platforms.forEach(platform => {
          if (rectanglesTouch(bullet, platform)) {
            bullet.remove = true;
          }
        });

        if (
          bullet.x < 0 ||
          bullet.x > WORLD_WIDTH
        ) {
          bullet.remove = true;
        }
      });

      enemyBullets = enemyBullets.filter(
        bullet => !bullet.remove
      );
    }

    function updateTraps(now) {
      spikes.forEach(spike => {
        if (rectanglesTouch(player, spike)) {
          damagePlayer(now, spike.x);
        }
      });

      lasers.forEach(laser => {
        if (
          laserActive(laser, now) &&
          rectanglesTouch(player, laser)
        ) {
          damagePlayer(now, laser.x);
        }
      });
    }

    function updateGadgets(now) {
      gadgets.forEach(gadget => {
        if (
          !gadget.collected &&
          rectanglesTouch(player, gadget)
        ) {
          gadget.collected = true;
          score += 50;
          activateRandomGadget(now);
        }
      });
    }

    function updateCheckpoints() {
      checkpoints.forEach(checkpoint => {
        if (
          !checkpoint.activated &&
          player.x > checkpoint.x
        ) {
          checkpoint.activated = true;
          player.checkpointX = checkpoint.x;
          player.checkpointY = checkpoint.y;
        }
      });
    }

    function updateGoal() {
      const portal = {
        x: 2260,
        y: 370,
        width: 55,
        height: 80
      };

      if (rectanglesTouch(player, portal)) {
        gameState = "won";
        score += 500;
      }
    }

    function updateHud(now) {
      healthText.textContent = player.health;
      scoreText.textContent = score;

      if (!player.power) {
        powerText.textContent = "No gadget active";
        return;
      }

      const seconds = Math.max(
        0,
        Math.ceil((player.powerUntil - now) / 1000)
      );

      powerText.textContent =
        player.power + " — " + seconds + "s";
    }

    function update(now) {
      if (gameState !== "playing") return;

      updatePower(now);
      movePlayer(now);
      shootPlayerBullet(now);
      updateBullets();
      updateEnemies(now);
      updateEnemyBullets(now);
      updateTraps(now);
      updateGadgets(now);
      updateCheckpoints();
      updateGoal();
      updateHud(now);

      cameraX = player.x - canvas.width * 0.4;
      cameraX = Math.max(
        0,
        Math.min(WORLD_WIDTH - canvas.width, cameraX)
      );
    }

    function drawBackground() {
      ctx.fillStyle = "#090d20";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#7cecff";

      for (let i = 0; i < 70; i++) {
        const x = (
          i * 137 -
          cameraX * 0.15
        ) % canvas.width;

        const y = (i * 67) % 330;

        ctx.fillRect(x, y, 2, 2);
      }

      ctx.fillStyle = "#151c3d";

      for (let i = 0; i < 18; i++) {
        const buildingX =
          i * 140 -
          cameraX * 0.3;

        const height = 80 + (i % 5) * 25;

        ctx.fillRect(
          buildingX,
          450 - height,
          100,
          height
        );
      }
    }

    function drawPlatforms() {
      platforms.forEach(platform => {
        ctx.fillStyle = "#24325f";
        ctx.fillRect(
          platform.x,
          platform.y,
          platform.width,
          platform.height
        );

        ctx.fillStyle = "#43e8ff";
        ctx.fillRect(
          platform.x,
          platform.y,
          platform.width,
          5
        );
      });
    }

    function drawSpikes() {
      ctx.fillStyle = "#ff3a73";

      spikes.forEach(spike => {
        const count = Math.floor(spike.width / 15);

        for (let i = 0; i < count; i++) {
          ctx.beginPath();
          ctx.moveTo(spike.x + i * 15, spike.y + spike.height);
          ctx.lineTo(spike.x + i * 15 + 7.5, spike.y);
          ctx.lineTo(spike.x + i * 15 + 15, spike.y + spike.height);
          ctx.fill();
        }
      });
    }

    function drawLasers(now) {
      lasers.forEach(laser => {
        if (laserActive(laser, now)) {
          ctx.fillStyle = "#ff174f";
          ctx.fillRect(
            laser.x,
            laser.y,
            laser.width,
            laser.height
          );

          ctx.fillStyle = "rgba(255,23,79,0.25)";
          ctx.fillRect(
            laser.x - 7,
            laser.y,
            laser.width + 14,
            laser.height
          );
        } else {
          ctx.fillStyle = "#55223a";
          ctx.fillRect(
            laser.x,
            laser.y,
            laser.width,
            laser.height
          );
        }
      });
    }

    function drawGadgets() {
      gadgets.forEach(gadget => {
        if (gadget.collected) return;

        ctx.fillStyle = "#ffe45c";
        ctx.beginPath();
        ctx.arc(
          gadget.x + gadget.width / 2,
          gadget.y + gadget.height / 2,
          15,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#15152c";
        ctx.font = "18px Arial";
        ctx.fillText("?", gadget.x + 9, gadget.y + 21);
      });
    }

    function drawEnemies() {
      enemies.forEach(enemy => {
        if (enemy.dead) return;

        ctx.fillStyle = "#ff4c88";
        ctx.fillRect(
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height
        );

        ctx.fillStyle = "#10152c";
        ctx.fillRect(
          enemy.x + 7,
          enemy.y + 9,
          8,
          7
        );

        ctx.fillRect(
          enemy.x + 23,
          enemy.y + 9,
          8,
          7
        );
      });
    }

    function drawPlayer(now) {
      if (
        now < player.invulnerableUntil &&
        Math.floor(now / 100) % 2 === 0
      ) {
        return;
      }

      if (player.power === "Shield") {
        ctx.strokeStyle = "#56f7ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
          player.x + player.width / 2,
          player.y + player.height / 2,
          34,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      ctx.fillStyle =
        player.power === "Overdrive"
          ? "#ffe45c"
          : "#44f1ff";

      ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
      );

      ctx.fillStyle = "#10152c";
      ctx.fillRect(
        player.x + 7,
        player.y + 9,
        20,
        10
      );

      if (player.power === "Jetpack") {
        ctx.fillStyle = "#ff8d32";
        ctx.fillRect(
          player.x + 8,
          player.y + player.height,
          6,
          15
        );

        ctx.fillRect(
          player.x + 21,
          player.y + player.height,
          6,
          15
        );
      }
    }

    function drawBullets() {
      ctx.fillStyle = "#fff17a";

      bullets.forEach(bullet => {
        ctx.fillRect(
          bullet.x,
          bullet.y,
          bullet.width,
          bullet.height
        );
      });

      ctx.fillStyle = "#ff416c";

      enemyBullets.forEach(bullet => {
        ctx.fillRect(
          bullet.x,
          bullet.y,
          bullet.width,
          bullet.height
        );
      });
    }

    function drawCheckpoints() {
      checkpoints.forEach(checkpoint => {
        ctx.fillStyle = checkpoint.activated
          ? "#42ff91"
          : "#6c7294";

        ctx.fillRect(
          checkpoint.x,
          checkpoint.y,
          8,
          50
        );

        ctx.beginPath();
        ctx.moveTo(checkpoint.x + 8, checkpoint.y);
        ctx.lineTo(checkpoint.x + 35, checkpoint.y + 12);
        ctx.lineTo(checkpoint.x + 8, checkpoint.y + 24);
        ctx.fill();
      });
    }

    function drawPortal(now) {
      const x = 2285;
      const y = 410;

      ctx.strokeStyle = "#9e65ff";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        25 + Math.sin(now / 150) * 3,
        45,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.fillStyle = "rgba(158,101,255,0.25)";
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        19,
        38,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    function drawOverlay() {
      if (gameState === "playing") return;

      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(
        cameraX,
        0,
        canvas.width,
        canvas.height
      );

      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.font = "45px Arial";

      ctx.fillText(
        gameState === "won"
          ? "Mission Complete!"
          : "System Failure!",
        cameraX + canvas.width / 2,
        220
      );

      ctx.font = "24px Arial";
      ctx.fillText(
        "Final score: " + score,
        cameraX + canvas.width / 2,
        270
      );

      ctx.fillText(
        "Press Restart to play again",
        cameraX + canvas.width / 2,
        310
      );

      ctx.textAlign = "left";
    }

    function render(now) {
      drawBackground();

      ctx.save();
      ctx.translate(-cameraX, 0);

      drawPlatforms();
      drawSpikes();
      drawLasers(now);
      drawGadgets();
      drawCheckpoints();
      drawPortal(now);
      drawEnemies();
      drawBullets();
      drawPlayer(now);
      drawOverlay();

      ctx.restore();
    }

    function gameLoop(now) {
      const delta = now - lastTime;
      lastTime = now;

      update(now, delta);
      render(now);

      requestAnimationFrame(gameLoop);
    }

    document.addEventListener("keydown", event => {
      const key = event.key.toLowerCase();

      if (!keys[key]) {
        if (key === " ") jumpPressed = true;
        if (key === "shift") dashPressed = true;
      }

      keys[key] = true;

      if (
        key === " " ||
        key.startsWith("arrow")
      ) {
        event.preventDefault();
      }
    });

    document.addEventListener("keyup", event => {
      keys[event.key.toLowerCase()] = false;
    });

    document
      .getElementById("restart")
      .addEventListener("click", resetGame);

    resetGame();
    requestAnimationFrame(gameLoop);
  </script>
</body>
</html>
