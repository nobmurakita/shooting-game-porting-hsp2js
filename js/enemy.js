hsp.MaxEne = 10;

;//////////敵データ初期化//////////
hsp.IniDatEne = () => {
  hsp.buffer(4, 2000, 2000);
  hsp.picload('img/enemy00.png', 0, 0);
  hsp.picload('img/enemy01.png', 0, 40);
  hsp.picload('img/enemy02.png', 0, 80);
  hsp.picload('img/enemy03.png', 0, 120);
  hsp.picload('img/enemy04.png', 0, 180);
  hsp.picload('img/enemy05.png', 0, 240);
  hsp.picload('img/enemy06.png', 0, 280);
  hsp.picload('img/enemy07.png', 0, 330);
  hsp.picload('img/enemy08.png', 0, 390);
  hsp.picload('img/enemy09.png', 0, 430);

  hsp.DatEne = [
    // Shield, sx, sy, HitX1, HitY1, HitX2, HitY2, Cy	
    [2, 20, 40, -5, -15, 5, 15, 0],
    [2, 40, 40, -10, -10, 10, 10, 40],
    [4, 40, 40, -15, -15, 15, 15, 80],
    [4, 40, 60, -20, -20, 20, 20, 120],
    [40, 120, 60, -50, -10, 50, 15, 180],
    [3, 40, 40, -15, -15, 15, 15, 240],
    [4, 40, 50, -15, -10, 15, 10, 280],
    [2, 40, 60, -15, -25, 15, 25, 330],
    [4, 40, 40, -15, -15, 15, 15, 390],
    [40, 60, 60, -25, -25, 25, 25, 430],
  ];
};

;//////////敵初期化//////////
hsp.IniEne = () => {
  hsp.EneTable = hsp.Stages[hsp.Stage];
  hsp.TableIndex = 0;
  hsp.EneFlg = hsp.dim(hsp.MaxEne);
  hsp.EneShield = hsp.dim(hsp.MaxEne);
  hsp.EneFrm = hsp.dim(hsp.MaxEne);
  hsp.EneKi = hsp.dim(hsp.MaxEne);
  hsp.EneMv = hsp.dim(hsp.MaxEne);
  hsp.EneX0 = hsp.dim(hsp.MaxEne);
  hsp.EneY0 = hsp.dim(hsp.MaxEne);
  hsp.EneX = hsp.dim(hsp.MaxEne);
  hsp.EneY = hsp.dim(hsp.MaxEne);
  hsp.EneCx = hsp.dim(hsp.MaxEne);
  hsp.EneCy = hsp.dim(hsp.MaxEne);
  hsp.EneTmp = hsp.dim(hsp.MaxEne, 8);
  hsp.EneLckOn = hsp.dim(hsp.MaxEne);
}

;//////////敵発生//////////
hsp.AprEne = () => {
  while (true) {
    if (hsp.BossAprFrm == hsp.Frame) {
      hsp.BossFlg = 1;
    }
    if (hsp.TableIndex == hsp.EneTable.length) {
      return;
    }
    if (hsp.EneTable[hsp.TableIndex][0] == hsp.Frame) {
      for (let i = 0; i < hsp.MaxEne; i++) {
        if (hsp.EneFlg[i] != 0) {
          continue;
        }
        hsp.EneFlg[i] = 1;
        hsp.EneFrm[i] = 0;
        hsp.EneKi[i] = hsp.EneTable[hsp.TableIndex][1];
        hsp.EneMv[i] = hsp.EneTable[hsp.TableIndex][2];
        hsp.EneX0[i] = hsp.EneTable[hsp.TableIndex][3] << 8;
        hsp.EneY0[i] = hsp.EneTable[hsp.TableIndex][4] << 8;
        hsp.EneX[i] = hsp.EneX0[i];
        hsp.EneY[i] = hsp.EneY0[i];
        hsp.EneLckOn[i] = 0;
        let ki = hsp.EneKi[i];
        hsp.EneShield[i] = hsp.DatEne[ki][0];
        hsp.EneTmp[i] = [0, 0, 0, 0, 0, 0, 0, 0];
        break;
      }
      hsp.TableIndex++;
    } else {
      return;
    }
  }
};

;//////////敵移動//////////
hsp.MovEne = () => {
  for (let i = 0; i < hsp.MaxEne; i++) {
    const ene = i
    if (hsp.EneFlg[ene] == 0) {
      continue;
    }
    const ki = hsp.EneKi[ene];
    const mv = hsp.EneMv[ene];

    if (ki == 0) {
      hsp.r = 3 * hsp.EneFrm[ene] & 255;
      if (mv == 0) {
        hsp.EneX[ene] = 40 * hsp.sin[hsp.r] + hsp.EneX0[ene];
      }
      if (mv == 1) {
        hsp.EneX[ene] = -40 * hsp.sin[hsp.r] + hsp.EneX0[ene];
      }
      hsp.EneY[ene] += 512;
      hsp.EneCx[ene] = hsp.EneFrm[ene] % 6 * 20;
      if (81920 < hsp.EneY[ene]) {
        hsp.EneFlg[ene] = 0;
      }
    }

    if (ki == 1) {
      if (Math.floor(hsp.EneFrm[ene] / 2) <= 64) {
        hsp.EneTmp[ene][0] = hsp.EneFrm[ene] >> 1;
      }
      if (hsp.EneMv[ene] == 0) {
        hsp.r = 64 + hsp.EneTmp[ene][0];
      }
      if (hsp.EneMv[ene] == 1) {
        hsp.r = 64 - hsp.EneTmp[ene][0];
      }
      hsp.EneX[ene] += hsp.cos[hsp.r] * 4;
      hsp.EneY[ene] += hsp.sin[hsp.r] * 4;
      hsp.EneCx[ene] = (hsp.cos[hsp.r] * 3 >> 8) + 120;
      if (hsp.EneFrm[ene] == 32) {
        hsp.prm = [0, hsp.EneX[ene], hsp.EneY[ene] + 5120, 64];
        hsp.AprEneSht();
      }
      if ((hsp.EneX[ene] < -5120) || (81920 < hsp.EneX[ene])) {
        hsp.EneFlg[ene] = 0;
      }
    }

    if (ki == 2) {
      hsp.r = hsp.EneTmp[ene][0];
      if ((hsp.EneFrm[ene] <= 80 && hsp.PlyFlg == 1) || hsp.EneFrm[ene] == 0) {
        hsp.prm = [hsp.EneX[ene], hsp.EneY[ene], hsp.PlyX, hsp.PlyY];
        hsp.stg_dir();
        hsp.EneTmp[ene][0] = hsp.r;
      }
      hsp.EneTmp[ene][1] += hsp.cos[hsp.r] >> 1;
      hsp.EneTmp[ene][2] += hsp.sin[hsp.r] >> 1;
      hsp.EneX[ene] += hsp.EneTmp[ene][1];
      hsp.EneY[ene] += hsp.EneTmp[ene][2];
      hsp.EneTmp[ene][1] = Math.floor(hsp.EneTmp[ene][1] * 19 / 20);
      hsp.EneTmp[ene][2] = Math.floor(hsp.EneTmp[ene][2] * 19 / 20);
      if (hsp.EneFrm[ene] != 0 && hsp.EneFrm[ene] % 30 == 0) {
        hsp.prm = [0, hsp.cos[hsp.r] * 20 + hsp.EneX[ene], hsp.sin[hsp.r] * 20 + hsp.EneY[ene], hsp.r];
        hsp.AprEneSht();
      }
      hsp.EneCx[ene] = Math.floor((hsp.r + 4 & 255) * 31 / 255) * 40;
      if (hsp.EneFrm[ene] > 80) {
        if (hsp.EneX[ene] < -5120 || hsp.EneX[ene] > 81920 || hsp.EneY[ene] < -5120 || hsp.EneY[ene] > 81920) {
          hsp.EneFlg[ene] = 0;
        }
      }
    }

    if (ki == 3) {
      hsp.EneY[ene] += 1024;
      if (hsp.EneFrm[ene] == 20 || hsp.EneFrm[ene] == 40 || hsp.EneFrm[ene] == 60 || hsp.EneFrm[ene] == 80) {
        hsp.prm = [hsp.EneX[ene], hsp.EneY[ene], hsp.PlyX, hsp.PlyY];
        hsp.stg_dir();
        hsp.prm = [1, hsp.EneX[ene], 7680 + hsp.EneY[ene], hsp.r];
        hsp.AprEneSht();
      }
      hsp.EneCx[ene] = 0;
      if (hsp.EneY[ene] > 84480) {
        hsp.EneFlg[ene] = 0;
      }
    }

    if (ki == 4) {
      hsp.r = hsp.EneFrm[ene] & 255;
      hsp.EneY[ene] -= 256;
      hsp.EneX[ene] = (hsp.sin[hsp.r] << 3) + hsp.EneX0[ene]
      if (hsp.EneFrm[ene] > 50 && hsp.r % 8 == 0) {
        hsp.prm = [1, hsp.EneX[ene] + 2560, hsp.EneY[ene] - 512, 64 - hsp.EneTmp[ene][0] & 255];
        hsp.AprEneSht();
        hsp.prm = [1, hsp.EneX[ene] - 2560, hsp.EneY[ene] - 512, 64 + hsp.EneTmp[ene][0] & 255];
        hsp.EneTmp[ene][0] += 8;
        hsp.AprEneSht();
      }
      hsp.EneCx[ene] = 0;
      if (hsp.EneY[ene] < -7680) {
        hsp.EneFlg[ene] = 0;
      }
    }

    if (ki == 5) {
      if (mv == 0) {
        hsp.r = hsp.EneFrm[ene] << 1;
      } else {
        hsp.r = (-hsp.EneFrm[ene] << 1) + 128;
      }
      hsp.EneX[ene] = hsp.cos[hsp.r] * 150 + 38400;
      hsp.EneY[ene] = hsp.sin[hsp.r] * 150;
      hsp.prm = [hsp.EneX[ene], hsp.EneY[ene], hsp.PlyX, hsp.PlyY];
      hsp.stg_dir();
      if (hsp.EneFrm[ene] == 16 || hsp.EneFrm[ene] == 48) {
        hsp.prm = [0, hsp.cos[hsp.r] * 20 + hsp.EneX[ene], hsp.sin[hsp.r] * 20 + hsp.EneY[ene], hsp.r];
        hsp.AprEneSht();
      }
      hsp.EneCx[ene] = Math.floor((hsp.r + 4 & 255) * 31 / 255) * 40;
      if (hsp.EneFrm[ene] == 64) {
        hsp.EneFlg[ene] = 0;
      }
    }

    if (ki == 6) {
      hsp.r = hsp.EneFrm[ene] * 2;
      hsp.EneY[ene] += hsp.cos[hsp.r] * 6;
      hsp.EneCx[ene] = ((-hsp.cos[hsp.r] >> 6) + 4) * 40;
      if (hsp.EneFrm[ene] == 25) {
        hsp.prm = [hsp.EneX[ene], hsp.EneY[ene], hsp.PlyX, hsp.PlyY];
        hsp.stg_dir();
        hsp.prm = [2, hsp.EneX[ene] + 2560, hsp.EneY[ene] + 6400, hsp.r];
        hsp.AprEneSht();
        hsp.prm = [2, hsp.EneX[ene] - 2560, hsp.EneY[ene] + 6400, hsp.r];
        hsp.AprEneSht();
      }
      if (hsp.EneY[ene] == hsp.EneY0[ene]) {
        hsp.EneFlg[ene] = 0;
      }
    }

    if (ki == 7) {
      hsp.r = (hsp.EneFrm[ene] << 2) & 255;
      if (mv == 0) {
        hsp.EneX[ene] = 40 * hsp.sin[hsp.r] + hsp.EneX0[ene];
      }
      if (mv == 1) {
        hsp.EneX[ene] = -40 * hsp.sin[hsp.r] + hsp.EneX0[ene];
      }
      hsp.EneY[ene] += 512;
      if (hsp.r % 64 == 0) {
        hsp.prm = [0, hsp.EneX[ene], hsp.EneY[ene] + 7680, 64];
        hsp.AprEneSht();
      }
      hsp.EneCx[ene] = (Math.floor(hsp.EneFrm[ene] / 2) & 7) * 40;
      if (hsp.EneY[ene] > 84480) {
        hsp.EneFlg[ene] = 0;
      }
    }

    if (ki == 8) {
      if (hsp.EneFrm[ene] < 30) {
        hsp.r = 192;
      } else {
        if (hsp.EneFrm[ene] < 46) {
          hsp.EneTmp[ene][0] = hsp.EneFrm[ene] - 30 * 2;
        }
        if (hsp.EneMv[ene] == 0) {
          hsp.r = 192 + hsp.EneTmp[ene][0];
        }
        if (hsp.EneMv[ene] == 1) {
          hsp.r = 192 - hsp.EneTmp[ene][0];
        }
      }
      hsp.EneX[ene] += hsp.cos[hsp.r] * 5;
      hsp.EneY[ene] += hsp.sin[hsp.r] * 5;
      hsp.EneCx[ene] = (((hsp.cos[hsp.r] * 3) >> 8) + 3) * 40;
      if (hsp.EneFrm[ene] == 30) {
        hsp.prm = [hsp.EneX[ene], hsp.EneY[ene], hsp.PlyX, hsp.PlyY];
        hsp.stg_dir();
        let t = hsp.r
        hsp.prm = [0, hsp.EneX[ene], hsp.EneY[ene], t];
        hsp.AprEneSht();
        hsp.prm = [0, hsp.EneX[ene], hsp.EneY[ene], t + 16 & 255];
        hsp.AprEneSht();
        hsp.prm = [0, hsp.EneX[ene], hsp.EneY[ene], t + 240 & 255];
        hsp.AprEneSht();
      }
      if (hsp.EneX[ene] < -5120 || 81920 < hsp.EneX[ene]) {
        hsp.EneFlg[ene] = 0;
      }
    }

    if (ki == 9) {
      if (hsp.EneFrm[ene] == 0) {
        hsp.EneTmp[ene][0] = 256;
      }
      if (hsp.EneFrm[ene] % 50 == 0) {
        hsp.EneTmp[ene][0] = -hsp.EneTmp[ene][0];
      }
      hsp.EneX[ene] += hsp.EneTmp[ene][0];
      hsp.EneY[ene] += 256;
      if (hsp.EneFrm[ene] > 50 && hsp.EneFrm[ene] < 296 && hsp.EneFrm[ene] % 4 == 0) {
        hsp.prm = [1, hsp.EneX[ene], hsp.EneY[ene] - 2560, hsp.EneTmp[ene][1] & 255];
        hsp.AprEneSht();
        hsp.prm = [1, hsp.EneX[ene], hsp.EneY[ene] - 2560, hsp.EneTmp[ene][1] + 64 & 255];
        hsp.AprEneSht();
        hsp.prm = [1, hsp.EneX[ene], hsp.EneY[ene] - 2560, hsp.EneTmp[ene][1] + 128 & 255];
        hsp.AprEneSht();
        hsp.prm = [1, hsp.EneX[ene], hsp.EneY[ene] - 2560, hsp.EneTmp[ene][1] + 192 & 255];
        hsp.AprEneSht();
        hsp.EneTmp[ene][1] += 4;
      }
      hsp.EneCx[ene] = (Math.floor(hsp.EneFrm[ene] / 2) & 7) * 60;
      if (hsp.EneY[ene] > 84480) {
        hsp.EneFlg[ene] = 0;
      }
    }

    hsp.EneCy[ene] = hsp.DatEne[ki][7];

    hsp.EneFrm[ene]++;

    for (let j = 0; j < hsp.MaxPlySht; j++) {
      if (hsp.PlyShtFlg[j] == 0) {
        continue;
      }
      hsp.prm = [
        (hsp.DatEne[ki][3] << 8) + hsp.EneX[ene],
        (hsp.DatEne[ki][4] << 8) + hsp.EneY[ene],
        (hsp.DatEne[ki][5] << 8) + hsp.EneX[ene],
        (hsp.DatEne[ki][6] << 8) + hsp.EneY[ene],
        hsp.PlyShtX[j] - 1280,
        hsp.PlyShtY[j] - 2560,
        hsp.PlyShtX[j] + 1280,
        hsp.PlyShtY[j] + 2560,
      ];
      hsp.stg_clash();
      if (hsp.r == 1) {
        hsp.Score += 10;
        hsp.PlyShtFlg[j] = 0;
        hsp.EneShield[ene]--;
        let x = hsp.rnd(2560); x -= 1280;
        let y = hsp.rnd(2560); y -= 1280;
        hsp.prm = [1, hsp.PlyShtX[j] + x, hsp.PlyShtY[j] + y, 0];
        hsp.AprEff();
        if (hsp.EneShield[ene] == 0) {
          hsp.EneFlg[ene] = 0;
          for (let k = 0; k < 5; k++) {
            let x = hsp.rnd(hsp.DatEne[ki][1] << 8); x -= hsp.DatEne[ki][1] << 7;
            let y = hsp.rnd(hsp.DatEne[ki][2] << 8); y -= hsp.DatEne[ki][2] << 7;
            hsp.prm = [0, hsp.EneX[ene] + x, hsp.EneY[ene] + y, -k * 3];
            hsp.AprEff();
          }
          break;
        }
      }
    }

    if (hsp.PlyHitCnt != 0) {
      continue;
    }

    hsp.prm = [
      (hsp.DatEne[ki][3] << 8) + hsp.EneX[ene],
      (hsp.DatEne[ki][4] << 8) + hsp.EneY[ene],
      (hsp.DatEne[ki][5] << 8) + hsp.EneX[ene],
      (hsp.DatEne[ki][6] << 8) + hsp.EneY[ene],
      hsp.PlyX - 1280,
      hsp.PlyY - 1280,
      hsp.PlyX + 1280,
      hsp.PlyY + 1280,
    ];
    hsp.stg_clash();
    if (hsp.r == 1) {
      hsp.EneFlg[ene] = 0;
      for (let j = 0; j < 2; j++) {
        let x = hsp.rnd(2560); x -= 1280;
        let y = hsp.rnd(2560); y -= 1280;
        hsp.prm = [1, hsp.EneX[ene] + x, hsp.EneY[ene] + y, -j * 3];
        hsp.AprEff();
      }
      for (let j = 0; j < 3; j++) {
        let x = hsp.rnd(hsp.DatEne[ki][1] << 8); x -= hsp.DatEne[ki][1] << 7;
        let y = hsp.rnd(hsp.DatEne[ki][2] << 8); y -= hsp.DatEne[ki][2] << 7;
        hsp.prm = [0, hsp.EneX[ene] + x, hsp.EneY[ene] + y, -j * 3];
        hsp.AprEff();
      }
      hsp.PlyHitCnt = 50;
      hsp.PlyShield--;
      if (hsp.PlyShield == 0) {
        hsp.PlyFlg = 0;
        for (let j = 0; j < 5; j++) {
          let x = hsp.rnd(40); x -= 20;
          let y = hsp.rnd(40); y -= 20;
          hsp.prm = [0, hsp.PlyX + x, hsp.PlyY + y, -j * 3];
          hsp.AprEff();
        }
      }
    }
  }
};

;//////////敵描画//////////
hsp.DrwEne = () => {
  for (let i = 0; i < hsp.MaxEne; i++) {
    if (hsp.EneFlg[i] == 0) {
      continue;
    }
    const ki = hsp.EneKi[i];
    hsp.pos((hsp.EneX[i] >> 8) - Math.floor(hsp.DatEne[ki][1] / 2), (hsp.EneY[i] >> 8) - Math.floor(hsp.DatEne[ki][2] / 2));
    hsp.gcopy(4, hsp.EneCx[i], hsp.DatEne[ki][7], hsp.DatEne[ki][1], hsp.DatEne[ki][2]);
  }
};
