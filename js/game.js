const game = {};

//////////定数//////////

// 方向定数（ラジアン、Y↑座標系）
game.DIR_UP    = Math.PI / 2;        // 旧256段階: 64（Y↑で上方向）
game.DIR_DOWN  = 3 * Math.PI / 2;    // 旧256段階: 192（Y↑で下方向）

// 256段階角度1刻みのラジアン値（周期運動のフレームカウンタ用）
game.A256 = Math.PI / 128;

// 画面サイズ
game.SCREEN_W = 600;
game.SCREEN_H = 600;

// 画面境界
game.BOUNDS = {
  PLAYER: 260,    // プレイヤー移動制限（画面端-40）
  ENEMY: 340,     // 敵消滅判定（画面端+40）
  ENEMY_FAR: 360, // 一部敵の消滅判定（画面端+60）
  SHOT: 320,      // 敵ショット消滅判定（画面端+20）
  LASER: 300,     // レーザー消滅判定（画面端ちょうど）
};

game.MAX_STAGE = 1;

// ゲーム状態
game.STA_OPENING = 0;  // オープニング
game.STA_TITLE =   1;  // タイトル
game.STA_INIT =    2;  // ステージ初期化
game.STA_PLAY =    3;  // ゲームプレー中
game.STA_CLEAR =   4;  // ゲームクリア
game.STA_ENDING =  5;  // エンディング
game.STA_PAUSE =   6;  // ポーズ

// キーコード（LittleJS v1.18: KeyboardEvent.code文字列）
game.KEY_LEFT  = 'ArrowLeft';
game.KEY_UP    = 'ArrowUp';
game.KEY_RIGHT = 'ArrowRight';
game.KEY_DOWN  = 'ArrowDown';
game.KEY_LASER = 'KeyX';
game.KEY_SHOT  = 'KeyZ';
game.KEY_SHIFT = 'ShiftLeft';
game.KEY_ESC   = 'Escape';

// テクスチャインデックス
game.TEX = {
  PLAYER: 0, EFFECT: 1, ENESHT: 2, UI: 3,
  ENEMY0: 4, ENEMY1: 5, ENEMY2: 6, ENEMY3: 7, ENEMY4: 8,
  ENEMY5: 9, ENEMY6: 10, ENEMY7: 11, ENEMY8: 12, ENEMY9: 13,
  BOSS0: 14, BOSS1: 15, TITLE: 16,
};

//////////ユーティリティ//////////

// 画面外判定（XY全方向）
game.isOutOfBounds = (x, y, bound) =>
  x < -bound || x > bound || y < -bound || y > bound;

// ラジアンからスプライトフレーム番号を計算（全周: 0〜2π）
// スプライトシートはY↓前提なので角度を反転
game.radToSpriteFrame = (rad, divisions, spriteWidth) => {
  let norm = -rad / (2 * Math.PI);
  norm = ((norm % 1) + 1) % 1;
  return (Math.round(norm * divisions) % divisions) * spriteWidth;
};

// ラジアンからスプライトフレーム番号を計算（半周期: 0〜π で折り返し）
// スプライトシートはY↓前提なので角度を反転
game.radToSpriteFrameHalf = (rad, divisions, spriteWidth) => {
  let norm = -rad / Math.PI;
  norm = ((norm % 1) + 1) % 1;
  return (Math.round(norm * divisions) % divisions) * spriteWidth;
};

// タイル生成ヘルパー（ピクセル座標版・キャッシュ付き）
// テクスチャ座標(pixelX, pixelY, w, h)を受け取りTileInfoを返す。
// 半テクセル内側にインセットし、テクスチャブリーディングを防止。
// drawSize: 描画サイズ（drawTileの第2引数用）。
// 同一パラメータのTileInfoはキャッシュから返す。
game._tileCache = new Map();
game.tile = (pixelX, pixelY, w, h, texIndex) => {
  const key = pixelX + ',' + pixelY + ',' + w + ',' + h + ',' + texIndex;
  let t = game._tileCache.get(key);
  if (t) return t;
  t = tile(vec2(pixelX / w, pixelY / h), vec2(w, h), texIndex);
  const pad = 0.5;
  t.pos.x += pad;
  t.pos.y += pad;
  t.size.x -= pad * 2;
  t.size.y -= pad * 2;
  t.drawSize = vec2(w, h);
  Object.freeze(t);
  game._tileCache.set(key, t);
  return t;
};

// Color生成ヘルパー（キャッシュ付き）
game._colorCache = new Map();
game.color = (r, g, b, a = 1) => {
  const key = r + ',' + g + ',' + b + ',' + a;
  let c = game._colorCache.get(key);
  if (c) return c;
  c = new Color(r, g, b, a);
  Object.freeze(c);
  game._colorCache.set(key, c);
  return c;
};

// 乱数ヘルパー（hsp.rnd置き換え）
game.rnd = (max) => Math.floor(Math.random() * max);

// UI描画ヘルパー
// ワールド座標（Y↑中心原点、スプライト中心）で描画
game.drawUI = (x, y, tileInfo) => {
  drawTile(vec2(x, y), tileInfo.drawSize, tileInfo);
};

// 方向計算（stg_dir）
// fromからtoへの向きをラジアンで返す
game.calcDir = (from, to) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx !== 0 || dy !== 0) {
    return Math.atan2(dy, dx);
  }
  return 0;
};

// 入力システム（LittleJS委譲）
game.keyIsDown = (keyCode) => keyIsDown(keyCode);
game.keyWasPressed = (keyCode) => keyWasPressed(keyCode);

//////////ゲームオブジェクトベースクラス（EngineObject継承）//////////
game.GameObject = class extends EngineObject {
  constructor(pos = vec2(), renderOrder = 0) {
    super(pos, vec2(1, 1), undefined, 0, game.color(1, 1, 1), renderOrder);
    this.mass = 0;
    this.gravityScale = 0;
    this.frame = 0;
    this.alive = true;
  }
  destroy() {
    this.alive = false;
    super.destroy();
  }
  hitBox() {
    const h = this.constructor.HIT;
    return [h.x1 + this.pos.x, h.y1 + this.pos.y, h.x2 + this.pos.x, h.y2 + this.pos.y];
  }
  update() {}
  render() {}
};

//////////ゲーム共有状態//////////
game.GameContext = class {
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
    return this.gameSta === game.STA_PLAY || this.gameSta === game.STA_CLEAR || this.gameSta === game.STA_PAUSE;
  }

  // オープニングに戻る（全オブジェクト破棄）
  goToOpening() {
    [...engineObjects].forEach(o => o.destroy());
    this.gameSta = game.STA_OPENING;
  }

  // ポーズ中か
  isPaused() {
    return this.gameSta === game.STA_PAUSE;
  }

  // ステージ初期化
  initStage(stageNum) {
    this.stage = stageNum;
    [...engineObjects].forEach(o => o.destroy());
    new game.Player();
    this.enemyTable = game.Stages[stageNum];
    this.enemyTableIndex = 0;
    new game.Boss();
    this.frame = 0;
  }
};
