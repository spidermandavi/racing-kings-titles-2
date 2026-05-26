let homeRenderToken = 0;

let topPlayers = [];

async function renderHome() {
  const app = document.getElementById("app");
  if (!app) return;

  const token = ++homeRenderToken;
  showSpinner();

  app.innerHTML = `
    <h1>RK Titles</h1>
    <p>Top Racing Kings players on Lichess</p>

    <section class="section-card">
      <h2>🏆 Top Titled Players</h2>
      <div id="homeTitled" class="player-list"></div>
    </section>

    <section class="section-card">
      <h2>📈 Top Players</h2>
      <div id="homeTop" class="player-list"></div>
    </section>
  `;

  renderHomeLists(token);

  try {
    const titled = sortPlayers(getTitledPlayers());

    await loadPlayersProgressively(titled, () => {
      if (token !== homeRenderToken) return;
      renderHomeLists(token);
    });

    const lichessTop = await fetchTopRKPlayers(10);

    topPlayers = lichessTop.map(p => ({
      username: p.username,
      rating: p.rating,
      title: p.title
    }));

    if (token !== homeRenderToken) return;
    renderHomeLists(token);

  } finally {
    if (token === homeRenderToken) {
      hideSpinner();
    }
  }
}

function renderHomeLists(token = homeRenderToken) {
  if (token !== homeRenderToken) return;

  const titledEl = document.getElementById("homeTitled");
  const topEl = document.getElementById("homeTop");

  if (titledEl) {
    const titled = sortPlayers(getTitledPlayers());

    titledEl.innerHTML = titled.length
      ? titled.map((p, i) => renderHomeRow(p, i + 1)).join("")
      : `<div class="muted">No titled players yet.</div>`;
  }

  if (topEl) {
    const top = sortPlayers([...topPlayers]);

    topEl.innerHTML = top.length
      ? top.map((p, i) => renderHomeRow(p, i + 1)).join("")
      : `<div class="muted">No players yet.</div>`;
  }
}

function renderHomeRow(player, rank = "") {
  const badge = player.title
    ? `<span class="badge">${escapeHtml(player.title)}</span>`
    : "";

  const isTitled = !!player.title;

  return `
    <div class="player-row ${isTitled ? "titled" : ""}">
      <span data-label="#">${rank ? "#" + rank : ""}</span>

      <span class="player-name" data-label="Player">
        ${escapeHtml(player.username)} ${badge}
      </span>

      <span class="player-rating" data-label="Rating">
        ${player.rating ?? "..."}
      </span>
    </div>
  `;
}
