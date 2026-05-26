let playersRenderToken = 0;

// ✅ Format rating safely
function formatRating(rating) {
  return rating !== null && rating !== undefined ? rating : "-";
}

async function renderPlayers() {
  const app = document.getElementById("app");
  if (!app) return;

  const token = ++playersRenderToken;
  showSpinner();

  app.innerHTML = `
    <h1>Players</h1>

    <div style="margin-bottom: 15px;">
      <select id="filterSelect">
        ${filterOptions.map(opt => `
          <option value="${opt.value}" ${opt.value === currentFilter ? "selected" : ""}>
            ${opt.label}
          </option>
        `).join("")}
      </select>
    </div>

    <section class="section-card">
      <div class="table-header">
        <span>#</span>
        <span>Player</span>
        <span class="rating-col">Rating</span>
      </div>

      <div id="playersTable" class="player-list"></div>
    </section>
  `;

  const filterSelect = document.getElementById("filterSelect");
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      currentFilter = filterSelect.value;
      renderPlayers();
    });
  }

  renderPlayersTable(token);

  try {
    const filtered = applyFilter([...players]);

    for (const p of filtered) {
      if (!p.bestRatedWin) {
        fetchBestRatedWin(p.username).then(val => {
          p.bestRatedWin = val || 0;

          if (token === playersRenderToken) {
            renderPlayersTable(token);
          }
        });
      }
    }

    await loadPlayersProgressively(filtered, () => {
      if (token !== playersRenderToken) return;
      renderPlayersTable(token);
    });

  } finally {
    if (token === playersRenderToken) {
      hideSpinner();
    }
  }
}

function renderPlayersTable(token = playersRenderToken) {
  if (token !== playersRenderToken) return;

  const el = document.getElementById("playersTable");
  if (!el) return;

  const sorted = applyFilter([...players]);

  el.innerHTML = sorted.length
    ? sorted.map((p, index) => {
        const mainTitle = getMainTitle(p);
        const extraTitles = getSpecialTitles(p);

        const mainBadge = mainTitle !== "NONE"
          ? `<span class="badge">${escapeHtml(mainTitle)}</span>`
          : "";

        const extraBadges = extraTitles.map(t =>
          `<span class="badge special">${escapeHtml(t)}</span>`
        ).join(" ");

        return `
          <div class="player-row ${getTitleClass(mainTitle)}" id="player-${escapeHtml(p.username)}">

            <span data-label="#">#${index + 1}</span>

            <span class="player-name" data-label="Player">
              ${escapeHtml(p.username)} ${mainBadge} ${extraBadges}
            </span>

            <span class="player-rating" data-label="Rating">
              ${formatRating(p.rating)}
            </span>

          </div>
        `;
      }).join("")
    : `<div class="muted">No players available.</div>`;
}
