(function (root) {
  "use strict";
  const config = Object.freeze({
    width: 640, height: 360,
    descentMin: 4, descentMax: 6,
    staminaMin: 6, staminaMax: 12,
    finishSeconds: 1.5, breatherSeconds: 2, reward: 100,
    roundLength: 10, bossEvery: 5,
    bossStaminaMin: 16, bossStaminaMax: 22, bossReward: 200,
    visitorTypes: Object.freeze(["regular", "muscle", "adventurer"]),
    landedTarget: Object.freeze({ x: 329, y: 210, width: 104, height: 130 }),
    encounterTarget: Object.freeze({ x: 225, y: 245, width: 210, height: 95 })
  });
  if (typeof module !== "undefined" && module.exports) module.exports = config;
  else root.TanjaConfig = config;
}(typeof globalThis !== "undefined" ? globalThis : this));
