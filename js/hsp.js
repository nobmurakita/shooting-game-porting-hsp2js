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

  // キー入力情報
  // 1 : カーソルキー左(←)
  // 2 : カーソルキー上(↑)
  // 4 : カーソルキー右(→)
  // 8 : カーソルキー下(↓)
  // 16 : スペースキー
  // 32 : Enterキー
  // 64 : Ctrlキー
  // 128 : ESCキー
  let key = 0;
  window.addEventListener('keydown', event => {
    switch (event.code) {
      case 'ArrowLeft': key |= 1; break;
      case 'ArrowUp': key |= 2; break;
      case 'ArrowRight': key |= 4; break;
      case 'ArrowDown': key |= 8; break;
      case 'KeyX': key |= 16; break;
      case 'KeyZ': key |= 32; break;
      case 'ShiftLeft': if (!event.repeat) { key |= 64; } break;
      case 'ShiftRight': if (!event.repeat) { key |= 64; } break;
      case 'Escape': if (!event.repeat) { key |= 128; } break;
    }
  });
  window.addEventListener('keyup', event => {
    switch (event.code) {
      case 'ArrowLeft': key &= ~1; break;
      case 'ArrowUp': key &= ~2; break;
      case 'ArrowRight': key &= ~4; break;
      case 'ArrowDown': key &= ~8; break;
      case 'KeyX': key &= ~16; break;
      case 'KeyZ': key &= ~32; break;
      case 'ShiftLeft': key &= ~64; break;
      case 'ShiftRight': key &= ~64; break;
      case 'Escape': key &= ~128; break;
    }
  });

  // キー入力情報取得
  hsp.stick = () => {
    const ret = key;
    key &= ~64;
    key &= ~128;
    return ret;
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
    g.pos = { x, y };
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
  hsp.preload = async (filename, x, y) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        pics[filename] = img;
        resolve();
      };
      img.onerror = () => {
        reject();
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
