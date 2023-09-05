;//////////エフェクトデータ初期化//////////
*IniDatEff
	MaxDatEff=3
	dim DatEff,3,MaxDatEff
;			sx	,sy	,cy
	DatEff.0.0=	40	,40	,80
	DatEff.0.1=	10	,10	,120
	DatEff.0.2=	10	,10	,120
	return

;//////////エフェクト初期化//////////
*IniEff
	MaxEff=70
	dim EffFlg,MaxEff
	dim EffKi,MaxEff
	dim EffX,MaxEff
	dim EffY,MaxEff
	dim EffFrm,MaxEff
	dim EffCx,MaxEff
	return

;//////////エフェクト発生//////////
*AprEff
	repeat MaxEff
		eff=cnt
		if EffFlg.eff!0 : continue
		EffFlg.eff=1
		EffKi.eff=prm.0
		EffX.eff=prm.1
		EffY.eff=prm.2
		EffFrm.eff=prm.3
		break
	loop
	return

;//////////エフェクト移動//////////
*MovEff
	repeat MaxEff
		eff=cnt
		if EffFlg.eff=0 : continue
		EffFrm.eff++
		if EffFrm.eff<=0 : continue
		ki=EffKi.eff

		if ki=0 {
			if EffFrm.eff>=8 : EffY.eff+=1792
			EffCx.eff=EffFrm.eff/3\6*40
			if EffFrm.eff=17 : EffFlg.eff=0
		}

		if ki=1 {
			EffCx.eff=EffFrm.eff/3\6+6*10
			if EffFrm.eff=17 : EffFlg.eff=0
		}

		if ki=2 {
			EffCx.eff=EffFrm.eff/3\6*10
			if EffFrm.eff=17 : EffFlg.eff=0
		}
	loop
	return

;//////////エフェクト描画//////////
*DrwEff
	repeat MaxEff
		eff=MaxEff-1-cnt
		if (EffFlg.eff=0)|(EffFrm.eff<=0) : continue
		ki=EffKi.eff
		pos EffX.eff>>8-(DatEff.0.ki/2),EffY.eff>>8-(DatEff.1.ki/2)
		gcopy 3,EffCx.eff,DatEff.2.ki,DatEff.0.ki,DatEff.1.ki
	loop
	return


