const markets = [
  ["Volatility 100 Index", "5772.41", "+0.62%", "upv"],
  ["Volatility 75 Index", "339.52", "+0.48%", "upv"],
  ["Volatility 10 Index", "7356.20", "+0.31%", "upv"],
  ["Boom 500 Index", "487.36", "+0.74%", "upv"],
  ["Crash 500 Index", "522.41", "-0.53%", "dnv"],
  ["EUR/USD", "1.0684", "+0.12%", "upv"],
  ["GBP/USD", "1.2523", "+0.21%", "upv"],
  ["USD/JPY", "149.82", "-0.08%", "dnv"],
  ["Gold", "2,659.48", "+0.36%", "upv"],
  ["Silver", "31.24", "+0.42%", "upv"]
];

const list = document.getElementById("marketList");

function renderMarkets(q = "") {
  if (!list) return;

  list.innerHTML = markets
    .filter(m => m[0].toLowerCase().includes(q.toLowerCase()))
    .map(
      m => `
        <div class="market">
          <div>
            <b>${m[0]}</b>
            <small>${m[1]}</small>
          </div>
          <span class="${m[3]}">${m[2]}</span>
        </div>
      `
    )
    .join("");
}

renderMarkets();

const marketSearch = document.getElementById("marketSearch");

if (marketSearch) {
  marketSearch.addEventListener("input", e => {
    renderMarkets(e.target.value);
  });
}

const toastEl = document.getElementById("toast");

function toast(msg) {
  if (!toastEl) {
    alert(msg);
    return;
  }

  toastEl.textContent = msg;
  toastEl.classList.add("show");

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}

/* =========================
   DERIV CONNECTION
   ========================= */

const connectBtn = document.getElementById("connectBtn");

if (connectBtn) {
  connectBtn.addEventListener("click", function () {
    window.location.assign(
      "https://tradezora-backend-use-1.onrender.com/auth/login"
    );
  });
}

/* =========================
   REAL TRADING
   ========================= */

const realBtn = document.getElementById("realBtn");

if (realBtn) {
  realBtn.addEventListener("click", function () {
    toast(
      "Real trading requires an authenticated Deriv account and explicit confirmation."
    );
  });
}

/* =========================
   STRATEGY BUILDER
   ========================= */

const createBtn = document.getElementById("createBtn");

if (createBtn) {
  createBtn.addEventListener("click", function () {
    toast("Strategy builder coming next.");
  });
}

/* =========================
   AUTOMATION CONTROLS
   ========================= */

const stopAll = document.getElementById("stopAll");
const stopBtn = document.getElementById("stopBtn");
const pauseBtn = document.getElementById("pauseBtn");
const bot = document.getElementById("bot");

if (stopAll) {
  stopAll.addEventListener("click", function () {
    if (bot) bot.checked = false;
    toast("All automation stopped.");
  });
}

if (stopBtn) {
  stopBtn.addEventListener("click", function () {
    if (bot) bot.checked = false;
    toast("Strategy stopped.");
  });
}

if (pauseBtn) {
  pauseBtn.addEventListener("click", function () {
    toast("Strategy paused.");
  });
}

if (bot) {
  bot.addEventListener("change", function (e) {
    toast(
      e.target.checked
        ? "Demo automation started."
        : "Demo automation stopped."
    );
  });
}

/* =========================
   DEMO TRADING
   ========================= */

function trade(direction) {
  const stakeElement = document.getElementById("stake");

  const stake = Math.max(
    0,
    parseFloat(stakeElement ? stakeElement.value : 1) || 1
  );

  const payout = stake * 1.9;

  const payoutElement = document.getElementById("payout");
  const openPnlElement = document.getElementById("openPnl");

  if (payoutElement) {
    payoutElement.textContent = "$" + payout.toFixed(2);
  }

  if (openPnlElement) {
    openPnlElement.textContent = "$0.00";
  }

  toast(
    `Demo ${direction} trade placed — $${stake.toFixed(2)}`
  );
}

const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");

if (upBtn) {
  upBtn.addEventListener("click", function () {
    trade("UP");
  });
}

if (downBtn) {
  downBtn.addEventListener("click", function () {
    trade("DOWN");
  });
}

/* =========================
   STAKE / PAYOUT
   ========================= */

const stake = document.getElementById("stake");

if (stake) {
  stake.addEventListener("input", function (e) {
    const value = parseFloat(e.target.value) || 0;
    const payoutElement = document.getElementById("payout");

    if (payoutElement) {
      payoutElement.textContent =
        "$" + (value * 1.9).toFixed(2);
    }
  });
}

/* =========================
   PAGE READY
   ========================= */

console.log("TradeZora app.js loaded successfully.");
