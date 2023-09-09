	goto *ProgramStart

;//////////ソースのインクルード//////////
	#include "stg.as"
	#include "common.as"
	#include "effect.as"
	#include "player.as"
	#include "enemy.as"
	#include "enesht.as"
	#include "boss.as"

;//////////プログラムスタート//////////
*ProgramStart
	chgdisp 2
	gosub *stg_set
	gosub *IniCom
	gosub *IniDatEff
	gosub *IniDatPly
	gosub *IniDatEne
	gosub *IniDatEneSht

;//////////メインループ//////////
*MainLoop
	stick Key,79

	if GameSta=STA_OPENING {
		gsel 7
		picload "title.bmp"
		Stage=0
		Score=0
		GameSta=STA_TITLE
	}

	if GameSta=STA_TITLE {
		if Key&16 : GameSta=STA_INIT
		if Key&128: end
	}

	if GameSta=STA_INIT {
		Stage++
		if Stage<=MaxStage {
			gosub *IniEff
			gosub *IniPly
			gosub *IniEne
			gosub *IniEneSht
			gosub *IniDatBossPrt
			gosub *IniBoss
			Frame=0
			Key=0
			GameSta=STA_PLAY
		}
		else : GameSta=STA_ENDING
	}

	if GameSta=STA_PLAY {
		if Key&128 : GameSta=STA_OPENINIG
		redraw 2
		gsel 7,2
		gosub *MovPly
		gosub *MovPlySht
		if BossFlg=0 {
			gosub *AprEne
			gosub *MovEne
		}
		else : gosub MovBoss
		gosub *MovEneSht
		gosub *MovLsr
		gosub *MovEff
		gmode 1
		gosub *BackGround
		gmode 2
		if BossFlg=0 : gosub *DrwEne : else : gosub *DrwBoss
		gosub *DrwPlySht
		gosub *DrwPly
		gosub *DrwEff
		gosub *DrwEneSht
		gosub *DrwLsr
		gosub *Disp
		Frame+
		redraw 1
		if Key&32 {
			Key=0
			GameSta=STA_PAUSE
			pos 129,142 : gcopy 3,0,234,42,16
		}
	}

	if GameSta=STA_CLEAR {
		PlyY-=1792
		if PlyY<-5120 : GameSta=STA_INIT
	}

	if GameSta=STA_PAUSE {
		if key&32 : GameSta=STA_PLAY
	}
	await 30
	goto *MainLoop

