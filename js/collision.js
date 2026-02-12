//////////衝突判定システム//////////
game.CollisionSystem = {
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
    const ply = game.Player.instance;

    // プレイヤー攻撃（先に敵を撃破することで被弾を回避できる）
    for (const lsr of game.Laser.all) {
      if (lsr.sta !== game.Laser.STATE_TRACKING || !lsr.trg.alive) continue;
      if (this.checkAABB(lsr, lsr.trg)) {
        lsr.onHit();
        lsr.trg.onHitByLaser();
      }
    }
    this._checkShotsVsTargets(game.PlayerShot.all, game.EnemyShot2.all);
    this._checkShotsVsTargets(game.PlayerShot.all, game.Enemy.all);
    this._checkShotsVsTargets(game.PlayerShot.all, game.BossPart.all);

    // 敵攻撃
    if (ply.alive && ply.hitCnt === 0) {
      for (const e of game.Enemy.all) {
        if (this.checkAABB(e, ply)) {
          e.onHitByPlayer();
          ply.onHit();
          break;
        }
      }
      if (ply.alive && ply.hitCnt === 0) {
        for (const bp of game.BossPart.all) {
          if (!bp.alive) continue;
          if (this.checkAABB(bp, ply)) {
            ply.onHit();
            break;
          }
        }
      }
      if (ply.alive && ply.hitCnt === 0) {
        for (const es of game.EnemyShot.all) {
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
