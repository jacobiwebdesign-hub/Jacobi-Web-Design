const body = document.body;
const root = document.documentElement;
const enterBtn = document.getElementById("enterBtn");
const whisper = document.getElementById("whisperAudio");

let hasStarted = false;
let pulseRAF = null;
let pulseStart = 0;
let scareTimer = null;
let jumpTimer = null;
let redirectTimer = null;

function cssTimeToMs(value) {
  const str = String(value).trim();
  if (str.endsWith("ms")) return parseFloat(str);
  if (str.endsWith("s")) return parseFloat(str) * 1000;
  return parseFloat(str) || 0;
}

function getCssVar(name, fallback = "0ms") {
  return getComputedStyle(root).getPropertyValue(name).trim() || fallback;
}

function bellCurve(t) {
  return Math.sin(Math.PI * t);
}

function stopPulsing() {
  if (pulseRAF) cancelAnimationFrame(pulseRAF);
  pulseRAF = null;
}

function startPulsing() {
  if (!whisper || pulseRAF) return;

  const idleFaceDurationMs = cssTimeToMs(getCssVar("--idle-face-duration", "14s"));
  const maxVol = 0.24;
  const minVol = 0.015;

  pulseStart = performance.now();

  const tick = (now) => {
    if (body.classList.contains("scare")) {
      stopPulsing();
      return;
    }

    const elapsed = now - pulseStart;
    const t = (elapsed % idleFaceDurationMs) / idleFaceDurationMs;
    whisper.volume = minVol + (maxVol - minVol) * bellCurve(t);
    pulseRAF = requestAnimationFrame(tick);
  };

  pulseRAF = requestAnimationFrame(tick);
}

function startWhisper() {
  if (!whisper) return;
  whisper.volume = 0;

  whisper.play()
    .then(() => startPulsing())
    .catch((error) => {
      console.log("Whisper play blocked:", error);
    });
}

function stopWhisper() {
  if (!whisper) return;
  stopPulsing();
  whisper.pause();
  whisper.currentTime = 0;
  whisper.volume = 0;
}

function startJumpScare() {
  if (body.classList.contains("scare")) return;

  body.classList.add("scare", "sequence-done");

  const flashMs = cssTimeToMs(getCssVar("--jump-flash-duration", "650ms"));
  const redirectBufferMs = cssTimeToMs(getCssVar("--redirect-buffer", "120ms"));
  const targetHref = enterBtn.getAttribute("href");

  redirectTimer = window.setTimeout(() => {
    window.location.href = targetHref;
  }, flashMs + redirectBufferMs);
}

function armSequence(event) {
  event.preventDefault();
  if (hasStarted) return;

  hasStarted = true;
  body.classList.add("armed");
  enterBtn.setAttribute("aria-disabled", "true");

  startWhisper();

  const textRevealMs = cssTimeToMs(getCssVar("--text-reveal-duration", "3s"));
  const holdMs = cssTimeToMs(getCssVar("--post-text-hold", "300ms"));
  const scareDelayAfterWhisperMs = cssTimeToMs(getCssVar("--scare-delay-after-whisper", "120ms"));

  scareTimer = window.setTimeout(() => {
    stopWhisper();

    jumpTimer = window.setTimeout(() => {
      startJumpScare();
    }, scareDelayAfterWhisperMs);

  }, textRevealMs + holdMs);
}

if (enterBtn) {
  enterBtn.addEventListener("click", armSequence);

  enterBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      armSequence(event);
    }
  });
}

window.addEventListener("beforeunload", () => {
  stopWhisper();

  if (scareTimer) clearTimeout(scareTimer);
  if (jumpTimer) clearTimeout(jumpTimer);
  if (redirectTimer) clearTimeout(redirectTimer);
});
