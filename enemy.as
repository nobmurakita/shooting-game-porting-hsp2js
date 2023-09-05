;//////////敵データ初期化//////////
*IniDatEne
	buffer 4,2000,2000,1
	dim DatEne,8,10

;			Shield	,sx	,sy	,HitX1	,HitY1	,HitX2	,HitY2	,Cy	
	DatEne.0.0=	2	,20	,40	,-5	,-15	,5	,15	,0	: picload "enemy00.bmp",1,0,0
	DatEne.0.1=	2	,40	,40	,-10	,-10	,10	,10	,40	: picload "enemy01.bmp",1,0,40
	DatEne.0.2=	4	,40	,40	,-15	,-15	,15	,15	,80	: picload "enemy02.bmp",1,0,80
	DatEne.0.3=	4	,40	,60	,-20	,-20	,20	,20	,120	: picload "enemy03.bmp",1,0,120
	DatEne.0.4=	40	,120	,60	,-50	,-10	,50	,15	,180	: picload "enemy04.bmp",1,0,180
	DatEne.0.5=	3	,40	,40	,-15	,-15	,15	,15	,240	: picload "enemy05.bmp",1,0,240
	DatEne.0.6=	4	,40	,50	,-15	,-10	,15	,10	,280	: picload "enemy06.bmp",1,0,280
	DatEne.0.7=	2	,40	,60	,-15	,-25	,15	,25	,330	: picload "enemy07.bmp",1,0,330
	DatEne.0.8=	4	,40	,40	,-15	,-15	,15	,15	,390	: picload "enemy08.bmp",1,0,390
	DatEne.0.9=	40	,60	,60	,-25	,-25	,25	,25	,430	: picload "enemy09.bmp",1,0,430
	return

;//////////敵初期化//////////
*IniEne
	if stage=1 : MaxEneTable=150
	dim EneTable,5,MaxEneTable
	bload "stage"+stage+".dat",EneTable
	TableIndex=0

	MaxEne=10
	dim EneFlg,MaxEne
	dim EneShield,MaxEne
	dim EneFrm,MaxEne
	dim EneKi,MaxEne
	dim EneMv,MaxEne
	dim EneX0,MaxEne
	dim EneY0,MaxEne
	dim EneX,MaxEne
	dim EneY,MaxEne
	dim EneCx,MaxEne
	dim EneCy,MaxEne
	dim EneTmp,8,MaxEne
	dim EneLckOn,MaxEne

	return

;//////////敵発生//////////
*AprEne
	if BossAprFrm=Frame : BossFlg=1
	if TableIndex=MaxEneTable : return
	if EneTable.0.TableIndex=Frame {
		repeat MaxEne
			if EneFlg.cnt!0 : continue
			EneFlg.cnt=1
			EneFrm.cnt=0
			EneKi.cnt=EneTable.1.TableIndex
			EneMv.cnt=EneTable.2.TableIndex
			EneX0.cnt=EneTable.3.TableIndex<<8
			EneY0.cnt=EneTable.4.TableIndex<<8
			EneX.cnt=EneX0.cnt
			EneY.cnt=EneY0.cnt
			EneLckOn.cnt=0
			ki=EneKi.cnt
			EneShield.cnt=DatEne.0.ki
			EneTmp.0.cnt=0,0,0,0,0,0,0,0
			break
		loop
		TableIndex++
		goto *AprEne
	}
	return

;//////////敵移動//////////
*MovEne
	repeat MaxEne
		ene=cnt
		if EneFlg.ene=0 : continue
		ki=EneKi.ene
		mv=EneMv.ene

		if ki=0 {
			r=3*EneFrm.ene&255
			if mv=0 : EneX.ene=40*sin.r+EneX0.ene
			if mv=1 : EneX.ene=-40*sin.r+EneX0.ene
			EneY.ene+=512
			EneCx.ene=EneFrm.ene\6*20
			if 81920<EneY.ene : EneFlg.ene=0
		}

		if ki=1 {
			if (EneFrm.ene/2)<=64 : EneTmp.0.ene=EneFrm.ene/2
			if EneMv.ene=0 : r=64+EneTmp.0.ene
			if EneMv.ene=1 : r=64-EneTmp.0.ene
			EneX.ene+=cos.r*4
			EneY.ene+=sin.r*4
			EneCx.ene=cos.r*3>>8+3*40
			if EneFrm.ene=32 {
				prm=0,EneX.ene,EneY.ene+5120,64
				gosub *AprEneSht
			}
			if (EneX.ene<-5120)|(81920<EneX.ene) : EneFlg.ene=0
		}

		if ki=2 {
			r=EneTmp.0.ene
			if ((EneFrm.ene<=80)&(PlyFlg=1))|(EneFrm.ene=0) {
				prm=EneX.ene,EneY.ene,PlyX,PlyY
				gosub *stg_dir
				EneTmp.0.ene=r
			}
			EneTmp.1.ene+=cos.r>>1
			EneTmp.2.ene+=sin.r>>1
			EneX.ene+=EneTmp.1.ene
			EneY.ene+=EneTmp.2.ene
			EneTmp.1.ene=EneTmp.1.ene*19/20
			EneTmp.2.ene=EneTmp.2.ene*19/20
			if (EneFrm.ene!0)&(EneFrm.ene\30=0) {
				prm=0,cos.r*20+EneX.ene,sin.r*20+EneY.ene,r
				gosub *AprEneSht
			}
			EneCx.ene=r+4&255*31/255*40
			if (EneFrm.ene>80)&((EneX.ene<-5120)|(EneX.ene>81920)|(EneY.ene<-5120)|(EneY.ene>81920)) : EneFlg.ene=0
		}

		if ki=3 {
			EneY.ene+=1024
			if (EneFrm.ene=20)|(EneFrm.ene=40)|(EneFrm.ene=60)|(EneFrm.ene=80) {
				prm=EneX.ene,EneY.ene,PlyX,PlyY
				gosub *stg_dir
				prm=1,EneX.ene,7680+EneY.ene,r
				gosub *AprEneSht
			}
			EneCx.ene=0
			if EneY.ene>84480 : EneFlg.ene=0
		}

		if ki=4 {
			r=EneFrm.ene&255
			EneY.ene-=256
			EneX.ene=sin.r<<3+EneX0.ene
			if (EneFrm.ene>50)&(r\8=0) {
				prm=1,EneX.ene+2560,EneY.ene-512,64-EneTmp.0.ene&255
				gosub *AprEneSht
				prm=1,EneX.ene-2560,EneY.ene-512,64+EneTmp.0.ene&255
				EneTmp.0.ene+=8
				gosub *AprEneSht
			}
			EneCx.ene=0
			if EneY.ene<-7680 : EneFlg.ene=0
		}

		if ki=5 {
			if mv=0 : r=EneFrm.ene<<1 : else : r=-EneFrm.ene<<1+128
			EneX.ene=cos.r*150+38400
			EneY.ene=sin.r*150
			prm=EneX.ene,EneY.ene,PlyX,PlyY
			gosub *stg_dir
			if (EneFrm.ene=16)|(EneFrm.ene=48) {
				prm=0,cos.r*20+EneX.ene,sin.r*20+EneY.ene,r
				gosub *AprEneSht
			}
			EneCx.ene=r+4&255*31/255*40
			if EneFrm.ene=64 : EneFlg.ene=0
		}

		if ki=6 {
			r=EneFrm.ene*2
			EneY.ene+=cos.r*6
			EneCx.ene=-cos.r>>6+4*40
			if EneFrm.ene=25 {
				prm=EneX.ene,EneY.ene,PlyX,PlyY
				gosub *stg_dir
				prm=2,EneX.ene+2560,EneY.ene+6400,r
				gosub *AprEneSht
				prm=2,EneX.ene-2560,EneY.ene+6400,r
				gosub *AprEneSht
			}
			if EneY.ene=EneY0.ene : EneFlg.ene=0
		}

		if ki=7 {
			r=EneFrm.ene<<2&255
			if mv=0 : EneX.ene=40*sin.r+EneX0.ene
			if mv=1 : EneX.ene=-40*sin.r+EneX0.ene
			EneY.ene+=512
			if r\64=0 {
				prm=0,EneX.ene,EneY.ene+7680,64
				gosub *AprEneSht
			}
			EneCx.ene=EneFrm.ene/2&7*40
			if EneY.ene>84480 : EneFlg.ene=0
		}

		if ki=8 {
			if EneFrm.ene<30 {
				r=192
			}
			else {
				if EneFrm.ene<46 : EneTmp.0.ene=EneFrm.ene-30*2
				if EneMv.ene=0 : r=192+EneTmp.0.ene
				if EneMv.ene=1 : r=192-EneTmp.0.ene
			}
			EneX.ene+=cos.r*5
			EneY.ene+=sin.r*5
			EneCx.ene=cos.r*3>>8+3*40
			if EneFrm.ene=30 {
				prm=EneX.ene,EneY.ene,PlyX,PlyY
				gosub *stg_dir
				t=r
				prm=0,EneX.ene,EneY.ene,t
				gosub *AprEneSht
				prm=0,EneX.ene,EneY.ene,t+16&255
				gosub *AprEneSht
				prm=0,EneX.ene,EneY.ene,t+240&255
				gosub *AprEneSht
			}
			if (EneX.ene<-5120)|(81920<EneX.ene) : EneFlg.ene=0
		}

		if ki=9 {
			if EneFrm.ene=0 : EneTmp.0.ene=256
			if EneFrm.ene\50=0 : EneTmp.0.ene=-EneTmp.0.ene
			EneX.ene+=EneTmp.0.ene
			EneY.ene+=256
			if (EneFrm.ene>50)&(EneFrm.ene<296)&(EneFrm.ene\4=0) {
				prm=1,EneX.ene,EneY.ene-2560,EneTmp.1.ene&255
				gosub *AprEneSht
				prm=1,EneX.ene,EneY.ene-2560,EneTmp.1.ene+64&255
				gosub *AprEneSht
				prm=1,EneX.ene,EneY.ene-2560,EneTmp.1.ene+128&255
				gosub *AprEneSht
				prm=1,EneX.ene,EneY.ene-2560,EneTmp.1.ene+192&255
				gosub *AprEneSht
				EneTmp.1.ene+=4
			}
			EneCx.ene=EneFrm.ene/2&7*60
			if EneY.ene>84480 : EneFlg.ene=0
		}

		EneCy.ene=DatEne.7.ki

		EneFrm.ene++

		repeat MaxPlySht
			if PlyShtFlg.cnt=0 : continue
			prm.0=DatEne.3.ki<<8+EneX.ene,DatEne.4.ki<<8+EneY.ene,DatEne.5.ki<<8+EneX.ene,DatEne.6.ki<<8+EneY.ene
			prm.4=PlyShtX.cnt-1280,PlyShtY.cnt-2560,PlyShtX.cnt+1280,PlyShtY.cnt+2560
			gosub *stg_clash
			if r=1 {
				Score+=10
				PlyShtFlg.cnt=0
				EneShield.ene--
				rnd x,2560 : x-=1280
				rnd y,2560 : y-=1280
				prm=1,PlyShtX.cnt+x,PlyShtY.cnt+y,0
				gosub *AprEff
				if EneShield.ene=0 {
					EneFlg.ene=0
					repeat 5
						rnd x,DatEne.1.ki<<8 : x-=DatEne.1.ki<<7
						rnd y,DatEne.2.ki<<8 : y-=DatEne.2.ki<<7
						prm=0,EneX.ene+x,EneY.ene+y,-cnt*3
						gosub *AprEff
					loop
					break
				}
			}
		loop

		if PlyHitCnt!0 : continue

		prm.0=DatEne.3.ki<<8+EneX.ene,DatEne.4.ki<<8+EneY.ene,DatEne.5.ki<<8+EneX.ene,DatEne.6.ki<<8+EneY.ene
		prm.4=PlyX-1280,PlyY-1280,PlyX+1280,PlyY+1280
		gosub *stg_clash
		if r=1 {
			EneFlg.ene=0
			repeat 2
				rnd x,2560 : x-=1280
				rnd y,2560 : y-=1280
				prm=1,EneX.ene+x,EneY.ene+y,-cnt*3
				gosub *AprEff
			loop
			repeat 3
				rnd x,DatEne.1.ki<<8 : x-=DatEne.1.ki<<7
				rnd y,DatEne.2.ki<<8 : y-=DatEne.2.ki<<7
				prm=0,EneX.ene+x,EneY.ene+y,-cnt*3
				gosub *AprEff
			loop
			PlyHitCnt=50
			PlyShield--
			if PlyShield=0 {
				 PlyFlg=0
				repeat 5
					rnd x,40 : x-=20
					rnd y,40 : y-=20
					prm=0,PlyX+x,PlyY+y,-cnt*3
					gosub *AprEff
				loop
			}
		}
	loop
	return

;//////////敵描画//////////
*DrwEne
	repeat MaxEne
		if EneFlg.cnt=0 : continue
		ki=EneKi.cnt
		pos EneX.cnt>>8-(DatEne.1.ki/2),EneY.cnt>>8-(DatEne.2.ki/2)
		gcopy 4,EneCx.cnt,DatEne.7.ki,DatEne.1.ki,DatEne.2.ki
	loop
	return
