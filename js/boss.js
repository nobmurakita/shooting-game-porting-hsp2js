//////////ボスパーツクラス//////////
game.BossPart = class {
  constructor() {
    this.alive = true;
    this.shield = this.constructor.DATA.shield;
    this.cx = 0;
    this.lckOn = 0;
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
game.Boss = class {
  static MAX_PARTS = 3;

  constructor() {
    this.flg = game.BOSS_NONE;
    this.shield = 500;
    this.x = 0;
    this.y = 500;
    this.frm = 0;
    this.aprFrm = 4900;
    this.parts = [new game.BossPart0(), new game.BossPart1(), new game.BossPart2()];
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
        let x = game.rnd(100) - 50;
        let y = game.rnd(100) - 50;
        game.spawnEffect(ctx, 0, this.x + x, this.y + y, 0);
      }
      let x = game.rnd(1024) / 256 - 2;
      let y = game.rnd(256) / 256 - 0.5;
      this.x += x;
      this.y -= (y + 1);
      if (this.frm === 100) {
        for (let i = 0; i < 3; i++) {
          let a = (i + 1) * 50;
          let t = -i * 2;
          for (let j = 0; j < 16; j++) {
            let r = j * Math.PI / 8;
            game.spawnEffect(ctx, 0, a * Math.cos(r) + this.x, a * Math.sin(r) + this.y, t);
          }
        }
      }
      if (this.frm === 120) {
        this.flg = game.BOSS_NONE;
        ctx.gameSta = game.STA_CLEAR;
      }
      return;
    }

    if (this.flg !== game.BOSS_BATTLE) {
      return;
    }

    // ステージ1のボスAI
    if (ctx.stage === 1) {
      if (this.frm < 400) {
        this.y -= 1;
      } else {
        let a = Math.floor((this.frm - 400) / 256) % 4;

        if (a === 0 || a === 3) {
          this.x -= 1;
        } else {
          this.x += 1;
        }

        let r = this.frm * 0.5 * game.A256;
        this.y -= Math.sin(r) * 1;

        // 誘導弾発射（パーツ1,2）
        if ((this.frm - 400) % 256 < 64 && (this.frm - 400) % 16 === 0) {
          if (this.parts[1].alive) {
            game.spawnEnemyShot(ctx, 2, -80 + this.x, this.y, r);
          }
          if (this.parts[2].alive) {
            game.spawnEnemyShot(ctx, 2, 80 + this.x, this.y, r);
          }
        }
        // 照準弾発射
        if ((this.frm - 400) % 256 < 64 && (this.frm - 400) % 8 === 0) {
          let dir = game.CollisionSystem.calcDir(this.x, this.y, ctx.player.x, ctx.player.y);
          game.spawnEnemyShot(ctx, 1, this.x, this.y + 40, dir);
        }
        // 通常弾発射
        if ((this.frm - 400) % 64 === 63) {
          game.spawnEnemyShot(ctx, 0, -10 + this.x, this.y - 50, game.DIR_DOWN);
          game.spawnEnemyShot(ctx, 0, 10 + this.x, this.y - 50, game.DIR_DOWN);
        }
      }
      this.frm++;
    }

  }

  // ボス描画（旧DrwBoss）
  draw(ctx) {
    if (this.flg === game.BOSS_NONE) return;

    if (ctx.stage === 1) {
      for (let i = 0; i < game.Boss.MAX_PARTS; i++) {
        const prt = this.parts[i];
        const d = prt.constructor.DATA;
        const ti = game.tile(prt.cx, d.texCy, d.sx, d.sy, d.tex);
        drawTile(vec2(this.x + d.x, this.y + d.y), ti.drawSize, ti);
      }
    }
  }

};
