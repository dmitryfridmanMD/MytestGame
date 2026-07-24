document.body.innerHTML = `
  <h2>Rock, Paper, Scissors</h2>
  <button>Rock</button>
  <button>Paper</button>
  <button>Scissors</button>
  <p id="result">Choose one!</p>
`;

document.body.style.cssText =
  "font-family:Arial;text-align:center;padding:40px";

const choices = ["Rock", "Paper", "Scissors"];

document.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    const player = button.textContent;
    const computer = choices[Math.floor(Math.random() * 3)];

    let result = "You lose!";

    if (player === computer) result = "Tie!";
    if (
      player === "Rock" && computer === "Scissors" ||
      player === "Paper" && computer === "Rock" ||
      player === "Scissors" && computer === "Paper"
    ) result = "You win!";

    document.getElementById("result").textContent =
      `Computer chose ${computer}. ${result}`;
  });
});
