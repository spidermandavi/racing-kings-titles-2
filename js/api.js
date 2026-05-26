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
