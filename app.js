
const $ = (id) => document.getElementById(id);

let mode = "signup";
let currentUser = null;

function getUsers() {
  return JSON.parse(
    localStorage.getItem("cket_demo_users") || "{}"
  );
}

function saveUsers(users) {
  localStorage.setItem(
    "cket_demo_users",
    JSON.stringify(users)
  );
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

  $("authTitle").textContent = signup
    ? "Create your account"
    : "Welcome back";

  $("submitLabel").textContent = signup
    ? "Create account"
    : "Log in";

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
        activity: []
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

function showDashboard() {
  const user = getUsers()[currentUser];

  $("authView").classList.add("hidden");
  $("dashboardView").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");

  $("userName").textContent = user.name.split(" ")[0];
  $("avatar").textContent = user.name.charAt(0).toUpperCase();
  $("balance").textContent = user.balance.toLocaleString();
  $("accountHolder").textContent = user.name;
  $("profileName").textContent = user.name;
  $("profileContact").textContent = user.contact;

  renderActivity(user.activity);
}

function renderActivity(items) {
  const list = $("activityList");

  if (!items.length) {
    list.innerHTML = '<div class="empty-state">Your demo activity will appear here.</div>';
    return;
  }

  list.innerHTML = items.slice(0, 5).map(item =>
    `<div class="activity-item">
      <div>${escapeHTML(item.title)}
      <small>${escapeHTML(item.date)}</small></div>
      <strong>${escapeHTML(item.amount)}</strong>
    </div>`
  ).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]
  );
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

$("adDemoBtn").addEventListener("click", () => {
  const users = getUsers();
  const user = users[currentUser];

  user.balance += 30;
  user.activity.unshift({
    title: "Sample ad reward",
    date: new Date().toLocaleString(),
    amount: "+30 CKET"
  });

  saveUsers(users);
  showDashboard();
  toast("30 demo CKETs added.");
});

$("marketBtn").addEventListener("click", () => {
  openFeature("CKET market preview",
    "Simulated prices only. No real trading or naira exchange.");
});

$("spinBtn").addEventListener("click", () => {
  openFeature("Spin & win preview",
    "This demo does not support paid spins or cash prizes.");
});

$("redeemBtn").addEventListener("click", () => {
  openFeature("Redeem code preview",
    "Demo redeem codes have no monetary value.");
});

function openFeature(title, message) {
  $("dialogTitle").textContent = title;
  $("dialogText").textContent = message;
  $("featureDialog").showModal();
}

$("dialogClose").addEventListener("click", () => {
  $("featureDialog").close();
});

$("dialogOk").addEventListener("click", () => {
  $("featureDialog").close();
});

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  $("dashboardView").classList.add("hidden");
  $("authView").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");
  $("authForm").reset();
  setMode("login");
});

$("year").textContent = new Date().getFullYear();
