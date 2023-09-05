;//////////プレーヤーデータ初期化//////////
*IniDatPly
	dim DatShtDir,12 : DatShtDir=192,192,191,193,190,194,184,200,174,210,166,218
	dim DatLsrDir,8 : DatLsrDir=187,197,177,207,167,217,157,227
	return

;//////////プレーヤー初期化//////////
*IniPly
	PlyFlg=1
	PlyShield=5
	PlyFrm=0
	PlyX=150<<8
	PlyY=260<<8
	PlyHitCnt=0
	PlyGra=0

	MaxPlySht=36
	dim PlyShtFlg,MaxPlySht
	dim PlyShtFrm,MaxPlySht
	dim PlyShtX,MaxPlySht
	dim PlyShtY,MaxPlySht
	dim PlyShtDir,MaxPlySht
	PlyShtCnt=0
	PlyShtLV=1

	MaxLsr=8
	dim LsrFlg,MaxLsr
	dim LsrTrg,MaxLsr
	dim LsrSta,MaxLsr
	dim LsrX,8,MaxLsr
	dim LsrY,8,MaxLsr
	dim LsrVx,MaxLsr
	dim LsrVy,MaxLsr
	dim LsrDir,MaxLsr
	LsrF=1
	LsrPow=0

	return

;//////////プレーヤー移動//////////
*MovPly
	if PlyFlg=0 : LsrPow=0 : return
;移動量＆傾き決定
	prm=0,0,(Key&4>>2)-(Key&1),(Key&8>>3)-(Key&2>>1)
	if (prm.2!0)|(prm.3!0) {
		gosub *stg_dir
		PlyX+=cos.r*55/10
		PlyY+=sin.r*55/10
	}
	else : r=8
	if prm.2=0 {
		if PlyGra<0 : PlyGra++
		if PlyGra>0 : PlyGra--
	}
	else {
		PlyGra+=prm.2 
		if PlyGra<-6 : PlyGra=-6
		if PlyGra>6 : PlyGra=6
	}

;はみ出したときの処理
	if PlyX<5120	: PlyX=5120
	if PlyY<5120	: PlyY=5120
	if PlyX>71680	: PlyX=71680
	if PlyY>71680	: PlyY=71680

;ショット発射
	if PlyShtCnt!0 { PlyShtCnt- }
	else {
		if Key&64 {
			PlyShtCnt=3
			repeat PlyShtLV*2
				lv=cnt
				repeat MaxPlySht
					if PlyShtFlg.cnt!0 : continue
					PlyShtFlg.cnt=1
					PlyShtFrm.cnt=0
					r=lv+6
					r=DatShtDir.r
					PlyShtX.cnt=cos.r*20+PlyX
					PlyShtY.cnt=sin.r*20+PlyY
					PlyShtDir.cnt=DatShtDir.lv
					break
				loop
			loop
		}
	}

;レーザー発射
	if LsrF=1 {
		if Key&16 {
			if LsrPow>=40 {
				repeat LsrPow/40
					lsr=cnt
					if LsrFlg.lsr!0 : continue
					LsrFlg.lsr=1
					gosub *SearchTrget
					if trg!-1 {
						LsrTrg.lsr=trg
						LsrSta.lsr=1
						if BossFlg=0 : EneLckOn.trg++ : else : BossLckOn.trg++
					}
					else : LsrSta.lsr=1
					repeat 8
						LsrX.cnt.lsr=PlyX
						LsrY.cnt.lsr=PlyY-5120
					loop
					r=DatLsrDir.lsr
					LsrVx.lsr=cos.r<<4
					LsrVy.lsr=sin.r<<4
					LsrDir.lsr=192
				loop
			}
		}
		else {
			if Key&64 : a=1 : else : a=3
			LsrPow+=a
			if LsrPow>320 : LsrPow=320
		}
	}
	else {
		LsrPow-=25
		if LsrPow<0 : LsrPow=0
	}

	if PlyHitCnt!0 : PlyHitCnt--
	PlyFrm+

	return

;//////////ロックオンする敵をサーチ//////////
*SearchTrget
	trg=-1
	if BossFlg!1 {
		repeat MaxEne
			ene=cnt
			if EneFlg.ene=0 : continue
			if trg=-1 : trg=ene : continue
			if EneLckOn.trg>EneLckOn.ene : trg=ene : continue
			if EneLckOn.trg<EneLckOn.ene : continue
			x=EneX.trg-PlyX>>8 : x=x*x
			y=EneY.trg-PlyY>>8 : y=y*y
			r=x+y
			x=EneX.ene-PlyX>>8 : x=x*x
			y=EneY.ene-PlyY>>8 : y=y*y
			if r>(x+y) : trg=ene
		loop
	}
	else {
		repeat MaxBossPrt
			prt=cnt
			if BossPrtFlg.prt=0 : continue
			if trg=-1 : trg=prt : continue
			;if BossLckOn.trg>BossLckOn.prt : trg=prt : continue
			;if BossLckOn.trg<BossLckOn.prt : continue
			x=BossX>>8+DatBossPrt.1.trg-(PlyX>>8) : x=x*x
			y=BossY>>8+DatBossPrt.2.trg-(PlyY>>8) : y=y*y
			r=x+y
			x=BossX>>8+DatBossPrt.1.prt-(PlyX>>8) : x=x*x
			y=BossY>>8+DatBossPrt.2.prt-(PlyY>>8) : y=y*y
			if r>(x+y) : trg=prt
		loop
	}
	return

;//////////プレーヤー描画//////////
*DrwPly
	if PlyFlg=0 : return
	pos PlyX>>8-20,PlyY>>8-20
	if PlyHitCnt/3\2=0 : gcopy 3,PlyGra>>1+2*40+40,0,40,40 : else : gcopy 3,PlyGra>>1+2*40+40,40,40,40
	return

;//////////プレーヤーショット移動//////////
*MovPlySht
	repeat MaxPlySht
		if PlyShtFlg.cnt=0 : continue
		r=PlyShtDir.cnt
		PlyShtX.cnt+=16*cos.r
		PlyShtY.cnt+=16*sin.r
		if PlyShtY.cnt<-5120 : PlyShtFlg.cnt=0
	loop
	return

;//////////プレーヤーショット描画//////////
*DrwPlySht
	repeat MaxPlySht
		sht=MaxPlySht-cnt-1
		if PlyShtFlg.sht=0 : continue
		pos PlyShtX.sht>>8-5,PlyShtY.sht>>8-10
		gcopy 3,280,0,10,20
	loop
	return

;//////////レーザー移動//////////
*MovLsr
	if LsrPow=0 : LsrF=1
	repeat MaxLsr
		lsr=cnt
		if LsrFlg.lsr=0 : continue
		repeat 7
			a=7-cnt
			b=a-1
			LsrX.a.lsr=LsrX.b.lsr
			LsrY.a.lsr=LsrY.b.lsr
		loop

		r=LsrDir.lsr

		if LsrSta.lsr!0 {
			LsrVx.lsr+=cos.r*5
			LsrVy.lsr+=sin.r*5
			LsrX.0.lsr+=LsrVx.lsr
			LsrY.0.lsr+=LsrVy.lsr
			LsrVx.lsr=LsrVx.lsr*4/5
			LsrVy.lsr=LsrVy.lsr*4/5
		}
		else {
			r=0
			repeat 7
				a=cnt
				b=a+1
				if (LsrX.a.lsr=LsrX.b.lsr)&(LsrY.a.lsr=LsrY.b.lsr) : continue
				r=1
			loop
			if r=0 : LsrFlg.lsr=0
		}

		if BossFlg!1 {
			ene=LsrTrg.lsr
			if ((LsrSta.lsr=1)&(EneFlg.ene=0))|(LsrSta.lsr=2) {
				prm=LsrX.0.lsr,LsrY.0.lsr
				gosub *SearchTrget
				if trg!-1 {
					LsrSta.lsr=1
					LsrTrg.lsr=trg
					EneLckOn.trg++
					ene=trg
				}
				else : LsrSta.lsr=2
			}

			if LsrSta.lsr=1 {
				ki=EneKi.ene
				gosub *@forward
				if r=1 {
					Score+=100
					EneShield.ene-=5
					EneLckOn.ene--
					;EneCy.ene=DatEne.2.ki+DatEne.7.ki
					LsrSta.lsr=0
					repeat 2
						rnd x,2560 : x-=1280
						rnd y,2560 : y-=1280
						prm=1,LsrX.0.lsr+x,LsrY.0.lsr+y,-cnt*3
						gosub *AprEff
					loop
					if EneShield.ene<=0 {
						EneFlg.ene=0
						repeat 3
							rnd x,DatEne.1.ki<<8 : x-=DatEne.1.ki<<7
							rnd y,DatEne.2.ki<<8 : y-=DatEne.2.ki<<7
							prm=0,EneX.ene+x,EneY.ene+y,-cnt*3
							gosub *AprEff
						loop
					}
				}
				prm=LsrX.0.lsr,LsrY.0.lsr,EneX.ene,EneY.ene
				gosub *stg_dir
				LsrDir.lsr=r
			}
		}
		else {
			prt=LsrTrg.lsr

			if ((LsrSta.lsr=1)&(BossPrtFlg.prt=0))|(LsrSta.lsr=2) {
				prm=LsrX.0.lsr,LsrY.0.lsr
				gosub *SearchTrget
				if trg!-1 {
					LsrSta.lsr=1
					LsrTrg.lsr=trg
					EneLckOn.trg++
					prt=trg
				}
				else : LsrSta.lsr=2
			}

			if LsrSta.lsr=1 {
				gosub *@forward
				if r=1 {
					Score+=100
					BossShield-=5
					BossPrtShield.prt-=5
					BossLckOn.prt--
					;BossPrtCx.prt=DatBossPrt.3.prt
					LsrSta.lsr=0
					repeat 2
						rnd x,2560 : x-=1280
						rnd y,2560 : y-=1280
						prm=1,LsrX.0.lsr+x,LsrY.0.lsr+y,-cnt*3
						gosub *AprEff
					loop
					if BossShield<=0 {
						BossShield=0
						BossFlg=2
						BossFrm=0
					}
					if BossPrtShield.prt<=0 {
						BossPrtFlg.prt=0
						BossPrtCx.prt=DatBossPrt.3.prt
						repeat 3
							rnd x,DatBossPrt.3.prt<<8 : x-=DatBossPrt.3.prt<<7
							rnd y,DatBossPrt.4.prt<<8 : y-=DatBossPrt.4.prt<<7
							prm=0,DatBossPrt.1.prt<<8+BossX+x,DatBossPrt.2.prt<<8+BossY+y,-cnt*3
							gosub *AprEff
						loop
					}
				}
				prm=LsrX.0.lsr,LsrY.0.lsr,DatBossPrt.1.prt<<8+BossX,DatBossPrt.2.prt<<8+BossY
				gosub *stg_dir
				LsrDir.lsr=r
			}
		}
		if (LsrSta.lsr=2)&((LsrX.0.lsr<0)|(76800<LsrX.0.lsr)|(LsrY.0.lsr<0)|(76800<LsrY.0.lsr)) : LsrSta.lsr=0
		if LsrFlg.lsr!0 : LsrF=0
	loop
	return

*@
	r=0
	if BossFlg=0 {
		if (LsrX.0.lsr<(DatEne.3.ki<<8+EneX.ene))|((DatEne.5.ki<<8+EneX.ene)<LsrX.0.lsr) : return
		if (LsrY.0.lsr<(DatEne.4.ki<<8+EneY.ene))|((DatEne.6.ki<<8+EneY.ene)<LsrY.0.lsr) : return
	}
	else {
		if (LsrX.0.lsr<(DatBossPrt.1.prt+DatBossPrt.5.prt<<8+BossX))|((DatBossPrt.1.prt+DatBossPrt.7.prt<<8+BossX)<LsrX.0.lsr) : return
		if (LsrY.0.lsr<(DatBossPrt.2.prt+DatBossPrt.6.prt<<8+BossY))|((DatBossPrt.2.prt+DatBossPrt.8.prt<<8+BossY)<LsrY.0.lsr) : return
	}
	r=1
	return

;//////////レーザー描画//////////
*DrwLsr
	repeat MaxLsr
		lsr=cnt
		if LsrFlg.lsr=0 : continue
		repeat 7
			color 50,255-(cnt*20),160-(cnt*20)
			a=cnt
			b=cnt+1
			line LsrX.a.lsr>>8,LsrY.a.lsr>>8,LsrX.b.lsr>>8,LsrY.b.lsr>>8
			line LsrX.a.lsr>>8+1,LsrY.a.lsr>>8,LsrX.b.lsr>>8+1,LsrY.b.lsr>>8
			line LsrX.a.lsr>>8-1,LsrY.a.lsr>>8,LsrX.b.lsr>>8-1,LsrY.b.lsr>>8
			line LsrX.a.lsr>>8,LsrY.a.lsr>>8+1,LsrX.b.lsr>>8,LsrY.b.lsr>>8+1
			line LsrX.a.lsr>>8,LsrY.a.lsr>>8-1,LsrX.b.lsr>>8,LsrY.b.lsr>>8-1
		loop
	loop
	return


