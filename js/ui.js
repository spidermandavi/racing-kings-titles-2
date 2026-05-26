// ===== SPINNER CONTROL =====

function showSpinner() {
  const el = document.getElementById("globalSpinner");
  if (el) el.classList.remove("hidden");
}

function hideSpinner() {
  const el = document.getElementById("globalSpinner");
  if (el) el.classList.add("hidden");
}

// ===== POPUP CONTROL =====

function showPopup() {
  const popup = document.getElementById("userPopup");
  const error = document.getElementById("popupError");
  const input = document.getElementById("usernameInput");

  if (popup) popup.classList.remove("hidden");

  // ✅ Always hide error when opening
  if (error) error.classList.add("hidden");

  // ✅ Clear input + focus
  if (input) {
    input.value = "";
    setTimeout(() => input.focus(), 0);
  }
}

function hidePopup() {
  const popup = document.getElementById("userPopup");
  if (popup) popup.classList.add("hidden");
}

// ===== USERNAME SUBMIT =====

async function submitUsername() {
  const inputEl = document.getElementById("usernameInput");
  const errorEl = document.getElementById("popupError");

  // ✅ Normalize input (important)
  const input = inputEl ? inputEl.value.trim().toLowerCase() : "";
  if (!input) return;

  if (errorEl) errorEl.classList.add("hidden");
  showSpinner();

  try {
    console.log("Trying username:", input);

    const data = await fetchLichessUser(input);

    console.log("API result:", data);

    // ❌ If user not found
    if (!data) {
      if (errorEl) errorEl.classList.remove("hidden");
      return;
    }

    // ✅ Save username
    const savedUsername = data.username || data.id || input;
    localStorage.setItem("rk_username", savedUsername);

    // ✅ Clean + navigate
    clearCache();
    hidePopup();
    updateYouNav();
    navigate("you");

  } catch (err) {
    console.error("Error fetching user:", err);
    if (errorEl) errorEl.classList.remove("hidden");
  } finally {
    hideSpinner();
  }
}

// ===== SKIP =====

function skipUsername() {
  localStorage.setItem("rk_username", "SKIP");
  hidePopup();
  updateYouNav();
}
