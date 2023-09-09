hsp.MaxBossPrt = 3;

;//////////ボスパーツ初期化//////////
hsp.IniDatBossPrt = () => {
  hsp.buffer(5, 1000, 1000);
  if (hsp.Stage == 1) {
    hsp.picload('img/boss00.png', 0, 0);
    hsp.picload('img/boss01.png', 0, 75);

    hsp.DatBossPrt = [
      // Shield, x, y, sx, sy, HitX1, HitY1, HitX2, HitY2, Cy
      [500, 0, -7, 70, 75, -25, -30, 25, 6, 0],
      [200, -40, 0, 20, 112, -10, -56, 10, 56, 75],
      [200, 40, 0, 20, 112, -10, -56, 10, 56, 75],
    ];
  }
};

;//////////ボス初期化//////////
hsp.IniBoss = () => {
  if (hsp.Stage == 1) {
    hsp.BossFlg = 0;
    hsp.BossShield = 500;
    hsp.BossX = 150 << 8;
    hsp.BossY = -100 << 8;
    hsp.BossFrm = 0;

    hsp.BossPrtFlg = hsp.dim(hsp.MaxBossPrt);
    hsp.BossPrtShield = hsp.dim(hsp.MaxBossPrt);
    hsp.BossPrtCx = hsp.dim(hsp.MaxBossPrt);
    hsp.BossLckOn = hsp.dim(hsp.MaxBossPrt);

    for (let i = 0; i < hsp.MaxBossPrt; i++) {
      hsp.BossPrtFlg[i] = 1;
      hsp.BossPrtShield[i] = hsp.DatBossPrt[i][0];
    }

    hsp.BossAprFrm = 2450;
  }
};

;//////////ボス移動//////////
hsp.MovBoss = () => {
  if (hsp.BossFlg == 2) {
    for (let i = 0; i < hsp.MaxBossPrt; i++) {
      hsp.BossPrtCx[i] = hsp.DatBossPrt[i][3];
    }
    hsp.BossFrm++;
    if (hsp.BossFrm % 3 == 0) {
      let x = hsp.rnd(50) << 8; x -= 50 << 7;
      let y = hsp.rnd(50) << 8; y -= 50 << 7;
      hsp.prm = [0, hsp.BossX + x, hsp.BossY + y, 0];
      hsp.AprEff();
    }
    let x = hsp.rnd(1024); x -= 512;
    let y = hsp.rnd(256); y -= 128;
    hsp.BossX += x;
    hsp.BossY += y + 256;
    if (hsp.BossFrm == 50) {
      for (let i = 0; i < 3; i++) {
        let a = i + 1 * 25;
        let t = -i * 2;
        for (let j = 0; j < 16; j++) {
          hsp.r = i * 16 & 255;
          hsp.prm = [0, a * hsp.cos[hsp.r] + hsp.BossX, a * hsp.sin[hsp.r] + hsp.BossY, t];
          hsp.AprEff();
        }
      }
    }
    if (hsp.BossFrm == 60) {
      hsp.BossFlg = 0;
      hsp.GameSta = hsp.STA_CLEAR;
    }
  }

  if (hsp.BossFlg != 1) {
    return;
  }

  if (hsp.Stage == 1) {
    if (hsp.BossFrm < 200) {
      hsp.BossY += 256;
    } else {
      let a = Math.floor((hsp.BossFrm - 200) / 128) % 4;

      if (a == 0 || a == 3) {
        hsp.BossX -= 256;
      } else {
        hsp.BossX += 256;
      }

      hsp.r = hsp.BossFrm & 255;
      hsp.BossY += hsp.sin[hsp.r];

      if ((hsp.BossFrm - 200) % 128 < 32 && (hsp.BossFrm - 200) % 8 == 0) {
        if (hsp.BossPrtFlg[1] == 1) {
          hsp.prm = [2, (-40 << 8) + hsp.BossX, hsp.BossY, hsp.r];
          hsp.AprEneSht();
        }
        if (hsp.BossPrtFlg[2] == 1) {
          hsp.prm = [2, (40 << 8) + hsp.BossX, hsp.BossY, hsp.r];
          hsp.AprEneSht();
        }
      }
      if ((hsp.BossFrm - 200) % 128 < 32 && (hsp.BossFrm - 200) % 4 == 0) {
        if (hsp.BossFlg == 1) {
          hsp.prm = [hsp.BossX, hsp.BossY, hsp.PlyX, hsp.PlyY];
          hsp.stg_dir();
          hsp.prm = [1, hsp.BossX, hsp.BossY - 5120, hsp.r];
          hsp.AprEneSht();
        }
      }
      if (hsp.BossFrm - 200 % 32 == 31) {
        if (hsp.BossFlg == 1) {
          hsp.prm = [0, (-5 << 8) + hsp.BossX, (25 << 8) + hsp.BossY, 64];
          hsp.AprEneSht();
          hsp.prm = [0, (5 << 8) + hsp.BossX, (25 << 8) + hsp.BossY, 64];
          hsp.AprEneSht();
        }
      }
    }
    hsp.BossFrm++;
  }

  for (let i = 0; i < hsp.MaxBossPrt; i++) {
    const prt = i;
    if (hsp.BossPrtFlg[prt] == 0) {
      continue;
    }
    for (let j = 0; j < hsp.MaxPlySht; j++) {
      const sht = j;
      if (hsp.PlyShtFlg[sht] == 0) {
        continue;
      }
      hsp.prm = [
        hsp.BossX + (hsp.DatBossPrt[prt][1] << 8) + (hsp.DatBossPrt[prt][5] << 8),
        hsp.BossY + (hsp.DatBossPrt[prt][2] << 8) + (hsp.DatBossPrt[prt][6] << 8),
        hsp.BossX + (hsp.DatBossPrt[prt][1] << 8) + (hsp.DatBossPrt[prt][7] << 8),
        hsp.BossY + (hsp.DatBossPrt[prt][2] << 8) + (hsp.DatBossPrt[prt][8] << 8),
        hsp.PlyShtX[sht] - 1280,
        hsp.PlyShtY[sht] - 2560,
        hsp.PlyShtX[sht] + 1280,
        hsp.PlyShtY[sht] + 2560,
      ];
      hsp.stg_clash();
      if (hsp.r == 1) {
        hsp.Score += 10;
        hsp.PlyShtFlg[sht] = 0;
        hsp.BossShield--;
        hsp.BossPrtShield[prt]--;
        let x = hsp.rnd(2560); x -= 1280;
        let y = hsp.rnd(2560); y -= 1280;
        hsp.prm = [1, hsp.PlyShtX[j] + x, hsp.PlyShtY[j] + y, 0];
        hsp.AprEff();
        if (hsp.BossShield == 0) {
          hsp.BossFlg = 2;
          hsp.BossFrm = 0;
        }
        if (hsp.BossPrtShield[prt] == 0) {
          hsp.BossPrtFlg[prt] = 0;
          hsp.BossPrtCx[prt] = hsp.DatBossPrt[prt][3];
          for (let k = 0; k < 5; k++) {
            let x = hsp.rnd(hsp.DatBossPrt[prt][3]) << 8; x -= hsp.DatBossPrt[prt][3] << 7;
            let y = hsp.rnd(hsp.DatBossPrt[prt][4]) << 8; y -= hsp.DatBossPrt[prt][4] << 7;
            hsp.prm = [0, (hsp.DatBossPrt[prt][1] << 8) + hsp.BossX + x, (hsp.DatBossPrt[prt][2] << 8) + hsp.BossY + y, -k * 3];
            hsp.AprEff();
          }
          break;
        }
      }
    }
  }
};

;//////////ボス描画//////////
hsp.DrwBoss = () => {
  if (hsp.BossFlg == 0) {
    return;
  }
  if (hsp.Stage == 1) {
    for (let i = 0; i < hsp.MaxBossPrt; i++) {
      const prt = i;
      hsp.pos((hsp.BossX >> 8) + hsp.DatBossPrt[prt][1] - Math.floor(hsp.DatBossPrt[prt][3] / 2), (hsp.BossY >> 8) + hsp.DatBossPrt[prt][2] - Math.floor(hsp.DatBossPrt[prt][4] / 2));
      hsp.gcopy(5, hsp.BossPrtCx[prt], hsp.DatBossPrt[prt][9], hsp.DatBossPrt[prt][3], hsp.DatBossPrt[prt][4]);
    }
  }
};
