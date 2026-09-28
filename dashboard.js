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
