# アルコールどんだけ？ / Tipsy Tally

飲んだお酒をタップで記録して、純アルコール量と自分の酔い方を見える化する PWA。
バックエンドなし、データはブラウザの localStorage にだけ保存されます。

## できること

- **今日** — お酒のアイコンをタップで一杯追加（長押しでその一杯の度数・量を調整）。純アルコール量と、1日の目安に対する進み具合を表示。酔い具合（5段階）とメモを記録。
- **記録** — 月カレンダー（量の多さを色の濃さで表示）、日ごとの棒グラフ、飲んだ日数・休肝日・飲んだ日の平均。日付をタップすると記録の追加・削除、酔い具合、翌日の二日酔い、メモを編集できます。
- **酔い具合と量** — 酔い具合ごとに、その日に飲んだ量の平均と幅を表示。自分がどのくらいで酔うのかを観察できます。
- **お酒** — 並び替え（ドラッグ）、追加・編集・削除、標準のお酒を戻す。
- **設定** — 日本語 / English、表示単位（g / ml）、1日の目安、日付の切り替え時刻（深夜の一杯を前日扱いに）、JSON の書き出し・読み込み、全消去。

純アルコール量 (g) = 量 (ml) × 度数 (%) ÷ 100 × 0.8

## 開発

[Bun](https://bun.sh) を使います。

```sh
bun install
bun run dev          # http://localhost:5173
bun run dev --host   # 同じ LAN のスマホから確認したいとき
bun run build        # dist/ に出力
bun run preview      # ビルド結果を確認（Service Worker も有効）
```

アプリアイコンの PNG は `scripts/make-icons.sh`（ImageMagick が必要）で生成します。

## デプロイ (GitHub Pages)

1. GitHub にリポジトリを作って `main` に push
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする
3. `.github/workflows/deploy.yml` がビルドして公開します

`base: './'` なので、`https://<user>.github.io/<repo>/` のようなサブパスでもそのまま動きます。

## 構成

```
src/
  app.tsx           タブとレイアウト
  screens/          今日 / 記録 / お酒 / 設定
  components.tsx    お酒タイル、記録リスト、酔い具合とメモ
  icons.tsx         お酒と酔い具合のイラスト（SVG）
  store.ts          データの保存・読み込み・検証
  i18n.ts           日本語 / 英語
  presets.ts        標準のお酒と度数・量
vite.config.ts      ビルド時に Service Worker (sw.js) を生成
```
