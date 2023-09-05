;//////////敵ショット初期化//////////
*IniDatEneSht
	MaxDatEneSht=4
	dim DatEneSht,7,MaxDatEneSht
;			sx	,sy	,HitX1	,HitY1	,HitX2	,HitY2	,cy
	DatEneSht.0.0=	20	,20	,-5	,-5	,5	,5	,130
	DatEneSht.0.1=	20	,20	,-5	,-5	,5	,5	,130
	DatEneSht.0.2=	20	,20	,-5	,-5	,5	,5	,150
	return

;//////////敵ショット初期化//////////
*IniEneSht
	MaxEneSht=100
	dim EneShtFlg,MaxEneSht
	dim EneShtKi,MaxEneSht
	dim EneShtX0,MaxEneSht
	dim EneShtY0,MaxEneSht
	dim EneShtX,MaxEneSht
	dim EneShtY,MaxEneSht
	dim EneShtDir,MaxEneSht
	dim EneShtFrm,MaxEneSht
	dim EneShtCx,MaxEneSht
	dim EneShtTmp,4,MaxEneSht
	return

;//////////敵ショット発生//////////
*AprEneSht
	repeat MaxEneSht
		sht=cnt
		if EneShtFlg.sht!0 : continue
		EneShtFlg.sht=1
		shtki=prm.0
		EneShtKi.sht=shtki
		EneShtX0.sht=prm.1
		EneShtY0.sht=prm.2
		EneShtX.sht=prm.1
		EneShtY.sht=prm.2
		r=prm.3
		EneShtDir.sht=r
		EneShtFrm.sht=0
		EneShtTmp.0.sht=0,0,0,0
		if shtki=0 : EneShtCx.sht=r+4&127*15/127*20
		break
	loop
	return

;//////////敵ショット移動//////////
*MovEneSht
	repeat MaxEneSht
		sht=cnt
		if EneShtFlg.sht=0 : continue
		ki=EneShtKi.sht

		if ki=0 {
			r=EneShtDir.sht
			EneShtX.sht+=cos.r*7
			EneShtY.sht+=sin.r*7
			if (EneShtX.sht<-2560)|(EneShtX.sht>79360)|(EneShtY.sht<-2560)|(EneShtY.sht>79360) : EneShtFlg.sht=0
		}

		if ki=1 {
			r=EneShtDir.sht
			EneShtX.sht+=cos.r*5
			EneShtY.sht+=sin.r*5
			EneShtCx.sht=EneShtFrm.sht&15*20+320
			if (EneShtX.sht<-2560)|(EneShtX.sht>79360)|(EneShtY.sht<-2560)|(EneShtY.sht>79360) : EneShtFlg.sht=0
		}

		if ki=2 {
			r=EneShtDir.sht
			if ((EneShtFrm.sht<80)&(PlyFlg=1))|(EneShtFrm.sht=0) {
				prm=EneShtX.sht,EneShtY.sht,PlyX,PlyY
				gosub *stg_dir
				EneShtDir.sht=r
			}
			EneShtTmp.0.sht+=cos.r*2/3
			EneShtTmp.1.sht+=sin.r*2/3
			EneShtX.sht+=EneShtTmp.0.sht
			EneShtY.sht+=EneShtTmp.1.sht
			EneShtTmp.0.sht=EneShtTmp.0.sht*14/15
			EneShtTmp.1.sht=EneShtTmp.1.sht*14/15
			EneShtCx.sht=r+4&255*31/255*20
			if EneShtFrm.sht\3=0 {
				rnd x,2560 : x-=1280
				rnd y,2560 : y-=1280
				prm=2,-cos.r*10+EneShtX.sht+x,-sin.r*10+EneShtY.sht+y,0
				gosub *AprEff
			}
			prm.0=DatEneSht.2.ki<<8+EneShtX.sht,DatEneSht.3.ki<<8+EneShtY.sht,DatEneSht.4.ki<<8+EneShtX.sht,DatEneSht.5.ki<<8+EneShtY.sht
			repeat MaxPlySht
				if PlyShtFlg.cnt=0 : continue
				prm.4=PlyShtX.cnt-1280,PlyShtY.cnt-2560,PlyShtX.cnt+1280,PlyShtY.cnt+2560
				gosub *stg_clash
				if r=1 {
					Score+=10
					PlyShtFlg.cnt=0
					EneShtFlg.sht=0
					rnd x,2560 : x-=1280
					rnd y,2560 : y-=1280
					prm=1,PlyShtX.cnt+x,PlyShtY.cnt+y,0
					gosub *AprEff
					repeat 2
						rnd x,DatEneSht.1.ki<<8 : x-=DatEneSht.1.ki<<7
						rnd y,DatEneSht.2.ki<<8 : y-=DatEneSht.2.ki<<7
						prm=0,EneShtX.sht+x,EneShtY.sht+y,-cnt*3
						gosub *AprEff
					loop
					break
				}
			loop
			if (EneShtFrm.sht>80)&((EneShtX.sht<-2560)|(EneShtX.sht>79360)|(EneShtY.sht<-2560)|(EneShtY.sht>79360)) : EneShtFlg.sht=0
		}

		EneShtFrm.sht++

		if PlyHitCnt!0 : continue

		prm.0=DatEneSht.2.ki<<8+EneShtX.sht,DatEneSht.3.ki<<8+EneShtY.sht,DatEneSht.4.ki<<8+EneShtX.sht,DatEneSht.5.ki<<8+EneShtY.sht
		prm.4=PlyX-1280,PlyY-1280,PlyX+1280,PlyY+1280
		gosub *stg_clash
		if r=1 {
			EneShtFlg.sht=0
			PlyShield--
			PlyHitCnt=50
			repeat 2
				rnd x,2560 : x-=1280
				rnd y,2560 : y-=1280
				prm=1,EneShtX.sht+x,EneShtY.sht+y,-cnt*3
				gosub *AprEff
			loop
			if PlyShield=0 {
				 PlyFlg=0
				repeat 3
					rnd x,10240 : x-=5120
					rnd y,10240 : y-=5120
					prm=0,PlyX+x,PlyY+y,-cnt*3
					gosub *AprEff
				loop
			}
		}
	loop
	return

;//////////敵ショット描画//////////
*DrwEneSht
	repeat MaxEneSht
		sht=cnt
		if EneShtFlg.sht=0 : continue
		ki=EneShtKi.sht
		pos EneShtX.sht>>8-(DatEneSht.0.ki/2),EneShtY.sht>>8-(DatEneSht.1.ki/2)
		gcopy 3,EneShtCx.sht,DatEneSht.6.ki,DatEneSht.0.ki,DatEneSht.1.ki
	loop
	return


