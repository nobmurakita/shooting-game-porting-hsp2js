//////////プレーヤークラス//////////
game.Player = class extends game.GameObject {
  static instance = null;
  static DATA = { sx: 80, sy: 80, baseX: 240, normalY: 0, hitY: 80, tex: game.TEX.PLAYER };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };
  static SOUND_DESTROY = new Sound([1,,150,.05,.3,.4,4,2,-5,,,,,1,20,.1,,.6,.1]);
  // ショット発射位置テーブル（ラジアン、旧DatShtDir後半6要素）
  static SHT_POS = [184, 200, 174, 210, 166, 218].map(a => -a * Math.PI / 128);
  // レーザー発射方向テーブル（ラジアン、旧DatLsrDir）
  static LSR_DIR = [187, 197, 177, 207, 167, 217, 157, 227].map(a => -a * Math.PI / 128);

  constructor() {
    super(vec2(0, -220), 20); // renderOrder=20
    game.Player.instance = this;
    this.init();
  }

  // プレーヤー初期化（旧IniPly）
  init() {
    this.alive = true;
    this.shield = 5;
    this.pos.x = 0;
    this.pos.y = -220;
    this.hitCnt = 0;
    this.tilt = 0;
    this.frame = 0;
    this.shotCooldown = 0;
    this.shotLevel = 1;
    this.laserCharge = false;
    this.laserPower = 0;
    this.laserPowerDisplay = 0;
  }

  // プレーヤー移動（旧MovPly）
  update() {
    const ctx = game.ctx;
    if (ctx.gameSta !== game.STA_PLAY) return;

    if (!this.alive) {
      this.laserPower = 0;
      this.updateLaserDisplay();
      return;
    }

    this.updateMovement();
    this.updateShot();
    this.updateLaser();
    this.updateLaserDisplay();
    this.updateHitCounter();

    this.frame++;
  }

  // 入力→移動→傾き→境界制限
  updateMovement() {
    const dx = game.keyIsDown(game.KEY_RIGHT) - game.keyIsDown(game.KEY_LEFT);
    const dy = game.keyIsDown(game.KEY_UP) - game.keyIsDown(game.KEY_DOWN);

    if (dx || dy) {
      const r = Math.atan2(dy, dx);
      this.pos.x += Math.cos(r) * 5.5;
      this.pos.y += Math.sin(r) * 5.5;
    }

    // 傾きアニメーション
    if (dx === 0) {
      if (this.tilt < 0) { this.tilt++; }
      if (this.tilt > 0) { this.tilt--; }
    } else {
      this.tilt += dx;
      if (this.tilt < -6) { this.tilt = -6; }
      if (this.tilt > 6) { this.tilt = 6; }
    }

    // はみ出し制限
    if (this.pos.x < -game.BOUNDS.PLAYER) { this.pos.x = -game.BOUNDS.PLAYER; }
    if (this.pos.y < -game.BOUNDS.PLAYER) { this.pos.y = -game.BOUNDS.PLAYER; }
    if (this.pos.x > game.BOUNDS.PLAYER) { this.pos.x = game.BOUNDS.PLAYER; }
    if (this.pos.y > game.BOUNDS.PLAYER) { this.pos.y = game.BOUNDS.PLAYER; }
  }

  // ショット発射カウンタ＆生成
  updateShot() {
    if (this.shotCooldown !== 0) {
      this.shotCooldown--;
    } else {
      if (game.keyIsDown(game.KEY_SHOT)) {
        this.shotCooldown = 6;
        for (let i = 0; i < this.shotLevel * 2; i++) {
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
    if (this.laserCharge) {
      if (game.keyIsDown(game.KEY_LASER)) {
        if (this.laserPower >= 40) {
          const count = Math.min(Math.floor(this.laserPower / 40), game.Player.LSR_DIR.length);
          const isBoss = game.Boss.instance.flg === game.Boss.STATE_BATTLE;
          const candidates = isBoss ? game.BossPart.all : game.Enemy.all;
          for (let i = 0; i < count; i++) {
            const trg = this.searchTarget(candidates, !isBoss);
            if (trg !== null) { trg.lockOnCount++; }
            const rad = game.Player.LSR_DIR[i];
            const vx = Math.cos(rad) * 16;
            const vy = Math.sin(rad) * 16;
            new game.Laser(this.pos.x, this.pos.y + 40, vx, vy, trg);
          }
          this.laserPower = 0;
        }
      } else {
        this.laserPower += (game.keyIsDown(game.KEY_SHOT) ? 0.5 : 1.5);
        if (this.laserPower > 320) {
          this.laserPower = 320;
        }
      }
    } else {
      this.laserPower -= 12.5;
      if (this.laserPower < 0) {
        this.laserPower = 0;
      }
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
        if (trg.lockOnCount > c.lockOnCount) { trg = c; continue; }
        if (trg.lockOnCount < c.lockOnCount) { continue; }
      }

      // 距離が近い方を優先
      const trgDist2 = (trg.pos.x - this.pos.x) ** 2 + (trg.pos.y - this.pos.y) ** 2;
      const candDist2 = (c.pos.x - this.pos.x) ** 2 + (c.pos.y - this.pos.y) ** 2;
      if (trgDist2 > candDist2) {
        trg = c;
      }
    }
    return trg;
  }

  // レーザーバー表示値の追従
  updateLaserDisplay() {
    this.laserPowerDisplay = Math.max(this.laserPower, this.laserPowerDisplay - 12.5);
  }

  // 被弾無敵カウンタ
  updateHitCounter() {
    if (this.hitCnt !== 0) {
      this.hitCnt--;
    }
  }

  // プレーヤー描画（旧DrwPly）
  render() {
    if (!this.alive) return;
    const d = game.Player.DATA;
    const frameX = Math.floor(this.tilt / 2) * d.sx + d.baseX;
    const frameY = (Math.floor(this.hitCnt / 6) % 2 === 0) ? d.normalY : d.hitY;
    const ti = game.tile(frameX, frameY, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }

  destroy() {
    game.Player.instance = null;
    super.destroy();
  }

  // 被弾処理
  onHit() {
    this.hitCnt = 100;
    this.shield--;
    if (this.shield <= 0) {
      this.alive = false;
      const d = game.Player.DATA;
      game.spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 5);
      game.Player.SOUND_DESTROY.play();
    } else {
      game.spawnHitSparks(this.pos.x, this.pos.y);
    }
  }

};

//////////プレーヤーショットクラス//////////
game.PlayerShot = class extends game.GameObject {
  static all = new Set();
  static DATA = { sx: 20, sy: 40, cx: 560, cy: 0, tex: game.TEX.PLAYER };
  static HIT = { x1: -10, y1: -20, x2: 10, y2: 20 };
  static SOUND = new Sound([.5,,900,.01,.02,.08,2,1.5,-40,,400,.02]);

  constructor(x, y) {
    super(vec2(x, y), 10);  // renderOrder=10
    game.PlayerShot.all.add(this);
    game.PlayerShot.SOUND.play();
  }

  update() {
    if (game.ctx.isPaused()) return;
    this.pos.y += 16;
    if (this.pos.y > 340) {
      this.destroy();
    }
    this.frame++;
  }

  render() {
    const d = game.PlayerShot.DATA;
    const ti = game.tile(d.cx, d.cy, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }

  destroy() {
    game.PlayerShot.all.delete(this);
    super.destroy();
  }

  // ターゲットに命中
  onHit() {
    game.ctx.score += 10;
    game.spawnHitSparks(this.pos.x, this.pos.y);
    this.destroy();
  }
};
