;//////////ボスパーツ初期化//////////
*IniDatBossPrt
	buffer 5,1000,1000,1
	if stage=1 {
		MaxBossPrt=3
		dim DatBossPrt,10,MaxBossPrt
		;		Shield	,x	,y	,sx	,sy	,HitX1	,HitY1	,HitX2	,HitY2	,Cy	
		DatBossPrt.0.0=	500	,0	,-7	,70	,75	,-25	,-30	,25	,6	,0	: picload "boss00.bmp",1,0,0
		DatBossPrt.0.1=	200	,-40	,0	,20	,112	,-10	,-56	,10	,56	,75	: picload "boss01.bmp",1,0,75
		DatBossPrt.0.2=	200	,40	,0	,20	,112	,-10	,-56	,10	,56	,75
	}
	return

;//////////ボス初期化//////////
*IniBoss
	if stage=1 {
		BossFlg=0
		BossShield=500
		BossX=150<<8
		BossY=-100<<8
		BossFrm=0

		dim BossPrtFlg,MaxBossPrt
		dim BossPrtShield,MaxBossPrt
		dim BossPrtCx,MaxBossPrt
		dim BossLckOn,MaxBossPrt

		repeat MaxBossPrt
			BossPrtFlg.cnt=1
			BossPrtShield.cnt=DatBossPrt.0.cnt
		loop

		BossAprFrm=2450
	}
	return

;//////////ボス移動//////////
*MovBoss
	if BossFlg=2 {
		repeat MaxBossPrt
			BossPrtCx.cnt=DatBossPrt.3.cnt
		loop
		BossFrm++
		if BossFrm\3=0 {
			rnd x,50<<8 : x-=50<<7
			rnd y,50<<8 : y-=50<<7
			prm=0,BossX+x,BossY+y,0
			gosub *AprEff
		}
		rnd x,1024 : x-=512
		rnd y,256 : y-=128
		BossX+=x
		BossY+=y+256
		if BossFrm=50 {
			repeat 3
				a=cnt+1*25
				t=-cnt*2
				repeat 16
					r=cnt*16&255
					prm=0,a*cos.r+BossX,a*sin.r+BossY,t
					gosub *AprEff
				loop
			loop
		}
		if BossFrm=60 : BossFlg=0 : GameSta=STA_CLEAR
	}

	if BossFlg!1 : return

	if stage=1 {
		if BossFrm<200 {
			BossY+=256
		}
		else {
			a=BossFrm-200/128\4

			if (a=0)|(a=3) {
				BossX-=256
			}
			else {
				BossX+=256
			}

			r=BossFrm&255
			BossY+=sin.r

			if (BossFrm-200\128<32)&(BossFrm-200\8=0) {
				if BossPrtFlg.1=1 {
					prm=2,-40<<8+BossX,BossY,r
					gosub *AprEneSht
				}
				if BossPrtFlg.2=1 {
					prm=2,40<<8+BossX,BossY,r
					gosub *AprEneSht
				}
			}
			if (BossFrm-200\128<32)&(BossFrm-200\4=0) {
				if BossFlg=1 {
					prm=BossX,BossY,PlyX,PlyY
					gosub stg_dir
					prm=1,BossX,BossY-5120,r
					gosub *AprEneSht
				}
			}
			if BossFrm-200\32=31 {
				if BossFlg=1 {
					prm=0,-5<<8+BossX,25<<8+BossY,64
					gosub *AprEneSht
					prm=0,5<<8+BossX,25<<8+BossY,64
					gosub *AprEneSht
				}
			}
		}
		BossFrm++
	}

	repeat MaxBossPrt
		prt=cnt
		if BossPrtFlg.prt=0 : continue
		repeat MaxPlySht
			sht=cnt
			if PlyShtFlg.sht=0 : continue
			prm.0=BossX+(DatBossPrt.1.prt<<8)+(DatBossPrt.5.prt<<8),BossY+(DatBossPrt.2.prt<<8)+(DatBossPrt.6.prt<<8)
			prm.2=BossX+(DatBossPrt.1.prt<<8)+(DatBossPrt.7.prt<<8),BossY+(DatBossPrt.2.prt<<8)+(DatBossPrt.8.prt<<8)
			prm.4=PlyShtX.sht-1280,PlyShtY.sht-2560,PlyShtX.sht+1280,PlyShtY.sht+2560
			gosub stg_clash
			if r=1 {
				Score+=10
				PlyShtFlg.sht=0
				BossShield--
				BossPrtShield.prt--
				rnd x,2560 : x-=1280
				rnd y,2560 : y-=1280
				prm=1,PlyShtX.cnt+x,PlyShtY.cnt+y,0
				gosub *AprEff
				if BossShield=0 {
					BossFlg=2
					BossFrm=0
				}
				if BossPrtShield.prt=0 {
					BossPrtFlg.prt=0
					BossPrtCx.prt=DatBossPrt.3.prt
					repeat 5
						rnd x,DatBossPrt.3.prt<<8 : x-=DatBossPrt.3.prt<<7
						rnd y,DatBossPrt.4.prt<<8 : y-=DatBossPrt.4.prt<<7
						prm=0,DatBossPrt.1.prt<<8+BossX+x,DatBossPrt.2.prt<<8+BossY+y,-cnt*3
						gosub *AprEff
					loop
					break
				}
			}
		loop
	loop
	return

;//////////ボス描画//////////
*DrwBoss
	if BossFlg=0 : return
	if stage=1 {
		repeat MaxBossPrt
			prt=cnt
			pos BossX>>8+DatBossPrt.1.prt-(DatBossPrt.3.prt/2),BossY>>8+DatBossPrt.2.prt-(DatBossPrt.4.prt/2)
			gcopy 5,BossPrtCx.prt,DatBossPrt.9.prt,DatBossPrt.3.prt,DatBossPrt.4.prt
		loop
	}
	return

