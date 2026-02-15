import { GameObject, ctx, SCREEN_W, SCREEN_H, BOUNDS, DIR_UP, BOSS_STATE_BATTLE, LASER_STATE_DYING, LASER_STATE_TRACKING, LASER_STATE_NO_TARGET, isOutOfBounds, calcDir, laserCtx2d, laserBatchCtx2d, laserCanvas } from './game.js';
import { player, boss, bossParts, enemies, lasers } from './registry.js';
import { spawnHitSparks } from './effect.js';

//////////レーザークラス//////////
export class Laser extends GameObject {
  static DRAW = {
    segments: 14,
    baseR: 50, baseG: 255, baseB: 160,
    fadeG: 10, fadeB: 10,
  };
  static SOUND = new Sound([.5,,202,,.29,.16,,3.5,-48,44,,,,,16,,,.52,.08]);

  constructor(px, py, vx, vy, trg) {
    super(vec2(px, py), 50); // renderOrder=50（最前面）
    lasers.add(this);
    Laser.SOUND.play();
    this.trg = trg;
    this.sta = trg ? LASER_STATE_TRACKING : LASER_STATE_NO_TARGET;
    this.trail = Array.from({length: 15}, () => vec2(px, py));
    this.vx = vx;
    this.vy = vy;
    this.dir = DIR_UP;
  }

  update() {
    if (ctx.isPaused()) return;
    this.updateMovement();
    this.updateTargeting();
    this.updateDirection();

    // ターゲットなし状態で画面外に出たら消滅開始
    if (this.sta === LASER_STATE_NO_TARGET) {
      if (isOutOfBounds(this.pos.x, this.pos.y, BOUNDS.LASER)) {
        this.sta = LASER_STATE_DYING;
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

    if (this.sta !== LASER_STATE_DYING) {
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
    if (this.sta === LASER_STATE_TRACKING && (this.trg === null || !this.trg.alive)) {
      // ターゲット喪失時にlckOnをデクリメント（発射時の++と対応）
      if (this.trg !== null && this.trg.lockOnCount > 0) {
        this.trg.lockOnCount--;
      }
      this.sta = LASER_STATE_NO_TARGET;
    }
    if (this.sta === LASER_STATE_NO_TARGET) {
      const isBoss = boss.flg === BOSS_STATE_BATTLE;
      const candidates = isBoss ? bossParts : enemies;
      const newTrg = player.searchTarget(candidates, !isBoss);
      if (newTrg !== null) {
        this.sta = LASER_STATE_TRACKING;
        this.trg = newTrg;
        newTrg.lockOnCount++;
      }
    }
  }

  // ターゲットへの方向を更新（2フレームに1回）
  updateDirection() {
    if (this.sta !== LASER_STATE_TRACKING) return;
    if (this.frame % 2 === 0) {
      this.dir = calcDir(this.pos, this.trg.pos);
    }
  }

  // レーザー描画（個別Canvas→バッチCanvasに蓄積）
  // 個別CanvasにはSource-overで描画してround capの継ぎ目を正しく処理し、
  // バッチCanvasへはlighter合成で蓄積する。GPU転写はgameRenderPostで一括実行。
  render() {
    const c2d = laserCtx2d;
    const W = SCREEN_W;
    const H = SCREEN_H;
    const halfW = W / 2;
    const halfH = H / 2;
    const d = Laser.DRAW;
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
    laserBatchCtx2d.drawImage(laserCanvas, 0, 0);
  }

  destroy() {
    lasers.delete(this);
    super.destroy();
  }

  // レーザーは先頭1点のみで当たり判定（ターゲットのAABB内にあるかで判定）
  hitBox() {
    return [this.pos.x, this.pos.y, this.pos.x, this.pos.y];
  }

  // ターゲットに命中
  onHit() {
    ctx.score += 100;
    spawnHitSparks(this.pos.x, this.pos.y, 2);
    this.sta = LASER_STATE_DYING;
  }
}
