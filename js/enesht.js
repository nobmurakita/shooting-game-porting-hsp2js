//////////敵ショット基底クラス//////////
game.EnemyShot = class {
  static BUF = 3;           // 描画バッファ番号
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, dir) {
    this.alive = true;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.frm = 0;
    this.cx = 0;
    this.tmp = [0, 0, 0, 0];
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
    hsp.pos(Math.floor(this.x) - Math.floor(d.sx / 2), game.screenY(this.y, d.sy));
    hsp.gcopy(game.EnemyShot.BUF, this.cx, d.cy, d.sx, d.sy);
  }
};

//////////敵ショットサブクラス//////////

// ki=0: 通常弾（直進）
game.EnemyShot0 = class extends game.EnemyShot {
  static DATA = { sx: 20, sy: 20, hitX1: -5, hitY1: -5, hitX2: 5, hitY2: 5, cy: 130 };

  initAI() {
    this.cx = game.radToSpriteFrameHalf(this.dir, 16, 20);
  }

  updateAI(ctx) {
    this.x += Math.cos(this.dir) * 3.5;
    this.y += Math.sin(this.dir) * 3.5;
    if (this.x < -10 || this.x > 310 || this.y < -10 || this.y > 310) {
      this.alive = false;
    }
  }
};

// ki=1: 照準弾（直進＋アニメーション）
game.EnemyShot1 = class extends game.EnemyShot {
  static DATA = { sx: 20, sy: 20, hitX1: -5, hitY1: -5, hitX2: 5, hitY2: 5, cy: 130 };

  updateAI(ctx) {
    this.x += Math.cos(this.dir) * 2.5;
    this.y += Math.sin(this.dir) * 2.5;
    this.cx = (Math.floor(this.frm / 2) % 16) * 20 + 320;
    if (this.x < -10 || this.x > 310 || this.y < -10 || this.y > 310) {
      this.alive = false;
    }
  }
};

// ki=2: 誘導弾（追尾）
game.EnemyShot2 = class extends game.EnemyShot {
  static DATA = { sx: 20, sy: 20, hitX1: -5, hitY1: -5, hitX2: 5, hitY2: 5, cy: 150 };

  updateAI(ctx) {
    const ply = ctx.player;

    if (this.frm % 2 === 0) {
      if ((this.frm < 160 && ply.alive) || this.frm === 0) {
        this.dir = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      }
      this.tmp[0] += Math.cos(this.dir) * 1 / 3;
      this.tmp[1] += Math.sin(this.dir) * 1 / 3;
    }
    this.x += this.tmp[0];
    this.y += this.tmp[1];
    if (this.frm % 2 === 0) {
      this.tmp[0] = this.tmp[0] * 14 / 15;
      this.tmp[1] = this.tmp[1] * 14 / 15;
    }
    this.cx = game.radToSpriteFrame(this.dir, 32, 20);
    if (this.frm % 6 === 0) {
      let x = hsp.rnd(10) - 5;
      let y = hsp.rnd(10) - 5;
      game.spawnEffect(ctx, 2, -Math.cos(this.dir) * 10 + this.x + x, -Math.sin(this.dir) * 10 + this.y + y, 0);
    }
    if (this.frm > 160) {
      if (this.x < -10 || this.x > 310 || this.y < -10 || this.y > 310) {
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
