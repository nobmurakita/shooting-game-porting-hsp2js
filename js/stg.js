const game = {};

// 256段階角度をラジアンに変換するヘルパー
game.toRad = (angle256) => (angle256 & 255) * Math.PI / 128;

// ラジアンを256段階角度に変換するヘルパー（スプライト選択用）
game.toAngle256 = (rad) => {
  let a = Math.round(rad * 128 / Math.PI) % 256;
  if (a < 0) a += 256;
  return a;
};
