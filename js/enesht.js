hsp.MaxDatEneSht = 3;
hsp.MaxEneSht = 100;

;//////////敵ショット初期化//////////
hsp.IniDatEneSht = () => {
  hsp.DatEneSht = [
    // sx, sy, HitX1, HitY1, HitX2, HitY2, cy
    [20, 20, -5, -5, 5, 5, 130],
    [20, 20, -5, -5, 5, 5, 130],
    [20, 20, -5, -5, 5, 5, 150],
  ];
};

;//////////敵ショット初期化//////////
hsp.IniEneSht = () => {
  hsp.EneShtFlg = hsp.dim(hsp.MaxEneSht);
  hsp.EneShtKi = hsp.dim(hsp.MaxEneSht);
  hsp.EneShtX = hsp.dim(hsp.MaxEneSht);
  hsp.EneShtY = hsp.dim(hsp.MaxEneSht);
  hsp.EneShtDir = hsp.dim(hsp.MaxEneSht);
  hsp.EneShtFrm = hsp.dim(hsp.MaxEneSht);
  hsp.EneShtCx = hsp.dim(hsp.MaxEneSht);
  hsp.EneShtTmp = hsp.dim(hsp.MaxEneSht, 4);
};

;//////////敵ショット発生//////////
hsp.AprEneSht = () => {
  for (let i = 0; i < hsp.MaxEneSht; i++) {
    if (hsp.EneShtFlg[i] != 0) {
      continue;
    }
    hsp.EneShtFlg[i] = 1;
    const shtki = hsp.prm[0];
    hsp.EneShtKi[i] = shtki
    hsp.EneShtX[i] = hsp.prm[1];
    hsp.EneShtY[i] = hsp.prm[2];
    hsp.r = hsp.prm[3];
    hsp.EneShtDir[i] = hsp.r;
    hsp.EneShtFrm[i] = 0;
    hsp.EneShtTmp[i] = [0, 0, 0, 0];
    if (shtki == 0) {
      let a = hsp.toAngle256(hsp.r);
      hsp.EneShtCx[i] = Math.floor(((a + 4) & 127) * 15 / 127) * 20;
    }
    break;
  }
};

;//////////敵ショット移動//////////
hsp.MovEneSht = () => {
  for (let i = 0; i < hsp.MaxEneSht; i++) {
    if (hsp.EneShtFlg[i] == 0) {
      continue;
    }
    const ki = hsp.EneShtKi[i];

    if (ki == 0) {
      hsp.r = hsp.EneShtDir[i];
      hsp.EneShtX[i] += Math.cos(hsp.r) * 7;
      hsp.EneShtY[i] += Math.sin(hsp.r) * 7;
      if (hsp.EneShtX[i] < -10 || hsp.EneShtX[i] > 310 || hsp.EneShtY[i] < -10 || hsp.EneShtY[i] > 310) {
        hsp.EneShtFlg[i] = 0;
      }
    }

    if (ki == 1) {
      hsp.r = hsp.EneShtDir[i];
      hsp.EneShtX[i] += Math.cos(hsp.r) * 5;
      hsp.EneShtY[i] += Math.sin(hsp.r) * 5;
      hsp.EneShtCx[i] = (hsp.EneShtFrm[i] % 16) * 20 + 320;
      if (hsp.EneShtX[i] < -10 || hsp.EneShtX[i] > 310 || hsp.EneShtY[i] < -10 || hsp.EneShtY[i] > 310) {
        hsp.EneShtFlg[i] = 0;
      }
    }

    if (ki == 2) {
      hsp.r = hsp.EneShtDir[i];
      if ((hsp.EneShtFrm[i] < 80 && hsp.PlyFlg == 1) || hsp.EneShtFrm[i] == 0) {
        hsp.prm = [hsp.EneShtX[i], hsp.EneShtY[i], hsp.PlyX, hsp.PlyY];
        hsp.stg_dir();
        hsp.EneShtDir[i] = hsp.r;
      }
      hsp.EneShtTmp[i][0] += Math.cos(hsp.r) * 2 / 3;
      hsp.EneShtTmp[i][1] += Math.sin(hsp.r) * 2 / 3;
      hsp.EneShtX[i] += hsp.EneShtTmp[i][0];
      hsp.EneShtY[i] += hsp.EneShtTmp[i][1];
      hsp.EneShtTmp[i][0] = hsp.EneShtTmp[i][0] * 14 / 15;
      hsp.EneShtTmp[i][1] = hsp.EneShtTmp[i][1] * 14 / 15;
      let a = hsp.toAngle256(hsp.r);
      hsp.EneShtCx[i] = Math.floor(((a + 4) & 255) * 31 / 255) * 20;
      if (hsp.EneShtFrm[i] % 3 == 0) {
        let x = hsp.rnd(10); x -= 5;
        let y = hsp.rnd(10); y -= 5;
        hsp.prm = [2, -Math.cos(hsp.r) * 10 + hsp.EneShtX[i] + x, -Math.sin(hsp.r) * 10 + hsp.EneShtY[i] + y, 0];
        hsp.AprEff();
      }
      hsp.prm = [
      ];
      for (let j = 0; j < hsp.MaxPlySht; j++) {
        if (hsp.PlyShtFlg[j] == 0) {
          continue;
        }
        hsp.prm = [
          hsp.DatEneSht[ki][2] + hsp.EneShtX[i],
          hsp.DatEneSht[ki][3] + hsp.EneShtY[i],
          hsp.DatEneSht[ki][4] + hsp.EneShtX[i],
          hsp.DatEneSht[ki][5] + hsp.EneShtY[i],
          hsp.PlyShtX[j] - 5,
          hsp.PlyShtY[j] - 10,
          hsp.PlyShtX[j] + 5,
          hsp.PlyShtY[j] + 10,
        ];
        hsp.stg_clash();
        if (hsp.r == 1) {
          hsp.Score += 10;
          hsp.PlyShtFlg[j] = 0;
          hsp.EneShtFlg[i] = 0;
          let x = hsp.rnd(10); x -= 5;
          let y = hsp.rnd(10); y -= 5;
          hsp.prm = [1, hsp.PlyShtX[j] + x, hsp.PlyShtY[j] + y, 0];
          hsp.AprEff();
          for (let k = 0; k < 2; k++) {
            let x = hsp.rnd(hsp.DatEneSht[ki][0]); x -= Math.floor(hsp.DatEneSht[ki][0] / 2);
            let y = hsp.rnd(hsp.DatEneSht[ki][1]); y -= Math.floor(hsp.DatEneSht[ki][1] / 2);
            hsp.prm = [0, hsp.EneShtX[i] + x, hsp.EneShtY[i] + y, -k * 3];
            hsp.AprEff();
          }
          break;
        }
      }
      if (hsp.EneShtFrm[i] > 80) {
        if (hsp.EneShtX[i] < -10 || hsp.EneShtX[i] > 310 || hsp.EneShtY[i] < -10 || hsp.EneShtY[i] > 310) {
          hsp.EneShtFlg[i] = 0;
        }
      }
    }

    hsp.EneShtFrm[i]++;

    if (hsp.PlyHitCnt != 0) {
      continue;
    }

    hsp.prm = [
      hsp.DatEneSht[ki][2] + hsp.EneShtX[i],
      hsp.DatEneSht[ki][3] + hsp.EneShtY[i],
      hsp.DatEneSht[ki][4] + hsp.EneShtX[i],
      hsp.DatEneSht[ki][5] + hsp.EneShtY[i],
      hsp.PlyX - 5,
      hsp.PlyY - 5,
      hsp.PlyX + 5,
      hsp.PlyY + 5,
    ];
    hsp.stg_clash();
    if (hsp.r == 1) {
      hsp.EneShtFlg[i] = 0;
      hsp.PlyShield--;
      hsp.PlyHitCnt = 50;
      for (let j = 0; j < 2; j++) {
        let x = hsp.rnd(10); x -= 5;
        let y = hsp.rnd(10); y -= 5;
        hsp.prm = [1, hsp.EneShtX[i] + x, hsp.EneShtY[i] + y, -j * 3];
        hsp.AprEff();
      }
      if (hsp.PlyShield == 0) {
        hsp.PlyFlg = 0;
        for (let j = 0; j < 3; j++) {
          let x = hsp.rnd(40); x -= 20;
          let y = hsp.rnd(40); y -= 20;
          hsp.prm = [0, hsp.PlyX + x, hsp.PlyY + y, -j * 3];
          hsp.AprEff();
        }
      }
    }
  }
}

;//////////敵ショット描画//////////
hsp.DrwEneSht = () => {
  for (let i = 0; i < hsp.MaxEneSht; i++) {
    if (hsp.EneShtFlg[i] == 0) {
      continue;
    }
    const ki = hsp.EneShtKi[i];
    hsp.pos(Math.floor(hsp.EneShtX[i]) - Math.floor(hsp.DatEneSht[ki][0] / 2), Math.floor(hsp.EneShtY[i]) - Math.floor(hsp.DatEneSht[ki][1] / 2));
    hsp.gcopy(3, hsp.EneShtCx[i], hsp.DatEneSht[ki][6], hsp.DatEneSht[ki][0], hsp.DatEneSht[ki][1]);
  }
};
