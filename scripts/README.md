# Content Sync Script

## 概要
`sync-content.js`は、Cloudflare R2バケットからコンテンツをローカルの`src/content`フォルダにダウンロードするスクリプトです。

## 使用方法

### 手動実行
```bash
pnpm sync
```

### 自動実行
以下のコマンドは自動的にコンテンツを同期します：
- `pnpm dev` - 開発サーバー起動前に同期
- `pnpm build` - ビルド前に同期

## 環境変数の設定

`.env`ファイルに以下の環境変数が必要です：

```env
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

## バケット構造

R2バケット内のコンテンツは以下の構造で配置する必要があります：

```
bucket/
├── blog/        → src/content/blog/
├── works/       → src/content/works/
└── links/       → src/content/links/
```

## 注意事項

- R2の認証情報が正しく設定されていることを確認してください
- バケットへの読み取りアクセス権限が必要です
- 初回実行時は`src/content`ディレクトリが自動的に作成されます