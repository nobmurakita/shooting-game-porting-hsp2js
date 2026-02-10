//////////プログラムスタート//////////
game.ProgramStart = async () => {
  await Promise.all([
    hsp.preload('img/title.png'),
    hsp.preload('img/player.png'),
    hsp.preload('img/effect.png'),
    hsp.preload('img/enesht.png'),
    hsp.preload('img/etc.png'),
    hsp.preload('img/enemy00.png'),
    hsp.preload('img/enemy01.png'),
    hsp.preload('img/enemy02.png'),
    hsp.preload('img/enemy03.png'),
    hsp.preload('img/enemy04.png'),
    hsp.preload('img/enemy05.png'),
    hsp.preload('img/enemy06.png'),
    hsp.preload('img/enemy07.png'),
    hsp.preload('img/enemy08.png'),
    hsp.preload('img/enemy09.png'),
    hsp.preload('img/boss00.png'),
    hsp.preload('img/boss01.png'),
  ]);

  // GameContext生成
  game.ctx = new game.GameContext();
  game.ctx.player = new game.Player();
  game.ctx.boss = new game.Boss();

  game.IniCom();
  game.Enemy.initData();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      game.ctx.nextLoopTime = performance.now();
    }
  });

  game.ctx.nextLoopTime = performance.now();
  game.MainLoop();
};

//////////残存オブジェクト更新（ショット・レーザー・エフェクト）//////////
game.updateRemaining = (ctx) => {
  for (const s of ctx.playerShots) { s.update(); }
  for (const s of ctx.enemyShots) { s.update(ctx); }
  // レーザーのLsrF初期化（全レーザーが非生存ならLsrF=1にする）
  if (ctx.player.lsrPow === 0) { ctx.player.lsrF = 1; }
  for (const l of ctx.lasers) { l.update(ctx); }
  for (const e of ctx.effects) { e.update(); }
};

//////////死亡要素の除去//////////
game.filterDead = (ctx) => {
  ctx.playerShots = ctx.playerShots.filter(s => s.alive);
  ctx.lasers = ctx.lasers.filter(l => l.alive);
  ctx.enemies = ctx.enemies.filter(e => e.alive);
  ctx.enemyShots = ctx.enemyShots.filter(s => s.alive);
  ctx.effects = ctx.effects.filter(e => e.alive);
};

//////////ゲーム要素描画//////////
game.renderObjects = (ctx) => {
  game.BackGround();
  if (ctx.boss.flg === 0) {
    for (const e of ctx.enemies) { e.draw(); }
  } else {
    ctx.boss.draw();
  }
  // プレーヤーショット描画（逆順）
  for (let i = ctx.playerShots.length - 1; i >= 0; i--) { ctx.playerShots[i].draw(); }
  // プレーヤー描画
  ctx.player.draw();
  for (let i = ctx.effects.length - 1; i >= 0; i--) { ctx.effects[i].draw(); }
  for (const s of ctx.enemyShots) { s.draw(); }
  // レーザー描画
  for (const l of ctx.lasers) { l.draw(); }
  game.Disp();
};

//////////フレームバッファ転送//////////
game.flipBuffer = () => {
  hsp.gsel(0);
  hsp.pos(0, 0);
  hsp.gcopy(1, 0, 0, 300, 300);
};

//////////メインループ//////////
game.MainLoop = () => {
  game.ctx.nextLoopTime += 1000 / 60;
  game.ctx.key = hsp.stick();

  if (game.ctx.gameSta === game.STA_OPENING) {
    hsp.gsel(0);
    hsp.picload('img/title.png', 0, 0);
    game.ctx.stage = 0;
    game.ctx.score = 0;
    game.ctx.gameSta = game.STA_TITLE;
  } else if (game.ctx.gameSta === game.STA_TITLE) {
    if (game.ctx.key & game.KEY_LASER || game.ctx.key & game.KEY_SHOT || game.ctx.key & game.KEY_SHIFT) {
      game.ctx.gameSta = game.STA_INIT;
    }
  } else if (game.ctx.gameSta === game.STA_INIT) {
    game.ctx.stage++
    if (game.ctx.stage <= game.MaxStage) {
      game.ctx.initStage(game.ctx.stage);
      game.ctx.gameSta = game.STA_PLAY;
    } else {
      game.ctx.gameSta = game.STA_ENDING;
    }
  } else if (game.ctx.gameSta === game.STA_PLAY) {
    if (game.ctx.key & game.KEY_ESC) {
      game.ctx.gameSta = game.STA_OPENING;
    } else {
      // オフスクリーンバッファに描画
      hsp.gsel(1);
      // プレーヤー更新
      game.ctx.player.update(game.ctx);
      // プレーヤーショット更新
      for (const s of game.ctx.playerShots) { s.update(); }
      // レーザーのLsrF初期化（全レーザーが非生存ならLsrF=1にする）
      if (game.ctx.player.lsrPow === 0) { game.ctx.player.lsrF = 1; }
      // 敵/ボス更新
      if (game.ctx.boss.flg === 0) {
        game.Enemy.appear(game.ctx);
        for (const e of game.ctx.enemies) { e.update(game.ctx); }
      } else {
        game.ctx.boss.update(game.ctx);
      }
      // 敵ショット・レーザー・エフェクト更新
      for (const s of game.ctx.enemyShots) { s.update(game.ctx); }
      for (const l of game.ctx.lasers) { l.update(game.ctx); }
      for (const e of game.ctx.effects) { e.update(); }
      // 衝突判定
      game.CollisionSystem.checkAllCollisions(game.ctx);
      game.filterDead(game.ctx);
      game.renderObjects(game.ctx);
      game.ctx.frame++
      if (game.ctx.key & game.KEY_SHIFT) {
        game.ctx.key = 0;
        game.ctx.gameSta = game.STA_PAUSE;
        hsp.pos(129, 142);
        hsp.gcopy(3, 0, 234, 42, 16);
      }
      game.flipBuffer();
    }
  } else if (game.ctx.gameSta === game.STA_CLEAR) {
    if (game.ctx.key & game.KEY_ESC) {
      game.ctx.gameSta = game.STA_OPENING;
    }
    if (game.ctx.player.y > -20) {
      game.ctx.player.y -= 3.5;
    } else {
      game.ctx.gameSta = game.STA_INIT;
    }
    // オフスクリーンバッファに描画
    hsp.gsel(1);
    game.updateRemaining(game.ctx);
    game.filterDead(game.ctx);
    game.renderObjects(game.ctx);
    game.flipBuffer();
  } else if (game.ctx.gameSta === game.STA_ENDING) {
    game.ctx.gameSta = game.STA_OPENING;
  } else if (game.ctx.gameSta === game.STA_PAUSE) {
    if (game.ctx.key & game.KEY_ESC) {
      game.ctx.gameSta = game.STA_OPENING;
    } else if (game.ctx.key & game.KEY_SHIFT) {
      game.ctx.gameSta = game.STA_PLAY;
    }
  }

  game.ctx.hiScore = Math.max(game.ctx.score, game.ctx.hiScore);

  let delay = game.ctx.nextLoopTime - performance.now();
  setTimeout(game.MainLoop, delay);
};

game.ProgramStart();
