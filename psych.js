// Part 1/7
(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const healthEl = document.getElementById("health");
  const energyEl = document.getElementById("energy");
  const scoreEl = document.getElementById("score");
  const restartButton = document.getElementById("restart");

  const keys = {};
  const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    down: false
  };

  let player;
  let objects;
  let enemies;
  let particles;
  let grabbedObject;
  let gameOver;
  let victory;
  let lastTime = 0;

  function resetGame() {
    player = {
      x: 130,
      y: canvas.height / 2,
      radius: 18,
      speed: 230,
      health: 100,
      energy: 100,
      angle: 0,
      hurtTimer: 0
    };

    objects = [
      makeObject(260, 150, 18, "crate"),
      makeObject(330, 280, 22, "rock"),
      makeObject(250, 420, 18, "crate"),
      makeObject(470, 110, 22, "rock"),
      makeObject(520, 310, 18, "crate"),
      makeObject(470, 470, 22, "rock"),
      makeObject(690, 180, 18, "crate"),
      makeObject(740, 400, 22, "rock")
    ];

    enemies = [
      makeEnemy(780, 90),
      makeEnemy(850, 220),
      makeEnemy(780, 340),
      makeEnemy(870, 470),
      makeEnemy(610, 270)
    ];

    particles = [];
    grabbedObject = null;
    gameOver = false;
    victory = false;
    updateHud();
  }

  function makeObject(x, y, radius, type) {
    return {
      x,
      y,
      radius,
      type,
      vx: 0,
      vy: 0,
      held: false,
      dangerousTimer: 0
    };
  }

  function makeEnemy(x, y) {
    return {
      x,
      y,
      radius: 17,
      speed: 70 + Math.random() * 25,
      health: 100,
      hitTimer: 0
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function updateHud() {
    healthEl.textContent =
      `Health: ${Math.max(0, Math.round(player.health))}`;

    energyEl.textContent =
      `Mind Energy: ${Math.round(player.energy)}`;

    scoreEl.textContent =
      `Enemies: ${enemies.length}`;
  }

  function createBurst(x, y, amount) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 150;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.4,
        maxLife: 0.75
      });
    }
  }
    function tryGrab() {
    if (grabbedObject || player.energy < 5 || gameOver || victory) {
      return;
    }

    let nearest = null;
    let nearestDistance = 190;

    for (const object of objects) {
      const d = distance(player, object);

      if (d < nearestDistance) {
        nearest = object;
        nearestDistance = d;
      }
    }

    if (nearest) {
      grabbedObject = nearest;
      grabbedObject.held = true;
      grabbedObject.vx = 0;
      grabbedObject.vy = 0;
    }
  }

  function releaseGrab() {
    if (!grabbedObject) {
      return;
    }

    const angle = Math.atan2(
      mouse.y - player.y,
      mouse.x - player.x
    );

    grabbedObject.held = false;
    grabbedObject.vx = Math.cos(angle) * 670;
    grabbedObject.vy = Math.sin(angle) * 670;
    grabbedObject.dangerousTimer = 0.7;

    createBurst(grabbedObject.x, grabbedObject.y, 12);
    grabbedObject = null;
  }

  function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;

    if (keys.KeyW || keys.ArrowUp) dy--;
    if (keys.KeyS || keys.ArrowDown) dy++;
    if (keys.KeyA || keys.ArrowLeft) dx--;
    if (keys.KeyD || keys.ArrowRight) dx++;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
    }

    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;

    player.x = clamp(
      player.x,
      player.radius,
      canvas.width - player.radius
    );

    player.y = clamp(
      player.y,
      player.radius,
      canvas.height - player.radius
    );

    player.angle = Math.atan2(
      mouse.y - player.y,
      mouse.x - player.x
    );

    player.hurtTimer = Math.max(
      0,
      player.hurtTimer - dt
    );

    if (grabbedObject) {
      player.energy = Math.max(
        0,
        player.energy - 18 * dt
      );

      if (player.energy <= 0) {
        releaseGrab();
      }
    } else {
      player.energy = Math.min(
        100,
        player.energy + 13 * dt
      );
    }
  }

  function updateObjects(dt) {
    for (const object of objects) {

      if (object.held) {

        const targetX =
          player.x +
          Math.cos(player.angle) * 75;

        const targetY =
          player.y +
          Math.sin(player.angle) * 75;

        object.x +=
          (targetX - object.x) *
          Math.min(1, 12 * dt);

        object.y +=
          (targetY - object.y) *
          Math.min(1, 12 * dt);

        object.vx = 0;
        object.vy = 0;
        continue;
      }

      object.x += object.vx * dt;
      object.y += object.vy * dt;

      object.vx *= Math.pow(0.985, dt * 60);
      object.vy *= Math.pow(0.985, dt * 60);

      object.dangerousTimer = Math.max(
        0,
        object.dangerousTimer - dt
      );
            if (
        object.x < object.radius ||
        object.x > canvas.width - object.radius
      ) {
        object.vx *= -0.55;

        object.x = clamp(
          object.x,
          object.radius,
          canvas.width - object.radius
        );
      }

      if (
        object.y < object.radius ||
        object.y > canvas.height - object.radius
      ) {
        object.vy *= -0.55;

        object.y = clamp(
          object.y,
          object.radius,
          canvas.height - object.radius
        );
      }
    }
  }

  function updateEnemies(dt) {

    for (const enemy of enemies) {

      const angle = Math.atan2(
        player.y - enemy.y,
        player.x - enemy.x
      );

      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;

      enemy.hitTimer = Math.max(
        0,
        enemy.hitTimer - dt
      );

      if (
        distance(enemy, player) <
        enemy.radius + player.radius
      ) {

        if (player.hurtTimer <= 0) {
          player.health -= 12;
          player.hurtTimer = 0.65;
          createBurst(player.x, player.y, 10);
        }

        enemy.x -= Math.cos(angle) * 30 * dt;
        enemy.y -= Math.sin(angle) * 30 * dt;
      }
    }

    for (const object of objects) {

      if (object.dangerousTimer <= 0) {
        continue;
      }

      const speed = Math.hypot(
        object.vx,
        object.vy
      );

      if (speed < 180) {
        continue;
      }

      for (const enemy of enemies) {

        if (
          distance(object, enemy) <
          object.radius + enemy.radius
        ) {

          enemy.health -= Math.min(
            100,
            speed * 0.18
          );

          enemy.hitTimer = 0.2;

          object.vx *= -0.28;
          object.vy *= -0.28;

          object.dangerousTimer = 0;

          createBurst(
            enemy.x,
            enemy.y,
            18
          );
        }
      }
    }

    enemies = enemies.filter(
      enemy => enemy.health > 0
    );

    if (enemies.length === 0) {
      victory = true;
      grabbedObject = null;
    }

    if (player.health <= 0) {
      gameOver = true;
      grabbedObject = null;
    }
  }

  function updateParticles(dt) {

    for (const particle of particles) {

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      particle.vx *= 0.96;
      particle.vy *= 0.96;

      particle.life -= dt;
    }

    particles = particles.filter(
      particle => particle.life > 0
    );
  }

  function update(dt) {

    if (gameOver || victory) {
      updateParticles(dt);
      updateHud();
      return;
    }

    updatePlayer(dt);
    updateObjects(dt);
    updateEnemies(dt);
    updateParticles(dt);

    updateHud();
  }
    function drawGrid() {
    ctx.strokeStyle = "rgba(160, 184, 240, 0.09)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawPlayer() {
    if (
      player.hurtTimer > 0 &&
      Math.floor(player.hurtTimer * 14) % 2 === 0
    ) {
      return;
    }

    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = "#6c4fff";
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      player.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = "#c8bdff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.rotate(player.angle);

    ctx.fillStyle = "#d9d1ff";
    ctx.fillRect(
      7,
      -5,
      25,
      10
    );

    ctx.restore();

    ctx.strokeStyle =
      "rgba(154, 127, 255, 0.22)";

    ctx.lineWidth = 2;
    ctx.beginPath();

    ctx.arc(
      player.x,
      player.y,
      190,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }

  function drawObjects() {
    for (const object of objects) {

      ctx.save();
      ctx.translate(
        object.x,
        object.y
      );

      if (object.held) {
        ctx.shadowBlur = 24;
        ctx.shadowColor = "#a586ff";
      }

      if (object.type === "crate") {

        ctx.fillStyle = "#a66d3b";

        ctx.fillRect(
          -object.radius,
          -object.radius,
          object.radius * 2,
          object.radius * 2
        );

        ctx.strokeStyle = "#e5af72";
        ctx.lineWidth = 3;

        ctx.strokeRect(
          -object.radius,
          -object.radius,
          object.radius * 2,
          object.radius * 2
        );

        ctx.beginPath();

        ctx.moveTo(
          -object.radius,
          -object.radius
        );

        ctx.lineTo(
          object.radius,
          object.radius
        );

        ctx.moveTo(
          object.radius,
          -object.radius
        );

        ctx.lineTo(
          -object.radius,
          object.radius
        );

        ctx.stroke();

      } else {

        ctx.fillStyle = "#8e98ab";
        ctx.beginPath();

        ctx.arc(
          0,
          0,
          object.radius,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#c6cedd";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();

      if (object.held) {

        ctx.strokeStyle =
          "rgba(174, 145, 255, 0.8)";

        ctx.lineWidth = 3;
        ctx.beginPath();

        ctx.moveTo(
          player.x,
          player.y
        );

        ctx.lineTo(
          object.x,
          object.y
        );

        ctx.stroke();
      }
    }
  }
    function drawEnemies() {
    for (const enemy of enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      if (enemy.hitTimer > 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff6b6b";
      }

      ctx.fillStyle =
        enemy.hitTimer > 0
          ? "#ff7676"
          : "#d94155";

      ctx.beginPath();
      ctx.arc(
        0,
        0,
        enemy.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = "#ff9aa7";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";

      ctx.beginPath();
      ctx.arc(-6, -4, 4, 0, Math.PI * 2);
      ctx.arc(6, -4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#24131a";

      ctx.beginPath();
      ctx.arc(-5, -4, 2, 0, Math.PI * 2);
      ctx.arc(5, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#24131a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, 7);
      ctx.lineTo(7, 7);
      ctx.stroke();

      ctx.restore();

      const barWidth = 40;
      const healthRatio = clamp(
        enemy.health / 100,
        0,
        1
      );

      ctx.fillStyle =
        "rgba(0, 0, 0, 0.45)";

      ctx.fillRect(
        enemy.x - barWidth / 2,
        enemy.y - enemy.radius - 13,
        barWidth,
        6
      );

      ctx.fillStyle = "#ff6b6b";

      ctx.fillRect(
        enemy.x - barWidth / 2,
        enemy.y - enemy.radius - 13,
        barWidth * healthRatio,
        6
      );
    }
  }

  function drawParticles() {
    for (const particle of particles) {
      const alpha = clamp(
        particle.life / particle.maxLife,
        0,
        1
      );

      ctx.fillStyle =
        `rgba(187, 161, 255, ${alpha})`;

      ctx.beginPath();

      ctx.arc(
        particle.x,
        particle.y,
        3 + alpha * 3,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  function drawAimMarker() {
    ctx.save();
    ctx.translate(mouse.x, mouse.y);

    ctx.strokeStyle =
      "rgba(230, 224, 255, 0.85)";

    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-5, 0);

    ctx.moveTo(15, 0);
    ctx.lineTo(5, 0);

    ctx.moveTo(0, -15);
    ctx.lineTo(0, -5);

    ctx.moveTo(0, 15);
    ctx.lineTo(0, 5);

    ctx.stroke();
    ctx.restore();
  }

  function drawMessage() {
    if (!gameOver && !victory) {
      return;
    }

    ctx.fillStyle =
      "rgba(7, 10, 22, 0.72)";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#ffffff";
    ctx.font =
      "bold 54px Arial, sans-serif";

    ctx.fillText(
      victory ? "Victory!" : "Defeated",
      canvas.width / 2,
      canvas.height / 2 - 20
    );

    ctx.fillStyle = "#d8d2ff";
    ctx.font =
      "22px Arial, sans-serif";

    ctx.fillText(
      victory
        ? "You defeated every enemy."
        : "Your concentration was broken.",
      canvas.width / 2,
      canvas.height / 2 + 25
    );

    ctx.font =
      "18px Arial, sans-serif";

    ctx.fillText(
  "Press R or click Restart to play again.",
  canvas.width / 2,
  canvas.height / 2 + 65
);
  }

  function draw() {
    const gradient = ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    );

    gradient.addColorStop(0, "#151b35");
    gradient.addColorStop(1, "#080b18");

    ctx.fillStyle = gradient;

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    drawGrid();
    drawObjects();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawAimMarker();
    drawMessage();
  }

  function gameLoop(timestamp) {
    const dt = Math.min(
      0.033,
      (timestamp - lastTime) / 1000 || 0
    );

    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
  }

  function getCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();

    const scaleX =
      canvas.width / rect.width;

    const scaleY =
      canvas.height / rect.height;

    return {
      x:
        (event.clientX - rect.left) *
        scaleX,

      y:
        (event.clientY - rect.top) *
        scaleY
    };
  }

  window.addEventListener(
    "keydown",
    event => {
      keys[event.code] = true;

      if (
        event.code === "KeyE" &&
        !event.repeat
      ) {
        tryGrab();
      }

      if (event.code === "KeyR") {
        resetGame();
      }

      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space"
        ].includes(event.code)
      ) {
        event.preventDefault();
      }
    }
  );

  window.addEventListener(
    "keyup",
    event => {
      keys[event.code] = false;

      if (event.code === "KeyE") {
        releaseGrab();
      }
    }
  );

  canvas.addEventListener(
    "mousemove",
    event => {
      const position =
        getCanvasPosition(event);

      mouse.x = position.x;
      mouse.y = position.y;
    }
  );

  canvas.addEventListener(
    "mousedown",
    event => {
      if (event.button !== 0) {
        return;
      }

      mouse.down = true;
      tryGrab();
    }
  );

  window.addEventListener(
    "mouseup",
    event => {
      if (event.button !== 0) {
        return;
      }

      mouse.down = false;
      releaseGrab();
    }
  );

  canvas.addEventListener(
    "contextmenu",
    event => {
      event.preventDefault();
    }
  );
      restartButton.addEventListener(
    "click",
    () => {
      resetGame();
    }
  );

  window.addEventListener(
    "blur",
    () => {
      for (const key in keys) {
        keys[key] = false;
      }

      if (grabbedObject) {
        grabbedObject.held = false;
        grabbedObject = null;
      }
    }
  );

  resetGame();
  requestAnimationFrame(gameLoop);
})();
