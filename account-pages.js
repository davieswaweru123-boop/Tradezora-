document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const user = JSON.parse(localStorage.getItem("tradezoraDemoUser") || "null");
  if (!user) { location.href = "auth.html"; return; }

  const money = (v) => `$${Number(v || 0).toFixed(2)}`;
  const balanceEl = $("#balance");
  const nameEl = $("#profileName");
  const emailEl = $("#profileEmail");
  const avatarEl = $("#avatar");
  if (nameEl) nameEl.textContent = user.name || "Demo Trader";
  if (emailEl) emailEl.textContent = user.email || "demo@tradezora.local";
  if (avatarEl) avatarEl.textContent = (user.name || "T")[0].toUpperCase();
  if (balanceEl) balanceEl.textContent = money(localStorage.getItem("tradezoraDemoBalance") || 10000);

  let positions = JSON.parse(localStorage.getItem("tradezoraDemoPositions") || "[]");
  let history = JSON.parse(localStorage.getItem("tradezoraDemoHistory") || "[]");

  function save() {
    localStorage.setItem("tradezoraDemoPositions", JSON.stringify(positions));
    localStorage.setItem("tradezoraDemoHistory", JSON.stringify(history));
  }

  // Finish positions whose demo 5-second lifetime has already elapsed.
  const now = Date.now();
  let balance = Number(localStorage.getItem("tradezoraDemoBalance") || 10000);
  let changed = false;
  positions = positions.filter(position => {
    if (!position.settleAt || position.settleAt > now) return true;
    const finalDigit = Math.floor(Math.random() * 10);
    let win = false;
    const c = position.contract;
    const t = position.type;
    if (c === "match") win = (finalDigit === position.digit && t === "MATCH") || (finalDigit !== position.digit && t === "DIFFER");
    else if (c === "even") win = (finalDigit % 2 === 0 && t === "EVEN") || (finalDigit % 2 !== 0 && t === "ODD");
    else if (c === "over") win = (finalDigit > 5 && t === "OVER") || (finalDigit <= 5 && t === "UNDER");
    const profit = win ? Number(position.stake) * 0.85 : 0;
    if (win) balance += Number(position.stake) + profit;
    history.push({...position, finalDigit, win, profit, settledAt: now});
    changed = true;
    return false;
  });
  if (history.length > 50) history = history.slice(-50);
  if (changed) {
    localStorage.setItem("tradezoraDemoBalance", String(balance));
    save();
    if (balanceEl) balanceEl.textContent = money(balance);
  }

  function renderPositions() {
    const list = $("#positionsList");
    if (!list) return;
    list.innerHTML = positions.length ? positions.map(p => `
      <div class="position position-page-item">
        <div><strong>${p.type}</strong><span>${p.contract?.toUpperCase() || "CONTRACT"} • digit ${p.digit} • ${money(p.stake)}</span></div>
        <strong class="open-status">OPEN</strong>
      </div>`).join("") : '<div class="empty">No open positions.</div>';
  }

  function renderHistory() {
    const list = $("#historyList");
    if (!list) return;
    list.innerHTML = history.length ? history.slice().reverse().map(t => `
      <div class="history-item history-page-item">
        <div><strong>${t.type}</strong><span>${t.contract?.toUpperCase() || "CONTRACT"} • digit ${t.digit} → ${t.finalDigit}</span><small>${new Date(t.settledAt || Date.now()).toLocaleTimeString()}</small></div>
        <strong class="${t.win ? "win" : "loss"}">${t.win ? "WIN +" + money(t.profit) : "LOSS -" + money(t.stake)}</strong>
      </div>`).join("") : '<div class="empty">No trades yet.</div>';
  }

  renderPositions();
  renderHistory();

  const clear = $("#clearPositions");
  if (clear) clear.onclick = () => {
    positions = [];
    save();
    renderPositions();
  };

  const menuBtn = $("#menuBtn"), closeMenu = $("#closeMenu"), sideMenu = $("#sideMenu"), overlay = $("#overlay");
  const openMenu = () => { sideMenu?.classList.add("open"); overlay?.classList.add("show"); };
  const close = () => { sideMenu?.classList.remove("open"); overlay?.classList.remove("show"); };
  menuBtn?.addEventListener("click", openMenu); closeMenu?.addEventListener("click", close); overlay?.addEventListener("click", close);
  $("#logout")?.addEventListener("click", () => { localStorage.removeItem("tradezoraDemoUser"); location.href = "auth.html"; });
  $("#resetDemo")?.addEventListener("click", () => { if (!confirm("Reset the demo account?")) return; localStorage.setItem("tradezoraDemoBalance","10000"); localStorage.setItem("tradezoraDemoStake","10"); localStorage.removeItem("tradezoraDemoPositions"); localStorage.removeItem("tradezoraDemoHistory"); location.reload(); });
});
