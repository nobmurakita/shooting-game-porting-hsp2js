//////////プログラムスタート//////////
hsp.ProgramStart = async () => {
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
  hsp.ctx = new hsp.GameContext();
  hsp.ctx.player = new hsp.Player();
  hsp.ctx.boss = new hsp.Boss();

  hsp.IniCom();
  hsp.Enemy.initData();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      hsp.ctx.nextLoopTime = performance.now();
    }
  });

  hsp.ctx.nextLoopTime = performance.now();
  hsp.MainLoop();
};

//////////残存オブジェクト更新（ショット・レーザー・エフェクト）//////////
hsp.updateRemaining = (ctx) => {
  for (const s of ctx.playerShots) { s.update(); }
  for (const s of ctx.enemyShots) { s.update(ctx); }
  // レーザーのLsrF初期化（全レーザーが非生存ならLsrF=1にする）
  if (ctx.player.lsrPow === 0) { ctx.player.lsrF = 1; }
  for (const l of ctx.lasers) { l.update(ctx); }
  for (const e of ctx.effects) { e.update(); }
};

//////////死亡要素の除去//////////
hsp.filterDead = (ctx) => {
  ctx.playerShots = ctx.playerShots.filter(s => s.alive);
  ctx.lasers = ctx.lasers.filter(l => l.alive);
  ctx.enemies = ctx.enemies.filter(e => e.alive);
  ctx.enemyShots = ctx.enemyShots.filter(s => s.alive);
  ctx.effects = ctx.effects.filter(e => e.alive);
};

//////////ゲーム要素描画//////////
hsp.renderObjects = (ctx) => {
  hsp.BackGround();
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
  hsp.Disp();
};

//////////フレームバッファ転送//////////
hsp.flipBuffer = () => {
  hsp.gsel(0);
  hsp.pos(0, 0);
  hsp.gcopy(1, 0, 0, 300, 300);
};

//////////メインループ//////////
hsp.MainLoop = () => {
  hsp.ctx.nextLoopTime += 1000 / 30;
  hsp.ctx.key = hsp.stick();

  if (hsp.ctx.gameSta === hsp.STA_OPENING) {
    hsp.gsel(0);
    hsp.picload('img/title.png', 0, 0);
    hsp.ctx.stage = 0;
    hsp.ctx.score = 0;
    hsp.ctx.gameSta = hsp.STA_TITLE;
  } else if (hsp.ctx.gameSta === hsp.STA_TITLE) {
    if (hsp.ctx.key & hsp.KEY_LASER || hsp.ctx.key & hsp.KEY_SHOT || hsp.ctx.key & hsp.KEY_SHIFT) {
      hsp.ctx.gameSta = hsp.STA_INIT;
    }
  } else if (hsp.ctx.gameSta === hsp.STA_INIT) {
    hsp.ctx.stage++
    if (hsp.ctx.stage <= hsp.MaxStage) {
      hsp.ctx.initStage(hsp.ctx.stage);
      hsp.ctx.gameSta = hsp.STA_PLAY;
    } else {
      hsp.ctx.gameSta = hsp.STA_ENDING;
    }
  } else if (hsp.ctx.gameSta === hsp.STA_PLAY) {
    if (hsp.ctx.key & hsp.KEY_ESC) {
      hsp.ctx.gameSta = hsp.STA_OPENING;
    } else {
      // オフスクリーンバッファに描画
      hsp.gsel(1);
      // プレーヤー更新
      hsp.ctx.player.update(hsp.ctx);
      // プレーヤーショット更新
      for (const s of hsp.ctx.playerShots) { s.update(); }
      // レーザーのLsrF初期化（全レーザーが非生存ならLsrF=1にする）
      if (hsp.ctx.player.lsrPow === 0) { hsp.ctx.player.lsrF = 1; }
      // 敵/ボス更新
      if (hsp.ctx.boss.flg === 0) {
        hsp.Enemy.appear(hsp.ctx);
        for (const e of hsp.ctx.enemies) { e.update(hsp.ctx); }
      } else {
        hsp.ctx.boss.update(hsp.ctx);
      }
      // 敵ショット・レーザー・エフェクト更新
      for (const s of hsp.ctx.enemyShots) { s.update(hsp.ctx); }
      for (const l of hsp.ctx.lasers) { l.update(hsp.ctx); }
      for (const e of hsp.ctx.effects) { e.update(); }
      // 衝突判定
      hsp.CollisionSystem.checkAllCollisions(hsp.ctx);
      hsp.filterDead(hsp.ctx);
      hsp.renderObjects(hsp.ctx);
      hsp.ctx.frame++
      if (hsp.ctx.key & hsp.KEY_SHIFT) {
        hsp.ctx.key = 0;
        hsp.ctx.gameSta = hsp.STA_PAUSE;
        hsp.pos(129, 142);
        hsp.gcopy(3, 0, 234, 42, 16);
      }
      hsp.flipBuffer();
    }
  } else if (hsp.ctx.gameSta === hsp.STA_CLEAR) {
    if (hsp.ctx.key & hsp.KEY_ESC) {
      hsp.ctx.gameSta = hsp.STA_OPENING;
    }
    if (hsp.ctx.player.y > -20) {
      hsp.ctx.player.y -= 7;
    } else {
      hsp.ctx.gameSta = hsp.STA_INIT;
    }
    // オフスクリーンバッファに描画
    hsp.gsel(1);
    hsp.updateRemaining(hsp.ctx);
    hsp.filterDead(hsp.ctx);
    hsp.renderObjects(hsp.ctx);
    hsp.flipBuffer();
  } else if (hsp.ctx.gameSta === hsp.STA_ENDING) {
    hsp.ctx.gameSta = hsp.STA_OPENING;
  } else if (hsp.ctx.gameSta === hsp.STA_PAUSE) {
    if (hsp.ctx.key & hsp.KEY_ESC) {
      hsp.ctx.gameSta = hsp.STA_OPENING;
    } else if (hsp.ctx.key & hsp.KEY_SHIFT) {
      hsp.ctx.gameSta = hsp.STA_PLAY;
    }
  }

  hsp.ctx.hiScore = Math.max(hsp.ctx.score, hsp.ctx.hiScore);

  let delay = hsp.ctx.nextLoopTime - performance.now();
  setTimeout(hsp.MainLoop, delay);
};

hsp.ProgramStart();
