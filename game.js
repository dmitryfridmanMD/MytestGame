const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const livesDisplay = document.getElementById("lives");
const platformDisplay = document.getElementById("platformCount");
const modeDisplay = document.getElementById("modeName");
const messageDisplay = document.getElementById("message");
const modeSelect = document.getElementById("mode");
const startButton = document.getElementById("startButton");

const keys = {};

let gameRunning = false;
let paused = false;
let lastTime = 0;
let elapsedTime = 0;
let score = 0;
let lives = 3;
let visitedCount = 0;
let rockTimer = 0;
let enemyTimer = 0;
let selectedMode = "normal";

const gravity = 1900;

const player = {
  x: 80,
  y: 420,
  width: 34,
  height: 46,
  vx: 0,
  vy: 0,
  speed: 310,
  jumpPower: 690,
  onGround: false,
  invincible: 0,
  facing: 1,
  fireCooldown: 0
};

let platforms = [];
let rocks = [];
let enemies = [];
let projectiles = [];
let particles = [];

const modeSettings = {
  normal: {
    name: "Normal",
    lives: 3,
    rockInterval: 0.72,
    enemyInterval: 4.5,
    rockSpeed: 250,
    enemySpeed: 90,
    scoreMultiplier: 1
  },

  survival: {
    name: "Survival",
    lives: 5,
    rockInterval: 0.48,
    enemyInterval: 3.2,
    rockSpeed: 300,
    enemySpeed: 110,
    scoreMultiplier: 1.25
  },

  speedrun: {
    name: "Speed Run",
    lives: 3,
    rockInterval: 0.62,
    enemyInterval: 4,
    rockSpeed: 280,
    enemySpeed: 100,
    scoreMultiplier: 1.5
  },

  hard: {
    name: "Hard Mode",
    lives: 2,
    rockInterval: 0.35,
    enemyInterval: 2.5,
    rockSpeed: 360,
    enemySpeed: 145,
    scoreMultiplier: 2
  }
};

function makeLevel() {
  platforms = [
    {
      x: 0,
      y: 500,
      width: 220,
      height: 40,
      visited: true
    },

    {
      x: 280,
      y: 425,
      width: 150,
      height: 24,
      visited: false
    },

    {
      x: 500,
      y: 350,
      width: 155,
      height: 24,
      visited: false
    },

    {
      x: 720,
      y: 270,
      width: 170,
      height: 24,
      visited: false
    },

    {
      x: 520,
      y: 180,
      width: 145,
      height: 24,
      visited: false
    },

    {
      x: 280,
      y: 115,
      width: 150,
      height: 24,
      visited: false
    },

    {
      x: 70,
      y: 55,
      width: 165,
      height: 24,
      visited: false
    }
  ];

  visitedCount = 1;
}

function resetGame() {
  selectedMode = modeSelect.value;

  const settings = modeSettings[selectedMode];

  gameRunning = true;
  paused = false;
  elapsedTime = 0;
  score = 0;
  lives = settings.lives;
  rockTimer = 0;
  enemyTimer = 0;

  rocks = [];
  enemies = [];
  projectiles = [];
  particles = [];

  player.x = 75;
  player.y = 430;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 0;
  player.fireCooldown = 0;

  makeLevel();

  modeDisplay.textContent = settings.name;

  messageDisplay.textContent =
    "Reach every platform. Glowing rocks are safe stepping stones!";

  updateHud();
}

function updateHud() {
  scoreDisplay.textContent = Math.floor(score);
  timeDisplay.textContent = elapsedTime.toFixed(1);
  livesDisplay.textContent = lives;

  platformDisplay.textContent =
    `${visitedCount} / ${platforms.length}`;
}

function spawnRock() {
  const settings = modeSettings[selectedMode];

  const specialChance =
    selectedMode === "hard" ? 0.13 : 0.2;

  const special = Math.random() < specialChance;

  const size = special
    ? 42
    : 24 + Math.random() * 26;

  rocks.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    width: size,
    height: size,
    vy: settings.rockSpeed + Math.random() * 140,
    special: special,
    landed: false,
    life: special ? 8 : 0,
    angle: 0,
    spin: (Math.random() - 0.5) * 4
  });
}

function spawnEnemy() {
  const platform =
    platforms[
      1 + Math.floor(
        Math.random() * (platforms.length - 1)
      )
    ];

  enemies.push({
    x: platform.x + 20,
    y: platform.y - 34,
    width: 32,
    height: 34,

    vx:
      modeSettings[selectedMode].enemySpeed *
      (Math.random() < 0.5 ? -1 : 1),

    minX: platform.x,
    maxX: platform.x + platform.width,

    health:
      selectedMode === "hard" ? 2 : 1
  });
}

function shoot() {
  if (
    !gameRunning ||
    paused ||
    player.fireCooldown > 0
  ) {
    return;
  }

  projectiles.push({
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
    radius: 7,
    vx: player.facing * 560
  });

  player.fireCooldown = 0.35;
}

function rectangleCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function hurtPlayer() {
  if (
    player.invincible > 0 ||
    !gameRunning
  ) {
    return;
  }

  lives--;

  player.invincible = 1.5;
  player.vy = -420;

  createParticles(
    player.x + player.width / 2,
    player.y + player.height / 2,
    14
  );

  if (lives <= 0) {
    endGame(false);
  }
}

function createParticles(x, y, amount) {
  for (let i = 0; i < amount; i++) {
    particles.push({
      x: x,
      y: y,

      vx:
        (Math.random() - 0.5) * 260,

      vy:
        (Math.random() - 0.5) * 260,

      life:
        0.6 + Math.random() * 0.5,

      size:
        2 + Math.random() * 5
    });
  }
}

function checkPlatformLanding(previousY) {
  player.onGround = false;

  for (const platform of platforms) {
    const feetNow =
      player.y + player.height;

    const feetBefore =
      previousY + player.height;

    if (
      player.vy >= 0 &&
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width &&
      feetBefore <= platform.y + 6 &&
      feetNow >= platform.y
    ) {
      player.y =
        platform.y - player.height;

      player.vy = 0;
      player.onGround = true;

      if (!platform.visited) {
        platform.visited = true;
        visitedCount++;

        score +=
          400 *
          modeSettings[selectedMode]
            .scoreMultiplier;

        createParticles(
          player.x + player.width / 2,
          platform.y,
          10
        );
      }
    }
  }

  for (const rock of rocks) {
    if (
      !rock.special ||
      !rock.landed
    ) {
      continue;
    }

    const feetNow =
      player.y + player.height;

    const feetBefore =
      previousY + player.height;

    if (
      player.vy >= 0 &&
      player.x + player.width > rock.x &&
      player.x < rock.x + rock.width &&
      feetBefore <= rock.y + 8 &&
      feetNow >= rock.y
    ) {
      player.y =
        rock.y - player.height;

      player.vy = 0;
      player.onGround = true;
    }
  }
}

function updatePlayer(dt) {
  const previousY = player.y;

  const left =
    keys.ArrowLeft ||
    keys.KeyA;

  const right =
    keys.ArrowRight ||
    keys.KeyD;

  const jump =
    keys.ArrowUp ||
    keys.KeyW ||
    keys.Space;

  if (left && !right) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (right && !left) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= Math.pow(0.0008, dt);
  }

  if (
    jump &&
    player.onGround &&
    !keys.jumpLocked
  ) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    keys.jumpLocked = true;
  }

  if (!jump) {
    keys.jumpLocked = false;
  }

  player.vy += gravity * dt;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.x = Math.max(
    0,
    Math.min(
      canvas.width - player.width,
      player.x
    )
  );

  checkPlatformLanding(previousY);

  if (player.y > canvas.height + 80) {
    hurtPlayer();

    player.x = 75;
    player.y = 420;
    player.vx = 0;
    player.vy = 0;
  }

  player.invincible = Math.max(
    0,
    player.invincible - dt
  );

  player.fireCooldown = Math.max(
    0,
    player.fireCooldown - dt
  );
}

function updateRocks(dt) {
  rockTimer -= dt;

  if (rockTimer <= 0) {
    spawnRock();

    rockTimer =
      modeSettings[selectedMode]
        .rockInterval;
  }

  for (
    let i = rocks.length - 1;
    i >= 0;
    i--
  ) {
    const rock = rocks[i];

    if (!rock.landed) {
      rock.y += rock.vy * dt;
      rock.angle += rock.spin * dt;

      if (rock.special) {
        for (const platform of platforms) {
          if (
            rock.y + rock.height >= platform.y &&
            rock.y + rock.height -
              rock.vy * dt <=
              platform.y &&
            rock.x + rock.width >
              platform.x &&
            rock.x <
              platform.x +
                platform.width
          ) {
            rock.y =
              platform.y - rock.height;

            rock.vy = 0;
            rock.landed = true;

            break;
          }
        }
      }

      if (
        !rock.special &&
        rectangleCollision(player, rock)
      ) {
        hurtPlayer();

        rocks.splice(i, 1);

        continue;
      }
    } else {
      rock.life -= dt;

      if (rock.life <= 0) {
        rocks.splice(i, 1);

        continue;
      }
    }

    if (
      rock.y >
      canvas.height + 100
    ) {
      rocks.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  enemyTimer -= dt;

  if (
    enemyTimer <= 0 &&
    enemies.length < 6
  ) {
    spawnEnemy();

    enemyTimer =
      modeSettings[selectedMode]
        .enemyInterval;
  }

  for (const enemy of enemies) {
    enemy.x += enemy.vx * dt;

    if (
      enemy.x <= enemy.minX ||
      enemy.x + enemy.width >=
        enemy.maxX
    ) {
      enemy.vx *= -1;

      enemy.x = Math.max(
        enemy.minX,
        Math.min(
          enemy.maxX - enemy.width,
          enemy.x
        )
      );
    }

    if (
      rectangleCollision(
        player,
        enemy
      )
    ) {
      hurtPlayer();
    }
  }
}

function updateProjectiles(dt) {
  for (
    let i =
      projectiles.length - 1;
    i >= 0;
    i--
  ) {
    const shot = projectiles[i];

    shot.x += shot.vx * dt;

    let hit = false;

    for (
      let j = enemies.length - 1;
      j >= 0;
      j--
    ) {
      const enemy = enemies[j];

      if (
        shot.x + shot.radius >
          enemy.x &&
        shot.x - shot.radius <
          enemy.x + enemy.width &&
        shot.y + shot.radius >
          enemy.y &&
        shot.y - shot.radius <
          enemy.y + enemy.height
      ) {
        enemy.health--;

        hit = true;

        createParticles(
          enemy.x +
            enemy.width / 2,
          enemy.y +
            enemy.height / 2,
          10
        );

        if (enemy.health <= 0) {
          enemies.splice(j, 1);

          score +=
            250 *
            modeSettings[selectedMode]
              .scoreMultiplier;
        }

        break;
      }
    }

    if (
      hit ||
      shot.x < -20 ||
      shot.x >
        canvas.width + 20
    ) {
      projectiles.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (
    let i = particles.length - 1;
    i >= 0;
    i--
  ) {
    const particle = particles[i];

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    particle.vy += 500 * dt;
    particle.life -= dt;

    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function update(dt) {
  if (
    !gameRunning ||
    paused
  ) {
    return;
  }

  elapsedTime += dt;

  score +=
    10 *
    dt *
    modeSettings[selectedMode]
      .scoreMultiplier;

  updatePlayer(dt);
  updateRocks(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateParticles(dt);

  if (
    visitedCount ===
    platforms.length
  ) {
    endGame(true);
  }

  updateHud();
}

function trophyForResult() {
  const timeBonus = Math.max(
    0,
    5000 - elapsedTime * 60
  );

  const finalScore =
    Math.floor(
      score + timeBonus
    );

  if (
    finalScore >= 9000 ||
    elapsedTime <= 35
  ) {
    return {
      name: "Diamond Trophy",
      symbol: "💎🏆",
      finalScore: finalScore
    };
  }

  if (
    finalScore >= 6500 ||
    elapsedTime <= 55
  ) {
    return {
      name: "Gold Trophy",
      symbol: "🥇🏆",
      finalScore: finalScore
    };
  }

  if (
    finalScore >= 4200 ||
    elapsedTime <= 85
  ) {
    return {
      name: "Silver Trophy",
      symbol: "🥈🏆",
      finalScore: finalScore
    };
  }

  return {
    name: "Bronze Trophy",
    symbol: "🥉🏆",
    finalScore: finalScore
  };
}

function endGame(won) {
  gameRunning = false;

  if (won) {
    const trophy =
      trophyForResult();

    score =
      trophy.finalScore;

    updateHud();

    messageDisplay.textContent =
      `${trophy.symbol} ` +
      `You completed every platform in ` +
      `${elapsedTime.toFixed(1)} seconds! ` +
      `You earned the ${trophy.name} ` +
      `with ${trophy.finalScore} points.`;
  } else {
    messageDisplay.textContent =
      `Game over! You scored ` +
      `${Math.floor(score)} points. ` +
      `Press Start Game to try again.`;
  }
}

function drawBackground() {
  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    );

  gradient.addColorStop(
    0,
    "#24385f"
  );

  gradient.addColorStop(
    1,
    "#0b1020"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle =
    "rgba(255,255,255,0.16)";

  for (let i = 0; i < 45; i++) {
    const x =
      (i * 211) %
      canvas.width;

    const y =
      (i * 97) %
      250;

    ctx.fillRect(
      x,
      y,
      2,
      2
    );
  }

  ctx.fillStyle = "#10182a";

  ctx.beginPath();

  ctx.moveTo(0, 420);
  ctx.lineTo(130, 280);
  ctx.lineTo(260, 420);
  ctx.lineTo(420, 220);
  ctx.lineTo(590, 420);
  ctx.lineTo(760, 235);
  ctx.lineTo(960, 420);
  ctx.lineTo(960, 540);
  ctx.lineTo(0, 540);

  ctx.closePath();
  ctx.fill();
}

function drawPlatforms() {
  for (
    let i = 0;
    i < platforms.length;
    i++
  ) {
    const platform =
      platforms[i];

    ctx.fillStyle =
      platform.visited
        ? "#4caf70"
        : "#73533a";

    ctx.fillRect(
      platform.x,
      platform.y,
      platform.width,
      platform.height
    );

    ctx.fillStyle =
      platform.visited
        ? "#8bf0a9"
        : "#a8845f";

    ctx.fillRect(
      platform.x,
      platform.y,
      platform.width,
      6
    );

    ctx.fillStyle = "#ffffff";
    ctx.font =
      "bold 14px Arial";

    ctx.fillText(
      String(i + 1),
      platform.x + 8,
      platform.y + 18
    );
  }
}

function drawPlayer() {
  if (
    player.invincible > 0 &&
    Math.floor(
      player.invincible * 12
    ) %
      2 ===
      0
  ) {
    return;
  }

  ctx.fillStyle = "#4fc3f7";

  ctx.fillRect(
    player.x,
    player.y,
    player.width,
    player.height
  );

  ctx.fillStyle = "#eaf9ff";

  const eyeX =
    player.facing === 1
      ? player.x + 23
      : player.x + 7;

  ctx.fillRect(
    eyeX,
    player.y + 10,
    5,
    5
  );

  ctx.fillStyle = "#ff7043";

  ctx.fillRect(
    player.x + 5,
    player.y +
      player.height -
      7,
    10,
    7
  );

  ctx.fillRect(
    player.x + 20,
    player.y +
      player.height -
      7,
    10,
    7
  );
}

function drawRocks() {
  for (const rock of rocks) {
    ctx.save();

    ctx.translate(
      rock.x +
        rock.width / 2,
      rock.y +
        rock.height / 2
    );

    ctx.rotate(rock.angle);

    ctx.fillStyle =
      rock.special
        ? "#ffd54f"
        : "#777b86";

    ctx.beginPath();

    ctx.moveTo(
      -rock.width / 2,
      -rock.height * 0.15
    );

    ctx.lineTo(
      -rock.width * 0.2,
      -rock.height / 2
    );

    ctx.lineTo(
      rock.width * 0.34,
      -rock.height * 0.38
    );

    ctx.lineTo(
      rock.width / 2,
      rock.height * 0.2
    );

    ctx.lineTo(
      rock.width * 0.1,
      rock.height / 2
    );

    ctx.lineTo(
      -rock.width * 0.42,
      rock.height * 0.32
    );

    ctx.closePath();
    ctx.fill();

    if (rock.special) {
      ctx.strokeStyle =
        "#fff4a8";

      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = "#b23a48";

    ctx.fillRect(
      enemy.x,
      enemy.y,
      enemy.width,
      enemy.height
    );

    ctx.fillStyle = "#fff";

    ctx.fillRect(
      enemy.x + 6,
      enemy.y + 8,
      6,
      6
    );

    ctx.fillRect(
      enemy.x + 20,
      enemy.y + 8,
      6,
      6
    );

    ctx.fillStyle = "#28080d";

    ctx.fillRect(
      enemy.x + 8,
      enemy.y + 24,
      16,
      4
    );
  }
}

function drawProjectiles() {
  for (
    const shot of projectiles
  ) {
    ctx.fillStyle = "#ff8a3d";

    ctx.beginPath();

    ctx.arc(
      shot.x,
      shot.y,
      shot.radius,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#fff2a8";

    ctx.beginPath();

    ctx.arc(
      shot.x,
      shot.y,
      shot.radius * 0.45,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}

function drawParticles() {
  ctx.fillStyle = "#ffe071";

  for (
    const particle of particles
  ) {
    ctx.globalAlpha =
      Math.max(
        0,
        particle.life
      );

    ctx.fillRect(
      particle.x,
      particle.y,
      particle.size,
      particle.size
    );
  }

  ctx.globalAlpha = 1;
}

function drawOverlay() {
  if (
    paused &&
    gameRunning
  ) {
    ctx.fillStyle =
      "rgba(0,0,0,0.55)";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.fillStyle = "#fff";

    ctx.font =
      "bold 46px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "PAUSED",
      canvas.width / 2,
      canvas.height / 2
    );

    ctx.textAlign = "left";
  }
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawRocks();
  drawEnemies();
  drawProjectiles();
  drawPlayer();
  drawParticles();
  drawOverlay();
}

function gameLoop(timestamp) {
  const dt = Math.min(
    (timestamp - lastTime) /
      1000 ||
      0,
    0.033
  );

  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(
    gameLoop
  );
}

window.addEventListener(
  "keydown",
  event => {
    keys[event.code] = true;

    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "Space"
      ].includes(event.code)
    ) {
      event.preventDefault();
    }

    if (
      event.code === "KeyF"
    ) {
      shoot();
    }

    if (
      event.code === "KeyP" &&
      gameRunning
    ) {
      paused = !paused;

      messageDisplay.textContent =
        paused
          ? "Paused"
          : "Game resumed";
    }
  }
);

window.addEventListener(
  "keyup",
  event => {
    keys[event.code] = false;
  }
);

startButton.addEventListener(
  "click",
  resetGame
);

function bindHoldButton(
  id,
  keyCode
) {
  const button =
    document.getElementById(id);

  const press = event => {
    event.preventDefault();
    keys[keyCode] = true;
  };

  const release = event => {
    event.preventDefault();
    keys[keyCode] = false;
  };

  button.addEventListener(
    "pointerdown",
    press
  );

  button.addEventListener(
    "pointerup",
    release
  );

  button.addEventListener(
    "pointercancel",
    release
  );

  button.addEventListener(
    "pointerleave",
    release
  );
}

bindHoldButton(
  "leftButton",
  "ArrowLeft"
);

bindHoldButton(
  "rightButton",
  "ArrowRight"
);

bindHoldButton(
  "jumpButton",
  "Space"
);

document
  .getElementById("fireButton")
  .addEventListener(
    "pointerdown",
    event => {
      event.preventDefault();
      shoot();
    }
  );

makeLevel();
updateHud();

requestAnimationFrame(
  gameLoop
);
