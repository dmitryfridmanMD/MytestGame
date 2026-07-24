const secret = Math.floor(Math.random() * 10) + 1;

document.body.innerHTML = `
  <h2>Guess the Number</h2>
  <p>I chose a number from 1 to 10.</p>
  <input id="guess" type="number" min="1" max="10">
  <button id="check">Guess</button>
  <p id="result"></p>
`;

document.body.style.cssText =
  "font-family:Arial;text-align:center;padding:40px";

document.getElementById("check").addEventListener("click", () => {
  const guess = Number(document.getElementById("guess").value);
  const result = document.getElementById("result");

  if (guess === secret) result.textContent = "Correct! You win!";
  else if (guess < secret) result.textContent = "Too low!";
  else result.textContent = "Too high!";
});
