// ---- CONFIG ----

// Your requested absolute path, as a file:// URL (spaces encoded)
const SPRITE_SHEET_URL = "./monsters/flying-eye/Attack3.png";

// Sprite sheet layout: 6 frames across, 1 row.
const FRAMES = 6;

// From your image: 900x150 total => 150x150 per frame
const FRAME_W = 150;
const FRAME_H = 150;

// ---- CSS Sprite Controls ----
const cssSprite = document.getElementById("css-sprite");
const cssSpeed = document.getElementById("cssSpeed");
const cssSpeedLabel = document.getElementById("cssSpeedLabel");
const toggleCssBtn = document.getElementById("toggleCss");

let cssRunning = true;

function setCssDuration(seconds) {
  cssSprite.style.setProperty("--duration", `${seconds}s`);
  cssSpeedLabel.textContent = `${Number(seconds).toFixed(2)}s`;
}

cssSpeed.addEventListener("input", () => setCssDuration(cssSpeed.value));
toggleCssBtn.addEventListener("click", () => {
  cssRunning = !cssRunning;
  cssSprite.style.animationPlayState = cssRunning ? "running" : "paused";
  toggleCssBtn.textContent = cssRunning ? "Pause" : "Play";
});

// initialize
setCssDuration(cssSpeed.value);

// ---- Canvas Sprite Animation ----
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const fpsSlider = document.getElementById("fps");
const fpsLabel = document.getElementById("fpsLabel");
const toggleCanvasBtn = document.getElementById("toggleCanvas");
const statusEl = document.getElementById("status");

let canvasRunning = true;
let fps = Number(fpsSlider.value);
let frame = 0;
let lastTime = 0;

const sheet = new Image();
sheet.src = SPRITE_SHEET_URL;

fpsSlider.addEventListener("input", () => {
  fps = Number(fpsSlider.value);
  fpsLabel.textContent = String(fps);
});

toggleCanvasBtn.addEventListener("click", () => {
  canvasRunning = !canvasRunning;
  toggleCanvasBtn.textContent = canvasRunning ? "Pause" : "Play";
});

function drawFrame(frameIndex) {
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  ctx.drawImage(
    sheet,
    frameIndex * FRAME_W,
    0,
    FRAME_W,
    FRAME_H, // crop from sheet
    0,
    0,
    FRAME_W,
    FRAME_H // draw to canvas
  );
}

function loop(ts) {
  requestAnimationFrame(loop);

  if (!sheet.complete || sheet.naturalWidth === 0) return;
  if (!canvasRunning) return;

  const interval = 1000 / fps;
  if (ts - lastTime >= interval) {
    lastTime = ts;
    drawFrame(frame);
    frame = (frame + 1) % FRAMES;
  }
}

sheet.onload = () => {
  statusEl.textContent = `Loaded sprite sheet: ${sheet.naturalWidth}×${sheet.naturalHeight}`;
  // Optional sanity check:
  // If your sheet size differs, you can compute FRAME_W dynamically like:
  // const dynamicFrameW = sheet.naturalWidth / FRAMES;
  drawFrame(0);
  requestAnimationFrame(loop);
};

sheet.onerror = () => {
  statusEl.textContent =
    "Could not load sprite sheet. This is likely because the page is served by Live Server (http://...) and the image is file:///... (blocked by the browser). See the fix below.";
};

/*
-----------------------------------
IF THE SPRITE DOESN'T LOAD (FIX)
-----------------------------------

Recommended: use a RELATIVE path that Live Server can actually serve.

1) Put this HTML/CSS/JS in your project folder (or anywhere Live Server serves).
2) Make sure the PNG is inside the served folder tree.
3) Replace SPRITE_SHEET_URL and --sheet-url with a relative path like:

   "assets/monsters/flying-eye/Attack3.png"

and in style.css:

   --sheet-url: url("assets/monsters/flying-eye/Attack3.png");

That will work reliably in all browsers.
*/
