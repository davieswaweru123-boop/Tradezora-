document.addEventListener("DOMContentLoaded", () => {
  const $ = s => document.querySelector(s);

  const user = JSON.parse(
    localStorage.getItem("tradezoraDemoUser") || "null"
  );

  if (!user) {
    location.href = "auth.html";
    return;
  }

  // Demo balance:
  // If there is no balance, or the old balance has reached zero,
  // restore the demo account to $10,000.
  let savedBalance = localStorage.getItem("tradezoraDemoBalance");

  if (
    savedBalance === null ||
    Number(savedBalance) <= 0
  ) {
    localStorage.setItem("tradezoraDemoBalance", "10000");
    savedBalance = "10000";
  }

  let balance = Number(savedBalance);
  let stake = Number(
    localStorage.getItem("tradezoraDemoStake") || 10
  );

  let price = 1000;
  let history = [];
  let positions = [];
  let digit = 0;
  let pnl = 0;

  $("#profileName").textContent = user.name || "Demo Trader";
  $("#profileEmail").textContent = user.email || "";
  $("#avatar").textContent =
    (user.name || "T")[0].toUpperCase();

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function toast(t) {
    const e = $("#toast");

    if (!e) return;

    e.textContent = t;
    e.classList.add("show");

    setTimeout(() => {
      e.classList.remove("show");
    }, 1800);
  }

  function renderBalance() {
    $("#balance").textContent = money(balance);
    $("#stake").textContent = money(stake);

    $("#sessionPnl").textContent =
      (pnl >= 0 ? "+" : "") +
      money(pnl).replace("$", "$");
  }

  renderBalance();

  // =========================
  // MENU
  // =========================

  const menu = $("#sideMenu");
  const overlay = $("#overlay");

  $("#menuBtn").onclick = () => {
    menu.classList.add("open");
    overlay.classList.add("show");
  };

  $("#closeMenu").onclick = () => {
    menu.classList.remove("open");
    overlay.classList.remove("show");
  };

  overlay.onclick = $("#closeMenu").onclick;

  $("#logout").onclick = () => {
    localStorage.removeItem("tradezoraDemoUser");
    location.href = "auth.html";
  };

  $("#depositBtn").onclick = () => {
    toast("Demo account only — real deposits are disabled.");
  };

  $("#themeSwitch").onclick = () => {
    toast("Dark theme is active.");
  };

  // =========================
  // DIGITS
  // =========================

  const digits = $("#digits");
  const contracts = $("#contractDigits");

  for (let i = 0; i < 10; i++) {
    const a = document.createElement("button");
    const b = document.createElement("button");

    a.textContent = i;
    b.textContent = i;

    a.onclick = () => {
      digit = i;

      [...digits.children].forEach(x =>
        x.classList.remove("active")
      );

      a.classList.add("active");
    };

    b.onclick = () => {
      digit = i;

      [...contracts.children].forEach(x =>
        x.classList.remove("active")
      );

      b.classList.add("active");
    };

    digits.appendChild(a);
    contracts.appendChild(b);
  }

  digits.children[0].classList.add("active");
  contracts.children[0].classList.add("active");

  // =========================
  // STAKE
  // =========================

  $("#stakeMinus").onclick = () => {
    stake = Math.max(1, stake - 1);

    localStorage.setItem(
      "tradezoraDemoStake",
      stake
    );

    renderBalance();
  };

  $("#stakePlus").onclick = () => {
    stake = Math.min(
      100,
      balance || 100,
      stake + 1
    );

    localStorage.setItem(
      "tradezoraDemoStake",
      stake
    );

    renderBalance();
  };

  // =========================
  // AI SCANNER
  // =========================

  $("#scanner").onclick = () => {
    toast("AI Scanner is a demo interface.");
  };

  // =========================
  // CHART
  // =========================

  const chart = $("#priceChart");
  const ctx = chart.getContext("2d");

  let series = Array.from(
    { length: 80 },
    () => price + (Math.random() - 0.5) * 100
  );

  function resize()
