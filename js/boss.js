//////////ボスパーツクラス//////////
game.BossPart = class extends game.GameObject {
  static all = new Set();

  constructor() {
    super(vec2(), 5);  // renderOrder=5、位置はBossの子として自動設定
    game.BossPart.all.add(this);
    this.shield = this.constructor.DATA.shield;
    this.animX = 0;
    this.lockOnCount = 0;
  }

  destroy() {
    game.BossPart.all.delete(this);
    super.destroy();
  }

  // プレイヤーショットによる被弾。パーツ破壊時trueを返す
  onHitByShot() {
    const boss = this.parent;
    boss.shield--;
    this.shield--;
    if (boss.shield <= 0) {
      boss.flg = game.BOSS_DESTROY;
      boss.destroyFrame = boss.frame;
    }
    if (this.shield <= 0) {
      this.alive = false;
      const d = this.constructor.DATA;
      this.animX = d.sx;
      game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 5);
      return true;
    }
    return false;
  }

  // レーザーによる被弾
  onHitByLaser(damage) {
    const boss = this.parent;
    boss.shield -= damage;
    this.shield -= damage;
    this.lockOnCount--;
    if (boss.shield <= 0) {
      boss.shield = 0;
      boss.flg = game.BOSS_DESTROY;
      boss.destroyFrame = boss.frame;
    }
    if (this.shield <= 0) {
      this.alive = false;
      const d = this.constructor.DATA;
      this.animX = d.sx;
      game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 3);
    }
  }

  render() {
    if (!this.parent || this.parent.flg === game.BOSS_NONE) return;
    const d = this.constructor.DATA;
    const ti = game.tile(this.animX, d.texCy, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }
};

// パーツ0: 本体
game.BossPart0 = class extends game.BossPart {
  static DATA = { shield: 500, x: 0, y: 14, sx: 140, sy: 150, tex: game.TEX.BOSS0, texCy: 0 };
  static HIT = { x1: -50, y1: -12, x2: 50, y2: 60 };
};

// パーツ1: 左翼
game.BossPart1 = class extends game.BossPart {
  static DATA = { shield: 200, x: -80, y: 0, sx: 40, sy: 224, tex: game.TEX.BOSS1, texCy: 0 };
  static HIT = { x1: -20, y1: -112, x2: 20, y2: 112 };
};

// パーツ2: 右翼
game.BossPart2 = class extends game.BossPart {
  static DATA = { shield: 200, x: 80, y: 0, sx: 40, sy: 224, tex: game.TEX.BOSS1, texCy: 0 };
  static HIT = { x1: -20, y1: -112, x2: 20, y2: 112 };
};

//////////ボスクラス//////////
game.Boss = class extends game.GameObject {
  static instance = null;
  static MAX_PARTS = 3;

  constructor() {
    super(vec2(0, 500), 5);  // renderOrder=5（敵=0の上、PlayerShot=10の下）
    game.Boss.instance = this;
    this.flg = game.BOSS_NONE;
    this.shield = 500;
    this.appearFrame = 4900;
    this.destroyFrame = 0;  // 破壊演出開始時のframe（経過フレーム算出用）
    this.parts = [new game.BossPart0(), new game.BossPart1(), new game.BossPart2()];
    for (const prt of this.parts) {
      this.addChild(prt, vec2(prt.constructor.DATA.x, prt.constructor.DATA.y));
    }
  }

  destroy() {
    game.Boss.instance = null;
    super.destroy();
  }

  // ボス移動（旧MovBoss）
  update() {
    const ctx = game.ctx;
    if (ctx.gameSta !== game.STA_PLAY) return;

    // 破壊演出（flg==2）
    if (this.flg === game.BOSS_DESTROY) {
      this.frame++; // 破壊演出は旧コードでfrm先行インクリメントのため先に実行
      this.updateDestroy();
      return;
    }

    if (this.flg !== game.BOSS_BATTLE) return;

    // ステージ1のボスAI
    if (game.ctx.stage === 1) {
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
    const ctx = game.ctx;
    const elapsed = this.frame - this.destroyFrame;
    for (let i = 0; i < game.Boss.MAX_PARTS; i++) {
      this.parts[i].animX = this.parts[i].constructor.DATA.sx;
    }
    if (elapsed % 6 === 0) {
      let x = game.rnd(100) - 50;
      let y = game.rnd(100) - 50;
      game.spawnEffect(0, this.pos.x + x, this.pos.y + y, 0);
    }
    let x = game.rnd(1024) / 256 - 2;
    let y = game.rnd(256) / 256 - 0.5;
    this.pos.x += x;
    this.pos.y -= (y + 1);
    if (elapsed === 100) {
      for (let i = 0; i < 3; i++) {
        let a = (i + 1) * 50;
        let t = -i * 2;
        for (let j = 0; j < 16; j++) {
          let r = j * Math.PI / 8;
          game.spawnEffect(0, a * Math.cos(r) + this.pos.x, a * Math.sin(r) + this.pos.y, t);
        }
      }
    }
    if (elapsed === 120) {
      ctx.gameSta = game.STA_CLEAR;
      this.destroy();
    }
  }

  // 初期降下
  updateApproach() {
    this.pos.y -= 1;
  }

  // 移動パターン＆攻撃パターン
  updateBattle() {
    const ctx = game.ctx;
    let a = Math.floor((this.frame - 400) / 256) % 4;

    if (a === 0 || a === 3) {
      this.pos.x -= 1;
    } else {
      this.pos.x += 1;
    }

    let r = this.frame * 0.5 * game.A256;
    this.pos.y -= Math.sin(r) * 1;

    // 誘導弾発射（パーツ1,2）
    if ((this.frame - 400) % 256 < 64 && (this.frame - 400) % 16 === 0) {
      if (this.parts[1].alive) {
        game.spawnEnemyShot(2, -80 + this.pos.x, this.pos.y, r);
      }
      if (this.parts[2].alive) {
        game.spawnEnemyShot(2, 80 + this.pos.x, this.pos.y, r);
      }
    }
    // 照準弾発射
    if ((this.frame - 400) % 256 < 64 && (this.frame - 400) % 8 === 0) {
      let dir = game.calcDir(this.pos, game.Player.instance.pos);
      game.spawnEnemyShot(1, this.pos.x, this.pos.y + 40, dir);
    }
    // 通常弾発射
    if ((this.frame - 400) % 64 === 63) {
      game.spawnEnemyShot(0, -10 + this.pos.x, this.pos.y - 50, game.DIR_DOWN);
      game.spawnEnemyShot(0, 10 + this.pos.x, this.pos.y - 50, game.DIR_DOWN);
    }
  }

  // パーツは子EngineObjectとして自動描画
};
