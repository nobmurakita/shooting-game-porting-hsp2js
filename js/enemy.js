import { GameObject, ctx, TEX, A256, BOUNDS, DIR_UP, DIR_DOWN, isOutOfBounds, radToSpriteFrame, calcDir, gameTile } from './game.js';
import { player, enemies } from './registry.js';
import { spawnEnemyShot } from './enesht.js';
import { spawnExplosion, spawnHitSparks } from './effect.js';

//////////敵基底クラス//////////
export class Enemy extends GameObject {
  static CLASS_MAP = [];    // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(moveType, x, y) {
    super(vec2(x, y), 0);  // renderOrder=0
    enemies.add(this);
    this.shield = this.constructor.DATA.shield;
    this.moveType = moveType;
    this.originX = x;
    this.animX = 0;
    this.lockOnCount = 0;
    this.init();
  }

  // サブクラスでオーバーライド
  init() {}

  render() {
    const d = this.constructor.DATA;
    const ti = gameTile(this.animX, d.texCy, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }

  destroy() {
    enemies.delete(this);
    super.destroy();
  }

  // プレイヤーショットによる被弾。撃破時trueを返す
  onHitByShot() {
    this.shield--;
    if (this.shield <= 0) {
      const d = this.constructor.DATA;
      spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 5);
      this.destroy();
      return true;
    }
    return false;
  }

  // レーザーによる被弾
  onHitByLaser() {
    this.shield -= 5;
    this.lockOnCount--;
    if (this.shield <= 0) {
      const d = this.constructor.DATA;
      spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 3);
      this.destroy();
    }
  }

  // プレイヤーとの接触
  onHitByPlayer() {
    const d = this.constructor.DATA;
    spawnHitSparks(this.pos.x, this.pos.y, 2);
    spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 3);
    this.destroy();
  }

  // 敵出現処理（旧AprEne）
  // ※ボス出現判定は init.js 側で実行
  static appear() {
    while (true) {
      if (ctx.enemyTableIndex === ctx.enemyTable.length) {
        return;
      }
      if (ctx.enemyTable[ctx.enemyTableIndex][0] === ctx.frame) {
        const entry = ctx.enemyTable[ctx.enemyTableIndex];
        const EnemyClass = Enemy.CLASS_MAP[entry[1]];
        new EnemyClass(entry[2], entry[3], entry[4]);
        ctx.enemyTableIndex++;
      } else {
        return;
      }
    }
  }
}

//////////敵サブクラス//////////

// ki=0: 蛇行しながら下降する雑魚
export class Enemy0 extends Enemy {
  static DATA = { shield: 2, sx: 40, sy: 80, tex: TEX.ENEMY0, texCy: 0 };
  static HIT = { x1: -10, y1: -30, x2: 10, y2: 30 };

  update() {
    if (ctx.isPaused()) return;
    let r = 1.5 * this.frame * A256;
    if (this.moveType === 0) {
      this.pos.x = 80 * Math.sin(r) + this.originX;
    } else {
      this.pos.x = -80 * Math.sin(r) + this.originX;
    }
    this.pos.y -= 2;
    this.animX = Math.floor(this.frame / 2) % 6 * 40;
    if (this.pos.y < -BOUNDS.ENEMY) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=1: 螺旋移動する敵
export class Enemy1 extends Enemy {
  static DATA = { shield: 2, sx: 80, sy: 80, tex: TEX.ENEMY1, texCy: 0 };
  static HIT = { x1: -20, y1: -20, x2: 20, y2: 20 };

  init() {
    this.angleStep = 0;
  }

  update() {
    if (ctx.isPaused()) return;
    if (Math.floor(this.frame / 4) <= 64) {
      this.angleStep = Math.floor(this.frame / 4);
    }
    let r;
    if (this.moveType === 0) {
      r = DIR_DOWN - this.angleStep * A256;
    } else {
      r = DIR_DOWN + this.angleStep * A256;
    }
    this.pos.x += Math.cos(r) * 4;
    this.pos.y += Math.sin(r) * 4;
    this.animX = (Math.floor(Math.cos(r) * 3) + 3) * 80;
    if (this.frame === 64) {
      spawnEnemyShot(0, this.pos.x, this.pos.y - 40, DIR_DOWN);
    }
    if ((this.pos.x < -BOUNDS.ENEMY) || (BOUNDS.ENEMY < this.pos.x)) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=2: プレイヤー追尾型
export class Enemy2 extends Enemy {
  static DATA = { shield: 4, sx: 80, sy: 80, tex: TEX.ENEMY2, texCy: 0 };
  static HIT = { x1: -30, y1: -30, x2: 30, y2: 30 };

  init() {
    this.trackDir = 0;
    this.vx = 0;
    this.vy = 0;
  }

  update() {
    if (ctx.isPaused()) return;
    let r = this.trackDir;
    if (this.frame % 2 === 0) {
      if ((this.frame <= 160 && player.alive) || this.frame === 0) {
        r = calcDir(this.pos, player.pos);
        this.trackDir = r;
      }
      this.vx += Math.cos(r) * 0.5;
      this.vy += Math.sin(r) * 0.5;
    }
    this.pos.x += this.vx;
    this.pos.y += this.vy;
    if (this.frame % 2 === 0) {
      this.vx = this.vx * 19 / 20;
      this.vy = this.vy * 19 / 20;
    }
    if (this.frame !== 0 && this.frame % 60 === 0) {
      spawnEnemyShot(0, Math.cos(r) * 40 + this.pos.x, Math.sin(r) * 40 + this.pos.y, r);
    }
    this.animX = radToSpriteFrame(r, 32, 80);
    if (this.frame > 160) {
      if (isOutOfBounds(this.pos.x, this.pos.y, BOUNDS.ENEMY)) {
        this.destroy();
      }
    }
    this.frame++;
  }
}

// ki=3: 直進しながら弾を撃つ
export class Enemy3 extends Enemy {
  static DATA = { shield: 4, sx: 80, sy: 120, tex: TEX.ENEMY3, texCy: 0 };
  static HIT = { x1: -40, y1: -40, x2: 40, y2: 40 };

  update() {
    if (ctx.isPaused()) return;
    this.pos.y -= 4;
    if (this.frame === 40 || this.frame === 80 || this.frame === 120 || this.frame === 160) {
      const dir = calcDir(this.pos, player.pos);
      spawnEnemyShot(1, this.pos.x, this.pos.y - 60, dir);
    }
    this.animX = 0;
    if (this.pos.y < -BOUNDS.ENEMY_FAR) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=4: 上昇しながら扇状弾を撃つ
export class Enemy4 extends Enemy {
  static DATA = { shield: 40, sx: 240, sy: 120, tex: TEX.ENEMY4, texCy: 0 };
  static HIT = { x1: -100, y1: -30, x2: 100, y2: 20 };

  init() {
    this.fanAngle = 0;
  }

  update() {
    if (ctx.isPaused()) return;
    let r = this.frame * 0.5 * A256;
    this.pos.y += 1;
    this.pos.x = Math.sin(r) * 16 + this.originX;
    if (this.frame > 100 && this.frame % 16 === 0) {
      spawnEnemyShot(1, this.pos.x + 20, this.pos.y + 4, DIR_DOWN + this.fanAngle * A256);
      spawnEnemyShot(1, this.pos.x - 20, this.pos.y + 4, DIR_DOWN - this.fanAngle * A256);
      this.fanAngle += 4;
    }
    this.animX = 0;
    if (this.pos.y > BOUNDS.ENEMY_FAR) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=5: 円運動する敵
export class Enemy5 extends Enemy {
  static DATA = { shield: 3, sx: 80, sy: 80, tex: TEX.ENEMY5, texCy: 0 };
  static HIT = { x1: -30, y1: -30, x2: 30, y2: 30 };

  update() {
    if (ctx.isPaused()) return;
    let r;
    if (this.moveType === 0) {
      r = this.frame * A256;
    } else {
      r = (-this.frame + 128) * A256;
    }
    this.pos.x = Math.cos(r) * 300;
    this.pos.y = -Math.sin(r) * 300 + 300;
    // プレイヤー方向に上書き
    r = calcDir(this.pos, player.pos);
    if (this.frame === 32 || this.frame === 96) {
      spawnEnemyShot(0, Math.cos(r) * 40 + this.pos.x, Math.sin(r) * 40 + this.pos.y, r);
    }
    this.animX = radToSpriteFrame(r, 32, 80);
    if (this.frame === 128) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=6: 上下に揺れながら弾を撃つ
export class Enemy6 extends Enemy {
  static DATA = { shield: 4, sx: 80, sy: 100, tex: TEX.ENEMY6, texCy: 0 };
  static HIT = { x1: -30, y1: -20, x2: 30, y2: 20 };

  update() {
    if (ctx.isPaused()) return;
    let r = this.frame * A256;
    this.pos.y -= Math.cos(r) * 6;
    this.animX = (Math.floor(-Math.cos(r) * 4) + 4) * 80;
    if (this.frame === 50) {
      const dir = calcDir(this.pos, player.pos);
      spawnEnemyShot(2, this.pos.x + 20, this.pos.y - 50, dir);
      spawnEnemyShot(2, this.pos.x - 20, this.pos.y - 50, dir);
    }
    if (this.frame >= 256) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=7: 蛇行しながら下降、定期的に弾を撃つ
export class Enemy7 extends Enemy {
  static DATA = { shield: 2, sx: 80, sy: 120, tex: TEX.ENEMY7, texCy: 0 };
  static HIT = { x1: -30, y1: -50, x2: 30, y2: 50 };

  update() {
    if (ctx.isPaused()) return;
    let r = this.frame * 2 * A256;
    if (this.moveType === 0) {
      this.pos.x = 80 * Math.sin(r) + this.originX;
    } else {
      this.pos.x = -80 * Math.sin(r) + this.originX;
    }
    this.pos.y -= 2;
    if (this.frame % 32 === 0) {
      spawnEnemyShot(0, this.pos.x, this.pos.y - 60, DIR_DOWN);
    }
    this.animX = (Math.floor(this.frame / 4) % 8) * 80;
    if (this.pos.y < -BOUNDS.ENEMY_FAR) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=8: 直進後に分岐する敵
export class Enemy8 extends Enemy {
  static DATA = { shield: 4, sx: 80, sy: 80, tex: TEX.ENEMY8, texCy: 0 };
  static HIT = { x1: -30, y1: -30, x2: 30, y2: 30 };

  init() {
    this.angleStep = 0;
  }

  update() {
    if (ctx.isPaused()) return;
    let r;
    if (this.frame < 60) {
      r = DIR_UP;
    } else {
      if (this.frame < 92) {
        this.angleStep = Math.floor((this.frame - 60) / 2) * 2;
      }
      if (this.moveType === 0) {
        r = DIR_UP - this.angleStep * A256;
      } else {
        r = DIR_UP + this.angleStep * A256;
      }
    }
    this.pos.x += Math.cos(r) * 5;
    this.pos.y += Math.sin(r) * 5;
    this.animX = (Math.floor(Math.cos(r) * 3) + 3) * 80;
    if (this.frame === 60) {
      const dir = calcDir(this.pos, player.pos);
      spawnEnemyShot(0, this.pos.x, this.pos.y, dir);
      spawnEnemyShot(0, this.pos.x, this.pos.y, dir + Math.PI / 8);
      spawnEnemyShot(0, this.pos.x, this.pos.y, dir - Math.PI / 8);
    }
    if (this.pos.x < -BOUNDS.ENEMY || BOUNDS.ENEMY < this.pos.x) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=9: 左右に揺れながら下降、回転弾を撃つ中ボス級
export class Enemy9 extends Enemy {
  static DATA = { shield: 40, sx: 120, sy: 120, tex: TEX.ENEMY9, texCy: 0 };
  static HIT = { x1: -50, y1: -50, x2: 50, y2: 50 };

  // moveDir: 左右移動方向（1 or -1）, bulletAngle: 回転弾の放射角度
  init() {
    this.moveDir = 1;
    this.bulletAngle = 0;
  }

  update() {
    if (ctx.isPaused()) return;
    if (this.frame % 100 === 0) {
      this.moveDir = -this.moveDir;
    }
    this.pos.x += this.moveDir * 1;
    this.pos.y -= 1;
    if (this.frame > 100 && this.frame < 592 && this.frame % 8 === 0) {
      const baseAngle = this.bulletAngle * A256;
      spawnEnemyShot(1, this.pos.x, this.pos.y + 20, baseAngle);
      spawnEnemyShot(1, this.pos.x, this.pos.y + 20, baseAngle + DIR_DOWN);
      spawnEnemyShot(1, this.pos.x, this.pos.y + 20, baseAngle + Math.PI);
      spawnEnemyShot(1, this.pos.x, this.pos.y + 20, baseAngle + DIR_UP);
      this.bulletAngle -= 4;
    }
    this.animX = (Math.floor(this.frame / 4) % 8) * 120;
    if (this.pos.y < -BOUNDS.ENEMY_FAR) {
      this.destroy();
    }
    this.frame++;
  }
}

// CLASS_MAP 構築
Enemy.CLASS_MAP = [
  Enemy0, Enemy1, Enemy2, Enemy3, Enemy4,
  Enemy5, Enemy6, Enemy7, Enemy8, Enemy9,
];
