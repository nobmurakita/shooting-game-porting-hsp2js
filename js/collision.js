//////////衝突判定システム//////////
hsp.CollisionSystem = class {
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
    const sh = hsp.PlayerShot.HITBOX;
    for (const e of ctx.enemies) {
      if (!e.alive) continue;
      const d = e.constructor.DATA;

      for (const s of ctx.playerShots) {
        if (!s.alive) continue;
        if (hsp.CollisionSystem.checkAABB(
          d.hitX1 + e.x, d.hitY1 + e.y, d.hitX2 + e.x, d.hitY2 + e.y,
          s.x - sh.hw, s.y - sh.hh, s.x + sh.hw, s.y + sh.hh
        )) {
          ctx.score += 10;
          s.alive = false;
          e.shield--;
          hsp.spawnHitSpark(ctx, s.x, s.y);
          if (e.shield === 0) {
            e.alive = false;
            hsp.spawnExplosion(ctx, e.x, e.y, d.sx, d.sy, 5);
            break;
          }
        }
      }
    }
  }

  // プレイヤー vs 敵（接触ダメージ）
  static checkPlayerVsEnemies(ctx) {
    const ply = ctx.player;
    if (ply.hitCnt !== 0) return;
    const ph = hsp.Player.HITBOX;

    for (const e of ctx.enemies) {
      if (!e.alive) continue;
      const d = e.constructor.DATA;

      if (hsp.CollisionSystem.checkAABB(
        d.hitX1 + e.x, d.hitY1 + e.y, d.hitX2 + e.x, d.hitY2 + e.y,
        ply.x - ph.hw, ply.y - ph.hh, ply.x + ph.hw, ply.y + ph.hh
      )) {
        e.alive = false;
        // 敵の爆発エフェクト（小）
        hsp.spawnHitSparks(ctx, e.x, e.y, 2);
        // 敵の爆発エフェクト（大）
        hsp.spawnExplosion(ctx, e.x, e.y, d.sx, d.sy, 3);
        // プレイヤーにダメージ
        ply.hitCnt = 50;
        ply.shield--;
        if (ply.shield === 0) {
          ply.alive = false;
          // プレイヤー爆発エフェクト
          hsp.spawnExplosion(ctx, ply.x, ply.y, 40, 40, 5);
        }
        break;
      }
    }
  }

  // プレイヤーショット vs ボスパーツ
  static checkPlayerShotsVsBoss(ctx) {
    const boss = ctx.boss;
    if (boss.flg !== 1) return;
    const sh = hsp.PlayerShot.HITBOX;

    for (let i = 0; i < hsp.Boss.MAX_PARTS; i++) {
      const prt = boss.parts[i];
      if (!prt.alive) continue;
      const d = prt.constructor.DATA;

      for (const s of ctx.playerShots) {
        if (!s.alive) continue;

        if (hsp.CollisionSystem.checkAABB(
          boss.x + d.x + d.hitX1, boss.y + d.y + d.hitY1,
          boss.x + d.x + d.hitX2, boss.y + d.y + d.hitY2,
          s.x - sh.hw, s.y - sh.hh,
          s.x + sh.hw, s.y + sh.hh
        )) {
          ctx.score += 10;
          s.alive = false;
          boss.shield--;
          prt.shield--;
          hsp.spawnHitSpark(ctx, s.x, s.y);
          if (boss.shield === 0) {
            boss.flg = 2;
            boss.frm = 0;
          }
          if (prt.shield === 0) {
            prt.alive = false;
            prt.cx = d.sx;
            hsp.spawnExplosion(ctx, d.x + boss.x, d.y + boss.y, d.sx, d.sy, 5);
            break;
          }
        }
      }
    }
  }

  // 敵ショット vs プレイヤー
  static checkEnemyShotsVsPlayer(ctx) {
    const ply = ctx.player;
    if (ply.hitCnt !== 0) return;
    const ph = hsp.Player.HITBOX;

    for (const es of ctx.enemyShots) {
      if (!es.alive) continue;
      const d = es.constructor.DATA;

      if (hsp.CollisionSystem.checkAABB(
        d.hitX1 + es.x, d.hitY1 + es.y, d.hitX2 + es.x, d.hitY2 + es.y,
        ply.x - ph.hw, ply.y - ph.hh, ply.x + ph.hw, ply.y + ph.hh
      )) {
        es.alive = false;
        ply.shield--;
        ply.hitCnt = 50;
        hsp.spawnHitSparks(ctx, es.x, es.y, 2);
        if (ply.shield === 0) {
          ply.alive = false;
          hsp.spawnExplosion(ctx, ply.x, ply.y, 40, 40, 3);
        }
        break;
      }
    }
  }

  // プレイヤーショット vs 誘導弾（EnemyShot2）
  static checkPlayerShotsVsEnemyShots(ctx) {
    const sh = hsp.PlayerShot.HITBOX;
    for (const es of ctx.enemyShots) {
      if (!es.alive) continue;
      if (!(es instanceof hsp.EnemyShot2)) continue;
      const d = es.constructor.DATA;

      for (const ps of ctx.playerShots) {
        if (!ps.alive) continue;
        if (hsp.CollisionSystem.checkAABB(
          d.hitX1 + es.x, d.hitY1 + es.y, d.hitX2 + es.x, d.hitY2 + es.y,
          ps.x - sh.hw, ps.y - sh.hh, ps.x + sh.hw, ps.y + sh.hh
        )) {
          ctx.score += 10;
          ps.alive = false;
          es.alive = false;
          hsp.spawnHitSpark(ctx, ps.x, ps.y);
          hsp.spawnExplosion(ctx, es.x, es.y, d.sx, d.sy, 2);
          break;
        }
      }
    }
  }

  // 全衝突判定を一括実行
  static checkAllCollisions(ctx) {
    if (ctx.boss.flg !== 1) {
      hsp.CollisionSystem.checkPlayerShotsVsEnemies(ctx);
      hsp.CollisionSystem.checkPlayerVsEnemies(ctx);
    } else {
      hsp.CollisionSystem.checkPlayerShotsVsBoss(ctx);
    }
    hsp.CollisionSystem.checkPlayerShotsVsEnemyShots(ctx);
    hsp.CollisionSystem.checkEnemyShotsVsPlayer(ctx);
  }
};
