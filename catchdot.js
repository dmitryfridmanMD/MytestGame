document.body.innerHTML = `
  <h2>Catch the Dot</h2>
  <p>Score: <span id="score">0</span></p>
  <div id="game"><button id="dot"></button></div>
`;

document.body.style.cssText =
  "font-family:Arial;text-align:center;background:#eef";

const game = document.getElementById("game");
game.style.cssText =
  "width:320px;height:320px;margin:auto;background:white;position:relative;border:2px solid #333";

const dot = document.getElementById("dot");
dot.style.cssText =
  "width:40px;height:40px;border:0;border-radius:50%;background:red;position:absolute;cursor:pointer";

let score = 0;

function moveDot() {
  dot.style.left = Math.random() * 280 + "px";
  dot.style.top = Math.random() * 280 + "px";
}

dot.onclick = () => {
  document.getElementById("score").textContent = ++score;
  moveDot();
};

moveDot();
