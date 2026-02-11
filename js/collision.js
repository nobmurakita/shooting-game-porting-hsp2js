game.SCORE_SHOT_HIT = 10;

//////////衝突判定システム//////////
game.CollisionSystem = class {
  // AABB衝突判定（stg_clash）
  // (x1,y1)(x2,y2)を対角線とする矩形と(x3,y3)(x4,y4)を対角線とする矩形が重なっていればtrue
  static checkAABB(x1, y1, x2, y2, x3, y3, x4, y4) {
    if (x1 > x4) return false;
    if (y1 > y4) return false;
    if (x2 < x3) return false;
    if (y2 < y3) return false;
    return true;
  }

  // 方向計算（stg_dir）
  // (x0,y0)から(x1,y1)への向きをラジアンで返す
  static calcDir(x0, y0, x1, y1) {
    let dx = x1 - x0;
    let dy = y1 - y0;
    if (dx !== 0 || dy !== 0) {
      return Math.atan2(dy, dx);
    }
    return 0;
  }

  // ショット vs ターゲット群の共通処理
  // targets: 対象リスト
  // getPos: target → {x, y} 座標取得
  // onHit: (target, data) → boolean ヒット時処理（trueでbreak）
  static _checkShotsVsTargets(targets, getPos, onHit) {
    const sd = game.PlayerShot.DATA;
    const shots = game.objectsOf(game.PlayerShot);
    for (const target of targets) {
      const d = target.constructor.DATA;
      const pos = getPos(target);
      for (const s of shots) {
        if (s.destroyed) continue;
        if (game.CollisionSystem.checkAABB(
          d.hitX1 + pos.x, d.hitY1 + pos.y, d.hitX2 + pos.x, d.hitY2 + pos.y,
          sd.hitX1 + s.x, sd.hitY1 + s.y, sd.hitX2 + s.x, sd.hitY2 + s.y
        )) {
          game.ctx.score += game.SCORE_SHOT_HIT;
          s.destroy();
          game.spawnHitSpark(s.x, s.y);
          if (onHit(target, d)) break;
        }
      }
    }
  }

  // プレイヤーショット vs 敵
  static checkPlayerShotsVsEnemies() {
    game.CollisionSystem._checkShotsVsTargets(
      game.objectsOf(game.Enemy),
      e => e,  // enemy自体が{x, y}を持つ
      (e, d) => {
        e.shield--;
        if (e.shield <= 0) {
          e.destroy();
          game.spawnExplosion(e.x, e.y, d.sx, d.sy, 5);
          return true;
        }
        return false;
      }
    );
  }

  // プレイヤー vs 敵（接触ダメージ）
  static checkPlayerVsEnemies() {
    const ctx = game.ctx;
    const ply = ctx.player;
    if (!ply.alive || ply.hitCnt !== 0) return;
    const pd = game.Player.DATA;

    for (const e of game.objectsOf(game.Enemy)) {
      const d = e.constructor.DATA;

      if (game.CollisionSystem.checkAABB(
        d.hitX1 + e.x, d.hitY1 + e.y, d.hitX2 + e.x, d.hitY2 + e.y,
        pd.hitX1 + ply.x, pd.hitY1 + ply.y, pd.hitX2 + ply.x, pd.hitY2 + ply.y
      )) {
        e.destroy();
        // 敵の爆発エフェクト（小）
        game.spawnHitSparks(e.x, e.y, 2);
        // 敵の爆発エフェクト（大）
        game.spawnExplosion(e.x, e.y, d.sx, d.sy, 3);
        // プレイヤーにダメージ
        ply.hitCnt = game.Player.CONFIG.hitInvincible;
        ply.shield--;
        if (ply.shield <= 0) {
          ply.alive = false;
          game.spawnExplosion(ply.x, ply.y, pd.sx, pd.sy, 5);
        }
        break;
      }
    }
  }

  // プレイヤーショット vs ボスパーツ
  static checkPlayerShotsVsBoss() {
    const boss = game.ctx.boss;
    if (boss.flg !== game.BOSS_BATTLE) return;
    game.CollisionSystem._checkShotsVsTargets(
      boss.parts.filter(p => p.alive),
      p => p.pos,  // パーツはpos.x/pos.yで参照
      (p, d) => {
        boss.shield--;
        p.shield--;
        if (boss.shield <= 0) {
          boss.flg = game.BOSS_DESTROY;
          boss.destroyFrm = boss.frm;
        }
        if (p.shield <= 0) {
          p.alive = false;
          p.cx = d.sx;
          game.spawnExplosion(p.pos.x, p.pos.y, d.sx, d.sy, 5);
          return true;
        }
        return false;
      }
    );
  }

  // 敵ショット vs プレイヤー
  static checkEnemyShotsVsPlayer() {
    const ctx = game.ctx;
    const ply = ctx.player;
    if (!ply.alive || ply.hitCnt !== 0) return;
    const pd = game.Player.DATA;

    for (const es of game.objectsOf(game.EnemyShot)) {
      const d = es.constructor.DATA;

      if (game.CollisionSystem.checkAABB(
        d.hitX1 + es.x, d.hitY1 + es.y, d.hitX2 + es.x, d.hitY2 + es.y,
        pd.hitX1 + ply.x, pd.hitY1 + ply.y, pd.hitX2 + ply.x, pd.hitY2 + ply.y
      )) {
        es.destroy();
        ply.shield--;
        ply.hitCnt = game.Player.CONFIG.hitInvincible;
        game.spawnHitSparks(es.x, es.y, 2);
        if (ply.shield <= 0) {
          ply.alive = false;
          game.spawnExplosion(ply.x, ply.y, pd.sx, pd.sy, 3);
        }
        break;
      }
    }
  }

  // プレイヤーショット vs 誘導弾（EnemyShot2）
  static checkPlayerShotsVsEnemyShots() {
    const ctx = game.ctx;
    const sd = game.PlayerShot.DATA;
    const enemyShots = game.objectsOf(game.EnemyShot2);
    const playerShots = game.objectsOf(game.PlayerShot);
    for (const es of enemyShots) {
      const d = es.constructor.DATA;

      for (const ps of playerShots) {
        if (ps.destroyed) continue;
        if (game.CollisionSystem.checkAABB(
          d.hitX1 + es.x, d.hitY1 + es.y, d.hitX2 + es.x, d.hitY2 + es.y,
          sd.hitX1 + ps.x, sd.hitY1 + ps.y, sd.hitX2 + ps.x, sd.hitY2 + ps.y
        )) {
          ctx.score += game.SCORE_SHOT_HIT;
          ps.destroy();
          es.destroy();
          game.spawnHitSpark(ps.x, ps.y);
          game.spawnExplosion(es.x, es.y, d.sx, d.sy, 2);
          break;
        }
      }
    }
  }

  // 全衝突判定を一括実行
  static checkAllCollisions() {
    const ctx = game.ctx;
    // 通常敵の衝突判定は常に実行（ボス戦突入時に残存敵がいる場合に備える）
    game.CollisionSystem.checkPlayerShotsVsEnemies();
    game.CollisionSystem.checkPlayerVsEnemies();
    if (ctx.boss.flg === game.BOSS_BATTLE) {
      game.CollisionSystem.checkPlayerShotsVsBoss();
    }
    game.CollisionSystem.checkPlayerShotsVsEnemyShots();
    game.CollisionSystem.checkEnemyShotsVsPlayer();
  }
};
