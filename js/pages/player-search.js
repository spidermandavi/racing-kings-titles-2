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
function renderTitles() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Titles</h1>

    <div class="titles-grid">

      <div class="title-card elite">
        <h2>RKSGM</h2>
        <p class="title-name">Racing Kings Super Grandmaster</p>
        <p class="req"><strong>Requirements:</strong> At least 5000 rated RK games, reach 2500 rating, win 5 rated RK tournaments with a performance of at least 2500 and with at least 10 games.</p>
      </div>

      <div class="title-card grand">
        <h2>RKGM</h2>
        <p class="title-name">Racing Kings Grandmaster</p>
        <p class="req"><strong>Requirements:</strong> At least 3000 rated RK games, reach 2400 rating, win 3 rated RK tournaments with a performance of at least 2400 and with at least 10 games.</p>
      </div>

      <div class="title-card master">
        <h2>RKM</h2>
        <p class="title-name">Racing Kings Master</p>
        <p class="req"><strong>Requirements:</strong> At least 1000 rated RK games, reach 2100 rating for tier 1, 2200 for tier 2, 2300 for tier 3 (bronze,silver,gold) , win 3 rated RK tournaments with a performance of at least 2100 (2200,2300) and with at least 10 games.</p>
      </div>

      <div class="title-card candidate">
        <h2>RKCM</h2>
        <p class="title-name">Racing Kings Candidate Master</p>
        <p class="req"><strong>Requirements:</strong> At least 500 rated RK games, reach 2000 rating, win 3 rated RK tournaments with a performance of at least 2000 and with at least 10 games.</p>
      </div>

      <div class="title-card candidate-light">
        <h2>RKC</h2>
        <p class="title-name">Racing Kings Candidate</p>
        <p class="req"><strong>Requirements:</strong> At least 100 rated RK games, reach 1900 rating, win 1 tournament with at least 10 games.</p>
      </div>

      <div class="title-card intermediate">
        <h2>RKI</h2>
        <p class="title-name">Racing Kings Intermediate</p>
        <p class="req"><strong>Requirements:</strong> At least 100 rated RK games, reach 1800 rating.</p>
      </div>

      <div class="title-card beginner">
        <h2>RKB</h2>
        <p class="title-name">Racing Kings Beginner</p>
        <p class="req"><strong>Requirements:</strong> Play at least 30 rated RK games and apply for the title.</p>
      </div>

    </div>

    <h2 style="margin-top:40px;">Special Titles</h2>

    <div class="titles-grid">

      <div class="title-card special">
        <h2>RKK</h2>
        <p class="title-name">Racing Kings King</p>
        <p class="req"><strong>Requirements:</strong> Reach 2600 rating or win at least one Racing Kings World Championship (RKWC).</p>
      </div>

      <div class="title-card special">
        <h2>RKV</h2>
        <p class="title-name">Racing Kings Veteran</p>
        <p class="req"><strong>Requirements:</strong> Play at least 10,000 RK games or play Racing Kings for at least 5 years.</p>
      </div>

      <div class="title-card special">
        <h2>RKHM</h2>
        <p class="title-name">Racing Kings Honorary Master</p>
        <p class="req"><strong>Requirements:</strong> Accomplish something great for the Racing Kings community.</p>
      </div>

    </div>
  `;
}

function renderAbout() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>About RK Titles</h1>

    <div class="about-card">
      <p class="about-main">
        A community-driven ranking system for Racing Kings players.
      </p>

      <p class="about-sub">
        Not affiliated with Lichess.
      </p>

      <p>
        Created by 
        <a href="https://lichess.org/@/Mysterious_Past" target="_blank">Mysterious_Past</a>
        (with help from 
        <a href="https://lichess.org/@/spidermandavi" target="_blank">spidermandavi</a>, 
        <a href="https://lichess.org/@/Rank-8_RK" target="_blank">Rank-8_RK</a>, 
        <a href="https://lichess.org/@/SpiderM8_DJC" target="_blank">SpiderM8_DJC</a>)
      </p>

      <p>
        Please contact 
        <a href="https://lichess.org/@/Mysterious_Past" target="_blank">Mysterious_Past</a> 
        for suggestions, problems, questions, or to apply for a title.
      </p>
    </div>
  `;
}
// ===== LICHESS API WRAPPER =====

const LICHESS_BASE = "https://lichess.org/api/user/";

// ⭐ Fetch top Racing Kings players
async function fetchTopRKPlayers(limit = 10) {
  try {
    const res = await fetch(`https://lichess.org/api/player/top/${limit}/racingKings`);

    if (!res.ok) {
      throw new Error("Failed to fetch top players");
    }

    const data = await res.json();

    return data.users.map(u => ({
      username: u.username,
      rating: u.perfs?.racingKings?.rating ?? null,
      title: u.title ?? null
    }));
  } catch (err) {
    console.error("Top players API error:", err);
    return [];
  }
}

async function fetchLichessUser(username) {
  try {
    const res = await fetch(LICHESS_BASE + encodeURIComponent(username));

    if (!res.ok) {
      throw new Error("User not found");
    }

    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}

function extractRacingKings(data) {
  const rk = data?.perfs?.racingKings;

  if (!rk) {
    return {
      rating: null,
      peakRating: null,
      gamesPlayed: null,
      winRate: null
    };
  }

  return {
    rating: rk.rating ?? null,
    peakRating: rk.peak ?? null,
    gamesPlayed: rk.games ?? null,
    winRate: rk.winrate ?? null
  };
}

function syncPlayerData(username, data) {
  const player = findPlayer(username);
  if (player) {
    Object.assign(player, data);
  }
}

async function loadPlayerData(username) {
  const cacheKey = String(username).toLowerCase();
  const cached = getCachedPlayer(cacheKey);

  if (cached) {
    syncPlayerData(username, cached);
    return cached;
  }

  const data = await fetchLichessUser(username);
  if (!data) return null;

  const rk = extractRacingKings(data);

  const result = {
    username: data.username || data.id || username,
    ...rk
  };

  setCachedPlayer(cacheKey, result);
  syncPlayerData(username, result);

  return result;
}

async function loadPlayersProgressively(playerList, onUpdate) {
  const results = [];

  for (const p of playerList) {
    try {
      const data = await loadPlayerData(p.username);
      if (data) {
        results.push(data);
        if (typeof onUpdate === "function") {
          onUpdate(data);
        }
      }
    } catch (err) {
      console.error("Failed loading player:", p.username, err);
    }
  }

  return results;
}
// ===== PLAYERS DATA (MANUAL) =====

let players = [
  {
    id: 1,
    username: "Rank-8_RK",
    mainTitle: "RKI",
    extraTitles: [],
    titleAwarded: "2026-04-23",
    note: "Good RK player",
    rankOverride: null,
    rating: null,
    peakRating: null,
    gamesPlayed: null,
    winRate: null,
    bestRatedWin: null,
    history: []
  },
  {
    id: 2,
    username: "Mysterious_Past",
    mainTitle: "RKHM",
    extraTitles: [],
    titleAwarded: "2026-04-23",
    note: "Aggressive style",
    rankOverride: null,
    rating: null,
    peakRating: null,
    gamesPlayed: null,
    winRate: null,
    bestRatedWin: null,
    history: []
  },
  {
    id: 3,
    username: "Somerandomguy25",
    mainTitle: "RKM",
    extraTitles: [],
    titleAwarded: "2026-04-23",
    note: "Strong player, skillfull and fast",
    rankOverride: null,
    rating: null,
    peakRating: null,
    gamesPlayed: null,
    winRate: null,
    bestRatedWin: null,
    history: []
  },
  {
    id: 4,
    username: "ronavjaswal",
    mainTitle: "RKC",
    extraTitles: [],
    titleAwarded: "2026-04-24",
    note: "",
    rankOverride: null,
    rating: null,
    peakRating: null,
    gamesPlayed: null,
    winRate: null,
    bestRatedWin: null,
    history: []
  }
];

// ===== TITLE SYSTEM =====

const titleFullMap = {
  RKSGM: "Racing Kings Super Grandmaster",
  RKGM: "Racing Kings Grandmaster",
  RKM: "Racing Kings Master",
  RKCM: "Racing Kings Candidate Master",
  RKC: "Racing Kings Candidate",
  RKI: "Racing Kings Intermediate",
  RKB: "Racing Kings Beginner",
  RKK: "Racing Kings King",

  RKV: "Racing Kings Veteran",
  RKHM: "Racing Kings Honorary Master"
};
// ===== FILTER OPTIONS =====

const filterOptions = [
  { value: "titles", label: "Order by Titles" }, // default
  { value: "rating", label: "Order by Rating" },

  { value: "RKK", label: "RKK only" },

  { value: "RKSGM", label: "RKSGM only" },
  { value: "RKGM", label: "RKGM only" },
  { value: "RKM", label: "RKM only" },
  { value: "RKCM", label: "RKCM only" },
  { value: "RKC", label: "RKC only" },
  { value: "RKI", label: "RKI only" },
  { value: "RKB", label: "RKB only" },

  { value: "RKV", label: "RKV only" },
  { value: "RKHM", label: "RKHM only" }
];

let currentFilter = "titles";

// CSS CLASS MAPPING (YOUR COLORS)
const titleClassMap = {
  RKSGM: "elite",
  RKGM: "grand",
  RKM: "master",
  RKCM: "candidate",
  RKC: "candidate-light",
  RKI: "intermediate",
  RKB: "beginner",
  RKK: "elite"
};

// ===== TITLE PRIORITY =====

const titleOrder = {
  RKSGM: 7,
  RKGM: 6,
  RKM: 5,
  RKCM: 4,
  RKC: 3,
  RKI: 2,
  RKB: 1,
  NONE: 0
};

const specialTitleOrder = {
  RKV: 2,
  RKHM: 1
};

const kingTitle = "RKK";

// ===== HELPERS =====

function normalizeTitle(value) {
  return String(value || "").trim().toUpperCase();
}

function getPlayerTitles(player) {
  const titles = [];

  if (player.mainTitle) {
    titles.push(player.mainTitle);
  }

  if (Array.isArray(player.extraTitles)) {
    titles.push(...player.extraTitles);
  }

  return [...new Set(titles.map(normalizeTitle).filter(Boolean))];
}

function getMainTitle(player) {
  return normalizeTitle(player?.mainTitle) || "NONE";
}

function getSpecialTitles(player) {
  return (player.extraTitles || []).filter(t => specialTitleOrder[t] > 0);
}

function getMainTitleRank(player) {
  return titleOrder[getMainTitle(player)] || 0;
}

function getSpecialTitleRank(player) {
  const specials = getSpecialTitles(player);
  let best = 0;

  for (const t of specials) {
    best = Math.max(best, specialTitleOrder[t] || 0);
  }

  return best;
}

function hasKingTitle(player) {
  return getMainTitle(player) === kingTitle;
}

function getTitleFull(title) {
  return titleFullMap[title] || title;
}

function getTitleClass(title) {
  return titleClassMap[title] || "";
}

// ===== AUTO BEST WIN (LICHESS API) =====

async function fetchBestRatedWin(username) {
  try {
    const url = `https://lichess.org/api/games/user/${username}?max=50&perfType=racingKings`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/x-ndjson"
      }
    });

    if (!res.ok) return null;

    const text = await res.text();
    const games = text.trim().split("\n");

    let best = 0;

    for (const g of games) {
      const game = JSON.parse(g);

      const isWhite = game.players.white.user?.name.toLowerCase() === username.toLowerCase();
      const isBlack = game.players.black.user?.name.toLowerCase() === username.toLowerCase();

      if (!isWhite && !isBlack) continue;

      const player = isWhite ? game.players.white : game.players.black;
      const opponent = isWhite ? game.players.black : game.players.white;

      const win =
        (isWhite && game.winner === "white") ||
        (isBlack && game.winner === "black");

      if (win && opponent.rating) {
        best = Math.max(best, opponent.rating);
      }
    }

    return best;
  } catch (err) {
    console.warn("Best win fetch failed:", err);
    return null;
  }
}

// ===== SORT SYSTEM =====

function getSortMetrics(player) {
  return {
    isKing: hasKingTitle(player) ? 1 : 0,
    mainRank: getMainTitleRank(player),
    specialRank: getSpecialTitleRank(player),
    rating: Number(player?.rating || 0),
    bestRatedWin: Number(player?.bestRatedWin || 0),
    gamesPlayed: Number(player?.gamesPlayed || 0),
    username: String(player?.username || "")
  };
}

function sortPlayers(list) {
  return [...list].sort((a, b) => {
    if (a.rankOverride != null && b.rankOverride != null) {
      return a.rankOverride - b.rankOverride;
    }
    if (a.rankOverride != null) return -1;
    if (b.rankOverride != null) return 1;

    const A = getSortMetrics(a);
    const B = getSortMetrics(b);

/* 🌑 Global */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0f172a;
  color: #e5e7eb;
  overflow-x: hidden;
}

/* 🔝 Navbar */
#navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #020617;
  padding: 10px 20px;
  border-bottom: 1px solid #1e293b;
  position: sticky;
  top: 0;
  z-index: 20;
}

.nav-left {
  font-size: 20px;
  font-weight: bold;
}

.nav-links button {
  margin-left: 10px;
  padding: 6px 12px;
  background: #1e293b;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 6px;
}

.nav-links button:hover {
  background: #334155;
}

/* 🔄 Reload bar */
.reload-bar {
  padding: 10px 20px;
  text-align: right;
  border-bottom: 1px solid #1e293b;
  background: #0b1220;
}

.reload-bar button {
  padding: 6px 12px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background: #1e293b;
  color: #fff;
}

.reload-bar button:hover {
  background: #334155;
}

/* 📦 Main */
#app {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

.section-card {
  margin: 18px 0;
  padding: 16px;
  border: 1px solid #1e293b;
  border-radius: 12px;
  background: #0b1220;
}

.player-list {
  display: grid;
  gap: 10px;
}

/* ===== DESKTOP TABLE (FIXED) ===== */
.table-header,
.player-row {
  display: grid;
  grid-template-columns: 60px 1fr 90px;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
}

.player-row {
  background: #111827;
  border: 1px solid #1f2937;
}

.table-header {
  color: #94a3b8;
  font-size: 13px;
}

/* Text */
.player-name {
  font-weight: 600;
}

.player-rating,
.player-rank {
  color: #cbd5e1;
}

.rating-col {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Badges */
.badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #1d4ed8;
  color: #fff;
  font-size: 12px;
}

.special {
  border-left: 5px solid #cc66ff;
}

/* Highlight */
.player-row.titled {
  background: linear-gradient(90deg, rgba(255,215,0,0.15), transparent);
}

.muted {
  color: #94a3b8;
}

/* ⏳ Spinner */
.spinner-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #334155;
  border-top: 5px solid #38bdf8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 🚪 Popup */
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 110;
}

.popup {
  background: #020617;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  width: 320px;
  border: 1px solid #1e293b;
}

.popup input {
  width: 100%;
  padding: 8px 10px;
  margin: 10px 0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: white;
}

.popup-buttons button {
  margin: 5px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #1e293b;
  color: white;
}

/* Skeleton */
.skeleton {
  display: inline-block;
  min-width: 80px;
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Titles grid */
.titles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.title-card {
  padding: 15px;
  border-radius: 12px;
  background: #1e1e1e;
  color: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
}

.title-card:hover {
  transform: translateY(-5px);
}

/* Tier colors */
.elite { border-left: 5px solid #ff4d4d; }
.grand { border-left: 5px solid #ff9933; }
.master { border-left: 5px solid #ffd700; }
.candidate { border-left: 5px solid #4da6ff; }
.candidate-light { border-left: 5px solid #66ccff; }
.intermediate { border-left: 5px solid #66ff99; }
.beginner { border-left: 5px solid #cccccc; }

/* ===== MOBILE (BEST PRACTICE) ===== */
@media (max-width: 768px) {

  #app {
    padding: 12px;
  }

  #navbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .nav-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .nav-links button {
    margin-left: 0;
  }

  .table-header {
    display: none;
