# CRUMB — Night Kitchen Stealth

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/zoelicious/crumb-night-2of3/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/zoelicious/crumb-night-2of3/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

A tiny ant steals crumbs across a dark night kitchen while the giant orange
cat **Marmalade** patrols under a warm lamp. Hide under the mat or the table,
wait for her to curl up asleep — her ears twitch first — then carry three
glowing crumbs home to the hole in the wall.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts` and visit
http://localhost:8080). Move with WASD / arrow keys, hold Shift to run
(loud). Watch the alarm scale: CALM → UNEASY → HUNTED → ALARM. When
Marmalade freezes with a "?" and her ears bolt upright, get out of her cone
or under cover — if she catches you, the crumb you carry drops.

- Top-down night kitchen: dark blue-grey tiles, a moonlight pool, warm lamp cone
- Marmalade: named guard with patrol, freeze ("WHAT WAS THAT?"), chase and sleep states
- Detection that gives you a way back: hide on the mat or under the table and suspicion falls
- Footsteps: fading paw prints show where she has been
- English HUD with legend, visibility, noise, loot, spotted count and goal

## Layout

- `game/index.html` — page shell
- `game/style.css` — page chrome
- `game/main.js` — input, game loop, win/lose, screenshot staging
- `game/player.js` — the ant: movement, noise, pickup, delivery
- `game/guard.js` — Marmalade: patrol, sleep, ears, suspicion, vision cone
- `game/level.js` — the night kitchen: furniture, crumbs, exit, patrol route
- `game/render.js` — every pixel: floor, cone, cat, ant, HUD, legend

Built for the [best stealth game](https://make.fun/c/best-stealth-game-20261121-1759)
competition on make.fun.
