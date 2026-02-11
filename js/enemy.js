//////////敵基底クラス//////////
game.Enemy = class {
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
    const ti = game.tile(this.cx, d.texCy, d.sx, d.sy, d.tex);
    drawTile(vec2(this.x, this.y), ti.drawSize, ti);
  }

  // 敵出現処理（旧AprEne）
  static appear(ctx) {
    while (true) {
      if (ctx.boss.aprFrm === ctx.frame) {
        ctx.boss.flg = game.BOSS_BATTLE;
      }
      if (ctx.enemyTableIndex === ctx.enemyTable.length) {
        return;
      }
      if (ctx.enemyTable[ctx.enemyTableIndex][0] === ctx.frame) {
        const entry = ctx.enemyTable[ctx.enemyTableIndex];
        const EnemyClass = game.Enemy.CLASS_MAP[entry[1]];
        ctx.enemies.push(new EnemyClass(entry[2], entry[3], entry[4]));
        ctx.enemyTableIndex++;
      } else {
        return;
      }
    }
  }
};

//////////敵サブクラス//////////

// ki=0: 蛇行しながら下降する雑魚
game.Enemy0 = class extends game.Enemy {
  static DATA = { shield: 2, sx: 40, sy: 80, hitX1: -10, hitY1: -30, hitX2: 10, hitY2: 30, tex: game.TEX.ENEMY0, texCy: 0 };

  updateAI(ctx) {
    let r = 1.5 * this.frm * game.A256;
    if (this.mv === 0) {
      this.x = 80 * Math.sin(r) + this.x0;
    } else {
      this.x = -80 * Math.sin(r) + this.x0;
    }
    this.y -= 2;
    this.cx = Math.floor(this.frm / 2) % 6 * 40;
    if (this.y < -game.BOUNDS.ENEMY) {
      this.alive = false;
    }
  }
};

// ki=1: 螺旋移動する敵
game.Enemy1 = class extends game.Enemy {
  static DATA = { shield: 2, sx: 80, sy: 80, hitX1: -20, hitY1: -20, hitX2: 20, hitY2: 20, tex: game.TEX.ENEMY1, texCy: 0 };

  initAI() {
    this.angleStep = 0;
  }

  updateAI(ctx) {
    if (Math.floor(this.frm / 4) <= 64) {
      this.angleStep = this.frm >> 2;
    }
    let r;
    if (this.mv === 0) {
      r = game.DIR_DOWN - this.angleStep * game.A256;
    } else {
      r = game.DIR_DOWN + this.angleStep * game.A256;
    }
    this.x += Math.cos(r) * 4;
    this.y += Math.sin(r) * 4;
    this.cx = Math.floor(Math.cos(r) * 6) + 240;
    if (this.frm === 64) {
      game.spawnEnemyShot(ctx, 0, this.x, this.y - 40, game.DIR_DOWN);
    }
    if ((this.x < -game.BOUNDS.ENEMY) || (game.BOUNDS.ENEMY < this.x)) {
      this.alive = false;
    }
  }
};

// ki=2: プレイヤー追尾型
game.Enemy2 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 80, sy: 80, hitX1: -30, hitY1: -30, hitX2: 30, hitY2: 30, tex: game.TEX.ENEMY2, texCy: 0 };

  initAI() {
    this.trackDir = 0;
    this.vx = 0;
    this.vy = 0;
  }

  updateAI(ctx) {
    const ply = ctx.player;
    let r = this.trackDir;
    if (this.frm % 2 === 0) {
      if ((this.frm <= 160 && ply.alive) || this.frm === 0) {
        r = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
        this.trackDir = r;
      }
      this.vx += Math.cos(r) * 0.5;
      this.vy += Math.sin(r) * 0.5;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.frm % 2 === 0) {
      this.vx = this.vx * 19 / 20;
      this.vy = this.vy * 19 / 20;
    }
    if (this.frm !== 0 && this.frm % 60 === 0) {
      game.spawnEnemyShot(ctx, 0, Math.cos(r) * 40 + this.x, Math.sin(r) * 40 + this.y, r);
    }
    this.cx = game.radToSpriteFrame(r, 32, 80);
    if (this.frm > 160) {
      if (game.isOutOfBounds(this.x, this.y, game.BOUNDS.ENEMY)) {
        this.alive = false;
      }
    }
  }
};

// ki=3: 直進しながら弾を撃つ
game.Enemy3 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 80, sy: 120, hitX1: -40, hitY1: -40, hitX2: 40, hitY2: 40, tex: game.TEX.ENEMY3, texCy: 0 };

  updateAI(ctx) {
    const ply = ctx.player;
    this.y -= 4;
    if (this.frm === 40 || this.frm === 80 || this.frm === 120 || this.frm === 160) {
      const dir = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      game.spawnEnemyShot(ctx, 1, this.x, this.y - 60, dir);
    }
    this.cx = 0;
    if (this.y < -game.BOUNDS.ENEMY_FAR) {
      this.alive = false;
    }
  }
};

// ki=4: 上昇しながら扇状弾を撃つ
game.Enemy4 = class extends game.Enemy {
  static DATA = { shield: 40, sx: 240, sy: 120, hitX1: -100, hitY1: -30, hitX2: 100, hitY2: 20, tex: game.TEX.ENEMY4, texCy: 0 };

  initAI() {
    this.fanAngle = 0;
  }

  updateAI(ctx) {
    let r = this.frm * 0.5 * game.A256;
    this.y += 1;
    this.x = Math.sin(r) * 16 + this.x0;
    if (this.frm > 100 && this.frm % 16 === 0) {
      game.spawnEnemyShot(ctx, 1, this.x + 20, this.y + 4, game.DIR_DOWN + this.fanAngle * game.A256);
      game.spawnEnemyShot(ctx, 1, this.x - 20, this.y + 4, game.DIR_DOWN - this.fanAngle * game.A256);
      this.fanAngle += 4;
    }
    this.cx = 0;
    if (this.y > game.BOUNDS.ENEMY_FAR) {
      this.alive = false;
    }
  }
};

// ki=5: 円運動する敵
game.Enemy5 = class extends game.Enemy {
  static DATA = { shield: 3, sx: 80, sy: 80, hitX1: -30, hitY1: -30, hitX2: 30, hitY2: 30, tex: game.TEX.ENEMY5, texCy: 0 };

  updateAI(ctx) {
    const ply = ctx.player;
    let r;
    if (this.mv === 0) {
      r = this.frm * game.A256;
    } else {
      r = (-this.frm + 128) * game.A256;
    }
    this.x = Math.cos(r) * 300;
    this.y = -Math.sin(r) * 300 + 300;
    // プレイヤー方向に上書き
    r = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
    if (this.frm === 32 || this.frm === 96) {
      game.spawnEnemyShot(ctx, 0, Math.cos(r) * 40 + this.x, Math.sin(r) * 40 + this.y, r);
    }
    this.cx = game.radToSpriteFrame(r, 32, 80);
    if (this.frm === 128) {
      this.alive = false;
    }
  }
};

// ki=6: 上下に揺れながら弾を撃つ
game.Enemy6 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 80, sy: 100, hitX1: -30, hitY1: -20, hitX2: 30, hitY2: 20, tex: game.TEX.ENEMY6, texCy: 0 };

  updateAI(ctx) {
    const ply = ctx.player;
    let r = this.frm * game.A256;
    this.y -= Math.cos(r) * 6;
    this.cx = (Math.floor(-Math.cos(r) * 4) + 4) * 80;
    if (this.frm === 50) {
      const dir = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      game.spawnEnemyShot(ctx, 2, this.x + 20, this.y - 50, dir);
      game.spawnEnemyShot(ctx, 2, this.x - 20, this.y - 50, dir);
    }
    if (this.frm >= 256) {
      this.alive = false;
    }
  }
};

// ki=7: 蛇行しながら下降、定期的に弾を撃つ
game.Enemy7 = class extends game.Enemy {
  static DATA = { shield: 2, sx: 80, sy: 120, hitX1: -30, hitY1: -50, hitX2: 30, hitY2: 50, tex: game.TEX.ENEMY7, texCy: 0 };

  updateAI(ctx) {
    let r = this.frm * 2 * game.A256;
    if (this.mv === 0) {
      this.x = 80 * Math.sin(r) + this.x0;
    } else {
      this.x = -80 * Math.sin(r) + this.x0;
    }
    this.y -= 2;
    if (this.frm % 32 === 0) {
      game.spawnEnemyShot(ctx, 0, this.x, this.y - 60, game.DIR_DOWN);
    }
    this.cx = (Math.floor(this.frm / 4) & 7) * 80;
    if (this.y < -game.BOUNDS.ENEMY_FAR) {
      this.alive = false;
    }
  }
};

// ki=8: 直進後に分岐する敵
game.Enemy8 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 80, sy: 80, hitX1: -30, hitY1: -30, hitX2: 30, hitY2: 30, tex: game.TEX.ENEMY8, texCy: 0 };

  initAI() {
    this.angleStep = 0;
  }

  updateAI(ctx) {
    const ply = ctx.player;
    let r;
    if (this.frm < 60) {
      r = game.DIR_UP;
    } else {
      if (this.frm < 92) {
        this.angleStep = (this.frm - 60);
      }
      if (this.mv === 0) {
        r = game.DIR_UP - this.angleStep * game.A256;
      } else {
        r = game.DIR_UP + this.angleStep * game.A256;
      }
    }
    this.x += Math.cos(r) * 5;
    this.y += Math.sin(r) * 5;
    this.cx = (Math.floor(Math.cos(r) * 3) + 3) * 80;
    if (this.frm === 60) {
      const dir = game.CollisionSystem.calcDir(this.x, this.y, ply.x, ply.y);
      game.spawnEnemyShot(ctx, 0, this.x, this.y, dir);
      game.spawnEnemyShot(ctx, 0, this.x, this.y, dir + Math.PI / 8);
      game.spawnEnemyShot(ctx, 0, this.x, this.y, dir - Math.PI / 8);
    }
    if (this.x < -game.BOUNDS.ENEMY || game.BOUNDS.ENEMY < this.x) {
      this.alive = false;
    }
  }
};

// ki=9: 左右に揺れながら下降、回転弾を撃つ中ボス級
game.Enemy9 = class extends game.Enemy {
  static DATA = { shield: 40, sx: 120, sy: 120, hitX1: -50, hitY1: -50, hitX2: 50, hitY2: 50, tex: game.TEX.ENEMY9, texCy: 0 };

  // moveDir: 左右移動方向（1 or -1）, bulletAngle: 回転弾の放射角度
  initAI() {
    this.moveDir = 1;
    this.bulletAngle = 0;
  }

  updateAI(ctx) {
    if (this.frm % 100 === 0) {
      this.moveDir = -this.moveDir;
    }
    this.x += this.moveDir * 1;
    this.y -= 1;
    if (this.frm > 100 && this.frm < 592 && this.frm % 8 === 0) {
      const baseAngle = this.bulletAngle * game.A256;
      game.spawnEnemyShot(ctx, 1, this.x, this.y + 20, baseAngle);
      game.spawnEnemyShot(ctx, 1, this.x, this.y + 20, baseAngle + game.DIR_DOWN);
      game.spawnEnemyShot(ctx, 1, this.x, this.y + 20, baseAngle + Math.PI);
      game.spawnEnemyShot(ctx, 1, this.x, this.y + 20, baseAngle + game.DIR_UP);
      this.bulletAngle -= 2;
    }
    this.cx = (Math.floor(this.frm / 2) & 7) * 120;
    if (this.y < -game.BOUNDS.ENEMY_FAR) {
      this.alive = false;
    }
  }
};

// CLASS_MAP 構築
game.Enemy.CLASS_MAP = [
  game.Enemy0, game.Enemy1, game.Enemy2, game.Enemy3, game.Enemy4,
  game.Enemy5, game.Enemy6, game.Enemy7, game.Enemy8, game.Enemy9,
];
