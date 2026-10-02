/* =========================================================
   TRADEZORA SHARED DEMO TRADING ENGINE
   Continuous trading + x6 loss multiplier
   Demo only — no broker/API connection
========================================================= */

(function () {

  const KEY  = "tradezoraContinuousState";
  const POS  = "tradezoraDemoPositions";
  const HIST = "tradezoraDemoHistory";
  const BAL  = "tradezoraDemoBalance";

  let busy = false;

  const read = (key, fallback) => {
    try {
      return JSON.parse(
        localStorage.getItem(key) ?? JSON.stringify(fallback)
      );
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  function getState() {

    const state = read(KEY, null);

    if (state && typeof state === "object") {
      return state;
    }

    return {
      running: false
    };
  }

  function emit() {
    window.dispatchEvent(
      new CustomEvent("tradezora-state-changed")
    );
  }


  /* =========================================================
     SETTLE TRADE
  ========================================================= */

  function settlePosition(position, now) {

    const finalDigit =
      Math.floor(Math.random() * 10);

    const type =
      String(position.type || "").toUpperCase();

    const contract =
      String(position.contract || "").toLowerCase();

    const digit =
      Number(position.digit);

    let win = false;


    /* MATCH / DIFFER */

    if (contract === "match") {

      win =
        (finalDigit === digit && type === "MATCH") ||
        (finalDigit !== digit && type === "DIFFER");

    }


    /* EVEN / ODD */

    else if (contract === "even") {

      win =
        (finalDigit % 2 === 0 && type === "EVEN") ||
        (finalDigit % 2 !== 0 && type === "ODD");

    }


    /* OVER / UNDER */

    else if (contract === "over") {

      win =
        (finalDigit > 5 && type === "OVER") ||
        (finalDigit <= 5 && type === "UNDER");

    }


    const stake =
      Number(position.stake) || 0;

    const profit =
      win ? stake * 0.85 : 0;


    let balance =
      Number(
        localStorage.getItem(BAL) || 10000
      );


    /*
      The stake was already removed when
      the position was opened.

      On WIN, return the stake + profit.
    */

    if (win) {
      balance += stake + profit;
    }


    localStorage.setItem(
      BAL,
      String(balance)
    );


    /* Save history */

    const history =
      read(HIST, []);

    history.push({
      ...position,
      finalDigit,
      win,
      profit,
      settledAt: now
    });

    write(
      HIST,
      history.slice(-100)
    );


    /* =======================================================
       X6 MULTIPLIER SYSTEM

       Base = $10
       x6

       LOSS 1 -> $60
       LOSS 2 -> $360
       LOSS 3 -> $2,160
       LOSS 4 -> $12,960
       LOSS 5 -> $77,760
       LOSS 6 -> RESET TO $10

       ANY WIN -> RESET TO $10
    ======================================================= */

    const state =
      getState();


    if (
      position.continuous &&
      state.running
    ) {

      const baseStake =
        Number(
          state.baseStake ||
          state.stake ||
          10
        );


      const multiplier =
        Number(
          state.multiplier || 6
        );


      const maxLosses =
        Number(
          state.maxConsecutiveLosses || 6
        );


      let consecutiveLosses =
        Number(
          state.consecutiveLosses || 0
        );


      let nextStake =
        Number(
          state.stake || baseStake
        );


      /* -------------------------
         WIN
      ------------------------- */

      if (win) {

        consecutiveLosses = 0;

        nextStake =
          baseStake;

      }


      /* -------------------------
         LOSS
      ------------------------- */

      else {

        consecutiveLosses += 1;


        /*
          Sixth consecutive loss:
          reset to base stake.
        */

        if (
          consecutiveLosses >= maxLosses
        ) {

          consecutiveLosses = 0;

          nextStake =
            baseStake;

        }


        /*
          Otherwise multiply the
          ACTUAL losing stake by x6.
        */

        else {

          nextStake =
            stake * multiplier;

        }

      }


      write(
        KEY,
        {
          ...state,

          running: true,

          baseStake,

          multiplier,

          maxConsecutiveLosses:
            maxLosses,

          consecutiveLosses,

          stake:
            nextStake,

          nextStake,

          currentStake:
            nextStake
        }
      );

    }

  }


  /* =========================================================
     OPEN CONTINUOUS TRADE
  ========================================================= */

  function openContinuousTrade(state, now) {

    const stake =
      Number(state.stake);


    let balance =
      Number(
        localStorage.getItem(BAL) || 10000
      );


    /*
      Do not open a trade if the demo
      balance cannot cover the stake.
    */

    if (
      !Number.isFinite(stake) ||
      stake <= 0 ||
      stake > balance
    ) {

      write(
        KEY,
        {
          ...state,

          running: false,

          nextTradeAt: null,

          stoppedReason: "balance"
        }
      );

      return false;
    }


    /* Remove stake from balance */

    balance -= stake;

    localStorage.setItem(
      BAL,
      String(balance)
    );


    /* Create position */

    const positions =
      read(POS, []);


    positions.push({

      id:
        `ct-${now}-${Math.random()
          .toString(36)
          .slice(2)}`,

      type:
        state.type,

      stake,

      digit:
        Number(state.digit),

      contract:
        state.contract,

      mode:
        state.mode || "AUTO",

      market:
        state.market || null,

      openedAt:
        now,

      settleAt:
        now + 5000,

      continuous:
        true

    });


    write(
      POS,
      positions
    );


    /*
      Keep the same stake state.
      It will be changed after the
      trade settles.
    */

    write(
      KEY,
      {

        ...state,

        running: true,

        nextTradeAt:
          now + 6500

      }
    );


    return true;
  }


  /* =========================================================
     ENGINE TICK
  ========================================================= */

  function tick() {

    if (busy) {
      return;
    }

    busy = true;


    try {

      const now =
        Date.now();


      let positions =
        read(POS, []);


      const remaining = [];


      let changed = false;


      /* --------------------------------
         Settle finished positions
      -------------------------------- */

      for (
        const position of positions
      ) {

        if (
          position.settleAt &&
          Number(position.settleAt) <= now
        ) {

          settlePosition(
            position,
            now
          );

          changed = true;

        }

        else {

          remaining.push(position);

        }

      }


      if (changed) {

        write(
          POS,
          remaining
        );

      }


      /* --------------------------------
         Open next continuous trade
      -------------------------------- */

      let state =
        getState();


      if (
        state.running &&
        Number(
          state.nextTradeAt || 0
        ) <= now
      ) {

        if (
          openContinuousTrade(
            state,
            now
          )
        ) {

          changed = true;

        }


        state =
          getState();

      }


      if (changed) {
        emit();
      }

    }

    finally {

      busy = false;

    }

  }


  /* =========================================================
     PUBLIC API
  ========================================================= */

  const api = {

    getState,


    start(config) {

      const baseStake =
        Number(
          config.baseStake ||
          config.stake ||
          10
        );


      const state = {

        running: true,

        type:
          String(
            config.type ||
            "EVEN"
          ).toUpperCase(),

        contract:
          config.contract ||
          "even",

        digit:
          Number(
            config.digit ?? 0
          ),

        stake:
          baseStake,

        baseStake,

        multiplier:
          Number(
            config.multiplier || 6
          ),

        maxConsecutiveLosses:
          Number(
            config.maxConsecutiveLosses || 6
          ),

        consecutiveLosses: 0,

        nextStake:
          baseStake,

        currentStake:
          baseStake,

        mode:
          config.mode ||
          "AUTO",

        market:
          config.market ||
          null,

        nextTradeAt:
          Date.now()

      };


      write(
        KEY,
        state
      );


      tick();

      emit();


      return getState();

    },


    stop() {

      const state =
        getState();


      write(
        KEY,
        {

          ...state,

          running: false,

          nextTradeAt: null

        }
      );


      emit();

    },


    reset() {

      localStorage.removeItem(
        KEY
      );

      emit();

    },


    tick

  };


  /* Make engine available */

  window.TradeZoraContinuousEngine =
    api;


  /* Start engine */

  tick();


  /* Keep engine alive across pages */

  setInterval(
    tick,
    500
  );


})();
