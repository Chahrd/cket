
// ======================================
// CKET DASHBOARD - APP.JS
// ======================================

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "cket_dashboard_demo_v1";

const REDEEM_CODE = "201010";
const REDEEM_REWARD = 100;
const AD_REWARD = 10;

const rewards = [
  { label: "500 CKET", amount: 500 },
  { label: "200 CKET", amount: 200 },
  { label: "-70 CKET", amount: -70 },
  { label: "Better luck", amount: 0 },
  { label: "10 CKET", amount: 10 },
  { label: "80 CKET", amount: 80 }
];

function today() {
  return new Date().toLocaleDateString("en-CA");
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && typeof saved.balance === "number") {
      return {
        balance: saved.balance,
        redeemed: saved.redeemed || false,
        lastSpin: saved.lastSpin || "",
        lastAd: saved.lastAd || "",
        activity: Array.isArray(saved.activity)
          ? saved.activity
          : []
      };
    }
  } catch (error) {
    console.error("Could not load CKET data:", error);
  }

  return {
    balance: 30,
    redeemed: false,
    lastSpin: "",
    lastAd: "",
    activity: []
  };
}

let account = loadData();
let spinning = false;

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
}

// ======================================
// BALANCE AND NAIRA CONVERSION
// ======================================

function naira(amount) {
  return "₦" + (amount * 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function updateBalance() {
  const balance = account.balance;

  $("balanceValue").textContent =
    balance.toLocaleString("en-NG");

  $("nairaBalance").textContent = naira(balance);

  $("overviewBalance").textContent =
    balance.toLocaleString("en-NG");

  $("overviewNaira").textContent = naira(balance);

  saveData();
}

// ======================================
// ACTIVITY HISTORY
// ======================================

function addActivity(title, amount) {
  account.activity.unshift({
    title,
    amount,
    date: new Date().toLocaleString()
  });

  account.activity = account.activity.slice(0, 20);

  saveData();
  renderActivity();
}

function renderActivity() {
  const list = $("activityList");

  if (!account.activity.length) {
    list.innerHTML =
      '<p class="empty-state">No transactions yet.</p>';
    return;
  }

  list.innerHTML = account.activity.map(item => {
    const positive = item.amount >= 0;
    const display = positive
      ? "+" + item.amount + " CKET"
      : item.amount + " CKET";

    return `
      <div class="activity-item">
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <small>${escapeHTML(item.date)}</small>
        </div>
        <span class="${positive ? "positive" : "negative"}">
          ${display}
        </span>
      </div>
    `;
  }).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// ======================================
// MODAL SYSTEM
// ======================================

function openModal(title, content) {
  $("modalTitle").textContent = title;
  $("modalContent").innerHTML = content;
  $("demoModal").style.display = "flex";
}

function closeModal() {
  $("demoModal").style.display = "none";
}

$("modalClose").addEventListener("click", closeModal);
$("modalOk").addEventListener("click", closeModal);

$("demoModal").addEventListener("click", (event) => {
  if (event.target === $("demoModal")) {
    closeModal();
  }
});

// ======================================
// DEPOSIT
// ======================================

$("depositBtn").addEventListener("click", () => {
  openModal(
    "Deposit CKET",
    `
      <p>Choose a deposit amount to preview the CKET deposit process.</p>

      <label>Amount in naira</label>
      <input type="number" id="depositAmount"
        placeholder="Enter amount">

      <p>Conversion rate: ₦100 = 1 CKET</p>

      <button class="primary-btn full-btn" id="depositPreview">
        Preview Deposit
      </button>

      <p id="depositMessage" class="result-message"></p>
    `
  );

  setTimeout(() => {
    const button = $("depositPreview");

    if (!button) return;

    button.addEventListener("click", () => {
      const amount = Number($("depositAmount").value);

      if (!amount || amount <= 0) {
        $("depositMessage").textContent =
          "Enter a valid amount.";
        return;
      }

      $("depositMessage").textContent =
        "This is a demo. No payment was collected and no CKET was added.";
    });
  }, 0);
});

// ======================================
// WITHDRAWAL PREVIEW
// ======================================

$("withdrawBtn").addEventListener("click", () => {
  openModal(
    "Withdraw",
    `
      <p>Withdrawal request preview.</p>

      <p>
        Your current balance is
        <strong>${account.balance.toLocaleString()} CKET</strong>.
      </p>

      <label>Withdrawal amount (CKET)</label>
      <input type="number" id="withdrawAmount"
        placeholder="Enter CKET amount">

      <label>Bank selection</label>
      <select id="withdrawBank">
        <option value="">Select bank</option>
        <option>Access Bank</option>
        <option>GTBank</option>
        <option>First Bank</option>
        <option>UBA</option>
        <option>Zenith Bank</option>
        <option>OPay</option>
        <option>Palmpay</option>
      </select>

      <p>
        This prototype does not collect bank account details or
        send money. A real withdrawal requires a verified payment
        provider and secure backend.
      </p>

      <button class="primary-btn full-btn" id="withdrawPreview">
        Preview Request
      </button>

      <p id="withdrawMessage" class="result-message"></p>
    `
  );

  setTimeout(() => {
    const button = $("withdrawPreview");

    if (!button) return;

    button.addEventListener("click", () => {
      const amount = Number($("withdrawAmount").value);
      const bank = $("withdrawBank").value;

      if (!amount || amount <= 0 || !bank) {
        $("withdrawMessage").textContent =
          "Enter an amount and select a bank.";
        return;
      }

      if (amount > account.balance) {
        $("withdrawMessage").textContent =
          "Insufficient CKET balance.";
        return;
      }

      $("withdrawMessage").textContent =
        "Demo request previewed. No balance was deducted and no transfer was made.";
    });
  }, 0);
});

// ======================================
// CONVERT
// ======================================

$("convertBtn").addEventListener("click", () => {
  openModal(
    "CKET Conversion",
    `
      <p>Your CKET balance is displayed using this conversion rate:</p>
      <h2 style="color:#f5dfa0">1 CKET = ₦100</h2>
      <h2 style="color:#f5dfa0">30 CKET = ₦3,000</h2>
      <p>
        Your current balance:
        <strong>${account.balance.toLocaleString()} CKET</strong>
      </p>
      <p>
        Naira equivalent:
        <strong>${naira(account.balance)}</strong>
      </p>
    `
  );
});

// ======================================
// WATCH ADS DEMO
// ======================================

$("adsBtn").addEventListener("click", () => {
  if (account.lastAd === today()) {
    openModal(
      "Ad Reward",
      "<p>Your demo ad reward has already been claimed today. Try again tomorrow.</p>"
    );
    return;
  }

  openModal(
    "Watch Ad",
    `
      <p>Advertisement preview</p>
      <div style="
        background:#292016;
        padding:35px 15px;
        text-align:center;
        border-radius:12px;
        margin:15px 0;
      ">
        <div style="font-size:40px;color:#f5dfa0">▶</div>
        <h3 style="color:#f5dfa0;margin:10px">
          CKET AD PREVIEW
        </h3>
        <p>Demo advertisement screen</p>
      </div>
      <p>Demo reward: <strong>10 CKET</strong></p>
      <button class="primary-btn full-btn" id="claimAd">
        Claim Demo Reward
      </button>
      <p id="adMessage" class="result-message"></p>
    `
  );

  setTimeout(() => {
    const button = $("claimAd");

    if (!button) return;

    button.addEventListener("click", () => {
      if (account.lastAd === today()) {
        $("adMessage").textContent =
          "You have already claimed today's reward.";
        return;
      }

      account.balance += AD_REWARD;
      account.lastAd = today();

      addActivity("Demo ad reward", AD_REWARD);
      updateBalance();

      button.disabled = true;

      $("adMessage").textContent =
        "10 CKET demo points added to your balance.";
    });
  }, 0);
});

// ======================================
// SPIN AND WIN
// ======================================

function updateSpinStatus() {
  const alreadySpun = account.lastSpin === today();

  $("spinChances").textContent = alreadySpun ? "0" : "1";

  $("spinBtn").disabled = alreadySpun || spinning;

  $("spinBtn").textContent = alreadySpun
    ? "COME BACK TOMORROW"
    : "SPIN NOW";
}

$("spinBtn").addEventListener("click", () => {
  if (spinning) return;

  if (account.lastSpin === today()) {
    $("spinMessage").textContent =
      "Your free daily spin has already been used.";
    return;
  }

  spinning = true;
  $("spinBtn").disabled = true;
  $("spinMessage").textContent = "Spinning...";

  const index = Math.floor(Math.random() * rewards.length);
  const reward = rewards[index];

  const wheel = $("wheel");

  const angle = 360 * 6 + (360 - index * 60 - 30);

  wheel.style.transform = `rotate(${angle}deg)`;

  setTimeout(() => {
    account.lastSpin = today();

    if (reward.amount > 0) {
      account.balance += reward.amount;
      addActivity("Spin reward", reward.amount);

      $("spinMessage").textContent =
        `Congratulations! You received ${reward.amount} CKET.`;
    } else if (reward.amount < 0) {
      account.balance = Math.max(
        0,
        account.balance + reward.amount
      );

      addActivity("Spin result", reward.amount);

      $("spinMessage").textContent =
        "Your spin result was -70 CKET.";
    } else {
      $("spinMessage").textContent =
        "Better luck next time!";
    }

    updateBalance();

    spinning = false;
    updateSpinStatus();

  }, 4100);
});

// ======================================
// REDEEM CODE
// ======================================

$("redeemBtn").addEventListener("click", () => {
  const enteredCode = $("codeInput").value.trim();

  if (!enteredCode) {
    $("redeemMessage").textContent =
      "Please enter a redeem code.";
    return;
  }

  if (account.redeemed) {
    $("redeemMessage").textContent =
      "This account has already redeemed its available code.";
    return;
  }

  if (enteredCode !== REDEEM_CODE) {
    $("redeemMessage").textContent =
      "Invalid redeem code.";
    return;
  }

  account.balance += REDEEM_REWARD;
  account.redeemed = true;

  addActivity("Redeem reward", REDEEM_REWARD);
  updateBalance();

  $("codeInput").value = "";

  $("redeemMessage").textContent =
    "Code accepted! 100 CKET added.";
});

// ======================================
// BOTTOM NAVIGATION
// ======================================

const navTargets = {
  home: ".balance-card",
  spin: ".spin-panel",
  redeem: "#codeInput",
  activity: "#activityList"
};

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    const target = document.querySelector(
      navTargets[button.dataset.page]
    );

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  });
});

// ======================================
// PROFILE
// ======================================

$("profileBtn").addEventListener("click", () => {
  openModal(
    "My CKET Account",
    `
      <p>Account type: Demo account</p>
      <p>Balance: ${account.balance.toLocaleString()} CKET</p>
      <p>Naira equivalent: ${naira(account.balance)}</p>
      <p>Redemption status: ${account.redeemed ? "Redeemed" : "Not redeemed"}</p>
    `
  );
});

// ======================================
// INITIALIZE DASHBOARD
// ======================================

updateBalance();
renderActivity();
updateSpinStatus();
saveData();
