//////////定数//////////

// 方向定数（ラジアン、Y↑座標系）
export const DIR_UP    = Math.PI / 2;        // 旧256段階: 64（Y↑で上方向）
export const DIR_DOWN  = 3 * Math.PI / 2;    // 旧256段階: 192（Y↑で下方向）

// 256段階角度1刻みのラジアン値（周期運動のフレームカウンタ用）
export const A256 = Math.PI / 128;

// 画面サイズ
export const SCREEN_W = 600;
export const SCREEN_H = 600;

// 画面境界
export const BOUNDS = {
  PLAYER: 260,    // プレイヤー移動制限（画面端-40）
  ENEMY: 340,     // 敵消滅判定（画面端+40）
  ENEMY_FAR: 360, // 一部敵の消滅判定（画面端+60）
  SHOT: 320,      // 敵ショット消滅判定（画面端+20）
  LASER: 300,     // レーザー消滅判定（画面端ちょうど）
};

export const MAX_STAGE = 1;

// ゲーム状態
export const STA_OPENING = 0;  // オープニング
export const STA_TITLE =   1;  // タイトル
export const STA_INIT =    2;  // ステージ初期化
export const STA_PLAY =    3;  // ゲームプレー中
export const STA_CLEAR =   4;  // ゲームクリア
export const STA_ENDING =  5;  // エンディング
export const STA_PAUSE =   6;  // ポーズ

// ボス状態
export const BOSS_STATE_NONE    = 0;  // 未出現
export const BOSS_STATE_BATTLE  = 1;  // 戦闘中
export const BOSS_STATE_DESTROY = 2;  // 破壊演出中

// レーザー状態
export const LASER_STATE_DYING     = 0;  // 消滅中
export const LASER_STATE_TRACKING  = 1;  // 追跡中
export const LASER_STATE_NO_TARGET = 2;  // ターゲット未設定

// キーコード（LittleJS v1.18: KeyboardEvent.code文字列）
export const KEY_LEFT  = 'ArrowLeft';
export const KEY_UP    = 'ArrowUp';
export const KEY_RIGHT = 'ArrowRight';
export const KEY_DOWN  = 'ArrowDown';
export const KEY_LASER = 'KeyX';
export const KEY_SHOT  = 'KeyZ';
export const KEY_SHIFT = 'ShiftLeft';
export const KEY_ESC   = 'Escape';

// テクスチャインデックス
export const TEX = {
  PLAYER: 0, EFFECT: 1, ENESHT: 2, UI: 3,
  ENEMY0: 4, ENEMY1: 5, ENEMY2: 6, ENEMY3: 7, ENEMY4: 8,
  ENEMY5: 9, ENEMY6: 10, ENEMY7: 11, ENEMY8: 12, ENEMY9: 13,
  BOSS0: 14, BOSS1: 15, TITLE: 16,
};

// ステージデータ
export const Stages = {};

//////////ユーティリティ//////////

// 画面外判定（XY全方向）
export const isOutOfBounds = (x, y, bound) =>
  x < -bound || x > bound || y < -bound || y > bound;

// ラジアンからスプライトフレーム番号を計算（全周: 0〜2π）
// スプライトシートはY↓前提なので角度を反転
export const radToSpriteFrame = (rad, divisions, spriteWidth) => {
  let norm = -rad / (2 * Math.PI);
  norm = ((norm % 1) + 1) % 1;
  return (Math.round(norm * divisions) % divisions) * spriteWidth;
};

// ラジアンからスプライトフレーム番号を計算（半周期: 0〜π で折り返し）
// スプライトシートはY↓前提なので角度を反転
export const radToSpriteFrameHalf = (rad, divisions, spriteWidth) => {
  let norm = -rad / Math.PI;
  norm = ((norm % 1) + 1) % 1;
  return (Math.round(norm * divisions) % divisions) * spriteWidth;
};

// タイル生成ヘルパー（ピクセル座標版・キャッシュ付き）
// テクスチャ座標(pixelX, pixelY, w, h)を受け取りTileInfoを返す。
// 半テクセル内側にインセットし、テクスチャブリーディングを防止。
// drawSize: 描画サイズ（drawTileの第2引数用）。
// 同一パラメータのTileInfoはキャッシュから返す。
const _tileCache = new Map();
export function gameTile(pixelX, pixelY, w, h, texIndex) {
  const key = pixelX + ',' + pixelY + ',' + w + ',' + h + ',' + texIndex;
  let t = _tileCache.get(key);
  if (t) return t;
  t = tile(vec2(pixelX / w, pixelY / h), vec2(w, h), texIndex);
  const pad = 0.5;
  t.pos.x += pad;
  t.pos.y += pad;
  t.size.x -= pad * 2;
  t.size.y -= pad * 2;
  t.drawSize = vec2(w, h);
  Object.freeze(t);
  _tileCache.set(key, t);
  return t;
}

// Color生成ヘルパー（キャッシュ付き）
const _colorCache = new Map();
export function gameColor(r, g, b, a = 1) {
  const key = r + ',' + g + ',' + b + ',' + a;
  let c = _colorCache.get(key);
  if (c) return c;
  c = new Color(r, g, b, a);
  Object.freeze(c);
  _colorCache.set(key, c);
  return c;
}

// 乱数ヘルパー（hsp.rnd置き換え）
export const rnd = (max) => Math.floor(Math.random() * max);

// UI描画ヘルパー
// ワールド座標（Y↑中心原点、スプライト中心）で描画
export const drawUI = (x, y, tileInfo) => {
  drawTile(vec2(x, y), tileInfo.drawSize, tileInfo);
};

// 方向計算（stg_dir）
// fromからtoへの向きをラジアンで返す
export const calcDir = (from, to) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx !== 0 || dy !== 0) {
    return Math.atan2(dy, dx);
  }
  return 0;
};

//////////ゲームオブジェクトベースクラス（EngineObject継承）//////////
export class GameObject extends EngineObject {
  constructor(pos = vec2(), renderOrder = 0) {
    super(pos, vec2(1, 1), undefined, 0, gameColor(1, 1, 1), renderOrder);
    this.mass = 0;
    this.gravityScale = 0;
    this.frame = 0;
    this.alive = true;
  }
  update() {}
  render() {}
  destroy() {
    this.alive = false;
    super.destroy();
  }
  hitBox() {
    const h = this.constructor.HIT;
    return [h.x1 + this.pos.x, h.y1 + this.pos.y, h.x2 + this.pos.x, h.y2 + this.pos.y];
  }
}

//////////ゲーム共有状態//////////
export class GameContext {
  constructor() {
    this.gameSta = 0;
    this.stage = 0;
    this.score = 0;
    this.hiScore = 0;
    this.frame = 0;

    this.bg1 = 0;
  }

  // ゲームセッション中か（PLAY/CLEAR/PAUSE）
  isPlaying() {
    return this.gameSta === STA_PLAY || this.gameSta === STA_CLEAR || this.gameSta === STA_PAUSE;
  }

  // オープニングに戻る（全オブジェクト破棄）
  goToOpening() {
    [...engineObjects].forEach(o => o.destroy());
    this.gameSta = STA_OPENING;
  }

  // ポーズ中か
  isPaused() {
    return this.gameSta === STA_PAUSE;
  }

  // ステージ初期化
  initStage(stageNum) {
    this.stage = stageNum;
    [...engineObjects].forEach(o => o.destroy());
    this.enemyTable = Stages[stageNum];
    this.enemyTableIndex = 0;
    this.frame = 0;
  }
}

//////////ランタイム状態//////////
export let ctx;
export let laserCanvas, laserCtx2d, laserBatchCanvas, laserBatchCtx2d, laserBatchTexInfo, laserBatchTile;

// ランタイム初期化（init.js の gameInit から呼ばれる）
export function initRuntime() {
  // レーザー用オフスクリーンCanvas + TextureInfo
  laserCanvas = document.createElement('canvas');
  laserCanvas.width = SCREEN_W;
  laserCanvas.height = SCREEN_H;
  laserCtx2d = laserCanvas.getContext('2d');
  laserCtx2d.lineCap = 'round';
  laserCtx2d.lineWidth = 6;
  // レーザーバッチ用キャンバス（全レーザーをlighter合成で蓄積し、1回のGPU転写で描画）
  laserBatchCanvas = document.createElement('canvas');
  laserBatchCanvas.width = SCREEN_W;
  laserBatchCanvas.height = SCREEN_H;
  laserBatchCtx2d = laserBatchCanvas.getContext('2d');
  laserBatchCtx2d.globalCompositeOperation = 'lighter';
  laserBatchTexInfo = new TextureInfo(laserBatchCanvas);
  laserBatchTile = tile(vec2(), vec2(SCREEN_W, SCREEN_H), laserBatchTexInfo);

  ctx = new GameContext();
}
