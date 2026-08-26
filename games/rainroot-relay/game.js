(() => {
  "use strict";

  const N = 1, E = 2, S = 4, W = 8;
  const rounds = [
    { size: 3, path: [[0, 1], [1, 1], [1, 0], [2, 0], [2, 1]] },
    { size: 4, path: [[0, 2], [1, 2], [1, 3], [2, 3], [2, 2], [2, 1], [3, 1]] },
    { size: 5, path: [[0, 2], [1, 2], [1, 1], [2, 1], [2, 2], [2, 3], [3, 3], [3, 2], [3, 1], [4, 1]] }
  ];
  const board = document.querySelector("#board");
  const roundValue = document.querySelector("#round-value");
  const turnValue = document.querySelector("#turn-value");
  const bloomValue = document.querySelector("#bloom-value");
  const message = document.querySelector("#message");
  const flower = document.querySelector("#flower");
  const barrel = document.querySelector(".barrel");
  const flowButton = document.querySelector("#flow-button");
  const overlay = document.querySelector("#overlay");
  const overlayTitle = document.querySelector("#overlay-title");
  const overlayCopy = document.querySelector("#overlay-copy");
  const startButton = document.querySelector("#start-button");
  const helpButton = document.querySelector("#help-button");

  let roundIndex = 0;
  let tiles = [];
  let selected = 0;
  let rotations = 0;
  let playing = false;
  let animating = false;
  let timers = [];

  const directionBetween = (a, b) => {
    if (b[0] > a[0]) return E;
    if (b[0] < a[0]) return W;
    if (b[1] > a[1]) return S;
    return N;
  };

  const rotateMask = mask => ((mask << 1) & 15) | ((mask & 8) >> 3);

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function routeMasks(config) {
    const result = new Map();
    config.path.forEach((cell, i) => {
      const incoming = i === 0 ? W : directionBetween(cell, config.path[i - 1]);
      const outgoing = i === config.path.length - 1 ? E : directionBetween(cell, config.path[i + 1]);
      result.set(`${cell[0]},${cell[1]}`, incoming | outgoing);
    });
    return result;
  }

  function turnsToMatch(mask, correct) {
    for (let turns = 0; turns < 4; turns += 1) {
      if (mask === correct) return turns;
      mask = rotateMask(mask);
    }
    return 0;
  }

  function buildRound(index) {
    clearTimers();
    roundIndex = index;
    selected = 0;
    playing = true;
    animating = false;
    flower.classList.remove("bloomed");
    barrel.classList.remove("flowing");
    flowButton.disabled = false;

    const config = rounds[index];
    const correctByCell = routeMasks(config);
    const decoys = [N | E, N | S, N | E | S, N | E | S | W, E | S, E | W];
    tiles = [];
    let minimum = 0;

    for (let y = 0; y < config.size; y += 1) {
      for (let x = 0; x < config.size; x += 1) {
        const key = `${x},${y}`;
        const correct = correctByCell.get(key) || null;
        let mask = correct || decoys[Math.floor(Math.random() * decoys.length)];
        let spins = Math.floor(Math.random() * 4);
        if (correct && x === config.path[0][0] && y === config.path[0][1]) spins = 1;
        for (let i = 0; i < spins; i += 1) mask = rotateMask(mask);
        if (correct) minimum += turnsToMatch(mask, correct);
        tiles.push({ x, y, mask, correct, element: null });
      }
    }

    rotations = minimum + 5 + index;
    roundValue.textContent = `${index + 1} / ${rounds.length}`;
    bloomValue.textContent = String(index);
    message.textContent = "Rotate the roots. Connect barrel to bloom.";
    renderBoard();
    updateStatus();
  }

  function renderBoard() {
    const size = rounds[roundIndex].size;
    board.style.setProperty("--size", size);
    board.replaceChildren();
    tiles.forEach((tile, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile";
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `Root tile, row ${tile.y + 1}, column ${tile.x + 1}. Tap to rotate clockwise.`);
      button.tabIndex = -1;
      button.addEventListener("click", () => {
        selected = index;
        rotateSelected();
      });
      tile.element = button;
      drawTile(tile);
      board.append(button);
    });
    selectTile(0, false);
  }

  function drawTile(tile) {
    const arms = [[N, "n"], [E, "e"], [S, "s"], [W, "w"]];
    tile.element.replaceChildren();
    const center = document.createElement("span");
    center.className = "root-center";
    tile.element.append(center);
    arms.forEach(([bit, name]) => {
      if (tile.mask & bit) {
        const arm = document.createElement("span");
        arm.className = `arm ${name}`;
        tile.element.append(arm);
      }
    });
  }

  function selectTile(index, focus = true) {
    selected = index;
    tiles.forEach((tile, i) => tile.element.classList.toggle("selected", i === index));
    if (focus) tiles[index].element.focus({ preventScroll: true });
  }

  function updateStatus() {
    turnValue.textContent = String(rotations);
  }

  function rotateSelected() {
    if (!playing || animating || rotations <= 0) return;
    const tile = tiles[selected];
    tile.mask = rotateMask(tile.mask);
    rotations -= 1;
    drawTile(tile);
    selectTile(selected, false);
    updateStatus();
    message.textContent = rotations > 0 ? "Roots turned. Release water when the path is ready." : "No rotations left — the rain slips away.";
    if (rotations === 0) endGame(false, "The roots tangled before the water could flow.");
  }

  function isSolved() {
    return tiles.filter(tile => tile.correct !== null).every(tile => tile.mask === tile.correct);
  }

  function releaseWater() {
    if (!playing || animating) return;
    animating = true;
    flowButton.disabled = true;
    barrel.classList.add("flowing");
    const path = rounds[roundIndex].path;
    const solved = isSolved();
    let delay = 150;
    let stopped = false;

    path.forEach(([x, y], pathIndex) => {
      const tile = tiles.find(item => item.x === x && item.y === y);
      if (stopped) return;
      if (tile.mask !== tile.correct) {
        stopped = true;
        timers.push(setTimeout(() => tile.element.classList.add("leak"), delay));
        return;
      }
      timers.push(setTimeout(() => tile.element.classList.add("watered"), delay));
      delay += pathIndex === 0 ? 260 : 210;
    });

    timers.push(setTimeout(() => {
      barrel.classList.remove("flowing");
      if (solved) completeRound();
      else endGame(false, "A gap in the roots spilled the last precious rain.");
    }, delay + 280));
  }

  function completeRound() {
    flower.classList.add("bloomed");
    bloomValue.textContent = String(roundIndex + 1);
    message.textContent = "The water made it — a rooftop bloom!";
    if (roundIndex === rounds.length - 1) {
      timers.push(setTimeout(() => endGame(true), 850));
    } else {
      timers.push(setTimeout(() => buildRound(roundIndex + 1), 1050));
    }
  }

  function endGame(won, reason = "") {
    playing = false;
    animating = false;
    flowButton.disabled = true;
    overlayTitle.textContent = won ? "The whole rooftop is blooming!" : "The rain ran out";
    overlayCopy.textContent = won ? "Three gardens revived, just before the clouds sailed on." : reason;
    startButton.textContent = "Play again";
    overlay.classList.add("visible");
    startButton.focus();
  }

  function showHelp() {
    const wasPlaying = playing;
    overlayTitle.textContent = "How to relay the rain";
    overlayCopy.textContent = "Make one unbroken route from the barrel to the flower. Tap tiles to rotate, or select with arrow keys and press Space. Enter releases the water — but a leak ends the run.";
    startButton.textContent = wasPlaying ? "Keep playing" : "Start relay";
    startButton.dataset.resume = wasPlaying ? "true" : "false";
    overlay.classList.add("visible");
    startButton.focus();
  }

  startButton.addEventListener("click", () => {
    overlay.classList.remove("visible");
    if (startButton.dataset.resume === "true") {
      delete startButton.dataset.resume;
      tiles[selected]?.element.focus();
      return;
    }
    startButton.textContent = "Play again";
    buildRound(0);
    tiles[0].element.focus();
  });
  helpButton.addEventListener("click", showHelp);
  flowButton.addEventListener("click", releaseWater);

  document.addEventListener("keydown", event => {
    if (!playing || overlay.classList.contains("visible") || animating) return;
    const size = rounds[roundIndex].size;
    let x = selected % size;
    let y = Math.floor(selected / size);
    if (event.key === "ArrowLeft") x = Math.max(0, x - 1);
    else if (event.key === "ArrowRight") x = Math.min(size - 1, x + 1);
    else if (event.key === "ArrowUp") y = Math.max(0, y - 1);
    else if (event.key === "ArrowDown") y = Math.min(size - 1, y + 1);
    else if (event.code === "Space") {
      event.preventDefault();
      rotateSelected();
      return;
    } else if (event.key === "Enter") {
      event.preventDefault();
      releaseWater();
      return;
    } else return;
    event.preventDefault();
    selectTile(y * size + x);
  });
})();
