import { ctx, STA_OPENING, STA_TITLE, STA_INIT, STA_PLAY, STA_CLEAR, STA_ENDING, STA_PAUSE, MAX_STAGE, BOSS_STATE_NONE, BOSS_STATE_BATTLE, KEY_LASER, KEY_SHOT, KEY_SHIFT, KEY_ESC } from './game.js';
import { player, boss } from './registry.js';
import { Player } from './player.js';
import { Boss } from './boss.js';
import { Enemy } from './enemy.js';
import { updateBackground } from './background.js';

//////////状態ハンドラ//////////

const updateOpeningState = () => {
  ctx.stage = 0;
  ctx.score = 0;
  ctx.gameSta = STA_TITLE;
};

const updateTitleState = () => {
  if (keyWasPressed(KEY_LASER) || keyWasPressed(KEY_SHOT) || keyWasPressed(KEY_SHIFT)) {
    // キーボード操作時のAudioContext起動（LittleJSはmouse/touchのみ対応のため）
    if (audioContext && audioContext.state !== 'running') audioContext.resume();
    ctx.gameSta = STA_INIT;
  }
};

const updateInitState = () => {
  ctx.stage++;
  if (ctx.stage <= MAX_STAGE) {
    ctx.initStage(ctx.stage);
    new Player();
    new Boss();
    ctx.gameSta = STA_PLAY;
  } else {
    ctx.gameSta = STA_ENDING;
  }
};

const updatePlayState = () => {
  // TODO: プレイヤー死亡時のゲームオーバー処理（現状はalive=falseのまま継続）
  if (keyWasPressed(KEY_ESC)) {
    ctx.goToOpening();
  } else {
    // ボス出現判定（Enemy.appear()の外で常に判定）
    if (boss.flg === BOSS_STATE_NONE && boss.appearFrame === ctx.frame) {
      boss.flg = BOSS_STATE_BATTLE;
    }
    // 敵出現（ボス未登場時のみ）
    if (boss.flg === BOSS_STATE_NONE) {
      Enemy.appear();
    }
    updateBackground();
    ctx.frame++;
    if (keyWasPressed(KEY_SHIFT)) {
      ctx.gameSta = STA_PAUSE;
    }
  }
};

const updateClearState = () => {
  if (keyWasPressed(KEY_ESC)) {
    ctx.goToOpening();
  }
  if (player.pos.y < 340) {
    player.pos.y += 7;
  } else {
    ctx.gameSta = STA_INIT;
  }
  updateBackground();
};

const updateEndingState = () => {
  ctx.goToOpening();
};

const updatePauseState = () => {
  if (keyWasPressed(KEY_ESC)) {
    ctx.goToOpening();
  } else if (keyWasPressed(KEY_SHIFT)) {
    ctx.gameSta = STA_PLAY;
  }
};

export const stateHandlers = {
  [STA_OPENING]: updateOpeningState,
  [STA_TITLE]:   updateTitleState,
  [STA_INIT]:    updateInitState,
  [STA_PLAY]:    updatePlayState,
  [STA_CLEAR]:   updateClearState,
  [STA_ENDING]:  updateEndingState,
  [STA_PAUSE]:   updatePauseState,
};
