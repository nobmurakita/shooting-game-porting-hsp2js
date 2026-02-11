//////////画像ソース（テクスチャインデックス順）//////////
game.imageSources = [
  'img/player.png',  'img/effect.png',  'img/enesht.png', 'img/etc.png',
  'img/enemy00.png', 'img/enemy01.png', 'img/enemy02.png','img/enemy03.png',
  'img/enemy04.png', 'img/enemy05.png', 'img/enemy06.png','img/enemy07.png',
  'img/enemy08.png', 'img/enemy09.png',
  'img/boss00.png',  'img/boss01.png',  'img/title.png',
];

//////////ゲーム初期化//////////
game.gameInit = () => {
  setCanvasFixedSize(vec2(game.SCREEN_W, game.SCREEN_H));
  setCanvasPixelated(true);
  setCameraScale(1);
  setCameraPos(vec2(0, 0));
  setDebugKey('');
  setDebugWatermark(false);

  game.initCommon();
};

//////////プレイヤーショット更新 + レーザー充填判定//////////
game.updatePlayerShots = (ctx) => {
  for (const s of ctx.playerShots) { s.update(); }
  // レーザー充填判定を一元管理
  if (engineObjects.some(o => o instanceof game.Laser && !o.destroyed)) {
    // レーザー生存中は充填不可
    ctx.player.lsrF = game.LSR_CHARGE_OFF;
  } else if (ctx.player.lsrPow <= 0) {
    // 全レーザー消滅かつパワー0で充填再開
    ctx.player.lsrF = game.LSR_CHARGE_ON;
  }
};

//////////死亡要素の除去//////////
game.filterDead = (ctx) => {
  ctx.playerShots = ctx.playerShots.filter(s => s.alive);
  ctx.enemies = ctx.enemies.filter(e => e.alive);
};

//////////ゲーム更新後処理（衝突判定・死亡除去）//////////
game.gameUpdatePost = () => {
  if (game.ctx.gameSta === game.STA_PLAY) {
    game.CollisionSystem.checkAllCollisions(game.ctx);
  }
  if (game.ctx.gameSta === game.STA_PLAY || game.ctx.gameSta === game.STA_CLEAR) {
    game.filterDead(game.ctx);
  }
};

//////////ゲーム要素描画//////////
game.renderObjects = (ctx) => {
  game.drawBackground();
  for (const e of ctx.enemies) { e.draw(); }
  if (ctx.boss.flg !== game.BOSS_NONE) {
    ctx.boss.draw(ctx);
  }
  // プレーヤーショット描画（逆順）
  for (let i = ctx.playerShots.length - 1; i >= 0; i--) { ctx.playerShots[i].draw(); }
  // プレーヤー描画
  ctx.player.draw();
  game.drawStatusUI();
};

//////////ゲーム更新//////////
game.gameUpdate = () => {
  if (game.ctx.gameSta === game.STA_OPENING) {
    [...engineObjects].forEach(o => o.destroy());
    game.ctx.stage = 0;
    game.ctx.score = 0;
    game.ctx.gameSta = game.STA_TITLE;
  } else if (game.ctx.gameSta === game.STA_TITLE) {
    if (game.keyWasPressed(game.KEY_LASER) || game.keyWasPressed(game.KEY_SHOT) || game.keyWasPressed(game.KEY_SHIFT)) {
      game.ctx.gameSta = game.STA_INIT;
    }
  } else if (game.ctx.gameSta === game.STA_INIT) {
    game.ctx.stage++;
    if (game.ctx.stage <= game.MAX_STAGE) {
      game.ctx.initStage(game.ctx.stage);
      game.ctx.gameSta = game.STA_PLAY;
    } else {
      game.ctx.gameSta = game.STA_ENDING;
    }
  } else if (game.ctx.gameSta === game.STA_PLAY) {
    if (game.keyWasPressed(game.KEY_ESC)) {
      game.ctx.gameSta = game.STA_OPENING;
    } else {
      game.ctx.player.update(game.ctx);
      game.updatePlayerShots(game.ctx);
      // ボス出現判定（Enemy.appear()の外で常に判定）
      if (game.ctx.boss.flg === game.BOSS_NONE && game.ctx.boss.aprFrm === game.ctx.frame) {
        game.ctx.boss.flg = game.BOSS_BATTLE;
      }
      // 敵/ボス更新
      if (game.ctx.boss.flg === game.BOSS_NONE) {
        game.Enemy.appear(game.ctx);
      } else {
        game.ctx.boss.update(game.ctx);
      }
      for (const e of game.ctx.enemies) { e.update(game.ctx); }

      game.updateBackground(game.ctx);
      game.ctx.frame++;
      if (game.keyWasPressed(game.KEY_SHIFT)) {
        game.ctx.gameSta = game.STA_PAUSE;
      }
    }
  } else if (game.ctx.gameSta === game.STA_CLEAR) {
    if (game.keyWasPressed(game.KEY_ESC)) {
      game.ctx.gameSta = game.STA_OPENING;
    }
    if (game.ctx.player.y < 340) {
      game.ctx.player.y += 7;
    } else {
      game.ctx.gameSta = game.STA_INIT;
    }
    game.updateBackground(game.ctx);
    game.updatePlayerShots(game.ctx);
  } else if (game.ctx.gameSta === game.STA_ENDING) {
    game.ctx.gameSta = game.STA_OPENING;
  } else if (game.ctx.gameSta === game.STA_PAUSE) {
    if (game.keyWasPressed(game.KEY_ESC)) {
      game.ctx.gameSta = game.STA_OPENING;
    } else if (game.keyWasPressed(game.KEY_SHIFT)) {
      game.ctx.gameSta = game.STA_PLAY;
    }
  }

  game.ctx.hiScore = Math.max(game.ctx.score, game.ctx.hiScore);
};

//////////ゲーム描画//////////
game.gameRender = () => {
  if (game.ctx.gameSta === game.STA_TITLE) {
    const ti = game.tile(0, 0, 600, 600, game.TEX.TITLE);
    drawTile(vec2(0, 0), ti.drawSize, ti);
  } else if (game.ctx.gameSta === game.STA_PLAY ||
             game.ctx.gameSta === game.STA_CLEAR) {
    game.renderObjects(game.ctx);
  } else if (game.ctx.gameSta === game.STA_PAUSE) {
    game.renderObjects(game.ctx);
    const p = game.UI_SPRITES.pauseLabel;
    game.drawUI(0, 0,
      game.tile(p.cx, p.cy, p.sx, p.sy, game.TEX.UI));
  }
};

game.gameRenderPost = () => {};

//////////エンジン起動//////////
engineInit(
  game.gameInit, game.gameUpdate, game.gameUpdatePost,
  game.gameRender, game.gameRenderPost, game.imageSources
);
