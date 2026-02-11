const game = {};

// 方向定数（ラジアン、Y↑座標系）
game.DIR_UP    = Math.PI / 2;        // 旧256段階: 64（Y↑で上方向）
game.DIR_LEFT  = Math.PI;            // 旧256段階: 128
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
game.SCREEN_W = 300;
game.SCREEN_H = 300;

// 背景
game.BG_STAR_COUNT   = 300;
game.BG_SCROLL_SPEED = 0.5;

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

//////////タイル生成ヘルパー（ピクセル座標版）//////////
// tile()はタイルインデックスを受け取るため、ピクセル座標をインデックスに変換
// 半テクセル内側にインセットし、カメラ拡大時のテクスチャブリーディングを防止
game.tile = (pixelX, pixelY, w, h, texIndex) => {
  const t = tile(vec2(pixelX / w, pixelY / h), vec2(w, h), texIndex);
  const pad = 0.5;
  t.pos.x += pad;
  t.pos.y += pad;
  t.size.x -= pad * 2;
  t.size.y -= pad * 2;
  return t;
};

//////////乱数ヘルパー（hsp.rnd置き換え）//////////
game.rnd = (max) => Math.floor(Math.random() * max);

//////////UI描画ヘルパー//////////
// スクリーン座標（Y↓左上原点、スプライト左上）→ ワールド座標（Y↑中心原点、スプライト中心）
game.drawUI = (screenX, screenY, tileInfo) => {
  const w = tileInfo.size.x;
  const h = tileInfo.size.y;
  const wx = screenX + w / 2 - game.SCREEN_W / 2;
  const wy = game.SCREEN_H / 2 - (screenY + h / 2);
  drawTile(vec2(wx, wy), vec2(w, h), tileInfo);
};
