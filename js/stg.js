;//////////シューティング用汎用サブルーチン使用準備//////////
hsp.stg_set = () => {
  // パラメータ用変数
  hsp.prm = hsp.dim(8);
};

;//////////方向を求める//////////
hsp.stg_dir = () => {
  // hsp.prm = [x0, y0, x1, y1]
  // (x0,y0) から (x1,y1) への向きをラジアンで返す
  let dx = hsp.prm[2] - hsp.prm[0];
  let dy = hsp.prm[3] - hsp.prm[1];
  if (dx != 0 || dy != 0) {
    hsp.r = Math.atan2(dy, dx);
  }
};

;// 256段階角度をラジアンに変換するヘルパー
hsp.toRad = (angle256) => (angle256 & 255) * Math.PI / 128;

;// ラジアンを256段階角度に変換するヘルパー（スプライト選択用）
hsp.toAngle256 = (rad) => {
  let a = Math.round(rad * 128 / Math.PI) % 256;
  if (a < 0) a += 256;
  return a;
};

;//////////領域の衝突判定//////////
hsp.stg_clash = () => {
  // prm = [x1, y1, x2, y2, x3, y3, x4, y4]
  // (x1,y1)(x2,y2)を対角線とする四角形と
  // (x3,y3)(x4,y4)を対角線とする四角形が
  // 重なっているときは1を返す
  hsp.r = 1;
  if (hsp.prm[0] > hsp.prm[6]) { hsp.r = 0; return; }
  if (hsp.prm[1] > hsp.prm[7]) { hsp.r = 0; return; }
  if (hsp.prm[2] < hsp.prm[4]) { hsp.r = 0; return; }
  if (hsp.prm[3] < hsp.prm[5]) { hsp.r = 0; return; }
};
