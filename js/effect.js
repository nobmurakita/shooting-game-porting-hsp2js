//////////エフェクト基底クラス//////////
game.Effect = class {
  static BUF = 3;           // 描画バッファ番号
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, startFrm) {
    this.alive = true;
    this.x = x;
    this.y = y;
    this.frm = startFrm;
    this.cx = 0;
  }

  // サブクラスでオーバーライド
  updateAI() {}

  update() {
    if (!this.alive) return;

    this.frm++;
    if (this.frm <= 0) return;

    this.updateAI();
  }

  draw() {
    if (!this.alive || this.frm <= 0) return;
    const d = this.constructor.DATA;
    hsp.pos(Math.floor(this.x) - Math.floor(d.sx / 2), game.screenY(this.y, d.sy));
    hsp.gcopy(game.Effect.BUF, this.cx, d.cy, d.sx, d.sy);
  }
};

//////////エフェクトサブクラス//////////

// ki=0: 爆発（大）
game.Effect0 = class extends game.Effect {
  static DATA = { sx: 40, sy: 40, cy: 80 };

  updateAI() {
    if (this.frm >= 16) {
      this.y -= 3.5;
    }
    this.cx = Math.floor(this.frm / 6) % 6 * 40;
    if (this.frm === 34) {
      this.alive = false;
    }
  }
};

// ki=1: 火花
game.Effect1 = class extends game.Effect {
  static DATA = { sx: 10, sy: 10, cy: 120 };

  updateAI() {
    this.cx = Math.floor(this.frm / 6) % 6 * 10 + 60;
    if (this.frm === 34) {
      this.alive = false;
    }
  }
};

// ki=2: 煙
game.Effect2 = class extends game.Effect {
  static DATA = { sx: 10, sy: 10, cy: 120 };

  updateAI() {
    this.cx = Math.floor(this.frm / 6) % 6 * 10;
    if (this.frm === 34) {
      this.alive = false;
    }
  }
};

// CLASS_MAP 構築
game.Effect.CLASS_MAP = [
  game.Effect0, game.Effect1, game.Effect2,
];

// エフェクト生成ヘルパー
game.spawnEffect = (ctx, ki, x, y, startFrm) => {
  const EffectClass = game.Effect.CLASS_MAP[ki];
  ctx.effects.push(new EffectClass(x, y, startFrm));
};

// 火花エフェクト（単発）— ヒット時の小さな火花
game.spawnHitSpark = (ctx, x, y) => {
  const ex = hsp.rnd(10) - 5;
  const ey = hsp.rnd(10) - 5;
  game.spawnEffect(ctx, 1, x + ex, y + ey, 0);
};

// 火花エフェクト（複数）— 被弾時の火花散り
game.spawnHitSparks = (ctx, x, y, count) => {
  for (let j = 0; j < count; j++) {
    const ex = hsp.rnd(10) - 5;
    const ey = hsp.rnd(10) - 5;
    game.spawnEffect(ctx, 1, x + ex, y + ey, -j * 6);
  }
};

// 爆発エフェクト（複数）— 撃破時の爆発
game.spawnExplosion = (ctx, x, y, sx, sy, count) => {
  for (let j = 0; j < count; j++) {
    const ex = hsp.rnd(sx) - Math.floor(sx / 2);
    const ey = hsp.rnd(sy) - Math.floor(sy / 2);
    game.spawnEffect(ctx, 0, x + ex, y + ey, -j * 6);
  }
};
