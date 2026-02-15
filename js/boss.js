import { GameObject, ctx, TEX, A256, DIR_DOWN, STA_PLAY, STA_CLEAR, BOSS_STATE_NONE, BOSS_STATE_BATTLE, BOSS_STATE_DESTROY, rnd, calcDir, gameTile } from './game.js';
import { player, bossParts, setBoss } from './registry.js';
import { spawnEnemyShot } from './enesht.js';
import { spawnEffect, spawnExplosion } from './effect.js';

//////////ボスクラス//////////
export class Boss extends GameObject {
  static MAX_PARTS = 3;

  constructor() {
    super(vec2(0, 500), 5);  // renderOrder=5（敵=0の上、PlayerShot=10の下）
    setBoss(this);
    this.flg = BOSS_STATE_NONE;
    this.shield = 500;
    this.appearFrame = 4900;
    this.destroyFrame = 0;  // 破壊演出開始時のframe（経過フレーム算出用）
    this.parts = [new BossPart0(), new BossPart1(), new BossPart2()];
    for (const prt of this.parts) {
      this.addChild(prt, vec2(prt.constructor.DATA.x, prt.constructor.DATA.y));
    }
  }

  // ボス移動（旧MovBoss）
  update() {
    if (ctx.gameSta !== STA_PLAY) return;

    // 破壊演出（flg==2）
    if (this.flg === BOSS_STATE_DESTROY) {
      this.frame++; // 破壊演出は旧コードでfrm先行インクリメントのため先に実行
      this.updateDestroy();
      return;
    }

    if (this.flg !== BOSS_STATE_BATTLE) return;

    // ステージ1のボスAI
    if (ctx.stage === 1) {
      if (this.frame < 400) {
        this.updateApproach();
      } else {
        this.updateBattle();
      }
    }

    this.frame++;
  }

  // 破壊演出（爆発・揺れ・クリア遷移）
  updateDestroy() {
    const elapsed = this.frame - this.destroyFrame;
    for (let i = 0; i < Boss.MAX_PARTS; i++) {
      this.parts[i].animX = this.parts[i].constructor.DATA.sx;
    }
    if (elapsed % 6 === 0) {
      let x = rnd(100) - 50;
      let y = rnd(100) - 50;
      spawnEffect(0, this.pos.x + x, this.pos.y + y, 0);
    }
    const x = rnd(1024) / 256 - 2;
    const y = rnd(256) / 256 - 0.5;
    this.pos.x += x;
    this.pos.y -= (y + 1);
    if (elapsed === 100) {
      for (let i = 0; i < 3; i++) {
        const a = (i + 1) * 50;
        const t = -i * 2;
        for (let j = 0; j < 16; j++) {
          const r = j * Math.PI / 8;
          spawnEffect(0, a * Math.cos(r) + this.pos.x, a * Math.sin(r) + this.pos.y, t);
        }
      }
    }
    if (elapsed === 120) {
      ctx.gameSta = STA_CLEAR;
      this.destroy();
    }
  }

  // 初期降下
  updateApproach() {
    this.pos.y -= 1;
  }

  // 移動パターン＆攻撃パターン
  updateBattle() {
    const a = Math.floor((this.frame - 400) / 256) % 4;

    if (a === 0 || a === 3) {
      this.pos.x -= 1;
    } else {
      this.pos.x += 1;
    }

    const r = this.frame * 0.5 * A256;
    this.pos.y -= Math.sin(r) * 1;

    // 誘導弾発射（パーツ1,2）
    if ((this.frame - 400) % 256 < 64 && (this.frame - 400) % 16 === 0) {
      if (this.parts[1].alive) {
        spawnEnemyShot(2, -80 + this.pos.x, this.pos.y, r);
      }
      if (this.parts[2].alive) {
        spawnEnemyShot(2, 80 + this.pos.x, this.pos.y, r);
      }
    }
    // 照準弾発射
    if ((this.frame - 400) % 256 < 64 && (this.frame - 400) % 8 === 0) {
      const dir = calcDir(this.pos, player.pos);
      spawnEnemyShot(1, this.pos.x, this.pos.y + 40, dir);
    }
    // 通常弾発射
    if ((this.frame - 400) % 64 === 63) {
      spawnEnemyShot(0, -10 + this.pos.x, this.pos.y - 50, DIR_DOWN);
      spawnEnemyShot(0, 10 + this.pos.x, this.pos.y - 50, DIR_DOWN);
    }
  }

  destroy() {
    setBoss(null);
    super.destroy();
  }

  // パーツは子EngineObjectとして自動描画
}

//////////ボスパーツクラス//////////
export class BossPart extends GameObject {
  constructor() {
    super(vec2(), 5);  // renderOrder=5、位置はBossの子として自動設定
    bossParts.add(this);
    this.shield = this.constructor.DATA.shield;
    this.animX = 0;
    this.lockOnCount = 0;
  }

  render() {
    if (!this.parent || this.parent.flg === BOSS_STATE_NONE) return;
    const d = this.constructor.DATA;
    const ti = gameTile(this.animX, d.texCy, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }

  destroy() {
    bossParts.delete(this);
    super.destroy();
  }

  // プレイヤーショットによる被弾。パーツ破壊時trueを返す
  onHitByShot() {
    const boss = this.parent;
    boss.shield--;
    this.shield--;
    if (boss.shield <= 0) {
      boss.flg = BOSS_STATE_DESTROY;
      boss.destroyFrame = boss.frame;
    }
    if (this.shield <= 0) {
      this.alive = false;
      const d = this.constructor.DATA;
      this.animX = d.sx;
      spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 5);
      return true;
    }
    return false;
  }

  // レーザーによる被弾
  onHitByLaser() {
    const boss = this.parent;
    boss.shield -= 5;
    this.shield -= 5;
    this.lockOnCount--;
    if (boss.shield <= 0) {
      boss.shield = 0;
      boss.flg = BOSS_STATE_DESTROY;
      boss.destroyFrame = boss.frame;
    }
    if (this.shield <= 0) {
      this.alive = false;
      const d = this.constructor.DATA;
      this.animX = d.sx;
      spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 3);
    }
  }
}

// パーツ0: 本体
export class BossPart0 extends BossPart {
  static DATA = { shield: 500, x: 0, y: 14, sx: 140, sy: 150, tex: TEX.BOSS0, texCy: 0 };
  static HIT = { x1: -50, y1: -12, x2: 50, y2: 60 };
}

// パーツ1: 左翼
export class BossPart1 extends BossPart {
  static DATA = { shield: 200, x: -80, y: 0, sx: 40, sy: 224, tex: TEX.BOSS1, texCy: 0 };
  static HIT = { x1: -20, y1: -112, x2: 20, y2: 112 };
}

// パーツ2: 右翼
export class BossPart2 extends BossPart {
  static DATA = { shield: 200, x: 80, y: 0, sx: 40, sy: 224, tex: TEX.BOSS1, texCy: 0 };
  static HIT = { x1: -20, y1: -112, x2: 20, y2: 112 };
}
