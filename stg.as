;//////////シューティング用汎用サブルーチン使用準備//////////
*stg_set

	;テーブル作成

	dim sin,256 : dim cos,256 : dim atan,21,21
	bload "sin.dat",sin
	repeat 256 : r=cnt+64&255 : cos.cnt=sin.r : loop
	repeat 64
		dx=cos.cnt : dy=sin.cnt
		du=dx : if du<dy : du=dy
		dx=dx*20/du : dy=dy*20/du
		atan.dx.dy=cnt
	loop
	atan.20.0=0
	atan.20.20=32
	atan.0.20=64

	;パラメータ用変数

	dim prm,8

	return

;//////////方向を求める//////////
*stg_dir

	;prm=x0,y0,x1,y1
	;(x0,y0) から (x1,y1) への向きを返す

	dx=(prm.2-prm.0)>0*2-1*(prm.2-prm.0) : mx=(prm.2-prm.0)<0
	dy=(prm.3-prm.1)>0*2-1*(prm.3-prm.1) : my=(prm.3-prm.1)<0
	du=dx : if du<dy : du=dy
	if du!0 {
		dx=dx*20/du : dy=dy*20/du
		r=atan.dx.dy
		if mx : r=128-r&255
		if my : r=256-r&255
	}
	return

;//////////領域の衝突判定//////////
*stg_clash
	;prm=x1,y1,x2,y2,x3,y3,x4,y4
	;(x1,y1)(x2,y2)を対角線とする四角形と
	;(x3,y3)(x4,y4)を対角線とする四角形が
	;重なっているときは1を返す
	r=1
	if (prm.0>prm.6)|(prm.1>prm.7)|(prm.2<prm.4)|(prm.3<prm.5) : r=0
	return

