// ===== APP START =====

// Run once when page loads
window.addEventListener("DOMContentLoaded", () => {
  updateYouNav();
  initRouter();

  const username = localStorage.getItem("rk_username");

  // Show popup only if no user is set
  if (!username) {
    showPopup();
  }
});


// ===== RELOAD SYSTEM =====
function reloadPage() {
  clearCache();
  renderPage(currentPage);
}


// ===== YOU NAV VISIBILITY =====
function updateYouNav() {
  const btn = document.getElementById("youNavBtn");
  if (!btn) return;

  const username = localStorage.getItem("rk_username");

  if (username && username !== "SKIP") {
    btn.classList.remove("hidden");
  } else {
    btn.classList.add("hidden");
  }
}
