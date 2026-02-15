import { ctx, TEX, gameTile, drawUI } from './game.js';
import { player } from './registry.js';

//////////UIスプライト座標//////////
export const UI_SPRITES = {
  tex: TEX.UI,
  scoreLabel:   { cx: 34, cy: 32, sx: 90,  sy: 32 },
  hiScoreLabel: { cx: 0,  cy: 32, sx: 124, sy: 32 },
  laserLabel:   { cx: 0,  cy: 96, sx: 80,  sy: 32 },
  laserBarBg:   { cx: 0,  cy: 188, sx: 160, sy: 24 },
  laserBarFg:   { cx: 0,  cy: 168, sy: 24 },
  shieldLabel:  { cx: 0,  cy: 64, sx: 90,  sy: 32 },
  shieldIcon:   { cx: 144, cy: 32, sx: 16, sy: 32 },
  pauseLabel:   { cx: 0,  cy: 128, sx: 84, sy: 32 },
};

//////////数値表示ヘルパー//////////
// 8桁の数値を右詰めで表示（先頭ゼロは空白）
// x: 最右桁の中心X（ワールド座標）、y: 中心Y（ワールド座標）
export function drawNumber(value, x, y) {
  let a = value;
  const numCx = 0;     // 数字の基準X
  const numCy = 0;     // 数字のY
  const blankCx = 128; // 空白の基準X
  const blankCy = 32;  // 空白のY
  let cx = numCx, cy = numCy;
  const tex = TEX.UI;
  for (let i = 0; i < 8; i++) {
    const digitX = a % 10 * 16 + cx;
    const ti = gameTile(digitX, cy, 16, 32, tex);
    drawUI(x - i * ti.drawSize.x, y, ti);
    a = Math.floor(a / 10);
    if (a === 0) { cx = blankCx; cy = blankCy; }
  }
}

//////////ステータス表示//////////
export function drawStatusUI() {
  const ui = UI_SPRITES;
  const tex = ui.tex;

  // スコア
  drawUI(-255, 284, gameTile(ui.scoreLabel.cx, ui.scoreLabel.cy, ui.scoreLabel.sx, ui.scoreLabel.sy, tex));
  drawNumber(ctx.score, -92, 284);

  // ハイスコア
  drawUI(108, 284, gameTile(ui.hiScoreLabel.cx, ui.hiScoreLabel.cy, ui.hiScoreLabel.sx, ui.hiScoreLabel.sy, tex));
  drawNumber(ctx.hiScore, 288, 284);

  // レーザー
  drawUI(-260, -284, gameTile(ui.laserLabel.cx, ui.laserLabel.cy, ui.laserLabel.sx, ui.laserLabel.sy, tex));
  drawUI(-140, -288, gameTile(ui.laserBarBg.cx, ui.laserBarBg.cy, ui.laserBarBg.sx, ui.laserBarBg.sy, tex));
  const barW = Math.floor(player.laserPowerDisplay * ui.laserBarBg.sx / 320);
  if (barW > 0) {
    drawUI(barW / 2 - 220, -288, gameTile(ui.laserBarFg.cx, ui.laserBarFg.cy, barW, ui.laserBarFg.sy, tex));
  }

  // シールド
  drawUI(145, -284, gameTile(ui.shieldLabel.cx, ui.shieldLabel.cy, ui.shieldLabel.sx, ui.shieldLabel.sy, tex));
  if (player.shield !== 0) {
    const shieldTi = gameTile(ui.shieldIcon.cx, ui.shieldIcon.cy, ui.shieldIcon.sx, ui.shieldIcon.sy, tex);
    for (let i = 0; i < player.shield; i++) {
      drawUI(i * 16 + 198, -284, shieldTi);
    }
  }
}
