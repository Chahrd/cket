
const $ = (id) => document.getElementById(id);

let mode = "signup";
let currentUser = null;
let marketTimer = null;
let marketPrice = 12.50;
let marketHistory = [12.10, 12.25, 12.18, 12.42, 12.35, 12.50];

const USER_KEY = "cket_demo_users";
const NAIRA_RATE = 100; // Illustrative only: 1 CKET = ₦100.

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function setMode(nextMode) {
  mode = nextMode;
  const signup = mode === "signup";

  $("signupTab").classList.toggle("active", signup);
  $("loginTab").classList.toggle("active", !signup);
  $("nameField").classList.toggle("hidden", !signup);
  $("confirmField").classList.toggle("hidden", !signup);

  $("fullName").required = signup;
  $("confirmPassword").required = signup;

  $("password").autocomplete =
    signup ? "new-password" : "current-password";

  $("authTitle").textContent =
    signup ? "Create your account" : "Welcome back";

  $("submitLabel").textContent =
    signup ? "Create account" : "Log in";

  $("authMessage").textContent = "";
}

$("signupTab").addEventListener("click", () => setMode("signup"));
$("loginTab").addEventListener("click", () => setMode("login"));

$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const contact = $("contact").value.trim().toLowerCase();
  const password = $("password").value;
  const users = getUsers();

  try {
    const passwordHash = await hashPassword(password);

    if (mode === "signup") {
      const name = $("fullName").value.trim();

      if (password.length < 8) {
        return showMessage("Password must have at least 8 characters.");
      }

      if (password !== $("confirmPassword").value) {
        return showMessage("Passwords do not match.");
      }

      if (users[contact]) {
        return showMessage("Account already exists.");
      }

      users[contact] = {
        name,
        contact,
        passwordHash,
        balance: 0,
        activity: [],
        lastActivityDay: ""
      };

      saveUsers(users);
      currentUser = contact;
      showDashboard();
      toast("Account created successfully.");

    } else {
      const user = users[contact];

      if (!user || user.passwordHash !== passwordHash) {
        return showMessage("Incorrect login details.");
      }

      currentUser = contact;
      showDashboard();
      toast("Welcome back!");
    }

  } catch (error) {
    showMessage("Unable to process account. Try again.");
  }
});

function showMessage(message) {
  $("authMessage").textContent = message;
}

function updateWallet(user) {
  const balance = Number(user.balance) || 0;

  $("balance").textContent = balance.toLocaleString();

  $("nairaEstimate").textContent =
    "₦" + (balance * NAIRA_RATE).toLocaleString("en-NG");
}

function showDashboard() {
  const user = getUsers()[currentUser];

  if (!user) return;

  user.activity ||= [];
  user.balance = Number(user.balance) || 0;

  $("authView").classList.add("hidden");
  $("dashboardView").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");

  $("userName").textContent = user.name.split(" ")[0];
  $("avatar").textContent = user.name.charAt(0).toUpperCase();

  updateWallet(user);

  $("accountHolder").textContent = user.name;
  $("profileName").textContent = user.name;
  $("profileContact").textContent = user.contact;

  renderActivity(user.activity);
}

function renderActivity(items) {
  const list = $("activityList");

  if (!items.length) {
    list.innerHTML =
      '<div class="empty-state">Your activity will appear here.</div>';
    return;
  }

  list.innerHTML = items.slice(0, 6).map(item =>
    `<div class="activity-item">
      <div>${escapeHTML(item.title)}
      <small>${escapeHTML(item.date)}</small></div>
      <strong>${escapeHTML(item.amount)}</strong>
    </div>`
  ).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]
  );
}

function toast(message) {
  const el = $("toast");

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => el.classList.remove("show"), 2800);
}

function updateUser(mutator) {
  const users = getUsers();
  const user = users[currentUser];

  if (!user) return null;

  user.activity ||= [];
  mutator(user);

  users[currentUser] = user;
  saveUsers(users);
  showDashboard();

  return user;
}

function addActivity(user, title, amount) {
  user.activity.unshift({
    title,
    date: new Date().toLocaleString(),
    amount
  });

  user.activity = user.activity.slice(0, 30);
}

// DAILY ACTIVITY REWARD

$("adDemoBtn").addEventListener("click", () => {
  const today = new Date().toISOString().slice(0, 10);
  const user = getUsers()[currentUser];

  if (user.lastActivityDay === today) {
    return toast("You've already claimed today's activity reward.");
  }

  updateUser(user => {
    user.balance = (Number(user.balance) || 0) + 30;
    user.lastActivityDay = today;

    addActivity(user, "Daily activity reward", "+30 CKET");
  });

  toast("30 virtual CKET points added.");
});

// FEATURE DIALOG

function openDialog(title, html) {
  $("dialogContent").innerHTML = `
    <p class="eyebrow">CKET FEATURE</p>
    <h2 id="dialogTitle">${escapeHTML(title)}</h2>
    ${html}
  `;

  $("featureDialog").showModal();
}

// SIMULATED MARKET

function marketMarkup() {
  return `
    <p class="dialog-copy">
      Watch the simulated CKET market move automatically.
      This is a virtual learning simulation, not real trading.
    </p>

    <div class="market-price">
      <span>CKET / SIM</span>
      <strong id="marketPrice">${marketPrice.toFixed(2)}</strong>
      <small id="marketChange">Market simulation running</small>
    </div>

    <div class="market-chart" id="marketChart">
      ${marketHistory.map(value =>
        `<i style="height:${Math.max(18, Math.min(100, (value - 11.5) * 80))}%"></i>`
      ).join("")}
    </div>

    <div class="dialog-actions">
      <button class="outline-button" id="marketRefresh" type="button">
        Refresh simulation
      </button>

      <button class="outline-button" id="marketClose" type="button">
        Close market
      </button>
    </div>

    <p class="tiny-note">
      No real asset is bought or sold.
    </p>
  `;
}

$("marketBtn").addEventListener("click", () => {
  openDialog("CKET simulated market", marketMarkup());

  startMarket();

  $("marketRefresh").addEventListener("click", tickMarket);

  $("marketClose").addEventListener("click", () => {
    $("featureDialog").close();
  });
});

function startMarket() {
  clearInterval(marketTimer);
  marketTimer = setInterval(tickMarket, 2500);
}

function tickMarket() {
  const move = (Math.random() - 0.48) * 0.42;

  marketPrice = Math.max(
    5,
    Math.min(25, marketPrice + move)
  );

  marketHistory.push(marketPrice);
  marketHistory = marketHistory.slice(-12);

  const priceEl = $("marketPrice");

  if (!priceEl) return;

  priceEl.textContent = marketPrice.toFixed(2);

  $("marketChange").textContent =
    "Updated " + new Date().toLocaleTimeString();

  $("marketChart").innerHTML = marketHistory.map(value =>
    `<i style="height:${Math.max(18, Math.min(100, (value - 5) * 5))}%"></i>`
  ).join("");
}

// SPIN & REWARDS

$("spinBtn").addEventListener("click", () => {
  openDialog(
    "Spin & rewards",
    `
      <p class="dialog-copy">
        Explore CKET rewards. Paid chance-based spins are not enabled.
      </p>

      <div class="reward-wheel">
        <span>✦</span>
        <span>30</span>
        <span>CKET</span>
      </div>

      <p class="dialog-copy">
        Claim the daily virtual activity reward from your dashboard.
      </p>
    `
  );
});

// REDEEM CODE

$("redeemBtn").addEventListener("click", () => {
  openDialog(
    "Redeem a code",
    `
      <p class="dialog-copy">
        Enter WELCOME40 to receive 40 virtual CKET points.
        One use per account.
      </p>

      <label class="dialog-label" for="redeemInput">
        Reward code
      </label>

      <input
        class="dialog-input"
        id="redeemInput"
        maxlength="24"
        placeholder="Enter code"
      >

      <button class="gold-button dialog-submit" id="redeemSubmit" type="button">
        Redeem code
      </button>

      <p class="tiny-note" id="redeemMessage"></p>
    `
  );

  $("redeemSubmit").addEventListener("click", () => {
    const users = getUsers();
    const user = users[currentUser];

    const code = $("redeemInput").value.trim().toUpperCase();

    user.usedCodes ||= [];

    if (code !== "WELCOME40") {
      return $("redeemMessage").textContent =
        "That code isn't recognised.";
    }

    if (user.usedCodes.includes(code)) {
      return $("redeemMessage").textContent =
        "This code has already been used.";
    }

    user.usedCodes.push(code);
    user.balance = (Number(user.balance) || 0) + 40;

    addActivity(user, "Welcome code reward", "+40 CKET");

    users[currentUser] = user;
    saveUsers(users);

    showDashboard();

    toast("Code redeemed. 40 virtual CKET points added.");
    $("featureDialog").close();
  });
});

// DEPOSIT INFORMATION

$("depositBtn").addEventListener("click", () => {
  openDialog(
    "Deposit",
    `
      <p class="dialog-copy">
        Deposit functionality is currently inactive.
        CKET does not collect payments on this website.
        No bank transfer, card or wallet details are required.
      </p>

      <div class="status-panel">
        Payment processing: <strong>Unavailable</strong>
      </div>
    `
  );
});

// WITHDRAWAL INFORMATION

$("withdrawBtn").addEventListener("click", () => {
  openDialog(
    "Withdraw",
    `
      <p class="dialog-copy">
        Withdrawals are currently unavailable.
        CKET points are virtual points and cannot be converted
        into or paid out as naira.
      </p>

      <div class="status-panel">
        Payout status: <strong>Unavailable</strong>
      </div>
    `
  );
});

// CLOSE DIALOG

$("dialogClose").addEventListener("click", () => {
  $("featureDialog").close();
});

$("dialogOk").addEventListener("click", () => {
  $("featureDialog").close();
});

$("featureDialog").addEventListener("close", () => {
  clearInterval(marketTimer);
});

// LOG OUT

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;

  clearInterval(marketTimer);

  $("dashboardView").classList.add("hidden");
  $("authView").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");

  $("authForm").reset();

  setMode("login");
});

$("year").textContent = new Date().getFullYear();

setMode("signup");

