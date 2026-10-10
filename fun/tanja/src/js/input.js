(function (root) {
  "use strict";
  function point(clientX, clientY, rect, width = 640, height = 360) {
    if (!rect || ![clientX, clientY, rect.left, rect.top, rect.width, rect.height, width, height].every(Number.isFinite) ||
        rect.width <= 0 || rect.height <= 0 || width <= 0 || height <= 0) return null;
    const x = (clientX - rect.left) * width / rect.width;
    const y = (clientY - rect.top) * height / rect.height;
    if (x < 0 || y < 0 || x > width || y > height) return null;
    return { x: x, y: y };
  }
  const api = Object.freeze({ point: point });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TanjaInput = api;
}(typeof globalThis !== "undefined" ? globalThis : this));
