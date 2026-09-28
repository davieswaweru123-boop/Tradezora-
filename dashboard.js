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


  function generateProbabilities() {

    if (!probabilityContainer) return;

    const values = [];

    let remaining = 100;

    for (let i = 0; i < 10; i++) {

      if (i === 9) {

        values.push(Number(remaining.toFixed(1)));

      } else {

        const value =
          Math.max(
            4,
            Math.min(
              17,
              7 + (Math.random() - 0.5) * 6
            )
          );

        values.push(Number(value.toFixed(1)));

        remaining -= value;

      }

    }


    /*
      Normalize probabilities so total = 100.
    */

    const total =
      values.reduce((a, b) => a + b, 0);

    const normalized =
      values.map(v => (v / total) * 100);


    probabilityContainer.innerHTML = "";


    normalized.forEach((probability, digit) => {

      const element =
        document.createElement("div");

      element.className = "probability";

      if (digit === selectedDigit) {
        element.style.borderColor = "#16e58a";
        element.style.background = "#0c2117";
      }

      element.innerHTML = `
        <span class="digit-number">${digit}</span>
        <span class="percent">${probability.toFixed(1)}%</span>
      `;

      probabilityContainer.appendChild(element);

    });

  }


  generateProbabilities();


  /* =========================
     CONTRACT DIGITS
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

    const width =
      chart.clientWidth;

    const height =
      chart.clientHeight;

    if (!width || !height) return;


    ctx.clearRect(
      0,
      0,
      width,
      height
    );


    const visibleCount =
      Math.max(
        30,
        Math.floor(
          series.length / chartZoom
        )
      );


    const visible =
      series.slice(-visibleCount);


    const min =
      Math.min(...visible) - 20;

    const max =
      Math.max(...visible) + 20;


    /*
      Main line
    */

    ctx.beginPath();


    visible.forEach((value, index) => {

      const x =
        index *
        (width / (visible.length - 1));


      const y =
        height -
        ((value - min) /
          (max - min)) *
          height *
          0.82 -
        height * 0.05;


      if (index === 0) {

        ctx.moveTo(x, y);

      } else {

        ctx.lineTo(x, y);

      }

    });


    ctx.strokeStyle =
      "#16e58a";

    ctx.lineWidth = 2;

    ctx.stroke();


    /*
      Glow line
    */

    ctx.beginPath();


    visible.forEach((value, index) => {

      const x =
        index *
        (width / (visible.length - 1));

      const y =
        height -
        ((value - min) /
          (max - min)) *
          height *
          0.82 -
        height * 0.05;


      if (index === 0) {

        ctx.moveTo(x, y);

      } else {

        ctx.lineTo(x, y);

      }

    });


    ctx.strokeStyle =
      "rgba(22,229,138,0.18)";

    ctx.lineWidth = 7;

    ctx.stroke();

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
     CONTINUOUS DEMO TRADING
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
    button.setAttribute(
      "aria-label",
      running ? `Stop continuous ${label} trading` : `Start ${label} trade`
    );

  }


  function stopContinuousTrading(showToast = true) {

    if (!continuousTrading.running) return;

    if (continuousTrading.timer) {
      clearTimeout(continuousTrading.timer);
    }

    const button = continuousTrading.button;
    const type = continuousTrading.type;

    continuousTrading = {
      running: false,
      type: null,
      contract: null,
      digit: null,
      stake: null,
      button: null,
      timer: null
    };

    setTradeButtonState(button, type || "MATCH", false);

    if (showToast) {
      toast("Continuous trading stopped.");
    }

  }


  function startContinuousTrading(type, button) {

    // Pressing the active button again stops the stream.
    if (
      continuousTrading.running &&
      continuousTrading.button === button
    ) {
      stopContinuousTrading(true);
      return;
    }

    // Only one continuous stream runs at once.
    if (continuousTrading.running) {
      stopContinuousTrading(false);
    }

    const streamContract = contractType;
    const streamDigit = selectedDigit;
    const streamStake = Number(stake);

    if (streamStake <= 0 || streamStake > balance) {
      toast("Not enough demo balance for continuous trading.");
      return;
    }

    continuousTrading = {
      running: true,
      type,
      contract: streamContract,
      digit: streamDigit,
      stake: streamStake,
      button,
      timer: null
    };

    setTradeButtonState(button, type, true);

    toast(`Continuous ${buttonContractLabel(type)} trading started.`);

    // Open the first demo trade immediately.
    const opened = trade(type, {
      contract: streamContract,
      digit: streamDigit,
      stake: streamStake,
      mode
    });

    if (!opened) {
      stopContinuousTrading(false);
      return;
    }

    scheduleNextContinuousTrade();

  }


  function scheduleNextContinuousTrade() {

    if (!continuousTrading.running) return;

    // Wait slightly longer than the 5-second demo result so trades don't overlap.
    continuousTrading.timer = setTimeout(() => {

      if (!continuousTrading.running) return;

      const opened = trade(
        continuousTrading.type,
        {
          contract: continuousTrading.contract,
          digit: continuousTrading.digit,
          stake: continuousTrading.stake,
          mode
        }
      );

      if (!opened) {
        stopContinuousTrading(true);
        return;
      }

      scheduleNextContinuousTrade();

    }, 6500);

  }


  /* =========================
     TRADE BUTTONS
  ========================= */

  $("#match").onclick = () => {

    let type = "MATCH";

    if (contractType === "even") {
      type = "EVEN";
    }

    if (contractType === "over") {
      type = "OVER";
    }

    startContinuousTrading(type, $("#match"));

  };


  $("#differ").onclick = () => {

    let type = "DIFFER";

    if (contractType === "even") {
      type = "ODD";
    }

    if (contractType === "over") {
      type = "UNDER";
    }

    startContinuousTrading(type, $("#differ"));

  };


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

  // Small visual cue for a running continuous button.
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

  renderLists();

  renderBalance();

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
