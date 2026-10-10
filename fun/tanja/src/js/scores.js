(function (root) {
  "use strict";
  const key = "tanja.bestScore.v1";
  function valid(value) { return Number.isSafeInteger(value) && value >= 0; }
  function parse(value) {
    if (typeof value !== "string" || !/^\d+$/.test(value)) return 0;
    const score = Number(value);
    return valid(score) ? score : 0;
  }
  function create(options = {}) {
    const getStorage = options.getStorage || function () { return root.localStorage; };
    let best = 0;
    let saved = false;
    function read() {
      const storage = getStorage();
      if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") throw Error("Storage unavailable");
      const stored = parse(storage.getItem(key));
      best = Math.max(best, stored);
      return { storage, stored };
    }
    function snapshot() { return { best, saved }; }
    try { read(); saved = true; } catch (_) { /* Keep this visit's score in memory. */ }
    function record(score) {
      if (!valid(score)) return snapshot();
      best = Math.max(best, score);
      try {
        const current = read();
        if (best > current.stored) current.storage.setItem(key, String(best));
        saved = true;
      } catch (_) { saved = false; }
      return snapshot();
    }
    return Object.freeze({ record, snapshot });
  }
  const api = Object.freeze({ create });
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TanjaScores = api;
}(typeof globalThis === "object" ? globalThis : this));
