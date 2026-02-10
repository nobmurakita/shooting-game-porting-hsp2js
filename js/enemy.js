//////////敵基底クラス//////////
hsp.Enemy = class {
  static table = null;      // 出現テーブル（旧 hsp.EneTable）
  static tableIndex = 0;    // 出現テーブルインデックス
  static CLASS_MAP = [];    // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(mv, x, y) {
    this.alive = true;
    this.shield = this.constructor.DATA.shield;
    this.mv = mv;
    this.x = x;
    this.y = y;
    this.x0 = x;
    this.y0 = y;
    this.frm = 0;
    this.cx = 0;
    this.tmp = [0, 0, 0, 0, 0, 0, 0, 0];
    this.lckOn = 0;
    this.initAI();
  }

  // サブクラスでオーバーライド
  initAI() {}
  updateAI(ctx) {}

  // 敵移動
  update(ctx) {
    if (!this.alive) return;

    // --- AI移動処理（サブクラスで委譲） ---
    this.updateAI(ctx);

    this.frm++;
  }

  // 敵描画
  draw() {
    if (!this.alive) return;
    const d = this.constructor.DATA;
    hsp.pos(Math.floor(this.x) - Math.floor(d.sx / 2), Math.floor(this.y) - Math.floor(d.sy / 2));
    hsp.gcopy(4, this.cx, d.cy, d.sx, d.sy);
  }

  // 画像データ初期化（旧IniDatEne）
  static initData() {
    hsp.buffer(4, 2000, 2000);
    hsp.picload('img/enemy00.png', 0, 0);
    hsp.picload('img/enemy01.png', 0, 40);
    hsp.picload('img/enemy02.png', 0, 80);
    hsp.picload('img/enemy03.png', 0, 120);
    hsp.picload('img/enemy04.png', 0, 180);
    hsp.picload('img/enemy05.png', 0, 240);
    hsp.picload('img/enemy06.png', 0, 280);
    hsp.picload('img/enemy07.png', 0, 330);
    hsp.picload('img/enemy08.png', 0, 390);
    hsp.picload('img/enemy09.png', 0, 430);
  }

  // 敵出現処理（旧AprEne）
  static appear(ctx) {
    while (true) {
      if (ctx.boss.aprFrm === hsp.ctx.frame) {
        ctx.boss.flg = 1;
      }
      if (hsp.Enemy.tableIndex === hsp.Enemy.table.length) {
        return;
      }
      if (hsp.Enemy.table[hsp.Enemy.tableIndex][0] === hsp.ctx.frame) {
        const entry = hsp.Enemy.table[hsp.Enemy.tableIndex];
        const EnemyClass = hsp.Enemy.CLASS_MAP[entry[1]];
        ctx.enemies.push(new EnemyClass(entry[2], entry[3], entry[4]));
        hsp.Enemy.tableIndex++;
      } else {
        return;
      }
    }
  }
};

//////////敵サブクラス//////////

// ki=0: 蛇行しながら下降する雑魚
hsp.Enemy0 = class extends hsp.Enemy {
  static DATA = { shield: 2, sx: 20, sy: 40, hitX1: -5, hitY1: -15, hitX2: 5, hitY2: 15, cy: 0 };

  updateAI(ctx) {
    let r = hsp.toRad(3 * this.frm);
    if (this.mv === 0) {
      this.x = 40 * Math.sin(r) + this.x0;
    }
    if (this.mv === 1) {
      this.x = -40 * Math.sin(r) + this.x0;
    }
    this.y += 2;
    this.cx = this.frm % 6 * 20;
    if (320 < this.y) {
      this.alive = false;
    }
  }
};

// ki=1: 螺旋移動する敵
hsp.Enemy1 = class extends hsp.Enemy {
  static DATA = { shield: 2, sx: 40, sy: 40, hitX1: -10, hitY1: -10, hitX2: 10, hitY2: 10, cy: 40 };

  updateAI(ctx) {
    if (Math.floor(this.frm / 2) <= 64) {
      this.tmp[0] = this.frm >> 1;
    }
    let r;
    if (this.mv === 0) {
      r = hsp.toRad(64 + this.tmp[0]);
    }
    if (this.mv === 1) {
      r = hsp.toRad(64 - this.tmp[0]);
    }
    this.x += Math.cos(r) * 4;
    this.y += Math.sin(r) * 4;
    this.cx = Math.floor(Math.cos(r) * 3) + 120;
    if (this.frm === 32) {
      hsp.spawnEnemyShot(ctx, 0, this.x, this.y + 20, hsp.toRad(64));
    }
    if ((this.x < -20) || (320 < this.x)) {
      this.alive = false;
    }
  }
};

// ki=2: プレイヤー追尾型
hsp.Enemy2 = class extends hsp.Enemy {
  static DATA = { shield: 4, sx: 40, sy: 40, hitX1: -15, hitY1: -15, hitX2: 15, hitY2: 15, cy: 80 };

  updateAI(ctx) {
    const ply = ctx.player;
    let r = this.tmp[0];
    if ((this.frm <= 80 && ply.alive) || this.frm === 0) {
      r = hsp.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      this.tmp[0] = r;
    }
    this.tmp[1] += Math.cos(r) * 0.5;
    this.tmp[2] += Math.sin(r) * 0.5;
    this.x += this.tmp[1];
    this.y += this.tmp[2];
    this.tmp[1] = this.tmp[1] * 19 / 20;
    this.tmp[2] = this.tmp[2] * 19 / 20;
    if (this.frm !== 0 && this.frm % 30 === 0) {
      hsp.spawnEnemyShot(ctx, 0, Math.cos(r) * 20 + this.x, Math.sin(r) * 20 + this.y, r);
    }
    this.cx = Math.floor(((hsp.toAngle256(r) + 4) & 255) * 31 / 255) * 40;
    if (this.frm > 80) {
      if (this.x < -20 || this.x > 320 || this.y < -20 || this.y > 320) {
        this.alive = false;
      }
    }
  }
};

// ki=3: 直進しながら弾を撃つ
hsp.Enemy3 = class extends hsp.Enemy {
  static DATA = { shield: 4, sx: 40, sy: 60, hitX1: -20, hitY1: -20, hitX2: 20, hitY2: 20, cy: 120 };

  updateAI(ctx) {
    const ply = ctx.player;
    this.y += 4;
    if (this.frm === 20 || this.frm === 40 || this.frm === 60 || this.frm === 80) {
      const dir = hsp.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      hsp.spawnEnemyShot(ctx, 1, this.x, 30 + this.y, dir);
    }
    this.cx = 0;
    if (this.y > 330) {
      this.alive = false;
    }
  }
};

// ki=4: 上昇しながら扇状弾を撃つ
hsp.Enemy4 = class extends hsp.Enemy {
  static DATA = { shield: 40, sx: 120, sy: 60, hitX1: -50, hitY1: -10, hitX2: 50, hitY2: 15, cy: 180 };

  updateAI(ctx) {
    let r = hsp.toRad(this.frm);
    this.y -= 1;
    this.x = Math.sin(r) * 8 + this.x0;
    if (this.frm > 50 && this.frm % 8 === 0) {
      hsp.spawnEnemyShot(ctx, 1, this.x + 10, this.y - 2, hsp.toRad((64 - this.tmp[0]) & 255));
      hsp.spawnEnemyShot(ctx, 1, this.x - 10, this.y - 2, hsp.toRad((64 + this.tmp[0]) & 255));
      this.tmp[0] += 8;
    }
    this.cx = 0;
    if (this.y < -30) {
      this.alive = false;
    }
  }
};

// ki=5: 円運動する敵
hsp.Enemy5 = class extends hsp.Enemy {
  static DATA = { shield: 3, sx: 40, sy: 40, hitX1: -15, hitY1: -15, hitX2: 15, hitY2: 15, cy: 240 };

  updateAI(ctx) {
    const ply = ctx.player;
    let r;
    if (this.mv === 0) {
      r = hsp.toRad(this.frm * 2);
    } else {
      r = hsp.toRad((-this.frm * 2 + 128) & 255);
    }
    this.x = Math.cos(r) * 150 + 150;
    this.y = Math.sin(r) * 150;
    // プレイヤー方向に上書き
    r = hsp.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
    if (this.frm === 16 || this.frm === 48) {
      hsp.spawnEnemyShot(ctx, 0, Math.cos(r) * 20 + this.x, Math.sin(r) * 20 + this.y, r);
    }
    this.cx = Math.floor(((hsp.toAngle256(r) + 4) & 255) * 31 / 255) * 40;
    if (this.frm === 64) {
      this.alive = false;
    }
  }
};

// ki=6: 上下に揺れながら弾を撃つ
hsp.Enemy6 = class extends hsp.Enemy {
  static DATA = { shield: 4, sx: 40, sy: 50, hitX1: -15, hitY1: -10, hitX2: 15, hitY2: 10, cy: 280 };

  updateAI(ctx) {
    const ply = ctx.player;
    let r = hsp.toRad(this.frm * 2);
    this.y += Math.cos(r) * 6;
    this.cx = (Math.floor(-Math.cos(r) * 4) + 4) * 40;
    if (this.frm === 25) {
      const dir = hsp.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      hsp.spawnEnemyShot(ctx, 2, this.x + 10, this.y + 25, dir);
      hsp.spawnEnemyShot(ctx, 2, this.x - 10, this.y + 25, dir);
    }
    if (this.frm >= 128) {
      this.alive = false;
    }
  }
};

// ki=7: 蛇行しながら下降、定期的に弾を撃つ
hsp.Enemy7 = class extends hsp.Enemy {
  static DATA = { shield: 2, sx: 40, sy: 60, hitX1: -15, hitY1: -25, hitX2: 15, hitY2: 25, cy: 330 };

  updateAI(ctx) {
    let r = hsp.toRad((this.frm * 4) & 255);
    if (this.mv === 0) {
      this.x = 40 * Math.sin(r) + this.x0;
    }
    if (this.mv === 1) {
      this.x = -40 * Math.sin(r) + this.x0;
    }
    this.y += 2;
    if (this.frm % 16 === 0) {
      hsp.spawnEnemyShot(ctx, 0, this.x, this.y + 30, hsp.toRad(64));
    }
    this.cx = (Math.floor(this.frm / 2) & 7) * 40;
    if (this.y > 330) {
      this.alive = false;
    }
  }
};

// ki=8: 直進後に分岐する敵
hsp.Enemy8 = class extends hsp.Enemy {
  static DATA = { shield: 4, sx: 40, sy: 40, hitX1: -15, hitY1: -15, hitX2: 15, hitY2: 15, cy: 390 };

  updateAI(ctx) {
    const ply = ctx.player;
    let r;
    if (this.frm < 30) {
      r = hsp.toRad(192);
    } else {
      if (this.frm < 46) {
        this.tmp[0] = (this.frm - 30) * 2;
      }
      if (this.mv === 0) {
        r = hsp.toRad(192 + this.tmp[0]);
      }
      if (this.mv === 1) {
        r = hsp.toRad(192 - this.tmp[0]);
      }
    }
    this.x += Math.cos(r) * 5;
    this.y += Math.sin(r) * 5;
    this.cx = (Math.floor(Math.cos(r) * 3) + 3) * 40;
    if (this.frm === 30) {
      const dir = hsp.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      hsp.spawnEnemyShot(ctx, 0, this.x, this.y, dir);
      hsp.spawnEnemyShot(ctx, 0, this.x, this.y, dir + Math.PI / 8);
      hsp.spawnEnemyShot(ctx, 0, this.x, this.y, dir - Math.PI / 8);
    }
    if (this.x < -20 || 320 < this.x) {
      this.alive = false;
    }
  }
};

// ki=9: 左右に揺れながら下降、回転弾を撃つ中ボス級
hsp.Enemy9 = class extends hsp.Enemy {
  static DATA = { shield: 40, sx: 60, sy: 60, hitX1: -25, hitY1: -25, hitX2: 25, hitY2: 25, cy: 430 };

  initAI() {
    this.tmp[0] = 1;
  }

  updateAI(ctx) {
    if (this.frm % 50 === 0) {
      this.tmp[0] = -this.tmp[0];
    }
    this.x += this.tmp[0];
    this.y += 1;
    if (this.frm > 50 && this.frm < 296 && this.frm % 4 === 0) {
      hsp.spawnEnemyShot(ctx, 1, this.x, this.y - 10, hsp.toRad(this.tmp[1] & 255));
      hsp.spawnEnemyShot(ctx, 1, this.x, this.y - 10, hsp.toRad((this.tmp[1] + 64) & 255));
      hsp.spawnEnemyShot(ctx, 1, this.x, this.y - 10, hsp.toRad((this.tmp[1] + 128) & 255));
      hsp.spawnEnemyShot(ctx, 1, this.x, this.y - 10, hsp.toRad((this.tmp[1] + 192) & 255));
      this.tmp[1] += 4;
    }
    this.cx = (Math.floor(this.frm / 2) & 7) * 60;
    if (this.y > 330) {
      this.alive = false;
    }
  }
};

// CLASS_MAP 構築
hsp.Enemy.CLASS_MAP = [
  hsp.Enemy0, hsp.Enemy1, hsp.Enemy2, hsp.Enemy3, hsp.Enemy4,
  hsp.Enemy5, hsp.Enemy6, hsp.Enemy7, hsp.Enemy8, hsp.Enemy9,
];
