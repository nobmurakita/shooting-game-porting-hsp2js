hsp.MaxDatEff = 3;
hsp.MaxEff = 70;

;//////////エフェクトデータ初期化//////////
hsp.IniDatEff = () => {
  hsp.DatEff = [
    // sx, sy, cy
    [40, 40, 80],
    [10, 10, 120],
    [10, 10, 120],
  ];
};

;//////////エフェクト初期化//////////
hsp.IniEff = () => {
  hsp.EffFlg = hsp.dim(hsp.MaxEff);
  hsp.EffKi = hsp.dim(hsp.MaxEff);
  hsp.EffX = hsp.dim(hsp.MaxEff);
  hsp.EffY = hsp.dim(hsp.MaxEff);
  hsp.EffFrm = hsp.dim(hsp.MaxEff);
  hsp.EffCx = hsp.dim(hsp.MaxEff);
};

;//////////エフェクト発生//////////
hsp.AprEff = () => {
  for (let i = 0; i < hsp.MaxEff; i++) {
    if (hsp.EffFlg[i] != 0) {
      continue;
    }
    hsp.EffFlg[i] = 1;
    hsp.EffKi[i] = hsp.prm[0];
    hsp.EffX[i] = hsp.prm[1];
    hsp.EffY[i] = hsp.prm[2];
    hsp.EffFrm[i] = hsp.prm[3];
    break;
  }
};

;//////////エフェクト移動//////////
hsp.MovEff = () => {
  for (let i = 0; i < hsp.MaxEff; i++) {
    if (hsp.EffFlg[i] == 0) {
      continue;
    }
    hsp.EffFrm[i]++;
    if (hsp.EffFrm[i] <= 0) {
      continue;
    }
    const ki = hsp.EffKi[i];

    if (ki == 0) {
      if (hsp.EffFrm[i] >= 8) {
        hsp.EffY[i] += 1792;
      }
      hsp.EffCx[i] = Math.floor(hsp.EffFrm[i] / 3) % 6 * 40;
      if (hsp.EffFrm[i] == 17) {
        hsp.EffFlg[i] = 0;
      }
    }

    if (ki == 1) {
      hsp.EffCx[i] = Math.floor(hsp.EffFrm[i] / 3) % 6 * 10 + 60;
      if (hsp.EffFrm[i] == 17) {
        hsp.EffFlg[i] = 0;
      }
    }

    if (ki == 2) {
      hsp.EffCx[i] = Math.floor(hsp.EffFrm[i] / 3) % 6 * 10;
      if (hsp.EffFrm[i] == 17) {
        hsp.EffFlg[i] = 0;
      }
    }
  }
};

;//////////エフェクト描画//////////
hsp.DrwEff = () => {
  for (let i = 0; i < hsp.MaxEff; i++) {
    const eff = hsp.MaxEff - 1 - i;
    if (hsp.EffFlg[eff] == 0 || hsp.EffFrm[eff] <= 0) {
      continue;
    }
    const ki = hsp.EffKi[eff];
    hsp.pos((hsp.EffX[eff] >> 8) - Math.floor(hsp.DatEff[ki][0] / 2), (hsp.EffY[eff] >> 8) - Math.floor(hsp.DatEff[ki][1] / 2));
    hsp.gcopy(3, hsp.EffCx[eff], hsp.DatEff[ki][2], hsp.DatEff[ki][0], hsp.DatEff[ki][1]);
  }
};
