const game = {};

// 方向定数（ラジアン、Y↑座標系）
game.DIR_UP    = Math.PI / 2;        // 旧256段階: 64（Y↑で上方向）
game.DIR_DOWN  = 3 * Math.PI / 2;    // 旧256段階: 192（Y↑で下方向）

// 256段階角度1刻みのラジアン値（周期運動のフレームカウンタ用）
game.A256 = Math.PI / 128;

// ボス状態
game.BOSS_NONE    = 0;  // 未出現
game.BOSS_BATTLE  = 1;  // 戦闘中
game.BOSS_DESTROY = 2;  // 破壊演出中

// レーザー状態
game.LSR_DYING     = 0;  // 消滅中
game.LSR_TRACKING  = 1;  // 追跡中
game.LSR_NO_TARGET = 2;  // ターゲット未設定

// レーザー充填
game.LSR_CHARGE_OFF = 0;
game.LSR_CHARGE_ON  = 1;

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

// 画面外判定ユーティリティ（XY全方向）
game.isOutOfBounds = (x, y, bound) =>
  x < -bound || x > bound || y < -bound || y > bound;

// 背景
game.BG_STAR_COUNT   = 300;
game.BG_SCROLL_SPEED = 1;

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

//////////テクスチャインデックス//////////
game.TEX = {
  PLAYER: 0, EFFECT: 1, ENESHT: 2, UI: 3,
  ENEMY0: 4, ENEMY1: 5, ENEMY2: 6, ENEMY3: 7, ENEMY4: 8,
  ENEMY5: 9, ENEMY6: 10, ENEMY7: 11, ENEMY8: 12, ENEMY9: 13,
  BOSS0: 14, BOSS1: 15, TITLE: 16,
};

//////////タイル生成ヘルパー（ピクセル座標版・キャッシュ付き）//////////
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

//////////Color生成ヘルパー（キャッシュ付き）//////////
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

//////////乱数ヘルパー（hsp.rnd置き換え）//////////
game.rnd = (max) => Math.floor(Math.random() * max);

//////////EngineObjectフィルタヘルパー//////////
// 指定クラスの生存中インスタンスを配列で返す
game.objectsOf = (cls) => engineObjects.filter(o => o instanceof cls && !o.destroyed);

//////////UI描画ヘルパー//////////
// ワールド座標（Y↑中心原点、スプライト中心）で描画
game.drawUI = (x, y, tileInfo) => {
  drawTile(vec2(x, y), tileInfo.drawSize, tileInfo);
};

//////////方向計算（stg_dir）//////////
// fromからtoへの向きをラジアンで返す
game.calcDir = (from, to) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx !== 0 || dy !== 0) {
    return Math.atan2(dy, dx);
  }
  return 0;
};
