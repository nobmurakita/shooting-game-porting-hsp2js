//////////レーザークラス//////////
game.Laser = class extends game.GameObject {
  static all = new Set();
  // レーザー状態
  static STATE_DYING     = 0;  // 消滅中
  static STATE_TRACKING  = 1;  // 追跡中
  static STATE_NO_TARGET = 2;  // ターゲット未設定
  static DRAW = {
    segments: 14,
    baseR: 50, baseG: 255, baseB: 160,
    fadeG: 10, fadeB: 10,
  };
  static SOUND = new Sound([.5,,202,,.29,.16,,3.5,-48,44,,,,,16,,,.52,.08]);

  constructor(px, py, vx, vy, trg) {
    super(vec2(px, py), 50); // renderOrder=50（最前面）
    game.Laser.all.add(this);
    game.Laser.SOUND.play();
    this.trg = trg;
    this.sta = trg ? game.Laser.STATE_TRACKING : game.Laser.STATE_NO_TARGET;
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
    if (this.sta === game.Laser.STATE_NO_TARGET) {
      if (game.isOutOfBounds(this.pos.x, this.pos.y, game.BOUNDS.LASER)) {
        this.sta = game.Laser.STATE_DYING;
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

    if (this.sta !== game.Laser.STATE_DYING) {
      // HSP版1フレーム(加速→移動→減衰)を半ステップ分割:
      // 偶数フレーム: 加速→半移動、奇数フレーム: 半移動→減衰
      const dir = this.dir;
      if (this.frame % 2 === 0) {
        this.vx += Math.cos(dir) * 5.0;
        this.vy += Math.sin(dir) * 5.0;
      }
      this.pos.x += this.vx;
      this.pos.y += this.vy;
      if (this.frame % 2 !== 0) {
        this.vx = this.vx * 0.8;
        this.vy = this.vy * 0.8;
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
    if (this.sta === game.Laser.STATE_TRACKING && (this.trg === null || !this.trg.alive)) {
      // ターゲット喪失時にlckOnをデクリメント（発射時の++と対応）
      if (this.trg !== null && this.trg.lockOnCount > 0) {
        this.trg.lockOnCount--;
      }
      this.sta = game.Laser.STATE_NO_TARGET;
    }
    if (this.sta === game.Laser.STATE_NO_TARGET) {
      const isBoss = game.Boss.instance.flg === game.Boss.STATE_BATTLE;
      const candidates = isBoss ? game.BossPart.all : game.Enemy.all;
      const newTrg = game.Player.instance.searchTarget(candidates, !isBoss);
      if (newTrg !== null) {
        this.sta = game.Laser.STATE_TRACKING;
        this.trg = newTrg;
        newTrg.lockOnCount++;
      }
    }
  }

  // ターゲットへの方向を更新（2フレームに1回）
  updateDirection() {
    if (this.sta !== game.Laser.STATE_TRACKING) return;
    if (this.frame % 2 === 0) {
      this.dir = game.calcDir(this.pos, this.trg.pos);
    }
  }

  // レーザー描画（個別Canvas→バッチCanvasに蓄積）
  // 個別CanvasにはSource-overで描画してround capの継ぎ目を正しく処理し、
  // バッチCanvasへはlighter合成で蓄積する。GPU転写はgameRenderPostで一括実行。
  render() {
    const c2d = game.laserCtx2d;
    const W = game.SCREEN_W;
    const H = game.SCREEN_H;
    const halfW = W / 2;
    const halfH = H / 2;
    const d = game.Laser.DRAW;
    const t = this.trail;

    // 個別キャンバスにsource-overで描画（round capで継ぎ目なし）
    // 色はalpha(0.8)を事前乗算済み（GPU転写時のalpha乗算と数学的に等価）
    c2d.clearRect(0, 0, W, H);
    for (let j = d.segments - 1; j >= 0; j--) {
      c2d.strokeStyle = `rgb(${d.baseR * .8},${(d.baseG - j*d.fadeG) * .8},${(d.baseB - j*d.fadeB) * .8})`;
      c2d.beginPath();
      c2d.moveTo(t[j].x + halfW, halfH - t[j].y);
      c2d.lineTo(t[j+1].x + halfW, halfH - t[j+1].y);
      c2d.stroke();
    }

    // バッチキャンバスに加算合成で蓄積
    game.laserBatchCtx2d.drawImage(game.laserCanvas, 0, 0);
  }

  destroy() {
    game.Laser.all.delete(this);
    super.destroy();
  }

  // レーザーは先頭1点のみで当たり判定（ターゲットのAABB内にあるかで判定）
  hitBox() {
    return [this.pos.x, this.pos.y, this.pos.x, this.pos.y];
  }

  // ターゲットに命中
  onHit() {
    game.ctx.score += 100;
    game.spawnHitSparks(this.pos.x, this.pos.y, 2);
    this.sta = game.Laser.STATE_DYING;
  }
};
