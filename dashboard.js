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

  let history = [];
  let positions = [];

  let selectedDigit = 0;

  let pnl = 0;
  let wins = 0;
  let losses = 0;

  let contractType = "match";

  let mode = "AUTO";


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

  function trade(type) {

    if (stake <= 0) {

      toast("Enter a valid stake.");

      return;

    }


    if (stake > balance) {

      toast("Not enough demo balance.");

      return;

    }


    /*
      Deduct stake immediately.
    */

    balance -= stake;


    localStorage.setItem(
      "tradezoraDemoBalance",
      balance
    );


    const position = {

      id: Date.now(),

      type,

      stake,

      digit: selectedDigit,

      contract: contractType,

      mode

    };


    positions.push(position);


    renderBalance();

    renderLists();


    toast(
      `${type} demo position opened.`
    );


    /*
      Simulate contract result after 5 seconds.
    */

    setTimeout(() => {

      const index =
        positions.findIndex(
          item =>
            item.id === position.id
        );


      if (index < 0) return;


      /*
        Generate a final simulated digit.
      */

      const finalDigit =
        Math.floor(
          Math.random() * 10
        );


      let win = false;


      if (contractType === "match") {

        win =
          finalDigit === selectedDigit &&
          type === "MATCH"
          ||
          finalDigit !== selectedDigit &&
          type === "DIFFER";

      }

      else if (contractType === "even") {

        const even =
          finalDigit % 2 === 0;

        win =
          (even && type === "EVEN") ||
          (!even && type === "ODD");

      }

      else if (contractType === "over") {

        const over =
          finalDigit > 5;

        win =
          (over && type === "OVER") ||
          (!over && type === "UNDER");

      }


      /*
        Demo payout.
      */

      const profit =
        win
          ? stake * 0.85
          : 0;


      if (win) {

        balance +=
          stake + profit;

        pnl += profit;

        wins++;

      } else {

        pnl -= stake;

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


      /*
        Keep history manageable.
      */

      if (history.length > 50) {

        history.shift();

      }


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

    trade(type);

  };


  $("#differ").onclick = () => {

    let type = "DIFFER";

    if (contractType === "even") {
      type = "ODD";
    }

    if (contractType === "over") {
      type = "UNDER";
    }

    trade(type);

  };


  /* =========================
     CLEAR POSITIONS
  ========================= */

  $("#clearPositions").onclick = () => {

    positions = [];

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

  generateProbabilities();


  console.log(
    "TradeZora demo terminal initialized."
  );

});
/* =========================================================
   TRADEZORA ENTRY SCANNER — DEMO MODULE
   This module adds the working scanner flow without any
   Deriv/API connection and without automatic trading.
========================================================= */
(function () {
  function initTradeZoraScanner() {
    const trigger = document.querySelector('#scanner');
    if (!trigger) return;

    /* Remove a previously injected version if the script is reloaded. */
    const old = document.querySelector('#tzScannerModal');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'tzScannerStyles';
    style.textContent = `
      #tzScannerModal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(2, 5, 10, .78);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      #tzScannerModal.tz-open { display: flex; }
      #tzScannerCard {
        width: min(100%, 640px);
        max-height: min(92vh, 760px);
        overflow-y: auto;
        background: #0b1120;
        border: 1px solid #26334e;
        border-radius: 24px;
        box-shadow: 0 24px 80px rgba(0,0,0,.55);
        color: #f4f7ff;
      }
      .tz-s-head {
        display:flex; align-items:center; gap:16px;
        padding:28px 28px 24px;
        border-bottom:1px solid #222c40;
      }
      .tz-s-icon {
        width:78px; height:78px; flex:0 0 78px;
        display:grid; place-items:center;
        border-radius:20px;
        background:linear-gradient(135deg,#7b35ff,#3f72ff);
        box-shadow:0 12px 30px rgba(96,58,255,.28);
        font-size:40px; font-weight:800;
      }
      .tz-s-title { min-width:0; flex:1; }
      .tz-s-title h2 { margin:0; font-size:30px; line-height:1.05; }
      .tz-s-title p { margin:8px 0 0; color:#7e879b; font-size:16px; }
      #tzScannerClose {
        width:42px; height:42px; flex:0 0 42px;
        border:0; background:transparent; color:#7d879d;
        font-size:34px; cursor:pointer; line-height:1;
      }
      .tz-s-body { padding:28px; }
      .tz-s-info {
        background:#182133; border-radius:22px; padding:25px 26px;
        color:#9da7bc; font-size:18px; line-height:1.65;
        margin-bottom:28px;
      }
      .tz-s-info strong { color:#f2f5ff; }
      .tz-s-label { display:block; margin:0 0 12px; font-size:18px; font-weight:800; }
      #tzScannerMarket {
        width:100%; box-sizing:border-box;
        background:#0b101b; color:#eef2fb;
        border:1px solid #273248; border-radius:18px;
        padding:17px 18px; font-size:18px; outline:none;
      }
      .tz-s-ready {
        display:flex; justify-content:space-between; align-items:center;
        margin:36px 0 12px; font-size:18px; font-weight:800;
      }
      #tzScanCount { color:#707b91; }
      .tz-progress {
        height:12px; background:#1b2638; border-radius:99px; overflow:hidden;
      }
      #tzProgressBar {
        width:0%; height:100%; border-radius:99px;
        background:linear-gradient(90deg,#6451ff,#278fff);
        transition:width .12s linear;
      }
      #tzScanButton, #tzLoadButton {
        width:100%; border-radius:18px; padding:20px 16px;
        font-size:20px; font-weight:900; cursor:pointer;
        margin-top:28px;
      }
      #tzScanButton {
        border:0; color:#fff;
        background:linear-gradient(100deg,#5e4cff,#278fff);
        box-shadow:0 12px 28px rgba(54,91,255,.22);
      }
      #tzScanButton:disabled { opacity:.65; cursor:wait; }
      #tzLoadButton {
        border:1px solid #41516d; color:#f4f7ff; background:#172236;
      }
      #tzLoadButton:disabled { opacity:.45; cursor:not-allowed; }
      .tz-result {
        display:none; margin-top:22px; padding:18px;
        border:1px solid #293651; border-radius:18px; background:#111a2a;
      }
      .tz-result.tz-show { display:block; }
      .tz-result-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .tz-result-item { padding:12px; border-radius:12px; background:#0a101b; }
      .tz-result-item small { display:block; color:#778197; margin-bottom:5px; }
      .tz-result-item strong { font-size:16px; }
      .tz-s-note { margin-top:16px; color:#68748a; font-size:12px; line-height:1.5; }
      @media (max-width:650px) {
        #tzScannerModal { padding:12px; align-items:center; }
        #tzScannerCard { border-radius:22px; max-height:90vh; }
        .tz-s-head { padding:22px 18px 20px; gap:13px; }
        .tz-s-icon { width:64px; height:64px; flex-basis:64px; border-radius:17px; font-size:31px; }
        .tz-s-title h2 { font-size:27px; }
        .tz-s-title p { font-size:14px; }
        .tz-s-body { padding:18px; }
        .tz-s-info { padding:21px; font-size:17px; }
        .tz-s-ready { margin-top:28px; }
        #tzScanButton, #tzLoadButton { font-size:18px; padding:18px 14px; }
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
            Pick the market category you want to scan. The demo scanner checks simulated
            <strong>volatility / synthetic-style</strong> markets and surfaces a demo entry
            signal based on simulated tick patterns.
          </div>

          <label class="tz-s-label" for="tzScannerMarket">Market</label>
          <select id="tzScannerMarket">
            <option value="Volatility 10 (1s)">Volatility 10 (1s)</option>
            <option value="Volatility 25 (1s)">Volatility 25 (1s)</option>
            <option value="Volatility 50 (1s)">Volatility 50 (1s)</option>
            <option value="Volatility 75 (1s)">Volatility 75 (1s)</option>
            <option value="Volatility 100 (1s)">Volatility 100 (1s)</option>
            <option value="Even / Odd">Even / Odd</option>
            <option value="Over / Under">Over / Under</option>
          </select>

          <div class="tz-s-ready">
            <span id="tzReadyText">Ready to scan</span>
            <span id="tzScanCount">0%</span>
          </div>
          <div class="tz-progress"><div id="tzProgressBar"></div></div>

          <button id="tzScanButton">⌕ &nbsp; Deep Scan for Best Market</button>

          <div id="tzResult" class="tz-result">
            <div class="tz-result-grid">
              <div class="tz-result-item"><small>Market</small><strong id="tzResultMarket">—</strong></div>
              <div class="tz-result-item"><small>Signal</small><strong id="tzResultSignal">—</strong></div>
              <div class="tz-result-item"><small>Digit</small><strong id="tzResultDigit">—</strong></div>
              <div class="tz-result-item"><small>Demo confidence</small><strong id="tzResultConfidence">—</strong></div>
            </div>
          </div>

          <button id="tzLoadButton" disabled>Load Deep Scanner Bot</button>
          <div class="tz-s-note">Demo only. The scanner does not connect to Deriv, place trades automatically, or guarantee an outcome.</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.classList.remove('tz-open');
    const open = () => {
      modal.classList.add('tz-open');
      resetScanUI();
    };

    function resetScanUI() {
      document.querySelector('#tzReadyText').textContent = 'Ready to scan';
      document.querySelector('#tzScanCount').textContent = '0%';
      document.querySelector('#tzProgressBar').style.width = '0%';
      document.querySelector('#tzResult').classList.remove('tz-show');
      document.querySelector('#tzLoadButton').disabled = true;
      document.querySelector('#tzScanButton').disabled = false;
    }

    trigger.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      open();
    };

    document.querySelector('#tzScannerClose').onclick = close;
    modal.addEventListener('click', (event) => {
      if (event.target === modal) close();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });

    let scanResult = null;

    document.querySelector('#tzScanButton').onclick = async () => {
      const scanButton = document.querySelector('#tzScanButton');
      const loadButton = document.querySelector('#tzLoadButton');
      const count = document.querySelector('#tzScanCount');
      const bar = document.querySelector('#tzProgressBar');
      const readyText = document.querySelector('#tzReadyText');
      const resultBox = document.querySelector('#tzResult');

      scanButton.disabled = true;
      loadButton.disabled = true;
      resultBox.classList.remove('tz-show');
      readyText.textContent = 'Deep scanning';

      for (let i = 1; i <= 13; i++) {
        await new Promise(resolve => setTimeout(resolve, 130));
        count.textContent = `${i}/13`;
        bar.style.width = `${(i / 13) * 100}%`;
      }

      const marketOptions = [
        'Volatility 10 (1s)',
        'Volatility 25 (1s)',
        'Volatility 50 (1s)',
        'Volatility 75 (1s)',
        'Volatility 100 (1s)'
      ];
      const selectedCategory = document.querySelector('#tzScannerMarket').value;
      const market = marketOptions.includes(selectedCategory)
        ? selectedCategory
        : marketOptions[Math.floor(Math.random() * marketOptions.length)];
      const signals = ['MATCH', 'DIFFER', 'EVEN', 'ODD', 'OVER', 'UNDER'];
      const signal = signals[Math.floor(Math.random() * signals.length)];
      const digit = Math.floor(Math.random() * 10);
      const confidence = 80 + Math.floor(Math.random() * 16);

      scanResult = { market, signal, digit, confidence };
      readyText.textContent = 'Scan complete';
      document.querySelector('#tzResultMarket').textContent = market;
      document.querySelector('#tzResultSignal').textContent = signal;
      document.querySelector('#tzResultDigit').textContent = digit;
      document.querySelector('#tzResultConfidence').textContent = `${confidence}%`;
      resultBox.classList.add('tz-show');
      loadButton.disabled = false;
    };

    document.querySelector('#tzLoadButton').onclick = () => {
      if (!scanResult) return;

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

      const digitButton = document.querySelector(`#contractDigits button[data-digit="${scanResult.digit}"]`) ||
        [...document.querySelectorAll('#contractDigits button')].find(button => button.textContent.trim() === String(scanResult.digit));
      if (digitButton) digitButton.click();

      const contractMap = {
        MATCH: 'match', DIFFER: 'match',
        EVEN: 'even', ODD: 'even',
        OVER: 'over', UNDER: 'over'
      };
      const wantedContract = contractMap[scanResult.signal];
      const contractTab = [...document.querySelectorAll('.market-tabs button')]
        .find(button => (button.dataset.contract || '').toLowerCase() === wantedContract);
      if (contractTab) contractTab.click();

      close();
      showScannerToast(`Deep Scanner loaded: ${scanResult.signal}, digit ${scanResult.digit}`);
    };

    function showScannerToast(message) {
      const existing = document.querySelector('#toast');
      if (existing) {
        existing.textContent = message;
        existing.classList.add('show');
        setTimeout(() => existing.classList.remove('show'), 2200);
        return;
      }
      const t = document.createElement('div');
      t.textContent = message;
      t.style.cssText = 'position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:10001;background:#102019;color:#e8fff3;border:1px solid #20543b;padding:11px 14px;border-radius:10px;font:700 12px system-ui;white-space:nowrap;';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTradeZoraScanner, { once: true });
  } else {
    initTradeZoraScanner();
  }
})();
