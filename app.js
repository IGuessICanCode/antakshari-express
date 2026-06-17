import { WORD_LISTS } from "./words.js";
import { renderScoreboard, showWord } from "./ui.js";
import { db } from "./firebase-init.js";
import {
  collection, addDoc, updateDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const setupCard = document.getElementById("setupCard");
const gamePlay = document.getElementById("gamePlay");

const playerInput = document.getElementById("playerInput");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const startGameBtn = document.getElementById("startGameBtn");
const revealWordBtn = document.getElementById("revealWordBtn");
const newGameBtn = document.getElementById("newGameBtn");

const wordDisplay = document.getElementById("wordDisplay");
const playerList = document.getElementById("playerList");
const wordCategorySelect = document.getElementById("wordCategory");

const howToOverlay = document.getElementById("howToOverlay");
const howToBtn = document.getElementById("howToBtn");
const howToBtnSetup = document.getElementById("howToBtnSetup");
const closeHowToBtn = document.getElementById("closeHowToBtn");

let players = [];
let ACTIVE_WORDS = [];
let usedWords = new Set();
let roundActive = false;
let sessionRef = null;
let sessionStart = null;
let wordsRevealed = 0;

function openHowTo() {
  howToOverlay.classList.remove("hidden");
}

function closeHowTo() {
  howToOverlay.classList.add("hidden");
}

howToBtn.onclick = openHowTo;
howToBtnSetup.onclick = openHowTo;
closeHowToBtn.onclick = closeHowTo;


/* ---------- ADD PLAYER ---------- */

addPlayerBtn.onclick = () => {
  const name = playerInput.value.trim();
  if (!name) return;

  players.push({
    id: Date.now(),
    name,
    score: 0
  });

  playerInput.value = "";
  renderScoreboard(playerList, players, handleScore);
};

/* ---------- START GAME ---------- */

startGameBtn.onclick = async () => {
  if (players.length < 2) {
    alert("Add at least 2 players");
    return;
  }

  const selectedCategory = wordCategorySelect.value;
  ACTIVE_WORDS = WORD_LISTS[selectedCategory];

  if (!ACTIVE_WORDS || ACTIVE_WORDS.length === 0) {
    alert("No words loaded");
    return;
  }

  wordCategorySelect.disabled = true;
  setupCard.classList.add("hidden");
  gamePlay.classList.remove("hidden");

  // Log session start to Firestore
  sessionStart = Date.now();
  wordsRevealed = 0;
  try {
    sessionRef = await addDoc(collection(db, "sessions"), {
      startedAt: serverTimestamp(),
      playerCount: players.length,
      playerNames: players.map(p => p.name),
      category: selectedCategory,
      wordsRevealed: 0,
      durationSeconds: null,
      finalScores: null,
    });
  } catch (e) {
    console.error("Session tracking error:", e);
  }
};

/* ---------- REVEAL WORD ---------- */

revealWordBtn.onclick = () => {
  if (!ACTIVE_WORDS.length) return;

  if (usedWords.size >= ACTIVE_WORDS.length) {
    usedWords.clear();
  }

  let word;
  do {
    word = ACTIVE_WORDS[Math.floor(Math.random() * ACTIVE_WORDS.length)];
  } while (usedWords.has(word));

  usedWords.add(word);
  roundActive = true;
  wordsRevealed++;
  showWord(wordDisplay, word);

  if (sessionRef) {
    updateDoc(sessionRef, { wordsRevealed }).catch(() => {});
  }
};

/* ---------- SCORE ---------- */

function handleScore(playerId) {
  if (!roundActive) return;

  const player = players.find(p => p.id === playerId);
  if (!player) return;

  player.score += 10;
  roundActive = false;

  players.sort((a, b) => b.score - a.score);
  renderScoreboard(playerList, players, handleScore);
}

/* ---------- OVERLAY ---------- */

howToBtn.onclick = howToBtnSetup.onclick = () => {
  howToOverlay.classList.remove("hidden");
};

closeHowToBtn.onclick = () => {
  howToOverlay.classList.add("hidden");
};

newGameBtn.onclick = async () => {
  if (sessionRef && sessionStart) {
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    try {
      await updateDoc(sessionRef, {
        durationSeconds: duration,
        finalScores: players.map(p => ({ name: p.name, score: p.score })),
      });
    } catch (e) {}
  }
  location.reload();
};

// Also log if user closes/refreshes the tab mid-game
window.addEventListener("beforeunload", () => {
  if (sessionRef && sessionStart) {
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    navigator.sendBeacon && updateDoc(sessionRef, {
      durationSeconds: duration,
      finalScores: players.map(p => ({ name: p.name, score: p.score })),
    }).catch(() => {});
  }
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#closeHowToBtn")) {
    document.getElementById("howToOverlay").classList.add("hidden");
  }
});
