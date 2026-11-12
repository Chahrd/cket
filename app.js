
"use strict";

/* =====================================
   CKET COMPLETE APPLICATION
===================================== */

const $ = id => document.getElementById(id);

const DB = "cket_demo_users";
const SESSION = "cket_current_user";
const RATE = 100;

let currentUser = null;
let spinning = false;

const rewards = [
  { name: "500 CKETS", value: 500 },
  { name: "200 CKETS", value: 200 },
  { name: "-70 CKETS", value: -70 },
  { name: "BETTER LUCK", value: 0 },
  { name: "10 CKETS", value: 10 },
  { name: "80 CKETS", value: 80 }
];

/* =====================================
   STORAGE
===================================== */

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(DB) || "{}");
  } catch {
    return {};
  }
}

function saveUser() {
  const users = getUsers();
  users[currentUser.email] = currentUser;
  localStorage.setItem(DB, JSON.stringify(users));
  localStorage.setItem(SESSION, currentUser.email);
}

/* =====================================
   MESSAGES
===================================== */

function showMessage(title, content) {
  $("modalTitle").textContent = title;

  const box = $("modalContent");
  box.replaceChildren();

  const paragraph = document.createElement("p");
  paragraph.textContent = content;
  box.appendChild(paragraph);

  $("demoModal").hidden = false;
}

function closeModal() {
  $("demoModal").hidden = true;
}

$("modalClose").addEventListener("click", closeModal);
$("modalOk").addEventListener("click", closeModal);

/* =====================================
   AUTHENTICATION TABS
===================================== */

$("showLogin").addEventListener("click", () => {
  $("loginForm").hidden = false;
  $("signupForm").hidden = true;

  $("showLogin").classList.add("active");
  $("showSignup").classList.remove("active");
});

$("showSignup").addEventListener("click", () => {
  $("signupForm").hidden = false;
  $("loginForm").hidden = true;

  $("showSignup").classList.add("active");
  $("showLogin").classList.remove("active");
});

/* =====================================
   SIGN UP
===================================== */

$("signupForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim().toLowerCase();
  const password = $("signupPassword").value;

  if (!name || !email || !password) {
    return showMessage("Missing details", "Please complete every field.");
  }

  if (password.length < 6) {
    return showMessage("Password too short", "Use at least 6 characters.");
  }

  const users = getUsers();

  if (users[email]) {
    return showMessage("Account exists", "This email is already registered. Please log in.");
  }

  currentUser = {
    name: name,
    email: email,
    password: password,
    balance: 30,
    spinUnlocked: true,
    activity: [],
    redeemCodes: []
  };

  saveUser();

  this.reset();

  showApp();

  showMessage("Welcome to CKET!", "Your demo account has been created with 30 CKETS.");
});

/* =====================================
   LOGIN
===================================== */

$("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const users = getUsers();

  if (!users[email] || users[email].password !== password) {
    return showMessage("Login failed", "Incorrect email or password.");
  }

  currentUser = users[email];

  this.reset();

  showApp();
});

/* =====================================
   SHOW APP
===================================== */

function showApp() {
  $("authView").hidden = true;
  $("appView").hidden = false;

  $("welcomeName").textContent = "Welcome, " + currentUser.name;

  updateDashboard();
}

/* =====================================
   LOGOUT
===================================== */

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem(SESSION);
  location.reload();
});

/* =====================================
   DASHBOARD
===================================== */

function updateDashboard() {
  if (!currentUser) return;

  const balance = currentUser.balance;
  const naira = balance * RATE;

  $("balanceValue").textContent = balance.toLocaleString();
  $("nairaBalance").textContent = naira.toLocaleString();

  $("overviewBalance").textContent = balance.toLocaleString();
  $("overviewNaira").textContent = naira.toLocaleString();

  $("spinChances").textContent =
    currentUser.spinUnlocked ? "1" : "0";

  $("spinBtn").textContent =
    currentUser.spinUnlocked
      ? "SPIN NOW"
      : "UNLOCK NEXT SPIN - 50 CKETS";

  $("spinBtn").disabled = spinning;

  renderActivity();
}

/* =====================================
   ACTIVITY
===================================== */

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
    showMessage("Insufficient balance", "You do not have enough CKETS.");
    return false;
  }

  currentUser.balance += amount;
  addActivity(description, amount);
  updateDashboard();

  return true;
}

/* =====================================
   NAVIGATION
===================================== */

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;

    document.querySelectorAll(".page").forEach(p => {
      p.classList.remove("active");
    });

    if ($(page)) $(page).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(nav => {
      nav.classList.toggle("active", nav.dataset.page === page);
    });
  });
});

/* =====================================
   SPIN & WIN
===================================== */

$("spinBtn").addEventListener("click", () => {
  if (!currentUser || spinning) return;

  // Unlock another spin for 50 CKETS
  if (!currentUser.spinUnlocked) {
    if (currentUser.balance < 50) {
      return showMessage("Insufficient CKETS", "You need 50 CKETS to unlock another spin.");
    }

    currentUser.balance -= 50;
    currentUser.spinUnlocked = true;

    addActivity("Unlocked another spin", -50);
    updateDashboard();

    return showMessage("Spin unlocked!", "Your next spin is ready.");
  }

  spinning = true;
  currentUser.spinUnlocked = false;

  const wheel = $("wheel");
  const index = Math.floor(Math.random() * rewards.length);
  const reward = rewards[index];

  const rotation = 1800 + index * 60;

  wheel.style.transition = "transform 4s ease-out";
  wheel.style.transform = `rotate(${rotation}deg)`;

  updateDashboard();

  setTimeout(() => {
    spinning = false;

    currentUser.balance += reward.value;

    addActivity("Spin reward: " + reward.name, reward.value);

    updateDashboard();

    if (reward.value > 0) {
      showMessage("Congratulations!", "You won " + reward.name + "!");
    } else if (reward.value < 0) {
      showMessage("Spin result", "You landed on -70 CKETS.");
    } else {
      showMessage("Better luck next time!", "Try again by unlocking another spin for 50 CKETS.");
    }

  }, 4100);
});

/* =====================================
   REDEEM CODES
===================================== */

const codes = {
  "CKET50": 50,
  "CKET100": 100,
  "WELCOME": 20,
  "GOLD200": 200
};

$("redeemBtn").addEventListener("click", () => {
  const code = $("codeInput").value.trim().toUpperCase();

  if (!code) {
    return showMessage("Empty code", "Please enter a redeem code.");
  }

  if (currentUser.redeemCodes.includes(code)) {
    return showMessage("Already used", "This code has already been redeemed.");
  }

  if (!codes[code]) {
    return showMessage("Invalid code", "This redeem code is not valid.");
  }

  currentUser.redeemCodes.push(code);
  currentUser.balance += codes[code];

  addActivity("Redeemed " + code, codes[code]);

  $("codeInput").value = "";

  updateDashboard();

  showMessage("Successful!", codes[code] + " CKETS added to your demo balance.");
});

/* =====================================
   EARN CKETS
===================================== */

$("adsBtn").addEventListener("click", () => {
  showMessage("Demo feature", "Advertisement rewards are not connected yet.");
});

/* =====================================
   DEPOSIT
===================================== */

$("depositBtn").addEventListener("click", () => {
  showMessage("Deposit", "Deposits are not available in this demo.");
});

/* =====================================
   CONVERT
===================================== */

$("convertBtn").addEventListener("click", () => {
  showMessage("Conversion rate", "1 CKET = ₦100. 30 CKETS = ₦3,000.");
});

/* =====================================
   WITHDRAWAL FORM
===================================== */

$("withdrawBtn").addEventListener("click", () => {
  $("modalTitle").textContent = "Withdraw CKETS";

  const box = $("modalContent");
  box.replaceChildren();

  const balance = document.createElement("p");
  balance.textContent =
    "Available: ₦" + (currentUser.balance * RATE).toLocaleString();

  const name = document.createElement("input");
  name.placeholder = "Account name";
  name.id = "accountName";

  const account = document.createElement("input");
  account.placeholder = "Account number";
  account.id = "accountNumber";
  account.maxLength = 10;
  account.inputMode = "numeric";

  const bank = document.createElement("input");
  bank.placeholder = "Bank name";
  bank.id = "bankName";

  const amount = document.createElement("input");
  amount.placeholder = "Withdrawal amount (₦)";
  amount.type = "number";
  amount.min = "100";
  amount.id = "withdrawAmount";

  const note = document.createElement("small");
  note.textContent = "Demo only. No real bank transfer will occur.";

  const button = document.createElement("button");
  button.className = "gold-btn";
  button.textContent = "Proceed to Withdraw";

  box.append(balance, name, account, bank, amount, note, button);

  button.addEventListener("click", processWithdrawal);

  $("demoModal").hidden = false;
});

/* =====================================
   PROCESS WITHDRAWAL
===================================== */

function processWithdrawal() {
  const name = $("accountName").value.trim();
  const account = $("accountNumber").value.trim();
  const bank = $("bankName").value.trim();
  const amount = Number($("withdrawAmount").value);

  if (!name || !account || !bank || !amount) {
    return showMessage("Missing details", "Please fill in all fields.");
  }

  if (!/^\d{10}$/.test(account)) {
    return showMessage("Invalid account", "Enter a 10-digit account number.");
  }

  if (!Number.isInteger(amount) || amount < 100 || amount % 100 !== 0) {
    return showMessage("Invalid amount", "Use amounts in multiples of ₦100.");
  }

  const cost = amount / RATE;

  if (cost > currentUser.balance) {
    return showMessage("Insufficient balance", "You do not have enough CKETS.");
  }

  currentUser.balance -= cost;

  addActivity("Demo withdrawal - " + bank, -cost);

  updateDashboard();

  $("modalTitle").textContent = "Withdrawal Sent!";

  const box = $("modalContent");
  box.replaceChildren();

  const result = document.createElement("p");
  result.textContent =
    "Your demo withdrawal request for ₦" +
    amount.toLocaleString() +
    " has been recorded. No real bank transfer was made.";

  box.appendChild(result);

  const ok = $("modalOk");
  ok.onclick = closeModal;
}

/* =====================================
   RENDER ACTIVITY
===================================== */

function renderActivity() {
  const list = $("activityList");
  list.replaceChildren();

  if (!currentUser.activity.length) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "No activity yet.";
    list.appendChild(empty);
    return;
  }

  currentUser.activity.forEach(item => {
    const row = document.createElement("div");
    row.className = "activity-item";

    const title = document.createElement("strong");
    title.textContent = item.description;

    const value = document.createElement("p");
    value.textContent =
      (item.amount > 0 ? "+" : "") + item.amount + " CKETS";

    const date = document.createElement("small");
    date.textContent = item.date;

    row.append(title, value, date);
    list.appendChild(row);
  });
}

/* =====================================
   RESTORE LOGIN SESSION
===================================== */

function startApp() {
  const email = localStorage.getItem(SESSION);

  if (!email) return;

  const users = getUsers();

  if (users[email]) {
    currentUser = users[email];
    showApp();
  } else {
    localStorage.removeItem(SESSION);
  }
}

startApp();
