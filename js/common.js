game.STA_OPENING = 0;  // オープニング
game.STA_TITLE =   1;  // タイトル
game.STA_INIT =    2;  // ステージ初期化
game.STA_PLAY =    3;  // ゲームプレー中
game.STA_CLEAR =   4;  // ゲームクリア
game.STA_ENDING =  5;  // エンディング
game.STA_PAUSE =   6;  // ポーズ

game.MAX_STAGE = 1;

//////////キーコード定数（LittleJS v1.18: KeyboardEvent.code文字列）//////////
game.KEY_LEFT  = 'ArrowLeft';
game.KEY_UP    = 'ArrowUp';
game.KEY_RIGHT = 'ArrowRight';
game.KEY_DOWN  = 'ArrowDown';
game.KEY_LASER = 'KeyX';
game.KEY_SHOT  = 'KeyZ';
game.KEY_SHIFT = 'ShiftLeft';
game.KEY_ESC   = 'Escape';

//////////入力システム（LittleJS委譲）//////////
game.keyIsDown = (keyCode) => keyIsDown(keyCode);
game.keyWasPressed = (keyCode) => keyWasPressed(keyCode);

//////////ゲーム共有状態//////////
game.GameContext = class {
  constructor() {
    this.gameSta = 0;
    this.stage = 0;
    this.score = 0;
    this.hiScore = 0;
    this.frame = 0;

    this.bg1 = 0;
    this.bg2 = 0;
    this.effects = [];
    this.player = null;
    this.playerShots = [];
    this.lasers = [];
    this.enemies = [];
    this.enemyShots = [];
    this.boss = null;
  }

  // ステージ初期化
  initStage(stageNum) {
    this.stage = stageNum;
    this.effects = [];
    this.enemyShots = [];
    this.player.init();
    this.playerShots = [];
    this.lasers = [];
    this.enemies = [];
    this.enemyTable = game.Stages[stageNum];
    this.enemyTableIndex = 0;
    this.boss = new game.Boss();
    this.frame = 0;
  }
};

//////////初期設定//////////
game.initCommon = () => {
  game.ctx = new game.GameContext();
  game.ctx.player = new game.Player();

  // 背景星データ生成（描画時にdrawRectで描画）
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
  game.ctx.bg2 = 0;
};

//////////背景//////////
game.updateBackground = (ctx) => {
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

//////////UIスプライト座標//////////
game.UI_SPRITES = {
  tex: game.TEX.UI,
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
game.drawNumber = (value, x, y) => {
  let a = value;
  let numCx = 0;     // 数字の基準X
  let numCy = 0;     // 数字のY
  let blankCx = 128; // 空白の基準X
  let blankCy = 32;  // 空白のY
  let cx = numCx, cy = numCy;
  const tex = game.TEX.UI;
  for (let i = 0; i < 8; i++) {
    const digitX = a % 10 * 16 + cx;
    const ti = game.tile(digitX, cy, 16, 32, tex);
    game.drawUI(x - i * ti.drawSize.x, y, ti);
    a = Math.floor(a / 10);
    if (a === 0) { cx = blankCx; cy = blankCy; }
  }
};

//////////ステータス表示//////////
game.drawStatusUI = () => {
  const ui = game.UI_SPRITES;
  const tex = ui.tex;

  // スコア
  game.drawUI(-255, 284, game.tile(ui.scoreLabel.cx, ui.scoreLabel.cy, ui.scoreLabel.sx, ui.scoreLabel.sy, tex));
  game.drawNumber(game.ctx.score, -92, 284);

  // ハイスコア
  game.drawUI(108, 284, game.tile(ui.hiScoreLabel.cx, ui.hiScoreLabel.cy, ui.hiScoreLabel.sx, ui.hiScoreLabel.sy, tex));
  game.drawNumber(game.ctx.hiScore, 288, 284);

  // レーザー
  game.drawUI(-260, -284, game.tile(ui.laserLabel.cx, ui.laserLabel.cy, ui.laserLabel.sx, ui.laserLabel.sy, tex));
  game.drawUI(-140, -288, game.tile(ui.laserBarBg.cx, ui.laserBarBg.cy, ui.laserBarBg.sx, ui.laserBarBg.sy, tex));
  const barW = Math.floor(game.ctx.player.lsrPowDisplay * ui.laserBarBg.sx / game.Player.CONFIG.laserMax);
  if (barW > 0) {
    game.drawUI(barW / 2 - 220, -288, game.tile(ui.laserBarFg.cx, ui.laserBarFg.cy, barW, ui.laserBarFg.sy, tex));
  }

  // シールド
  game.drawUI(145, -284, game.tile(ui.shieldLabel.cx, ui.shieldLabel.cy, ui.shieldLabel.sx, ui.shieldLabel.sy, tex));
  if (game.ctx.player.shield !== 0) {
    const shieldTi = game.tile(ui.shieldIcon.cx, ui.shieldIcon.cy, ui.shieldIcon.sx, ui.shieldIcon.sy, tex);
    for (let i = 0; i < game.ctx.player.shield; i++) {
      game.drawUI(i * 16 + 198, -284, shieldTi);
    }
  }
};
