const game = {};

// 方向定数（ラジアン）
game.DIR_DOWN  = Math.PI / 2;        // 旧256段階: 64
game.DIR_LEFT  = Math.PI;            // 旧256段階: 128
game.DIR_UP    = 3 * Math.PI / 2;    // 旧256段階: 192

// 256段階角度1刻みのラジアン値（周期運動のフレームカウンタ用）
game.A256 = Math.PI / 128;

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
