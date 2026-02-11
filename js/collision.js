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
  // targets: getHitPos()とonHitByShot()を持つ対象リスト
  static _checkShotsVsTargets(targets) {
    const sd = game.PlayerShot.DATA;
    const shots = game.objectsOf(game.PlayerShot);
    for (const target of targets) {
      const d = target.constructor.DATA;
      const pos = target.getHitPos();
      for (const s of shots) {
        if (s.destroyed) continue;
        if (game.CollisionSystem.checkAABB(
          d.hitX1 + pos.x, d.hitY1 + pos.y, d.hitX2 + pos.x, d.hitY2 + pos.y,
          sd.hitX1 + s.x, sd.hitY1 + s.y, sd.hitX2 + s.x, sd.hitY2 + s.y
        )) {
          game.ctx.score += game.SCORE_SHOT_HIT;
          s.destroy();
          game.spawnHitSpark(s.x, s.y);
          if (target.onHitByShot()) break;
        }
      }
    }
  }

  // プレイヤーショット vs 敵
  static checkPlayerShotsVsEnemies() {
    game.CollisionSystem._checkShotsVsTargets(game.objectsOf(game.Enemy));
  }

  // プレイヤー vs 敵（接触ダメージ）
  static checkPlayerVsEnemies() {
    const ply = game.ctx.player;
    if (!ply.alive || ply.hitCnt !== 0) return;
    const pd = game.Player.DATA;

    for (const e of game.objectsOf(game.Enemy)) {
      const d = e.constructor.DATA;

      if (game.CollisionSystem.checkAABB(
        d.hitX1 + e.x, d.hitY1 + e.y, d.hitX2 + e.x, d.hitY2 + e.y,
        pd.hitX1 + ply.x, pd.hitY1 + ply.y, pd.hitX2 + ply.x, pd.hitY2 + ply.y
      )) {
        e.onContactPlayer();
        ply.takeDamage(5);
        break;
      }
    }
  }

  // プレイヤーショット vs ボスパーツ
  static checkPlayerShotsVsBoss() {
    const boss = game.ctx.boss;
    if (boss.flg !== game.BOSS_BATTLE) return;
    game.CollisionSystem._checkShotsVsTargets(boss.parts.filter(p => p.alive));
  }

  // 敵ショット vs プレイヤー
  static checkEnemyShotsVsPlayer() {
    const ply = game.ctx.player;
    if (!ply.alive || ply.hitCnt !== 0) return;
    const pd = game.Player.DATA;

    for (const es of game.objectsOf(game.EnemyShot)) {
      const d = es.constructor.DATA;

      if (game.CollisionSystem.checkAABB(
        d.hitX1 + es.x, d.hitY1 + es.y, d.hitX2 + es.x, d.hitY2 + es.y,
        pd.hitX1 + ply.x, pd.hitY1 + ply.y, pd.hitX2 + ply.x, pd.hitY2 + ply.y
      )) {
        es.destroy();
        game.spawnHitSparks(es.x, es.y, 2);
        ply.takeDamage(3);
        break;
      }
    }
  }

  // プレイヤーショット vs 誘導弾（EnemyShot2）
  static checkPlayerShotsVsEnemyShots() {
    game.CollisionSystem._checkShotsVsTargets(game.objectsOf(game.EnemyShot2));
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
