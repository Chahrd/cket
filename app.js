
/* =========================================
   CKET DIGITAL WALLET
   BLACK & GOLD DEMO
========================================= */

const $ = id => document.getElementById(id);

const STORAGE = "cket_demo_users";
const SESSION = "cket_current_user";

const RATE = 100;

let currentUser = null;
let spinning = false;

// =========================================
// STORAGE
// =========================================

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE) || "{}");
}

function saveUsers(users) {
  localStorage.setItem(STORAGE, JSON.stringify(users));
}

function saveUser() {
  if (!currentUser) return;

  const users = getUsers();
  users[currentUser.email] = currentUser;

  saveUsers(users);
  localStorage.setItem(SESSION, currentUser.email);
}

function loadUser() {
  const email = localStorage.getItem(SESSION);
  if (!email) return;

  const users = getUsers();

  if (users[email]) {
    currentUser = users[email];
    showApp();
  }
}

// =========================================
// NOTIFICATIONS
// =========================================

function message(text, element) {
  if (element) {
    element.textContent = text;
    return;
  }

  const modal = $("demoModal");

  $("modalTitle").textContent = "CKET Notice";
  $("modalContent").textContent = text;
  modal.hidden = false;
}

function closeModal() {
  $("demoModal").hidden = true;
}

$("modalClose").onclick = closeModal;
$("modalOk").onclick = closeModal;

// =========================================
// AUTH TABS
// =========================================

$("showLogin").onclick = () => {
  $("loginForm").hidden = false;
  $("signupForm").hidden = true;

  $("showLogin").classList.add("active");
  $("showSignup").classList.remove("active");
};

$("showSignup").onclick = () => {
  $("loginForm").hidden = true;
  $("signupForm").hidden = false;

  $("showSignup").classList.add("active");
  $("showLogin").classList.remove("active");
};

// =========================================
// SIGN UP
// =========================================

$("signupForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim().toLowerCase();
  const password = $("signupPassword").value;

  const users = getUsers();

  if (users[email]) {
    return message("This email already has an account.", $("signupMessage"));
  }

  currentUser = {
    name,
    email,
    password,
    balance: 30,
    spinUnlocked: true,
    activity: [],
    redeemCodes: []
  };

  saveUser();

  $("signupForm").reset();
  message("Account created successfully!", $("signupMessage"));

  showApp();
});

// =========================================
// LOGIN
// =========================================

$("loginForm").addEventListener("submit", e => {
  e.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const users = getUsers();

  if (!users[email] || users[email].password !== password) {
    return message("Incorrect email or password.", $("loginMessage"));
  }

  currentUser = users[email];

  $("loginForm").reset();

  showApp();
});

// =========================================
// LOGOUT
// =========================================

$("logoutBtn").onclick = () => {
  currentUser = null;
  localStorage.removeItem(SESSION);
  location.reload();
};

// =========================================
// SHOW APPLICATION
// =========================================

function showApp() {
  $("authView").hidden = true;
  $("appView").hidden = false;

  $("welcomeName").textContent = "Welcome, " + currentUser.name;

  updateDashboard();
}

// =========================================
// DASHBOARD
// =========================================

function updateDashboard() {
  if (!currentUser) return;

  const balance = currentUser.balance;
  const naira = balance * RATE;

  $("balanceValue").textContent = balance.toLocaleString();
  $("nairaBalance").textContent = naira.toLocaleString();

  $("overviewBalance").textContent = balance.toLocaleString();
  $("overviewNaira").textContent = naira.toLocaleString();

  updateSpinDisplay();
  renderActivity();
}

function addActivity(description, amount) {
  currentUser.activity.unshift({
    description,
    amount,
    date: new Date().toLocaleString()
  });

  saveUser();
}

function changeBalance(amount, description) {
  if (currentUser.balance + amount < 0) {
    message("Insufficient CKETS.");
    return false;
  }

  currentUser.balance += amount;

  addActivity(description, amount);

  updateDashboard();

  return true;
}

// =========================================
// PAGE NAVIGATION
// =========================================

function openPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  const target = $(page);

  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

// =========================================
// SPIN & WIN
// =========================================

const rewards = [
  { name: "500 CKETS", value: 500 },
  { name: "200 CKETS", value: 200 },
  { name: "-70 CKETS", value: -70 },
  { name: "BETTER LUCK", value: 0 },
  { name: "10 CKETS", value: 10 },
  { name: "80 CKETS", value: 80 }
];

function updateSpinDisplay() {
  $("spinChances").textContent =
    currentUser.spinUnlocked ? "1" : "0";

  $("spinBtn").textContent =
    currentUser.spinUnlocked
      ? "SPIN NOW"
      : "UNLOCK NEXT SPIN - 50 CKETS";

  $("spinBtn").disabled = spinning;
}

$("spinBtn").onclick = () => {
  if (!currentUser || spinning) return;

  // Unlock another spin
  if (!currentUser.spinUnlocked) {
    if (currentUser.balance < 50) {
      return message("You need 50 CKETS to unlock another spin.");
    }

    currentUser.balance -= 50;
    currentUser.spinUnlocked = true;

    addActivity("Spin unlocked", -50);

    updateDashboard();

    message("New spin unlocked! You can spin again.");

    return;
  }

  // Start spin
  spinning = true;
  currentUser.spinUnlocked = false;

  const wheel = $("wheel");

  const index = Math.floor(Math.random() * rewards.length);
  const reward = rewards[index];

  const rotation = 1800 + index * 60;

  wheel.style.transition = "transform 4s ease-out";
  wheel.style.transform = `rotate(${rotation}deg)`;

  updateSpinDisplay();

  setTimeout(() => {
    spinning = false;

    if (reward.value !== 0) {
      currentUser.balance += reward.value;

      addActivity("Spin reward: " + reward.name, reward.value);
    } else {
      addActivity("Spin reward: Better luck next time", 0);
    }

    updateDashboard();

    message(
      reward.value > 0
        ? "Congratulations! You won " + reward.name + "!"
        : reward.value < 0
          ? "You landed on -70 CKETS."
          : "Better luck next time!"
    );

  }, 4100);
};

// =========================================
// EARN CKET DEMO
// =========================================

$("adsBtn").onclick = () => {
  message(
    "Demo reward only. No advertisement was actually watched."
  );
};

// =========================================
// REDEEM CODE
// =========================================

const redeemRewards = {
  "CKET50": 50,
  "CKET100": 100,
  "WELCOME": 20,
  "GOLD200": 200
};

$("redeemBtn").onclick = () => {
  const code = $("codeInput").value.trim().toUpperCase();

  if (!code) {
    return message("Enter a redeem code.", $("redeemMessage"));
  }

  if (currentUser.redeemCodes.includes(code)) {
    return message("This code has already been used.", $("redeemMessage"));
  }

  const reward = redeemRewards[code];

  if (!reward) {
    return message("Invalid redeem code.", $("redeemMessage"));
  }

  currentUser.redeemCodes.push(code);
  currentUser.balance += reward;

  addActivity("Redeem code reward", reward);

  $("codeInput").value = "";

  updateDashboard();

  message(reward + " CKETS successfully added!");
};

// =========================================
// WITHDRAWAL
// =========================================

function withdrawalForm() {
  $("modalTitle").textContent = "Withdraw CKETS";

  $("modalContent").innerHTML = `
    <p>Available balance: <strong id="availableNaira"></strong></p>

    <input id="accountName" placeholder="Account name">
    <input id="accountNumber" placeholder="Account number" maxlength="10" inputmode="numeric">
    <input id="bankName" placeholder="Bank name">
    <input id="withdrawAmount" type="number" min="100" placeholder="Amount in Naira">

    <p style="font-size:11px;color:#aaa">
      This is a simulated demo withdrawal. No real transfer occurs.
    </p>

    <button id="confirmWithdrawal" class="gold-btn">
      Proceed to Withdraw
    </button>
  `;

  $("availableNaira").textContent =
    "₦" + (currentUser.balance * RATE).toLocaleString();

  $("confirmWithdrawal").onclick = processWithdrawal;

  $("demoModal").hidden = false;
}

function processWithdrawal() {
  const name = $("accountName").value.trim();
  const account = $("accountNumber").value.trim();
  const bank = $("bankName").value.trim();
  const amount = Number($("withdrawAmount").value);

  if (!name || !account || !bank || !amount) {
    return message("Please fill in all withdrawal details.");
  }

  if (!/^\d{10}$/.test(account)) {
    return message("Enter a valid 10-digit account number.");
  }

  if (!Number.isInteger(amount) || amount < 100 || amount % 100 !== 0) {
    return message("Enter a valid amount in multiples of ₦100.");
  }

  const cketCost = amount / RATE;

  if (cketCost > currentUser.balance) {
    return message("Insufficient CKET balance.");
  }

  currentUser.balance -= cketCost;

  addActivity("Demo withdrawal - " + bank, -cketCost);

  updateDashboard();

  $("modalTitle").textContent = "Withdrawal Sent!";

  $("modalContent").textContent =
    "Your demo withdrawal request has been recorded successfully. No real bank transfer was made.";

  $("modalOk").textContent = "Done";

  $("modalOk").onclick = () => {
    closeModal();
    $("modalOk").onclick = closeModal;
    $("modalOk").textContent = "Continue";
  };
}

// =========================================
// DEPOSIT & CONVERT DEMO
// =========================================

$("depositBtn").onclick = () => {
  message("Deposits are currently unavailable in this demo.");
};

$("convertBtn").onclick = () => {
  message("Conversion rate: 1 CKET = ₦100.");
};

// =========================================
// ACTIVITY
// =========================================

function renderActivity() {
  const list = $("activityList");

  list.innerHTML = "";

  if (!currentUser.activity.length) {
    list.innerHTML = '<p class="empty-message">No activity yet.</p>';
    return;
  }

  currentUser.activity.forEach(item => {
    const row = document.createElement("div");

    row.className = "activity-item";

    const title = document.createElement("strong");
    title.textContent = item.description;

    const amount = document.createElement("p");
    amount.textContent =
      (item.amount > 0 ? "+" : "") + item.amount + " CKETS";

    const date = document.createElement("small");
    date.textContent = item.date;

    row.append(title, amount, date);

    list.appendChild(row);
  });
}

// =========================================
// START
// =========================================

loadUser();
