// level.js — the night kitchen: fixed geometry, cover, loot, exit and patrol route.
// One job: describe WHERE things are. No drawing, no movement, no rules.
export const VIEW = { width: 1280, height: 720 };
export const HUD_H = 112; // room for title, alarm scale and a status strip
export const FLOOR = { x: 0, y: HUD_H, w: 1280, h: 720 - HUD_H };

// Wall hole (exit) high on the right wall, glowing green.
export const HOLE = { x: 1196, y: 168, r: 30 };
// Woven mat — the ant's best hiding spot. Standing on it means HIDDEN.
export const MAT = { x: 520, y: 478, w: 230, h: 92 };
// Cool moonlight pool spilling through the window (top-left).
export const MOON = { x: 250, y: 300, rx: 270, ry: 150 };
// Warm hanging lamp (top-centre-right): its cone is the danger light.
export const LAMP = { x: 880, y: 128 };

// Furniture the ant can hide behind or under. The table's shadow is safe.
export const FURNITURE = [
  { name: 'TABLE', x: 110, y: 330, w: 310, h: 150, blocks: true },
  { name: 'COUNTER', x: 60, y: 132, w: 430, h: 58, blocks: true },
  { name: 'STOVE', x: 700, y: 132, w: 190, h: 58, blocks: true },
  { name: 'FRIDGE', x: 1090, y: 420, w: 140, h: 210, blocks: true },
  { name: 'CHAIR', x: 470, y: 330, w: 72, h: 72, blocks: true },
  { name: 'CHAIR', x: 470, y: 432, w: 72, h: 72, blocks: true },
  { name: 'BIN', x: 980, y: 560, w: 66, h: 80, blocks: true },
];

// Three big glowing crumbs to steal, one per corner of the kitchen.
export const CRUMB_SPOTS = [
  { id: 0, x: 300, y: 580 },
  { id: 1, x: 770, y: 590 },
  { id: 2, x: 1030, y: 300 },
];

// Marmalade's patrol loop around the open floor.
export const PATROL = [
  { x: 920, y: 270 },
  { x: 920, y: 560 },
  { x: 430, y: 560 },
  { x: 430, y: 280 },
];

export const START = { x: 90, y: 650 };

export function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Dark safe zones: under the table and on the mat. Moonlight is pretty, not safe.
export function isSafeZone(x, y) {
  if (inRect(x, y, MAT)) return true;
  const table = FURNITURE[0];
  if (x > table.x + 10 && x < table.x + table.w - 10 && y > table.y + 14 && y < table.y + table.h - 6) return true;
  return false;
}

// Push a circle out of solid furniture; returns the corrected position.
export function collideCircle(x, y, r) {
  let nx = x;
  let ny = y;
  for (const f of FURNITURE) {
    if (!f.blocks) continue;
    const cx = Math.max(f.x, Math.min(nx, f.x + f.w));
    const cy = Math.max(f.y, Math.min(ny, f.y + f.h));
    const dx = nx - cx;
    const dy = ny - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r && d2 > 0.01) {
      const d = Math.sqrt(d2);
      nx = cx + (dx / d) * r;
      ny = cy + (dy / d) * r;
    } else if (d2 <= 0.01 && nx > f.x && nx < f.x + f.w && ny > f.y && ny < f.y + f.h) {
      ny = f.y - r;
    }
  }
  nx = Math.max(14, Math.min(VIEW.width - 14, nx));
  ny = Math.max(FLOOR.y + 14, Math.min(VIEW.height - 14, ny));
  return { x: nx, y: ny };
}
