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
  // レーザーバッチ用キャンバス（全レーザーをlighter合成で蓄積し、1回のGPU転写で描画）
  game.laserBatchCanvas = document.createElement('canvas');
  game.laserBatchCanvas.width = game.SCREEN_W;
  game.laserBatchCanvas.height = game.SCREEN_H;
  game.laserBatchCtx2d = game.laserBatchCanvas.getContext('2d');
  game.laserBatchCtx2d.globalCompositeOperation = 'lighter';
  game.laserBatchTexInfo = new TextureInfo(game.laserBatchCanvas);
  game.laserBatchTile = tile(vec2(), vec2(game.SCREEN_W, game.SCREEN_H), game.laserBatchTexInfo);

  game.ctx = new game.GameContext();
  game.initBackground();
};

//////////ゲーム更新//////////
game.gameUpdate = () => {
  const handler = game.stateHandlers[game.ctx.gameSta];
  if (handler) handler();
  game.ctx.hiScore = Math.max(game.ctx.score, game.ctx.hiScore);
};

//////////ゲーム更新後処理（レーザー充填・衝突判定）//////////
game.gameUpdatePost = () => {
  // レーザー充填判定（Player.update後に実行する必要がある）
  if (game.ctx.isPlaying() && !game.ctx.isPaused()) {
    if (game.Laser.all.size > 0) {
      game.Player.instance.laserCharge = false;
    } else if (game.Player.instance.laserPower <= 0) {
      game.Player.instance.laserCharge = true;
    }
  }
  if (game.ctx.gameSta === game.STA_PLAY) {
    game.CollisionSystem.checkAllCollisions();
  }
};

//////////ゲーム描画//////////
game.gameRender = () => {
  if (game.ctx.gameSta === game.STA_TITLE) {
    const ti = game.tile(0, 0, 600, 600, game.TEX.TITLE);
    drawTile(vec2(0, 0), ti.drawSize, ti);
  } else if (game.ctx.isPlaying()) {
    // レーザーバッチキャンバスをクリア（EngineObject描画前に必要）
    game.laserBatchCtx2d.clearRect(0, 0, game.SCREEN_W, game.SCREEN_H);
    game.drawBackground();
  }
};

game.gameRenderPost = () => {
  if (game.ctx.isPlaying()) {
    // レーザーバッチ転写（1回のテクスチャアップロードで全レーザーを描画）
    if (game.Laser.all.size > 0) {
      game.laserBatchTexInfo.createWebGLTexture();
      setBlendMode(true);
      drawTile(vec2(0, 0), vec2(game.SCREEN_W, game.SCREEN_H), game.laserBatchTile, game.color(1, 1, 1, 1));
      glFlush();
      setBlendMode();
    }
    game.drawStatusUI();
    if (game.ctx.gameSta === game.STA_PAUSE) {
      const p = game.UI_SPRITES.pauseLabel;
      game.drawUI(0, 0, game.tile(p.cx, p.cy, p.sx, p.sy, game.TEX.UI));
    }
  }
};

//////////画像ソース（テクスチャインデックス順）//////////
game.imageSources = [
  'img/player.png',  'img/effect.png',  'img/enesht.png', 'img/etc.png',
  'img/enemy00.png', 'img/enemy01.png', 'img/enemy02.png','img/enemy03.png',
  'img/enemy04.png', 'img/enemy05.png', 'img/enemy06.png','img/enemy07.png',
  'img/enemy08.png', 'img/enemy09.png',
  'img/boss00.png',  'img/boss01.png',  'img/title.png',
];

//////////エンジン起動//////////
engineInit(
  game.gameInit, game.gameUpdate, game.gameUpdatePost,
  game.gameRender, game.gameRenderPost, game.imageSources
);
