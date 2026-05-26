let youRenderToken = 0;

async function renderYou() {
  const app = document.getElementById("app");
  if (!app) return;

  const username = localStorage.getItem("rk_username");

  if (!username || username === "SKIP") {
    app.innerHTML = `
      <h1>You</h1>
      <p>No player selected. Please choose a username.</p>
    `;
    return;
  }

  const token = ++youRenderToken;
  showSpinner();

  app.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <h1>${escapeHtml(username)}</h1>
        <div class="profile-actions">
          <button id="editUsernameBtn">Edit</button>
          <a 
            href="https://lichess.org/@/${encodeURIComponent(username)}" 
            target="_blank"
            class="lichess-btn"
          >
            View on Lichess
          </a>
        </div>
      </div>

      <div id="youStats" class="stats-grid">
        Loading...
      </div>
    </div>
  `;

  // Attach event
  setTimeout(() => {
    const btn = document.getElementById("editUsernameBtn");
    if (btn) btn.addEventListener("click", editUsername);
  }, 0);

  try {
    const data = await loadPlayerData(username);

    if (token !== youRenderToken) return;

    const statsEl = document.getElementById("youStats");

    if (!data) {
      if (statsEl) statsEl.innerHTML = `<p>User not found.</p>`;
      return;
    }

    renderYouStats(data);

  } catch (err) {
    const statsEl = document.getElementById("youStats");
    if (statsEl) statsEl.innerHTML = `<p>Failed to load data.</p>`;
  } finally {
    if (token === youRenderToken) {
      hideSpinner();
    }
  }
}

function renderYouStats(data) {
  const el = document.getElementById("youStats");
  if (!el) return;

  el.innerHTML = `
    <div class="stat-card">
      <span>Rating</span>
      <strong>${data.rating ?? "—"}</strong>
    </div>

    <div class="stat-card">
      <span>Peak</span>
      <strong>${data.peakRating ?? "—"}</strong>
    </div>

    <div class="stat-card">
      <span>RK Games</span>
      <strong>${data.gamesPlayed ?? "—"}</strong>
    </div>

    <div class="stat-card">
      <span>Win Rate</span>
      <strong>${data.winRate != null ? (data.winRate * 100).toFixed(1) + "%" : "—"}</strong>
    </div>

    <div class="stat-card">
      <span>Country</span>
      <strong>${escapeHtml(data.country || "—")}</strong>
    </div>
  `;
}

function editUsername() {
  showPopup();
}
