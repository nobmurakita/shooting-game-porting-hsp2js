//////////敵ショット基底クラス//////////
game.EnemyShot = class extends game.GameObject {
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, dir) {
    super(vec2(x, y), 40);  // renderOrder=40（レーザー=50の下）
    this.dir = dir;
    this.cx = 0;
    this.initAI();
  }

  // プレイヤーに命中
  onHitPlayer() {
    game.spawnHitSpark(this.pos.x, this.pos.y);
    this.destroy();
  }

  // サブクラスでオーバーライド
  initAI() {}
  updateAI() {}

  update() {
    if (!game.ctx.canUpdate()) return;
    this.updateAI();
    this.frm++;
  }

  render() {
    if (!game.ctx.canRender()) return;
    const d = this.constructor.DATA;
    const ti = game.tile(this.cx, d.texCy, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }
};

//////////敵ショットサブクラス//////////

// ki=0: 通常弾（直進）
game.EnemyShot0 = class extends game.EnemyShot {
  static DATA = { sx: 40, sy: 40, tex: game.TEX.ENESHT, texCy: 0 };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };

  initAI() {
    this.cx = game.radToSpriteFrameHalf(this.dir, 16, 40);
  }

  updateAI() {
    this.pos.x += Math.cos(this.dir) * 7;
    this.pos.y += Math.sin(this.dir) * 7;
    if (game.isOutOfBounds(this.pos.x, this.pos.y, game.BOUNDS.SHOT)) {
      this.destroy();
    }
  }
};

// ki=1: 照準弾（直進＋アニメーション）
game.EnemyShot1 = class extends game.EnemyShot {
  static DATA = { sx: 40, sy: 40, tex: game.TEX.ENESHT, texCy: 0 };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };

  updateAI() {
    this.pos.x += Math.cos(this.dir) * 5;
    this.pos.y += Math.sin(this.dir) * 5;
    this.cx = (Math.floor(this.frm / 2) % 16) * 40 + 640;
    if (game.isOutOfBounds(this.pos.x, this.pos.y, game.BOUNDS.SHOT)) {
      this.destroy();
    }
  }
};

// ki=2: 誘導弾（追尾）
game.EnemyShot2 = class extends game.EnemyShot {
  static DATA = { sx: 40, sy: 40, tex: game.TEX.ENESHT, texCy: 40 };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };

  initAI() {
    this.vx = 0;
    this.vy = 0;
  }

  // プレイヤーショットで撃破可能な誘導弾
  onHitByShot() {
    const d = this.constructor.DATA;
    game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 2);
    this.destroy();
    return true;
  }

  updateAI() {
    const ply = game.ctx.player;

    if (this.frm % 2 === 0) {
      if ((this.frm < 160 && ply.alive) || this.frm === 0) {
        this.dir = game.CollisionSystem.calcDir(this.pos, ply.pos);
      }
      this.vx += Math.cos(this.dir) * 2 / 3;
      this.vy += Math.sin(this.dir) * 2 / 3;
    }
    this.pos.x += this.vx;
    this.pos.y += this.vy;
    if (this.frm % 2 === 0) {
      this.vx = this.vx * 14 / 15;
      this.vy = this.vy * 14 / 15;
    }
    this.cx = game.radToSpriteFrame(this.dir, 32, 40);
    if (this.frm % 6 === 0) {
      let ox = game.rnd(20) - 10;
      let oy = game.rnd(20) - 10;
      game.spawnEffect(2, -Math.cos(this.dir) * 20 + this.pos.x + ox, -Math.sin(this.dir) * 20 + this.pos.y + oy, 0);
    }
    if (this.frm > 160) {
      if (game.isOutOfBounds(this.pos.x, this.pos.y, game.BOUNDS.SHOT)) {
        this.destroy();
      }
    }
  }
};

// CLASS_MAP 構築
game.EnemyShot.CLASS_MAP = [
  game.EnemyShot0, game.EnemyShot1, game.EnemyShot2,
];

// 敵ショット生成ヘルパー
game.spawnEnemyShot = (ki, x, y, dir) => {
  const ShotClass = game.EnemyShot.CLASS_MAP[ki];
  if (!ShotClass) return;
  new ShotClass(x, y, dir);
};
