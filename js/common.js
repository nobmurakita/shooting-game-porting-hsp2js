game.STA_OPENING = 0;  // オープニング
game.STA_TITLE =   1;  // タイトル
game.STA_INIT =    2;  // ステージ初期化
game.STA_PLAY =    3;  // ゲームプレー中
game.STA_CLEAR =   4;  // ゲームクリア
game.STA_ENDING =  5;  // エンディング
game.STA_PAUSE =   6;  // ポーズ

game.MaxStage = 1;

//////////キー入力ビットフラグ//////////
game.KEY_LEFT  = 1;    // bit 0: ←
game.KEY_DOWN  = 2;    // bit 1: ↓
game.KEY_RIGHT = 4;    // bit 2: →
game.KEY_UP    = 8;    // bit 3: ↑
game.KEY_LASER = 16;   // bit 4: Ctrl（レーザー）
game.KEY_SHOT  = 32;   // bit 5: Space（ショット）
game.KEY_SHIFT = 64;   // bit 6: Shift（ポーズ）
game.KEY_ESC   = 128;  // bit 7: Escape

//////////ゲーム共有状態//////////
game.GameContext = class {
  constructor() {
    this.gameSta = 0;
    this.stage = 0;
    this.score = 0;
    this.hiScore = 0;
    this.frame = 0;
    this.key = 0;
    this.nextLoopTime = 0;
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
    game.Enemy.table = game.Stages[stageNum];
    game.Enemy.tableIndex = 0;
    this.boss.initData();
    this.boss.init();
    this.frame = 0;
    this.key = 0;
  }
};

//////////初期設定//////////
game.IniCom = () => {
  game.ctx.gameSta = game.STA_OPENING;
  game.ctx.stage = 0;
  game.ctx.score = 0;
  game.ctx.hiScore = 0;

  // ゲーム画面
  hsp.screen(0, 300, 300);  // 表示用
  hsp.buffer(1, 300, 300);  // オフスクリーンバッファ

  // 背景
  hsp.buffer(2, 300, 300);
  hsp.color(20, 20, 0);
  hsp.boxf(0, 0, 300, 300);
  for (let i = 0; i < 300; i++) {
    hsp.color(255 - hsp.rnd(100), 255 - hsp.rnd(100), 255 - hsp.rnd(100));
    hsp.pset(hsp.rnd(300), hsp.rnd(300));
  }
  game.ctx.bg1 = 0;
  game.ctx.bg2 = 0;

  // 基本画像
  hsp.buffer(3, 1000, 1000);
  hsp.picload('img/player.png', 0, 0);
  hsp.picload('img/effect.png', 0, 80);
  hsp.picload('img/enesht.png', 0, 130);
  hsp.picload('img/etc.png', 0, 170);
}

//////////背景//////////
game.BackGround = () => {
  game.ctx.bg2 = 300 - game.ctx.bg1;
  hsp.pos(0, 0);
  hsp.gcopy(2, 0, Math.floor(game.ctx.bg2), 300, Math.floor(game.ctx.bg1));
  hsp.pos(0, Math.floor(game.ctx.bg1));
  hsp.gcopy(2, 0, 0, 300, Math.floor(game.ctx.bg2));
  game.ctx.bg1 += 0.5;
  if (game.ctx.bg1 >= 300) {
    game.ctx.bg1 -= 300;
  }
};

//////////数値表示ヘルパー//////////
// 8桁の数値を右詰めで表示（先頭ゼロは空白）
game.drawNumber = (value, rightX) => {
  let a = value;
  let sx = 0;   // 数字画像のX起点（0=数字, 64=空白）
  let sy = 170;  // 数字画像のY起点（170=数字, 186=空白）
  for (let i = 0; i < 8; i++) {
    hsp.pos(-i * 8 + rightX, 0);
    hsp.gcopy(3, a % 10 * 8 + sx, sy, 8, 16);
    a = Math.floor(a / 10);
    if (a === 0) {
      sx = 64;
      sy = 186;
    }
  }
};

//////////ステータス表示//////////
game.Disp = () => {
  // スコア
  hsp.pos(0, 0);
  hsp.gcopy(3, 17, 186, 45, 16);
  game.drawNumber(game.ctx.score, 100);

  // ハイスコア
  hsp.pos(173, 0);
  hsp.gcopy(3, 0, 186, 62, 16);
  game.drawNumber(game.ctx.hiScore, 290);
  hsp.pos(0, 284);
  hsp.gcopy(3, 0, 218, 40, 16);

  // レーザー
  hsp.pos(40, 288);
  hsp.gcopy(3, 0, 264, 80, 12);
  hsp.pos(40, 288);
  hsp.gcopy(3, 0, 254, Math.floor(game.ctx.player.lsrPow / 4), 12);

  // シールド
  hsp.pos(200, 284);
  hsp.gcopy(3, 0, 202, 45, 16);
  if (game.ctx.player.shield !== 0) {
    for (let i = 0; i < game.ctx.player.shield; i++) {
      hsp.pos(i * 8 + 245, 284);
      hsp.gcopy(3, 72, 186, 8, 16);
    }
  }
};
