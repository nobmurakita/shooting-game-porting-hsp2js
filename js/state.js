//////////状態ハンドラ//////////

game.updateOpeningState = () => {
  game.ctx.stage = 0;
  game.ctx.score = 0;
  game.ctx.gameSta = game.STA_TITLE;
};

game.updateTitleState = () => {
  if (game.keyWasPressed(game.KEY_LASER) || game.keyWasPressed(game.KEY_SHOT) || game.keyWasPressed(game.KEY_SHIFT)) {
    // キーボード操作時のAudioContext起動（LittleJSはmouse/touchのみ対応のため）
    if (audioContext && audioContext.state !== 'running') audioContext.resume();
    game.ctx.gameSta = game.STA_INIT;
  }
};

game.updateInitState = () => {
  game.ctx.stage++;
  if (game.ctx.stage <= game.MAX_STAGE) {
    game.ctx.initStage(game.ctx.stage);
    game.ctx.gameSta = game.STA_PLAY;
  } else {
    game.ctx.gameSta = game.STA_ENDING;
  }
};

game.updatePlayState = () => {
  // TODO: プレイヤー死亡時のゲームオーバー処理（現状はalive=falseのまま継続）
  if (game.keyWasPressed(game.KEY_ESC)) {
    game.ctx.goToOpening();
  } else {
    // ボス出現判定（Enemy.appear()の外で常に判定）
    if (game.Boss.instance.flg === game.Boss.STATE_NONE && game.Boss.instance.appearFrame === game.ctx.frame) {
      game.Boss.instance.flg = game.Boss.STATE_BATTLE;
    }
    // 敵出現（ボス未登場時のみ）
    if (game.Boss.instance.flg === game.Boss.STATE_NONE) {
      game.Enemy.appear();
    }
    game.updateBackground();
    game.ctx.frame++;
    if (game.keyWasPressed(game.KEY_SHIFT)) {
      game.ctx.gameSta = game.STA_PAUSE;
    }
  }
};

game.updateClearState = () => {
  if (game.keyWasPressed(game.KEY_ESC)) {
    game.ctx.goToOpening();
  }
  if (game.Player.instance.pos.y < 340) {
    game.Player.instance.pos.y += 7;
  } else {
    game.ctx.gameSta = game.STA_INIT;
  }
  game.updateBackground();
};

game.updateEndingState = () => {
  game.ctx.goToOpening();
};

game.updatePauseState = () => {
  if (game.keyWasPressed(game.KEY_ESC)) {
    game.ctx.goToOpening();
  } else if (game.keyWasPressed(game.KEY_SHIFT)) {
    game.ctx.gameSta = game.STA_PLAY;
  }
};

game.stateHandlers = {
  [game.STA_OPENING]: game.updateOpeningState,
  [game.STA_TITLE]:   game.updateTitleState,
  [game.STA_INIT]:    game.updateInitState,
  [game.STA_PLAY]:    game.updatePlayState,
  [game.STA_CLEAR]:   game.updateClearState,
  [game.STA_ENDING]:  game.updateEndingState,
  [game.STA_PAUSE]:   game.updatePauseState,
};
