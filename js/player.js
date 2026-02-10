;//////////プレーヤーショットクラス//////////
hsp.PlayerShot = class {
  static MAX = 36;

  constructor() {
    this.alive = false;
    this.x = 0;
    this.y = 0;
    this.dir = 0;
    this.frm = 0;
  }

  // ショット移動（旧MovPlySht内ループ1回分）
  update() {
    if (!this.alive) return;

    this.x += 16 * Math.cos(this.dir);
    this.y += 16 * Math.sin(this.dir);

    // 画面外で消滅
    if (this.y < -20) {
      this.alive = false;
    }
  }

  // ショット描画（旧DrwPlySht内ループ1回分）
  draw() {
    if (!this.alive) return;

    hsp.pos(Math.floor(this.x) - 5, Math.floor(this.y) - 10);
    hsp.gcopy(3, 280, 0, 10, 20);
  }
};

;//////////レーザークラス//////////
hsp.Laser = class {
  static MAX = 8;

  constructor() {
    this.alive = false;
    this.trg = null;
    this.sta = 0;
    this.x = [0, 0, 0, 0, 0, 0, 0, 0];
    this.y = [0, 0, 0, 0, 0, 0, 0, 0];
    this.vx = 0;
    this.vy = 0;
    this.dir = 0;
  }

  // レーザー移動・追跡・衝突判定（旧MovLsr内ループ1回分 + LsrHit）
  update(ctx) {
    if (!this.alive) return;

    // 節の位置を後方にシフト
    for (let j = 0; j < 7; j++) {
      const a = 7 - j;
      const b = a - 1;
      this.x[a] = this.x[b];
      this.y[a] = this.y[b];
    }

    const dir = this.dir;

    if (this.sta !== 0) {
      // 追跡中 or ターゲットなし: 加速・減衰
      this.vx += Math.cos(dir) * 5;
      this.vy += Math.sin(dir) * 5;
      this.x[0] += this.vx;
      this.y[0] += this.vy;
      this.vx = this.vx * 0.8;
      this.vy = this.vy * 0.8;
    } else {
      // 消滅途中: 全節が同一座標に収束したら消滅
      let moving = false;
      for (let j = 0; j < 7; j++) {
        if (this.x[j] !== this.x[j + 1] || this.y[j] !== this.y[j + 1]) {
          moving = true;
          break;
        }
      }
      if (!moving) {
        this.alive = false;
      }
    }

    // --- ターゲットが消滅、またはターゲットなし状態なら再検索 ---
    if ((this.sta === 1 && !this.trg.alive) || this.sta === 2) {
      const newTrg = ctx.player.searchTarget(ctx);
      if (newTrg !== null) {
        this.sta = 1;
        this.trg = newTrg;
        newTrg.lckOn++;
      } else {
        this.sta = 2;
      }
    }

    // --- 敵モード ---
    if (ctx.boss.flg !== 1) {
      // ターゲット追跡中: 衝突判定と方向更新
      if (this.sta === 1) {
        const e = this.trg;
        const d = e.constructor.DATA;

        // 衝突判定（点 vs 矩形）
        const hit = hsp.CollisionSystem.checkAABB(
          this.x[0], this.y[0], this.x[0], this.y[0],
          d.hitX1 + e.x, d.hitY1 + e.y,
          d.hitX2 + e.x, d.hitY2 + e.y
        );

        if (hit) {
          hsp.Score += 100;
          e.shield -= 5;
          e.lckOn--;
          this.sta = 0;

          // ヒットエフェクト
          for (let j = 0; j < 2; j++) {
            const ex = hsp.rnd(10) - 5;
            const ey = hsp.rnd(10) - 5;
            hsp.spawnEffect(ctx, 1, this.x[0] + ex, this.y[0] + ey, -j * 3);
          }

          // 敵撃破
          if (e.shield <= 0) {
            e.alive = false;
            for (let j = 0; j < 3; j++) {
              const ex = hsp.rnd(d.sx) - d.sx / 2;
              const ey = hsp.rnd(d.sy) - d.sy / 2;
              hsp.spawnEffect(ctx, 0, e.x + ex, e.y + ey, -j * 3);
            }
          }
        }

        // ターゲットへの方向を更新
        this.dir = hsp.CollisionSystem.calcDir(
          this.x[0], this.y[0], e.x, e.y
        );
      }
    } else {
      // --- ボスモード ---
      const boss = ctx.boss;

      // ターゲット追跡中: 衝突判定と方向更新
      if (this.sta === 1) {
        const p = this.trg;
        const pd = p.data;

        // 衝突判定（点 vs 矩形）
        const hit = hsp.CollisionSystem.checkAABB(
          this.x[0], this.y[0], this.x[0], this.y[0],
          (pd.x + pd.hitX1) + boss.x, (pd.y + pd.hitY1) + boss.y,
          (pd.x + pd.hitX2) + boss.x, (pd.y + pd.hitY2) + boss.y
        );

        if (hit) {
          hsp.Score += 100;
          boss.shield -= 5;
          p.shield -= 5;
          p.lckOn--;
          this.sta = 0;

          // ヒットエフェクト
          for (let j = 0; j < 2; j++) {
            const ex = hsp.rnd(10) - 5;
            const ey = hsp.rnd(10) - 5;
            hsp.spawnEffect(ctx, 1, this.x[0] + ex, this.y[0] + ey, -j * 3);
          }

          // ボス撃破判定
          if (boss.shield <= 0) {
            boss.shield = 0;
            boss.flg = 2;
            boss.frm = 0;
          }

          // パーツ破壊
          if (p.shield <= 0) {
            p.alive = false;
            p.cx = pd.sx;
            for (let j = 0; j < 3; j++) {
              const ex = hsp.rnd(pd.sx) - pd.sx / 2;
              const ey = hsp.rnd(pd.sy) - pd.sy / 2;
              hsp.spawnEffect(ctx, 0,
                pd.x + boss.x + ex,
                pd.y + boss.y + ey,
                -j * 3
              );
            }
          }
        }

        // ターゲットパーツへの方向を更新
        this.dir = hsp.CollisionSystem.calcDir(
          this.x[0], this.y[0],
          pd.x + boss.x,
          pd.y + boss.y
        );
      }
    }

    // ターゲットなし状態で画面外に出たら消滅開始
    if (this.sta === 2) {
      if (this.x[0] < 0 || 300 < this.x[0] || this.y[0] < 0 || 300 < this.y[0]) {
        this.sta = 0;
      }
    }

    // レーザーが1本でも生存していればlsrFをオフに（充填不可）
    if (this.alive) {
      ctx.player.lsrF = 0;
    }
  }

  // レーザー描画（旧DrwLsr内ループ1回分）
  draw() {
    if (!this.alive) return;

    for (let j = 0; j < 7; j++) {
      hsp.color(50, 255 - (j * 20), 160 - (j * 20));
      const ax = Math.floor(this.x[j]);
      const ay = Math.floor(this.y[j]);
      const bx = Math.floor(this.x[j + 1]);
      const by = Math.floor(this.y[j + 1]);
      hsp.line(ax, ay, bx, by);
      hsp.line(ax + 1, ay, bx + 1, by);
      hsp.line(ax - 1, ay, bx - 1, by);
      hsp.line(ax, ay + 1, bx, by + 1);
      hsp.line(ax, ay - 1, bx, by - 1);
    }
  }
};

;//////////プレーヤークラス//////////
hsp.Player = class {
  // ショット発射方向テーブル（旧DatShtDir）
  static SHT_DIR = [192, 192, 191, 193, 190, 194, 184, 200, 174, 210, 166, 218];
  // レーザー発射方向テーブル（旧DatLsrDir）
  static LSR_DIR = [187, 197, 177, 207, 167, 217, 157, 227];

  constructor() {
    this.alive = true;
    this.shield = 5;
    this.x = 150;
    this.y = 260;
    this.hitCnt = 0;
    this.gra = 0;
    this.frm = 0;
    this.shtCnt = 0;
    this.shtLV = 1;
    this.lsrF = 0;
    this.lsrPow = 0;
  }

  // プレーヤー初期化（旧IniPly）
  init() {
    this.alive = true;
    this.shield = 5;
    this.x = 150;
    this.y = 260;
    this.hitCnt = 0;
    this.gra = 0;
    this.frm = 0;
    this.shtCnt = 0;
    this.shtLV = 1;
    this.lsrF = 0;
    this.lsrPow = 0;
  }

  // プレーヤー移動（旧MovPly）
  update(ctx) {
    if (!this.alive) {
      this.lsrPow = 0;
      return;
    }

    // 移動量＆傾き決定
    const dx = ((hsp.Key & 4) >> 2) - (hsp.Key & 1);
    const dy = ((hsp.Key & 8) >> 3) - ((hsp.Key & 2) >> 1);

    if (dx || dy) {
      const r = hsp.CollisionSystem.calcDir(0, 0, dx, dy);
      this.x += Math.cos(r) * 5.5;
      this.y += Math.sin(r) * 5.5;
    }

    // 傾きアニメーション
    if (dx === 0) {
      if (this.gra < 0) { this.gra++; }
      if (this.gra > 0) { this.gra--; }
    } else {
      this.gra += dx;
      if (this.gra < -6) { this.gra = -6; }
      if (this.gra > 6) { this.gra = 6; }
    }

    // はみ出し制限
    if (this.x < 20) { this.x = 20; }
    if (this.y < 20) { this.y = 20; }
    if (this.x > 280) { this.x = 280; }
    if (this.y > 280) { this.y = 280; }

    // ショット発射
    if (this.shtCnt !== 0) {
      this.shtCnt--;
    } else {
      if (hsp.Key & 32) {
        this.shtCnt = 3;
        for (let i = 0; i < this.shtLV * 2; i++) {
          // プールから空きスロットを探す
          for (let j = 0; j < hsp.PlayerShot.MAX; j++) {
            if (ctx.playerShots[j].alive) continue;

            const s = ctx.playerShots[j];
            s.alive = true;
            s.frm = 0;
            const rad = hsp.toRad(hsp.Player.SHT_DIR[i + 6]);
            s.x = Math.cos(rad) * 20 + this.x;
            s.y = Math.sin(rad) * 20 + this.y;
            s.dir = hsp.toRad(hsp.Player.SHT_DIR[i]);
            break;
          }
        }
      }
    }

    // レーザー発射
    if (this.lsrF === 1) {
      if (hsp.Key & 16) {
        if (this.lsrPow >= 40) {
          for (let i = 0; i < Math.floor(this.lsrPow / 40); i++) {
            const lsr = i;
            if (ctx.lasers[lsr].alive) continue;

            const l = ctx.lasers[lsr];
            l.alive = true;

            // ターゲット検索
            const trg = this.searchTarget(ctx);
            if (trg !== null) {
              l.trg = trg;
              l.sta = 1;
              trg.lckOn++;
            } else {
              l.sta = 1;
            }

            // 初期位置設定
            for (let j = 0; j < 8; j++) {
              l.x[j] = this.x;
              l.y[j] = this.y - 20;
            }

            // 初期速度・方向
            const rad = hsp.toRad(hsp.Player.LSR_DIR[lsr]);
            l.vx = Math.cos(rad) * 16;
            l.vy = Math.sin(rad) * 16;
            l.dir = hsp.toRad(192);
          }
        }
      } else {
        this.lsrPow += (hsp.Key & 32 ? 1 : 3);
        if (this.lsrPow > 320) {
          this.lsrPow = 320;
        }
      }
    } else {
      this.lsrPow -= 25;
      if (this.lsrPow < 0) {
        this.lsrPow = 0;
      }
    }

    // 被弾カウンタ減少
    if (this.hitCnt !== 0) {
      this.hitCnt--;
    }

    this.frm++;
  }

  // ロックオンする敵をサーチ（旧SearchTrget）
  // 戻り値: ターゲットオブジェクト参照（null=なし）
  searchTarget(ctx) {
    let trg = null;

    if (ctx.boss.flg !== 1) {
      // 敵モード
      for (const e of ctx.enemies) {
        if (!e.alive) continue;

        if (trg === null) {
          trg = e;
          continue;
        }

        // ロックオン数が少ない敵を優先
        if (trg.lckOn > e.lckOn) {
          trg = e;
          continue;
        }
        if (trg.lckOn < e.lckOn) {
          continue;
        }

        // ロックオン数が同じなら距離が近い方
        let tx = trg.x - this.x; tx = tx * tx;
        let ty = trg.y - this.y; ty = ty * ty;
        const rd = tx + ty;
        let ix = e.x - this.x; ix = ix * ix;
        let iy = e.y - this.y; iy = iy * iy;
        if (rd > ix + iy) {
          trg = e;
        }
      }
    } else {
      // ボスモード
      const boss = ctx.boss;
      for (let i = 0; i < hsp.Boss.MAX_PARTS; i++) {
        const p = boss.parts[i];
        if (!p.alive) continue;

        if (trg === null) {
          trg = p;
          continue;
        }

        // コメントアウト: 有効にするとレーザーがボスの各パーツに分散する
        // if (trg.lckOn > p.lckOn) {
        //   trg = p;
        //   continue;
        // }
        // if (trg.lckOn < p.lckOn) {
        //   continue;
        // }

        // 距離が近いパーツを優先
        let tx = boss.x + trg.data.x - this.x; tx = tx * tx;
        let ty = boss.y + trg.data.y - this.y; ty = ty * ty;
        const rd = tx + ty;
        let ix = boss.x + p.data.x - this.x; ix = ix * ix;
        let iy = boss.y + p.data.y - this.y; iy = iy * iy;
        if (rd > ix + iy) {
          trg = p;
        }
      }
    }

    return trg;
  }

  // プレーヤー描画（旧DrwPly）
  draw() {
    if (!this.alive) return;

    hsp.pos(Math.floor(this.x) - 20, Math.floor(this.y) - 20);
    if (Math.floor(this.hitCnt / 3) % 2 === 0) {
      hsp.gcopy(3, (this.gra >> 1) * 40 + 120, 0, 40, 40);
    } else {
      hsp.gcopy(3, (this.gra >> 1) * 40 + 120, 40, 40, 40);
    }
  }

};

