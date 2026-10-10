(function (root, factory) {
  "use strict";

  if (typeof module !== "undefined" && module.exports) module.exports = factory(require("./config.js"));
  else root.TanjaGame = factory(root.TanjaConfig);
}(typeof globalThis !== "undefined" ? globalThis : this, function (defaults) {
  "use strict";

  const names = Object.freeze({ regular: "Regular", muscle: "Muscle", adventurer: "Adventurer", boss: "Big-hearted boss" });

  function create(options = {}) {
    const config = Object.assign({}, defaults, options.config);
    for (const key of ["landedTarget", "encounterTarget"]) config[key] = Object.assign({}, config[key]);
    if (!Array.isArray(config.visitorTypes) || !config.visitorTypes.length ||
        config.visitorTypes.some(kind => !["regular", "muscle", "adventurer"].includes(kind)) ||
        !Number.isSafeInteger(config.roundLength) || config.roundLength < 1 ||
        !Number.isSafeInteger(config.bossEvery) || config.bossEvery < 1 ||
        !Number.isInteger(config.bossStaminaMin) || !Number.isInteger(config.bossStaminaMax) ||
        config.bossStaminaMin < 1 || config.bossStaminaMax < config.bossStaminaMin ||
        !Number.isFinite(config.bossReward) || config.bossReward < 0) {
      throw new RangeError("Round, roster and boss configuration is invalid.");
    }
    config.visitorTypes = config.visitorTypes.slice();
    const random = options.random || Math.random;
    if (typeof random !== "function") throw new TypeError("Random must be a function.");
    if (![config.descentMin, config.descentMax, config.finishSeconds, config.breatherSeconds, config.reward].every(Number.isFinite) ||
        config.descentMin <= 0 || config.descentMax < config.descentMin ||
        config.finishSeconds <= 0 || config.breatherSeconds <= 0 || config.reward < 0 ||
        !Number.isInteger(config.staminaMin) || !Number.isInteger(config.staminaMax) ||
        config.staminaMin < 1 || config.staminaMax < config.staminaMin) {
      throw new RangeError("Encounter timing, stamina and reward configuration is invalid.");
    }
    for (const key of ["landedTarget", "encounterTarget"]) {
      const rect = config[key];
      if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
        throw new RangeError("Encounter target configuration is invalid.");
      }
    }

    const state = {
      phase: "READY", phaseTime: 0, time: 0, paused: false,
      visitor: null, score: 0, completed: 0, feedbackAge: 10,
      roundLength: config.roundLength, bosses: 0
    };
    let arrivals = 0;
    let normalArrivals = 0;

    function sample() {
      const value = random();
      return Number.isFinite(value) ? Math.max(0, Math.min(value, 1)) : 0;
    }
    function spawn() {
      arrivals += 1;
      const boss = arrivals % config.bossEvery === 0;
      const kind = boss ? "boss" : config.visitorTypes[normalArrivals++ % config.visitorTypes.length];
      const staminaMin = boss ? config.bossStaminaMin : config.staminaMin;
      const staminaMax = boss ? config.bossStaminaMax : config.staminaMax;
      const descentSeconds = config.descentMin + sample() * (config.descentMax - config.descentMin);
      const stamina = Math.min(staminaMax, staminaMin + Math.floor(sample() * (staminaMax - staminaMin + 1)));
      state.visitor = { id: arrivals, kind: kind, name: names[kind], boss: boss,
        reward: boss ? config.bossReward : config.reward,
        descentSeconds: descentSeconds, stamina: stamina, maxStamina: stamina };
      state.phase = "DESCENDING";
      state.phaseTime = 0;
      state.feedbackAge = 10;
    }
    function start() {
      if (state.phase !== "READY" || state.paused) return false;
      spawn();
      return true;
    }
    function step(seconds) {
      if (!Number.isFinite(seconds) || seconds <= 0 || state.paused || state.phase === "READY" || state.phase === "ROUND_COMPLETE") return;
      state.time += seconds;
      state.feedbackAge = Math.min(10, state.feedbackAge + seconds);
      let remaining = seconds;
      while (remaining > 0) {
        let duration;
        if (state.phase === "DESCENDING") duration = state.visitor.descentSeconds;
        else if (state.phase === "COMPLETED") duration = config.finishSeconds;
        else if (state.phase === "BREATHER") duration = config.breatherSeconds;
        else return;
        const untilBoundary = Math.max(0, duration - state.phaseTime);
        if (remaining < untilBoundary - 1e-9) {
          state.phaseTime += remaining;
          return;
        }
        remaining = Math.max(0, remaining - untilBoundary);
        state.phaseTime = 0;
        if (state.phase === "DESCENDING") {
          state.phase = "LANDED";
          return;
        }
        if (state.phase === "COMPLETED") {
          state.visitor = null;
          if (state.completed === config.roundLength) {
            state.phase = "ROUND_COMPLETE";
            return;
          }
          state.phase = "BREATHER";
        } else spawn();
      }
    }
    function click(x, y) {
      if (state.paused || !Number.isFinite(x) || !Number.isFinite(y) ||
          (state.phase !== "LANDED" && state.phase !== "ENCOUNTER")) return false;
      const target = state.phase === "LANDED" ? config.landedTarget : config.encounterTarget;
      if (x < target.x || y < target.y || x > target.x + target.width || y > target.y + target.height) return false;
      state.phase = "ENCOUNTER";
      state.visitor.stamina -= 1;
      state.feedbackAge = 0;
      if (state.visitor.stamina === 0) {
        state.phase = "COMPLETED";
        state.phaseTime = 0;
        state.score += state.visitor.reward;
        state.completed += 1;
        if (state.visitor.boss) state.bosses += 1;
      }
      return true;
    }
    function snapshot() {
      return Object.assign({}, state, { visitor: state.visitor ? Object.assign({}, state.visitor) : null });
    }

    function reset() {
      arrivals = 0; normalArrivals = 0;
      Object.assign(state, { phase: "READY", phaseTime: 0, time: 0, paused: false,
        visitor: null, score: 0, completed: 0, bosses: 0, feedbackAge: 10 });
    }
    function restart() { reset(); return start(); }
    function returnToTitle() { reset(); return true; }

    return Object.freeze({
      start: start, step: step, click: click,
      restart: restart, returnToTitle: returnToTitle,
      setPaused: function (paused) {
        if (state.phase !== "READY" && state.phase !== "ROUND_COMPLETE") state.paused = Boolean(paused);
      },
      snapshot: snapshot
    });
  }
  return Object.freeze({ create: create });
}));
