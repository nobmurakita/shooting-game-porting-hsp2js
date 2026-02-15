# shooting-game-porting-hsp2js

学生時代に[HSP](https://hsp.tv/)で制作していたシューティングゲーム(名称未定/未完成)をJavaScriptに移植

逐語的な翻訳の後、リファクタリングを行いゲームエンジンを導入

[移植したゲームをプレイする](https://nobmurakita.github.io/shooting-game-porting-hsp2js/)

## 操作方法

| キー | 操作 |
|------|------|
| カーソルキー | 自機の移動 |
| Zキー | ゲーム開始 / ショット |
| Xキー | ゲーム開始 / レーザー |
| Shiftキー | ゲーム開始 / ポーズ |
| ESCキー | タイトル画面に戻る |

## ディレクトリ構成

```
.
├── hsp/       # 移植元のHSPソースコード
├── img/       # 素材画像 (Nearest Neighborで2倍拡大済み)
├── js/        # 移植先のJavaScriptソースコード
├── index.html # エントリポイント
└── README.md
```

## 技術構成

- バニラJavaScript (ES Modules)
- [LittleJS](https://github.com/KilledByAPixel/LittleJS) v1.18.0 (CDN読み込み)
- ビルドツール・パッケージマネージャ不使用

## 移植元のゲームについて
- 制作時期
  - 1999〜2000年頃
- プログラミング言語
  - [HSP](https://hsp.tv/) ver2.5 くらい？ (詳細なバージョンは不明)
- 素材画像作成
  - [DOGA-L1](http://doga.jp/2010/programs/dogal/dogal1/index.html)
  - [発色弾](http://taillove.jp/mia/tools.html)
- 未完成なところ
  - BGM・SE がない
  - ステージが1つしかない
  - ステージクリア、ゲームオーバー時の処理が適当
  - ゲームバランスが適当
