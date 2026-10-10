(function (root) {
  "use strict";
  const assets = Object.freeze({
    music: "assets/runtime/audio/terrace-loop.wav",
    land: "assets/runtime/audio/land.wav",
    greet: "assets/runtime/audio/greet.wav",
    heart: "assets/runtime/audio/heart.wav",
    finish: "assets/runtime/audio/finish.wav",
    bossFinish: "assets/runtime/audio/boss-finish.wav"
  });
  function create(options = {}) {
    const makeAudio = options.makeAudio || function (src) { return new root.Audio(src); };
    const onChange = options.onChange || function () {};
    const media = new Map();
    const failed = new Set();
    const cueAttempts = new Map();
    let enabled = false, notice = "", revision = 0;
    let phase = "READY", paused = false, hidden = false;
    let playing = false, pending = null;
    function snapshot() { return { enabled, notice }; }
    function notify() { onChange(snapshot()); }
    function allowed() { return enabled && !paused && !hidden && phase !== "ROUND_COMPLETE"; }
    function silence(item, rewind) {
      try { item.pause(); if (rewind) item.currentTime = 0; } catch (_) { /* Optional media cannot stop play. */ }
    }
    function stop() {
      revision++;
      playing = false; pending = null;
      for (const [key, item] of media) silence(item, key !== "music");
    }
    function get(key) {
      if (!media.has(key)) {
        const item = makeAudio(assets[key]);
        if (!item || typeof item.play !== "function" || typeof item.pause !== "function") throw Error("Audio unavailable");
        item.preload = "none";
        item.loop = key === "music";
        item.volume = key === "music" ? 0.18 : 0.32;
        media.set(key, item);
      }
      return media.get(key);
    }
    function failMusic(token) {
      if (token !== revision || !allowed()) return;
      enabled = false;
      notice = "Sound couldn’t start. Try Sound on again.";
      stop(); notify();
    }
    function startMusic() {
      if (!allowed() || playing || pending) return;
      const token = revision;
      let item;
      try {
        item = get("music");
        const attempt = Promise.resolve(item.play());
        pending = attempt;
        attempt.then(function () {
          if (pending === attempt) pending = null;
          if (!allowed()) silence(item, false);
          else if (token === revision) playing = true;
        }, function () {
          if (pending === attempt) pending = null;
          failMusic(token);
        });
      } catch (_) { failMusic(token); }
    }
    function toggle() {
      if (enabled) { enabled = false; notice = ""; stop(); notify(); }
      else {
        revision++;
        // A failed native element keeps its error until load() resets it. Reload only
        // on this explicit retry; healthy elements and background sync stay quiet.
        for (const item of media.values()) {
          try { if (item.error && typeof item.load === "function") item.load(); } catch (_) { /* play() reports optional failures. */ }
        }
        enabled = true; notice = ""; failed.clear(); notify(); startMusic();
      }
      return snapshot();
    }
    function sync(state) {
      const wasAllowed = allowed();
      phase = state.phase;
      paused = Boolean(state.paused);
      hidden = Boolean(state.hidden);
      if (!allowed()) { if (wasAllowed || playing || pending) stop(); }
      else startMusic();
    }
    function effect(key) {
      if (!allowed() || key === "music" || !Object.hasOwn(assets, key) || failed.has(key)) return;
      const token = revision;
      const attempt = {};
      cueAttempts.set(key, attempt);
      let item;
      function failedCue() {
        if (token !== revision || cueAttempts.get(key) !== attempt || !allowed()) return;
        failed.add(key);
        if (item) silence(item, true);
        notice = "One sound could not load. You can keep playing.";
        notify();
      }
      try {
        item = get(key); item.currentTime = 0;
        Promise.resolve(item.play()).then(function () {
          if (!allowed()) silence(item, true);
        }, failedCue);
      } catch (_) { failedCue(); }
    }
    return Object.freeze({ toggle, sync, effect, snapshot });
  }
  const api = Object.freeze({ assets, create });
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TanjaAudio = api;
}(typeof globalThis === "object" ? globalThis : this));
