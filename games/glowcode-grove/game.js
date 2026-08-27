(() => {
  "use strict";

  const TOTAL_ROUNDS = 5;
  const MAX_HEARTS = 3;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timing = reducedMotion
    ? { lead: 250, short: 180, long: 280, gap: 130, feedback: 500 }
    : { lead: 650, short: 360, long: 680, gap: 260, feedback: 900 };

  const elements = {
    hud: document.querySelector("#hud"),
    roundReadout: document.querySelector("#round-readout"),
    progressPips: document.querySelector("#progress-pips"),
    hearts: document.querySelector("#hearts"),
    firefly: document.querySelector("#firefly"),
    lightRings: document.querySelector("#light-rings"),
    startScreen: document.querySelector("#start-screen"),
    playScreen: document.querySelector("#play-screen"),
    endScreen: document.querySelector("#end-screen"),
    status: document.querySelector("#status"),
    history: document.querySelector("#history"),
    shortButton: document.querySelector("#short-button"),
    longButton: document.querySelector("#long-button"),
    startButton: document.querySelector("#start-button"),
    replayButton: document.querySelector("#replay-button"),
    endingKicker: document.querySelector("#ending-kicker"),
    endingTitle: document.querySelector("#ending-title"),
    endingCopy: document.querySelector("#ending-copy")
  };

  let pattern = [];
  let round = 0;
  let hearts = MAX_HEARTS;
  let input = [];
  let phase = "start";
  let runToken = 0;

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  function buildPattern() {
    const result = [];
    while (result.length < 7) {
      let next = Math.random() < 0.5 ? "short" : "long";
      const lastThree = result.slice(-3);
      if (lastThree.length === 3 && lastThree.every((pulse) => pulse === next)) {
        next = next === "short" ? "long" : "short";
      }
      result.push(next);
    }
    return result;
  }

  function setScreen(screen) {
    elements.startScreen.hidden = screen !== "start";
    elements.playScreen.hidden = screen !== "play";
    elements.endScreen.hidden = screen !== "end";
    elements.hud.hidden = screen === "start";
  }

  function setInputEnabled(enabled) {
    elements.shortButton.disabled = !enabled;
    elements.longButton.disabled = !enabled;
  }

  function renderHud() {
    elements.roundReadout.textContent = `${Math.min(round + 1, TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`;
    elements.progressPips.replaceChildren();
    for (let index = 0; index < TOTAL_ROUNDS; index += 1) {
      const pip = document.createElement("span");
      if (index < round) pip.className = "complete";
      elements.progressPips.append(pip);
    }

    elements.hearts.replaceChildren();
    for (let index = 0; index < MAX_HEARTS; index += 1) {
      const heart = document.createElement("span");
      heart.textContent = "♥";
      if (index >= hearts) heart.className = "spent";
      elements.hearts.append(heart);
    }
    elements.hearts.setAttribute("aria-label", `${hearts} glow ${hearts === 1 ? "heart" : "hearts"} remaining`);
  }

  function renderHistory() {
    elements.history.replaceChildren();
    input.forEach((pulse) => {
      const mark = document.createElement("span");
      mark.className = `history-pulse ${pulse}`;
      mark.setAttribute("aria-label", pulse);
      elements.history.append(mark);
    });
    elements.history.setAttribute("aria-label", input.length ? `Your entered pulses: ${input.join(", ")}` : "No pulses entered yet");
  }

  async function flash(pulse, token) {
    if (token !== runToken) return;
    elements.firefly.classList.add(`pulse-${pulse}`);
    elements.lightRings.className = `light-rings active ${pulse === "long" ? "long" : ""}`;
    await wait(timing[pulse]);
    elements.firefly.classList.remove(`pulse-${pulse}`);
    elements.lightRings.className = "light-rings";
    await wait(timing.gap);
  }

  async function showMessage() {
    const token = ++runToken;
    phase = "showing";
    setInputEnabled(false);
    input = [];
    renderHistory();
    elements.status.textContent = `Listen: ${round + 3} pulses`;
    await wait(timing.lead);
    const message = pattern.slice(0, round + 3);
    for (const pulse of message) {
      if (token !== runToken) return;
      await flash(pulse, token);
    }
    if (token !== runToken) return;
    phase = "input";
    setInputEnabled(true);
    elements.status.textContent = "Your turn — echo the glowcode";
    elements.shortButton.focus({ preventScroll: true });
  }

  function beginRun() {
    runToken += 1;
    pattern = buildPattern();
    round = 0;
    hearts = MAX_HEARTS;
    input = [];
    phase = "showing";
    setScreen("play");
    renderHud();
    renderHistory();
    showMessage();
  }

  async function registerPulse(pulse) {
    if (phase !== "input") return;
    const expected = pattern[input.length];
    input.push(pulse);
    renderHistory();
    flash(pulse, runToken);

    if (pulse !== expected) {
      phase = "feedback";
      setInputEnabled(false);
      hearts -= 1;
      renderHud();
      elements.firefly.classList.add("error");
      elements.status.textContent = `That was ${pulse}; the grove expected ${expected}.`;
      await wait(timing.feedback);
      elements.firefly.classList.remove("error");
      if (hearts === 0) {
        finish(false);
      } else {
        elements.status.textContent = "The elder will show that message again…";
        await wait(timing.feedback / 2);
        showMessage();
      }
      return;
    }

    if (input.length === round + 3) {
      phase = "feedback";
      setInputEnabled(false);
      elements.status.textContent = "Message understood! The grove glows brighter.";
      await wait(timing.feedback);
      round += 1;
      if (round === TOTAL_ROUNDS) {
        finish(true);
      } else {
        renderHud();
        showMessage();
      }
    } else {
      elements.status.textContent = `${input.length} of ${round + 3} pulses echoed`;
    }
  }

  function finish(won) {
    runToken += 1;
    phase = "end";
    setInputEnabled(false);
    setScreen("end");
    if (won) {
      round = TOTAL_ROUNDS;
      renderHud();
      elements.endingKicker.textContent = "The grove remembers";
      elements.endingTitle.textContent = "Glowcode complete!";
      elements.endingCopy.textContent = "Every lantern in the grove answers your light.";
    } else {
      elements.endingKicker.textContent = "The moon slips behind the trees";
      elements.endingTitle.textContent = "The signal faded";
      elements.endingCopy.textContent = `You carried the glowcode to message ${round + 1}. Rest your wings and try a new pattern.`;
    }
    elements.replayButton.focus({ preventScroll: true });
  }

  elements.startButton.addEventListener("click", beginRun);
  elements.replayButton.addEventListener("click", beginRun);
  elements.shortButton.addEventListener("click", () => registerPulse("short"));
  elements.longButton.addEventListener("click", () => registerPulse("long"));

  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.code === "Enter") && (phase === "start" || phase === "end")) {
      event.preventDefault();
      beginRun();
      return;
    }
    if (phase !== "input" || event.repeat) return;
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      event.preventDefault();
      registerPulse("short");
    } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      event.preventDefault();
      registerPulse("long");
    }
  });

  renderHud();
  renderHistory();
})();
