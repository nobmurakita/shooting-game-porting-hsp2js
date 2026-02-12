//////////プレーヤーショットクラス//////////
game.PlayerShot = class extends game.GameObject {
  static all = new Set();
  static CONFIG = { speed: 16, offscreenY: 340, hitScore: 10 };
  static DATA = { sx: 20, sy: 40, cx: 560, cy: 0, tex: game.TEX.PLAYER };
  static HIT = { x1: -10, y1: -20, x2: 10, y2: 20 };

  constructor(x, y) {
    super(vec2(x, y), 10);  // renderOrder=10
    game.PlayerShot.all.add(this);
  }

  destroy() {
    game.PlayerShot.all.delete(this);
    super.destroy();
  }

  // ターゲットに命中
  onHit() {
    game.ctx.score += game.PlayerShot.CONFIG.hitScore;
    game.spawnHitSparks(this.pos.x, this.pos.y);
    this.destroy();
  }

  update() {
    if (game.ctx.isPaused()) return;
    this.pos.y += game.PlayerShot.CONFIG.speed;
    if (this.pos.y > game.PlayerShot.CONFIG.offscreenY) {
      this.destroy();
    }
    this.frm++;
  }

  render() {
    const d = game.PlayerShot.DATA;
    const ti = game.tile(d.cx, d.cy, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }
};

//////////レーザークラス//////////
game.Laser = class extends game.GameObject {
  static all = new Set();
  static CONFIG = { accel: 5.0, damping: 0.8, damage: 5, hitScore: 100 };
  static DRAW = {
    segments: 14,
    baseR: 50, baseG: 255, baseB: 160,
    fadeG: 10, fadeB: 10,
  };

  constructor(px, py, vx, vy, trg) {
    super(vec2(px, py), 50); // renderOrder=50（最前面）
    game.Laser.all.add(this);
    this.trg = trg;
    this.sta = trg ? game.LSR_TRACKING : game.LSR_NO_TARGET;
    this.trail = Array.from({length: 15}, () => vec2(px, py));
    this.vx = vx;
    this.vy = vy;
    this.dir = game.DIR_UP;
  }

  destroy() {
    game.Laser.all.delete(this);
    super.destroy();
  }

  hitBox() {
    return [this.pos.x, this.pos.y, this.pos.x, this.pos.y];
  }

  // 節シフト + 加速・減衰 + 消滅収束
  updateMovement() {
    const t = this.trail;
    // 軌跡を後方にシフト（14セグメント × 60fps = 7セグメント × 30fps と同じ実時間の軌跡）
    for (let j = t.length - 1; j > 0; j--) {
      t[j].x = t[j - 1].x;
      t[j].y = t[j - 1].y;
    }

    if (this.sta !== game.LSR_DYING) {
      // HSP版1フレーム(加速→移動→減衰)を半ステップ分割:
      // 偶数フレーム: 加速→半移動、奇数フレーム: 半移動→減衰
      const dir = this.dir;
      if (this.frm % 2 === 0) {
        this.vx += Math.cos(dir) * game.Laser.CONFIG.accel;
        this.vy += Math.sin(dir) * game.Laser.CONFIG.accel;
      }
      this.pos.x += this.vx;
      this.pos.y += this.vy;
      if (this.frm % 2 !== 0) {
        this.vx = this.vx * game.Laser.CONFIG.damping;
        this.vy = this.vy * game.Laser.CONFIG.damping;
      }
    } else {
      // 消滅途中: 全節が同一座標に収束したら消滅
      let moving = false;
      for (let j = 0; j < t.length - 1; j++) {
        if (t[j].x !== t[j + 1].x || t[j].y !== t[j + 1].y) {
          moving = true;
          break;
        }
      }
      if (!moving) {
        this.destroy();
      }
    }

    // 先頭ノードをposに同期
    t[0].x = this.pos.x;
    t[0].y = this.pos.y;
  }

  // ターゲット喪失検知 + 再検索
  updateTargeting() {
    const ctx = game.ctx;
    if (this.sta === game.LSR_TRACKING && (this.trg === null || !this.trg.alive)) {
      // ターゲット喪失時にlckOnをデクリメント（発射時の++と対応）
      if (this.trg !== null && this.trg.lckOn > 0) {
        this.trg.lckOn--;
      }
      this.sta = game.LSR_NO_TARGET;
    }
    if (this.sta === game.LSR_NO_TARGET) {
      const isBoss = ctx.boss.flg === game.BOSS_BATTLE;
      const candidates = isBoss ? game.BossPart.all : game.Enemy.all;
      const newTrg = ctx.player.searchTarget(candidates, !isBoss);
      if (newTrg !== null) {
        this.sta = game.LSR_TRACKING;
        this.trg = newTrg;
        newTrg.lckOn++;
      }
    }
  }

  // ターゲットへの方向を更新（2フレームに1回）
  updateDirection() {
    if (this.sta !== game.LSR_TRACKING) return;
    if (this.frm % 2 === 0) {
      this.dir = game.calcDir(this.pos, this.trg.pos);
    }
  }

  // ターゲットに命中
  onHit() {
    game.ctx.score += game.Laser.CONFIG.hitScore;
    game.spawnHitSparks(this.pos.x, this.pos.y, 2);
    this.sta = game.LSR_DYING;
  }

  update() {
    if (game.ctx.isPaused()) return;
    this.updateMovement();
    this.updateTargeting();
    this.updateDirection();

    // ターゲットなし状態で画面外に出たら消滅開始
    if (this.sta === game.LSR_NO_TARGET) {
      if (game.isOutOfBounds(this.pos.x, this.pos.y, game.BOUNDS.LASER)) {
        this.sta = game.LSR_DYING;
      }
    }
    this.frm++;
  }

  // レーザー描画（オフスクリーンCanvas→加算合成）
  // レーザー1本ごとにオフスクリーン描画→加算転写する。
  // まとめて描画すると、Canvas上でレーザー同士が通常合成され加算効果が失われるため個別転写が必須。
  render() {
    const c2d = game.laserCtx2d;
    const W = game.SCREEN_W;
    const H = game.SCREEN_H;
    const halfW = W / 2;
    const halfH = H / 2;
    const d = game.Laser.DRAW;
    const t = this.trail;

    // オフスクリーンに不透明で描画（round capで継ぎ目なし）
    c2d.clearRect(0, 0, W, H);
    for (let j = d.segments - 1; j >= 0; j--) {
      c2d.strokeStyle = `rgb(${d.baseR},${d.baseG - j*d.fadeG},${d.baseB - j*d.fadeB})`;
      c2d.beginPath();
      c2d.moveTo(t[j].x + halfW, halfH - t[j].y);
      c2d.lineTo(t[j+1].x + halfW, halfH - t[j+1].y);
      c2d.stroke();
    }

    // テクスチャ更新→加算合成でゲーム画面に転写
    game.laserTexInfo.createWebGLTexture();
    setBlendMode(true);
    drawTile(vec2(0, 0), vec2(W, H), game.laserTile, game.color(1, 1, 1, 0.8));
    glFlush();
    setBlendMode();
  }
};

//////////プレーヤークラス//////////
game.Player = class extends game.GameObject {
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
  static DATA = { sx: 80, sy: 80, baseX: 240, normalY: 0, hitY: 80, tex: game.TEX.PLAYER };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };
  // ショット発射位置テーブル（ラジアン、旧DatShtDir後半6要素）
  static SHT_POS = [184, 200, 174, 210, 166, 218].map(a => -a * Math.PI / 128);
  // レーザー発射方向テーブル（ラジアン、旧DatLsrDir）
  static LSR_DIR = [187, 197, 177, 207, 167, 217, 157, 227].map(a => -a * Math.PI / 128);

  constructor() {
    super(vec2(game.Player.CONFIG.initX, game.Player.CONFIG.initY), 20); // renderOrder=20
    this.init();
  }

  // プレーヤー初期化（旧IniPly）
  init() {
    this.alive = true;
    this.shield = game.Player.CONFIG.initShield;
    this.pos.x = game.Player.CONFIG.initX;
    this.pos.y = game.Player.CONFIG.initY;
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
  update() {
    const ctx = game.ctx;
    if (ctx.gameSta !== game.STA_PLAY) return;

    if (!this.alive) {
      this.lsrPow = 0;
      this.updateLaserDisplay();
      return;
    }

    this.updateMovement();
    this.updateShot();
    this.updateLaser();
    this.updateLaserDisplay();
    this.updateHitCounter();

    this.frm++;
  }

  // 入力→移動→傾き→境界制限
  updateMovement() {
    const dx = game.keyIsDown(game.KEY_RIGHT) - game.keyIsDown(game.KEY_LEFT);
    const dy = game.keyIsDown(game.KEY_UP) - game.keyIsDown(game.KEY_DOWN);

    if (dx || dy) {
      const r = Math.atan2(dy, dx);
      this.pos.x += Math.cos(r) * game.Player.CONFIG.moveSpeed;
      this.pos.y += Math.sin(r) * game.Player.CONFIG.moveSpeed;
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
    if (this.pos.x < -game.BOUNDS.PLAYER) { this.pos.x = -game.BOUNDS.PLAYER; }
    if (this.pos.y < -game.BOUNDS.PLAYER) { this.pos.y = -game.BOUNDS.PLAYER; }
    if (this.pos.x > game.BOUNDS.PLAYER) { this.pos.x = game.BOUNDS.PLAYER; }
    if (this.pos.y > game.BOUNDS.PLAYER) { this.pos.y = game.BOUNDS.PLAYER; }
  }

  // ショット発射カウンタ＆生成
  updateShot() {
    if (this.shtCnt !== 0) {
      this.shtCnt--;
    } else {
      if (game.keyIsDown(game.KEY_SHOT)) {
        this.shtCnt = game.Player.CONFIG.shotInterval;
        for (let i = 0; i < this.shtLV * 2; i++) {
          const posRad = game.Player.SHT_POS[i];
          const x = Math.cos(posRad) * 40 + this.pos.x;
          const y = Math.sin(posRad) * 40 + this.pos.y;
          new game.PlayerShot(x, y);
        }
      }
    }
  }

  // レーザーチャージ＆発射
  updateLaser() {
    if (this.lsrF === game.LSR_CHARGE_ON) {
      if (game.keyIsDown(game.KEY_LASER)) {
        if (this.lsrPow >= game.Player.CONFIG.laserThreshold) {
          const count = Math.min(Math.floor(this.lsrPow / game.Player.CONFIG.laserThreshold), game.Player.LSR_DIR.length);
          const isBoss = game.ctx.boss.flg === game.BOSS_BATTLE;
          const candidates = isBoss ? game.BossPart.all : game.Enemy.all;
          for (let i = 0; i < count; i++) {
            const trg = this.searchTarget(candidates, !isBoss);
            if (trg !== null) { trg.lckOn++; }
            const rad = game.Player.LSR_DIR[i];
            const vx = Math.cos(rad) * 16;
            const vy = Math.sin(rad) * 16;
            new game.Laser(this.pos.x, this.pos.y + 40, vx, vy, trg);
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
  }

  // レーザーバー表示値の追従
  updateLaserDisplay() {
    this.lsrPowDisplay = Math.max(this.lsrPow, this.lsrPowDisplay - game.Player.CONFIG.laserDecay);
  }

  // 被弾無敵カウンタ
  updateHitCounter() {
    if (this.hitCnt !== 0) {
      this.hitCnt--;
    }
  }

  // 被弾処理
  onHit() {
    this.hitCnt = game.Player.CONFIG.hitInvincible;
    this.shield--;
    if (this.shield <= 0) {
      this.alive = false;
      const d = game.Player.DATA;
      game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 5);
    } else {
      game.spawnHitSparks(this.pos.x, this.pos.y);
    }
  }

  // ロックオンする敵をサーチ（旧SearchTrget）
  // candidates: 候補オブジェクトのリスト
  // useLockOn: trueならロックオン数が少ない候補を優先
  // 戻り値: ターゲットオブジェクト参照（null=なし）
  searchTarget(candidates, useLockOn) {
    let trg = null;
    for (const c of candidates) {
      if (!c.alive) continue;
      if (trg === null) { trg = c; continue; }

      if (useLockOn) {
        if (trg.lckOn > c.lckOn) { trg = c; continue; }
        if (trg.lckOn < c.lckOn) { continue; }
      }

      // 距離が近い方を優先
      let tx = trg.pos.x - this.pos.x; tx = tx * tx;
      let ty = trg.pos.y - this.pos.y; ty = ty * ty;
      const rd = tx + ty;
      let ix = c.pos.x - this.pos.x; ix = ix * ix;
      let iy = c.pos.y - this.pos.y; iy = iy * iy;
      if (rd > ix + iy) {
        trg = c;
      }
    }
    return trg;
  }

  // プレーヤー描画（旧DrwPly）
  render() {
    if (!this.alive) return;
    const d = game.Player.DATA;
    const frameX = Math.floor(this.gra / 2) * d.sx + d.baseX;
    const frameY = (Math.floor(this.hitCnt / 6) % 2 === 0) ? d.normalY : d.hitY;
    const ti = game.tile(frameX, frameY, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }

};
