// player.js — the ant: movement, noise, picking up crumbs, delivering them.
// One job: what the PLAYER does. It never draws and never moves the cat.
import { HOLE, START, collideCircle, isSafeZone } from './level.js';

export const ANT_R = 11;

export function createPlayer() {
  return {
    x: START.x,
    y: START.y,
    angle: 0,
    carrying: false,
    delivered: 0,
    speed: 0,
    running: false,
    noise: 0, // 0 quiet .. 100 loud
    hidden: false,
    moving: false,
  };
}

// keys: {up,down,left,right,run}. dt in seconds. crumbs: mutable crumb list.
export function updatePlayer(p, keys, dt, crumbs) {
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  p.moving = dx !== 0 || dy !== 0;
  p.running = !!keys.run && p.moving;
  const speed = p.running ? 265 : 170;
  if (p.moving) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    p.angle = Math.atan2(dy, dx);
    const pos = collideCircle(p.x + dx * speed * dt, p.y + dy * speed * dt, ANT_R);
    p.x = pos.x;
    p.y = pos.y;
  }
  p.speed = p.moving ? speed : 0;
  // Noise: running is loud, walking is a whisper, standing still is silent.
  const target = !p.moving ? 0 : p.running ? 78 : 22;
  p.noise += (target - p.noise) * Math.min(1, dt * 6);
  p.hidden = isSafeZone(p.x, p.y);
  // Pick up a crumb by walking over it (only one at a time).
  if (!p.carrying) {
    for (const c of crumbs) {
      if (!c.taken && Math.hypot(c.x - p.x, c.y - p.y) < 34) {
        c.taken = true;
        p.carrying = true;
        break;
      }
    }
  }
  // Deliver a carried crumb into the wall hole.
  if (p.carrying && Math.hypot(HOLE.x - p.x, HOLE.y - p.y) < HOLE.r + 26) {
    p.carrying = false;
    p.delivered += 1;
  }
}

export function noiseWord(p) {
  if (p.noise > 55) return 'LOUD';
  if (p.noise > 30) return 'SOFT';
  return 'SILENT';
}

export function visibilityWord(p, inCone) {
  if (p.hidden) return 'HIDDEN';
  if (inCone) return 'EXPOSED';
  return 'IN SHADOW';
}
