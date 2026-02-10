hsp.MaxPlySht = 36;
hsp.MaxLsr = 8;

;//////////プレーヤーデータ初期化//////////
hsp.IniDatPly = () => {
  hsp.DatShtDir = [192, 192, 191, 193, 190, 194, 184, 200, 174, 210, 166, 218];
  hsp.DatLsrDir = [187, 197, 177, 207, 167, 217, 157, 227];
};

;//////////プレーヤー初期化//////////
hsp.IniPly = () => {
  hsp.PlyFlg = 1;
  hsp.PlyShield = 5;
  hsp.PlyFrm = 0;
  hsp.PlyX = 150;
  hsp.PlyY = 260;
  hsp.PlyHitCnt = 0;
  hsp.PlyGra = 0;

  hsp.PlyShtFlg = hsp.dim(hsp.MaxPlySht);
  hsp.PlyShtFrm = hsp.dim(hsp.MaxPlySht);
  hsp.PlyShtX = hsp.dim(hsp.MaxPlySht);
  hsp.PlyShtY = hsp.dim(hsp.MaxPlySht);
  hsp.PlyShtDir = hsp.dim(hsp.MaxPlySht);
  hsp.PlyShtCnt = 0;
  hsp.PlyShtLV = 1;

  hsp.LsrFlg = hsp.dim(hsp.MaxLsr);
  hsp.LsrTrg = hsp.dim(hsp.MaxLsr);
  hsp.LsrSta = hsp.dim(hsp.MaxLsr);
  hsp.LsrX = hsp.dim(hsp.MaxLsr, 8);
  hsp.LsrY = hsp.dim(hsp.MaxLsr, 8);
  hsp.LsrVx = hsp.dim(hsp.MaxLsr);
  hsp.LsrVy = hsp.dim(hsp.MaxLsr);
  hsp.LsrDir = hsp.dim(hsp.MaxLsr);
  hsp.LsrF = 0;
  hsp.LsrPow = 0;
};

;//////////プレーヤー移動//////////
hsp.MovPly = () => {
  if (hsp.PlyFlg == 0) {
    hsp.LsrPow = 0;
    return;
  }

  // 移動量＆傾き決定
  hsp.prm = [0, 0, ((hsp.Key & 4) >> 2) - (hsp.Key & 1), ((hsp.Key & 8) >> 3) - ((hsp.Key & 2) >> 1)];
  if (hsp.prm[2] || hsp.prm[3]) {
    hsp.stg_dir();
    hsp.PlyX += Math.cos(hsp.r) * 5.5;
    hsp.PlyY += Math.sin(hsp.r) * 5.5;
  } else {
    hsp.r = hsp.toRad(8);
  }
  if (hsp.prm[2] == 0) {
    if (hsp.PlyGra < 0) { hsp.PlyGra++; }
    if (hsp.PlyGra > 0) { hsp.PlyGra--; }
  } else {
    hsp.PlyGra += hsp.prm[2];
    if (hsp.PlyGra < -6) { hsp.PlyGra = -6; }
    if (hsp.PlyGra > 6) { hsp.PlyGra = 6; }
  }

  // はみ出したときの処理
  if (hsp.PlyX < 20) { hsp.PlyX = 20; }
  if (hsp.PlyY < 20) { hsp.PlyY = 20; }
  if (hsp.PlyX > 280) { hsp.PlyX = 280; }
  if (hsp.PlyY > 280) { hsp.PlyY = 280; }

  // ショット発射
  if (hsp.PlyShtCnt != 0) {
    hsp.PlyShtCnt--;
  } else {
    if (hsp.Key & 32) {
      hsp.PlyShtCnt = 3;
      for (let i = 0; i < hsp.PlyShtLV * 2; i++) {
        for (let j = 0; j < hsp.MaxPlySht; j++) {
          if (hsp.PlyShtFlg[j] != 0) {
            continue;
          }
          hsp.PlyShtFlg[j] = 1;
          hsp.PlyShtFrm[j] = 0;
          let rad = hsp.toRad(hsp.DatShtDir[i + 6]);
          hsp.PlyShtX[j] = Math.cos(rad) * 20 + hsp.PlyX;
          hsp.PlyShtY[j] = Math.sin(rad) * 20 + hsp.PlyY;
          hsp.PlyShtDir[j] = hsp.toRad(hsp.DatShtDir[i]);
          break;
        }
      }
    }
  }

  // レーザー発射
  if (hsp.LsrF == 1) {
    if (hsp.Key & 16) {
      if (hsp.LsrPow >= 40) {
        for (let i = 0; i < Math.floor(hsp.LsrPow / 40); i++) {
          const lsr = i;
          if (hsp.LsrFlg[lsr] != 0) {
            continue;
          }
          hsp.LsrFlg[lsr] = 1;
          hsp.SearchTrget();
          if (hsp.trg != -1) {
            hsp.LsrTrg[lsr] = hsp.trg;
            hsp.LsrSta[lsr] = 1;
            if (hsp.BossFlg == 0) {
              hsp.EneLckOn[hsp.trg]++;
            } else {
              hsp.BossLckOn[hsp.trg]++;
            }
          } else {
            hsp.LsrSta[lsr] = 1;
          }
          for (let j = 0; j < 8; j++) {
            hsp.LsrX[lsr][j] = hsp.PlyX;
            hsp.LsrY[lsr][j] = hsp.PlyY - 20;
          }
          let rad = hsp.toRad(hsp.DatLsrDir[lsr]);
          hsp.LsrVx[lsr] = Math.cos(rad) * 16;
          hsp.LsrVy[lsr] = Math.sin(rad) * 16;
          hsp.LsrDir[lsr] = hsp.toRad(192);
        }
      }
    } else {
      hsp.LsrPow += (hsp.Key & 32 ? 1 : 3);
      if (hsp.LsrPow > 320) {
        hsp.LsrPow = 320;
      }
    }
  } else {
    hsp.LsrPow -= 25;
    if (hsp.LsrPow < 0) {
      hsp.LsrPow = 0;
    };
  }

  if (hsp.PlyHitCnt != 0) {
    hsp.PlyHitCnt--;
  }

  hsp.PlyFrm++;
};

;//////////ロックオンする敵をサーチ//////////
hsp.SearchTrget = () => {
  hsp.trg = -1;
  if (hsp.BossFlg != 1) {
    for (let i = 0; i < hsp.MaxEne; i++) {
      if (hsp.EneFlg[i] == 0) {
        continue;
      }
      if (hsp.trg == -1) {
        hsp.trg = i;
        continue;
      }
      if (hsp.EneLckOn[hsp.trg] > hsp.EneLckOn[i]) {
        hsp.trg = i;
        continue;
      }
      if (hsp.EneLckOn[hsp.trg] < hsp.EneLckOn[i]) {
        continue;
      }
      let x = hsp.EneX[hsp.trg] - hsp.PlyX; x = x * x;
      let y = hsp.EneY[hsp.trg] - hsp.PlyY; y = y * y;
      let r = x + y;
      x = hsp.EneX[i] - hsp.PlyX; x = x * x;
      y = hsp.EneY[i] - hsp.PlyY; y = y * y;
      if (r > x + y) {
        hsp.trg = i;
      }
    }
  } else {
    for (let i = 0; i < hsp.MaxBossPrt; i++) {
      if (hsp.BossPrtFlg[i] == 0) {
        continue;
      }
      if (hsp.trg == -1) {
        hsp.trg = i;
        continue;
      }
      // 以下のコメントを解除するとレーザーがボスの各パーツに分散する
      // if (hsp.BossLckOn[hsp.trg] > hsp.BossLckOn[i]) {
      //   hsp.trg = i;
      //   continue;
      // }
      // if (hsp.BossLckOn[hsp.trg] < hsp.BossLckOn[i]) {
      //   continue;
      // }
      let x = hsp.BossX + hsp.DatBossPrt[hsp.trg][1] - hsp.PlyX; x = x * x;
      let y = hsp.BossY + hsp.DatBossPrt[hsp.trg][2] - hsp.PlyY; y = y * y;
      hsp.r = x + y;
      x = hsp.BossX + hsp.DatBossPrt[i][1] - hsp.PlyX; x = x * x;
      y = hsp.BossY + hsp.DatBossPrt[i][2] - hsp.PlyY; y = y * y;
      if (hsp.r > x + y) {
        hsp.trg = i;
      }
    }
  }
};

;//////////プレーヤー描画//////////
hsp.DrwPly = () => {
  if (hsp.PlyFlg == 0) {
    return;
  }
  hsp.pos(Math.floor(hsp.PlyX) - 20, Math.floor(hsp.PlyY) - 20);
  if (Math.floor(hsp.PlyHitCnt / 3) % 2 == 0) {
    hsp.gcopy(3, (hsp.PlyGra >> 1) * 40 + 120, 0, 40, 40);
  } else {
    hsp.gcopy(3, (hsp.PlyGra >> 1) * 40 + 120, 40, 40, 40);
  }
};

;//////////プレーヤーショット移動//////////
hsp.MovPlySht = () => {
  for (let i = 0; i < hsp.MaxPlySht; i++) {
    if (hsp.PlyShtFlg[i] == 0) {
      continue;
    }
    hsp.r = hsp.PlyShtDir[i];
    hsp.PlyShtX[i] += 16 * Math.cos(hsp.r);
    hsp.PlyShtY[i] += 16 * Math.sin(hsp.r);
    if (hsp.PlyShtY[i] < -20) {
      hsp.PlyShtFlg[i] = 0;
    }
  }
}

;//////////プレーヤーショット描画//////////
hsp.DrwPlySht = () => {
  for (let i = 0; i < hsp.MaxPlySht; i++) {
    const sht = hsp.MaxPlySht - i - 1;
    if (hsp.PlyShtFlg[sht] == 0) {
      continue;
    }
    hsp.pos(Math.floor(hsp.PlyShtX[sht]) - 5, Math.floor(hsp.PlyShtY[sht]) - 10);
    hsp.gcopy(3, 280, 0, 10, 20);
  }
}

;//////////レーザー移動//////////
hsp.MovLsr = () => {
  if (hsp.LsrPow == 0) {
    hsp.LsrF = 1;
  }

  for (let i = 0; i < hsp.MaxLsr; i++) {
    const lsr = i;
    if (hsp.LsrFlg[lsr] == 0) {
      continue;
    }
    for (let j = 0; j < 7; j++) {
      const a = 7 - j;
      const b = a - 1;
      hsp.LsrX[lsr][a] = hsp.LsrX[lsr][b];
      hsp.LsrY[lsr][a] = hsp.LsrY[lsr][b];
    }

    hsp.r = hsp.LsrDir[lsr];

    if (hsp.LsrSta[lsr] != 0) {
      hsp.LsrVx[lsr] += Math.cos(hsp.r) * 5;
      hsp.LsrVy[lsr] += Math.sin(hsp.r) * 5;
      hsp.LsrX[lsr][0] += hsp.LsrVx[lsr];
      hsp.LsrY[lsr][0] += hsp.LsrVy[lsr];
      hsp.LsrVx[lsr] = hsp.LsrVx[lsr] * 0.8;
      hsp.LsrVy[lsr] = hsp.LsrVy[lsr] * 0.8;
    } else {
      hsp.r = 0;
      for (let j = 0; j < 7; j++) {
        const a = j;
        const b = a + 1;
        if (hsp.LsrX[lsr][a] === hsp.LsrX[lsr][b] && hsp.LsrY[lsr][a] == hsp.LsrY[lsr][b]) {
          continue;
        }
        hsp.r = 1;
      }
      if (hsp.r == 0) {
        hsp.LsrFlg[lsr] = 0;
      }
    }

    if (hsp.BossFlg != 1) {
      let ene = hsp.LsrTrg[lsr];
      if ((hsp.LsrSta[lsr] == 1 && hsp.EneFlg[ene] == 0) || hsp.LsrSta[lsr] == 2) {
        hsp.prm = [hsp.LsrX[lsr][0], hsp.LsrY[lsr][0]];
        hsp.SearchTrget();
        if (hsp.trg != -1) {
          hsp.LsrSta[lsr] = 1;
          hsp.LsrTrg[lsr] = hsp.trg;
          hsp.EneLckOn[hsp.trg]++;
          ene = hsp.trg;
        } else {
          hsp.LsrSta[lsr] = 2;
        }
      }

      if (hsp.LsrSta[lsr] == 1) {
        const ki = hsp.EneKi[ene];
        hsp.prm = [lsr, ki, ene];
        hsp.LsrHit();
        if (hsp.r == 1) {
          hsp.Score += 100;
          hsp.EneShield[ene] -= 5;
          hsp.EneLckOn[ene]--;
          hsp.LsrSta[lsr] = 0;
          for (let j = 0; j < 2; j++) {
            let x = hsp.rnd(10) - 5;
            let y = hsp.rnd(10) - 5;
            hsp.prm = [1, hsp.LsrX[lsr][0] + x, hsp.LsrY[lsr][0] + y, -j * 3];
            hsp.AprEff();
          }
          if (hsp.EneShield[ene] <= 0) {
            hsp.EneFlg[ene] = 0;
            for (let j = 0; j < 3; j++) {
              let x = hsp.rnd(hsp.DatEne[ki][1]) - hsp.DatEne[ki][1] / 2;
              let y = hsp.rnd(hsp.DatEne[ki][2]) - hsp.DatEne[ki][2] / 2;
              hsp.prm = [0, hsp.EneX[ene] + x, hsp.EneY[ene] + y, -j * 3];
              hsp.AprEff();
            }
          }
        }
        hsp.prm = [hsp.LsrX[lsr][0], hsp.LsrY[lsr][0], hsp.EneX[ene], hsp.EneY[ene]];
        hsp.stg_dir();
        hsp.LsrDir[lsr] = hsp.r;
      }
    } else {
      let prt = hsp.LsrTrg[lsr];
      if ((hsp.LsrSta[lsr] == 1 && hsp.BossPrtFlg[prt] == 0) || hsp.LsrSta[lsr] == 2) {
        hsp.prm = [hsp.LsrX[lsr][0], hsp.LsrY[lsr][0]];
        hsp.SearchTrget();
        if (hsp.trg != -1) {
          hsp.LsrSta[lsr] = 1;
          hsp.LsrTrg[lsr] = hsp.trg;
          hsp.BossLckOn[hsp.trg]++;
          prt = hsp.trg;
        } else {
          hsp.LsrSta[lsr] = 2;
        }
      }

      if (hsp.LsrSta[lsr] == 1) {
        hsp.prm = [lsr, prt];
        hsp.LsrHit();
        if (hsp.r == 1) {
          hsp.Score += 100;
          hsp.BossShield -= 5;
          hsp.BossPrtShield[prt] -= 5;
          hsp.BossLckOn[prt]--;
          // ;BossPrtCx.prt=DatBossPrt.3.prt
          hsp.LsrSta[lsr] = 0;
          for (let j = 0; j < 2; j++) {
            let x = hsp.rnd(10) - 5;
            let y = hsp.rnd(10) - 5;
            hsp.prm = [1, hsp.LsrX[lsr][0] + x, hsp.LsrY[lsr][0] + y, -j * 3];
            hsp.AprEff();
          }
          if (hsp.BossShield <= 0) {
            hsp.BossShield = 0;
            hsp.BossFlg = 2;
            hsp.BossFrm = 0;
          }
          if (hsp.BossPrtShield[prt] <= 0) {
            hsp.BossPrtFlg[prt] = 0;
            hsp.BossPrtCx[prt] = hsp.DatBossPrt[prt][3];
            for (let j = 0; j < 3; j++) {
              let x = hsp.rnd(hsp.DatBossPrt[prt][3]) - hsp.DatBossPrt[prt][3] / 2;
              let y = hsp.rnd(hsp.DatBossPrt[prt][4]) - hsp.DatBossPrt[prt][4] / 2;
              hsp.prm = [0, hsp.DatBossPrt[prt][1] + hsp.BossX + x, hsp.DatBossPrt[prt][2] + hsp.BossY + y, -j * 3];
              hsp.AprEff();
            }
          }
        }
        hsp.prm = [hsp.LsrX[lsr][0], hsp.LsrY[lsr][0], hsp.DatBossPrt[prt][1] + hsp.BossX, hsp.DatBossPrt[prt][2] + hsp.BossY];
        hsp.stg_dir();
        hsp.LsrDir[lsr] = hsp.r;
      }
    }
    if (hsp.LsrSta[lsr] == 2) {
      if (hsp.LsrX[lsr][0] < 0 || 300 < hsp.LsrX[lsr][0] || hsp.LsrY[lsr][0] < 0 || 300 < hsp.LsrY[lsr][0]) {
        hsp.LsrSta[lsr] = 0;
      }
    }
    if (hsp.LsrFlg[lsr] != 0) {
      hsp.LsrF = 0;
    }
  }
};

hsp.LsrHit = () => {
  hsp.r = 0;
  if (hsp.BossFlg == 0) {
    const lsr = hsp.prm[0];
    const ki = hsp.prm[1];
    const ene = hsp.prm[2];
    if (hsp.LsrX[lsr][0] < (hsp.DatEne[ki][3] + hsp.EneX[ene]) || (hsp.DatEne[ki][5] + hsp.EneX[ene]) < hsp.LsrX[lsr][0]) {
      return;
    }
    if (hsp.LsrY[lsr][0] < (hsp.DatEne[ki][4] + hsp.EneY[ene]) || (hsp.DatEne[ki][6] + hsp.EneY[ene]) < hsp.LsrY[lsr][0]) {
      return;
    }
  } else {
    const lsr = hsp.prm[0];
    const prt = hsp.prm[1];
    if (hsp.LsrX[lsr][0] < ((hsp.DatBossPrt[prt][1] + hsp.DatBossPrt[prt][5]) + hsp.BossX) || ((hsp.DatBossPrt[prt][1] + hsp.DatBossPrt[prt][7]) + hsp.BossX) < hsp.LsrX[lsr][0]) {
      return;
    }
    if (hsp.LsrY[lsr][0] < ((hsp.DatBossPrt[prt][2] + hsp.DatBossPrt[prt][6]) + hsp.BossY) || ((hsp.DatBossPrt[prt][2] + hsp.DatBossPrt[prt][8]) + hsp.BossY) < hsp.LsrY[lsr][0]) {
      return;
    }
  }
  hsp.r = 1;
};

;//////////レーザー描画//////////
hsp.DrwLsr = () => {
  for (let i = 0; i < hsp.MaxLsr; i++) {
    if (hsp.LsrFlg[i] == 0) {
      continue;
    }
    for (let j = 0; j < 7; j++) {
      hsp.color(50, 255 - (j * 20), 160 - (j * 20));
      let a = j;
      let b = j + 1;
      let ax = Math.floor(hsp.LsrX[i][a]), ay = Math.floor(hsp.LsrY[i][a]);
      let bx = Math.floor(hsp.LsrX[i][b]), by = Math.floor(hsp.LsrY[i][b]);
      hsp.line(ax, ay, bx, by);
      hsp.line(ax + 1, ay, bx + 1, by);
      hsp.line(ax - 1, ay, bx - 1, by);
      hsp.line(ax, ay + 1, bx, by + 1);
      hsp.line(ax, ay - 1, bx, by - 1);
    }
  }
};
