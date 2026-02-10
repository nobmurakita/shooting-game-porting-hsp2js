;//////////ボスパーツクラス//////////
hsp.BossPart = class {
  constructor() {
    this.alive = false;
    this.shield = 0;
    this.cx = 0;
    this.lckOn = 0;
  }
};

;// パーツ0: 本体
hsp.BossPart0 = class extends hsp.BossPart {
  static DATA = { shield: 500, x: 0, y: -7, sx: 70, sy: 75, hitX1: -25, hitY1: -30, hitX2: 25, hitY2: 6, cy: 0 };
};

;// パーツ1: 左翼
hsp.BossPart1 = class extends hsp.BossPart {
  static DATA = { shield: 200, x: -40, y: 0, sx: 20, sy: 112, hitX1: -10, hitY1: -56, hitX2: 10, hitY2: 56, cy: 75 };
};

;// パーツ2: 右翼
hsp.BossPart2 = class extends hsp.BossPart {
  static DATA = { shield: 200, x: 40, y: 0, sx: 20, sy: 112, hitX1: -10, hitY1: -56, hitX2: 10, hitY2: 56, cy: 75 };
};

;//////////ボスクラス//////////
hsp.Boss = class {
  static MAX_PARTS = 3;

  constructor() {
    this.flg = 0;
    this.shield = 0;
    this.x = 0;
    this.y = 0;
    this.frm = 0;
    this.aprFrm = 0;
    this.parts = [new hsp.BossPart0(), new hsp.BossPart1(), new hsp.BossPart2()];
  }

  // ボスパーツ画像初期化（旧IniDatBossPrt）
  initData() {
    hsp.buffer(5, 1000, 1000);
    if (hsp.ctx.stage === 1) {
      hsp.picload('img/boss00.png', 0, 0);
      hsp.picload('img/boss01.png', 0, 75);
    }
  }

  // ボス初期化（旧IniBoss）
  init() {
    if (hsp.ctx.stage === 1) {
      this.flg = 0;
      this.shield = 500;
      this.x = 150;
      this.y = -100;
      this.frm = 0;
      this.aprFrm = 2450;

      for (let i = 0; i < hsp.Boss.MAX_PARTS; i++) {
        this.parts[i].alive = true;
        this.parts[i].shield = this.parts[i].constructor.DATA.shield;
        this.parts[i].cx = 0;
        this.parts[i].lckOn = 0;
      }
    }
  }

  // ボス移動（旧MovBoss）
  update(ctx) {
    // 破壊演出（flg==2）
    if (this.flg === 2) {
      for (let i = 0; i < hsp.Boss.MAX_PARTS; i++) {
        this.parts[i].cx = this.parts[i].constructor.DATA.sx;
      }
      this.frm++;
      if (this.frm % 3 === 0) {
        let x = hsp.rnd(50) - 25;
        let y = hsp.rnd(50) - 25;
        hsp.spawnEffect(ctx, 0, this.x + x, this.y + y, 0);
      }
      let x = hsp.rnd(4) - 2;
      let y = hsp.rnd(1) - 0.5;
      this.x += x;
      this.y += y + 1;
      if (this.frm === 50) {
        for (let i = 0; i < 3; i++) {
          let a = (i + 1) * 25;
          let t = -i * 2;
          for (let j = 0; j < 16; j++) {
            let r = hsp.toRad((j * 16) & 255);
            hsp.spawnEffect(ctx, 0, a * Math.cos(r) + this.x, a * Math.sin(r) + this.y, t);
          }
        }
      }
      if (this.frm === 60) {
        this.flg = 0;
        hsp.ctx.gameSta = hsp.STA_CLEAR;
      }
    }

    if (this.flg !== 1) {
      return;
    }

    // ステージ1のボスAI
    if (hsp.ctx.stage === 1) {
      if (this.frm < 200) {
        this.y += 1;
      } else {
        let a = Math.floor((this.frm - 200) / 128) % 4;

        if (a === 0 || a === 3) {
          this.x -= 1;
        } else {
          this.x += 1;
        }

        let r = hsp.toRad(this.frm);
        this.y += Math.sin(r);

        // 誘導弾発射（パーツ1,2）
        if ((this.frm - 200) % 128 < 32 && (this.frm - 200) % 8 === 0) {
          if (this.parts[1].alive) {
            hsp.spawnEnemyShot(ctx, 2, -40 + this.x, this.y, r);
          }
          if (this.parts[2].alive) {
            hsp.spawnEnemyShot(ctx, 2, 40 + this.x, this.y, r);
          }
        }
        // 照準弾発射
        if ((this.frm - 200) % 128 < 32 && (this.frm - 200) % 4 === 0) {
          if (this.flg === 1) {
            let dir = hsp.CollisionSystem.calcDir(this.x, this.y, ctx.player.x, ctx.player.y);
            hsp.spawnEnemyShot(ctx, 1, this.x, this.y - 20, dir);
          }
        }
        // 通常弾発射
        if ((this.frm - 200) % 32 === 31) {
          if (this.flg === 1) {
            hsp.spawnEnemyShot(ctx, 0, -5 + this.x, 25 + this.y, hsp.toRad(64));
            hsp.spawnEnemyShot(ctx, 0, 5 + this.x, 25 + this.y, hsp.toRad(64));
          }
        }
      }
      this.frm++;
    }

    // プレイヤーショットとの衝突判定
    for (let i = 0; i < hsp.Boss.MAX_PARTS; i++) {
      const prt = this.parts[i];
      if (!prt.alive) continue;
      const d = prt.constructor.DATA;

      for (const s of ctx.playerShots) {
        if (!s.alive) continue;

        if (hsp.CollisionSystem.checkAABB(
          this.x + d.x + d.hitX1, this.y + d.y + d.hitY1,
          this.x + d.x + d.hitX2, this.y + d.y + d.hitY2,
          s.x - 5, s.y - 10,
          s.x + 5, s.y + 10
        )) {
          hsp.ctx.score += 10;
          s.alive = false;
          this.shield--;
          prt.shield--;
          let ex = hsp.rnd(10) - 5;
          let ey = hsp.rnd(10) - 5;
          hsp.spawnEffect(ctx, 1, s.x + ex, s.y + ey, 0);
          if (this.shield === 0) {
            this.flg = 2;
            this.frm = 0;
          }
          if (prt.shield === 0) {
            prt.alive = false;
            prt.cx = d.sx;
            for (let k = 0; k < 5; k++) {
              let px = hsp.rnd(d.sx) - Math.floor(d.sx / 2);
              let py = hsp.rnd(d.sy) - Math.floor(d.sy / 2);
              hsp.spawnEffect(ctx, 0, d.x + this.x + px, d.y + this.y + py, -k * 3);
            }
            break;
          }
        }
      }
    }

  }

  // ボス描画（旧DrwBoss）
  draw() {
    if (this.flg === 0) return;

    if (hsp.ctx.stage === 1) {
      for (let i = 0; i < hsp.Boss.MAX_PARTS; i++) {
        const prt = this.parts[i];
        const d = prt.constructor.DATA;
        hsp.pos(
          Math.floor(this.x) + d.x - Math.floor(d.sx / 2),
          Math.floor(this.y) + d.y - Math.floor(d.sy / 2)
        );
        hsp.gcopy(5, prt.cx, d.cy, d.sx, d.sy);
      }
    }
  }

};
