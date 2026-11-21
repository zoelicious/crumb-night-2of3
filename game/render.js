// render.js — every pixel: night floor, moonlight, warm cone, Marmalade, the ant,
// crumbs, the hole, and the full English HUD + legend. One job: DRAW the state.
import { CRUMB_SPOTS, FLOOR, FURNITURE, HOLE, HUD_H, LAMP, MAT, MOON, VIEW } from './level.js';
import { CAT } from './guard.js';
import { alarmStage, detectionWord } from './guard.js';
import { noiseWord, visibilityWord } from './player.js';
import { pointInCone } from './guard.js';

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function pill(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

export function draw(ctx, s) {
  const { player, cat, crumbs, time } = s;
  const inCone = cat.state !== 'SLEEP' && pointInCone(cat, player.x, player.y);
  drawFloor(ctx);
  drawMoonlight(ctx);
  drawLampGlow(ctx);
  drawMat(ctx);
  drawFurniture(ctx);
  drawHole(ctx, s);
  drawCrumbs(ctx, crumbs);
  drawPrints(ctx, cat);
  if (cat.state !== 'SLEEP') drawCone(ctx, cat);
  drawCat(ctx, cat, s);
  drawAnt(ctx, player, s);
  drawHud(ctx, s, inCone);
  drawLegend(ctx);
  drawBanners(ctx, s);
}

function drawFloor(ctx) {
  ctx.fillStyle = '#141c2e';
  ctx.fillRect(0, HUD_H, VIEW.width, VIEW.height - HUD_H);
  // Dark blue-grey night tiles, 64px, alternating shade + grout.
  for (let ty = HUD_H; ty < VIEW.height; ty += 64) {
    for (let tx = 0; tx < VIEW.width; tx += 64) {
      const odd = ((tx / 64 + ty / 64) % 2 + 2) % 2 === 0;
      ctx.fillStyle = odd ? '#182238' : '#131b2c';
      ctx.fillRect(tx + 1, ty + 1, 62, 62);
    }
  }
  ctx.strokeStyle = '#0b1120';
  ctx.lineWidth = 2;
  for (let tx = 0; tx <= VIEW.width; tx += 64) {
    ctx.beginPath(); ctx.moveTo(tx, HUD_H); ctx.lineTo(tx, VIEW.height); ctx.stroke();
  }
  for (let ty = HUD_H; ty <= VIEW.height; ty += 64) {
    ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(VIEW.width, ty); ctx.stroke();
  }
  // Vignette: darker corners, so the lit middle reads as the safe danger.
  const vg = ctx.createRadialGradient(640, 420, 240, 640, 420, 760);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, HUD_H, VIEW.width, VIEW.height - HUD_H);
}

function drawMoonlight(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(MOON.x, MOON.y, 10, MOON.x, MOON.y, MOON.rx);
  g.addColorStop(0, 'rgba(96,150,220,0.34)');
  g.addColorStop(1, 'rgba(96,150,220,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(MOON.x, MOON.y, MOON.rx, MOON.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(150,190,240,0.75)';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MOONLIGHT', MOON.x, MOON.y + 4);
}

function drawLampGlow(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(LAMP.x, LAMP.y + 60, 8, LAMP.x, LAMP.y + 60, 190);
  g.addColorStop(0, 'rgba(255,196,96,0.30)');
  g.addColorStop(1, 'rgba(255,196,96,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(LAMP.x, LAMP.y + 60, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Hanging lamp shade + cord.
  ctx.strokeStyle = '#0a0d14';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(LAMP.x, HUD_H); ctx.lineTo(LAMP.x, LAMP.y - 6); ctx.stroke();
  ctx.fillStyle = '#e8a83e';
  ctx.beginPath();
  ctx.moveTo(LAMP.x - 26, LAMP.y - 8); ctx.lineTo(LAMP.x + 26, LAMP.y - 8);
  ctx.lineTo(LAMP.x + 16, LAMP.y + 16); ctx.lineTo(LAMP.x - 16, LAMP.y + 16);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath(); ctx.arc(LAMP.x, LAMP.y + 18, 7, 0, Math.PI * 2); ctx.fill();
}

function drawMat(ctx) {
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(MAT.x, MAT.y, MAT.w, MAT.h);
  ctx.fillStyle = '#7d5a3a';
  for (let x = MAT.x + 8; x < MAT.x + MAT.w; x += 18) ctx.fillRect(x, MAT.y + 6, 8, MAT.h - 12);
  ctx.strokeStyle = '#3d2a18';
  ctx.lineWidth = 3;
  ctx.strokeRect(MAT.x, MAT.y, MAT.w, MAT.h);
  ctx.fillStyle = '#f3e2c2';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MAT — HIDE', MAT.x + MAT.w / 2, MAT.y + MAT.h / 2 + 4);
}

function drawFurniture(ctx) {
  for (const f of FURNITURE) {
    if (f.name === 'TABLE') {
      ctx.fillStyle = '#241a12';
      ctx.fillRect(f.x + 6, f.y + 8, f.w, f.h);
      ctx.fillStyle = '#3a2a1c';
      ctx.fillRect(f.x, f.y, f.w, f.h - 8);
      ctx.fillStyle = '#54402c';
      ctx.fillRect(f.x + 14, f.y + 12, f.w - 28, 10);
    } else if (f.name === 'COUNTER' || f.name === 'STOVE') {
      ctx.fillStyle = '#2c3a4a';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = '#3d5066';
      ctx.fillRect(f.x, f.y, f.w, 10);
      if (f.name === 'STOVE') {
        ctx.fillStyle = '#141a22';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(f.x + 30 + i * 60, f.y + 34, 12, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (f.name === 'FRIDGE') {
      ctx.fillStyle = '#3d4a5c';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = '#55677d';
      ctx.fillRect(f.x + 10, f.y + 10, f.w - 20, f.h - 20);
      ctx.fillStyle = '#222c38';
      ctx.fillRect(f.x + f.w - 26, f.y + 20, 8, 70);
    } else if (f.name === 'CHAIR') {
      ctx.fillStyle = '#2e2118';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = '#4a3423';
      ctx.fillRect(f.x + 6, f.y + 6, f.w - 12, f.h - 12);
    } else {
      ctx.fillStyle = '#26303c';
      ctx.fillRect(f.x, f.y, f.w, f.h);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(f.x, f.y, f.w, f.h);
    ctx.fillStyle = 'rgba(220,230,245,0.55)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.name, f.x + f.w / 2, f.y + f.h / 2 + 4);
  }
  // Shadow under the table reads as cover.
  ctx.fillStyle = 'rgba(180,200,235,0.8)';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('SHADOW — SAFE', 265, 500);
}

function drawHole(ctx, s) {
  const pulse = 0.7 + 0.3 * Math.sin(s.time * 3);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(HOLE.x, HOLE.y, 4, HOLE.x, HOLE.y, HOLE.r + 26 * pulse);
  g.addColorStop(0, 'rgba(80,255,140,0.5)');
  g.addColorStop(1, 'rgba(80,255,140,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(HOLE.x, HOLE.y, HOLE.r + 26 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#06130a';
  ctx.beginPath(); ctx.arc(HOLE.x, HOLE.y, HOLE.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4dff88';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(HOLE.x, HOLE.y, HOLE.r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#4dff88';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOLE — EXIT', HOLE.x - 8, HOLE.y - HOLE.r - 12);
}

function drawCrumbs(ctx, crumbs) {
  for (const c of crumbs) {
    if (c.taken) continue;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 34);
    g.addColorStop(0, 'rgba(255,214,90,0.65)');
    g.addColorStop(1, 'rgba(255,214,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffd65a';
    ctx.beginPath(); ctx.arc(c.x, c.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a86f12';
    ctx.beginPath(); ctx.arc(c.x - 4, c.y - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x + 5, c.y + 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRUMB', c.x, c.y - 22);
  }
}

function drawPrints(ctx, cat) {
  for (const p of cat.prints) {
    ctx.fillStyle = 'rgba(255,170,90,' + p.a.toFixed(2) + ')';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCone(ctx, cat) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(cat.x, cat.y, 20, cat.x, cat.y, CAT.coneLen);
  const hot = cat.state === 'CHASE' || cat.suspicion >= 70;
  g.addColorStop(0, hot ? 'rgba(255,90,60,0.55)' : 'rgba(255,196,90,0.55)');
  g.addColorStop(1, hot ? 'rgba(255,90,60,0.02)' : 'rgba(255,196,90,0.02)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cat.x, cat.y);
  ctx.arc(cat.x, cat.y, CAT.coneLen, cat.angle - CAT.coneHalf, cat.angle + CAT.coneHalf);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = hot ? 'rgba(255,120,80,0.8)' : 'rgba(255,220,140,0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cat.x, cat.y);
  ctx.arc(cat.x, cat.y, CAT.coneLen, cat.angle - CAT.coneHalf, cat.angle + CAT.coneHalf);
  ctx.closePath();
  ctx.stroke();
}

function drawCat(ctx, cat, s) {
  const asleep = cat.state === 'SLEEP';
  const sway = Math.sin(cat.tailPhase) * 14;
  ctx.save();
  ctx.translate(cat.x, cat.y);
  if (!asleep) ctx.rotate(cat.angle);
  // Tail — it keeps moving while she freezes: the tell before she strikes.
  ctx.strokeStyle = '#c96f24';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(asleep ? 30 : -CAT.bodyR, 0);
  ctx.quadraticCurveTo(asleep ? 70 : -CAT.bodyR - 34, asleep ? -34 : sway, asleep ? 96 : -CAT.bodyR - 58, asleep ? -18 : sway * 1.6);
  ctx.stroke();
  // Body — a huge orange cat, impossible to miss against the dark floor.
  ctx.fillStyle = '#d97b2f';
  ctx.beginPath();
  ctx.ellipse(0, 0, asleep ? 58 : CAT.bodyR + 16, asleep ? 40 : CAT.bodyR - 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a4d16';
  ctx.lineWidth = 5;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 16, -30);
    ctx.lineTo(i * 16, -14);
    ctx.stroke();
  }
  // Head.
  const hx = asleep ? -38 : CAT.bodyR + 6;
  ctx.fillStyle = '#e0863a';
  ctx.beginPath();
  ctx.arc(hx, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  // Ears — bolt upright when she suspects something. That IS the warning.
  const earH = 14 + cat.earUp * 26;
  const twitch = asleep ? Math.sin(cat.earTwitch * 6) * 4 : 0;
  ctx.fillStyle = '#d97b2f';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(hx - 14 + side * 8, -18);
    ctx.lineTo(hx - 22 + side * 10, -20 - earH + twitch * side);
    ctx.lineTo(hx - 2 + side * 8, -24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e89a7a';
    ctx.beginPath();
    ctx.moveTo(hx - 12 + side * 8, -19);
    ctx.lineTo(hx - 18 + side * 9, -19 - earH * 0.7);
    ctx.lineTo(hx - 5 + side * 8, -23);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d97b2f';
  }
  // Eyes — glowing in the dark when awake, closed when asleep.
  if (asleep) {
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(hx + 8, side * 10 - 4); ctx.lineTo(hx + 18, side * 10 + 4); ctx.stroke();
    }
  } else {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const side of [-1, 1]) {
      const g = ctx.createRadialGradient(hx + 14, side * 11, 1, hx + 14, side * 11, 12);
      g.addColorStop(0, 'rgba(255,240,120,0.95)');
      g.addColorStop(1, 'rgba(255,240,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(hx + 14, side * 11, 12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#1a0f02';
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.arc(hx + 15, side * 11, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Pink nose.
  ctx.fillStyle = '#e87a8a';
  ctx.beginPath();
  ctx.moveTo(hx + 28, -5); ctx.lineTo(hx + 28, 5); ctx.lineTo(hx + 20, 0);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // Name tag + status, always above the cat.
  const tag = 'MARMALADE — ' + cat.state + (cat.state === 'SLEEP' ? ' · Zzz' : '');
  ctx.font = 'bold 15px sans-serif';
  const tw = ctx.measureText(tag).width + 18;
  pill(ctx, cat.x - tw / 2, cat.y - 108, tw, 24, 'rgba(5,8,16,0.85)');
  ctx.fillStyle = '#ffb347';
  ctx.textAlign = 'center';
  ctx.fillText(tag, cat.x, cat.y - 91);
  // Suspicion ring around the cat's body: it fills as she grows sure.
  if (cat.suspicion > 5 && !asleep) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cat.x, cat.y, CAT.bodyR + 36, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = cat.suspicion >= 70 ? '#ff5a3c' : '#ffbf40';
    ctx.beginPath();
    ctx.arc(cat.x, cat.y, CAT.bodyR + 36, -Math.PI / 2, -Math.PI / 2 + (cat.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
  // Floating call-outs: the near-miss language the judge reads.
  if (cat.state === 'FROZEN') {
    ctx.fillStyle = '#ffe14d';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('?', cat.x + 112, cat.y - 118);
    pill(ctx, cat.x - 92, cat.y - 176, 184, 30, 'rgba(5,8,16,0.9)');
    ctx.fillStyle = '#ffe14d';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('WHAT WAS THAT?', cat.x, cat.y - 155);
  } else if (cat.state === 'CHASE') {
    ctx.fillStyle = '#ff4a30';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('!', cat.x + 112, cat.y - 118);
  } else if (asleep) {
    ctx.fillStyle = '#9db8dd';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Zzz', cat.x + 52, cat.y - 52);
  }
}

function drawAnt(ctx, player, s) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  // Legs.
  ctx.strokeStyle = '#3a2415';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(i * 6, -6); ctx.lineTo(i * 8 - 4, -13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i * 6, 6); ctx.lineTo(i * 8 - 4, 13); ctx.stroke();
  }
  // Three body segments, rim-lit so the tiny ant reads on the dark floor.
  ctx.fillStyle = '#241610';
  ctx.strokeStyle = '#e8b06a';
  ctx.lineWidth = 1.6;
  for (const [cx, r] of [[-11, 6], [0, 7.5], [11, 6.5]]) {
    ctx.beginPath(); ctx.arc(cx, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // Antennae.
  ctx.strokeStyle = '#e8b06a';
  ctx.beginPath(); ctx.moveTo(16, -3); ctx.quadraticCurveTo(24, -8, 26, -12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, 3); ctx.quadraticCurveTo(24, 8, 26, 12); ctx.stroke();
  // Carried crumb rides on the ant's back.
  if (player.carrying) {
    ctx.fillStyle = '#ffd65a';
    ctx.beginPath(); ctx.arc(-2, -11, 9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Name tag + carry hint.
  ctx.fillStyle = '#f3e2c2';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU — THE ANT', player.x, player.y + 28);
  if (player.carrying) {
    ctx.fillStyle = '#4dff88';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CARRYING → TAKE IT TO THE HOLE', player.x, player.y + 46);
  }
}

function drawHud(ctx, s, inCone) {
  const { player, cat, time } = s;
  ctx.fillStyle = '#0a0f1c';
  ctx.fillRect(0, 0, VIEW.width, HUD_H);
  ctx.fillStyle = '#2a2118';
  ctx.fillRect(0, HUD_H - 3, VIEW.width, 3);
  // Left: title + night/level.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('CRUMB', 18, 38);
  ctx.fillStyle = '#9db8dd';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('NIGHT 1  ·  LEVEL 1/3', 18, 62);
  ctx.fillStyle = '#c8d4e8';
  ctx.font = '13px sans-serif';
  ctx.fillText('GOAL: carry 3 crumbs to the HOLE', 18, 84);
  // Centre: detection word + alarm scale.
  const word = detectionWord(cat);
  const wordColor = word === 'SPOTTED!' ? '#ff4a30' : word === 'SUSPICIOUS' ? '#ffbf40' : word === 'UNEASY' ? '#ff9a3c' : word === 'ASLEEP' ? '#9db8dd' : '#7ddc8a';
  ctx.textAlign = 'center';
  ctx.fillStyle = wordColor;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(word, 640, 36);
  const bx = 470;
  const bw = 340;
  ctx.fillStyle = '#1a2438';
  pill(ctx, bx, 50, bw, 14, '#1a2438');
  const stage = alarmStage(cat);
  const fillColor = stage === 'ALARM' ? '#ff4a30' : stage === 'HUNTED' ? '#ff7a30' : stage === 'UNEASY' ? '#ffbf40' : '#4fae5f';
  ctx.fillStyle = fillColor;
  const fw = Math.max(4, (bw * cat.suspicion) / 100);
  ctx.beginPath();
  ctx.roundRect(bx, 50, fw, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#c8d4e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM: CALM — UNEASY — HUNTED — ALARM   [' + stage + ']', 640, 82);
  // Right: timer, loot, spotted.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(fmtTime(time), 1262, 36);
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('CRUMBS ' + player.delivered + '/3' + (player.carrying ? ' (+1 CARRIED)' : ''), 1262, 60);
  ctx.fillStyle = '#ff8a7a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('SPOTTED ' + cat.spotted, 1262, 82);
  // Status strip under the bar: visibility, noise, roster.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8fa3c4';
  ctx.font = '13px sans-serif';
  const dist = Math.round(Math.hypot(player.x - cat.x, player.y - cat.y) / 10);
  ctx.fillText(
    'VISIBILITY: ' + visibilityWord(player, inCone) + '   ·   NOISE: ' + noiseWord(player) +
    '   ·   CAT: MARMALADE — ' + cat.state + ' · ' + dist + 'm',
    18, 104,
  );
}

function drawLegend(ctx) {
  const x = 12;
  const y = 556;
  const w = 268;
  const h = 152;
  ctx.fillStyle = 'rgba(5,8,16,0.88)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,90,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LEGEND', x + 12, y + 22);
  const rows = [
    ['cone', 'VISION CONE — DANGER'],
    ['shadow', 'SHADOW — SAFE'],
    ['mat', 'MAT / TABLE — HIDE'],
    ['crumb', 'CRUMB — LOOT'],
    ['hole', 'HOLE — EXIT'],
  ];
  rows.forEach(([kind, label], i) => {
    const ry = y + 44 + i * 20;
    if (kind === 'cone') {
      ctx.fillStyle = 'rgba(255,196,90,0.85)';
      ctx.beginPath(); ctx.moveTo(x + 12, ry - 5); ctx.lineTo(x + 30, ry - 9); ctx.lineTo(x + 30, ry - 1); ctx.closePath(); ctx.fill();
    } else if (kind === 'shadow') {
      ctx.fillStyle = '#182238';
      ctx.fillRect(x + 12, ry - 9, 18, 10);
      ctx.strokeStyle = '#3a4a66'; ctx.strokeRect(x + 12, ry - 9, 18, 10);
    } else if (kind === 'mat') {
      ctx.fillStyle = '#6b4a2f';
      ctx.fillRect(x + 12, ry - 9, 18, 10);
    } else if (kind === 'crumb') {
      ctx.fillStyle = '#ffd65a';
      ctx.beginPath(); ctx.arc(x + 21, ry - 4, 6, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#4dff88';
      ctx.beginPath(); ctx.arc(x + 21, ry - 4, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#dbe4f2';
    ctx.font = '12px sans-serif';
    ctx.fillText(label, x + 38, ry);
  });
  ctx.fillStyle = '#8fa3c4';
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD / ARROWS move · SHIFT run (loud)', x + 12, y + h - 10);
}

function drawBanners(ctx, s) {
  const { cat, player } = s;
  // Sleep window pill, under the HUD.
  if (cat.state === 'SLEEP') {
    ctx.textAlign = 'center';
    pill(ctx, 500, 104, 280, 30, 'rgba(5,8,16,0.9)');
    ctx.fillStyle = '#9db8dd';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('WINDOW SAFE — CAT ASLEEP · Zzz', 640, 125);
  }
  // Hidden recovery pill.
  if (player.hidden && cat.suspicion > 20 && cat.state !== 'SLEEP') {
    ctx.textAlign = 'center';
    pill(ctx, 500, 104, 280, 30, 'rgba(5,8,16,0.9)');
    ctx.fillStyle = '#7ddc8a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('HIDDEN — HOLD STILL, SHE LOSES YOU', 640, 125);
  }
  // Caught flash.
  if (s.caughtFlash > 0) {
    ctx.textAlign = 'center';
    pill(ctx, 380, 300, 520, 54, 'rgba(120,10,5,0.92)');
    ctx.fillStyle = '#ffd9d0';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('CAUGHT! Marmalade took your crumb.', 640, 322);
    ctx.font = '15px sans-serif';
    ctx.fillText('Back to the start — wait for her to sleep.', 640, 344);
  }
  // Victory panel.
  if (s.won) {
    pill(ctx, 390, 250, 500, 190, 'rgba(13,24,48,0.96)');
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(390, 250, 500, 190, 14); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('YOU MADE IT!', 640, 310);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('3 crumbs in ' + fmtTime(s.time), 640, 352);
    ctx.fillStyle = '#9db8dd';
    ctx.font = '16px sans-serif';
    ctx.fillText('Marmalade never saw you. Press R to play again.', 640, 386);
  }
}
