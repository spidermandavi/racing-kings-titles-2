const leaderboard = document.getElementById("leaderboard");

const menuPanel = document.getElementById("menuPanel");

const pages = [
  "index",
  "players",
  "profile",
  "search",
  "titles",
  "about",
  "leaderboard"
];

pages.forEach(page => {
  const link = document.createElement("a");

  link.href = `${page}.html`;

  link.textContent =
    page.charAt(0).toUpperCase() + page.slice(1);

  menuPanel.appendChild(link);
});

document
  .getElementById("menuBtn")
  .addEventListener("click", () => {
    menuPanel.classList.toggle("open");
  });

document
  .getElementById("backBtn")
  .addEventListener("click", () => history.back());

document
  .getElementById("forwardBtn")
  .addEventListener("click", () => history.forward());

const titlePriority = {
  RKSGM: 5,
  RKGM: 4,
  RKIM: 3,
  RKM: 2,
  RKCM: 1,
};

const specialTitles = [
  "RKV",
  "RKWC",
  "RKHM"
];

const titleClassMap = {
  RKSGM: "elite",
  RKGM: "grand",
  RKIM: "master",
  RKM: "candidate",
  RKCM: "candidate-light",
  RKWC: "elite"
};

function normalizeTitle(title) {
  return String(title || "")
    .trim()
    .toUpperCase();
}

function getMainTitles(player) {
  return player.titles.filter(
    t => !specialTitles.includes(
      normalizeTitle(t.code)
    )
  );
}

function getSpecialTitles(player) {
  return player.titles.filter(
    t => specialTitles.includes(
      normalizeTitle(t.code)
    )
  );
}

function getBestMainTitle(player) {
  const mains = getMainTitles(player);

  if (!mains.length) return null;

  return mains.sort((a, b) => {
    return (
      (titlePriority[b.code] || 0) -
      (titlePriority[a.code] || 0)
    );
  })[0];
}

function sortPlayers(players) {
  return [...players].sort((a, b) => {

    const aMain = getBestMainTitle(a);
    const bMain = getBestMainTitle(b);

    const aRank =
      titlePriority[aMain?.code] || 0;

    const bRank =
      titlePriority[bMain?.code] || 0;

    return bRank - aRank;
  });
}

function createBadge(titleCode, special = false) {

  const badge = document.createElement("div");

  badge.className =
    `title-badge ${
      special
        ? "special"
        : titleClassMap[titleCode] || ""
    }`;

  badge.textContent = titleCode;

  return badge;
}

async function loadPlayers() {

  const res = await fetch("players.json");

  const players = await res.json();

  const sorted = sortPlayers(players);

  leaderboard.innerHTML = "";

  sorted.forEach(player => {

    const card = document.createElement("div");

    card.className = "player-card";

    const bestMain =
      getBestMainTitle(player);

    const specials =
      getSpecialTitles(player);

    card.innerHTML = `
      <div class="player-top">
        <div class="username">
          ${player.username}
        </div>
      </div>

      <div class="description">
        ${player.description || ""}
      </div>
    `;

    const titleRow =
      document.createElement("div");

    titleRow.className = "title-row";

    if (bestMain) {
      titleRow.appendChild(
        createBadge(bestMain.code)
      );
    }

    specials.forEach(t => {
      titleRow.appendChild(
        createBadge(t.code, true)
      );
    });

    card.appendChild(titleRow);

    const dates =
      document.createElement("div");

    dates.className = "date-list";

    dates.innerHTML = player.titles.map(t => `
      <div>
        ${t.code}: ${t.date}
      </div>
    `).join("");

    card.appendChild(dates);

    leaderboard.appendChild(card);
  });
}

loadPlayers();
