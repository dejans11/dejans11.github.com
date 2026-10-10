(function (root) {
  "use strict";

  function create(maxStepSeconds = 0.05) {
    if (!Number.isFinite(maxStepSeconds) || maxStepSeconds <= 0) {
      throw new RangeError("The maximum clock step must be a positive number.");
    }

    let lastTimestamp = null;
    let elapsed = 0;

    return {
      advance(timestampMs, paused = false) {
        if (!Number.isFinite(timestampMs) || timestampMs < 0) return elapsed;
        if (lastTimestamp === null) {
          lastTimestamp = timestampMs;
          return elapsed;
        }
        if (timestampMs < lastTimestamp) return elapsed;
        const delta = Math.min((timestampMs - lastTimestamp) / 1000, maxStepSeconds);
        lastTimestamp = timestampMs;
        if (!paused) elapsed += delta;
        return elapsed;
      },
      resetBaseline() {
        lastTimestamp = null;
      }
    };
  }

  const api = Object.freeze({ create });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TanjaClock = api;
}(typeof globalThis !== "undefined" ? globalThis : this));
