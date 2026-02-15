//////////エフェクト基底クラス//////////
game.Effect = class extends game.GameObject {
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, startFrame) {
    super(vec2(x, y), 30);  // renderOrder=30
    this.frame = startFrame;
    this.animX = 0;
  }

  update() {}


  render() {
    if (this.frame <= 0) return;
    const d = this.constructor.DATA;
    const ti = game.tile(this.animX, d.texCy, d.sx, d.sy, d.tex);
    setBlendMode(true);
    drawTile(this.pos, ti.drawSize, ti, game.color(1, 1, 1, 0.8));
    setBlendMode();
  }
};

//////////エフェクトサブクラス//////////

// ki=0: 爆発（大）
game.Effect0 = class extends game.Effect {
  static DATA = { sx: 80, sy: 80, tex: game.TEX.EFFECT, texCy: 0 };
  static SOUND = new Sound([.5,,200,.02,.15,.25,4,2.5,,,,,,,20,.1,,.5,.05]);

  constructor(x, y, startFrame) {
    super(x, y, startFrame);
    game.Effect0.SOUND.play();
  }

  update() {
    if (game.ctx.isPaused()) return;
    this.frame++;
    if (this.frame <= 0) return;
    if (this.frame >= 16) {
      this.pos.y -= 7;
    }
    this.animX = Math.floor(this.frame / 6) % 6 * 80;
    if (this.frame === 34) {
      this.destroy();
    }
  }
};

// ki=1: 火花
game.Effect1 = class extends game.Effect {
  static DATA = { sx: 20, sy: 20, tex: game.TEX.EFFECT, texCy: 80 };
  static SOUND = new Sound([.5,,800,.01,.01,.04,4,1.5,-30,,,,,,5]);

  constructor(x, y, startFrame) {
    super(x, y, startFrame);
    game.Effect1.SOUND.play();
  }

  update() {
    if (game.ctx.isPaused()) return;
    this.frame++;
    if (this.frame <= 0) return;
    this.animX = Math.floor(this.frame / 6) % 6 * 20 + 120;
    if (this.frame === 34) {
      this.destroy();
    }
  }
};

// ki=2: 煙
game.Effect2 = class extends game.Effect {
  static DATA = { sx: 20, sy: 20, tex: game.TEX.EFFECT, texCy: 80 };

  update() {
    if (game.ctx.isPaused()) return;
    this.frame++;
    if (this.frame <= 0) return;
    this.animX = Math.floor(this.frame / 6) % 6 * 20;
    if (this.frame === 34) {
      this.destroy();
    }
  }
};

// CLASS_MAP 構築
game.Effect.CLASS_MAP = [
  game.Effect0, game.Effect1, game.Effect2,
];

// エフェクト生成ヘルパー
game.spawnEffect = (ki, x, y, startFrame) => {
  const EffectClass = game.Effect.CLASS_MAP[ki];
  if (!EffectClass) return;
  new EffectClass(x, y, startFrame);
};

// 火花エフェクト — ヒット時の小さな火花（複数時はずらして生成）
game.spawnHitSparks = (x, y, count = 1) => {
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
