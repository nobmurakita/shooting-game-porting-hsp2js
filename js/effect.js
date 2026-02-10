;//////////エフェクト基底クラス//////////
hsp.Effect = class {
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, startFrm) {
    this.alive = true;
    this.ki = this.constructor.KI;
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
    hsp.pos(Math.floor(this.x) - Math.floor(d.sx / 2), Math.floor(this.y) - Math.floor(d.sy / 2));
    hsp.gcopy(3, this.cx, d.cy, d.sx, d.sy);
  }
};

;//////////エフェクトサブクラス//////////

;// ki=0: 爆発（大）
hsp.Effect0 = class extends hsp.Effect {
  static KI = 0;
  static DATA = { sx: 40, sy: 40, cy: 80 };

  updateAI() {
    if (this.frm >= 8) {
      this.y += 7;
    }
    this.cx = Math.floor(this.frm / 3) % 6 * 40;
    if (this.frm === 17) {
      this.alive = false;
    }
  }
};

;// ki=1: 火花
hsp.Effect1 = class extends hsp.Effect {
  static KI = 1;
  static DATA = { sx: 10, sy: 10, cy: 120 };

  updateAI() {
    this.cx = Math.floor(this.frm / 3) % 6 * 10 + 60;
    if (this.frm === 17) {
      this.alive = false;
    }
  }
};

;// ki=2: 煙
hsp.Effect2 = class extends hsp.Effect {
  static KI = 2;
  static DATA = { sx: 10, sy: 10, cy: 120 };

  updateAI() {
    this.cx = Math.floor(this.frm / 3) % 6 * 10;
    if (this.frm === 17) {
      this.alive = false;
    }
  }
};

;// CLASS_MAP 構築
hsp.Effect.CLASS_MAP = [
  hsp.Effect0, hsp.Effect1, hsp.Effect2,
];

;// エフェクト生成ヘルパー
hsp.spawnEffect = (ctx, ki, x, y, startFrm) => {
  const EffectClass = hsp.Effect.CLASS_MAP[ki];
  ctx.effects.push(new EffectClass(x, y, startFrm));
};
