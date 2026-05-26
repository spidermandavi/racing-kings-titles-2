let playerSearchToken = 0;

async function renderPlayerSearch() {
  const app = document.getElementById("app");
  if (!app) return;

  const params = new URLSearchParams((window.location.hash.split("?")[1] || ""));
  const initialUser = params.get("u") ? decodeURIComponent(params.get("u")) : "";

  app.innerHTML = `
    <h1>Player Search</h1>
    <p>Search any Racing Kings player and view their latest stats.</p>
    <section class="section-card">
      <div class="search-row">
        <input id="playerSearchInput" type="text" placeholder="Enter Lichess username" value="${escapeHtml(initialUser)}" />
        <button id="playerSearchBtn">Search</button>
      </div>
      <div id="playerSearchResult" class="stats-grid"></div>
    </section>
  `;

  const input = document.getElementById("playerSearchInput");
  const btn = document.getElementById("playerSearchBtn");
  if (btn) btn.addEventListener("click", () => runPlayerSearch(input?.value || ""));
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runPlayerSearch(input.value || "");
    });
    input.focus();
  }

  if (initialUser) {
    await runPlayerSearch(initialUser);
  }
}

async function runPlayerSearch(rawUsername) {
  const username = String(rawUsername || "").trim();
  const el = document.getElementById("playerSearchResult");
  if (!el || !username) return;

  const token = ++playerSearchToken;
  showSpinner();
  el.innerHTML = "Loading...";

  try {
    const data = await loadPlayerData(username);
    if (token !== playerSearchToken) return;

    if (!data) {
      el.innerHTML = `<p>User not found.</p>`;
      return;
    }

    const winRate = data.winRate == null ? "—" : `${(Number(data.winRate) > 1 ? Number(data.winRate) : Number(data.winRate) * 100).toFixed(1)}%`;

    el.innerHTML = `
      <div class="stat-card"><span>Username</span><strong>${escapeHtml(data.username)}</strong></div>
      <div class="stat-card"><span>Title</span><strong>${escapeHtml(data.title || "—")}</strong></div>
      <div class="stat-card"><span>Rating</span><strong>${data.rating ?? "—"}</strong></div>
      <div class="stat-card"><span>Peak</span><strong>${data.peakRating ?? "—"}</strong></div>
      <div class="stat-card"><span>RK Games</span><strong>${data.gamesPlayed ?? "—"}</strong></div>
      <div class="stat-card"><span>Win Rate</span><strong>${winRate}</strong></div>
      <div class="stat-card"><span>Country</span><strong>${escapeHtml(data.country || "—")}</strong></div>
      <div class="stat-card"><span>Lichess</span><strong><a href="${data.lichessUrl}" target="_blank">Open profile</a></strong></div>
    `;
  } finally {
    hideSpinner();
  }
}
