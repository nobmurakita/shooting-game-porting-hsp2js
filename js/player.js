//////////プレーヤーショットクラス//////////
game.PlayerShot = class {
  static CONFIG = { speed: 16, offscreenY: 340 };
  static DATA = { sx: 20, sy: 40, cx: 560, cy: 0, tex: game.TEX.PLAYER, hitX1: -10, hitY1: -20, hitX2: 10, hitY2: 20 };

  constructor(x, y) {
    this.alive = true;
    this.x = x;
    this.y = y;
  }

  // ショット移動（旧MovPlySht内ループ1回分）
  update() {
    if (!this.alive) return;

    this.y += game.PlayerShot.CONFIG.speed;

    // 画面外で消滅
    if (this.y > game.PlayerShot.CONFIG.offscreenY) {
      this.alive = false;
    }
  }

  // ショット描画（旧DrwPlySht内ループ1回分）
  draw() {
    if (!this.alive) return;
    const d = game.PlayerShot.DATA;
    const ti = game.tile(d.cx, d.cy, d.sx, d.sy, d.tex);
    drawTile(vec2(this.x, this.y), ti.drawSize, ti);
  }
};

//////////レーザークラス//////////
game.Laser = class {
  static CONFIG = { accel: 5.0, damping: 0.8, damage: 5, hitScore: 100 };
  static DRAW = {
    segments: 7,
    baseR: 50, baseG: 255, baseB: 160,
    fadeG: 20, fadeB: 20,
  };

  constructor(px, py, vx, vy, trg) {
    this.alive = true;
    this.trg = trg;
    this.sta = game.LSR_TRACKING;
    this.x = [px, px, px, px, px, px, px, px];
    this.y = [py, py, py, py, py, py, py, py];
    this.vx = vx;
    this.vy = vy;
    this.dir = game.DIR_UP;
    this.frm = 0;
  }

  // 節シフト + 加速・減衰 + 消滅収束
  updateMovement() {
    // 節の位置を後方にシフト
    for (let j = 0; j < 7; j++) {
      const a = 7 - j;
      const b = a - 1;
      this.x[a] = this.x[b];
      this.y[a] = this.y[b];
    }

    if (this.sta !== game.LSR_DYING) {
      // 追跡中 or ターゲットなし: 加速・減衰は偶数フレームのみ、移動は毎フレーム
      const dir = this.dir;
      if (this.frm % 2 === 0) {
        this.vx += Math.cos(dir) * game.Laser.CONFIG.accel;
        this.vy += Math.sin(dir) * game.Laser.CONFIG.accel;
        this.vx = this.vx * game.Laser.CONFIG.damping;
        this.vy = this.vy * game.Laser.CONFIG.damping;
      }
      this.x[0] += this.vx;
      this.y[0] += this.vy;
    } else {
      // 消滅途中: 全節が同一座標に収束したら消滅
      let moving = false;
      for (let j = 0; j < 7; j++) {
        if (this.x[j] !== this.x[j + 1] || this.y[j] !== this.y[j + 1]) {
          moving = true;
          break;
        }
      }
      if (!moving) {
        this.alive = false;
      }
    }
  }

  // ターゲット喪失検知 + 再検索
  updateTargeting(ctx) {
    if (this.sta === game.LSR_TRACKING && (this.trg === null || !this.trg.alive)) {
      // ターゲット喪失時にlckOnをデクリメント（発射時の++と対応）
      if (this.trg !== null) {
        this.trg.lckOn--;
      }
      this.sta = game.LSR_NO_TARGET;
    }
    if (this.sta === game.LSR_NO_TARGET) {
      const newTrg = ctx.player.searchTarget(ctx);
      if (newTrg !== null) {
        this.sta = game.LSR_TRACKING;
        this.trg = newTrg;
        newTrg.lckOn++;
      }
    }
  }

  // 衝突判定 + ダメージ + 撃破 + 方向更新
  checkHit(ctx) {
    if (this.sta !== game.LSR_TRACKING) return;
    if (!this.trg.alive) { this.sta = game.LSR_DYING; return; }

    if (ctx.boss.flg !== game.BOSS_BATTLE) {
      // --- 敵モード ---
      const e = this.trg;
      const d = e.constructor.DATA;

      // 衝突判定（点 vs 矩形）
      const hit = game.CollisionSystem.checkAABB(
        this.x[0], this.y[0], this.x[0], this.y[0],
        d.hitX1 + e.x, d.hitY1 + e.y,
        d.hitX2 + e.x, d.hitY2 + e.y
      );

      if (hit) {
        ctx.score += game.Laser.CONFIG.hitScore;
        e.shield -= game.Laser.CONFIG.damage;
        e.lckOn--;
        this.sta = game.LSR_DYING;

        // ヒットエフェクト
        game.spawnHitSparks(ctx, this.x[0], this.y[0], 2);

        // 敵撃破
        if (e.shield <= 0) {
          e.alive = false;
          game.spawnExplosion(ctx, e.x, e.y, d.sx, d.sy, 3);
        }
      }

      // ターゲットへの方向を更新（2フレームに1回）
      if (this.frm % 2 === 0) {
        this.dir = game.CollisionSystem.calcDir(
          this.x[0], this.y[0], e.x, e.y
        );
      }
    } else {
      // --- ボスモード ---
      const boss = ctx.boss;
      const p = this.trg;
      const pd = p.constructor.DATA;

      // 衝突判定（点 vs 矩形）
      const hit = game.CollisionSystem.checkAABB(
        this.x[0], this.y[0], this.x[0], this.y[0],
        (pd.x + pd.hitX1) + boss.x, (pd.y + pd.hitY1) + boss.y,
        (pd.x + pd.hitX2) + boss.x, (pd.y + pd.hitY2) + boss.y
      );

      if (hit) {
        ctx.score += game.Laser.CONFIG.hitScore;
        boss.shield -= game.Laser.CONFIG.damage;
        p.shield -= game.Laser.CONFIG.damage;
        p.lckOn--;
        this.sta = game.LSR_DYING;

        // ヒットエフェクト
        game.spawnHitSparks(ctx, this.x[0], this.y[0], 2);

        // ボス撃破判定
        if (boss.shield <= 0) {
          boss.shield = 0;
          boss.flg = game.BOSS_DESTROY;
          boss.frm = 0;
        }

        // パーツ破壊
        if (p.shield <= 0) {
          p.alive = false;
          p.cx = pd.sx;
          game.spawnExplosion(ctx, pd.x + boss.x, pd.y + boss.y, pd.sx, pd.sy, 3);
        }
      }

      // ターゲットパーツへの方向を更新（2フレームに1回）
      if (this.frm % 2 === 0) {
        this.dir = game.CollisionSystem.calcDir(
          this.x[0], this.y[0],
          pd.x + boss.x,
          pd.y + boss.y
        );
      }
    }
  }

  // レーザー移動・追跡・衝突判定（旧MovLsr内ループ1回分 + LsrHit）
  update(ctx) {
    if (!this.alive) return;

    this.updateMovement();
    this.updateTargeting(ctx);
    this.checkHit(ctx);

    // ターゲットなし状態で画面外に出たら消滅開始
    if (this.sta === game.LSR_NO_TARGET) {
      if (game.isOutOfBounds(this.x[0], this.y[0], game.BOUNDS.LASER)) {
        this.sta = game.LSR_DYING;
      }
    }

    this.frm++;
  }

  // レーザー描画（旧DrwLsr内ループ1回分）
  draw() {
    if (!this.alive) return;
    const d = game.Laser.DRAW;
    for (let j = 0; j < d.segments; j++) {
      const c = game.color(d.baseR/255, (d.baseG - j*d.fadeG)/255, (d.baseB - j*d.fadeB)/255);
      drawLine(vec2(this.x[j], this.y[j]), vec2(this.x[j+1], this.y[j+1]), 6, c);
    }
  }
};

//////////プレーヤークラス//////////
game.Player = class {
  static CONFIG = {
    moveSpeed: 5.5,
    shotInterval: 6,
    laserChargeShot: 0.5,
    laserChargeIdle: 1.5,
    laserMax: 320,
    laserDecay: 6.5,
    laserThreshold: 40,
    initShield: 5,
    initX: 0,
    initY: -220,
    hitInvincible: 100,
  };
  static DATA = { sx: 80, sy: 80, baseX: 240, normalY: 0, hitY: 80, tex: game.TEX.PLAYER, hitX1: -10, hitY1: -10, hitX2: 10, hitY2: 10 };
  // ショット発射位置テーブル（ラジアン、旧DatShtDir後半6要素）
  static SHT_POS = [184, 200, 174, 210, 166, 218].map(a => -a * Math.PI / 128);
  // レーザー発射方向テーブル（ラジアン、旧DatLsrDir）
  static LSR_DIR = [187, 197, 177, 207, 167, 217, 157, 227].map(a => -a * Math.PI / 128);

  constructor() {
    this.init();
  }

  // プレーヤー初期化（旧IniPly）
  init() {
    this.alive = true;
    this.shield = game.Player.CONFIG.initShield;
    this.x = game.Player.CONFIG.initX;
    this.y = game.Player.CONFIG.initY;
    this.hitCnt = 0;
    this.gra = 0;
    this.frm = 0;
    this.shtCnt = 0;
    this.shtLV = 1;
    this.lsrF = game.LSR_CHARGE_OFF;
    this.lsrPow = 0;
    this.lsrPowDisplay = 0;
  }

  // プレーヤー移動（旧MovPly）
  update(ctx) {
    if (!this.alive) {
      this.lsrPow = 0;
      this.lsrPowDisplay = Math.max(0, this.lsrPowDisplay - game.Player.CONFIG.laserDecay);
      return;
    }

    // 移動量＆傾き決定
    const dx = game.keyIsDown(game.KEY_RIGHT) - game.keyIsDown(game.KEY_LEFT);
    const dy = game.keyIsDown(game.KEY_UP) - game.keyIsDown(game.KEY_DOWN);

    if (dx || dy) {
      const r = game.CollisionSystem.calcDir(0, 0, dx, dy);
      this.x += Math.cos(r) * game.Player.CONFIG.moveSpeed;
      this.y += Math.sin(r) * game.Player.CONFIG.moveSpeed;
    }

    // 傾きアニメーション
    if (dx === 0) {
      if (this.gra < 0) { this.gra++; }
      if (this.gra > 0) { this.gra--; }
    } else {
      this.gra += dx;
      if (this.gra < -6) { this.gra = -6; }
      if (this.gra > 6) { this.gra = 6; }
    }

    // はみ出し制限
    if (this.x < -game.BOUNDS.PLAYER) { this.x = -game.BOUNDS.PLAYER; }
    if (this.y < -game.BOUNDS.PLAYER) { this.y = -game.BOUNDS.PLAYER; }
    if (this.x > game.BOUNDS.PLAYER) { this.x = game.BOUNDS.PLAYER; }
    if (this.y > game.BOUNDS.PLAYER) { this.y = game.BOUNDS.PLAYER; }

    // ショット発射
    if (this.shtCnt !== 0) {
      this.shtCnt--;
    } else {
      if (game.keyIsDown(game.KEY_SHOT)) {
        this.shtCnt = game.Player.CONFIG.shotInterval;
        for (let i = 0; i < this.shtLV * 2; i++) {
          const posRad = game.Player.SHT_POS[i];
          const x = Math.cos(posRad) * 40 + this.x;
          const y = Math.sin(posRad) * 40 + this.y;
          ctx.playerShots.push(new game.PlayerShot(x, y));
        }
      }
    }

    // レーザー発射
    if (this.lsrF === game.LSR_CHARGE_ON) {
      if (game.keyIsDown(game.KEY_LASER)) {
        if (this.lsrPow >= game.Player.CONFIG.laserThreshold) {
          const count = Math.min(Math.floor(this.lsrPow / game.Player.CONFIG.laserThreshold), game.Player.LSR_DIR.length);
          for (let i = 0; i < count; i++) {
            const trg = this.searchTarget(ctx);
            if (trg !== null) { trg.lckOn++; }
            const rad = game.Player.LSR_DIR[i];
            const vx = Math.cos(rad) * 16;
            const vy = Math.sin(rad) * 16;
            ctx.lasers.push(new game.Laser(this.x, this.y + 40, vx, vy, trg));
          }
          this.lsrPow = 0;
        }
      } else {
        this.lsrPow += (game.keyIsDown(game.KEY_SHOT) ? game.Player.CONFIG.laserChargeShot : game.Player.CONFIG.laserChargeIdle);
        if (this.lsrPow > game.Player.CONFIG.laserMax) {
          this.lsrPow = game.Player.CONFIG.laserMax;
        }
      }
    } else {
      this.lsrPow -= game.Player.CONFIG.laserDecay;
      if (this.lsrPow < 0) {
        this.lsrPow = 0;
      }
    }

    // レーザーバー表示用（実パワーに追従しつつ、ゆっくり減少）
    this.lsrPowDisplay = Math.max(this.lsrPow, this.lsrPowDisplay - game.Player.CONFIG.laserDecay);

    // 被弾カウンタ減少
    if (this.hitCnt !== 0) {
      this.hitCnt--;
    }

    this.frm++;
  }

  // ロックオンする敵をサーチ（旧SearchTrget）
  // 戻り値: ターゲットオブジェクト参照（null=なし）
  searchTarget(ctx) {
    let trg = null;

    if (ctx.boss.flg !== game.BOSS_BATTLE) {
      // 敵モード
      for (const e of ctx.enemies) {
        if (!e.alive) continue;

        if (trg === null) {
          trg = e;
          continue;
        }

        // ロックオン数が少ない敵を優先
        if (trg.lckOn > e.lckOn) {
          trg = e;
          continue;
        }
        if (trg.lckOn < e.lckOn) {
          continue;
        }

        // ロックオン数が同じなら距離が近い方
        let tx = trg.x - this.x; tx = tx * tx;
        let ty = trg.y - this.y; ty = ty * ty;
        const rd = tx + ty;
        let ix = e.x - this.x; ix = ix * ix;
        let iy = e.y - this.y; iy = iy * iy;
        if (rd > ix + iy) {
          trg = e;
        }
      }
    } else {
      // ボスモード
      const boss = ctx.boss;
      for (let i = 0; i < game.Boss.MAX_PARTS; i++) {
        const p = boss.parts[i];
        if (!p.alive) continue;

        if (trg === null) {
          trg = p;
          continue;
        }

        // コメントアウト: 有効にするとレーザーがボスの各パーツに分散する
        // if (trg.lckOn > p.lckOn) {
        //   trg = p;
        //   continue;
        // }
        // if (trg.lckOn < p.lckOn) {
        //   continue;
        // }

        // 距離が近いパーツを優先
        let tx = boss.x + trg.constructor.DATA.x - this.x; tx = tx * tx;
        let ty = boss.y + trg.constructor.DATA.y - this.y; ty = ty * ty;
        const rd = tx + ty;
        let ix = boss.x + p.constructor.DATA.x - this.x; ix = ix * ix;
        let iy = boss.y + p.constructor.DATA.y - this.y; iy = iy * iy;
        if (rd > ix + iy) {
          trg = p;
        }
      }
    }

    return trg;
  }

  // プレーヤー描画（旧DrwPly）
  draw() {
    if (!this.alive) return;
    const d = game.Player.DATA;
    const frameX = Math.floor(this.gra / 2) * d.sx + d.baseX;
    const frameY = (Math.floor(this.hitCnt / 6) % 2 === 0) ? d.normalY : d.hitY;
    const ti = game.tile(frameX, frameY, d.sx, d.sy, d.tex);
    drawTile(vec2(this.x, this.y), ti.drawSize, ti);
  }

};
