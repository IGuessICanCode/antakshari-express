import { renderScoreboard, showWord, hideWord, highlightRow } from "./ui.js";

const POINTS_PER_SCORE = 10;
const WINNING_SCORE = 70;
const successSound = new Audio("success.mp3");
successSound.preload = "auto";

const WORDS = [
  "dil","pyaar","ishq","mohabbat","yaadein","khushi","gham","junoon","armaan",
  "raat","din","subah","shaam","chand","taare","baarish","hawa",
  "sajna","piya","dost","yaar","mehboob","sanam",
  "chal","ruk","jaana","aana","dekho","sun","bolo",
  "zindagi","safar","raaste","kahani","khwab","sapna",
  "naina","ankhon","baatein","pal","lamhe","dilbar","sitam","kasam"
];

let players = [];
let usedWords = new Set();
let currentWord = null;
let roundActive = false;
let sessionRef = null;
let sessionStart = null;
let wordsRevealed = 0;
let firestoreUpdate = null;

const setupCard    = document.getElementById("setupCard");
const gamePlay     = document.getElementById("gamePlay");
const playerInput  = document.getElementById("playerNameInput");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const startGameBtn = document.getElementById("startGameBtn");
const playerList   = document.getElementById("playerList");
const revealWordBtn = document.getElementById("revealWordBtn");
const wordDisplay  = document.getElementById("wordDisplay");
const howToBtn     = document.getElementById("howToBtn");
const howToBtnSetup = document.getElementById("howToBtnSetup");
const newGameBtn   = document.getElementById("newGameBtn");
const howToOverlay = document.getElementById("howToOverlay");
const closeHowToBtn = document.getElementById("closeHowToBtn");
const winnerOverlay = document.getElementById("winnerOverlay");
const winnerName   = document.getElementById("winnerName");
const winnerRestartBtn = document.getElementById("winnerRestartBtn");

/* ================================
   HOW TO PLAY
================================ */

function openHowTo() { howToOverlay.classList.remove("hidden"); }
function closeHowTo() { howToOverlay.classList.add("hidden"); }

howToBtn.onclick = openHowTo;
howToBtnSetup.onclick = openHowTo;
closeHowToBtn.onclick = closeHowTo;

/* ================================
   SETUP
================================ */

addPlayerBtn.onclick = () => {
  const name = playerInput.value.trim();
  if (!name) return;
  if (players.length >= 10) return alert("Max 10 players");

  players.push({ id: Date.now(), name, score: 0 });
  playerInput.value = "";
  render();
};

startGameBtn.onclick = async () => {
  if (players.length < 2) { alert("Add at least 2 players"); return; }

  setupCard.classList.add("hidden");
  gamePlay.classList.remove("hidden");

  sessionStart = Date.now();
  wordsRevealed = 0;

  try {
    const { db } = await import("./firebase-init.js");
    const { collection, addDoc, updateDoc, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    firestoreUpdate = (data) => updateDoc(sessionRef, data).catch(() => {});

    sessionRef = await addDoc(collection(db, "sessions"), {
      startedAt:       serverTimestamp(),
      playerCount:     players.length,
      playerNames:     players.map(p => p.name),
      wordsRevealed:   0,
      durationSeconds: null,
      finalScores:     null,
    });
  } catch (e) {
    console.error("Session tracking unavailable:", e);
  }
};

/* ================================
   GAMEPLAY
================================ */

revealWordBtn.onclick = () => {
  roundActive = false;

  if (usedWords.size === WORDS.length) usedWords.clear();

  let word;
  do { word = WORDS[Math.floor(Math.random() * WORDS.length)]; }
  while (usedWords.has(word));

  usedWords.add(word);
  currentWord = word;
  roundActive = true;
  wordsRevealed++;
  showWord(wordDisplay, word);

  if (sessionRef && firestoreUpdate) firestoreUpdate({ wordsRevealed });
};

function scorePoint(playerId) {
  if (!roundActive) return;
  roundActive = false;

  const p = players.find(pl => pl.id === playerId);
  if (!p) return;

  successSound.currentTime = 0;
  successSound.play();

  p.score += POINTS_PER_SCORE;
  highlightRow(playerId);
  render();

  if (p.score >= WINNING_SCORE) {
    setTimeout(() => showWinner(p.name), 300);
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
   WINNER
================================ */

function showWinner(name) {
  winnerName.textContent = `${name} wins! 🎉`;
  winnerOverlay.classList.remove("hidden");

  if (sessionRef && sessionStart && firestoreUpdate) {
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    firestoreUpdate({
      durationSeconds: duration,
      finalScores: players.map(p => ({ name: p.name, score: p.score })),
    });
  }
}

newGameBtn.onclick = winnerRestartBtn.onclick = async () => {
  if (sessionRef && sessionStart && firestoreUpdate) {
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    try {
      await firestoreUpdate({
        durationSeconds: duration,
        finalScores: players.map(p => ({ name: p.name, score: p.score })),
      });
    } catch (e) {}
  }
  location.reload();
};

window.addEventListener("beforeunload", () => {
  if (sessionRef && sessionStart && firestoreUpdate) {
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    firestoreUpdate({
      durationSeconds: duration,
      finalScores: players.map(p => ({ name: p.name, score: p.score })),
    });
  }
});

window.addEventListener("load", () => { openHowTo(); });
