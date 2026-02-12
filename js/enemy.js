//////////敵基底クラス//////////
game.Enemy = class extends game.GameObject {
  static CLASS_MAP = [];    // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(mv, x, y) {
    super(vec2(x, y), 0);  // renderOrder=0
    this.shield = this.constructor.DATA.shield;
    this.mv = mv;
    this.x0 = x;
    this.cx = 0;
    this.lckOn = 0;
    this.initAI();
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

  // プレイヤーショットによる被弾。撃破時trueを返す
  onHitByShot() {
    this.shield--;
    if (this.shield <= 0) {
      const d = this.constructor.DATA;
      game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 5);
      this.destroy();
      return true;
    }
    return false;
  }

  // レーザーによる被弾
  onHitByLaser(damage) {
    this.shield -= damage;
    this.lckOn--;
    if (this.shield <= 0) {
      const d = this.constructor.DATA;
      game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 3);
      this.destroy();
    }
  }

  // プレイヤーとの接触
  onContactPlayer() {
    const d = this.constructor.DATA;
    game.spawnHitSparks(this.pos.x, this.pos.y, 2);
    game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 3);
    this.destroy();
  }

  // 敵出現処理（旧AprEne）
  // ※ボス出現判定は start.js 側で実行
  static appear() {
    const ctx = game.ctx;
    while (true) {
      if (ctx.enemyTableIndex === ctx.enemyTable.length) {
        return;
      }
      if (ctx.enemyTable[ctx.enemyTableIndex][0] === ctx.frame) {
        const entry = ctx.enemyTable[ctx.enemyTableIndex];
        const EnemyClass = game.Enemy.CLASS_MAP[entry[1]];
        new EnemyClass(entry[2], entry[3], entry[4]);
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
  static DATA = { shield: 2, sx: 40, sy: 80, tex: game.TEX.ENEMY0, texCy: 0 };
  static HIT = { x1: -10, y1: -30, x2: 10, y2: 30 };

  updateAI() {
    let r = 1.5 * this.frm * game.A256;
    if (this.mv === 0) {
      this.pos.x = 80 * Math.sin(r) + this.x0;
    } else {
      this.pos.x = -80 * Math.sin(r) + this.x0;
    }
    this.pos.y -= 2;
    this.cx = Math.floor(this.frm / 2) % 6 * 40;
    if (this.pos.y < -game.BOUNDS.ENEMY) {
      this.destroy();
    }
  }
};

// ki=1: 螺旋移動する敵
game.Enemy1 = class extends game.Enemy {
  static DATA = { shield: 2, sx: 80, sy: 80, tex: game.TEX.ENEMY1, texCy: 0 };
  static HIT = { x1: -20, y1: -20, x2: 20, y2: 20 };

  initAI() {
    this.angleStep = 0;
  }

  updateAI() {
    if (Math.floor(this.frm / 4) <= 64) {
      this.angleStep = this.frm >> 2;
    }
    let r;
    if (this.mv === 0) {
      r = game.DIR_DOWN - this.angleStep * game.A256;
    } else {
      r = game.DIR_DOWN + this.angleStep * game.A256;
    }
    this.pos.x += Math.cos(r) * 4;
    this.pos.y += Math.sin(r) * 4;
    this.cx = (Math.floor(Math.cos(r) * 3) + 3) * 80;
    if (this.frm === 64) {
      game.spawnEnemyShot(0, this.pos.x, this.pos.y - 40, game.DIR_DOWN);
    }
    if ((this.pos.x < -game.BOUNDS.ENEMY) || (game.BOUNDS.ENEMY < this.pos.x)) {
      this.destroy();
    }
  }
};

// ki=2: プレイヤー追尾型
game.Enemy2 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 80, sy: 80, tex: game.TEX.ENEMY2, texCy: 0 };
  static HIT = { x1: -30, y1: -30, x2: 30, y2: 30 };

  initAI() {
    this.trackDir = 0;
    this.vx = 0;
    this.vy = 0;
  }

  updateAI() {
    const ply = game.ctx.player;
    let r = this.trackDir;
    if (this.frm % 2 === 0) {
      if ((this.frm <= 160 && ply.alive) || this.frm === 0) {
        r = game.CollisionSystem.calcDir(this.pos, ply.pos);
        this.trackDir = r;
      }
      this.vx += Math.cos(r) * 0.5;
      this.vy += Math.sin(r) * 0.5;
    }
    this.pos.x += this.vx;
    this.pos.y += this.vy;
    if (this.frm % 2 === 0) {
      this.vx = this.vx * 19 / 20;
      this.vy = this.vy * 19 / 20;
    }
    if (this.frm !== 0 && this.frm % 60 === 0) {
      game.spawnEnemyShot(0, Math.cos(r) * 40 + this.pos.x, Math.sin(r) * 40 + this.pos.y, r);
    }
    this.cx = game.radToSpriteFrame(r, 32, 80);
    if (this.frm > 160) {
      if (game.isOutOfBounds(this.pos.x, this.pos.y, game.BOUNDS.ENEMY)) {
        this.destroy();
      }
    }
  }
};

// ki=3: 直進しながら弾を撃つ
game.Enemy3 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 80, sy: 120, tex: game.TEX.ENEMY3, texCy: 0 };
  static HIT = { x1: -40, y1: -40, x2: 40, y2: 40 };

  updateAI() {
    const ply = game.ctx.player;
    this.pos.y -= 4;
    if (this.frm === 40 || this.frm === 80 || this.frm === 120 || this.frm === 160) {
      const dir = game.CollisionSystem.calcDir(this.pos, ply.pos);
      game.spawnEnemyShot(1, this.pos.x, this.pos.y - 60, dir);
    }
    this.cx = 0;
    if (this.pos.y < -game.BOUNDS.ENEMY_FAR) {
      this.destroy();
    }
  }
};

// ki=4: 上昇しながら扇状弾を撃つ
game.Enemy4 = class extends game.Enemy {
  static DATA = { shield: 40, sx: 240, sy: 120, tex: game.TEX.ENEMY4, texCy: 0 };
  static HIT = { x1: -100, y1: -30, x2: 100, y2: 20 };

  initAI() {
    this.fanAngle = 0;
  }

  updateAI() {
    let r = this.frm * 0.5 * game.A256;
    this.pos.y += 1;
    this.pos.x = Math.sin(r) * 16 + this.x0;
    if (this.frm > 100 && this.frm % 16 === 0) {
      game.spawnEnemyShot(1, this.pos.x + 20, this.pos.y + 4, game.DIR_DOWN + this.fanAngle * game.A256);
      game.spawnEnemyShot(1, this.pos.x - 20, this.pos.y + 4, game.DIR_DOWN - this.fanAngle * game.A256);
      this.fanAngle += 4;
    }
    this.cx = 0;
    if (this.pos.y > game.BOUNDS.ENEMY_FAR) {
      this.destroy();
    }
  }
};

// ki=5: 円運動する敵
game.Enemy5 = class extends game.Enemy {
  static DATA = { shield: 3, sx: 80, sy: 80, tex: game.TEX.ENEMY5, texCy: 0 };
  static HIT = { x1: -30, y1: -30, x2: 30, y2: 30 };

  updateAI() {
    const ply = game.ctx.player;
    let r;
    if (this.mv === 0) {
      r = this.frm * game.A256;
    } else {
      r = (-this.frm + 128) * game.A256;
    }
    this.pos.x = Math.cos(r) * 300;
    this.pos.y = -Math.sin(r) * 300 + 300;
    // プレイヤー方向に上書き
    r = game.CollisionSystem.calcDir(this.pos, ply.pos);
    if (this.frm === 32 || this.frm === 96) {
      game.spawnEnemyShot(0, Math.cos(r) * 40 + this.pos.x, Math.sin(r) * 40 + this.pos.y, r);
    }
    this.cx = game.radToSpriteFrame(r, 32, 80);
    if (this.frm === 128) {
      this.destroy();
    }
  }
};

// ki=6: 上下に揺れながら弾を撃つ
game.Enemy6 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 80, sy: 100, tex: game.TEX.ENEMY6, texCy: 0 };
  static HIT = { x1: -30, y1: -20, x2: 30, y2: 20 };

  updateAI() {
    const ply = game.ctx.player;
    let r = this.frm * game.A256;
    this.pos.y -= Math.cos(r) * 6;
    this.cx = (Math.floor(-Math.cos(r) * 4) + 4) * 80;
    if (this.frm === 50) {
      const dir = game.CollisionSystem.calcDir(this.pos, ply.pos);
      game.spawnEnemyShot(2, this.pos.x + 20, this.pos.y - 50, dir);
      game.spawnEnemyShot(2, this.pos.x - 20, this.pos.y - 50, dir);
    }
    if (this.frm >= 256) {
      this.destroy();
    }
  }
};

// ki=7: 蛇行しながら下降、定期的に弾を撃つ
game.Enemy7 = class extends game.Enemy {
  static DATA = { shield: 2, sx: 80, sy: 120, tex: game.TEX.ENEMY7, texCy: 0 };
  static HIT = { x1: -30, y1: -50, x2: 30, y2: 50 };

  updateAI() {
    let r = this.frm * 2 * game.A256;
    if (this.mv === 0) {
      this.pos.x = 80 * Math.sin(r) + this.x0;
    } else {
      this.pos.x = -80 * Math.sin(r) + this.x0;
    }
    this.pos.y -= 2;
    if (this.frm % 32 === 0) {
      game.spawnEnemyShot(0, this.pos.x, this.pos.y - 60, game.DIR_DOWN);
    }
    this.cx = (Math.floor(this.frm / 4) & 7) * 80;
    if (this.pos.y < -game.BOUNDS.ENEMY_FAR) {
      this.destroy();
    }
  }
};

// ki=8: 直進後に分岐する敵
game.Enemy8 = class extends game.Enemy {
  static DATA = { shield: 4, sx: 80, sy: 80, tex: game.TEX.ENEMY8, texCy: 0 };
  static HIT = { x1: -30, y1: -30, x2: 30, y2: 30 };

  initAI() {
    this.angleStep = 0;
  }

  updateAI() {
    const ply = game.ctx.player;
    let r;
    if (this.frm < 60) {
      r = game.DIR_UP;
    } else {
      if (this.frm < 92) {
        this.angleStep = Math.floor((this.frm - 60) / 2) * 2;
      }
      if (this.mv === 0) {
        r = game.DIR_UP - this.angleStep * game.A256;
      } else {
        r = game.DIR_UP + this.angleStep * game.A256;
      }
    }
    this.pos.x += Math.cos(r) * 5;
    this.pos.y += Math.sin(r) * 5;
    this.cx = (Math.floor(Math.cos(r) * 3) + 3) * 80;
    if (this.frm === 60) {
      const dir = game.CollisionSystem.calcDir(this.pos, ply.pos);
      game.spawnEnemyShot(0, this.pos.x, this.pos.y, dir);
      game.spawnEnemyShot(0, this.pos.x, this.pos.y, dir + Math.PI / 8);
      game.spawnEnemyShot(0, this.pos.x, this.pos.y, dir - Math.PI / 8);
    }
    if (this.pos.x < -game.BOUNDS.ENEMY || game.BOUNDS.ENEMY < this.pos.x) {
      this.destroy();
    }
  }
};

// ki=9: 左右に揺れながら下降、回転弾を撃つ中ボス級
game.Enemy9 = class extends game.Enemy {
  static DATA = { shield: 40, sx: 120, sy: 120, tex: game.TEX.ENEMY9, texCy: 0 };
  static HIT = { x1: -50, y1: -50, x2: 50, y2: 50 };

  // moveDir: 左右移動方向（1 or -1）, bulletAngle: 回転弾の放射角度
  initAI() {
    this.moveDir = 1;
    this.bulletAngle = 0;
  }

  updateAI() {
    if (this.frm % 100 === 0) {
      this.moveDir = -this.moveDir;
    }
    this.pos.x += this.moveDir * 1;
    this.pos.y -= 1;
    if (this.frm > 100 && this.frm < 592 && this.frm % 8 === 0) {
      const baseAngle = this.bulletAngle * game.A256;
      game.spawnEnemyShot(1, this.pos.x, this.pos.y + 20, baseAngle);
      game.spawnEnemyShot(1, this.pos.x, this.pos.y + 20, baseAngle + game.DIR_DOWN);
      game.spawnEnemyShot(1, this.pos.x, this.pos.y + 20, baseAngle + Math.PI);
      game.spawnEnemyShot(1, this.pos.x, this.pos.y + 20, baseAngle + game.DIR_UP);
      this.bulletAngle -= 4;
    }
    this.cx = (Math.floor(this.frm / 4) & 7) * 120;
    if (this.pos.y < -game.BOUNDS.ENEMY_FAR) {
      this.destroy();
    }
  }
};

// CLASS_MAP 構築
game.Enemy.CLASS_MAP = [
  game.Enemy0, game.Enemy1, game.Enemy2, game.Enemy3, game.Enemy4,
  game.Enemy5, game.Enemy6, game.Enemy7, game.Enemy8, game.Enemy9,
];
