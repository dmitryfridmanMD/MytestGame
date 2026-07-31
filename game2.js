const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");

const selectionScreen =
  document.getElementById("selectionScreen");

const gameScreen =
  document.getElementById("gameScreen");

const heroLabel =
  document.getElementById("heroLabel");

const healthLabel =
  document.getElementById("healthLabel");

const enemyLabel =
  document.getElementById("enemyLabel");

const powerLabel =
  document.getElementById("powerLabel");


const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GRAVITY = 0.65;
const WORLD_WIDTH = 3400;


const keys = {};

let chosenHero = null;
let player;

let platforms = [];
let enemies = [];
let projectiles = [];
let particles = [];

let cameraX = 0;
let gameState = "select";

let lastTime = 0;


const heroTypes = {

  carrot: {
    name: "Captain Carrot",
    emoji: "🥕",
    speed: 5.4,
    jump: 13.5,
    specialName: "Rocket Dash",
    cooldown: 180
  },

  broccoli: {
    name: "Broccoli Guardian",
    emoji: "🥦",
    speed: 4.5,
    jump: 12.8,
    specialName: "Leaf Shield",
    cooldown: 300
  },

  tomato: {
    name: "Tomato Blaster",
    emoji: "🍅",
    speed: 4.8,
    jump: 13,
    specialName: "Sauce Explosion",
    cooldown: 240
  },

  corn: {
    name: "Corn Jumper",
    emoji: "🌽",
    speed: 5,
    jump: 12.2,
    specialName: "Triple Jump",
    cooldown: 90
  }

};


const levelPlatforms = [

  [0, 490, 650, 50],

  [720, 450, 300, 90],

  [1080, 490, 420, 50],

  [1550, 430, 280, 110],

  [1880, 490, 380, 50],

  [2320, 420, 260, 120],

  [2640, 490, 400, 50],

  [3100, 440, 300, 100],

  [320, 370, 180, 22],

  [580, 310, 150, 22],

  [860, 250, 170, 22],

  [1200, 350, 170, 22],

  [1440, 280, 160, 22],

  [1740, 220, 180, 22],

  [2040, 335, 180, 22],

  [2260, 260, 150, 22],

  [2520, 210, 180, 22],

  [2830, 330, 170, 22]

];


const enemySeeds = [

  [430, 330, "🍩"],

  [830, 405, "🍔"],

  [930, 205, "🍟"],

  [1260, 305, "🍕"],

  [1640, 385, "🍪"],

  [1800, 175, "🌭"],

  [2080, 290, "🍩"],

  [2390, 375, "🍔"],

  [2580, 165, "🍟"],

  [2880, 285, "🍕"],

  [3170, 395, "🍪"]

];


document
  .querySelectorAll(".vegetable-card")
  .forEach((card) => {

    card.addEventListener("click", () => {

      startGame(card.dataset.hero);

    });

  });


function startGame(heroKey) {

  chosenHero = heroKey;

  selectionScreen.classList.add("hidden");

  gameScreen.classList.remove("hidden");

  resetGame();

  gameState = "playing";

  requestAnimationFrame(gameLoop);

}


function resetGame() {

  const hero =
    heroTypes[chosenHero];


  player = {

    x: 80,
    y: 400,

    w: 42,
    h: 54,

    vx: 0,
    vy: 0,

    speed: hero.speed,
    jumpPower: hero.jump,

    health: 5,
    maxHealth: 5,

    direction: 1,

    grounded: false,
    jumpsUsed: 0,

    attackTimer: 0,
    attackCooldown: 0,

    specialCooldown: 0,

    shieldTimer: 0,
    invulnerable: 0,

    dashTimer: 0

  };


  platforms =
    levelPlatforms.map(
      ([x, y, w, h]) => ({
        x,
        y,
        w,
        h
      })
    );


  enemies =
    enemySeeds.map(
      ([x, y, emoji], index) => ({

        x,
        y,

        w: 44,
        h: 44,

        emoji,

        startX: x,

        vx:
          index % 2 === 0
            ? 1.2
            : -1.2,

        health: 2,

        alive: true,

        hurtTimer: 0

      })
    );


  projectiles = [];

  particles = [];

  cameraX = 0;

  updateHud();

}


function updateHud() {

  const hero =
    heroTypes[chosenHero];


  heroLabel.textContent =
    `${hero.emoji} ${hero.name}`;


  healthLabel.textContent =
    `Health: ${"❤️".repeat(
      Math.max(0, player.health)
    )}`;


  enemyLabel.textContent =
    `Junk Food Left: ${
      enemies.filter(
        (enemy) => enemy.alive
      ).length
    }`;


  if (player.specialCooldown <= 0) {

    powerLabel.textContent =
      `${hero.specialName}: Ready!`;

  } else {

    powerLabel.textContent =
      `${hero.specialName}: ${
        Math.ceil(
          player.specialCooldown / 60
        )
      }s`;

  }

}


function gameLoop(timestamp) {

  const delta =
    Math.min(
      (timestamp - lastTime) / 16.67 || 1,
      2
    );


  lastTime = timestamp;


  if (gameState === "playing") {

    update(delta);

  }


  draw();

  requestAnimationFrame(gameLoop);

}


function update(delta) {

  handleInput();

  updatePlayer(delta);

  updateEnemies(delta);

  updateProjectiles(delta);

  updateParticles(delta);

  checkExit();

  updateHud();


  cameraX +=
    (
      player.x -
      WIDTH * 0.36 -
      cameraX
    ) * 0.1;


  cameraX =
    Math.max(
      0,
      Math.min(
        cameraX,
        WORLD_WIDTH - WIDTH
      )
    );

}


function handleInput() {

  const left =
    keys["ArrowLeft"] ||
    keys["a"] ||
    keys["A"];


  const right =
    keys["ArrowRight"] ||
    keys["d"] ||
    keys["D"];


  if (player.dashTimer <= 0) {

    if (left) {

      player.vx =
        -player.speed;

      player.direction = -1;

    } else if (right) {

      player.vx =
        player.speed;

      player.direction = 1;

    } else {

      player.vx *= 0.78;

    }

  }

}


function updatePlayer(delta) {

  if (player.attackTimer > 0) {

    player.attackTimer -= delta;

  }


  if (player.attackCooldown > 0) {

    player.attackCooldown -= delta;

  }


  if (player.specialCooldown > 0) {

    player.specialCooldown -= delta;

  }


  if (player.shieldTimer > 0) {

    player.shieldTimer -= delta;

  }


  if (player.invulnerable > 0) {

    player.invulnerable -= delta;

  }


  if (player.dashTimer > 0) {

    player.dashTimer -= delta;

    player.vx =
      player.direction * 14;


    createParticle(

      player.x,

      player.y +
      player.h / 2,

      "🥕"

    );

  }


  player.vy +=
    GRAVITY * delta;


  player.x +=
    player.vx * delta;


  resolveHorizontalCollisions();


  player.y +=
    player.vy * delta;


  player.grounded = false;


  resolveVerticalCollisions();


  player.x =
    Math.max(
      0,
      Math.min(
        player.x,
        WORLD_WIDTH - player.w
      )
    );


  if (player.y > HEIGHT + 180) {

    damagePlayer(2);

    player.x =
      Math.max(
        60,
        player.x - 200
      );

    player.y = 200;

    player.vy = 0;

  }


  if (player.attackTimer > 0) {

    const hitbox = {

      x:
        player.direction === 1

          ? player.x + player.w

          : player.x - 50,

      y:
        player.y + 8,

      w: 50,

      h: 38

    };


    enemies.forEach((enemy) => {

      if (
        enemy.alive &&
        rectsOverlap(hitbox, enemy)
      ) {

        hitEnemy(

          enemy,

          1,

          player.direction * 7

        );

      }

    });

  }

}


function resolveHorizontalCollisions() {

  for (const platform of platforms) {

    if (rectsOverlap(player, platform)) {

      if (player.vx > 0) {

        player.x =
          platform.x - player.w;

      }


      if (player.vx < 0) {

        player.x =
          platform.x + platform.w;

      }


      player.vx = 0;

    }

  }

}


function resolveVerticalCollisions() {

  for (const platform of platforms) {

    if (rectsOverlap(player, platform)) {

      if (player.vy > 0) {

        player.y =
          platform.y - player.h;

        player.vy = 0;

        player.grounded = true;

        player.jumpsUsed = 0;

      } else if (player.vy < 0) {

        player.y =
          platform.y + platform.h;

        player.vy = 0;

      }

    }

  }

}


function jump() {

  if (gameState !== "playing") {

    return;

  }


  const maxJumps =
    chosenHero === "corn"
      ? 3
      : 2;


  if (
    player.grounded ||
    player.jumpsUsed < maxJumps
  ) {

    player.vy =
      -player.jumpPower;

    player.grounded = false;

    player.jumpsUsed++;


    createParticle(

      player.x +
      player.w / 2,

      player.y +
      player.h,

      "✨"

    );

  }

}


function attack() {

  if (
    gameState !== "playing" ||
    player.attackCooldown > 0
  ) {

    return;

  }


  player.attackTimer = 12;

  player.attackCooldown = 22;


  projectiles.push({

    x:
      player.x +
      player.w / 2,

    y:
      player.y + 20,

    w: 20,

    h: 14,

    vx:
      player.direction * 9,

    vy: 0,

    damage: 1,

    life: 80,

    emoji:
      chosenHero === "tomato"
        ? "💧"
        : "🌱"

  });

}


function useSpecial() {

  if (
    gameState !== "playing" ||
    player.specialCooldown > 0
  ) {

    return;

  }


  const hero =
    heroTypes[chosenHero];


  player.specialCooldown =
    hero.cooldown;


  if (chosenHero === "carrot") {

    player.dashTimer = 28;

    player.invulnerable = 35;

  }


  if (chosenHero === "broccoli") {

    player.shieldTimer = 180;

    player.invulnerable = 180;


    for (let i = 0; i < 15; i++) {

      createParticle(

        player.x +
        Math.random() *
        player.w,

        player.y +
        Math.random() *
        player.h,

        "🍃"

      );

    }

  }


  if (chosenHero === "tomato") {

    enemies.forEach((enemy) => {

      const distance =
        Math.hypot(

          enemy.x +
          enemy.w / 2 -
          (
            player.x +
            player.w / 2
          ),

          enemy.y +
          enemy.h / 2 -
          (
            player.y +
            player.h / 2
          )

        );


      if (
        enemy.alive &&
        distance < 220
      ) {

        hitEnemy(

          enemy,

          3,

          enemy.x < player.x
            ? -10
            : 10

        );

      }

    });


    for (let i = 0; i < 32; i++) {

      createParticle(

        player.x +
        player.w / 2,

        player.y +
        player.h / 2,

        "🍅",

        true

      );

    }

  }


  if (chosenHero === "corn") {

    player.jumpsUsed = 0;

    player.vy = -16;


    for (let i = 0; i < 18; i++) {

      createParticle(

        player.x +
        player.w / 2,

        player.y +
        player.h,

        "🌽",

        true

      );

    }

  }

}


function updateEnemies(delta) {

  enemies.forEach((enemy) => {

    if (!enemy.alive) {

      return;

    }


    if (enemy.hurtTimer > 0) {

      enemy.hurtTimer -= delta;

    }


    enemy.x +=
      enemy.vx * delta;


    if (
      enemy.x <
      enemy.startX - 90 ||

      enemy.x >
      enemy.startX + 90
    ) {

      enemy.vx *= -1;

    }


    if (rectsOverlap(player, enemy)) {

      if (
        player.vy > 4 &&

        player.y + player.h <
        enemy.y +
        enemy.h * 0.65
      ) {

        hitEnemy(

          enemy,

          2,

          player.direction * 5

        );

        player.vy = -9;

      } else {

        damagePlayer(

          1,

          enemy.x < player.x
            ? 1
            : -1

        );

      }

    }

  });

}


function hitEnemy(
  enemy,
  damage,
  knockback
) {

  if (
    enemy.hurtTimer > 0 ||
    !enemy.alive
  ) {

    return;

  }


  enemy.health -= damage;

  enemy.vx = knockback;

  enemy.hurtTimer = 14;


  for (let i = 0; i < 7; i++) {

    createParticle(

      enemy.x +
      enemy.w / 2,

      enemy.y +
      enemy.h / 2,

      "💥",

      true

    );

  }


  if (enemy.health <= 0) {

    enemy.alive = false;

  }

}


function damagePlayer(
  amount,
  knockback = -1
) {

  if (
    player.invulnerable > 0 ||
    player.shieldTimer > 0
  ) {

    return;

  }


  player.health -= amount;

  player.invulnerable = 70;

  player.vx =
    knockback * 8;

  player.vy = -7;


  for (let i = 0; i < 10; i++) {

    createParticle(

      player.x +
      player.w / 2,

      player.y +
      player.h / 2,

      "💢",

      true

    );

  }


  if (player.health <= 0) {

    gameState = "lost";

  }

}


function updateProjectiles(delta) {

  projectiles.forEach(
    (projectile) => {

      projectile.x +=
        projectile.vx * delta;

      projectile.y +=
        projectile.vy * delta;

      projectile.life -= delta;


      enemies.forEach((enemy) => {

        if (
          enemy.alive &&

          projectile.life > 0 &&

          rectsOverlap(
            projectile,
            enemy
          )
        ) {

          hitEnemy(

            enemy,

            projectile.damage,

            projectile.vx > 0
              ? 5
              : -5

          );


          projectile.life = 0;

        }

      });

    }
  );


  projectiles =
    projectiles.filter(
      (projectile) =>
        projectile.life > 0
    );

}


function createParticle(
  x,
  y,
  emoji,
  burst = false
) {

  particles.push({

    x,

    y,

    emoji,

    vx:
      burst
        ? (Math.random() - 0.5) * 9
        : (Math.random() - 0.5) * 2,

    vy:
      burst
        ? (Math.random() - 0.7) * 9
        : -Math.random() * 3,

    life:
      30 +
      Math.random() * 25

  });

}


function updateParticles(delta) {

  particles.forEach((particle) => {

    particle.x +=
      particle.vx * delta;

    particle.y +=
      particle.vy * delta;

    particle.vy +=
      0.18 * delta;

    particle.life -= delta;

  });


  particles =
    particles.filter(
      (particle) =>
        particle.life > 0
    );

}


function checkExit() {

  const exit = {

    x: 3300,

    y: 350,

    w: 70,

    h: 90

  };


  if (rectsOverlap(player, exit)) {

    const enemiesRemain =
      enemies.some(
        (enemy) => enemy.alive
      );


    if (enemiesRemain) {

      gameState = "blocked";

    } else {

      gameState = "won";

    }

  }


  if (
    gameState === "blocked" &&
    !rectsOverlap(player, exit)
  ) {

    gameState = "playing";

  }

}


function draw() {

  drawBackground();


  ctx.save();

  ctx.translate(
    -cameraX,
    0
  );


  drawPlatforms();

  drawExit();

  drawEnemies();

  drawProjectiles();

  drawPlayer();

  drawParticles();


  ctx.restore();


  if (gameState === "won") {

    drawOverlay(

      "YOU WIN! 🏆",

      "The junk food army has been defeated! Press R to play again."

    );

  } else if (gameState === "lost") {

    drawOverlay(

      "GAME OVER",

      "The junk food was too powerful. Press R to try again."

    );

  } else if (gameState === "blocked") {

    drawSmallMessage(

      "Defeat every junk food enemy before using the exit!"

    );

  }

}


function drawBackground() {

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      HEIGHT
    );


  gradient.addColorStop(
    0,
    "#8edcff"
  );


  gradient.addColorStop(
    0.7,
    "#dff7bc"
  );


  gradient.addColorStop(
    1,
    "#9bd073"
  );


  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );


  ctx.font =
    "44px serif";


  for (let i = 0; i < 8; i++) {

    const x =

      (
        (
          i * 270 -
          cameraX * 0.2
        ) %

        (
          WIDTH + 150
        )
      ) - 70;


    ctx.fillText(

      "☁️",

      x,

      80 +
      (i % 3) * 55

    );

  }


  ctx.fillStyle =
    "#76ad58";


  ctx.beginPath();


  ctx.moveTo(
    0,
    430
  );


  for (
    let x = 0;
    x <= WIDTH;
    x += 90
  ) {

    ctx.lineTo(

      x,

      390 +

      Math.sin(

        (
          x +
          cameraX * 0.12
        ) / 80

      ) * 24

    );

  }


  ctx.lineTo(
    WIDTH,
    HEIGHT
  );


  ctx.lineTo(
    0,
    HEIGHT
  );


  ctx.fill();

}


function drawPlatforms() {

  platforms.forEach(
    (platform) => {

      ctx.fillStyle =
        "#7b4b28";


      ctx.fillRect(

        platform.x,

        platform.y,

        platform.w,

        platform.h

      );


      ctx.fillStyle =
        "#55b64b";


      ctx.fillRect(

        platform.x,

        platform.y,

        platform.w,

        Math.min(
          16,
          platform.h
        )

      );


      ctx.fillStyle =
        "rgba(255,255,255,0.18)";


      for (
        let x =
          platform.x + 18;

        x <
          platform.x +
          platform.w;

        x += 40
      ) {

        ctx.fillRect(

          x,

          platform.y + 25,

          8,

          8

        );

      }

    }
  );

}


function drawExit() {

  ctx.fillStyle =
    "#f3c33f";


  ctx.fillRect(
    3300,
    350,
    70,
    90
  );


  ctx.fillStyle =
    "#fff4a3";


  ctx.fillRect(
    3310,
    360,
    50,
    70
  );


  ctx.fillStyle =
    "#76520f";


  ctx.beginPath();


  ctx.arc(
    3348,
    398,
    5,
    0,
    Math.PI * 2
  );


  ctx.fill();


  ctx.font =
    "34px serif";


  ctx.fillText(
    "🏆",
    3317,
    344
  );

}


function drawEnemies() {

  enemies.forEach((enemy) => {

    if (!enemy.alive) {

      return;

    }


    ctx.save();


    if (
      enemy.hurtTimer > 0 &&
      Math.floor(
        enemy.hurtTimer
      ) % 2 === 0
    ) {

      ctx.globalAlpha = 0.35;

    }


    ctx.font =
      "42px serif";


    ctx.fillText(

      enemy.emoji,

      enemy.x,

      enemy.y + 40

    );


    ctx.fillStyle =
      "#422";


    ctx.fillRect(

      enemy.x,

      enemy.y - 9,

      enemy.w,

      6

    );


    ctx.fillStyle =
      "#ff6262";


    ctx.fillRect(

      enemy.x,

      enemy.y - 9,

      enemy.w *
      (
        enemy.health / 2
      ),

      6

    );


    ctx.restore();

  });

}


function drawPlayer() {

  const hero =
    heroTypes[chosenHero];


  ctx.save();


  if (
    player.invulnerable > 0 &&

    player.shieldTimer <= 0 &&

    Math.floor(
      player.invulnerable
    ) % 8 < 4
  ) {

    ctx.globalAlpha = 0.45;

  }


  if (player.shieldTimer > 0) {

    ctx.strokeStyle =
      "#68e7ff";

    ctx.lineWidth = 7;

    ctx.beginPath();

    ctx.arc(

      player.x +
      player.w / 2,

      player.y +
      player.h / 2,

      38,

      0,

      Math.PI * 2

    );

    ctx.stroke();

  }


  ctx.font =
    "48px serif";


  ctx.translate(

    player.x +
    player.w / 2,

    player.y + 43

  );


  ctx.scale(
    player.direction,
    1
  );


  ctx.fillText(

    hero.emoji,

    -24,

    0

  );


  if (player.attackTimer > 0) {

    ctx.font =
      "30px serif";


    ctx.fillText(

      "⚡",

      22,

      -5

    );

  }


  ctx.restore();

}


function drawProjectiles() {

  projectiles.forEach(
    (projectile) => {

      ctx.font =
        "22px serif";


      ctx.fillText(

        projectile.emoji,

        projectile.x,

        projectile.y + 16

      );

    }
  );

}


function drawParticles() {

  particles.forEach(
    (particle) => {

      ctx.globalAlpha =
        Math.max(
          0,
          particle.life / 40
        );


      ctx.font =
        "20px serif";


      ctx.fillText(

        particle.emoji,

        particle.x,

        particle.y

      );

    }
  );


  ctx.globalAlpha = 1;

}


function drawOverlay(
  title,
  subtitle
) {

  ctx.fillStyle =
    "rgba(11,31,16,0.78)";


  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );


  ctx.fillStyle =
    "#ffffff";


  ctx.textAlign =
    "center";


  ctx.font =
    "bold 58px system-ui";


  ctx.fillText(

    title,

    WIDTH / 2,

    HEIGHT / 2 - 25

  );


  ctx.font =
    "24px system-ui";


  ctx.fillText(

    subtitle,

    WIDTH / 2,

    HEIGHT / 2 + 28

  );


  ctx.textAlign =
    "left";

}


function drawSmallMessage(message) {

  ctx.fillStyle =
    "rgba(0,0,0,0.72)";


  ctx.fillRect(

    WIDTH / 2 - 330,

    24,

    660,

    55

  );


  ctx.fillStyle =
    "#ffffff";


  ctx.font =
    "bold 21px system-ui";


  ctx.textAlign =
    "center";


  ctx.fillText(

    message,

    WIDTH / 2,

    59

  );


  ctx.textAlign =
    "left";

}


function rectsOverlap(a, b) {

  return (

    a.x < b.x + b.w &&

    a.x + a.w > b.x &&

    a.y < b.y + b.h &&

    a.y + a.h > b.y

  );

}


window.addEventListener(
  "keydown",
  (event) => {

    keys[event.key] = true;


    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " "
      ].includes(event.key)
    ) {

      event.preventDefault();

    }


    if (
      !event.repeat &&

      [
        "ArrowUp",
        "w",
        "W",
        " "
      ].includes(event.key)
    ) {

      jump();

    }


    if (
      !event.repeat &&

      [
        "f",
        "F"
      ].includes(event.key)
    ) {

      attack();

    }


    if (
      !event.repeat &&

      [
        "e",
        "E"
      ].includes(event.key)
    ) {

      useSpecial();

    }


    if (
      !event.repeat &&

      [
        "r",
        "R"
      ].includes(event.key) &&

      chosenHero
    ) {

      resetGame();

      gameState = "playing";

    }

  }
);


window.addEventListener(
  "keyup",
  (event) => {

    keys[event.key] = false;

  }
);


function bindHoldButton(
  id,
  keyName
) {

  const button =
    document.getElementById(id);


  const press = (event) => {

    event.preventDefault();

    keys[keyName] = true;

  };


  const release = (event) => {

    event.preventDefault();

    keys[keyName] = false;

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


document
  .getElementById("jumpButton")
  .addEventListener(
    "pointerdown",
    (event) => {

      event.preventDefault();

      jump();

    }
  );


document
  .getElementById("attackButton")
  .addEventListener(
    "pointerdown",
    (event) => {

      event.preventDefault();

      attack();

    }
  );


document
  .getElementById("specialButton")
  .addEventListener(
    "pointerdown",
    (event) => {

      event.preventDefault();

      useSpecial();

    }
  );
