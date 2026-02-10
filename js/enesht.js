;//////////敵ショット基底クラス//////////
hsp.EnemyShot = class {
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, dir) {
    this.alive = true;
    this.ki = this.constructor.KI;
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

    const d = this.constructor.DATA;
    const ply = ctx.player;

    // --- AI移動処理（サブクラスで委譲） ---
    this.updateAI(ctx);

    this.frm++;

    // プレイヤーとの衝突判定
    if (ply.hitCnt !== 0) return;
    if (!this.alive) return;

    if (hsp.CollisionSystem.checkAABB(
      d.hitX1 + this.x, d.hitY1 + this.y, d.hitX2 + this.x, d.hitY2 + this.y,
      ply.x - 5, ply.y - 5, ply.x + 5, ply.y + 5
    )) {
      this.alive = false;
      ply.shield--;
      ply.hitCnt = 50;
      for (let j = 0; j < 2; j++) {
        let x = hsp.rnd(10) - 5;
        let y = hsp.rnd(10) - 5;
        hsp.spawnEffect(ctx, 1, this.x + x, this.y + y, -j * 3);
      }
      if (ply.shield === 0) {
        ply.alive = false;
        for (let j = 0; j < 3; j++) {
          let x = hsp.rnd(40) - 20;
          let y = hsp.rnd(40) - 20;
          hsp.spawnEffect(ctx, 0, ply.x + x, ply.y + y, -j * 3);
        }
      }
    }
  }

  draw() {
    if (!this.alive) return;
    const d = this.constructor.DATA;
    hsp.pos(Math.floor(this.x) - Math.floor(d.sx / 2), Math.floor(this.y) - Math.floor(d.sy / 2));
    hsp.gcopy(3, this.cx, d.cy, d.sx, d.sy);
  }
};

;//////////敵ショットサブクラス//////////

;// ki=0: 通常弾（直進）
hsp.EnemyShot0 = class extends hsp.EnemyShot {
  static KI = 0;
  static DATA = { sx: 20, sy: 20, hitX1: -5, hitY1: -5, hitX2: 5, hitY2: 5, cy: 130 };

  initAI() {
    let a = hsp.toAngle256(this.dir);
    this.cx = Math.floor(((a + 4) & 127) * 15 / 127) * 20;
  }

  updateAI(ctx) {
    this.x += Math.cos(this.dir) * 7;
    this.y += Math.sin(this.dir) * 7;
    if (this.x < -10 || this.x > 310 || this.y < -10 || this.y > 310) {
      this.alive = false;
    }
  }
};

;// ki=1: 照準弾（直進＋アニメーション）
hsp.EnemyShot1 = class extends hsp.EnemyShot {
  static KI = 1;
  static DATA = { sx: 20, sy: 20, hitX1: -5, hitY1: -5, hitX2: 5, hitY2: 5, cy: 130 };

  updateAI(ctx) {
    this.x += Math.cos(this.dir) * 5;
    this.y += Math.sin(this.dir) * 5;
    this.cx = (this.frm % 16) * 20 + 320;
    if (this.x < -10 || this.x > 310 || this.y < -10 || this.y > 310) {
      this.alive = false;
    }
  }
};

;// ki=2: 誘導弾（追尾＋プレイヤーショット衝突判定）
hsp.EnemyShot2 = class extends hsp.EnemyShot {
  static KI = 2;
  static DATA = { sx: 20, sy: 20, hitX1: -5, hitY1: -5, hitX2: 5, hitY2: 5, cy: 150 };

  updateAI(ctx) {
    const ply = ctx.player;
    const d = this.constructor.DATA;

    if ((this.frm < 80 && ply.alive) || this.frm === 0) {
      this.dir = hsp.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
    }
    this.tmp[0] += Math.cos(this.dir) * 2 / 3;
    this.tmp[1] += Math.sin(this.dir) * 2 / 3;
    this.x += this.tmp[0];
    this.y += this.tmp[1];
    this.tmp[0] = this.tmp[0] * 14 / 15;
    this.tmp[1] = this.tmp[1] * 14 / 15;
    let a = hsp.toAngle256(this.dir);
    this.cx = Math.floor(((a + 4) & 255) * 31 / 255) * 20;
    if (this.frm % 3 === 0) {
      let x = hsp.rnd(10) - 5;
      let y = hsp.rnd(10) - 5;
      hsp.spawnEffect(ctx, 2, -Math.cos(this.dir) * 10 + this.x + x, -Math.sin(this.dir) * 10 + this.y + y, 0);
    }
    // プレイヤーショットとの衝突判定
    for (let j = 0; j < hsp.PlayerShot.MAX; j++) {
      const ps = ctx.playerShots[j];
      if (!ps.alive) continue;
      if (hsp.CollisionSystem.checkAABB(
        d.hitX1 + this.x, d.hitY1 + this.y, d.hitX2 + this.x, d.hitY2 + this.y,
        ps.x - 5, ps.y - 10, ps.x + 5, ps.y + 10
      )) {
        hsp.Score += 10;
        ps.alive = false;
        this.alive = false;
        let x = hsp.rnd(10) - 5;
        let y = hsp.rnd(10) - 5;
        hsp.spawnEffect(ctx, 1, ps.x + x, ps.y + y, 0);
        for (let k = 0; k < 2; k++) {
          let x = hsp.rnd(d.sx) - Math.floor(d.sx / 2);
          let y = hsp.rnd(d.sy) - Math.floor(d.sy / 2);
          hsp.spawnEffect(ctx, 0, this.x + x, this.y + y, -k * 3);
        }
        break;
      }
    }
    if (this.frm > 80) {
      if (this.x < -10 || this.x > 310 || this.y < -10 || this.y > 310) {
        this.alive = false;
      }
    }
  }
};

;// CLASS_MAP 構築
hsp.EnemyShot.CLASS_MAP = [
  hsp.EnemyShot0, hsp.EnemyShot1, hsp.EnemyShot2,
];

;// 敵ショット生成ヘルパー
hsp.spawnEnemyShot = (ctx, ki, x, y, dir) => {
  const ShotClass = hsp.EnemyShot.CLASS_MAP[ki];
  ctx.enemyShots.push(new ShotClass(x, y, dir));
};
