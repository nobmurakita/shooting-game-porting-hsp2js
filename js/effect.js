import { GameObject, ctx, TEX, rnd, gameTile, gameColor } from './game.js';

//////////エフェクト基底クラス//////////
export class Effect extends GameObject {
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
    const ti = gameTile(this.animX, d.texCy, d.sx, d.sy, d.tex);
    setBlendMode(true);
    drawTile(this.pos, ti.drawSize, ti, gameColor(1, 1, 1, 0.8));
    setBlendMode();
  }
}

//////////エフェクトサブクラス//////////

// ki=0: 爆発（大）
export class Effect0 extends Effect {
  static DATA = { sx: 80, sy: 80, tex: TEX.EFFECT, texCy: 0 };
  static SOUND = new Sound([.5,,200,.02,.15,.25,4,2.5,,,,,,,20,.1,,.5,.05]);

  constructor(x, y, startFrame) {
    super(x, y, startFrame);
    Effect0.SOUND.play();
  }

  update() {
    if (ctx.isPaused()) return;
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
}

// ki=1: 火花
export class Effect1 extends Effect {
  static DATA = { sx: 20, sy: 20, tex: TEX.EFFECT, texCy: 80 };
  static SOUND = new Sound([.5,,800,.01,.01,.04,4,1.5,-30,,,,,,5]);

  constructor(x, y, startFrame) {
    super(x, y, startFrame);
    Effect1.SOUND.play();
  }

  update() {
    if (ctx.isPaused()) return;
    this.frame++;
    if (this.frame <= 0) return;
    this.animX = Math.floor(this.frame / 6) % 6 * 20 + 120;
    if (this.frame === 34) {
      this.destroy();
    }
  }
}

// ki=2: 煙
export class Effect2 extends Effect {
  static DATA = { sx: 20, sy: 20, tex: TEX.EFFECT, texCy: 80 };

  update() {
    if (ctx.isPaused()) return;
    this.frame++;
    if (this.frame <= 0) return;
    this.animX = Math.floor(this.frame / 6) % 6 * 20;
    if (this.frame === 34) {
      this.destroy();
    }
  }
}

// CLASS_MAP 構築
Effect.CLASS_MAP = [
  Effect0, Effect1, Effect2,
];

// エフェクト生成ヘルパー
export function spawnEffect(ki, x, y, startFrame) {
  const EffectClass = Effect.CLASS_MAP[ki];
  if (!EffectClass) return;
  new EffectClass(x, y, startFrame);
}

// 火花エフェクト — ヒット時の小さな火花（複数時はずらして生成）
export function spawnHitSparks(x, y, count = 1) {
  for (let j = 0; j < count; j++) {
    const ex = rnd(20) - 10;
    const ey = rnd(20) - 10;
    spawnEffect(1, x + ex, y + ey, -j * 6);
  }
}

// 爆発エフェクト（複数）— 撃破時の爆発
// sw/shはscatter範囲サイズ
export function spawnExplosion(x, y, sx, sy, count) {
  for (let j = 0; j < count; j++) {
    const ex = rnd(sx) - Math.floor(sx / 2);
    const ey = rnd(sy) - Math.floor(sy / 2);
    spawnEffect(0, x + ex, y + ey, -j * 6);
  }
}
