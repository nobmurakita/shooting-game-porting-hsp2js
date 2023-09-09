hsp.STA_OPENING = 0;  // オープニング
hsp.STA_TITLE =   1;  // タイトル
hsp.STA_INIT =    2;  // ステージ初期化
hsp.STA_PLAY =    3;  // ゲームプレー中
hsp.STA_CLEAR =   4;  // ゲームクリア
hsp.STA_ENDING =  5;  // エンディング
hsp.STA_PAUSE =   6;  // ポーズ

hsp.MaxStage = 1;

;//////////初期設定//////////
hsp.IniCom = () => {
  hsp.GameSta = hsp.STA_OPENING;
  hsp.Stage = 0;
  hsp.Score = 0;
  hsp.HiScore = 0;

  // ゲーム画面
  hsp.screen(0, 300, 300);  // 表示用
  hsp.buffer(1, 300, 300);  // オフスクリーンバッファ

  // 背景
  hsp.buffer(2, 300, 300);
  hsp.color(20, 20, 0);
  hsp.boxf(0, 0, 300, 300);
  for (let i = 0; i < 300; i++) {
    hsp.color(255 - hsp.rnd(100), 255 - hsp.rnd(100), 255 - hsp.rnd(100));
    hsp.pset(hsp.rnd(300), hsp.rnd(300));
  }
  hsp.BG1 = 0;
  hsp.BG2 = 0;

  // 基本画像
  hsp.buffer(3, 1000, 1000);
  hsp.picload('img/player.png', 0, 0);
  hsp.picload('img/effect.png', 0, 80);
  hsp.picload('img/enesht.png', 0, 130);
  hsp.picload('img/etc.png', 0, 170);
}

;//////////背景//////////
hsp.BackGround = () => {
  hsp.BG2 = 300 - hsp.BG1;
  hsp.pos(0, 0);
  hsp.gcopy(2, 0, hsp.BG2, 300, hsp.BG1);
  hsp.pos(0, hsp.BG1);
  hsp.gcopy(2, 0, 0, 300, hsp.BG2);
  hsp.BG1++;
  if (hsp.BG1 == 300) {
    hsp.BG1 -= 300;
  }
};

;//////////ステータス表示//////////
hsp.Disp = () => {
  // スコア
  hsp.pos(0, 0);
  hsp.gcopy(3, 17, 186, 45, 16);
  let a = hsp.Score;
  let x = 0;
  let y = 170;
  for (let i = 0; i < 8; i++) {
    hsp.pos(-i * 8 + 100, 0);
    hsp.gcopy(3, a % 10 * 8 + x, y, 8, 16);
    a = Math.floor(a / 10);
    if (a == 0) {
      x = 64;
      y = 186;
    }
  }

  // ハイスコア
  hsp.pos(173, 0);
  hsp.gcopy(3, 0, 186, 62, 16);
  a = hsp.HiScore;
  x = 0;
  y = 170;
  for (let i = 0; i < 8; i++) {
    hsp.pos(-i * 8 + 290, 0);
    hsp.gcopy(3, a % 10 * 8 + x, y, 8, 16);
    a = Math.floor(a / 10);
    if (a == 0) {
      x = 64;
      y = 186;
    }
  }
  hsp.pos(0, 284);
  hsp.gcopy(3, 0, 218, 40, 16);

  // レーザー
  hsp.pos(40, 288);
  hsp.gcopy(3, 0, 264, 80, 12);
  hsp.pos(40, 288);
  hsp.gcopy(3, 0, 254, Math.floor(hsp.LsrPow / 4), 12);

  // シールド
  hsp.pos(200, 284);
  hsp.gcopy(3, 0, 202, 45, 16);
  if (hsp.PlyShield != 0) {
    for (let i = 0; i < hsp.PlyShield; i++) {
      hsp.pos(i * 8 + 245, 284);
      hsp.gcopy(3, 72, 186, 8, 16);
    }
  }
};
