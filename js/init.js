import { ctx, SCREEN_W, SCREEN_H, TEX, STA_TITLE, STA_PLAY, STA_PAUSE, initRuntime, gameTile, gameColor, drawUI, laserBatchCtx2d, laserBatchTexInfo, laserBatchTile } from './game.js';
import { player, lasers } from './registry.js';
import { initBackground, drawBackground } from './background.js';
import { stateHandlers } from './state.js';
import { CollisionSystem } from './collision.js';
import { UI_SPRITES, drawStatusUI } from './ui.js';
import './stage1.js';

//////////ゲーム初期化//////////
function gameInit() {
  setCanvasFixedSize(vec2(SCREEN_W, SCREEN_H));
  setCanvasPixelated(true);
  setCameraScale(1);
  setCameraPos(vec2(0, 0));
  setDebugKey('');
  setDebugWatermark(false);

  initRuntime();
  initBackground();
}

//////////ゲーム更新//////////
function gameUpdate() {
  const handler = stateHandlers[ctx.gameSta];
  if (handler) handler();
  ctx.hiScore = Math.max(ctx.score, ctx.hiScore);
}

//////////ゲーム更新後処理（レーザー充填・衝突判定）//////////
function gameUpdatePost() {
  // レーザー充填判定（Player.update後に実行する必要がある）
  if (ctx.isPlaying() && !ctx.isPaused()) {
    if (lasers.size > 0) {
      player.laserCharge = false;
    } else if (player.laserPower <= 0) {
      player.laserCharge = true;
    }
  }
  if (ctx.gameSta === STA_PLAY) {
    CollisionSystem.checkAllCollisions();
  }
}

//////////ゲーム描画//////////
function gameRender() {
  if (ctx.gameSta === STA_TITLE) {
    const ti = gameTile(0, 0, 600, 600, TEX.TITLE);
    drawTile(vec2(0, 0), ti.drawSize, ti);
  } else if (ctx.isPlaying()) {
    // レーザーバッチキャンバスをクリア（EngineObject描画前に必要）
    laserBatchCtx2d.clearRect(0, 0, SCREEN_W, SCREEN_H);
    drawBackground();
  }
}

function gameRenderPost() {
  if (ctx.isPlaying()) {
    // レーザーバッチ転写（1回のテクスチャアップロードで全レーザーを描画）
    if (lasers.size > 0) {
      laserBatchTexInfo.createWebGLTexture();
      setBlendMode(true);
      drawTile(vec2(0, 0), vec2(SCREEN_W, SCREEN_H), laserBatchTile, gameColor(1, 1, 1, 1));
      glFlush();
      setBlendMode();
    }
    drawStatusUI();
    if (ctx.gameSta === STA_PAUSE) {
      const p = UI_SPRITES.pauseLabel;
      drawUI(0, 0, gameTile(p.cx, p.cy, p.sx, p.sy, TEX.UI));
    }
  }
}

//////////画像ソース（テクスチャインデックス順）//////////
const imageSources = [
  'img/player.png',  'img/effect.png',  'img/enesht.png', 'img/etc.png',
  'img/enemy00.png', 'img/enemy01.png', 'img/enemy02.png','img/enemy03.png',
  'img/enemy04.png', 'img/enemy05.png', 'img/enemy06.png','img/enemy07.png',
  'img/enemy08.png', 'img/enemy09.png',
  'img/boss00.png',  'img/boss01.png',  'img/title.png',
];

//////////エンジン起動//////////
engineInit(
  gameInit, gameUpdate, gameUpdatePost,
  gameRender, gameRenderPost, imageSources
);
