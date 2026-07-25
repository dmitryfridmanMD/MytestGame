
out = Path("/mnt/data/javascript_village_game")
out.mkdir(exist_ok=True)

index_html = """<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JavaScript Village</title>
</head>
<body>
  <script src="game.js"></script>
</body>
</html>
"""

game_js = r"""
(() => {
  "use strict";

  // -----------------------------
  // Page setup — created in JavaScript
  // -----------------------------
  document.title = "JavaScript Village";

  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, Helvetica, sans-serif;
      color: #1f2a22;
      background: linear-gradient(#9ed7ff 0 38%, #7fcf6a 38% 100%);
      overflow-x: hidden;
    }

    button {
      font: inherit;
    }

    .game-shell {
      width: min(1100px, 100%);
      margin: 0 auto;
      padding: 18px;
    }

    .topbar {
      display: flex;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 14px;
      padding: 12px 14px;
      background: rgba(255,255,255,.9);
      border: 2px solid rgba(31,42,34,.15);
      border-radius: 16px;
    }

    .title {
      margin: 0;
      font-size: clamp(24px, 4vw, 38px);
    }

    .stats {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .stat {
      padding: 8px 12px;
      border-radius: 999px;
      background: #fff7cd;
      border: 1px solid #d8c77e;
      font-weight: 700;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 280px;
      gap: 14px;
    }

    .world {
      position: relative;
      min-height: 620px;
      overflow: hidden;
      border: 4px solid rgba(61,77,51,.5);
      border-radius: 24px;
      background:
        radial-gradient(circle at 12% 20%, #6dbd54 0 5%, transparent 5.4%),
        radial-gradient(circle at 80% 17%, #5dad49 0 6%, transparent 6.5%),
        radial-gradient(circle at 88% 72%, #5dad49 0 5%, transparent 5.4%),
        linear-gradient(#7dcc68, #6dbd54);
      box-shadow: inset 0 0 70px rgba(41,86,34,.18);
    }

    .road {
      position: absolute;
      left: 50%;
      top: -10%;
      width: 120px;
      height: 120%;
      transform: translateX(-50%) rotate(7deg);
      background: #d9c190;
      border-left: 4px solid rgba(135,104,61,.35);
      border-right: 4px solid rgba(135,104,61,.35);
    }

    .river {
      position: absolute;
      left: -8%;
      bottom: 8%;
      width: 120%;
      height: 92px;
      transform: rotate(-5deg);
      background: linear-gradient(#5dc8f2, #359bd5);
      border-top: 5px solid rgba(255,255,255,.35);
      border-bottom: 5px solid rgba(21,90,134,.28);
    }

    .bridge {
      position: absolute;
      left: 46%;
      bottom: 10.5%;
      width: 145px;
      height: 70px;
      transform: rotate(-5deg);
      border-radius: 10px;
      background: repeating-linear-gradient(
        90deg,
        #8d5d31 0 15px,
        #a97643 15px 29px
      );
      border: 4px solid #6f451f;
      z-index: 3;
    }

    .place {
      position: absolute;
      min-width: 115px;
      min-height: 90px;
      padding: 12px;
      border: 3px solid rgba(55,49,35,.65);
      border-radius: 18px;
      background: #f6e2b7;
      cursor: pointer;
      box-shadow: 0 7px 0 rgba(73,59,35,.18);
      transition: transform .14s ease, filter .14s ease;
      text-align: center;
      font-weight: 700;
      z-index: 4;
    }

    .place:hover,
    .place:focus-visible {
      transform: translateY(-4px) scale(1.03);
      filter: brightness(1.04);
      outline: 4px solid rgba(255,255,255,.8);
    }

    .place .icon {
      display: block;
      font-size: 40px;
      margin-bottom: 5px;
    }

    .house { left: 7%; top: 15%; }
    .shop { right: 8%; top: 16%; background: #ffe3dc; }
    .well { left: 40%; top: 36%; background: #d8eff5; }
    .forest { right: 7%; top: 44%; background: #cce7ba; }
    .farm { left: 7%; top: 51%; background: #f5ddb2; }
    .cave { right: 15%; bottom: 7%; background: #c7c0b7; }
    .chest {
      left: 39%;
      bottom: 6%;
      min-width: 90px;
      min-height: 75px;
      background: #d8a760;
    }

    .player {
      position: absolute;
      left: 48%;
      top: 55%;
      width: 58px;
      height: 58px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #fff;
      border: 4px solid #415243;
      font-size: 34px;
      z-index: 10;
      transition: left .4s ease, top .4s ease;
      box-shadow: 0 6px 0 rgba(0,0,0,.15);
      pointer-events: none;
    }

    .sidebar {
      display: grid;
      gap: 14px;
      align-content: start;
    }

    .panel {
      padding: 14px;
      background: rgba(255,255,255,.93);
      border: 2px solid rgba(31,42,34,.15);
      border-radius: 16px;
    }

    .panel h2 {
      margin: 0 0 10px;
      font-size: 20px;
    }

    .inventory-list,
    .quest-list {
      margin: 0;
      padding-left: 20px;
    }

    .empty {
      color: #69736b;
      font-style: italic;
    }

    .message-box {
      min-height: 120px;
      line-height: 1.45;
    }

    .action-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .action-button {
      border: 0;
      border-radius: 10px;
      padding: 9px 12px;
      background: #395c42;
      color: white;
      cursor: pointer;
      font-weight: 700;
    }

    .action-button:hover,
    .action-button:focus-visible {
      background: #294732;
      outline: 3px solid rgba(57,92,66,.25);
    }

    .restart {
      width: 100%;
      border: 2px solid #874d3e;
      border-radius: 12px;
      padding: 10px;
      background: #fff2ef;
      color: #6e3428;
      font-weight: 700;
      cursor: pointer;
    }

    .hint {
      margin: 0;
      font-size: 14px;
      color: #526056;
    }

    @media (max-width: 820px) {
      .layout { grid-template-columns: 1fr; }
      .world { min-height: 580px; }
      .sidebar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .sidebar .panel:first-child { grid-column: 1 / -1; }
      .restart { grid-column: 1 / -1; }
    }

    @media (max-width: 540px) {
      .game-shell { padding: 8px; }
      .world { min-height: 540px; }
      .place {
        min-width: 92px;
        min-height: 76px;
        padding: 8px;
        font-size: 13px;
      }
      .place .icon { font-size: 30px; }
      .sidebar { grid-template-columns: 1fr; }
      .sidebar .panel:first-child { grid-column: auto; }
      .house { left: 3%; }
      .shop { right: 3%; }
      .forest { right: 2%; }
      .farm { left: 2%; }
    }
  `;
  document.head.appendChild(style);

  // -----------------------------
  // Game data
  // -----------------------------
  const state = {
    coins: 5,
    inventory: [],
    quests: [],
    flags: {
      metMayor: false,
      tookWaterQuest: false,
      filledBucket: false,
      deliveredWater: false,
      foundHerbs: false,
      soldHerbs: false,
      chestOpened: false,
      caveUnlocked: false,
      caveTreasure: false
    }
  };

  const locations = [
    { id: "house", label: "Mayor's House", icon: "🏠", className: "house", x: "13%", y: "25%" },
    { id: "shop", label: "Village Shop", icon: "🏪", className: "shop", x: "77%", y: "25%" },
    { id: "well", label: "Old Well", icon: "🪣", className: "well", x: "47%", y: "43%" },
    { id: "forest", label: "Whispering Forest", icon: "🌲", className: "forest", x: "77%", y: "52%" },
    { id: "farm", label: "Sunny Farm", icon: "🌾", className: "farm", x: "14%", y: "58%" },
    { id: "cave", label: "Moon Cave", icon: "🕳️", className: "cave", x: "73%", y: "79%" },
    { id: "chest", label: "Old Chest", icon: "🧰", className: "chest", x: "45%", y: "82%" }
  ];

  // -----------------------------
  // Build interface in JavaScript
  // -----------------------------
  const shell = document.createElement("main");
  shell.className = "game-shell";

  const topbar = document.createElement("section");
  topbar.className = "topbar";

  const heading = document.createElement("h1");
  heading.className = "title";
  heading.textContent = "JavaScript Village";

  const stats = document.createElement("div");
  stats.className = "stats";

  const coinStat = document.createElement("div");
  coinStat.className = "stat";

  const statusStat = document.createElement("div");
  statusStat.className = "stat";

  stats.append(coinStat, statusStat);
  topbar.append(heading, stats);

  const layout = document.createElement("div");
  layout.className = "layout";

  const world = document.createElement("section");
  world.className = "world";
  world.setAttribute("aria-label", "Clickable village map");

  const road = document.createElement("div");
  road.className = "road";

  const river = document.createElement("div");
  river.className = "river";

  const bridge = document.createElement("div");
  bridge.className = "bridge";

  const player = document.createElement("div");
  player.className = "player";
  player.textContent = "🧙";
  player.setAttribute("aria-label", "Player");

  world.append(road, river, bridge);

  locations.forEach((location) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `place ${location.className}`;
    button.dataset.location = location.id;
    button.innerHTML = `<span class="icon" aria-hidden="true">${location.icon}</span>${location.label}`;
    button.addEventListener("click", () => visit(location));
    world.appendChild(button);
  });

  world.appendChild(player);

  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";

  const messagePanel = makePanel("Village Log");
  const messageBox = document.createElement("div");
  messageBox.className = "message-box";
  messageBox.setAttribute("aria-live", "polite");
  messagePanel.appendChild(messageBox);

  const inventoryPanel = makePanel("Inventory");
  const inventoryList = document.createElement("ul");
  inventoryList.className = "inventory-list";
  inventoryPanel.appendChild(inventoryList);

  const questPanel = makePanel("Quests");
  const questList = document.createElement("ul");
  questList.className = "quest-list";
  questPanel.appendChild(questList);

  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.className = "restart";
  restartButton.textContent = "Restart Game";
  restartButton.addEventListener("click", restartGame);

  sidebar.append(messagePanel, inventoryPanel, questPanel, restartButton);
  layout.append(world, sidebar);
  shell.append(topbar, layout);
  document.body.appendChild(shell);

  function makePanel(title) {
    const panel = document.createElement("section");
    panel.className = "panel";
    const h2 = document.createElement("h2");
    h2.textContent = title;
    panel.appendChild(h2);
    return panel;
  }

  // -----------------------------
  // Core helpers
  // -----------------------------
  function setMessage(text, actions = []) {
    messageBox.innerHTML = "";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    messageBox.appendChild(paragraph);

    if (actions.length) {
      const row = document.createElement("div");
      row.className = "action-row";

      actions.forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "action-button";
        button.textContent = action.label;
        button.addEventListener("click", action.run);
        row.appendChild(button);
      });

      messageBox.appendChild(row);
    }
  }

  function addItem(item) {
    if (!state.inventory.includes(item)) {
      state.inventory.push(item);
    }
    render();
  }

  function removeItem(item) {
    state.inventory = state.inventory.filter((entry) => entry !== item);
    render();
  }

  function hasItem(item) {
    return state.inventory.includes(item);
  }

  function addQuest(quest) {
    if (!state.quests.includes(quest)) {
      state.quests.push(quest);
    }
    render();
  }

  function completeQuest(quest) {
    state.quests = state.quests.filter((entry) => entry !== quest);
    render();
  }

  function movePlayer(location) {
    player.style.left = location.x;
    player.style.top = location.y;
  }

  function render() {
    coinStat.textContent = `🪙 Coins: ${state.coins}`;

    const completed =
      Number(state.flags.deliveredWater) +
      Number(state.flags.soldHerbs) +
      Number(state.flags.caveTreasure);

    statusStat.textContent = `⭐ Adventures: ${completed}/3`;

    inventoryList.innerHTML = "";
    if (!state.inventory.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Your bag is empty.";
      inventoryList.appendChild(empty);
    } else {
      state.inventory.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        inventoryList.appendChild(li);
      });
    }

    questList.innerHTML = "";
    if (!state.quests.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "No active quests.";
      questList.appendChild(empty);
    } else {
      state.quests.forEach((quest) => {
        const li = document.createElement("li");
        li.textContent = quest;
        questList.appendChild(li);
      });
    }
  }

  // -----------------------------
  // Location interactions
  // -----------------------------
  function visit(location) {
    movePlayer(location);

    const handlers = {
      house: visitHouse,
      shop: visitShop,
      well: visitWell,
      forest: visitForest,
      farm: visitFarm,
      cave: visitCave,
      chest: visitChest
    };

    handlers[location.id]();
  }

  function visitHouse() {
    if (!state.flags.metMayor) {
      state.flags.metMayor = true;
      setMessage(
        "Mayor Rowan welcomes you. The farm's water barrel is empty, and the crops are beginning to wilt.",
        [
          {
            label: "Accept water quest",
            run: () => {
              state.flags.tookWaterQuest = true;
              addQuest("Bring a bucket of water to the farm");
              addItem("Empty Bucket");
              setMessage("The mayor gives you an empty bucket. The old well is near the center of the village.");
            }
          },
          {
            label: "Maybe later",
            run: () => setMessage("Mayor Rowan nods. You can return whenever you are ready.")
          }
        ]
      );
      return;
    }

    if (state.flags.filledBucket && !state.flags.deliveredWater) {
      setMessage("You have water, but it belongs at the farm.");
      return;
    }

    if (state.flags.deliveredWater) {
      setMessage("Mayor Rowan thanks you again. The village crops are thriving.");
      return;
    }

    if (!state.flags.tookWaterQuest) {
      setMessage("Mayor Rowan is still worried about the thirsty crops.", [
        {
          label: "Accept water quest",
          run: () => {
            state.flags.tookWaterQuest = true;
            addQuest("Bring a bucket of water to the farm");
            addItem("Empty Bucket");
            setMessage("You receive an empty bucket.");
          }
        }
      ]);
      return;
    }

    setMessage("Mayor Rowan says, “Fill the bucket at the old well, then take it to the farm.”");
  }

  function visitWell() {
    if (!hasItem("Empty Bucket")) {
      setMessage("The well water is cool and clear, but you have nothing to carry it in.");
      return;
    }

    removeItem("Empty Bucket");
    addItem("Bucket of Water");
    state.flags.filledBucket = true;
    setMessage("You lower the bucket into the well and pull it back up full of sparkling water.");
  }

  function visitFarm() {
    if (hasItem("Bucket of Water") && !state.flags.deliveredWater) {
      removeItem("Bucket of Water");
      state.flags.deliveredWater = true;
      state.flags.filledBucket = false;
      state.coins += 10;
      completeQuest("Bring a bucket of water to the farm");
      render();
      setMessage("Farmer Mira pours the water into the crop barrel and rewards you with 10 coins.");
      return;
    }

    if (state.flags.deliveredWater) {
      setMessage("The farm is green again. Farmer Mira waves happily.");
      return;
    }

    setMessage("The crops look dry. A wooden barrel beside the field is completely empty.");
  }

  function visitForest() {
    if (!state.flags.foundHerbs) {
      state.flags.foundHerbs = true;
      addItem("Moonleaf Herbs");
      addQuest("Sell the moonleaf herbs at the village shop");
      setMessage("Beneath an ancient tree, you discover a bundle of rare moonleaf herbs.");
      return;
    }

    if (!state.flags.soldHerbs) {
      setMessage("The forest whispers in the wind. You already collected the rare herbs.");
      return;
    }

    setMessage("You hear birds singing among the trees. Nothing unusual appears today.");
  }

  function visitShop() {
    if (hasItem("Moonleaf Herbs") && !state.flags.soldHerbs) {
      setMessage("Shopkeeper Tavi's eyes widen when he sees the moonleaf herbs.", [
        {
          label: "Sell herbs for 15 coins",
          run: () => {
            removeItem("Moonleaf Herbs");
            state.flags.soldHerbs = true;
            state.coins += 15;
            completeQuest("Sell the moonleaf herbs at the village shop");
            render();
            setMessage("Tavi pays you 15 coins and gives you a small cave key as a bonus.");
            addItem("Moon Cave Key");
            state.flags.caveUnlocked = true;
          }
        },
        {
          label: "Keep the herbs",
          run: () => setMessage("You decide to keep the moonleaf herbs for now.")
        }
      ]);
      return;
    }

    if (state.flags.soldHerbs) {
      setMessage("Tavi has ordinary supplies today, but nothing you need for your current adventures.");
      return;
    }

    setMessage("The shop is filled with lanterns, bread, rope, and colorful bottles. Tavi mentions that rare herbs grow in the forest.");
  }

  function visitChest() {
    if (state.flags.chestOpened) {
      setMessage("The old chest is empty.");
      return;
    }

    state.flags.chestOpened = true;
    state.coins += 7;
    addItem("Silver Apple");
    render();
    setMessage("The rusty lock breaks open. Inside, you find 7 coins and a mysterious silver apple.");
  }

  function visitCave() {
    if (!state.flags.caveUnlocked && !hasItem("Moon Cave Key")) {
      setMessage("A heavy stone door blocks the cave. Its keyhole is shaped like a crescent moon.");
      return;
    }

    if (state.flags.caveTreasure) {
      setMessage("The cave is quiet now. Your footprints remain in the silver dust.");
      return;
    }

    setMessage("The moon-shaped key opens the cave. A crystal pedestal glows in the darkness.", [
      {
        label: "Take the crystal",
        run: () => {
          state.flags.caveTreasure = true;
          removeItem("Moon Cave Key");
          addItem("Moon Crystal");
          state.coins += 25;
          render();
          setMessage("You claim the Moon Crystal and discover 25 ancient coins. You completed the village adventure!");
        }
      },
      {
        label: "Leave it alone",
        run: () => setMessage("You step away from the crystal. It continues to glow softly.")
      }
    ]);
  }

  function restartGame() {
    state.coins = 5;
    state.inventory = [];
    state.quests = [];
    Object.keys(state.flags).forEach((key) => {
      state.flags[key] = false;
    });

    player.style.left = "48%";
    player.style.top = "55%";
    render();
    setMessage("Welcome to JavaScript Village. Click a building or landmark to explore.");
  }

  render();
  setMessage("Welcome to JavaScript Village. Click a building or landmark to explore.");
})();
"""

(out / "index.html").write_text(index_html, encoding="utf-8")
(out / "game.js").write_text(game_js.strip() + "\n", encoding="utf-8")

zip_path = Path("/mnt/data/javascript_village_game.zip")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(out / "index.html", arcname="index.html")
    z.write(out / "game.js", arcname="game.js")

print(f"Created: {zip_path}")
