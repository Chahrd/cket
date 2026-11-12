
/* =====================================
   CKET - COMPLETE DEMO JAVASCRIPT
   Black & Gold Edition
===================================== */

const $ = id => document.getElementById(id);

const STORAGE_USERS = "cket_demo_users";
const STORAGE_CURRENT = "cket_current_user";

const CONVERSION_RATE = 100;

let currentUser = null;
let spinning = false;

// Six Spin & Win rewards
const rewards = [
  { label: "500 CKETS", value: 500 },
  { label: "200 CKETS", value: 200 },
  { label: "-70 CKETS", value: -70 },
  { label: "BETTER LUCK", value: 0 },
  { label: "10 CKETS", value: 10 },
  { label: "80 CKETS", value: 80 }
];

// =====================================
// STORAGE
// =====================================

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS) || "{}");
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function saveCurrentUser() {
  if (!currentUser) return;

  const users = getUsers();
  users[currentUser.contact] = currentUser;
  saveUsers(users);

  localStorage.setItem(STORAGE_CURRENT, currentUser.contact);
}

function loadCurrentUser() {
  const contact = localStorage.getItem(STORAGE_CURRENT);

  if (!contact) return;

  const users = getUsers();

  if (users[contact]) {
    currentUser = users[contact];
    showDashboard();
  }
}

// =====================================
// NOTIFICATIONS
// =====================================

function notify(message) {
  let popup = $("cketPopup");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "cketPopup";

    Object.assign(popup.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#17130a",
      color: "#e8bd55",
      border: "1px solid #c99a32",
      padding: "16px 24px",
      borderRadius: "12px",
      zIndex: "99999",
      textAlign: "center",
      boxShadow: "0 5px 25px #0008"
    });

    document.body.appendChild(popup);
  }

  popup.textContent = message;
  popup.style.display = "block";

  clearTimeout(popup.timer);

  popup.timer = setTimeout(() => {
    popup.style.display = "none";
  }, 3000);
}

// =====================================
// REGISTRATION
// =====================================

function register(name, contact, password, confirmPassword) {
  name = name.trim();
  contact = contact.trim().toLowerCase();

  if (!name || !contact || !password || !confirmPassword) {
    return notify("Please fill all fields.");
  }

  if (password.length < 6) {
    return notify("Password must be at least 6 characters.");
  }

  if (password !== confirmPassword) {
    return notify("Passwords do not match.");
  }

  const users = getUsers();

  if (users[contact]) {
    return notify("Account already exists.");
  }

  currentUser = {
    name,
    contact,
    password,
    balance: 30,
    hasInitialSpin: true,
    spinUnlocked: true,
    history: []
  };

  saveCurrentUser();

  notify("Account created successfully!");

  showDashboard();
}

// =====================================
// LOGIN
// =====================================

function login(contact, password) {
  contact = contact.trim().toLowerCase();

  const users = getUsers();
  const user = users[contact];

  if (!user || user.password !== password) {
    return notify("Incorrect login details.");
  }

  currentUser = user;

  showDashboard();

  notify("Welcome back!");
}

// =====================================
// LOGOUT
// =====================================

function logout() {
  currentUser = null;

  localStorage.removeItem(STORAGE_CURRENT);

  location.reload();
}

// =====================================
// DASHBOARD
// =====================================

function showDashboard() {
  if (!currentUser) return;

  const naira = currentUser.balance * CONVERSION_RATE;

  if ($("balanceValue")) {
    $("balanceValue").textContent =
      currentUser.balance.toLocaleString();
  }

  if ($("nairaBalance")) {
    $("nairaBalance").textContent =
      "₦" + naira.toLocaleString();
  }

  if ($("overviewBalance")) {
    $("overviewBalance").textContent =
      currentUser.balance.toLocaleString();
  }

  if ($("overviewNaira")) {
    $("overviewNaira").textContent =
      "₦" + naira.toLocaleString();
  }

  if ($("userName")) {
    $("userName").textContent = currentUser.name;
  }

  if ($("spinBalance")) {
    $("spinBalance").textContent =
      currentUser.balance.toLocaleString();
  }

  updateSpinButton();
  renderHistory();

  if ($("authSection")) {
    $("authSection").style.display = "none";
  }

  if ($("dashboard")) {
    $("dashboard").style.display = "block";
  }
}

// =====================================
// BALANCE MANAGEMENT
// =====================================

function changeBalance(amount, description) {
  if (!currentUser) return false;

  if (currentUser.balance + amount < 0) {
    notify("Insufficient CKETS.");
    return false;
  }

  currentUser.balance += amount;

  currentUser.history.unshift({
    description,
    amount,
    date: new Date().toLocaleString()
  });

  saveCurrentUser();
  showDashboard();

  return true;
}

// =====================================
// SPIN & WIN
// =====================================

function updateSpinButton() {
  const button = $("spinButton");

  if (!button) return;

  button.disabled = spinning;

  if (!currentUser.spinUnlocked) {
    button.textContent = "UNLOCK SPIN - 50 CKETS";
  } else {
    button.textContent = "SPIN NOW";
  }
}

function unlockSpin() {
  if (!currentUser) {
    return notify("Please login first.");
  }

  if (currentUser.spinUnlocked) {
    return notify("Your spin is already unlocked.");
  }

  if (currentUser.balance < 50) {
    return notify("You need 50 CKETS to unlock another spin.");
  }

  currentUser.balance -= 50;
  currentUser.spinUnlocked = true;

  currentUser.history.unshift({
    description: "Spin unlock",
    amount: -50,
    date: new Date().toLocaleString()
  });

  saveCurrentUser();
  showDashboard();

  notify("New spin unlocked!");
}

function spinWheel() {
  if (!currentUser || spinning) return;

  if (!currentUser.spinUnlocked) {
    return unlockSpin();
  }

  spinning = true;

  currentUser.spinUnlocked = false;

  const wheel = $("spinWheel");
  const button = $("spinButton");

  if (button) {
    button.disabled = true;
    button.textContent = "SPINNING...";
  }

  const winningIndex = Math.floor(Math.random() * rewards.length);
  const reward = rewards[winningIndex];

  if (wheel) {
    const rotation = 1800 + winningIndex * 60 +
      Math.floor(Math.random() * 60);

    wheel.style.transition = "transform 4s ease-out";
    wheel.style.transform = `rotate(${rotation}deg)`;
  }

  setTimeout(() => {
    if (reward.value !== 0) {
      changeBalance(reward.value, "Spin reward");
    } else {
      saveCurrentUser();
    }

    spinning = false;

    if (reward.value > 0) {
      notify("Congratulations! You won " + reward.value + " CKETS!");
    } else if (reward.value < 0) {
      notify("You landed on -70 CKETS.");
    } else {
      notify("Better luck next time!");
    }

    updateSpinButton();

  }, 4100);
}

// =====================================
// WATCH AD DEMO
// =====================================

function watchAd() {
  if (!currentUser) return;

  notify("Demo advertisement completed!");

  changeBalance(10, "Watch Ad reward");

  notify("10 CKETS added to your balance!");
}

// =====================================
// WITHDRAWAL MODAL
// =====================================

function createWithdrawalModal() {
  if ($("withdrawModal")) return;

  const modal = document.createElement("div");
  modal.id = "withdrawModal";

  Object.assign(modal.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,.85)",
    zIndex: "9999",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  });

  modal.innerHTML = `
    <div style="
      background:#17130a;
      border:1px solid #c99a32;
      border-radius:18px;
      padding:25px;
      width:100%;
      max-width:400px;
      color:#fff;
    ">
      <h2 style="color:#e8bd55;margin-top:0">
        Withdraw CKETS
      </h2>

      <p style="color:#bbb">
        Available balance:
        <strong id="withdrawBalance"></strong>
      </p>

      <input id="withdrawName"
        placeholder="Account name"
        style="${inputStyle}">

      <input id="withdrawAccount"
        placeholder="Account number"
        inputmode="numeric"
        maxlength="10"
        style="${inputStyle}">

      <input id="withdrawBank"
        placeholder="Bank name"
        style="${inputStyle}">

      <input id="withdrawAmount"
        type="number"
        min="1"
        placeholder="Amount in Naira"
        style="${inputStyle}">

      <button id="proceedWithdraw"
        style="${buttonStyle}">
        Proceed to Withdraw
      </button>

      <button id="closeWithdraw"
        style="${buttonStyle};background:#333;color:white">
        Cancel
      </button>

      <p style="font-size:11px;color:#aaa">
        Demo only. No actual bank transfer is made.
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  $("closeWithdraw").onclick = closeWithdrawal;
  $("proceedWithdraw").onclick = processWithdrawal;
}

const inputStyle = `
  width:100%;
  box-sizing:border-box;
  padding:13px;
  margin:7px 0;
  border-radius:8px;
  border:1px solid #655024;
  background:#0b0b0b;
  color:white;
  outline:none;
`;

const buttonStyle = `
  width:100%;
  padding:14px;
  margin-top:12px;
  border:0;
  border-radius:9px;
  background:#c99a32;
  color:#111;
  font-weight:bold;
  cursor:pointer;
`;

function openWithdrawal() {
  if (!currentUser) return notify("Please login first.");

  createWithdrawalModal();

  $("withdrawBalance").textContent =
    "₦" + (currentUser.balance * 100).toLocaleString();

  $("withdrawModal").style.display = "flex";
}

function closeWithdrawal() {
  $("withdrawModal").style.display = "none";
}

// =====================================
// PROCESS WITHDRAWAL
// =====================================

function processWithdrawal() {
  const name = $("withdrawName").value.trim();
  const account = $("withdrawAccount").value.trim();
  const bank = $("withdrawBank").value.trim();
  const amount = Number($("withdrawAmount").value);

  if (!name || !account || !bank || !amount) {
    return notify("Please complete all withdrawal details.");
  }

  if (!/^\d{10}$/.test(account)) {
    return notify("Enter a valid 10-digit account number.");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return notify("Enter a valid withdrawal amount.");
  }

  if (amount % 100 !== 0) {
    return notify("Withdrawal must be in multiples of ₦100.");
  }

  const cketAmount = amount / 100;

  if (cketAmount > currentUser.balance) {
    return notify("Insufficient balance.");
  }

  changeBalance(-cketAmount, "Demo withdrawal: ₦" + amount);

  currentUser.history.unshift({
    description: "Demo withdrawal request - " + bank,
    amount: -cketAmount,
    date: new Date().toLocaleString()
  });

  saveCurrentUser();

  closeWithdrawal();

  notify("Demo withdrawal sent! No real transfer was made.");
}

// =====================================
// TRANSACTION HISTORY
// =====================================

function renderHistory() {
  const container = $("transactionHistory");

  if (!container || !currentUser) return;

  container.innerHTML = "";

  currentUser.history.forEach(item => {
    const row = document.createElement("div");

    row.style.cssText = `
      padding:12px;
      border-bottom:1px solid #333;
      color:white;
    `;

    const amount = item.amount > 0
      ? "+" + item.amount
      : item.amount;

    row.innerHTML = `
      <strong></strong>
      <span style="float:right"></span>
      <p style="color:#999;font-size:11px"></p>
    `;

    row.children[0].textContent = item.description;
    row.children[1].textContent = amount + " CKETS";
    row.children[2].textContent = item.date;

    container.appendChild(row);
  });
}

// =====================================
// BUTTON CONNECTIONS
// =====================================

function connect(id, callback) {
  const element = $(id);

  if (element) {
    element.addEventListener("click", callback);
  }
}

connect("withdrawBtn", openWithdrawal);
connect("spinButton", spinWheel);
connect("adsBtn", watchAd);
connect("logoutBtn", logout);

// =====================================
// START APPLICATION
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentUser();
});
