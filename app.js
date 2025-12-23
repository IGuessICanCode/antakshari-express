import { renderScoreboard, showWord, hideWord, highlightRow } from "./ui.js";

/* ================================
   CONFIG
================================ */

const POINTS_PER_SCORE = 10;
const WINNING_SCORE = 70;
const successSound = new Audio("success.mp3");
successSound.preload = "auto";


const WORDS = [
  "raat","sapna","dil","ishq","yaadein","khushi","pyaar","hum","tum","din",
    "gham","zindagi","jaan","bewafa","safar","saath","raasta","hawaa","taare",
    "ghar","sheher","chaand","pal","rang","junoon","baatein","aankh","mere",
    "tere","door","paas","pani","kuch","duniya","piya","phir","udd","pankh",
    "allah","main","bina","jawaani","chori","fevicol","sunita","nach","laila",
    "saturday","sajna","nahi","rani","raja","sauda","lift","kyaa","kyun","kala"
];


/* ================================
   STATE
================================ */

let players = [];
let usedWords = new Set();
let currentWord = null;
let roundActive = false;


/* ================================
   DOM
================================ */

const setupCard = document.getElementById("setupCard");
const gamePlay = document.getElementById("gamePlay");

const playerInput = document.getElementById("playerNameInput");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const startGameBtn = document.getElementById("startGameBtn");

const howToBtnSetup = document.getElementById("howToBtnSetup");


const playerList = document.getElementById("playerList");

const revealWordBtn = document.getElementById("revealWordBtn");
const wordDisplay = document.getElementById("wordDisplay");

const howToBtn = document.getElementById("howToBtn");
const newGameBtn = document.getElementById("newGameBtn");

const howToOverlay = document.getElementById("howToOverlay");
const closeHowToBtn = document.getElementById("closeHowToBtn");

const winnerOverlay = document.getElementById("winnerOverlay");
const winnerName = document.getElementById("winnerName");
const winnerRestartBtn = document.getElementById("winnerRestartBtn");

/* ================================
   HOW TO PLAY OVERLAY
================================ */

function openHowTo() {
  howToOverlay.classList.remove("hidden");
}

function closeHowTo() {
  howToOverlay.classList.add("hidden");
}

howToBtn.onclick = openHowTo;
howToBtnSetup.onclick = openHowTo;
closeHowToBtn.onclick = closeHowTo;

/* ================================
   SETUP FLOW
================================ */

addPlayerBtn.onclick = () => {
  const name = playerInput.value.trim();
  if (!name) return;
  if (players.length >= 10) return alert("Max 10 players");

  players.push({
    id: Date.now(),
    name,
    score: 0
  });

  playerInput.value = "";
  render();
};

startGameBtn.onclick = () => {
  if (players.length < 2) {
    alert("Add at least 2 players");
    return;
  }

  setupCard.classList.add("hidden");
  gamePlay.classList.remove("hidden");
};

/* ================================
   GAMEPLAY
================================ */

revealWordBtn.onclick = () => {
  // If a round was active, we're skipping it
  roundActive = false;

  if (usedWords.size === WORDS.length) {
    usedWords.clear();
  }

  let word;
  do {
    word = WORDS[Math.floor(Math.random() * WORDS.length)];
  } while (usedWords.has(word));

  usedWords.add(word);
  currentWord = word;

  roundActive = true;
  showWord(wordDisplay, word);
};


function scorePoint(playerId) {
  if (!roundActive) return;

  roundActive = false;

  const p = players.find(pl => pl.id === playerId);
  if (!p) return;

  // 🔊 play success sound
  successSound.currentTime = 0;
  successSound.play();

  p.score += POINTS_PER_SCORE;

  highlightRow(playerId);
  render();

  if (p.score >= WINNING_SCORE) {
    setTimeout(() => {
      showWinner(p.name);
    }, 300);
  }
}




/* ================================
   RENDER
================================ */

function render() {
  players.sort((a, b) => b.score - a.score);
  renderScoreboard(playerList, players, scorePoint);
}

/* ================================
   OVERLAYS
================================ */

howToBtn.onclick = () => {
  howToOverlay.classList.remove("hidden");
};

closeHowToBtn.onclick = () => {
  howToOverlay.classList.add("hidden");
};

newGameBtn.onclick = () => {
  location.reload();
};

winnerRestartBtn.onclick = () => {
  location.reload();
};

function showWinner(name) {
  winnerName.textContent = `${name} wins! 🎉`;
  winnerOverlay.classList.remove("hidden");
}

// Show How to Play on first load
window.addEventListener("load", () => {
  openHowTo();
});

