document.addEventListener("DOMContentLoaded", () => {

  const $ = (selector) => document.querySelector(selector);

  /* =========================
     DEMO ACCOUNT
  ========================= */

  const user = JSON.parse(
    localStorage.getItem("tradezoraDemoUser") || "null"
  );

  if (!user) {
    location.href = "auth.html";
    return;
  }

  /*
    Keep the existing user's balance if they already have one.
    New demo accounts receive $10,000.
  */
  let storedBalance = localStorage.getItem("tradezoraDemoBalance");

  if (storedBalance === null) {
    storedBalance = "10000";
    localStorage.setItem("tradezoraDemoBalance", storedBalance);
  }

  let balance = Number(storedBalance);

  let stake = Number(
    localStorage.getItem("tradezoraDemoStake") || 10
  );

  let price = 1000;

  let history = JSON.parse(localStorage.getItem("tradezoraDemoHistory") || "[]");
  let positions = JSON.parse(localStorage.getItem("tradezoraDemoPositions") || "[]");

  function saveTradeState() {
    localStorage.setItem("tradezoraDemoHistory", JSON.stringify(history));
    localStorage.setItem("tradezoraDemoPositions", JSON.stringify(positions));
  }

  let selectedDigit = 0;

  let pnl = 0;
  let wins = 0;
  let losses = 0;

  let contractType = "match";

  let mode = "AUTO";

  // Continuous demo trading state. Only one contract stream can run at a time.
  let continuousTrading = {
    running: false,
    type: null,
    contract: null,
    digit: null,
    stake: null,
    button: null,
    timer: null
  };


  /* =========================
     PROFILE
  ========================= */

  $("#profileName").textContent =
    user.name || "Demo Trader";

  $("#profileEmail").textContent =
    user.email || "demo@tradezora.local";

  $("#avatar").textContent =
    (user.name || "T")[0].toUpperCase();


  /* =========================
     HELPERS
  ========================= */

  function money(value) {
    return "$" + Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }


  function toast(message) {

    const element = $("#toast");

    if (!element) return;

    element.textContent = message;

    element.classList.add("show");

    setTimeout(() => {
      element.classList.remove("show");
    }, 1800);
  }


  function renderBalance() {

    $("#balance").textContent = money(balance);

    $("#stake").textContent = money(stake);

    const pnlElement = $("#sessionPnl");

    pnlElement.textContent =
      (pnl >= 0 ? "+" : "") + money(pnl);

    pnlElement.style.color =
      pnl >= 0 ? "#16e58a" : "#ff5d6c";

    $("#sessionRecord").textContent =
      `${wins}W · ${losses}L`;
  }


  renderBalance();


  /* =========================
     SIDE MENU
  ========================= */

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


  /* =========================
     LOGOUT
  ========================= */

  $("#logout").onclick = () => {

    localStorage.removeItem("tradezoraDemoUser");

    location.href = "auth.html";

  };


  /* =========================
     DEPOSIT
  ========================= */

  $("#depositBtn").onclick = () => {

    toast("Demo account only — real deposits are disabled.");

  };


  /* =========================
     THEME
  ========================= */

  $("#themeSwitch").onclick = () => {

    toast("Dark theme is active.");

  };


  /* =========================
     DIGIT PROBABILITIES
  ========================= */

  const probabilityContainer = $("#probabilities");

  /*
    Digit statistics are derived from the simulated price stream.
    This is demo data only — not a prediction of a real market.
  */
  const digitStats = Array(10).fill(10);

  function getLastDigit(value) {
    return Math.abs(Math.floor(Number(value))) % 10;
  }

  function renderDigitStatistics() {
    if (!probabilityContainer) return;

    const total = digitStats.reduce((sum, value) => sum + value, 0);
    probabilityContainer.innerHTML = "";

    digitStats.forEach((count, digit) => {
      const probability = (count / total) * 100;
      const element = document.createElement("div");

      element.className = "probability";
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", `Select digit ${digit}`);

      if (digit === selectedDigit) {
        element.style.borderColor = "#16e58a";
        element.style.background = "#0c2117";
      }

      element.innerHTML = `
        <span class="digit-number">${digit}</span>
        <span class="percent">${probability.toFixed(1)}%</span>
      `;

      const selectDigit = () => {
        selectedDigit = digit;
        renderDigitStatistics();
        toast(`Digit ${digit} selected.`);
      };

      element.addEventListener("click", selectDigit);
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectDigit();
        }
      });

      probabilityContainer.appendChild(element);
    });
  }

  function recordCurrentDigit() {
    const digit = getLastDigit(price);
    digitStats[digit] += 1;
  }

  function generateProbabilities() {
    renderDigitStatistics();
  }

  renderDigitStatistics();

  /*
    The old CHOOSE A CONTRACT DIGIT buttons have intentionally been removed.
    The 0–9 statistics row above is now the digit selector.
  */

  /* =========================
     CONTRACT TABS
  ========================= */

  const contractDigits =
    $("#contractDigits");


  for (let i = 0; i < 10; i++) {

    const button =
      document.createElement("button");

    button.textContent = i;

    button.dataset.digit = i;

    button.onclick = () => {

      selectedDigit = i;

      [...contractDigits.children]
        .forEach(element =>
          element.classList.remove("active")
        );

      button.classList.add("active");

      generateProbabilities();

      toast(`Digit ${i} selected.`);

    };

    contractDigits.appendChild(button);

  }


  contractDigits.children[0].classList.add("active");


  /* =========================
     CONTRACT TABS
  ========================= */

  const contractTabs =
    document.querySelectorAll(
      ".market-tabs button"
    );


  contractTabs.forEach(button => {

    button.addEventListener("click", () => {

      if (continuousTrading.running) {
        stopContinuousTrading(false);
      }

      contractTabs.forEach(tab =>
        tab.classList.remove("active")
      );

      button.classList.add("active");

      contractType =
        button.dataset.contract || "match";


      if (contractType === "even") {

        $("#match").innerHTML =
          "<strong>EVEN</strong><span>Demo</span>";

        $("#differ").innerHTML =
          "<strong>ODD</strong><span>Demo</span>";

      }

      else if (contractType === "over") {

        $("#match").innerHTML =
          "<strong>OVER</strong><span>Demo</span>";

        $("#differ").innerHTML =
          "<strong>UNDER</strong><span>Demo</span>";

      }

      else {

        $("#match").innerHTML =
          "<strong>MATCH</strong><span>Demo</span>";

        $("#differ").innerHTML =
          "<strong>DIFFER</strong><span>Demo</span>";

      }

    });

  });


  /* =========================
     AUTO / MANUAL
  ========================= */

  $("#auto").onclick = () => {

    mode = "AUTO";

    $("#auto").classList.add("active");
    $("#manual").classList.remove("active");

    toast("AUTO mode selected.");

  };


  $("#manual").onclick = () => {

    mode = "MANUAL";

    $("#manual").classList.add("active");
    $("#auto").classList.remove("active");

    toast("MANUAL mode selected.");

  };


  /* =========================
     STAKE
  ========================= */

  $("#stakeMinus").onclick = () => {

    stake = Math.max(
      1,
      stake - 1
    );

    localStorage.setItem(
      "tradezoraDemoStake",
      stake
    );

    renderBalance();

  };


  $("#stakePlus").onclick = () => {

    stake = Math.min(
      1000,
      balance,
      stake + 1
    );

    localStorage.setItem(
      "tradezoraDemoStake",
      stake
    );

    renderBalance();

  };


  /* =========================
     AI BOT
  ========================= */

  $("#scanner").onclick = () => {

    const button = $("#scanner");

    button.disabled = true;

    toast("AI BOT analyzing demo market...");


    setTimeout(() => {

      const suggestedDigit =
        Math.floor(Math.random() * 10);

      selectedDigit = suggestedDigit;


      [...contractDigits.children]
        .forEach(element =>
          element.classList.remove("active")
        );

      contractDigits
        .children[suggestedDigit]
        .classList.add("active");


      generateProbabilities();

      toast(
        `AI BOT demo signal: digit ${suggestedDigit}`
      );

      button.disabled = false;

    }, 1200);

  };


  /* =========================
     CHART
  ========================= */

  const chart =
    $("#priceChart");

  const ctx =
    chart.getContext("2d");


  let series =
    Array.from(
      { length: 100 },
      () =>
        price +
        (Math.random() - 0.5) * 120
    );


  let chartZoom = 1;


  function resizeChart() {

    const rect =
      chart.getBoundingClientRect();

    const ratio =
      window.devicePixelRatio || 1;

    chart.width =
      rect.width * ratio;

    chart.height =
      rect.height * ratio;

    ctx.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );

    drawChart();

  }


  function drawChart() {

    const width = chart.clientWidth;
    const height = chart.clientHeight;

    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const visibleCount = Math.max(
      30,
      Math.floor(series.length / chartZoom)
    );

    const visible = series.slice(-visibleCount);

    const minValue = Math.min(...visible);
    const maxValue = Math.max(...visible);
    const range = Math.max(1, maxValue - minValue);

    // Reserve space for the right-side price scale and bottom timestamps.
    const left = 8;
    const right = Math.max(58, Math.min(72, width * 0.18));
    const top = 10;
    const bottom = 24;
    const plotWidth = Math.max(1, width - left - right);
    const plotHeight = Math.max(1, height - top - bottom);

    const scaleMin = minValue - range * 0.10;
    const scaleMax = maxValue + range * 0.10;
    const scaleRange = Math.max(1, scaleMax - scaleMin);

    const xFor = (index) =>
      left + index * (plotWidth / Math.max(1, visible.length - 1));

    const yFor = (value) =>
      top + ((scaleMax - value) / scaleRange) * plotHeight;

    // Subtle chart grid.
    ctx.save();
    ctx.strokeStyle = "rgba(80,105,94,.18)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = top + (plotHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + plotWidth, y);
      ctx.stroke();
    }

    for (let i = 0; i <= 6; i++) {
      const x = left + (plotWidth / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + plotHeight);
      ctx.stroke();
    }
    ctx.restore();

    const points = visible.map((value, index) => ({
      x: xFor(index),
      y: yFor(value),
      value
    }));

    // Green glow behind the main price line.
    ctx.save();
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "rgba(22,229,138,.16)";
    ctx.lineWidth = 8;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // Main price line — white like the requested reference.
    ctx.save();
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "#f4f7f5";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    const current = points[points.length - 1];
    if (current) {
      // Current-price guide.
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255,255,255,.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, current.y);
      ctx.lineTo(left + plotWidth, current.y);
      ctx.stroke();
      ctx.restore();

      // Current price dot.
      ctx.save();
      ctx.beginPath();
      ctx.arc(current.x, current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(255,255,255,.65)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      // Current price label attached to the right edge.
      const priceText = Number(price).toFixed(2);
      const labelX = left + plotWidth + 5;
      const labelW = Math.min(right - 7, 70);
      const labelH = 22;
      const labelY = Math.max(
        top,
        Math.min(height - bottom - labelH, current.y - labelH / 2)
      );

      ctx.save();
      ctx.fillStyle = "#f4f7f5";
      ctx.beginPath();
      ctx.roundRect(labelX, labelY, labelW, labelH, 5);
      ctx.fill();

      ctx.fillStyle = "#08100c";
      ctx.font = "700 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        priceText,
        labelX + labelW / 2,
        labelY + labelH / 2 + .5
      );
      ctx.restore();
    }

    // Right-side price scale.
    ctx.save();
    ctx.fillStyle = "rgba(205,216,211,.72)";
    ctx.font = "9px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 5; i++) {
      const value = scaleMax - (scaleRange / 5) * i;
      const y = top + (plotHeight / 5) * i;

      ctx.fillText(
        value.toFixed(2),
        left + plotWidth + 5,
        y
      );
    }
    ctx.restore();

    // Bottom timestamps.
    ctx.save();
    ctx.fillStyle = "rgba(155,171,164,.62)";
    ctx.font = "8px system-ui, sans-serif";
    ctx.textBaseline = "top";

    const now = Date.now();
    const intervalMs = 1200;
    const labels = 5;

    for (let i = 0; i < labels; i++) {
      const ratio = i / (labels - 1);
      const index = Math.round(ratio * (visible.length - 1));
      const timestamp = new Date(
        now - (visible.length - 1 - index) * intervalMs
      );

      const time = timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });

      const x = xFor(index);
      ctx.textAlign = i === 0 ? "left" : i === labels - 1 ? "right" : "center";
      ctx.fillText(time, x, height - bottom + 8);
    }
    ctx.restore();

  }


  window.addEventListener(
    "resize",
    resizeChart
  );

  resizeChart();


  /* =========================
     SIMULATED MARKET
  ========================= */

  setInterval(() => {

    const oldPrice = price;

    price +=
      (Math.random() - 0.48) * 18;


    series.push(price);

    series.shift();


    const change =
      ((price - oldPrice) /
        oldPrice) *
      100;


    $("#pct").textContent =
      (change >= 0 ? "+" : "") +
      change.toFixed(3) +
      "%";


    $("#pct").style.color =
      change >= 0
        ? "#16e58a"
        : "#ff5d6c";


    recordCurrentDigit();
    generateProbabilities();

    drawChart();

  }, 1200);


  /* =========================
     CHART CONTROLS
  ========================= */

  $("#zoomIn").onclick = () => {

    chartZoom =
      Math.min(
        3,
        chartZoom + 0.5
      );

    drawChart();

  };


  $("#zoomOut").onclick = () => {

    chartZoom =
      Math.max(
        1,
        chartZoom - 0.5
      );

    drawChart();

  };


  $("#resetZoom").onclick = () => {

    chartZoom = 1;

    drawChart();

    toast("Chart reset.");

  };


  /* =========================
     MARKET SELECTOR
  ========================= */

  $("#marketSelect").onchange = () => {

    const market =
      $("#marketSelect").value;

    toast(
      `${market} selected.`
    );

  };


  /* =========================
     RENDER POSITIONS / HISTORY
  ========================= */

  function renderLists() {

    const positionsList =
      $("#positionsList");

    const historyList =
      $("#historyList");


    if (positions.length) {

      positionsList.innerHTML =
        positions.map(position => `

          <div class="position">

            <span>
              ${position.type}
              • ${money(position.stake)}
              • digit ${position.digit}
            </span>

            <strong>
              Open
            </strong>

          </div>

        `).join("");

    } else {

      positionsList.innerHTML =
        `<div class="empty">
          No open positions.
        </div>`;

    }


    if (history.length) {

      historyList.innerHTML =
        history
          .slice()
          .reverse()
          .map(trade => `

            <div class="history-item">

              <span>
                ${trade.type}
                • ${money(trade.stake)}
                • ${trade.digit}
              </span>

              <strong
                class="${trade.win ? "win" : "loss"}"
              >
                ${
                  trade.win
                    ? "WIN +" + money(trade.profit)
                    : "LOSS -" + money(trade.stake)
                }
              </strong>

            </div>

          `)
          .join("");

    } else {

      historyList.innerHTML =
        `<div class="empty">
          No trades yet.
        </div>`;

    }

  }


  /* =========================
     TRADE ENGINE
  ========================= */

  function trade(type, options = {}) {

    const tradeStake = Number(
      options.stake ?? stake
    );

    const tradeContract =
      options.contract || contractType;

    const tradeDigit = Number(
      options.digit ?? selectedDigit
    );

    const tradeMode =
      options.mode || mode;

    if (tradeStake <= 0) {

      toast("Enter a valid stake.");

      return false;

    }


    if (tradeStake > balance) {

      toast("Not enough demo balance.");

      return false;

    }


    // Deduct the stake immediately.
    balance -= tradeStake;


    localStorage.setItem(
      "tradezoraDemoBalance",
      balance
    );


    const position = {

      id: Date.now() + Math.random(),

      type,

      stake: tradeStake,

      digit: tradeDigit,

      contract: tradeContract,

      mode: tradeMode,

      openedAt: Date.now(),
      settleAt: Date.now() + 5000

    };


    positions.push(position);
    saveTradeState();


    renderBalance();

    renderLists();


    toast(
      `${type} demo position opened.`
    );


    // Simulate the contract result after 5 seconds.
    setTimeout(() => {

      const index =
        positions.findIndex(
          item => item.id === position.id
        );


      if (index < 0) return;


      const finalDigit =
        Math.floor(
          Math.random() * 10
        );


      let win = false;


      if (tradeContract === "match") {

        win =
          (finalDigit === tradeDigit && type === "MATCH") ||
          (finalDigit !== tradeDigit && type === "DIFFER");

      }

      else if (tradeContract === "even") {

        const even =
          finalDigit % 2 === 0;

        win =
          (even && type === "EVEN") ||
          (!even && type === "ODD");

      }

      else if (tradeContract === "over") {

        const over =
          finalDigit > 5;

        win =
          (over && type === "OVER") ||
          (!over && type === "UNDER");

      }


      const profit =
        win
          ? tradeStake * 0.85
          : 0;


      if (win) {

        balance +=
          tradeStake + profit;

        pnl += profit;

        wins++;

      } else {

        pnl -= tradeStake;

        losses++;

      }


      positions.splice(
        index,
        1
      );


      history.push({

        ...position,

        finalDigit,

        win,

        profit

      });


      if (history.length > 50) {

        history.shift();

      }

      saveTradeState();

      localStorage.setItem(
        "tradezoraDemoBalance",
        balance
      );


      renderBalance();

      renderLists();


      toast(
        win
          ? `Demo trade won — digit ${finalDigit}`
          : `Demo trade lost — digit ${finalDigit}`
      );


    }, 5000);

    return true;

  }


  /* =========================
     PERSISTENT CONTINUOUS DEMO TRADING
  ========================= */

  function buttonContractLabel(type) {
    if (type === "EVEN") return "EVEN";
    if (type === "ODD") return "ODD";
    if (type === "OVER") return "OVER";
    if (type === "UNDER") return "UNDER";
    if (type === "DIFFER") return "DIFFER";
    return "MATCH";
  }

  function setTradeButtonState(button, type, running) {
    if (!button) return;
    const label = buttonContractLabel(type);
    button.innerHTML = running
      ? `<strong>STOP ${label}</strong><span>Running</span>`
      : `<strong>${label}</strong><span>Demo</span>`;
    button.classList.toggle("continuous-active", running);
    button.setAttribute("aria-label", running
      ? `Stop continuous ${label} trading`
      : `Start ${label} trade`);
  }

  function currentContinuousState() {
    return window.TradeZoraContinuousEngine
      ? window.TradeZoraContinuousEngine.getState()
      : { running:false };
  }

  function getContractPair() {
    const current = String(contractType || "match").toLowerCase();

    if (current === "even") {
      return { left: "EVEN", right: "ODD" };
    }

    if (current === "over") {
      return { left: "OVER", right: "UNDER" };
    }

    return { left: "MATCH", right: "DIFFER" };
  }

  function syncContinuousButtons() {
    const state = currentContinuousState();
    const leftButton = $("#match");
    const rightButton = $("#differ");
    const pair = getContractPair();

    // Always rebuild BOTH buttons from the current state.
    // This prevents a previous STOP label from getting stuck.
    if (!state.running) {
      setTradeButtonState(leftButton, pair.left, false);
      setTradeButtonState(rightButton, pair.right, false);
      return;
    }

    const activeType = String(state.type || "").toUpperCase();

    if (activeType === pair.left) {
      setTradeButtonState(leftButton, pair.left, true);
      setTradeButtonState(rightButton, pair.right, false);
      return;
    }

    if (activeType === pair.right) {
      setTradeButtonState(leftButton, pair.left, false);
      setTradeButtonState(rightButton, pair.right, true);
      return;
    }

    // Safety fallback if an old/stale state contains another contract type.
    setTradeButtonState(leftButton, pair.left, false);
    setTradeButtonState(rightButton, pair.right, false);
  }

  function startOrStopContinuous(type, button) {
    const state = currentContinuousState();

    // Pressing the currently running contract stops it.
    if (state.running && String(state.type).toUpperCase() === type) {
      window.TradeZoraContinuousEngine.stop();

      // Update the UI immediately instead of waiting for the engine event.
      syncContinuousButtons();

      // Second sync catches any delayed localStorage/event update.
      setTimeout(syncContinuousButtons, 0);
      setTimeout(syncContinuousButtons, 100);

      toast("Continuous trading stopped.");
      return;
    }

    // Stop another running stream before starting this one.
    if (state.running) {
      window.TradeZoraContinuousEngine.stop();
      syncContinuousButtons();
    }

    const streamStake = Number(stake);
    if (
      streamStake <= 0 ||
      streamStake > Number(
        localStorage.getItem("tradezoraDemoBalance") || balance
      )
    ) {
      toast("Not enough demo balance for continuous trading.");
      syncContinuousButtons();
      return;
    }

    window.TradeZoraContinuousEngine.start({
      type,
      contract: contractType,
      digit: selectedDigit,
      stake: streamStake,
      mode
    });

    toast(`Continuous ${buttonContractLabel(type)} trading started.`);
    syncContinuousButtons();
  }

  $("#match").onclick = () => {
    const pair = getContractPair();
    startOrStopContinuous(pair.left, $("#match"));
  };

  $("#differ").onclick = () => {
    const pair = getContractPair();
    startOrStopContinuous(pair.right, $("#differ"));
  };

  window.addEventListener("tradezora-state-changed", () => {
    balance = Number(localStorage.getItem("tradezoraDemoBalance") || balance);
    history = JSON.parse(localStorage.getItem("tradezoraDemoHistory") || "[]");
    positions = JSON.parse(localStorage.getItem("tradezoraDemoPositions") || "[]");
    wins = history.filter(t => t.win).length;
    losses = history.filter(t => !t.win).length;
    pnl = history.reduce(
      (sum, t) => sum + (t.win ? Number(t.profit || 0) : -Number(t.stake || 0)),
      0
    );
    renderBalance();
    renderLists();
    syncContinuousButtons();
  });

  // Sync once on page load. The shared engine emits an event whenever its state changes.
  // Avoid a fast polling loop here because it causes unnecessary DOM redraws on mobile.
  syncContinuousButtons();

  /* Small visual cue for a running continuous button. */
  const continuousStyle = document.createElement("style");
  continuousStyle.textContent = `
    .market-actions button.continuous-active,
    #match.continuous-active,
    #differ.continuous-active {
      border-color: #16e58a !important;
      box-shadow: 0 0 0 2px rgba(22,229,138,.16), 0 8px 24px rgba(22,229,138,.12);
    }
  `;
  document.head.appendChild(continuousStyle);

  /* =========================
     CLEAR POSITIONS
  ========================= */

  $("#clearPositions").onclick = () => {

    positions = [];
    saveTradeState();

    renderLists();

    toast(
      "Open positions cleared from view."
    );

  };


  /* =========================
     INITIAL RENDER
  ========================= */

  renderLists();

  renderBalance();

  recordCurrentDigit();
  generateProbabilities();


  console.log(
    "TradeZora demo terminal initialized."
  );

});
/* =========================================================
   TRADEZORA ENTRY SCANNER — DEMO MODULE v2
   Demo only: simulated market search, no Deriv/API connection,
   no automatic trading, and no guaranteed outcome.
========================================================= */
(function () {
  function initTradeZoraScanner() {
    const trigger = document.querySelector('#scanner');
    if (!trigger) return;

    const old = document.querySelector('#tzScannerModal');
    if (old) old.remove();
    const oldStyle = document.querySelector('#tzScannerStyles');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.id = 'tzScannerStyles';
    style.textContent = `
      #tzScannerModal {
        position:fixed; inset:0; z-index:9999;
        display:none; align-items:center; justify-content:center;
        padding:12px; background:rgba(2,5,10,.78);
        backdrop-filter:blur(7px); -webkit-backdrop-filter:blur(7px);
      }
      #tzScannerModal.tz-open { display:flex; }
      #tzScannerCard {
        width:min(100%, 470px); max-height:min(86vh, 620px);
        overflow-y:auto; background:#0b1120; color:#f4f7ff;
        border:1px solid #26334e; border-radius:20px;
        box-shadow:0 20px 60px rgba(0,0,0,.55);
      }
      .tz-s-head { display:flex; align-items:center; gap:11px; padding:17px 18px 14px; border-bottom:1px solid #222c40; }
      .tz-s-icon { width:52px; height:52px; flex:0 0 52px; display:grid; place-items:center; border-radius:15px; background:linear-gradient(135deg,#7b35ff,#3f72ff); box-shadow:0 8px 22px rgba(96,58,255,.25); font-size:27px; font-weight:800; }
      .tz-s-title { min-width:0; flex:1; }
      .tz-s-title h2 { margin:0; font-size:22px; line-height:1.05; }
      .tz-s-title p { margin:5px 0 0; color:#7e879b; font-size:12px; }
      #tzScannerClose { width:36px; height:36px; flex:0 0 36px; border:0; background:transparent; color:#7d879d; font-size:29px; cursor:pointer; line-height:1; }
      .tz-s-body { padding:17px 18px 18px; }
      .tz-s-info { background:#182133; border-radius:16px; padding:15px 16px; color:#9da7bc; font-size:13px; line-height:1.55; margin-bottom:18px; }
      .tz-s-info strong { color:#f2f5ff; }
      .tz-s-label { display:block; margin:0 0 8px; font-size:14px; font-weight:800; }
      #tzScannerMarket { width:100%; box-sizing:border-box; background:#0b101b; color:#eef2fb; border:1px solid #273248; border-radius:13px; padding:12px 13px; font-size:14px; outline:none; }
      .tz-s-ready { display:flex; justify-content:space-between; align-items:center; margin:22px 0 9px; font-size:14px; font-weight:800; }
      #tzScanCount { color:#8b96ad; }
      .tz-progress { height:8px; background:#1b2638; border-radius:99px; overflow:hidden; }
      #tzProgressBar { width:0%; height:100%; border-radius:99px; background:linear-gradient(90deg,#6451ff,#278fff); transition:width .08s linear; }
      #tzScanStatus { margin-top:8px; min-height:18px; color:#8290a9; font-size:11px; text-align:center; }
      #tzScanButton, #tzLoadButton { width:100%; border-radius:14px; padding:14px 13px; font-size:15px; font-weight:900; cursor:pointer; margin-top:17px; }
      #tzScanButton { border:0; color:#fff; background:linear-gradient(100deg,#5e4cff,#278fff); box-shadow:0 9px 22px rgba(54,91,255,.20); }
      #tzScanButton:disabled { opacity:.62; cursor:wait; }
      #tzLoadButton { border:1px solid #41516d; color:#f4f7ff; background:#172236; }
      #tzLoadButton:disabled { opacity:.42; cursor:not-allowed; }
      .tz-result { display:none; margin-top:14px; padding:13px; border:1px solid #293651; border-radius:14px; background:#111a2a; }
      .tz-result.tz-show { display:block; }
      .tz-result-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .tz-result-item { padding:9px; border-radius:10px; background:#0a101b; }
      .tz-result-item small { display:block; color:#778197; margin-bottom:4px; font-size:10px; }
      .tz-result-item strong { font-size:13px; }
      .tz-s-note { margin-top:12px; color:#68748a; font-size:10px; line-height:1.45; }
      @media (max-width:650px) {
        #tzScannerModal { padding:10px; }
        #tzScannerCard { width:min(100%, 430px); max-height:82vh; border-radius:18px; }
        .tz-s-head { padding:14px 15px 12px; }
        .tz-s-icon { width:46px; height:46px; flex-basis:46px; border-radius:13px; font-size:24px; }
        .tz-s-title h2 { font-size:20px; }
        .tz-s-title p { font-size:11px; }
        .tz-s-body { padding:14px 15px 16px; }
        .tz-s-info { padding:13px 14px; font-size:12px; margin-bottom:15px; }
        .tz-s-ready { margin-top:18px; }
        #tzScanButton, #tzLoadButton { margin-top:14px; padding:13px 12px; font-size:14px; }
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'tzScannerModal';
    modal.innerHTML = `
      <div id="tzScannerCard" role="dialog" aria-modal="true" aria-labelledby="tzScannerTitle">
        <div class="tz-s-head">
          <div class="tz-s-icon">✧</div>
          <div class="tz-s-title">
            <h2 id="tzScannerTitle">Entry Scanner</h2>
            <p>TradeZora Demo Scanner</p>
          </div>
          <button id="tzScannerClose" aria-label="Close scanner">×</button>
        </div>
        <div class="tz-s-body">
          <div class="tz-s-info">
            Choose a market category. The demo scanner will <strong>search several simulated volatility markets</strong> and select a simulated setup. It does not connect to Deriv.
          </div>

          <label class="tz-s-label" for="tzScannerMarket">Market category</label>
          <select id="tzScannerMarket">
            <option value="AUTO">Search all volatility markets</option>
            <option value="Volatility 10 (1s)">Volatility 10 (1s)</option>
            <option value="Volatility 25 (1s)">Volatility 25 (1s)</option>
            <option value="Volatility 50 (1s)">Volatility 50 (1s)</option>
            <option value="Volatility 75 (1s)">Volatility 75 (1s)</option>
            <option value="Volatility 100 (1s)">Volatility 100 (1s)</option>
          </select>

          <div class="tz-s-ready">
            <span id="tzReadyText">Ready to scan</span>
            <span id="tzScanCount">0%</span>
          </div>
          <div class="tz-progress"><div id="tzProgressBar"></div></div>
          <div id="tzScanStatus">Press Deep Scan to search for a simulated setup.</div>

          <button id="tzScanButton">⌕ &nbsp; Deep Scan for Best Market</button>

          <div id="tzResult" class="tz-result">
            <div class="tz-result-grid">
              <div class="tz-result-item"><small>Market</small><strong id="tzResultMarket">—</strong></div>
              <div class="tz-result-item"><small>Contract</small><strong id="tzResultSignal">—</strong></div>
              <div class="tz-result-item"><small>Digit</small><strong id="tzResultDigit">—</strong></div>
              <div class="tz-result-item"><small>Demo confidence</small><strong id="tzResultConfidence">—</strong></div>
            </div>
          </div>

          <button id="tzLoadButton" disabled>Load Deep Scanner Bot</button>
          <div class="tz-s-note">Demo only. Loading applies the simulated market, contract and digit to the terminal. It does not place a trade.</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const $s = (id) => document.querySelector(id);
    let scanResult = null;
    let scanRunning = false;

    const close = () => modal.classList.remove('tz-open');
    const resetScanUI = () => {
      scanResult = null;
      scanRunning = false;
      $s('#tzReadyText').textContent = 'Ready to scan';
      $s('#tzScanCount').textContent = '0%';
      $s('#tzProgressBar').style.width = '0%';
      $s('#tzScanStatus').textContent = 'Press Deep Scan to search for a simulated setup.';
      $s('#tzResult').classList.remove('tz-show');
      $s('#tzLoadButton').disabled = true;
      $s('#tzScanButton').disabled = false;
    };
    const open = () => { modal.classList.add('tz-open'); resetScanUI(); };

    trigger.onclick = (event) => { event.preventDefault(); event.stopPropagation(); open(); };
    $s('#tzScannerClose').onclick = close;
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const marketOptions = [
      'Volatility 10 (1s)', 'Volatility 25 (1s)', 'Volatility 50 (1s)',
      'Volatility 75 (1s)', 'Volatility 100 (1s)'
    ];
    const signals = ['MATCH', 'DIFFER', 'EVEN', 'ODD', 'OVER', 'UNDER'];

    $s('#tzScanButton').onclick = async () => {
      if (scanRunning) return;
      scanRunning = true;

      const scanButton = $s('#tzScanButton');
      const loadButton = $s('#tzLoadButton');
      const count = $s('#tzScanCount');
      const bar = $s('#tzProgressBar');
      const readyText = $s('#tzReadyText');
      const status = $s('#tzScanStatus');
      const resultBox = $s('#tzResult');
      const selectedCategory = $s('#tzScannerMarket').value;

      scanButton.disabled = true;
      loadButton.disabled = true;
      resultBox.classList.remove('tz-show');
      readyText.textContent = 'Searching markets';

      const marketsToCheck = selectedCategory === 'AUTO' ? marketOptions : [selectedCategory];
      const marketScores = [];
      const totalSteps = 100;

      for (let percent = 1; percent <= totalSteps; percent++) {
        // Deliberately paced demo scan so the search feels visible rather than instant.
        await wait(85);

        const marketIndex = Math.min(
          marketsToCheck.length - 1,
          Math.floor(((percent - 1) / totalSteps) * marketsToCheck.length)
        );
        const market = marketsToCheck[marketIndex];
        const marketProgress = Math.round(((percent - marketIndex * (100 / marketsToCheck.length)) / (100 / marketsToCheck.length)) * 100);
        const safeProgress = Math.max(1, Math.min(100, marketProgress));

        count.textContent = `${percent}%`;
        bar.style.width = `${percent}%`;
        status.textContent = `Searching ${market} · ${safeProgress}%`;

        // Simulated score only — not real market analysis.
        if (percent % 20 === 0 || percent === 1) {
          marketScores.push({ market, score: 50 + Math.floor(Math.random() * 50) });
        }
      }

      readyText.textContent = 'Best simulated market found';
      status.textContent = 'Comparing simulated tick patterns…';
      await wait(700);

      let market;
      if (selectedCategory !== 'AUTO') {
        market = selectedCategory;
      } else {
        market = (marketScores.sort((a, b) => b.score - a.score)[0] || { market: marketOptions[0] }).market;
      }

      const signal = signals[Math.floor(Math.random() * signals.length)];
      const digit = Math.floor(Math.random() * 10);
      const confidence = 80 + Math.floor(Math.random() * 16);
      scanResult = { market, signal, digit, confidence };

      $s('#tzResultMarket').textContent = market;
      $s('#tzResultSignal').textContent = signal;
      $s('#tzResultDigit').textContent = digit;
      $s('#tzResultConfidence').textContent = `${confidence}%`;
      resultBox.classList.add('tz-show');
      status.textContent = 'Simulated contract ready to load.';
      readyText.textContent = 'Scan complete';
      loadButton.disabled = false;
      scanRunning = false;
    };

    $s('#tzLoadButton').onclick = async () => {
      if (!scanResult || scanRunning) return;
      scanRunning = true;
      $s('#tzLoadButton').disabled = true;
      $s('#tzScanStatus').textContent = 'Loading contract into terminal…';
      await wait(450);

      const marketSelect = document.querySelector('#marketSelect');
      if (marketSelect) {
        const match = [...marketSelect.options].find(option =>
          option.value === scanResult.market || option.textContent.trim() === scanResult.market
        );
        if (match) {
          marketSelect.value = match.value;
          marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const contractMap = {
        MATCH: 'match', DIFFER: 'match',
        EVEN: 'even', ODD: 'even',
        OVER: 'over', UNDER: 'over'
      };
      const wantedContract = contractMap[scanResult.signal];
      const contractTab = [...document.querySelectorAll('.market-tabs button')]
        .find(button => (button.dataset.contract || '').toLowerCase() === wantedContract);
      if (contractTab) contractTab.click();

      selectedDigit = Number(scanResult.digit);
      renderDigitStatistics();

      // Put the simulated contract details on the dashboard without placing a trade.
      const contractLabel = document.querySelector('#selectedContract, #contractType, [data-selected-contract]');
      if (contractLabel) contractLabel.textContent = scanResult.signal;

      close();
      showScannerToast(`Loaded ${scanResult.market} · ${scanResult.signal} · Digit ${scanResult.digit}`);
      scanRunning = false;
    };

    function showScannerToast(message) {
      const existing = document.querySelector('#toast');
      if (existing) {
        existing.textContent = message;
        existing.classList.add('show');
        setTimeout(() => existing.classList.remove('show'), 2600);
        return;
      }
      const t = document.createElement('div');
      t.textContent = message;
      t.style.cssText = 'position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:10001;background:#102019;color:#e8fff3;border:1px solid #20543b;padding:11px 14px;border-radius:10px;font:700 12px system-ui;white-space:nowrap;max-width:90vw;text-align:center;';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTradeZoraScanner, { once: true });
  } else {
    initTradeZoraScanner();
  }
})();
