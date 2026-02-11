//////////エフェクト基底クラス//////////
game.Effect = class extends game.GameObject {
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, startFrm) {
    super(vec2(x, y), 30);  // renderOrder=30
    this.frm = startFrm;
    this.cx = 0;
  }

  // サブクラスでオーバーライド
  updateAI() {}

  update() {
    const ctx = game.ctx;
    if (ctx.gameSta !== game.STA_PLAY && ctx.gameSta !== game.STA_CLEAR) return;

    this.frm++;
    if (this.frm <= 0) return;

    this.updateAI();
  }

  render() {
    const ctx = game.ctx;
    if (ctx.gameSta !== game.STA_PLAY && ctx.gameSta !== game.STA_CLEAR && ctx.gameSta !== game.STA_PAUSE) return;
    if (this.frm <= 0) return;
    const d = this.constructor.DATA;
    const ti = game.tile(this.cx, d.texCy, d.sx, d.sy, d.tex);
    setBlendMode(true);
    drawTile(this.pos, ti.drawSize, ti, game.color(1, 1, 1, 0.8));
    setBlendMode();
  }
};

//////////エフェクトサブクラス//////////

// ki=0: 爆発（大）
game.Effect0 = class extends game.Effect {
  static DATA = { sx: 80, sy: 80, tex: game.TEX.EFFECT, texCy: 0 };

  updateAI() {
    if (this.frm >= 16) {
      this.pos.y -= 7;
    }
    this.cx = Math.floor(this.frm / 6) % 6 * 80;
    if (this.frm === 34) {
      this.destroy();
    }
  }
};

// ki=1: 火花
game.Effect1 = class extends game.Effect {
  static DATA = { sx: 20, sy: 20, tex: game.TEX.EFFECT, texCy: 80 };

  updateAI() {
    this.cx = Math.floor(this.frm / 6) % 6 * 20 + 120;
    if (this.frm === 34) {
      this.destroy();
    }
  }
};

// ki=2: 煙
game.Effect2 = class extends game.Effect {
  static DATA = { sx: 20, sy: 20, tex: game.TEX.EFFECT, texCy: 80 };

  updateAI() {
    this.cx = Math.floor(this.frm / 6) % 6 * 20;
    if (this.frm === 34) {
      this.destroy();
    }
  }
};

// CLASS_MAP 構築
game.Effect.CLASS_MAP = [
  game.Effect0, game.Effect1, game.Effect2,
];

// エフェクト生成ヘルパー
game.spawnEffect = (ki, x, y, startFrm) => {
  const EffectClass = game.Effect.CLASS_MAP[ki];
  if (!EffectClass) return;
  new EffectClass(x, y, startFrm);
};

// 火花エフェクト（単発）— ヒット時の小さな火花
game.spawnHitSpark = (x, y) => {
  const ex = game.rnd(20) - 10;
  const ey = game.rnd(20) - 10;
  game.spawnEffect(1, x + ex, y + ey, 0);
};

// 火花エフェクト（複数）— 被弾時の火花散り
game.spawnHitSparks = (x, y, count) => {
  for (let j = 0; j < count; j++) {
    const ex = game.rnd(20) - 10;
    const ey = game.rnd(20) - 10;
    game.spawnEffect(1, x + ex, y + ey, -j * 6);
  }
};

// 爆発エフェクト（複数）— 撃破時の爆発
// sw/shはscatter範囲サイズ
game.spawnExplosion = (x, y, sx, sy, count) => {
  for (let j = 0; j < count; j++) {
    const ex = game.rnd(sx) - Math.floor(sx / 2);
    const ey = game.rnd(sy) - Math.floor(sy / 2);
    game.spawnEffect(0, x + ex, y + ey, -j * 6);
  }
};
