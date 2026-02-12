//////////衝突判定システム//////////
game.CollisionSystem = class {
  // AABB衝突判定（stg_clash）
  static checkAABB(a, b) {
    const [x1, y1, x2, y2] = a.hitBox();
    const [x3, y3, x4, y4] = b.hitBox();
    if (x1 > x4) return false;
    if (y1 > y4) return false;
    if (x2 < x3) return false;
    if (y2 < y3) return false;
    return true;
  }

  // ショット vs ターゲット群の共通処理
  // shots: PlayerShotリスト, targets: onHitByShot() を持つ対象リスト
  static _checkShotsVsTargets(shots, targets) {
    for (const target of targets) {
      if (!target.alive) continue;
      for (const s of shots) {
        if (!s.alive) continue;
        if (game.CollisionSystem.checkAABB(target, s)) {
          s.onHit();
          if (target.onHitByShot()) break;
        }
      }
    }
  }

  // 全衝突判定を一括実行（プレイヤー攻撃→敵攻撃の順で判定）
  static checkAllCollisions() {
    const ply = game.ctx.player;
    const shots = game.objectsOf(game.PlayerShot);
    const enemies = game.objectsOf(game.Enemy);
    const lasers = game.objectsOf(game.Laser);
    const enemyShots = game.objectsOf(game.EnemyShot);
    const breakableShots = game.objectsOf(game.EnemyShot2);
    const bossParts = game.objectsOf(game.BossPart);

    // プレイヤー攻撃（先に敵を撃破することで被弾を回避できる）
    for (const lsr of lasers) {
      if (lsr.sta !== game.LSR_TRACKING || !lsr.trg.alive) continue;
      if (game.CollisionSystem.checkAABB(lsr, lsr.trg)) {
        lsr.onHit();
        lsr.trg.onHitByLaser(game.Laser.CONFIG.damage);
      }
    }
    game.CollisionSystem._checkShotsVsTargets(shots, breakableShots);
    game.CollisionSystem._checkShotsVsTargets(shots, enemies);
    game.CollisionSystem._checkShotsVsTargets(shots, bossParts);

    // 敵攻撃
    if (ply.alive && ply.hitCnt === 0) {
      for (const e of enemies) {
        if (game.CollisionSystem.checkAABB(e, ply)) {
          e.onContactPlayer();
          ply.onHit();
          break;
        }
      }
      if (ply.alive && ply.hitCnt === 0) {
        for (const bp of bossParts) {
          if (!bp.alive) continue;
          if (game.CollisionSystem.checkAABB(bp, ply)) {
            ply.onHit();
            break;
          }
        }
      }
      if (ply.alive && ply.hitCnt === 0) {
        for (const es of enemyShots) {
          if (game.CollisionSystem.checkAABB(es, ply)) {
            es.onHitPlayer();
            ply.onHit();
            break;
          }
        }
      }
    }
  }
};
