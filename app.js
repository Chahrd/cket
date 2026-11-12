
const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "cket_demo_users";

let mode = "login";
let currentUser = null;

// ------------------------------
// USER STORAGE
// ------------------------------

function getUsers() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(users)
  );
}

function userKey(contact) {
  return contact.trim().toLowerCase();
}

// ------------------------------
// PASSWORD HASHING
// ------------------------------

async function hashPassword(password) {
  if (window.crypto && crypto.subtle) {
    const data = new TextEncoder().encode(password);

    const hash = await crypto.subtle.digest(
      "SHA-256",
      data
    );

    return [...new Uint8Array(hash)]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  // Local prototype fallback only.
  let value = 0;

  for (let i = 0; i < password.length; i++) {
    value = (
      (value << 5) - value + password.charCodeAt(i)
    ) | 0;
  }

  return "fallback-" + Math.abs(value).toString(16);
}

// ------------------------------
// SECURITY: SAFE TEXT DISPLAY
// ------------------------------

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

// ------------------------------
// LOGIN / SIGNUP MODE
// ------------------------------

function setMode(nextMode) {
  mode = nextMode;

  const signup = mode === "signup";

  $("loginTab").classList.toggle(
    "active",
    !signup
  );

  $("signupTab").classList.toggle(
    "active",
    signup
  );

  $("authTitle").textContent = signup
    ? "Create your account"
    : "Welcome back";

  $("authSubtitle").textContent = signup
    ? "Set up your CKET profile."
    : "Log in to continue to your CKET dashboard.";

  $("nameLabel").classList.toggle(
    "hidden",
    !signup
  );

  $("nameInput").classList.toggle(
    "hidden",
    !signup
  );

  $("nameInput").required = signup;

  $("authSubmit").textContent = signup
    ? "Create account"
    : "Log in";

  $("passwordInput").autocomplete = signup
    ? "new-password"
    : "current-password";

  $("authMessage").textContent = "";
}

$("loginTab").addEventListener("click", () => {
  setMode("login");
});

$("signupTab").addEventListener("click", () => {
  setMode("signup");
});

// ------------------------------
// ACTIVITY HISTORY
// ------------------------------

function addActivity(user, title, amount) {
  if (!Array.isArray(user.activity)) {
    user.activity = [];
  }

  user.activity.unshift({
    title,
    amount,
    date: new Date().toISOString()
  });

  user.activity = user.activity.slice(0, 12);
}

// ------------------------------
// SAVE CURRENT USER
// ------------------------------

function persistCurrentUser() {
  const users = getUsers();

  users[userKey(currentUser.contact)] = currentUser;

  saveUsers(users);

  renderDashboard();
}

// ------------------------------
// OPEN DASHBOARD
// ------------------------------

function showApp() {
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  $("welcomeTitle").textContent =
    `Welcome, ${currentUser.name || "there"}`;

  $("avatar").textContent =
    (currentUser.name || "C")
      .trim()
      .charAt(0)
      .toUpperCase();

  renderDashboard();

  showPage("home");
}

// ------------------------------
// DASHBOARD DISPLAY
// ------------------------------

function renderDashboard() {
  $("balanceValue").textContent =
    Number(currentUser.balance || 0)
      .toLocaleString("en-NG");

  const activity = Array.isArray(currentUser.activity)
    ? currentUser.activity
    : [];

  if (activity.length === 0) {
    $("activityList").innerHTML =
      '<p class="empty-state">Your activity will appear here.</p>';

    return;
  }

  $("activityList").innerHTML = activity.map(item => `
    <div class="activity-row">
      <div>
        ${escapeHtml(item.title)}
        <small>
          ${new Date(item.date).toLocaleString()}
        </small>
      </div>

      <div class="activity-amount">
        +${Number(item.amount).toLocaleString()} CKET
      </div>
    </div>
  `).join("");
}

// ------------------------------
// PAGE NAVIGATION
// ------------------------------

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === `page-${page}`
    );
  });

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

// ------------------------------
// SIGNUP AND LOGIN
// ------------------------------

$("authForm").addEventListener("submit", async event => {
  event.preventDefault();

  const contact = $("contactInput").value.trim();
  const password = $("passwordInput").value;

  const key = userKey(contact);
  const users = getUsers();

  const passwordHash = await hashPassword(password);

  if (mode === "signup") {
    const name = $("nameInput").value.trim();

    if (!name) {
      $("authMessage").textContent =
        "Please enter your name.";
      return;
    }

    if (password.length < 6) {
      $("authMessage").textContent =
        "Use at least 6 characters for your password.";
      return;
    }

    if (users[key]) {
      $("authMessage").textContent =
        "An account with those details already exists.";
      return;
    }

    currentUser = {
      name,
      contact,
      passwordHash,
      balance: 0,
      activity: [],
      claimedDays: [],
      redeemedCodes: []
    };

    users[key] = currentUser;

    saveUsers(users);

    showApp();

  } else {
    const user = users[key];

    if (!user || user.passwordHash !== passwordHash) {
      $("authMessage").textContent =
        "Incorrect login details. Please try again.";
      return;
    }

    currentUser = user;

    currentUser.balance =
      Number(currentUser.balance || 0);

    currentUser.activity =
      Array.isArray(currentUser.activity)
        ? currentUser.activity
        : [];

    currentUser.claimedDays =
      Array.isArray(currentUser.claimedDays)
        ? currentUser.claimedDays
        : [];

    currentUser.redeemedCodes =
      Array.isArray(currentUser.redeemedCodes)
        ? currentUser.redeemedCodes
        : [];

    showApp();
  }
});

// ------------------------------
// LOGOUT
// ------------------------------

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;

  $("appView").classList.add("hidden");
  $("authView").classList.remove("hidden");

  $("authForm").reset();

  setMode("login");
});

// ------------------------------
// DAILY POINTS
// ------------------------------

$("dailyClaimBtn").addEventListener("click", () => {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  currentUser.claimedDays =
    Array.isArray(currentUser.claimedDays)
      ? currentUser.claimedDays
      : [];

  if (currentUser.claimedDays.includes(today)) {
    $("dailyMessage").textContent =
      "You've already collected today's points. Come back tomorrow.";

    return;
  }

  currentUser.claimedDays.push(today);

  currentUser.balance =
    Number(currentUser.balance || 0) + 30;

  addActivity(
    currentUser,
    "Daily check-in",
    30
  );

  persistCurrentUser();

  $("dailyMessage").textContent =
    "30 virtual CKET points added to your balance.";

  $("dailyClaimBtn").disabled = true;

  $("dailyClaimBtn").textContent =
    "Collected today";
});

// ------------------------------
// REDEEM CODE
// ------------------------------

$("redeemBtn").addEventListener("click", () => {
  const code = $("codeInput")
    .value
    .trim()
    .toUpperCase();

  currentUser.redeemedCodes =
    Array.isArray(currentUser.redeemedCodes)
      ? currentUser.redeemedCodes
      : [];

  if (code !== "CKETSTART") {
    $("redeemMessage").textContent =
      "That code isn't valid.";

    return;
  }

  if (currentUser.redeemedCodes.includes(code)) {
    $("redeemMessage").textContent =
      "This code has already been used on your account.";

    return;
  }

  currentUser.redeemedCodes.push(code);

  currentUser.balance =
    Number(currentUser.balance || 0) + 100;

  addActivity(
    currentUser,
    "Redeem code: CKETSTART",
    100
  );

  persistCurrentUser();

  $("redeemMessage").textContent =
    "Success! 100 virtual CKET points added.";

  $("codeInput").value = "";
});

// ------------------------------
// INITIALIZE
// ------------------------------

setMode("login");

