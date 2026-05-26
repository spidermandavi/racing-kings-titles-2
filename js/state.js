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

    if (A.isKing !== B.isKing) return B.isKing - A.isKing;
    if (A.mainRank !== B.mainRank) return B.mainRank - A.mainRank;
    if (A.specialRank !== B.specialRank) return B.specialRank - A.specialRank;
    if (A.rating !== B.rating) return B.rating - A.rating;
    if (A.bestRatedWin !== B.bestRatedWin) return B.bestRatedWin - A.bestRatedWin;
    if (A.gamesPlayed !== B.gamesPlayed) return B.gamesPlayed - A.gamesPlayed;

    return A.username.localeCompare(B.username);
  });
}
function applyFilter(list) {
  if (currentFilter === "titles") {
    return sortPlayers(list);
  }

  if (currentFilter === "rating") {
    return [...list].sort((a, b) => {
      return (b.rating || 0) - (a.rating || 0);
    });
  }

  // Filter by specific title
  return list.filter(player => {
    const titles = getPlayerTitles(player);
    return titles.includes(currentFilter);
  }).sort((a, b) => {
    return (b.rating || 0) - (a.rating || 0);
  });
}

// ===== CACHE =====

let playerCache = {};
const CACHE_PREFIX = "rk_cache_";

function cacheKey(username) {
  return CACHE_PREFIX + username.toLowerCase();
}

function getCachedPlayer(username) {
  const key = cacheKey(username);

  if (playerCache[key]) return playerCache[key];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    playerCache[key] = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedPlayer(username, data) {
  const key = cacheKey(username);
  playerCache[key] = data;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function clearCache() {
  playerCache = {};

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}

  players.forEach(p => {
    p.rating = null;
    p.peakRating = null;
    p.gamesPlayed = null;
    p.winRate = null;
    p.bestRatedWin = null;
  });
}

// ===== FIND =====

function findPlayer(username) {
  return players.find(p => p.username.toLowerCase() === username.toLowerCase());
}

function getTitledPlayers() {
  return players.filter(p => getMainTitle(p) !== "NONE");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}
