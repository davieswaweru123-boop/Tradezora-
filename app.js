const DERIV_LOGIN_URL =
  "https://tradezora-backend-use-1.onrender.com/auth/login";

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

const $ = (id) => document.getElementById(id);
const toastEl = $("toast");

function toast(message) {
  if (!toastEl) {
    alert(message);
    return;
  }

  toastEl.textContent = message;
  toastEl.classList.add("show");

  clearTimeout(window.__tradezoraToastTimer);
  window.__tradezoraToastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}

function connectDeriv() {
  // Full-page navigation avoids popup blockers on mobile browsers.
  window.location.assign(DERIV_LOGIN_URL);
}

function renderMarkets(query = "") {
  const list = $("marketList");
  if (!list) return;

  const q = query.trim().toLowerCase();

  list.innerHTML = markets
    .filter((market) => market[0].toLowerCase().includes(q))
    .map(
      (market) => `
        <div class="market">
          <div>
            <b>${market[0]}</b>
            <small>${market[1]}</small>
          </div>
          <span class="${market[3]}">${market[2]}</span>
        </div>
      `
    )
    .join("");
}

function trade(direction) {
  const stakeElement = $("stake");
  const stake = Math.max(
    0,
    parseFloat(stakeElement?.value || "1") || 1
  );

  const payout = stake * 1.9;

  if ($("payout")) {
    $("payout").textContent = `$${payout.toFixed(2)}`;
  }

  if ($("openPnl")) {
    $("openPnl").textContent = "$0.00";
  }

  toast(`Demo ${direction} trade placed — $${stake.toFixed(2)}`);
}

document.addEventListener("DOMContentLoaded", () => {
  renderMarkets();

  $("connectBtn")?.addEventListener("click", connectDeriv);
  $("mobileConnectBtn")?.addEventListener("click", connectDeriv);

  $("marketSearch")?.addEventListener("input", (event) => {
    renderMarkets(event.target.value);
  });

  $("realBtn")?.addEventListener("click", () => {
    toast(
      "Real trading requires an authenticated Deriv account and explicit confirmation."
    );
  });

  $("createBtn")?.addEventListener("click", () => {
    toast("Strategy builder coming next.");
  });

  $("stopAll")?.addEventListener("click", () => {
    if ($("bot")) $("bot").checked = false;
    toast("All automation stopped.");
  });

  $("stopBtn")?.addEventListener("click", () => {
    if ($("bot")) $("bot").checked = false;
    toast("Strategy stopped.");
  });

  $("pauseBtn")?.addEventListener("click", () => {
    toast("Strategy paused.");
  });

  $("bot")?.addEventListener("change", (event) => {
    toast(
      event.target.checked
        ? "Demo automation started."
        : "Demo automation stopped."
    );
  });

  $("upBtn")?.addEventListener("click", () => trade("UP"));
  $("downBtn")?.addEventListener("click", () => trade("DOWN"));

  $("stake")?.addEventListener("input", (event) => {
    const value = parseFloat(event.target.value) || 0;
    if ($("payout")) {
      $("payout").textContent = `$${(value * 1.9).toFixed(2)}`;
    }
  });

  document.querySelectorAll("[data-toast]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      toast(element.dataset.toast);
    });
  });

  console.log("TradeZora frontend loaded.");
});
