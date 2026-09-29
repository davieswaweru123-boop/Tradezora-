/* TradeZora shared demo trading engine.
   Keeps continuous demo trading alive while navigating between Trade,
   Positions and History pages. Demo only; no broker/API connection. */
(function () {
  const KEY = 'tradezoraContinuousState';
  const POS = 'tradezoraDemoPositions';
  const HIST = 'tradezoraDemoHistory';
  const BAL = 'tradezoraDemoBalance';
  let busy = false;

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function getState() {
    const s = read(KEY, null);
    return s && typeof s === 'object' ? s : { running:false };
  }

  function emit() {
    window.dispatchEvent(new CustomEvent('tradezora-state-changed'));
  }

  function settlePosition(position, now) {
    const finalDigit = Math.floor(Math.random() * 10);
    const type = String(position.type || '').toUpperCase();
    const contract = position.contract;
    const digit = Number(position.digit);
    let win = false;

    if (contract === 'match') {
      win = (finalDigit === digit && type === 'MATCH') ||
            (finalDigit !== digit && type === 'DIFFER');
    } else if (contract === 'even') {
      win = (finalDigit % 2 === 0 && type === 'EVEN') ||
            (finalDigit % 2 !== 0 && type === 'ODD');
    } else if (contract === 'over') {
      win = (finalDigit > 5 && type === 'OVER') ||
            (finalDigit <= 5 && type === 'UNDER');
    }

    const stake = Number(position.stake) || 0;
    const profit = win ? stake * 0.85 : 0;
    let balance = Number(localStorage.getItem(BAL) || 10000);
    if (win) balance += stake + profit;

    localStorage.setItem(BAL, String(balance));

    const history = read(HIST, []);
    history.push({ ...position, finalDigit, win, profit, settledAt: now });
    write(HIST, history.slice(-100));
  }

  function openContinuousTrade(state, now) {
    const stake = Number(state.stake);
    let balance = Number(localStorage.getItem(BAL) || 10000);
    if (!Number.isFinite(stake) || stake <= 0 || stake > balance) {
      const stopped = { ...state, running:false, nextTradeAt:null, stoppedReason:'balance' };
      write(KEY, stopped);
      return false;
    }

    balance -= stake;
    localStorage.setItem(BAL, String(balance));

    const positions = read(POS, []);
    positions.push({
      id: `ct-${now}-${Math.random().toString(36).slice(2)}`,
      type: state.type,
      stake,
      digit: Number(state.digit),
      contract: state.contract,
      mode: state.mode || 'AUTO',
      openedAt: now,
      settleAt: now + 5000,
      continuous: true
    });
    write(POS, positions);

    write(KEY, { ...state, running:true, nextTradeAt:now + 6500 });
    return true;
  }

  function tick() {
    if (busy) return;
    busy = true;
    try {
      const now = Date.now();
      let positions = read(POS, []);
      const remaining = [];
      let changed = false;

      for (const position of positions) {
        if (position.settleAt && Number(position.settleAt) <= now) {
          settlePosition(position, now);
          changed = true;
        } else {
          remaining.push(position);
        }
      }
      if (changed) write(POS, remaining);

      let state = getState();
      if (state.running && Number(state.nextTradeAt || 0) <= now) {
        if (openContinuousTrade(state, now)) changed = true;
        state = getState();
      }

      if (changed) emit();
    } finally {
      busy = false;
    }
  }

  const api = {
    getState,
    start(config) {
      const state = {
        running:true,
        type:String(config.type || 'EVEN').toUpperCase(),
        contract:config.contract || 'even',
        digit:Number(config.digit ?? 0),
        stake:Number(config.stake || 1),
        mode:config.mode || 'AUTO',
        nextTradeAt:Date.now()
      };
      write(KEY, state);
      tick();
      emit();
      return getState();
    },
    stop() {
      const state = getState();
      write(KEY, { ...state, running:false, nextTradeAt:null });
      emit();
    },
    reset() {
      localStorage.removeItem(KEY);
      emit();
    },
    tick
  };

  window.TradeZoraContinuousEngine = api;
  tick();
  setInterval(tick, 500);
})();
