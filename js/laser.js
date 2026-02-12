// レーザー状態
game.LSR_DYING     = 0;  // 消滅中
game.LSR_TRACKING  = 1;  // 追跡中
game.LSR_NO_TARGET = 2;  // ターゲット未設定

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
    this.frame++;
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
      if (this.frame % 2 === 0) {
        this.vx += Math.cos(dir) * game.Laser.CONFIG.accel;
        this.vy += Math.sin(dir) * game.Laser.CONFIG.accel;
      }
      this.pos.x += this.vx;
      this.pos.y += this.vy;
      if (this.frame % 2 !== 0) {
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
      if (this.trg !== null && this.trg.lockOnCount > 0) {
        this.trg.lockOnCount--;
      }
      this.sta = game.LSR_NO_TARGET;
    }
    if (this.sta === game.LSR_NO_TARGET) {
      const isBoss = game.Boss.instance.flg === game.BOSS_BATTLE;
      const candidates = isBoss ? game.BossPart.all : game.Enemy.all;
      const newTrg = game.Player.instance.searchTarget(candidates, !isBoss);
      if (newTrg !== null) {
        this.sta = game.LSR_TRACKING;
        this.trg = newTrg;
        newTrg.lockOnCount++;
      }
    }
  }

  // ターゲットへの方向を更新（2フレームに1回）
  updateDirection() {
    if (this.sta !== game.LSR_TRACKING) return;
    if (this.frame % 2 === 0) {
      this.dir = game.calcDir(this.pos, this.trg.pos);
    }
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

  destroy() {
    game.Laser.all.delete(this);
    super.destroy();
  }

  hitBox() {
    return [this.pos.x, this.pos.y, this.pos.x, this.pos.y];
  }

  // ターゲットに命中
  onHit() {
    game.ctx.score += game.Laser.CONFIG.hitScore;
    game.spawnHitSparks(this.pos.x, this.pos.y, 2);
    this.sta = game.LSR_DYING;
  }
};
