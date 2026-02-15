import { GameObject, ctx, TEX, BOUNDS, STA_PLAY, BOSS_STATE_BATTLE, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_LASER, KEY_SHOT, gameTile } from './game.js';
import { boss, bossParts, enemies, playerShots, setPlayer } from './registry.js';
import { Laser } from './laser.js';
import { spawnExplosion, spawnHitSparks } from './effect.js';

//////////プレーヤークラス//////////
export class Player extends GameObject {
  static DATA = { sx: 80, sy: 80, baseX: 240, normalY: 0, hitY: 80, tex: TEX.PLAYER };
  static HIT = { x1: -10, y1: -10, x2: 10, y2: 10 };
  static SOUND_DESTROY = new Sound([1,,150,.05,.3,.4,4,2,-5,,,,,1,20,.1,,.6,.1]);
  // ショット発射位置テーブル（ラジアン、旧DatShtDir後半6要素）
  static SHT_POS = [184, 200, 174, 210, 166, 218].map(a => -a * Math.PI / 128);
  // レーザー発射方向テーブル（ラジアン、旧DatLsrDir）
  static LSR_DIR = [187, 197, 177, 207, 167, 217, 157, 227].map(a => -a * Math.PI / 128);

  constructor() {
    super(vec2(0, -220), 20); // renderOrder=20
    setPlayer(this);
    this.init();
  }

  // プレーヤー初期化（旧IniPly）
  init() {
    this.alive = true;
    this.shield = 5;
    this.pos.x = 0;
    this.pos.y = -220;
    this.hitCnt = 0;
    this.tilt = 0;
    this.frame = 0;
    this.shotCooldown = 0;
    this.shotLevel = 1;
    this.laserCharge = false;
    this.laserPower = 0;
    this.laserPowerDisplay = 0;
  }

  // プレーヤー移動（旧MovPly）
  update() {
    if (ctx.gameSta !== STA_PLAY) return;

    if (!this.alive) {
      this.laserPower = 0;
      this.updateLaserDisplay();
      return;
    }

    this.updateMovement();
    this.updateShot();
    this.updateLaser();
    this.updateLaserDisplay();
    this.updateHitCounter();

    this.frame++;
  }

  // 入力→移動→傾き→境界制限
  updateMovement() {
    const dx = keyIsDown(KEY_RIGHT) - keyIsDown(KEY_LEFT);
    const dy = keyIsDown(KEY_UP) - keyIsDown(KEY_DOWN);

    if (dx || dy) {
      const r = Math.atan2(dy, dx);
      this.pos.x += Math.cos(r) * 5.5;
      this.pos.y += Math.sin(r) * 5.5;
    }

    // 傾きアニメーション
    if (dx === 0) {
      if (this.tilt < 0) { this.tilt++; }
      if (this.tilt > 0) { this.tilt--; }
    } else {
      this.tilt += dx;
      if (this.tilt < -6) { this.tilt = -6; }
      if (this.tilt > 6) { this.tilt = 6; }
    }

    // はみ出し制限
    if (this.pos.x < -BOUNDS.PLAYER) { this.pos.x = -BOUNDS.PLAYER; }
    if (this.pos.y < -BOUNDS.PLAYER) { this.pos.y = -BOUNDS.PLAYER; }
    if (this.pos.x > BOUNDS.PLAYER) { this.pos.x = BOUNDS.PLAYER; }
    if (this.pos.y > BOUNDS.PLAYER) { this.pos.y = BOUNDS.PLAYER; }
  }

  // ショット発射カウンタ＆生成
  updateShot() {
    if (this.shotCooldown !== 0) {
      this.shotCooldown--;
    } else {
      if (keyIsDown(KEY_SHOT)) {
        this.shotCooldown = 6;
        for (let i = 0; i < this.shotLevel * 2; i++) {
          const posRad = Player.SHT_POS[i];
          const x = Math.cos(posRad) * 40 + this.pos.x;
          const y = Math.sin(posRad) * 40 + this.pos.y;
          new PlayerShot(x, y);
        }
      }
    }
  }

  // レーザーチャージ＆発射
  updateLaser() {
    if (this.laserCharge) {
      if (keyIsDown(KEY_LASER)) {
        if (this.laserPower >= 40) {
          const count = Math.min(Math.floor(this.laserPower / 40), Player.LSR_DIR.length);
          const isBoss = boss.flg === BOSS_STATE_BATTLE;
          const candidates = isBoss ? bossParts : enemies;
          for (let i = 0; i < count; i++) {
            const trg = this.searchTarget(candidates, !isBoss);
            if (trg !== null) { trg.lockOnCount++; }
            const rad = Player.LSR_DIR[i];
            const vx = Math.cos(rad) * 16;
            const vy = Math.sin(rad) * 16;
            new Laser(this.pos.x, this.pos.y + 40, vx, vy, trg);
          }
          this.laserPower = 0;
        }
      } else {
        this.laserPower += (keyIsDown(KEY_SHOT) ? 0.5 : 1.5);
        if (this.laserPower > 320) {
          this.laserPower = 320;
        }
      }
    } else {
      this.laserPower -= 12.5;
      if (this.laserPower < 0) {
        this.laserPower = 0;
      }
    }
  }

  // ロックオンする敵をサーチ（旧SearchTrget）
  // candidates: 候補オブジェクトのリスト
  // useLockOn: trueならロックオン数が少ない候補を優先
  // 戻り値: ターゲットオブジェクト参照（null=なし）
  searchTarget(candidates, useLockOn) {
    let trg = null;
    for (const c of candidates) {
      if (!c.alive) continue;
      if (trg === null) { trg = c; continue; }

      if (useLockOn) {
        if (trg.lockOnCount > c.lockOnCount) { trg = c; continue; }
        if (trg.lockOnCount < c.lockOnCount) { continue; }
      }

      // 距離が近い方を優先
      const trgDist2 = (trg.pos.x - this.pos.x) ** 2 + (trg.pos.y - this.pos.y) ** 2;
      const candDist2 = (c.pos.x - this.pos.x) ** 2 + (c.pos.y - this.pos.y) ** 2;
      if (trgDist2 > candDist2) {
        trg = c;
      }
    }
    return trg;
  }

  // レーザーバー表示値の追従
  updateLaserDisplay() {
    this.laserPowerDisplay = Math.max(this.laserPower, this.laserPowerDisplay - 12.5);
  }

  // 被弾無敵カウンタ
  updateHitCounter() {
    if (this.hitCnt !== 0) {
      this.hitCnt--;
    }
  }

  // プレーヤー描画（旧DrwPly）
  render() {
    if (!this.alive) return;
    const d = Player.DATA;
    const frameX = Math.floor(this.tilt / 2) * d.sx + d.baseX;
    const frameY = (Math.floor(this.hitCnt / 6) % 2 === 0) ? d.normalY : d.hitY;
    const ti = gameTile(frameX, frameY, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }

  destroy() {
    setPlayer(null);
    super.destroy();
  }

  // 被弾処理
  onHit() {
    this.hitCnt = 100;
    this.shield--;
    if (this.shield <= 0) {
      this.alive = false;
      const d = Player.DATA;
      spawnExplosion(this.pos.x, this.pos.y, d.sx, d.sy, 5);
      Player.SOUND_DESTROY.play();
    } else {
      spawnHitSparks(this.pos.x, this.pos.y);
    }
  }

}

//////////プレーヤーショットクラス//////////
export class PlayerShot extends GameObject {
  static DATA = { sx: 20, sy: 40, cx: 560, cy: 0, tex: TEX.PLAYER };
  static HIT = { x1: -10, y1: -20, x2: 10, y2: 20 };
  static SOUND = new Sound([.5,,900,.01,.02,.08,2,1.5,-40,,400,.02]);

  constructor(x, y) {
    super(vec2(x, y), 10);  // renderOrder=10
    playerShots.add(this);
    PlayerShot.SOUND.play();
  }

  update() {
    if (ctx.isPaused()) return;
    this.pos.y += 16;
    if (this.pos.y > 340) {
      this.destroy();
    }
    this.frame++;
  }

  render() {
    const d = PlayerShot.DATA;
    const ti = gameTile(d.cx, d.cy, d.sx, d.sy, d.tex);
    drawTile(this.pos, ti.drawSize, ti);
  }

  destroy() {
    playerShots.delete(this);
    super.destroy();
  }

  // ターゲットに命中
  onHit() {
    ctx.score += 10;
    spawnHitSparks(this.pos.x, this.pos.y);
    this.destroy();
  }
}
