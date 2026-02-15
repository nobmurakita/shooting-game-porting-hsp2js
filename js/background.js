import { ctx, SCREEN_W, SCREEN_H, rnd, gameColor } from './game.js';

//////////背景//////////
const BG_STAR_COUNT   = 300;
const BG_SCROLL_SPEED = 1;

let bgStars;

export function initBackground() {
  bgStars = [];
  for (let i = 0; i < BG_STAR_COUNT; i++) {
    bgStars.push({
      x: rnd(SCREEN_W),
      y: rnd(SCREEN_H),
      color: gameColor(
        (255 - rnd(100)) / 255,
        (255 - rnd(100)) / 255,
        (255 - rnd(100)) / 255
      ),
    });
  }
  ctx.bg1 = 0;
}

export function updateBackground() {
  ctx.bg1 += BG_SCROLL_SPEED;
  if (ctx.bg1 >= SCREEN_H) {
    ctx.bg1 -= SCREEN_H;
  }
}

export function drawBackground() {
  const bg1 = ctx.bg1;
  // 背景色（暗い黄色）
  drawRect(vec2(0, 0), vec2(SCREEN_W, SCREEN_H), gameColor(20/255, 20/255, 0));

  // スクロールする星
  const H = SCREEN_H;
  const halfW = SCREEN_W / 2;
  const halfH = H / 2;
  for (const s of bgStars) {
    // スクロール（画面座標系）: 星のy + bg1 をmod Hでラップ
    let sy = (s.y + bg1) % H;
    // スクリーン座標→ワールド座標
    drawRect(vec2(s.x - halfW, halfH - sy), vec2(2, 2), s.color);
  }
}
