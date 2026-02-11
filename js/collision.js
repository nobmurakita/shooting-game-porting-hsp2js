game.SCORE_SHOT_HIT = 10;

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

  // 方向計算（stg_dir）
  // (x0,y0)から(x1,y1)への向きをラジアンで返す
  static calcDir(from, to) {
    let dx = to.x - from.x;
    let dy = to.y - from.y;
    if (dx !== 0 || dy !== 0) {
      return Math.atan2(dy, dx);
    }
    return 0;
  }

  // ショット vs ターゲット群の共通処理
  // targets: onHitByShot() を持つ対象リスト
  static _checkShotsVsTargets(targets) {
    const shots = game.objectsOf(game.PlayerShot);
    for (const target of targets) {
      for (const s of shots) {
        if (s.destroyed) continue;
        if (game.CollisionSystem.checkAABB(target, s)) {
          game.ctx.score += game.SCORE_SHOT_HIT;
          s.destroy();
          game.spawnHitSpark(s.pos.x, s.pos.y);
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

    for (const e of game.objectsOf(game.Enemy)) {
      if (game.CollisionSystem.checkAABB(e, ply)) {
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

    for (const es of game.objectsOf(game.EnemyShot)) {
      if (game.CollisionSystem.checkAABB(es, ply)) {
        es.destroy();
        game.spawnHitSparks(es.pos.x, es.pos.y, 2);
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
