(function () {
  "use strict";
  const canvas = document.getElementById("scene");
  const status = document.getElementById("preview-status");
  const startButton = document.getElementById("start-encounter");
  const pauseButton = document.getElementById("motion-toggle");
  const heartButton = document.getElementById("heart-action");
  const retryButton = document.getElementById("retry-assets");
  const restartButton = document.getElementById("restart-round");
  const replayButton = document.getElementById("play-again");
  const titleButton = document.getElementById("return-title");
  const titlePanel = document.getElementById("title-panel");
  const resultsPanel = document.getElementById("results-panel");
  const roundControls = document.getElementById("round-controls");
  const soundButton = document.getElementById("sound-toggle");
  const soundStatus = document.getElementById("sound-status");
  if (!canvas || !status || !startButton || !pauseButton || !heartButton || !retryButton ||
      !restartButton || !replayButton || !titleButton || !titlePanel || !resultsPanel || !roundControls || !soundButton || !soundStatus) return;
  const context = canvas.getContext("2d");
  if (!context || !window.TanjaClock || !window.TanjaResources || !window.TanjaScene ||
      !window.TanjaGame || !window.TanjaInput || !window.TanjaConfig || !window.TanjaScores || !window.TanjaAudio) {
    status.dataset.state = "error";
    status.textContent = "The encounter could not start. Restore the local scripts or use a browser with Canvas support.";
    return;
  }
  const clock = TanjaClock.create();
  const game = TanjaGame.create();
  const scores = TanjaScores.create();
  const audio = TanjaAudio.create({ onChange: renderSound });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let images = null;
  let loading = false;
  let loopStarted = false;
  let lastElapsed = 0;
  let lastStatusKey = "";
  let lastPhase = "";
  let lastCompleted = 0;

  function renderSound() {
    const state = audio.snapshot();
    soundButton.textContent = state.enabled ? "Sound on" : "Sound off";
    soundButton.setAttribute("aria-pressed", String(state.enabled));
    soundStatus.hidden = !state.notice;
    soundStatus.textContent = state.notice;
  }
  function syncAudio(state) {
    audio.sync({ phase: state.phase, paused: state.paused, hidden: document.hidden });
  }

  function message(state) {
    const visitor = state.visitor;
    const label = visitor ? visitor.name + " · visitor " + visitor.id + " of " + state.roundLength : "";
    switch (state.phase) {
      case "READY": return "Ready for a ten-visitor round. Choose Start game. No rush, no missed-click penalty.";
      case "DESCENDING": return label + " incoming. " + (visitor.boss ? "A comic boss with extra stamina! " : "") + "Wait for him to land.";
      case "LANDED": return label + " has landed. Click him or choose Greet visitor. No rush.";
      case "ENCOUNTER": return "Send hearts! " + state.visitor.stamina + " stamina remaining.";
      case "COMPLETED": return "Phew! +" + visitor.reward + " points. " + (state.completed === state.roundLength ? "The final celebration, then your results." : "A little celebration, then a breather.");
      case "BREATHER": return "Take a breather. The next visitor arrives after two seconds.";
      case "ROUND_COMPLETE": return "Round complete! " + state.completed + " encounters, " + state.bosses + " comic bosses, " + state.score + " points. Play again or return to the title.";
      default: return "";
    }
  }
  function render() {
    if (!images) return;
    const state = game.snapshot();
    const title = state.phase === "READY";
    const results = state.phase === "ROUND_COMPLETE";
    const terminal = title || results;
    syncAudio(state);
    if (state.completed > lastCompleted) {
      scores.record(state.score);
      audio.effect(state.visitor.boss ? "bossFinish" : "finish");
    } else if (state.phase === "LANDED" && lastPhase !== state.phase) audio.effect("land");
    lastCompleted = state.completed;
    const best = scores.snapshot();
    document.getElementById("best-value").textContent = String(best.best);
    document.getElementById("best-status").hidden = best.saved;
    TanjaScene.draw(context, images, state, { reducedMotion: reducedMotion.matches });
    titlePanel.hidden = !title;
    resultsPanel.hidden = !results;
    roundControls.hidden = terminal;
    titleButton.hidden = title;
    document.getElementById("game-metrics").hidden = terminal;
    startButton.disabled = !title;
    replayButton.disabled = !results;
    titleButton.disabled = title;
    restartButton.disabled = terminal;
    pauseButton.disabled = terminal;
    pauseButton.textContent = state.paused ? "Resume" : "Pause";
    pauseButton.setAttribute("aria-pressed", String(state.paused));
    soundButton.disabled = false;
    heartButton.disabled = state.paused || (state.phase !== "LANDED" && state.phase !== "ENCOUNTER");
    heartButton.textContent = state.phase === "ENCOUNTER" || state.phase === "COMPLETED" ? "Send a heart" : "Greet visitor";
    document.getElementById("score-value").textContent = String(state.score);
    document.getElementById("visitor-number").textContent = state.visitor ? state.visitor.id + " / " + state.roundLength : "—";
    document.getElementById("visitor-kind").textContent = state.visitor ? state.visitor.name : "—";
    document.getElementById("stamina-value").textContent = state.visitor ? state.visitor.stamina + " / " + state.visitor.maxStamina : "—";
    document.getElementById("result-score").textContent = String(state.score);
    document.getElementById("result-count").textContent = state.completed + " / " + state.roundLength;
    document.getElementById("result-bosses").textContent = String(state.bosses);
    status.dataset.phase = state.phase;
    canvas.dataset.phase = state.phase;
    const key = [state.phase, state.paused, state.visitor && state.visitor.id, state.visitor && state.visitor.stamina].join("|");
    if (key !== lastStatusKey) {
      status.textContent = (state.paused ? "Paused. " : "") + message(state);
      canvas.setAttribute("aria-label", "Mostar encounter with fully clothed adult characters. " + (state.paused ? "Paused. " : "") + message(state));
      lastStatusKey = key;
    }
    if (results && lastPhase !== state.phase) document.getElementById("results-heading").focus();
    lastPhase = state.phase;
  }
  function frame(timestamp) {
    const elapsed = clock.advance(timestamp, !images || game.snapshot().paused || document.hidden);
    if (images && elapsed !== lastElapsed) {
      game.step(elapsed - lastElapsed);
      lastElapsed = elapsed;
      render();
    }
    window.requestAnimationFrame(frame);
  }
  function resetClock() {
    clock.resetBaseline();
    lastElapsed = clock.advance(window.performance.now(), true);
  }
  async function loadScene() {
    if (loading) return;
    loading = true;
    startButton.disabled = true; pauseButton.disabled = true; heartButton.disabled = true;
    restartButton.disabled = true; replayButton.disabled = true; titleButton.disabled = true;
    soundButton.disabled = true;
    retryButton.hidden = true;
    status.dataset.state = "loading";
    status.textContent = "Loading the local encounter assets…";
    try {
      images = await TanjaResources.load(TanjaScene.assets);
      resetClock();
      lastStatusKey = "";
      status.dataset.state = "ready";
      render();
      if (!loopStarted) {
        loopStarted = true;
        window.requestAnimationFrame(frame);
      }
    } catch (error) {
      images = null;
      status.dataset.state = "error";
      status.textContent = error.message;
      retryButton.hidden = false;
    } finally { loading = false; }
  }
  function applyHeart(x, y) {
    const before = game.snapshot();
    if (images && game.click(x, y)) {
      render();
      if (game.snapshot().phase !== "COMPLETED") audio.effect(before.phase === "LANDED" ? "greet" : "heart");
    }
  }
  startButton.addEventListener("click", function () {
    if (images && game.start()) { resetClock(); render(); pauseButton.focus(); }
  });
  function restartRound() {
    if (images && game.restart()) { resetClock(); render(); pauseButton.focus(); }
  }
  restartButton.addEventListener("click", restartRound);
  replayButton.addEventListener("click", restartRound);
  titleButton.addEventListener("click", function () {
    if (images && game.returnToTitle()) { resetClock(); render(); startButton.focus(); }
  });
  pauseButton.addEventListener("click", function () {
    game.setPaused(!game.snapshot().paused);
    resetClock(); render();
  });
  heartButton.addEventListener("click", function () {
    const target = game.snapshot().phase === "LANDED" ? TanjaConfig.landedTarget : TanjaConfig.encounterTarget;
    applyHeart(target.x + target.width / 2, target.y + target.height / 2);
  });
  canvas.addEventListener("pointerdown", function (event) {
    if (!event.isPrimary || event.button !== 0) return;
    const point = TanjaInput.point(event.clientX, event.clientY, canvas.getBoundingClientRect());
    if (point) applyHeart(point.x, point.y);
  });
  retryButton.addEventListener("click", loadScene);
  soundButton.addEventListener("click", function () { syncAudio(game.snapshot()); audio.toggle(); });
  document.addEventListener("visibilitychange", function () { resetClock(); syncAudio(game.snapshot()); });
  reducedMotion.addEventListener("change", render);
  loadScene();
}());
