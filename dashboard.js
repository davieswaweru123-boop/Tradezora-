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

  let storedBalance = localStorage.getItem("tradezoraDemoBalance");

  if (storedBalance === null) {
    storedBalance = "10000";
    localStorage.setItem("tradezoraDemoBalance", storedBalance);
  }

  let balance = Number(storedBalance);

  let stake = Number(
    localStorage.getItem("tradezoraDemoStake") || 10
  );

  let pnl = 0;
  let wins = 0;
  let losses = 0;

  let history = [];
  let positions = [];

  let selectedDigit = 0;
  let contractType = "match";
  let mode = "AUTO";

  let currentMarket = "Volatility 10 (1s)";
  let price = 1000;

  let chartTimer = null;
  let tradeTimers = [];

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


  function signedMoney(value) {
    return value >= 0
      ? "+" + money(value)
      : "-" + money(Math.abs(value));
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

    if (pnlElement) {
      pnlElement.textContent = signedMoney(pnl);
      pnlElement.style.color =
        pnl >= 0 ? "#16e58a" : "#ff5d6c";
    }

    const record = $("#sessionRecord");

    if (record) {
      record.textContent =
        `${wins}W · ${losses}L`;
    }
  }


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

    cancelAllTradeTimers();

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
     RESET DEMO BUTTON
  ========================= */

  function createResetButton() {

    let resetButton = $("#resetDemo");

    if (resetButton) return resetButton;

    resetButton = document.createElement("button");

    resetButton.id = "resetDemo";
    resetButton.className = "reset-demo";
    resetButton.textContent = "↻ Reset Demo";

    const logout = $("#logout");

    if (logout && logout.parentNode) {
      logout.parentNode.insertBefore(resetButton, logout);
    }

    return resetButton;
  }


  const resetDemoButton = createResetButton();


  function cancelAllTradeTimers() {

    tradeTimers.forEach(timer => {
      clearTimeout(timer);
    });

    tradeTimers = [];
  }


  function resetDemo() {

    const confirmed = confirm(
      "Reset the entire TradeZora demo?\n\n" +
      "This will restore the $10,000 demo balance " +
      "and clear positions, history and session results."
    );

    if (!confirmed) return;

    cancelAllTradeTimers();

    balance = 10000;
    stake = 10;

    pnl = 0;
    wins = 0;
    losses = 0;

    history = [];
    positions = [];

    selectedDigit = 0;
    contractType = "match";
    mode = "AUTO";

    currentMarket = "Volatility 10 (1s)";
    price = 1000;

    localStorage.setItem(
      "tradezoraDemoBalance",
      "10000"
    );

    localStorage.setItem(
      "tradezoraDemoStake",
      "10"
    );

    const marketSelect = $("#marketSelect");

    if (marketSelect) {
      marketSelect.value = "Volatility 10 (1s)";
    }

    contractTabs.forEach(tab => {
      tab.classList.remove("active");

      if (tab.dataset.contract === "match") {
        tab.classList.add("active");
      }
    });

    $("#match").innerHTML =
      "<strong>MATCH</strong><span>Demo</span>";

    $("#differ").innerHTML =
      "<strong>DIFFER</strong><span>Demo</span>";

    $("#auto").classList.add("active");
    $("#manual").classList.remove("active");

    if (contractDigits.children.length) {

      [...contractDigits.children].forEach(
        button => button.classList.remove("active")
      );

      contractDigits.children[0].classList.add("active");
    }

    clearBotResult();

    resetChart();

    renderBalance();
    renderLists();
    generateProbabilities();

    toast("Demo account reset to $10,000.");
  }


  resetDemoButton.onclick = resetDemo;


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

        values.push(
          Number(remaining.toFixed(1))
        );

      } else {

        const value = Math.max(
          4,
          Math.min(
            17,
            7 + (Math.random() - 0.5) * 6
          )
        );

        values.push(
          Number(value.toFixed(1))
        );

        remaining -= value;
      }
    }

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

      updateContractButtons();

      generateProbabilities();
    });

  });


  function updateContractButtons() {

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
  }


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

  const demoMarkets = [
    "Volatility 10 (1s)",
    "Volatility 25 (1s)",
    "Volatility 50 (1s)",
    "Volatility 75 (1s)",
    "Volatility 100 (1s)"
  ];


  let botRunning = false;


  function createBotResultPanel() {

    let panel = $("#botResult");

    if (panel) return panel;

    panel = document.createElement("div");

    panel.id = "botResult";
    panel.className = "bot-result";

    panel.hidden = true;

    panel.innerHTML = `
      <div class="bot-result-head">
        <strong>🤖 AI BOT RESULT</strong>
        <button id="closeBotResult">×</button>
      </div>

      <div class="bot-status" id="botStatus">
        Analysis complete
      </div>

      <div class="bot-info">

        <div>
          <small>Market</small>
          <strong id="botMarket">—</strong>
        </div>

        <div>
          <small>Trade Type</small>
          <strong id="botTradeType">—</strong>
        </div>

        <div>
          <small>Signal</small>
          <strong id="botSignal">—</strong>
        </div>

        <div>
          <small>Digit</small>
          <strong id="botDigit">—</strong>
        </div>

        <div>
          <small>Confidence</small>
          <strong id="botConfidence">—</strong>
        </div>

      </div>

      <p id="botExplanation">
        The AI BOT provides simulated demo analysis only.
        You decide whether to trade.
      </p>
    `;

    const scanner = $("#scanner");

    scanner.parentNode.insertBefore(
      panel,
      scanner.nextSibling
    );

    $("#closeBotResult").onclick = () => {
      clearBotResult();
    };

    return panel;
  }


  function clearBotResult() {

    const panel = $("#botResult");

    if (!panel) return;

    panel.hidden = true;
  }


  function marketBasePrice(market) {

    const prices = {
      "Volatility 10 (1s)": 1000,
      "Volatility 25 (1s)": 2500,
      "Volatility 50 (1s)": 5000,
      "Volatility 75 (1s)": 7500,
      "Volatility 100 (1s)": 10000
    };

    return prices[market] || 1000;
  }


  function loadMarket(market) {

    currentMarket = market;

    const selector = $("#marketSelect");

    if (selector) {
      selector.value = market;
    }

    price = marketBasePrice(market);

    resetChart();

    toast(`${market} loaded into terminal.`);
  }


  function randomContract() {

    const contracts = [
      "MATCH",
      "DIFFER",
      "EVEN",
      "ODD",
      "OVER",
      "UNDER"
    ];

    return contracts[
      Math.floor(Math.random() * contracts.length)
    ];
  }


  function applyBotContract(type) {

    if (
      type === "MATCH" ||
      type === "DIFFER"
    ) {

      contractType = "match";

    } else if (
      type === "EVEN" ||
      type === "ODD"
    ) {

      contractType = "even";

    } else {

      contractType = "over";
    }

    contractTabs.forEach(tab => {

      tab.classList.remove("active");

      if (
        tab.dataset.contract === contractType
      ) {
        tab.classList.add("active");
      }
    });

    updateContractButtons();
  }


  async function runAIBot() {

    if (botRunning) return;

    botRunning = true;

    const button = $("#scanner");

    button.disabled = true;

    clearBotResult();

    toast("AI BOT scanning demo markets...");

    const panel = createBotResultPanel();

    panel.hidden = false;

    $("#botStatus").textContent =
      "Scanning available demo markets...";

    $("#botMarket").textContent = "Scanning...";
    $("#botTradeType").textContent = "—";
    $("#botSignal").textContent = "—";
    $("#botDigit").textContent = "—";
    $("#botConfidence").textContent = "—";

    await wait(700);

    for (const market of demoMarkets) {

      $("#botStatus").textContent =
        `Scanning ${market}...`;

      $("#botMarket").textContent = market;

      await wait(350);
    }

    /* Select market */

    const selectedMarket =
      demoMarkets[
        Math.floor(
          Math.random() * demoMarkets.length
        )
      ];

    loadMarket(selectedMarket);

    $("#botMarket").textContent =
      selectedMarket;

    $("#botStatus").textContent =
      "Market selected. Loading data...";

    await wait(700);

    /* Select contract */

    const selectedContract =
      randomContract();

    applyBotContract(selectedContract);

    $("#botTradeType").textContent =
      selectedContract;

    await wait(500);

    /* Select digit */

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

    $("#botDigit").textContent =
      suggestedDigit;

    $("#botSignal").textContent =
      selectedContract === "MATCH"
        ? `Match ${suggestedDigit}`
        : selectedContract;

    await wait(600);

    /* Simulated confidence */

    const confidence =
      Math.floor(
        Math.random() * 16
      ) + 80;

    $("#botConfidence").textContent =
      `${confidence}%`;

    $("#botStatus").textContent =
      "Analysis complete";

    $("#botExplanation").textContent =
      `The demo AI BOT selected ${selectedMarket}, ` +
      `identified ${selectedContract} as the simulated signal ` +
      `and selected digit ${suggestedDigit}. ` +
      `Confidence shown is simulated demo confidence, ` +
      `not a real probability of winning. ` +
      `No trade was placed automatically.`;

    toast("AI BOT analysis complete.");

    button.disabled = false;

    botRunning = false;
  }


  function wait(milliseconds) {

    return new Promise(resolve =>
      setTimeout(resolve, milliseconds)
    );
  }


  $("#scanner").onclick = runAIBot;


  /* =========================
     CHART
  ========================= */

  const chart = $("#priceChart");
  const ctx = chart.getContext("2d");

  let series = Array.from(
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

    /* Glow */

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


  function resetChart() {

    series = Array.from(
      { length: 100 },
      () =>
        price +
        (Math.random() - 0.5) * 120
    );

    chartZoom = 1;

    drawChart();
  }


  window.addEventListener(
    "resize",
    resizeChart
  );

  resizeChart();


  /* =========================
     SIMULATED MARKET
  ========================= */

  chartTimer = setInterval(() => {

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

    loadMarket(market);
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
              • ${position.market}
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
                • digit ${trade.digit}
                • ${trade.market}
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
      IMPORTANT:
      Save the contract information NOW.
      Changing the terminal later will not
      change an already-open position.
    */

    const tradeContract =
      contractType;

    const tradeDigit =
      selectedDigit;

    const tradeMarket =
      currentMarket;

    const tradeStake =
      stake;

    const tradeMode =
      mode;


    balance -= tradeStake;

    localStorage.setItem(
      "tradezoraDemoBalance",
      balance
    );


    const position = {

      id: Date.now(),

      type,

      stake: tradeStake,

      digit: tradeDigit,

      contract: tradeContract,

      market: tradeMarket,

      mode: tradeMode
    };


    positions.push(position);

    renderBalance();
    renderLists();

    toast(
      `${type} demo position opened.`
    );


    const timer = setTimeout(() => {

      tradeTimers =
        tradeTimers.filter(
          item => item !== timer
        );

      const index =
        positions.findIndex(
          item =>
            item.id === position.id
        );

      if (index < 0) return;


      const finalDigit =
        Math.floor(
          Math.random() * 10
        );


      let win = false;


      if (tradeContract === "match") {

        win =
          (
            finalDigit === tradeDigit &&
            type === "MATCH"
          ) ||
          (
            finalDigit !== tradeDigit &&
            type === "DIFFER"
          );
      }


      else if (tradeContract === "even") {

        const even =
          finalDigit % 2 === 0;

        win =
          (
            even &&
            type === "EVEN"
          ) ||
          (
            !even &&
            type === "ODD"
          );
      }


      else if (tradeContract === "over") {

        const over =
          finalDigit > 5;

        win =
          (
            over &&
            type === "OVER"
          ) ||
          (
            !over &&
            type === "UNDER"
          );
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


    tradeTimers.push(timer);
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

    if (!positions.length) {
      toast("No open positions.");
      return;
    }

    positions = [];

    renderLists();

    toast("Open positions cleared from view.");
  };


  /* =========================
     INITIAL RENDER
  ========================= */

  renderBalance();

  renderLists();

  generateProbabilities();

  updateContractButtons();


  console.log(
    "TradeZora demo terminal initialized."
  );

});
