document.body.innerHTML = `
  <h1>Animal Sounds Game</h1>
  <p>Choose an animal:</p>

  <div id="buttons"></div>

  <div id="animal">❓</div>
  <h2 id="name">Pick an animal!</h2>
  <p id="sound"></p>

  <button id="hear">🔊 Hear the Sound</button>
`;

document.body.style.cssText = `
  font-family: Arial, sans-serif;
  text-align: center;
  background: #e8f7ff;
  padding: 30px;
`;

const animals = {
  Dog: { picture: "🐶", sound: "Woof! Woof!" },
  Cat: { picture: "🐱", sound: "Meow! Meow!" },
  Cow: { picture: "🐮", sound: "Moo! Moo!" },
  Duck: { picture: "🦆", sound: "Quack! Quack!" },
  Lion: { picture: "🦁", sound: "Roar!" },
  Frog: { picture: "🐸", sound: "Ribbit! Ribbit!" }
};

const buttons = document.getElementById("buttons");
const animalPicture = document.getElementById("animal");
const animalName = document.getElementById("name");
const animalSound = document.getElementById("sound");
const hearButton = document.getElementById("hear");

animalPicture.style.cssText = "font-size:120px;margin:20px";
animalSound.style.cssText = "font-size:30px;font-weight:bold";

let selectedSound = "";

Object.keys(animals).forEach(name => {
  const button = document.createElement("button");

  button.textContent = `${animals[name].picture} ${name}`;
  button.style.cssText = `
    font-size: 18px;
    padding: 10px 15px;
    margin: 5px;
    cursor: pointer;
  `;

  button.addEventListener("click", () => {
    animalPicture.textContent = animals[name].picture;
    animalName.textContent = name;
    animalSound.textContent = animals[name].sound;
    selectedSound = animals[name].sound;
  });

  buttons.appendChild(button);
});

hearButton.addEventListener("click", () => {
  if (!selectedSound) {
    animalSound.textContent = "Choose an animal first!";
    return;
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(
    new SpeechSynthesisUtterance(selectedSound)
  );
});
