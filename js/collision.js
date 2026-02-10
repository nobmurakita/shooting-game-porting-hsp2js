;//////////衝突判定システム//////////
hsp.CollisionSystem = class {
  // AABB衝突判定（旧 stg_clash）
  // (x1,y1)(x2,y2)を対角線とする矩形と(x3,y3)(x4,y4)を対角線とする矩形が重なっていればtrue
  static checkAABB(x1, y1, x2, y2, x3, y3, x4, y4) {
    if (x1 > x4) return false;
    if (y1 > y4) return false;
    if (x2 < x3) return false;
    if (y2 < y3) return false;
    return true;
  }

  // 方向計算（旧 stg_dir）
  // (x0,y0)から(x1,y1)への向きをラジアンで返す
  static calcDir(x0, y0, x1, y1) {
    let dx = x1 - x0;
    let dy = y1 - y0;
    if (dx !== 0 || dy !== 0) {
      return Math.atan2(dy, dx);
    }
    return 0;
  }
};
