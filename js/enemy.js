//////////敵基底クラス//////////
game.Enemy = class {
  static BUF = 4;           // 描画バッファ番号
  static table = null;      // 出現テーブル
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
    hsp.gcopy(game.Enemy.BUF, this.cx, d.cy, d.sx, d.sy);
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
      if (ctx.boss.aprFrm === game.ctx.frame) {
        ctx.boss.flg = game.BOSS_BATTLE;
      }
      if (game.Enemy.tableIndex === game.Enemy.table.length) {
        return;
      }
      if (game.Enemy.table[game.Enemy.tableIndex][0] === game.ctx.frame) {
        const entry = game.Enemy.table[game.Enemy.tableIndex];
        const EnemyClass = game.Enemy.CLASS_MAP[entry[1]];
        ctx.enemies.push(new EnemyClass(entry[2], entry[3], entry[4]));
        game.Enemy.tableIndex++;
      } else {
        return;
      }
    }
  }
};

//////////敵サブクラス//////////

// ki=0: 蛇行しながら下降する雑魚
game.Enemy0 = class extends game.Enemy {
  static DATA = { shield: 2, sx: 20, sy: 40, hitX1: -5, hitY1: -15, hitX2: 5, hitY2: 15, cy: 0 };

  updateAI(ctx) {
    let r = 1.5 * this.frm * game.A256;
    if (this.mv === 0) {
      this.x = 40 * Math.sin(r) + this.x0;
    }
    if (this.mv === 1) {
      this.x = -40 * Math.sin(r) + this.x0;
    }
    this.y += 1;
    this.cx = Math.floor(this.frm / 2) % 6 * 20;
    if (320 < this.y) {
      this.alive = false;
    }
  }
};

// ki=1: 螺旋移動する敵
game.Enemy1 = class extends game.Enemy {
  static DATA = { shield: 2, sx: 40, sy: 40, hitX1: -10, hitY1: -10, hitX2: 10, hitY2: 10, cy: 40 };

  // tmp[0]: 螺旋移動の角度カウンタ
  updateAI(ctx) {
    if (Math.floor(this.frm / 4) <= 64) {
      this.tmp[0] = this.frm >> 2;
    }
    let r;
    if (this.mv === 0) {
      r = game.DIR_DOWN + this.tmp[0] * game.A256;
    }
    if (this.mv === 1) {
      r = game.DIR_DOWN - this.tmp[0] * game.A256;
    }
    this.x += Math.cos(r) * 2;
    this.y += Math.sin(r) * 2;
    this.cx = Math.floor(Math.cos(r) * 3) + 120;
    if (this.frm === 64) {
      game.spawnEnemyShot(ctx, 0, this.x, this.y + 20, game.DIR_DOWN);
    }
    if ((this.x < -20) || (320 < this.x)) {
      this.alive = false;
    }
  }
};

// ki=2: プレイヤー追尾型
game.Enemy2 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 40, sy: 40, hitX1: -15, hitY1: -15, hitX2: 15, hitY2: 15, cy: 80 };

  // tmp[0]: 追尾方向（ラジアン）, tmp[1]: X速度, tmp[2]: Y速度
  updateAI(ctx) {
    const ply = ctx.player;
    let r = this.tmp[0];
    if (this.frm % 2 === 0) {
      if ((this.frm <= 160 && ply.alive) || this.frm === 0) {
        r = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
        this.tmp[0] = r;
      }
      this.tmp[1] += Math.cos(r) * 0.25;
      this.tmp[2] += Math.sin(r) * 0.25;
    }
    this.x += this.tmp[1];
    this.y += this.tmp[2];
    if (this.frm % 2 === 0) {
      this.tmp[1] = this.tmp[1] * 19 / 20;
      this.tmp[2] = this.tmp[2] * 19 / 20;
    }
    if (this.frm !== 0 && this.frm % 60 === 0) {
      game.spawnEnemyShot(ctx, 0, Math.cos(r) * 20 + this.x, Math.sin(r) * 20 + this.y, r);
    }
    this.cx = game.radToSpriteFrame(r, 32, 40);
    if (this.frm > 160) {
      if (this.x < -20 || this.x > 320 || this.y < -20 || this.y > 320) {
        this.alive = false;
      }
    }
  }
};

// ki=3: 直進しながら弾を撃つ
game.Enemy3 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 40, sy: 60, hitX1: -20, hitY1: -20, hitX2: 20, hitY2: 20, cy: 120 };

  updateAI(ctx) {
    const ply = ctx.player;
    this.y += 2;
    if (this.frm === 40 || this.frm === 80 || this.frm === 120 || this.frm === 160) {
      const dir = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      game.spawnEnemyShot(ctx, 1, this.x, 30 + this.y, dir);
    }
    this.cx = 0;
    if (this.y > 330) {
      this.alive = false;
    }
  }
};

// ki=4: 上昇しながら扇状弾を撃つ
game.Enemy4 = class extends game.Enemy {
  static DATA = { shield: 40, sx: 120, sy: 60, hitX1: -50, hitY1: -10, hitX2: 50, hitY2: 15, cy: 180 };

  // tmp[0]: 扇状弾の放射角度オフセット（8ずつ拡大）
  updateAI(ctx) {
    let r = this.frm * 0.5 * game.A256;
    this.y -= 0.5;
    this.x = Math.sin(r) * 8 + this.x0;
    if (this.frm > 100 && this.frm % 16 === 0) {
      game.spawnEnemyShot(ctx, 1, this.x + 10, this.y - 2, game.DIR_DOWN - this.tmp[0] * game.A256);
      game.spawnEnemyShot(ctx, 1, this.x - 10, this.y - 2, game.DIR_DOWN + this.tmp[0] * game.A256);
      this.tmp[0] += 4;
    }
    this.cx = 0;
    if (this.y < -30) {
      this.alive = false;
    }
  }
};

// ki=5: 円運動する敵
game.Enemy5 = class extends game.Enemy {
  static DATA = { shield: 3, sx: 40, sy: 40, hitX1: -15, hitY1: -15, hitX2: 15, hitY2: 15, cy: 240 };

  updateAI(ctx) {
    const ply = ctx.player;
    let r;
    if (this.mv === 0) {
      r = this.frm * game.A256;
    } else {
      r = (-this.frm + 128) * game.A256;
    }
    this.x = Math.cos(r) * 150 + 150;
    this.y = Math.sin(r) * 150;
    // プレイヤー方向に上書き
    r = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
    if (this.frm === 32 || this.frm === 96) {
      game.spawnEnemyShot(ctx, 0, Math.cos(r) * 20 + this.x, Math.sin(r) * 20 + this.y, r);
    }
    this.cx = game.radToSpriteFrame(r, 32, 40);
    if (this.frm === 128) {
      this.alive = false;
    }
  }
};

// ki=6: 上下に揺れながら弾を撃つ
game.Enemy6 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 40, sy: 50, hitX1: -15, hitY1: -10, hitX2: 15, hitY2: 10, cy: 280 };

  updateAI(ctx) {
    const ply = ctx.player;
    let r = this.frm * game.A256;
    this.y += Math.cos(r) * 3;
    this.cx = (Math.floor(-Math.cos(r) * 4) + 4) * 40;
    if (this.frm === 50) {
      const dir = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      game.spawnEnemyShot(ctx, 2, this.x + 10, this.y + 25, dir);
      game.spawnEnemyShot(ctx, 2, this.x - 10, this.y + 25, dir);
    }
    if (this.frm >= 256) {
      this.alive = false;
    }
  }
};

// ki=7: 蛇行しながら下降、定期的に弾を撃つ
game.Enemy7 = class extends game.Enemy {
  static DATA = { shield: 2, sx: 40, sy: 60, hitX1: -15, hitY1: -25, hitX2: 15, hitY2: 25, cy: 330 };

  updateAI(ctx) {
    let r = this.frm * 2 * game.A256;
    if (this.mv === 0) {
      this.x = 40 * Math.sin(r) + this.x0;
    }
    if (this.mv === 1) {
      this.x = -40 * Math.sin(r) + this.x0;
    }
    this.y += 1;
    if (this.frm % 32 === 0) {
      game.spawnEnemyShot(ctx, 0, this.x, this.y + 30, game.DIR_DOWN);
    }
    this.cx = (Math.floor(this.frm / 4) & 7) * 40;
    if (this.y > 330) {
      this.alive = false;
    }
  }
};

// ki=8: 直進後に分岐する敵
game.Enemy8 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 40, sy: 40, hitX1: -15, hitY1: -15, hitX2: 15, hitY2: 15, cy: 390 };

  // tmp[0]: 分岐方向の角度オフセット
  updateAI(ctx) {
    const ply = ctx.player;
    let r;
    if (this.frm < 60) {
      r = game.DIR_UP;
    } else {
      if (this.frm < 92) {
        this.tmp[0] = (this.frm - 60);
      }
      if (this.mv === 0) {
        r = game.DIR_UP + this.tmp[0] * game.A256;
      }
      if (this.mv === 1) {
        r = game.DIR_UP - this.tmp[0] * game.A256;
      }
    }
    this.x += Math.cos(r) * 2.5;
    this.y += Math.sin(r) * 2.5;
    this.cx = (Math.floor(Math.cos(r) * 3) + 3) * 40;
    if (this.frm === 60) {
      const dir = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      game.spawnEnemyShot(ctx, 0, this.x, this.y, dir);
      game.spawnEnemyShot(ctx, 0, this.x, this.y, dir + Math.PI / 8);
      game.spawnEnemyShot(ctx, 0, this.x, this.y, dir - Math.PI / 8);
    }
    if (this.x < -20 || 320 < this.x) {
      this.alive = false;
    }
  }
};

// ki=9: 左右に揺れながら下降、回転弾を撃つ中ボス級
game.Enemy9 = class extends game.Enemy {
  static DATA = { shield: 40, sx: 60, sy: 60, hitX1: -25, hitY1: -25, hitX2: 25, hitY2: 25, cy: 430 };

  // tmp[0]: 左右移動方向（1 or -1）, tmp[1]: 回転弾の放射角度
  initAI() {
    this.tmp[0] = 1;
  }

  updateAI(ctx) {
    if (this.frm % 100 === 0) {
      this.tmp[0] = -this.tmp[0];
    }
    this.x += this.tmp[0] * 0.5;
    this.y += 0.5;
    if (this.frm > 100 && this.frm < 592 && this.frm % 8 === 0) {
      const baseAngle = this.tmp[1] * game.A256;
      game.spawnEnemyShot(ctx, 1, this.x, this.y - 10, baseAngle);
      game.spawnEnemyShot(ctx, 1, this.x, this.y - 10, baseAngle + game.DIR_DOWN);
      game.spawnEnemyShot(ctx, 1, this.x, this.y - 10, baseAngle + Math.PI);
      game.spawnEnemyShot(ctx, 1, this.x, this.y - 10, baseAngle + game.DIR_UP);
      this.tmp[1] += 2;
    }
    this.cx = (Math.floor(this.frm / 2) & 7) * 60;
    if (this.y > 330) {
      this.alive = false;
    }
  }
};

// CLASS_MAP 構築
game.Enemy.CLASS_MAP = [
  game.Enemy0, game.Enemy1, game.Enemy2, game.Enemy3, game.Enemy4,
  game.Enemy5, game.Enemy6, game.Enemy7, game.Enemy8, game.Enemy9,
];
