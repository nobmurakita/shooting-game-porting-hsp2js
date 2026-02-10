// 移植元(HSP)の命令、サブルーチン、変数等を配置するネームスペース
const hsp = {};

(function () {
  // 配列の初期化
  hsp.dim = (i, j) => {
    const d = [...Array(i)];
    if (j === undefined) {
      // 1次元配列
      return d.fill(0);
    } else {
      // 2次元配列
      return d.map(() => Array(j).fill(0));
    }
  };

  // 乱数生成
  hsp.rnd = (max) => {
    return Math.floor(Math.random() * max);
  };

  // 描画情報
  const g = {
    // ウィンドウリスト (Canvas)
    list: [
      document.createElement('canvas'), // ゲーム画面 (表示用)
      document.createElement('canvas'), // ゲーム画面 (オフスクリーンバッファ)
      document.createElement('canvas'), // 背景
      document.createElement('canvas'), // 基本画像
      document.createElement('canvas'), // 敵画像
      document.createElement('canvas'), // ボス画像
    ],

    // 描画先Canvas
    canvas: null,

    // 描画先Context
    ctx: null,

    // カラー
    color: 'rgb(0, 0, 0)',

    // カレントポジション
    pos: { x: 0, y: 0 }
  };

  // 描画先指定
  hsp.gsel = (id) => {
    g.canvas = g.list[id];
    if (g.canvas) {
      g.ctx = g.canvas.getContext('2d');
    } else {
      g.ctx = null;
    }
  };

  // ウィンドウIDを初期化 (仮想画面)
  hsp.buffer = (id, w, h) => {
    hsp.gsel(id);
    if (g.canvas) {
      g.canvas.width = w;
      g.canvas.height = h;
    }
  };

  // ウィンドウIDを初期化
  hsp.screen = (id, w, h) => {
    hsp.buffer(id, w, h);
    if (g.canvas) {
      document.getElementById('game').appendChild(g.canvas);
    }
  };

  // カラー設定
  hsp.color = (red, green, blue) => {
    g.color = `rgb(${red}, ${green}, ${blue})`;
  };

  // カレントポジション設定
  hsp.pos = (x, y) => {
    g.pos.x = x;
    g.pos.y = y;
  };

  // 矩形を塗りつぶす
  hsp.boxf = (x0, y0, x1, y1) => {
    if (g.ctx) {
      g.ctx.fillStyle = g.color;
      g.ctx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    }
  };

  // 1dotの点を表示
  hsp.pset = (x, y) => {
    hsp.boxf(x, y, x, y);
  };

  // 直線を描画
  hsp.line = (x0, y0, x1, y1) => {
    if (g.ctx) {
      g.ctx.strokeStyle = g.color;
      g.ctx.beginPath();
      g.ctx.moveTo(x0, y0);
      g.ctx.lineTo(x1, y1);
      g.ctx.stroke();
    }
  };
  
  // 画像ファイルの事前ロード (picloadで使用する画像を事前にロードしておく)
  const pics = {};
  hsp.preload = async (filename) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        pics[filename] = img;
        resolve();
      };
      img.onerror = () => {
        reject(new Error(`画像の読み込みに失敗: ${filename}`));
      };
      img.src = filename;
    });
  };

  // 画像ファイルをロード
  hsp.picload = (filename, x, y) => {
    const img = pics[filename];
    if (g.ctx && img) {
      g.ctx.drawImage(img, x, y);
    }
  };

  // 画面コピー
  hsp.gcopy = (id, x, y, w, h) => {
    const src = g.list[id];
    if (g.ctx && src) {
      g.ctx.drawImage(src, x, y, w, h, g.pos.x, g.pos.y, w, h);
    }
  };
})();
