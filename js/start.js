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

  // レーザー用オフスクリーンCanvas + TextureInfo
  game.laserCanvas = document.createElement('canvas');
  game.laserCanvas.width = game.SCREEN_W;
  game.laserCanvas.height = game.SCREEN_H;
  game.laserCtx2d = game.laserCanvas.getContext('2d');
  game.laserCtx2d.lineCap = 'round';
  game.laserCtx2d.lineWidth = 6;
  game.laserTexInfo = new TextureInfo(game.laserCanvas);
  game.laserTile = tile(vec2(), vec2(game.SCREEN_W, game.SCREEN_H), game.laserTexInfo);

  game.initCommon();
};

//////////ゲーム更新後処理（レーザー充填・衝突判定）//////////
game.gameUpdatePost = () => {
  // レーザー充填判定（Player.update後に実行する必要がある）
  if (game.ctx.gameSta === game.STA_PLAY || game.ctx.gameSta === game.STA_CLEAR) {
    if (game.objectsOf(game.Laser).length > 0) {
      game.ctx.player.lsrF = game.LSR_CHARGE_OFF;
    } else if (game.ctx.player.lsrPow <= 0) {
      game.ctx.player.lsrF = game.LSR_CHARGE_ON;
    }
  }
  if (game.ctx.gameSta === game.STA_PLAY) {
    game.CollisionSystem.checkAllCollisions();
  }
};

//////////ゲーム要素描画//////////
game.renderObjects = () => {
  game.drawBackground();
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
    // TODO: プレイヤー死亡時のゲームオーバー処理（現状はalive=falseのまま継続）
    if (game.keyWasPressed(game.KEY_ESC)) {
      game.ctx.gameSta = game.STA_OPENING;
    } else {
      // ボス出現判定（Enemy.appear()の外で常に判定）
      if (game.ctx.boss.flg === game.BOSS_NONE && game.ctx.boss.aprFrm === game.ctx.frame) {
        game.ctx.boss.flg = game.BOSS_BATTLE;
      }
      // 敵出現（ボス未登場時のみ）
      if (game.ctx.boss.flg === game.BOSS_NONE) {
        game.Enemy.appear();
      }
      game.updateBackground();
      game.ctx.frame++;
      if (game.keyWasPressed(game.KEY_SHIFT)) {
        game.ctx.gameSta = game.STA_PAUSE;
      }
    }
  } else if (game.ctx.gameSta === game.STA_CLEAR) {
    if (game.keyWasPressed(game.KEY_ESC)) {
      game.ctx.gameSta = game.STA_OPENING;
    }
    if (game.ctx.player.pos.y < 340) {
      game.ctx.player.pos.y += 7;
    } else {
      game.ctx.gameSta = game.STA_INIT;
    }
    game.updateBackground();
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
    game.renderObjects();
  } else if (game.ctx.gameSta === game.STA_PAUSE) {
    game.renderObjects();
  }
};

game.gameRenderPost = () => {
  if (game.ctx.gameSta === game.STA_PLAY ||
      game.ctx.gameSta === game.STA_CLEAR) {
    game.drawStatusUI();
  } else if (game.ctx.gameSta === game.STA_PAUSE) {
    game.drawStatusUI();
    const p = game.UI_SPRITES.pauseLabel;
    game.drawUI(0, 0,
      game.tile(p.cx, p.cy, p.sx, p.sy, game.TEX.UI));
  }
};

//////////エンジン起動//////////
engineInit(
  game.gameInit, game.gameUpdate, game.gameUpdatePost,
  game.gameRender, game.gameRenderPost, game.imageSources
);
