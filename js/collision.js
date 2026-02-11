game.SCORE_SHOT_HIT = 10;

//////////衝突判定システム//////////
game.CollisionSystem = class {
  // AABB衝突判定（旧 stg_clash）
  // (x1,y1)(x2,y2)を対角線とする矩形と(x3,y3)(x4,y4)を対角線とする矩形が重なっていればtrue
  static checkAABB(x1, y1, x2, y2, x3, y3, x4, y4) {
    if (x1 > x4) return false;
    if (y1 > y4) return false;
    if (x2 < x3) return false;
    if (y2 < y3) return false;
    return true;
  }

  // 方向計算（旧 stg_dir）
  // (x0,y0)から(x1,y1)への向きをラジアンで返す
  static calcDir(x0, y0, x1, y1) {
    let dx = x1 - x0;
    let dy = y1 - y0;
    if (dx !== 0 || dy !== 0) {
      return Math.atan2(dy, dx);
    }
    return 0;
  }

  // プレイヤーショット vs 敵
  static checkPlayerShotsVsEnemies(ctx) {
    const sd = game.PlayerShot.DATA;
    for (const e of engineObjects) {
      if (!(e instanceof game.Enemy) || e.destroyed) continue;
      const d = e.constructor.DATA;

      for (const s of engineObjects) {
        if (!(s instanceof game.PlayerShot) || s.destroyed) continue;
        if (game.CollisionSystem.checkAABB(
          d.hitX1 + e.x, d.hitY1 + e.y, d.hitX2 + e.x, d.hitY2 + e.y,
          sd.hitX1 + s.x, sd.hitY1 + s.y, sd.hitX2 + s.x, sd.hitY2 + s.y
        )) {
          ctx.score += game.SCORE_SHOT_HIT;
          s.destroy();
          e.shield--;
          game.spawnHitSpark(s.x, s.y);
          if (e.shield <= 0) {
            e.destroy();
            game.spawnExplosion(e.x, e.y, d.sx, d.sy, 5);
            break;
          }
        }
      }
    }
  }

  // プレイヤー vs 敵（接触ダメージ）
  static checkPlayerVsEnemies(ctx) {
    const ply = ctx.player;
    if (!ply.alive || ply.hitCnt !== 0) return;
    const pd = game.Player.DATA;

    for (const e of engineObjects) {
      if (!(e instanceof game.Enemy) || e.destroyed) continue;
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
  static checkPlayerShotsVsBoss(ctx) {
    const boss = ctx.boss;
    if (boss.flg !== game.BOSS_BATTLE) return;
    const sd = game.PlayerShot.DATA;

    for (let i = 0; i < game.Boss.MAX_PARTS; i++) {
      const prt = boss.parts[i];
      if (!prt.alive) continue;
      const d = prt.constructor.DATA;

      for (const s of engineObjects) {
        if (!(s instanceof game.PlayerShot) || s.destroyed) continue;

        if (game.CollisionSystem.checkAABB(
          prt.pos.x + d.hitX1, prt.pos.y + d.hitY1,
          prt.pos.x + d.hitX2, prt.pos.y + d.hitY2,
          sd.hitX1 + s.x, sd.hitY1 + s.y,
          sd.hitX2 + s.x, sd.hitY2 + s.y
        )) {
          ctx.score += game.SCORE_SHOT_HIT;
          s.destroy();
          boss.shield--;
          prt.shield--;
          game.spawnHitSpark(s.x, s.y);
          if (boss.shield <= 0) {
            boss.flg = game.BOSS_DESTROY;
            boss.frm = 0;
          }
          if (prt.shield <= 0) {
            prt.alive = false;
            prt.cx = d.sx;
            game.spawnExplosion(prt.pos.x, prt.pos.y, d.sx, d.sy, 5);
            break;
          }
        }
      }
    }
  }

  // 敵ショット vs プレイヤー
  static checkEnemyShotsVsPlayer(ctx) {
    const ply = ctx.player;
    if (!ply.alive || ply.hitCnt !== 0) return;
    const pd = game.Player.DATA;

    for (const es of engineObjects) {
      if (!(es instanceof game.EnemyShot) || es.destroyed) continue;
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
  static checkPlayerShotsVsEnemyShots(ctx) {
    const sd = game.PlayerShot.DATA;
    for (const es of engineObjects) {
      if (!(es instanceof game.EnemyShot2) || es.destroyed) continue;
      const d = es.constructor.DATA;

      for (const ps of engineObjects) {
        if (!(ps instanceof game.PlayerShot) || ps.destroyed) continue;
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
  static checkAllCollisions(ctx) {
    // 通常敵の衝突判定は常に実行（ボス戦突入時に残存敵がいる場合に備える）
    game.CollisionSystem.checkPlayerShotsVsEnemies(ctx);
    game.CollisionSystem.checkPlayerVsEnemies(ctx);
    if (ctx.boss.flg === game.BOSS_BATTLE) {
      game.CollisionSystem.checkPlayerShotsVsBoss(ctx);
    }
    game.CollisionSystem.checkPlayerShotsVsEnemyShots(ctx);
    game.CollisionSystem.checkEnemyShotsVsPlayer(ctx);
  }
};
