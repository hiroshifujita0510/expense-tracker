# 支出トラッカー

家族のクレジットカード支出管理アプリ（SMBC / Amazon / PayPay / セゾン）

## GitHub Pages へのデプロイ手順

### 1. リポジトリ作成
GitHubで新しいリポジトリを作成（例: `expense-tracker`）

### 2. ファイルをプッシュ
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/expense-tracker.git
git push -u origin main
```

### 3. GitHub Pages の設定
- リポジトリの Settings → Pages
- Source を「GitHub Actions」に変更

mainブランチにpushするたびに自動デプロイされます。

### 4. アクセス
`https://あなたのユーザー名.github.io/expense-tracker/`

## ローカルで動かす場合
```bash
npm install
npm run dev
```

## データについて
データはブラウザのlocalStorageに保存されます。
同じデバイス・同じブラウザからアクセスすれば引き継がれます。
