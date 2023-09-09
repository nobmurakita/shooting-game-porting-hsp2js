;//////////プログラムスタート//////////
hsp.ProgramStart = async () => {
  await hsp.preload('img/title.png');
  await hsp.preload('img/player.png');
  await hsp.preload('img/effect.png');
  await hsp.preload('img/enesht.png');
  await hsp.preload('img/etc.png');
  await hsp.preload('img/enemy00.png');
  await hsp.preload('img/enemy01.png');
  await hsp.preload('img/enemy02.png');
  await hsp.preload('img/enemy03.png');
  await hsp.preload('img/enemy04.png');
  await hsp.preload('img/enemy05.png');
  await hsp.preload('img/enemy06.png');
  await hsp.preload('img/enemy07.png');
  await hsp.preload('img/enemy08.png');
  await hsp.preload('img/enemy09.png');
  await hsp.preload('img/boss00.png');
  await hsp.preload('img/boss01.png');

  hsp.stg_set();
  hsp.IniCom();
  hsp.IniDatEff();
  hsp.IniDatPly();
  hsp.IniDatEne();
  hsp.IniDatEneSht();

  hsp.MainLoop();
};

;//////////メインループ//////////
hsp.MainLoop = () => {
  const t = new Date().getTime();
  hsp.Key = hsp.stick();

  if (hsp.GameSta == hsp.STA_OPENING) {
    hsp.gsel(7);
    hsp.picload('img/title.png', 0, 0);
    hsp.Stage = 0;
    hsp.Score = 0;
    hsp.GameSta = hsp.STA_TITLE;
  }

  if (hsp.GameSta == hsp.STA_TITLE) {
    if (hsp.Key & 16 || hsp.Key & 64) {
      hsp.GameSta = hsp.STA_INIT;
    }
    if (hsp.Key & 128) {
      // end
    }
  }

  if (hsp.GameSta == hsp.STA_INIT) {
    hsp.Stage++
    if (hsp.Stage <= hsp.MaxStage) {
      hsp.IniEff();
      hsp.IniPly();
      hsp.IniEne();
      hsp.IniEneSht();
      hsp.IniDatBossPrt();
      hsp.IniBoss();
      hsp.Frame = 0;
      hsp.Key = 0;
      hsp.GameSta = hsp.STA_PLAY;
    } else {
      hsp.GameSta = hsp.STA_ENDING;
    }
  }

  if (hsp.GameSta == hsp.STA_PLAY) {
    if (hsp.Key & 128) {
      hsp.GameSta = hsp.STA_OPENING;
    }
    // redraw 2 ; 再描画OFF
    hsp.gsel(7);
    hsp.MovPly();
    hsp.MovPlySht();
    if (hsp.BossFlg == 0) {
      hsp.AprEne();
      hsp.MovEne();
    } else {
      hsp.MovBoss();
    }
    hsp.MovEneSht();
    hsp.MovLsr();
    hsp.MovEff();
    hsp.BackGround();
    if (hsp.BossFlg == 0) {
      hsp.DrwEne();
    } else {
      hsp.DrwBoss();
    }
    hsp.DrwPlySht();
    hsp.DrwPly();
    hsp.DrwEff();
    hsp.DrwEneSht();
    hsp.DrwLsr();
    hsp.Disp();
    hsp.Frame++
    // redraw 1 ; 再描画ON
    if (hsp.Key & 32) {
      hsp.Key = 0;
      hsp.GameSta = hsp.STA_PAUSE;
      hsp.pos(129, 142);
      hsp.gcopy(3, 0, 234, 42, 16);
    }
  }

  if (hsp.GameSta == hsp.STA_CLEAR) {
    hsp.PlyY -= 1792;
    if (hsp.PlyY < -5120) {
      hsp.GameSta = hsp.STA_INIT;
    }
  }

  if (hsp.GameSta == hsp.STA_PAUSE) {
    if (hsp.Key & 32) {
      hsp.GameSta = hsp.STA_PLAY;
    }
  }

  const w = Math.max(30 - (new Date().getTime() - t), 0);
  setTimeout(hsp.MainLoop, w);
};

hsp.ProgramStart();