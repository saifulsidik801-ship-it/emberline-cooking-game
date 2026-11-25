// EMBERLINE boot: canvas, fixed-timestep loop, screens, and ?shot= staging.
// Plain play runs at ?shot absent; ?shot=start|play|serve|end renders a staged scene
// (used for the entry's screenshots) and freezes it there.
import { W, H, STEP } from './config.js';
import { World, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { drawWorld } from './render.js';
import { Input } from './input.js';
import { ensureAudio, setSizzle } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? 7) || 7;

const world = new World(seed);
const input = new Input(canvas);
input.onAnyGesture = () => ensureAudio();
input.onInteract = () => {
  if (world.screen === SCREEN_PLAY && !world.paused) world.interact();
};
input.onStart = () => {
  if (world.screen === SCREEN_TITLE) world.startShift();
};
input.onRestart = () => {
  if (world.screen === 'over') world.startShift();
};
input.onPause = () => {
  if (world.screen === SCREEN_PLAY) {
    world.paused = !world.paused;
    if (world.paused) setSizzle(false);
  }
};
input.onPointer = (x, y) => {
  if (world.screen === SCREEN_TITLE) {
    world.startShift();
    return;
  }
  if (world.screen !== SCREEN_PLAY || world.paused) return;
  const station = world.stationAtPoint(x, y);
  if (station) {
    const near = world.nearestStation();
    if (near === station || (near && near.type === station.type && near.slot === station.slot)) {
      world.useStation(station);
    } else {
      world.chef.target = world.approachPoint(station.rect);
      world.chef.pending = station;
    }
    return;
  }
  world.chef.target = { x: Math.max(40, Math.min(W - 40, x)), y: Math.max(110, Math.min(H - 30, y)) };
  world.chef.pending = null;
};

let staged = null;
if (shotName) {
  staged = stageShot(shotName, world);
  // Let flames, steam and timers settle for a few frames of real simulation.
  for (let i = 0; i < 30; i += 1) world.updateFx(STEP);
}

let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!staged) {
    acc += dt;
    while (acc >= STEP) {
      world.step(STEP, input);
      acc -= STEP;
    }
  }
  drawWorld(ctx, world, now / 1000);
  requestAnimationFrame(frame);
}

// Title screen shows a live kitchen behind it.
if (!staged) stageShot('start', world);
world.screen = staged ? staged.screen : SCREEN_TITLE;
if (!staged) {
  world.screen = SCREEN_TITLE;
}
requestAnimationFrame(frame);
