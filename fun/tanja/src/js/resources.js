(function (root) {
  "use strict";
  function load(assetPaths) {
    return Promise.all(Object.entries(assetPaths).map(function (entry) {
      return new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = function () { resolve([entry[0], image]); };
        image.onerror = function () {
          reject(new Error("Could not load " + entry[1] + ". Restore this local file, then choose Retry."));
        };
        image.src = entry[1];
      });
    })).then(function (entries) { return Object.fromEntries(entries); });
  }
  root.TanjaResources = Object.freeze({ load: load });
}(window));
