//////////背景//////////
game.BG_STAR_COUNT   = 300;
game.BG_SCROLL_SPEED = 1;

game.initBackground = () => {
  game.bgStars = [];
  for (let i = 0; i < game.BG_STAR_COUNT; i++) {
    game.bgStars.push({
      x: game.rnd(game.SCREEN_W),
      y: game.rnd(game.SCREEN_H),
      color: game.color(
        (255 - game.rnd(100)) / 255,
        (255 - game.rnd(100)) / 255,
        (255 - game.rnd(100)) / 255
      ),
    });
  }
  game.ctx.bg1 = 0;
};

game.updateBackground = () => {
  const ctx = game.ctx;
  ctx.bg1 += game.BG_SCROLL_SPEED;
  if (ctx.bg1 >= game.SCREEN_H) {
    ctx.bg1 -= game.SCREEN_H;
  }
};

game.drawBackground = () => {
  const bg1 = game.ctx.bg1;
  // 背景色（暗い黄色）
  drawRect(vec2(0, 0), vec2(game.SCREEN_W, game.SCREEN_H), game.color(20/255, 20/255, 0));

  // スクロールする星
  const H = game.SCREEN_H;
  const halfW = game.SCREEN_W / 2;
  const halfH = H / 2;
  for (const s of game.bgStars) {
    // スクロール（画面座標系）: 星のy + bg1 をmod Hでラップ
    let sy = (s.y + bg1) % H;
    // スクリーン座標→ワールド座標
    drawRect(vec2(s.x - halfW, halfH - sy), vec2(2, 2), s.color);
  }
};
