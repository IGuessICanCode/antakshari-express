/* ================================
   SCOREBOARD
================================ */

export function renderScoreboard(container, players, onScore) {
  const oldPositions = new Map();

  // Record current positions
  Array.from(container.children).forEach(el => {
    oldPositions.set(el.dataset.id, el.getBoundingClientRect());
  });

  // Clear and re-render
  container.innerHTML = "";

  players.forEach(player => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.dataset.id = player.id;

    const name = document.createElement("div");
    name.textContent = player.name;

    const score = document.createElement("div");
    score.textContent = player.score;

    const btn = document.createElement("button");
    btn.textContent = "👍";
    btn.onclick = () => onScore(player.id);

    row.append(name, score, btn);
    container.appendChild(row);
  });

  // Animate movement
  Array.from(container.children).forEach(el => {
    const oldPos = oldPositions.get(el.dataset.id);
    if (!oldPos) return;

    const newPos = el.getBoundingClientRect();
    const dy = oldPos.top - newPos.top;

    if (dy !== 0) {
      el.style.transform = `translateY(${dy}px)`;
      el.style.transition = "transform 0s";

      requestAnimationFrame(() => {
        el.style.transition = "transform 300ms ease";
        el.style.transform = "translateY(0)";
      });
    }
  });
}


/* ================================
   WORD DISPLAY
================================ */

export function showWord(el, word) {
  el.textContent = word;
  el.classList.remove("hidden");
}

export function hideWord(el) {
  el.classList.add("hidden");
}

/* ================================
   FEEDBACK
================================ */

export function highlightRow(playerId) {
  const row = document.querySelector(`.score-row[data-id="${playerId}"]`);
  if (!row) return;

  row.style.transform = "scale(1.04)";
  setTimeout(() => {
    row.style.transform = "scale(1)";
  }, 250);
}
