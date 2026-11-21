// main.js — CRUMB: glue. Input, the game loop, win/lose, and the four staged
// screenshot scenes. The rules live in player.js / guard.js, the art in render.js.
import { CRUMB_SPOTS, HOLE, START } from './level.js';
import { createPlayer, updatePlayer } from './player.js';
import { createCat, fadePrints, updateCat } from './guard.js';
import { draw } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function freshState() {
  return {
    player: createPlayer(),
    cat: createCat(),
    crumbs: CRUMB_SPOTS.map((c) => ({ ...c, taken: false })),
    time: 0,
    won: false,
    caughtFlash: 0,
    over: false,
  };
}

let state = freshState();
let shotMode = false;

const keys = { up: false, down: false, left: false, right: false, run: false };

function readKeys(e) {
  const down = e.type === 'keydown';
  switch (e.key) {
    case 'w': case 'W': case 'ArrowUp': keys.up = down; break;
    case 's': case 'S': case 'ArrowDown': keys.down = down; break;
    case 'a': case 'A': case 'ArrowLeft': keys.left = down; break;
    case 'd': case 'D': case 'ArrowRight': keys.right = down; break;
    case 'Shift': keys.run = down; break;
    case 'r': case 'R': if (down) state = freshState(); break;
    default: return;
  }
  e.preventDefault();
}
window.addEventListener('keydown', readKeys);
window.addEventListener('keyup', readKeys);

// The four screenshot scenes: real game state, staged — never edited images.
// Each one is a moment a short playthrough really reaches.
function stageShot(name) {
  shotMode = true;
  state = freshState();
  const { player, cat, crumbs } = state;
  if (name === 'sleep') {
    state.time = 72; // 1:12 — mid-game, two crumbs already home.
    crumbs[0].taken = true;
    crumbs[1].taken = true;
    player.delivered = 2;
    player.x = 590; player.y = 520; // on the MAT: HIDDEN, safe for now.
    player.hidden = true;
    player.angle = -0.6;
    cat.x = 780; cat.y = 630;
    cat.state = 'SLEEP';
    cat.sleepTimer = 9;
    cat.suspicion = 0;
    cat.earTwitch = 0.5;
    cat.tailPhase = 2.0;
  } else if (name === 'alarm') {
    state.time = 58; // 0:58 — caught mid-chase, recovered under the mat.
    crumbs[0].taken = true;
    player.delivered = 1;
    player.x = 620; player.y = 520; // under the MAT: HIDDEN — HOLD STILL.
    player.hidden = true;
    player.angle = 0.4;
    cat.x = 648; cat.y = 428;
    cat.angle = Math.atan2(player.y - cat.y, player.x - cat.x);
    cat.state = 'CHASE';
    cat.suspicion = 88;
    cat.chaseTime = 1.1;
    cat.tailPhase = 4.0;
    cat.earUp = 1;
  } else if (name === 'win') {
    state.time = 94; // 1:34 — all three crumbs home.
    crumbs.forEach((c) => { c.taken = true; });
    player.delivered = 3;
    player.x = HOLE.x - 66; player.y = HOLE.y + 22;
    player.angle = 0;
    cat.x = 700; cat.y = 580;
    cat.state = 'SLEEP';
    cat.sleepTimer = 9;
    cat.suspicion = 0;
    state.won = true;
  } else {
    // cover (default): the near-miss. 0:47, one crumb home, Marmalade frozen
    // mid-step with her ears bolt upright, the ant at the cone's edge.
    state.time = 47;
    crumbs[0].taken = true;
    player.delivered = 1;
    player.x = 655; player.y = 452;
    player.angle = Math.PI;
    cat.x = 770; cat.y = 380;
    cat.angle = 2.30; // cone edge brushes the ant: a near miss, not a catch.
    cat.state = 'FROZEN';
    cat.suspicion = 72;
    cat.freezeTimer = 1.4;
    cat.earUp = 1;
    cat.tailPhase = 1.2;
    cat.prints = [
      { x: 830, y: 330, a: 0.4 },
      { x: 800, y: 355, a: 0.45 },
      { x: 782, y: 368, a: 0.5 },
    ];
  }
}

const params = new URLSearchParams(window.location.search);
if (params.has('shot')) stageShot(params.get('shot'));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotMode && !state.won) {
    state.time += dt;
    updatePlayer(state.player, keys, dt, state.crumbs);
    const event = updateCat(state.cat, state.player, dt);
    fadePrints(state.cat, dt);
    if (event === 'caught') {
      state.caughtFlash = 2.5;
      // The stolen crumb drops back onto the floor where it was taken.
      if (state.player.carrying) {
        const lost = [...state.crumbs].reverse().find((c) => c.taken);
        if (lost) lost.taken = false;
        state.player.carrying = false;
      }
      state.player.x = START.x;
      state.player.y = START.y;
    }
    if (state.player.delivered >= 3) state.won = true;
    if (state.caughtFlash > 0) state.caughtFlash -= dt;
  }
  draw(ctx, state);
  if (statusEl) {
    statusEl.textContent = state.won
      ? 'You made it: 3 crumbs home.'
      : 'Crumbs ' + state.player.delivered + ' of 3. Marmalade is ' + state.cat.state + '.';
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
