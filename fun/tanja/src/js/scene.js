(function (root) {
  "use strict";
  const assets = Object.freeze({
    environment: "assets/runtime/scene/environment.png",
    terrace: "assets/runtime/scene/terrace.png",
    protagonist: "assets/runtime/scene/protagonist.png",
    visitor: "assets/runtime/scene/visitor.png",
    parachute: "assets/runtime/encounter/parachute.png",
    pair: "assets/runtime/encounter/pair.png",
    muscle: "assets/runtime/round/muscle.png",
    adventurer: "assets/runtime/round/adventurer.png",
    boss: "assets/runtime/round/boss.png",
    pairMuscle: "assets/runtime/round/pair-muscle.png",
    pairAdventurer: "assets/runtime/round/pair-adventurer.png",
    pairBoss: "assets/runtime/round/pair-boss.png"
  });
  const heart = ["0110110","1111111","1111111","0111110","0011100","0001000"];
  const star = ["00100","00100","11111","01110","11011"];
  const standingKeys = Object.freeze({ regular: "visitor", muscle: "muscle", adventurer: "adventurer", boss: "boss" });
  const pairKeys = Object.freeze({ regular: "pair", muscle: "pairMuscle", adventurer: "pairAdventurer", boss: "pairBoss" });
  function pixels(context, pattern, x, y, size, color) {
    context.fillStyle = "#55283f";
    pattern.forEach(function (row, rowIndex) {
      for (let column = 0; column < row.length; column += 1) {
        if (row[column] === "1") context.fillRect(Math.round(x + column * size - 1), Math.round(y + rowIndex * size - 1), size + 2, size + 2);
      }
    });
    context.fillStyle = color;
    pattern.forEach(function (row, rowIndex) {
      for (let column = 0; column < row.length; column += 1) {
        if (row[column] === "1") context.fillRect(Math.round(x + column * size), Math.round(y + rowIndex * size), size, size);
      }
    });
  }
  function character(context, image, centerX, height, footY) {
    const width = Math.round(height * image.naturalWidth / image.naturalHeight);
    if (footY === 340) {
      context.fillStyle = "#423c4480";
      context.fillRect(Math.round(centerX - 17), 336, 34, 4);
    }
    context.drawImage(image, Math.round(centerX - width / 2), Math.round(footY - height), width, height);
  }
  function bubble(context, text, x, y, width) {
    context.fillStyle = "#ffafc9";
    context.fillRect(x - 2, y - 2, width + 4, 22);
    context.fillStyle = "#101b30";
    context.fillRect(x, y, width, 18);
    context.fillStyle = "#fff1f6";
    context.font = "bold 10px Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, x + width / 2, y + 9);
  }
  function draw(context, images, state, options = {}) {
    const reduced = Boolean(options.reducedMotion);
    const visitor = state.visitor;
    const standing = visitor ? images[standingKeys[visitor.kind]] : null;
    const pair = visitor ? images[pairKeys[visitor.kind]] : null;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, 640, 360);
    context.drawImage(images.environment, 0, 0, 640, 360);
    context.save();
    context.fillStyle = "#d1fff0";
    for (let i = 0; i < 18; i += 1) {
      context.globalAlpha = 0.12 + (Math.sin((reduced ? 0 : state.time) * 2.5 + i * 1.7) + 1) * 0.22;
      context.fillRect(195 + (i * 37) % 245, 231 + (i * 11) % 44, 3 + i % 3, 1);
    }
    context.restore();
    context.drawImage(images.terrace, 0, 0, 640, 360);

    if (state.phase === "ENCOUNTER" || state.phase === "COMPLETED") {
      const pulse = reduced ? 0 : Math.max(0, 1 - state.feedbackAge / 0.35) * 4;
      const bob = reduced ? 0 : Math.sin(state.time * 3) * 1;
      const width = 210;
      const height = Math.round(width * pair.naturalHeight / pair.naturalWidth);
      context.drawImage(pair, 225, Math.round(340 - height - pulse - bob), width, height);
      if (state.phase === "ENCOUNTER") {
        context.fillStyle = "#101b30";
        context.fillRect(225, 215, 210, 32);
        context.font = "bold 10px Consolas, monospace";
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillStyle = "#edf1f8";
        context.fillText((visitor.boss ? "BOSS " : "") + "STAMINA " + visitor.stamina + " / " + visitor.maxStamina, 330, 223);
        context.fillStyle = "#394b65"; context.fillRect(227, 233, 206, 10);
        context.fillStyle = "#ff6d9f";
        context.fillRect(227, 233, Math.round(206 * state.visitor.stamina / state.visitor.maxStamina), 10);
        if (state.feedbackAge < 0.75) {
          const rise = reduced ? 0 : state.feedbackAge * 24;
          [285, 322, 359].forEach(function (x, i) { pixels(context, heart, x, 194 - rise - i * 3, 2, "#ff8db5"); });
        }
      } else {
        bubble(context, (visitor.boss ? "BIG PHEW! +" : "PHEW! +") + visitor.reward, 255, 216, 150);
        const rise = reduced ? 0 : state.phaseTime * 14;
        [260, 303, 350, 395].forEach(function (x, i) {
          pixels(context, i % 2 ? star : heart, x, 190 - rise - i % 2 * 10, 2, i % 2 ? "#ffe298" : "#ff8db5");
        });
      }
    } else {
      character(context, images.protagonist, 272, 108, 340);
      if (state.phase === "DESCENDING") {
        const progress = Math.min(1, state.phaseTime / state.visitor.descentSeconds);
        const centerX = 381 + (reduced ? 0 : Math.sin(state.time * 2) * 8 * (1 - progress));
        const height = Math.round(60 + (visitor.boss ? 66 : 52) * progress);
        const footY = Math.round(130 + 210 * progress);
        context.drawImage(images.parachute, Math.round(centerX - 55), footY - height - 63, 110, 110 * images.parachute.naturalHeight / images.parachute.naturalWidth);
        character(context, standing, centerX, height, footY);
        if (visitor.boss) bubble(context, "BIG-HEARTED BOSS INCOMING", 235, 51, 172);
      } else if (state.phase === "LANDED") {
        character(context, standing, 381, visitor.boss ? 126 : 112, 340);
        bubble(context, visitor.boss ? "A BIG HELLO?" : "CLICK TO SAY HELLO", 313, 187, 138);
      } else if (state.phase === "BREATHER") bubble(context, "TAKE A BREATHER", 256, 202, 144);
      else if (state.phase === "READY") {
        bubble(context, "LOVE FALLS HERE", 80, 51, 140);
        bubble(context, "YOUR MOSTAR GETAWAY", 75, 77, 150);
        pixels(context, heart, 240, 61, 3, "#ff8db5");
      } else if (state.phase === "ROUND_COMPLETE") {
        bubble(context, "TEN HAPPY VISITORS", 242, 161, 156);
        [227, 299, 367, 423].forEach(function (x, i) { pixels(context, i % 2 ? star : heart, x, 121 - i % 2 * 8, 3, i % 2 ? "#ffe298" : "#ff8db5"); });
      }
    }

    context.fillStyle = "#101b30"; context.fillRect(0, 0, 640, 25);
    context.fillStyle = "#7596bf"; context.fillRect(0, 24, 640, 1);
    context.font = "bold 10px Consolas, monospace"; context.textBaseline = "middle";
    context.fillStyle = "#edf1f8"; context.textAlign = "left";
    context.fillText("SCORE " + String(state.score).padStart(6, "0"), 13, 13);
    context.textAlign = "center"; context.fillStyle = "#ffafc9";
    context.fillText("ROUND 1" + (visitor && visitor.boss ? " · BOSS" : ""), 320, 13);
    context.textAlign = "right"; context.fillStyle = "#edf1f8";
    context.fillText("VISITOR " + String(visitor ? visitor.id : state.completed).padStart(2, "0") + " / " + state.roundLength, 627, 13);
    if (visitor) bubble(context, visitor.name.toUpperCase(), 12, 31, visitor.boss ? 152 : 104);
    if (state.paused) bubble(context, "PAUSED", 276, 120, 88);
  }
  root.TanjaScene = Object.freeze({ assets: assets, draw: draw });
}(window));
