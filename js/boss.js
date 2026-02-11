//////////ボスパーツクラス//////////
game.BossPart = class extends game.GameObject {
  constructor() {
    super(vec2(), 5);  // renderOrder=5、位置はBossの子として自動設定
    this.alive = true;  // 破壊されても描画は継続（損傷スプライトに切替）
    this.shield = this.constructor.DATA.shield;
    this.cx = 0;
    this.lckOn = 0;
  }

  // プレイヤーショットによる被弾。パーツ破壊時trueを返す
  onHitByShot() {
    const boss = this.parent;
    boss.shield--;
    this.shield--;
    if (boss.shield <= 0) {
      boss.flg = game.BOSS_DESTROY;
      boss.destroyFrm = boss.frm;
    }
    if (this.shield <= 0) {
      this.alive = false;
      const d = this.constructor.DATA;
      this.cx = d.sx;
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
    this.lckOn--;
    if (boss.shield <= 0) {
      boss.shield = 0;
      boss.flg = game.BOSS_DESTROY;
      boss.destroyFrm = boss.frm;
    }
    if (this.shield <= 0) {
      this.alive = false;
      const d = this.constructor.DATA;
      this.cx = d.sx;
      game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 3);
    }
  }

  render() {
    const ctx = game.ctx;
    if (ctx.gameSta !== game.STA_PLAY && ctx.gameSta !== game.STA_CLEAR && ctx.gameSta !== game.STA_PAUSE) return;
    if (!this.parent || this.parent.flg === game.BOSS_NONE) return;
    const d = this.constructor.DATA;
    const ti = game.tile(this.cx, d.texCy, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }
};

// パーツ0: 本体
game.BossPart0 = class extends game.BossPart {
  static DATA = { shield: 500, x: 0, y: 14, sx: 140, sy: 150, hitX1: -50, hitY1: -12, hitX2: 50, hitY2: 60, tex: game.TEX.BOSS0, texCy: 0 };
};

// パーツ1: 左翼
game.BossPart1 = class extends game.BossPart {
  static DATA = { shield: 200, x: -80, y: 0, sx: 40, sy: 224, hitX1: -20, hitY1: -112, hitX2: 20, hitY2: 112, tex: game.TEX.BOSS1, texCy: 0 };
};

// パーツ2: 右翼
game.BossPart2 = class extends game.BossPart {
  static DATA = { shield: 200, x: 80, y: 0, sx: 40, sy: 224, hitX1: -20, hitY1: -112, hitX2: 20, hitY2: 112, tex: game.TEX.BOSS1, texCy: 0 };
};

//////////ボスクラス//////////
game.Boss = class extends game.GameObject {
  static MAX_PARTS = 3;

  constructor() {
    super(vec2(0, 500), 5);  // renderOrder=5（敵=0の上、PlayerShot=10の下）
    this.flg = game.BOSS_NONE;
    this.shield = 500;
    this.aprFrm = 4900;
    this.destroyFrm = 0;  // 破壊演出開始時のfrm（経過フレーム算出用）
    this.parts = [new game.BossPart0(), new game.BossPart1(), new game.BossPart2()];
    for (const prt of this.parts) {
      this.addChild(prt, vec2(prt.constructor.DATA.x, prt.constructor.DATA.y));
    }
  }

  // ボス移動（旧MovBoss）
  update() {
    const ctx = game.ctx;
    if (ctx.gameSta !== game.STA_PLAY) return;

    // 破壊演出（flg==2）
    if (this.flg === game.BOSS_DESTROY) {
      super.update(); // frm++（破壊演出は旧コードでfrm先行インクリメントのため先に実行）
      this.updateDestroy();
      return;
    }

    if (this.flg !== game.BOSS_BATTLE) return;

    // ステージ1のボスAI
    if (game.ctx.stage === 1) {
      if (this.frm < 400) {
        this.updateApproach();
      } else {
        this.updateBattle();
      }
    }

    super.update(); // frm++
  }

  // 破壊演出（爆発・揺れ・クリア遷移）
  updateDestroy() {
    const ctx = game.ctx;
    const elapsed = this.frm - this.destroyFrm;
    for (let i = 0; i < game.Boss.MAX_PARTS; i++) {
      this.parts[i].cx = this.parts[i].constructor.DATA.sx;
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
      this.flg = game.BOSS_NONE;
      ctx.gameSta = game.STA_CLEAR;
    }
  }

  // 初期降下
  updateApproach() {
    this.pos.y -= 1;
  }

  // 移動パターン＆攻撃パターン
  updateBattle() {
    const ctx = game.ctx;
    let a = Math.floor((this.frm - 400) / 256) % 4;

    if (a === 0 || a === 3) {
      this.pos.x -= 1;
    } else {
      this.pos.x += 1;
    }

    let r = this.frm * 0.5 * game.A256;
    this.pos.y -= Math.sin(r) * 1;

    // 誘導弾発射（パーツ1,2）
    if ((this.frm - 400) % 256 < 64 && (this.frm - 400) % 16 === 0) {
      if (this.parts[1].alive) {
        game.spawnEnemyShot(2, -80 + this.pos.x, this.pos.y, r);
      }
      if (this.parts[2].alive) {
        game.spawnEnemyShot(2, 80 + this.pos.x, this.pos.y, r);
      }
    }
    // 照準弾発射
    if ((this.frm - 400) % 256 < 64 && (this.frm - 400) % 8 === 0) {
      let dir = game.CollisionSystem.calcDir(this.pos.x, this.pos.y, ctx.player.pos.x, ctx.player.pos.y);
      game.spawnEnemyShot(1, this.pos.x, this.pos.y + 40, dir);
    }
    // 通常弾発射
    if ((this.frm - 400) % 64 === 63) {
      game.spawnEnemyShot(0, -10 + this.pos.x, this.pos.y - 50, game.DIR_DOWN);
      game.spawnEnemyShot(0, 10 + this.pos.x, this.pos.y - 50, game.DIR_DOWN);
    }
  }

  // パーツは子EngineObjectとして自動描画
};
