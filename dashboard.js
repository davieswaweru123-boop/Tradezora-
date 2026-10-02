function startOrStopContinuous(type, button) {

  const state =
    currentContinuousState();


  /* Stop currently running stream */

  if (
    state.running &&
    String(state.type).toUpperCase() === type
  ) {

    window.TradeZoraContinuousEngine.stop();

    syncContinuousButtons();

    setTimeout(
      syncContinuousButtons,
      0
    );

    setTimeout(
      syncContinuousButtons,
      100
    );

    toast(
      "Continuous trading stopped."
    );

    return;
  }


  /* Stop another running stream */

  if (state.running) {

    window.TradeZoraContinuousEngine.stop();

    syncContinuousButtons();

  }


  const streamStake =
    Number(stake);


  if (
    streamStake <= 0 ||
    streamStake >
      Number(
        localStorage.getItem(
          "tradezoraDemoBalance"
        ) || balance
      )
  ) {

    toast(
      "Not enough demo balance for continuous trading."
    );

    syncContinuousButtons();

    return;

  }


  /*
    Start a completely fresh x6 sequence.
  */

  const multiplierState =
    resetMultiplierSequence(
      streamStake
    );


  window.TradeZoraContinuousEngine.start({

    type,

    contract:
      contractType,

    digit:
      selectedDigit,

    stake:
      multiplierState.currentStake,

    baseStake:
      multiplierState.baseStake,

    multiplier:
      6,

    maxConsecutiveLosses:
      6,

    consecutiveLosses:
      0,

    nextStake:
      multiplierState.currentStake,

    mode

  });


  toast(
    `Continuous ${buttonContractLabel(type)} trading started.`
  );


  syncContinuousButtons();

}
