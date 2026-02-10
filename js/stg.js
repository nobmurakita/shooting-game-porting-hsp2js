const game = {};

// 方向定数（ラジアン）
game.DIR_DOWN  = Math.PI / 2;        // 旧256段階: 64
game.DIR_LEFT  = Math.PI;            // 旧256段階: 128
game.DIR_UP    = 3 * Math.PI / 2;    // 旧256段階: 192

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
game.radToSpriteFrame = (rad, divisions, spriteWidth) => {
  let norm = rad / (2 * Math.PI);
  norm = ((norm % 1) + 1) % 1;
  return (Math.round(norm * divisions) % divisions) * spriteWidth;
};

// ラジアンからスプライトフレーム番号を計算（半周期: 0〜π で折り返し）
game.radToSpriteFrameHalf = (rad, divisions, spriteWidth) => {
  let norm = rad / Math.PI;
  norm = ((norm % 1) + 1) % 1;
  return (Math.round(norm * divisions) % divisions) * spriteWidth;
};
