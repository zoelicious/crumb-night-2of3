// guard.js — Marmalade the cat: patrol, sleep, ears, suspicion and the vision cone.
// One job: what the GUARD does. It never draws and never moves the player.
import { PATROL } from './level.js';

export const CAT = { name: 'MARMALADE', coneLen: 430, coneHalf: 0.44, bodyR: 46 };
export const CONE_LEN = CAT.coneLen;

export function createCat() {
  return {
    name: CAT.name,
    x: PATROL[0].x,
    y: PATROL[0].y,
    angle: Math.PI,
    waypoint: 1,
    state: 'PATROL', // PATROL | FROZEN | CHASE | SLEEP
    suspicion: 0, // 0 calm .. 100 full alarm
    sleepTimer: 0,
    patrolTimer: 0,
    freezeTimer: 0,
    earUp: 0, // 0 relaxed .. 1 ears bolt upright (the warning before she wakes)
    earTwitch: 0,
    tailPhase: 0,
    chaseTime: 0,
    spotted: 0,
    prints: [], // fading paw prints: footsteps you can read
  };
}

export function pointInCone(cat, x, y) {
  const dx = x - cat.x;
  const dy = y - cat.y;
  const d = Math.hypot(dx, dy);
  if (d > CONE_LEN) return false;
  let diff = Math.atan2(dy, dx) - cat.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) < CAT.coneHalf;
}

export function detectionWord(cat) {
  if (cat.state === 'CHASE') return 'SPOTTED!';
  if (cat.suspicion >= 70) return 'SUSPICIOUS';
  if (cat.suspicion >= 35) return 'UNEASY';
  if (cat.state === 'SLEEP') return 'ASLEEP';
  if (cat.state === 'FROZEN') return 'SUSPICIOUS';
  return 'UNSEEN';
}

export function alarmStage(cat) {
  if (cat.state === 'CHASE' || cat.suspicion >= 85) return 'ALARM';
  if (cat.suspicion >= 55) return 'HUNTED';
  if (cat.suspicion >= 30) return 'UNEASY';
  return 'CALM';
}

// dt in seconds. player: the ant (for sight + chase). Returns events: 'caught' | null.
export function updateCat(cat, player, dt) {
  cat.tailPhase += dt * (cat.state === 'FROZEN' ? 7 : 2.2);
  cat.earTwitch += dt;
  // Ears rise before she wakes or strikes: the warning the player can read.
  const earTarget = cat.state === 'FROZEN' ? 1 : cat.state === 'SLEEP' ? 0.35 : cat.suspicion > 40 ? 0.7 : 0.15;
  cat.earUp += (earTarget - cat.earUp) * Math.min(1, dt * 4);

  if (cat.state === 'SLEEP') {
    cat.sleepTimer -= dt;
    if (cat.sleepTimer <= 0) {
      cat.state = 'PATROL';
      cat.patrolTimer = 0;
    }
    cat.suspicion = Math.max(0, cat.suspicion - 30 * dt);
    return null;
  }

  // Sight: a hidden ant is never seen; a visible ant inside the cone raises suspicion.
  const seen = !player.hidden && pointInCone(cat, player.x, player.y);
  const heard = player.noise > 55 && Math.hypot(player.x - cat.x, player.y - cat.y) < 260;
  if (seen) cat.suspicion += 46 * dt;
  else if (heard) cat.suspicion += 18 * dt;
  else cat.suspicion -= 22 * dt;
  cat.suspicion = Math.max(0, Math.min(100, cat.suspicion));

  if (cat.state === 'FROZEN') {
    cat.freezeTimer -= dt;
    if (cat.freezeTimer <= 0) {
      cat.state = cat.suspicion >= 70 ? 'CHASE' : 'PATROL';
      cat.chaseTime = 0;
    }
    return null;
  }
  if (cat.state === 'CHASE') {
    cat.chaseTime += dt;
    const dx = player.x - cat.x;
    const dy = player.y - cat.y;
    const d = Math.hypot(dx, dy) || 1;
    cat.angle = Math.atan2(dy, dx);
    cat.x += (dx / d) * 205 * dt;
    cat.y += (dy / d) * 205 * dt;
    leavePrint(cat);
    if (d < 52) {
      cat.spotted += 1;
      cat.suspicion = 45;
      cat.state = 'PATROL';
      return 'caught';
    }
    if (cat.chaseTime > 3.5 || (!seen && cat.chaseTime > 1.2)) {
      cat.state = 'PATROL';
      cat.suspicion = Math.max(cat.suspicion, 30);
    }
    return null;
  }

  // PATROL: walk the loop; a rising suspicion freezes her first ("?").
  if (cat.suspicion >= 70) {
    cat.state = 'FROZEN';
    cat.freezeTimer = 1.4;
    return null;
  }
  const target = PATROL[cat.waypoint];
  const dx = target.x - cat.x;
  const dy = target.y - cat.y;
  const d = Math.hypot(dx, dy);
  if (d < 12) {
    cat.waypoint = (cat.waypoint + 1) % PATROL.length;
  } else {
    cat.angle = Math.atan2(dy, dx);
    cat.x += (dx / d) * 72 * dt;
    cat.y += (dy / d) * 72 * dt;
    leavePrint(cat);
  }
  cat.patrolTimer += dt;
  // After a long patrol she curls up and sleeps — the window to steal.
  if (cat.patrolTimer > 24) {
    cat.state = 'SLEEP';
    cat.sleepTimer = 9;
  }
  return null;
}

let printClock = 0;
function leavePrint(cat) {
  printClock += 1;
  if (printClock % 14 !== 0) return;
  cat.prints.push({ x: cat.x, y: cat.y, a: 0.5 });
  if (cat.prints.length > 26) cat.prints.shift();
}

export function fadePrints(cat, dt) {
  for (const p of cat.prints) p.a -= dt * 0.08;
  cat.prints = cat.prints.filter((p) => p.a > 0.02);
}
