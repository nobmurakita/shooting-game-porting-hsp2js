import { GameObject, ctx, TEX, BOUNDS, isOutOfBounds, radToSpriteFrame, radToSpriteFrameHalf, calcDir, rnd, gameTile } from './game.js';
import { player, enemyShots, enemyShots2 } from './registry.js';
import { spawnEffect, spawnExplosion, spawnHitSparks } from './effect.js';

//////////敵ショット基底クラス//////////
export class EnemyShot extends GameObject {
  static CLASS_MAP = [];  // ki → サブクラスのマッピング（ファイル末尾で設定）

  constructor(x, y, dir) {
    super(vec2(x, y), 40);  // renderOrder=40（レーザー=50の下）
    enemyShots.add(this);
    this.dir = dir;
    this.animX = 0;
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
    enemyShots.delete(this);
    super.destroy();
  }

  // プレイヤーに命中
  onHit() {
    spawnHitSparks(this.pos.x, this.pos.y);
    this.destroy();
  }
}

//////////敵ショットサブクラス//////////

// ki=0: 通常弾（直進）
export class EnemyShot0 extends EnemyShot {
  static DATA = { sx: 40, sy: 40, tex: TEX.ENESHT, texCy: 0 };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };

  init() {
    this.animX = radToSpriteFrameHalf(this.dir, 16, 40);
  }

  update() {
    if (ctx.isPaused()) return;
    this.pos.x += Math.cos(this.dir) * 7;
    this.pos.y += Math.sin(this.dir) * 7;
    if (isOutOfBounds(this.pos.x, this.pos.y, BOUNDS.SHOT)) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=1: 照準弾（直進＋アニメーション）
export class EnemyShot1 extends EnemyShot {
  static DATA = { sx: 40, sy: 40, tex: TEX.ENESHT, texCy: 0 };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };

  update() {
    if (ctx.isPaused()) return;
    this.pos.x += Math.cos(this.dir) * 5;
    this.pos.y += Math.sin(this.dir) * 5;
    this.animX = (Math.floor(this.frame / 2) % 16) * 40 + 640;
    if (isOutOfBounds(this.pos.x, this.pos.y, BOUNDS.SHOT)) {
      this.destroy();
    }
    this.frame++;
  }
}

// ki=2: 誘導弾（追尾）
export class EnemyShot2 extends EnemyShot {
  static DATA = { sx: 40, sy: 40, tex: TEX.ENESHT, texCy: 40 };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };

  constructor(x, y, dir) {
    super(x, y, dir);
    enemyShots2.add(this);
  }

  init() {
    this.vx = 0;
    this.vy = 0;
  }

  update() {
    if (ctx.isPaused()) return;
    const ply = player;

    if (this.frame % 2 === 0) {
      if ((this.frame < 160 && ply.alive) || this.frame === 0) {
        this.dir = calcDir(this.pos, ply.pos);
      }
      this.vx += Math.cos(this.dir) * 2 / 3;
      this.vy += Math.sin(this.dir) * 2 / 3;
    }
    this.pos.x += this.vx;
    this.pos.y += this.vy;
    if (this.frame % 2 === 0) {
      this.vx = this.vx * 14 / 15;
      this.vy = this.vy * 14 / 15;
    }
    this.animX = radToSpriteFrame(this.dir, 32, 40);
    if (this.frame % 6 === 0) {
      let ox = rnd(20) - 10;
      let oy = rnd(20) - 10;
      spawnEffect(2, -Math.cos(this.dir) * 20 + this.pos.x + ox, -Math.sin(this.dir) * 20 + this.pos.y + oy, 0);
    }
    if (this.frame > 160) {
      if (isOutOfBounds(this.pos.x, this.pos.y, BOUNDS.SHOT)) {
        this.destroy();
      }
    }
    this.frame++;
  }

  destroy() {
    enemyShots2.delete(this);
    super.destroy();
  }

  // プレイヤーショットで撃破可能な誘導弾
  onHitByShot() {
    const d = this.constructor.DATA;
    spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 2);
    this.destroy();
    return true;
  }
}

// CLASS_MAP 構築
EnemyShot.CLASS_MAP = [
  EnemyShot0, EnemyShot1, EnemyShot2,
];

// 敵ショット生成ヘルパー
export function spawnEnemyShot(ki, x, y, dir) {
  const ShotClass = EnemyShot.CLASS_MAP[ki];
  if (!ShotClass) return;
  new ShotClass(x, y, dir);
}
