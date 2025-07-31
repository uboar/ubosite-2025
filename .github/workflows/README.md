# GitHub Actions設定ガイド

このドキュメントは、`deploy.yml`ワークフローを動作させるために必要な環境変数とシークレットの設定方法を説明します。

## 必要なシークレット

GitHubリポジトリの Settings > Secrets and variables > Actions から以下のシークレットを設定してください：

### Cloudflare R2関連

1. **R2_ACCOUNT_ID**
   - Cloudflareアカウント ID
   - 取得方法: Cloudflareダッシュボード > 右側のサイドバー > Account ID

2. **R2_ACCESS_KEY_ID**
   - R2 APIアクセスキー ID
   - 取得方法: Cloudflareダッシュボード > R2 > Manage R2 API tokens > Create API token

3. **R2_SECRET_ACCESS_KEY**
   - R2 APIシークレットアクセスキー
   - 取得方法: APIトークン作成時に一度だけ表示される

4. **R2_BUCKET_NAME**
   - ダウンロード元のR2バケット名
   - 例: `my-content-bucket`

### Cloudflare Workers関連

5. **CLOUDFLARE_API_TOKEN**
   - Cloudflare APIトークン（Workersへのデプロイ権限が必要）
   - 取得方法: Cloudflareダッシュボード > My Profile > API Tokens > Create Token
   - 必要な権限:
     - Account:Workers Scripts:Edit
     - Zone:Workers Routes:Edit（該当ゾーンがある場合）

6. **CLOUDFLARE_ACCOUNT_ID**
   - Cloudflareアカウント ID（R2_ACCOUNT_IDと同じ値）

## シークレット設定手順

1. GitHubリポジトリの **Settings** タブをクリック
2. 左サイドバーの **Secrets and variables** > **Actions** をクリック
3. **New repository secret** ボタンをクリック
4. 上記の各シークレット名と値を入力して保存

## ワークフローの動作

このワークフローは以下のタイミングで実行されます：

- `main`ブランチへのプッシュ時
- 手動実行（Actions タブから "Run workflow" ボタンをクリック）

## トラブルシューティング

### R2ダウンロードが失敗する場合

- R2 APIトークンの権限を確認（R2の読み取り権限が必要）
- バケット名が正しいか確認
- エンドポイントURLが正しいか確認

### Cloudflareデプロイが失敗する場合

- APIトークンにCloudflare Workersへのデプロイ権限があるか確認
- `wrangler.toml`の設定が正しいか確認（特にroutes設定）
- 初回デプロイの場合は、zone_nameが正しく設定されているか確認
- Workers Sitesが有効になっているか確認

## セキュリティに関する注意事項

- シークレットは暗号化されて保存されます
- ワークフローログでシークレットの値は自動的にマスクされます
- シークレットの値を誤ってコミットしないよう注意してください