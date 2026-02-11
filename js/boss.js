//////////ボスパーツクラス//////////
game.BossPart = class {
  constructor() {
    this.alive = false;
    this.shield = 0;
    this.cx = 0;
    this.lckOn = 0;
  }

  // パーツ初期化（ステージ開始時にBoss.init()から呼ばれる）
  init() {
    this.alive = true;
    this.shield = this.constructor.DATA.shield;
    this.cx = 0;
    this.lckOn = 0;
  }
};

// パーツ0: 本体
game.BossPart0 = class extends game.BossPart {
  static DATA = { shield: 500, x: 0, y: 7, sx: 70, sy: 75, hitX1: -25, hitY1: -6, hitX2: 25, hitY2: 30, tex: game.TEX.BOSS0, texCy: 0 };
};

// パーツ1: 左翼
game.BossPart1 = class extends game.BossPart {
  static DATA = { shield: 200, x: -40, y: 0, sx: 20, sy: 112, hitX1: -10, hitY1: -56, hitX2: 10, hitY2: 56, tex: game.TEX.BOSS1, texCy: 0 };
};

// パーツ2: 右翼
game.BossPart2 = class extends game.BossPart {
  static DATA = { shield: 200, x: 40, y: 0, sx: 20, sy: 112, hitX1: -10, hitY1: -56, hitX2: 10, hitY2: 56, tex: game.TEX.BOSS1, texCy: 0 };
};

//////////ボスクラス//////////
game.Boss = class {
  static MAX_PARTS = 3;

  constructor() {
    this.flg = game.BOSS_NONE;
    this.shield = 0;
    this.x = 0;
    this.y = 0;
    this.frm = 0;
    this.aprFrm = 0;
    this.parts = [new game.BossPart0(), new game.BossPart1(), new game.BossPart2()];
  }

  // ボスパーツ画像初期化（LittleJSが画像をロード済み）
  initData() {
  }

  // ボス初期化（旧IniBoss）
  init() {
    if (game.ctx.stage === 1) {
      this.flg = game.BOSS_NONE;
      this.shield = 500;
      this.x = 0;
      this.y = 250;
      this.frm = 0;
      this.aprFrm = 4900;

      for (let i = 0; i < game.Boss.MAX_PARTS; i++) {
        this.parts[i].init();
      }
    }
  }

  // ボス移動（旧MovBoss）
  update(ctx) {
    // 破壊演出（flg==2）
    if (this.flg === game.BOSS_DESTROY) {
      for (let i = 0; i < game.Boss.MAX_PARTS; i++) {
        this.parts[i].cx = this.parts[i].constructor.DATA.sx;
      }
      this.frm++;
      if (this.frm % 6 === 0) {
        let x = game.rnd(50) - 25;
        let y = game.rnd(50) - 25;
        game.spawnEffect(ctx, 0, this.x + x, this.y + y, 0);
      }
      let x = game.rnd(4) - 2;
      let y = (game.rnd(3) - 1) * 0.5;
      this.x += x * 0.5;
      this.y -= (y + 0.5);
      if (this.frm === 100) {
        for (let i = 0; i < 3; i++) {
          let a = (i + 1) * 25;
          let t = -i * 2;
          for (let j = 0; j < 16; j++) {
            let r = j * Math.PI / 8;
            game.spawnEffect(ctx, 0, a * Math.cos(r) + this.x, a * Math.sin(r) + this.y, t);
          }
        }
      }
      if (this.frm === 120) {
        this.flg = game.BOSS_NONE;
        game.ctx.gameSta = game.STA_CLEAR;
      }
    }

    if (this.flg !== game.BOSS_BATTLE) {
      return;
    }

    // ステージ1のボスAI
    if (game.ctx.stage === 1) {
      if (this.frm < 400) {
        this.y -= 0.5;
      } else {
        let a = Math.floor((this.frm - 400) / 256) % 4;

        if (a === 0 || a === 3) {
          this.x -= 0.5;
        } else {
          this.x += 0.5;
        }

        let r = this.frm * 0.5 * game.A256;
        this.y -= Math.sin(r) * 0.5;

        // 誘導弾発射（パーツ1,2）
        if ((this.frm - 400) % 256 < 64 && (this.frm - 400) % 16 === 0) {
          if (this.parts[1].alive) {
            game.spawnEnemyShot(ctx, 2, -40 + this.x, this.y, r);
          }
          if (this.parts[2].alive) {
            game.spawnEnemyShot(ctx, 2, 40 + this.x, this.y, r);
          }
        }
        // 照準弾発射
        if ((this.frm - 400) % 256 < 64 && (this.frm - 400) % 8 === 0) {
          if (this.flg === game.BOSS_BATTLE) {
            let dir = game.CollisionSystem.calcDir(this.x, this.y, ctx.player.x, ctx.player.y);
            game.spawnEnemyShot(ctx, 1, this.x, this.y + 20, dir);
          }
        }
        // 通常弾発射
        if ((this.frm - 400) % 64 === 63) {
          if (this.flg === game.BOSS_BATTLE) {
            game.spawnEnemyShot(ctx, 0, -5 + this.x, this.y - 25, game.DIR_DOWN);
            game.spawnEnemyShot(ctx, 0, 5 + this.x, this.y - 25, game.DIR_DOWN);
          }
        }
      }
      this.frm++;
    }

  }

  // ボス描画（旧DrwBoss）
  // 描画順: 翼(1,2)→本体(0)。本体を最後に描くことで重なり部分の継ぎ目を隠す
  static DRAW_ORDER = [1, 2, 0];

  draw() {
    if (this.flg === game.BOSS_NONE) return;

    if (game.ctx.stage === 1) {
      for (const i of game.Boss.DRAW_ORDER) {
        const prt = this.parts[i];
        const d = prt.constructor.DATA;
        drawTile(
          vec2(this.x + d.x, this.y + d.y), vec2(d.sx, d.sy),
          game.tile(prt.cx, d.texCy, d.sx, d.sy, d.tex)
        );
      }
    }
  }

};
