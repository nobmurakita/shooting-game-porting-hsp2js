import { LASER_STATE_TRACKING } from './game.js';
import { player, enemies, bossParts, playerShots, lasers, enemyShots, enemyShots2 } from './registry.js';

//////////衝突判定システム//////////
export const CollisionSystem = {
  // AABB衝突判定（stg_clash）
  checkAABB(a, b) {
    const [x1, y1, x2, y2] = a.hitBox();
    const [x3, y3, x4, y4] = b.hitBox();
    if (x1 > x4) return false;
    if (y1 > y4) return false;
    if (x2 < x3) return false;
    if (y2 < y3) return false;
    return true;
  },

  // ショット vs ターゲット群の共通処理
  // shots: PlayerShotリスト, targets: onHitByShot() を持つ対象リスト
  _checkShotsVsTargets(shots, targets) {
    for (const target of targets) {
      if (!target.alive) continue;
      for (const s of shots) {
        if (!s.alive) continue;
        if (this.checkAABB(target, s)) {
          s.onHit();
          if (target.onHitByShot()) break;
        }
      }
    }
  },

  // 全衝突判定を一括実行（プレイヤー攻撃→敵攻撃の順で判定）
  checkAllCollisions() {
    const ply = player;

    // プレイヤー攻撃（先に敵を撃破することで被弾を回避できる）
    for (const lsr of lasers) {
      if (lsr.sta !== LASER_STATE_TRACKING || !lsr.trg.alive) continue;
      if (this.checkAABB(lsr, lsr.trg)) {
        lsr.onHit();
        lsr.trg.onHitByLaser();
      }
    }
    this._checkShotsVsTargets(playerShots, enemyShots2);
    this._checkShotsVsTargets(playerShots, enemies);
    this._checkShotsVsTargets(playerShots, bossParts);

    // 敵攻撃
    if (ply.alive && ply.hitCnt === 0) {
      for (const e of enemies) {
        if (this.checkAABB(e, ply)) {
          e.onHitByPlayer();
          ply.onHit();
          break;
        }
      }
      if (ply.alive && ply.hitCnt === 0) {
        for (const bp of bossParts) {
          if (!bp.alive) continue;
          if (this.checkAABB(bp, ply)) {
            ply.onHit();
            break;
          }
        }
      }
      if (ply.alive && ply.hitCnt === 0) {
        for (const es of enemyShots) {
          if (this.checkAABB(es, ply)) {
            es.onHit();
            ply.onHit();
            break;
          }
        }
      }
    }
  },
};
