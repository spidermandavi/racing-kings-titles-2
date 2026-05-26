// ===== ROUTER =====

let currentPage = "home";

// Page registry
const routes = {
  home: renderHome,
  players: renderPlayers,
  titles: renderTitles,
  about: renderAbout,
  you: renderYou
};

// Render wrapper
function renderPage(page) {
  const app = document.getElementById("app");
  if (!app) return;

  const route = routes[page];
  if (!route) return;

  return route();
}

// Navigate
function navigate(page, { updateHash = true } = {}) {
  if (!routes[page]) return;

  currentPage = page;

  if (updateHash) {
    const nextHash = `#${page}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
      return;
    }
  }

  renderPage(page);
}

// Hash navigation
window.addEventListener("hashchange", () => {
  const page = window.location.hash.replace("#", "") || "home";
  navigate(page, { updateHash: false });
});

// Init
function initRouter() {
  const page = window.location.hash.replace("#", "") || "home";
  navigate(page, { updateHash: false });
}
