//////////敵ショット基底クラス//////////
game.EnemyShot = class {
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, dir) {
    this.alive = true;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.frm = 0;
    this.cx = 0;
    this.initAI();
  }

  // サブクラスでオーバーライド
  initAI() {}
  updateAI(ctx) {}

  update(ctx) {
    if (!this.alive) return;

    // --- AI移動処理（サブクラスで委譲） ---
    this.updateAI(ctx);

    this.frm++;
  }

  draw() {
    if (!this.alive) return;
    const d = this.constructor.DATA;
    const ti = game.tile(this.cx, d.texCy, d.sx, d.sy, d.tex);
    drawTile(vec2(this.x, this.y), ti.drawSize, ti);
  }
};

//////////敵ショットサブクラス//////////

// ki=0: 通常弾（直進）
game.EnemyShot0 = class extends game.EnemyShot {
  static DATA = { sx: 40, sy: 40, hitX1: -10, hitY1: -10, hitX2: 10, hitY2: 10, tex: game.TEX.ENESHT, texCy: 0 };

  initAI() {
    this.cx = game.radToSpriteFrameHalf(this.dir, 16, 40);
  }

  updateAI(ctx) {
    this.x += Math.cos(this.dir) * 7;
    this.y += Math.sin(this.dir) * 7;
    if (this.x < -game.BOUNDS.SHOT || this.x > game.BOUNDS.SHOT || this.y < -game.BOUNDS.SHOT || this.y > game.BOUNDS.SHOT) {
      this.alive = false;
    }
  }
};

// ki=1: 照準弾（直進＋アニメーション）
game.EnemyShot1 = class extends game.EnemyShot {
  static DATA = { sx: 40, sy: 40, hitX1: -10, hitY1: -10, hitX2: 10, hitY2: 10, tex: game.TEX.ENESHT, texCy: 0 };

  updateAI(ctx) {
    this.x += Math.cos(this.dir) * 5;
    this.y += Math.sin(this.dir) * 5;
    this.cx = (Math.floor(this.frm / 2) % 16) * 40 + 640;
    if (this.x < -game.BOUNDS.SHOT || this.x > game.BOUNDS.SHOT || this.y < -game.BOUNDS.SHOT || this.y > game.BOUNDS.SHOT) {
      this.alive = false;
    }
  }
};

// ki=2: 誘導弾（追尾）
game.EnemyShot2 = class extends game.EnemyShot {
  static DATA = { sx: 40, sy: 40, hitX1: -10, hitY1: -10, hitX2: 10, hitY2: 10, tex: game.TEX.ENESHT, texCy: 40 };

  initAI() {
    this.vx = 0;
    this.vy = 0;
  }

  updateAI(ctx) {
    const ply = ctx.player;

    if (this.frm % 2 === 0) {
      if ((this.frm < 160 && ply.alive) || this.frm === 0) {
        this.dir = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      }
      this.vx += Math.cos(this.dir) * 2 / 3;
      this.vy += Math.sin(this.dir) * 2 / 3;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.frm % 2 === 0) {
      this.vx = this.vx * 14 / 15;
      this.vy = this.vy * 14 / 15;
    }
    this.cx = game.radToSpriteFrame(this.dir, 32, 40);
    if (this.frm % 6 === 0) {
      let x = game.rnd(20) - 10;
      let y = game.rnd(20) - 10;
      game.spawnEffect(ctx, 2, -Math.cos(this.dir) * 20 + this.x + x, -Math.sin(this.dir) * 20 + this.y + y, 0);
    }
    if (this.frm > 160) {
      if (this.x < -game.BOUNDS.SHOT || this.x > game.BOUNDS.SHOT || this.y < -game.BOUNDS.SHOT || this.y > game.BOUNDS.SHOT) {
        this.alive = false;
      }
    }
  }
};

// CLASS_MAP 構築
game.EnemyShot.CLASS_MAP = [
  game.EnemyShot0, game.EnemyShot1, game.EnemyShot2,
];

// 敵ショット生成ヘルパー
game.spawnEnemyShot = (ctx, ki, x, y, dir) => {
  const ShotClass = game.EnemyShot.CLASS_MAP[ki];
  ctx.enemyShots.push(new ShotClass(x, y, dir));
};
