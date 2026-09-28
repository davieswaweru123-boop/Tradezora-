/* =========================================================
   TRADEZORA — DEMO INTERACTIONS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     THEME BUTTON
  ======================================================= */

  const themeButton = document.querySelector(".theme-btn");

  if (themeButton) {
    themeButton.addEventListener("click", () => {

      document.body.classList.toggle("light-mode");

      themeButton.textContent =
        document.body.classList.contains("light-mode")
          ? "☾"
          : "☼";

    });
  }


  /* =======================================================
     DEMO MARKET PRICES
  ======================================================= */

  const markets = [
    {
      name: "BTC/USD",
      price: 43256.78,
      change: 2.34
    },
    {
      name: "XAU/USD",
      price: 2328.42,
      change: 0.91
    },
    {
      name: "EUR/USD",
      price: 1.0842,
      change: 0.12
    },
    {
      name: "GBP/USD",
      price: 1.2718,
      change: -0.08
    },
    {
      name: "SPX",
      price: 5234.18,
      change: 0.47
    }
  ];


  /* =======================================================
     MARKET PRICE SIMULATION
  ======================================================= */

  const priceElement =
    document.querySelector(".price-info strong");

  const changeElement =
    document.querySelector(".price-info span");


  function updateDemoPrice() {

    if (!priceElement || !changeElement) {
      return;
    }

    const market = markets[0];

    const movement =
      (Math.random() - 0.5) * 40;

    market.price += movement;

    market.change =
      market.change +
      (Math.random() - 0.5) * 0.05;


    priceElement.textContent =
      "$" +
      market.price.toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );


    const sign =
      market.change >= 0
        ? "+"
        : "";

    changeElement.textContent =
      sign +
      market.change.toFixed(2) +
      "%";


    changeElement.style.color =
      market.change >= 0
        ? "#16e58a"
        : "#ff5d6c";
  }


  setInterval(updateDemoPrice, 2500);


  /* =======================================================
     DEMO TRADE BUTTONS
  ======================================================= */

  const upButton =
    document.querySelector(".up-button");

  const downButton =
    document.querySelector(".down-button");


  function demoTrade(direction) {

    const originalText =
      direction === "UP"
        ? "↗ UP"
        : "↘ DOWN";

    const button =
      direction === "UP"
        ? upButton
        : downButton;


    if (!button) {
      return;
    }


    button.innerHTML =
      direction === "UP"
        ? "✓ UP <span>Selected</span>"
        : "✓ DOWN <span>Selected</span>";


    button.style.transform =
      "scale(0.97)";


    setTimeout(() => {

      button.innerHTML =
        originalText +
        " <span>Demo</span>";

      button.style.transform =
        "";

    }, 1200);

  }


  if (upButton) {

    upButton.addEventListener(
      "click",
      () => demoTrade("UP")
    );

  }


  if (downButton) {

    downButton.addEventListener(
      "click",
      () => demoTrade("DOWN")
    );

  }


  /* =======================================================
     SMOOTH SCROLLING
  ======================================================= */

  document
    .querySelectorAll('a[href^="#"]')
    .forEach(link => {

      link.addEventListener(
        "click",
        event => {

          const targetId =
            link.getAttribute("href");

          if (
            !targetId ||
            targetId === "#"
          ) {
            return;
          }


          const target =
            document.querySelector(targetId);


          if (target) {

            event.preventDefault();

            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }

        }
      );

    });


  /* =======================================================
     BUTTON DEMO HANDLING
  ======================================================= */

  document
    .querySelectorAll(
      ".primary-btn, .secondary-btn, .get-started-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          const href =
            button.getAttribute("href");


          if (
            !href ||
            href === "#"
          ) {

            event.preventDefault();

            const hero =
              document.querySelector("#markets");


            if (hero) {

              hero.scrollIntoView({
                behavior: "smooth"
              });

            }

          }

        }
      );

    });


  /* =======================================================
     CONSOLE MESSAGE
  ======================================================= */

  console.log(
    "TradeZora demo platform initialized."
  );

});
