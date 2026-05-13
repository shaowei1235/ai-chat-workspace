# AI Chat Workspace

## プロジェクト概要

AI Chat Workspace は、Next.js と TypeScript を使って構築した ChatGPT 風の AI チャットアプリです。  
チャット UI の実装だけでなく、Streaming 表示、会話管理、認証、データ分離、ゲスト利用制限まで含めて、実際の Web アプリに近い構成を意識して開発しています。

## 主な機能

- AI チャット
- Streaming 表示
- Markdown レンダリング
- 停止生成（AbortController）
- 再生成（Regenerate）
- 会話管理
  - 新規会話
  - 自動タイトル生成
  - 会話切り替え
  - 会話削除
- Lazy Chat Creation
- 会話検索
- Prompt Templates
- GitHub ログイン
- guest / user 分離
- guest 利用制限
- ダークモード
- i18n（日本語 / 中国語）

## 技術スタック

### Frontend

- Next.js（App Router）
- React
- TypeScript
- Tailwind CSS
- react-markdown
- remark-gfm
- remark-breaks

### Backend

- Next.js Route Handlers
- OpenAI API

### Database

- Prisma
- PostgreSQL

### Authentication

- Auth.js / NextAuth
- GitHub OAuth

### Deployment

- Vercel

## スクリーンショット

TODO

## ローカル開発環境

### 1. 依存関係のインストール

```bash
npm install
```

### 2. PostgreSQL の起動

ローカルでは Docker を使って PostgreSQL を起動する想定です。

```bash
docker run --name chat-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=chat_db \
  -p 5432:5432 \
  -d postgres:15
```

既存コンテナを再利用する場合は、次のコマンドで起動できます。

```bash
docker start chat-postgres
```

### 3. 環境変数の設定

`.env.example` を `.env.local` にコピーして、必要な値を設定してください。

```bash
cp .env.example .env.local
```

### 4. Prisma の反映

```bash
npm run prisma:migrate
```

必要に応じて Prisma Client を再生成する場合は、次のコマンドを使います。

```bash
npm run prisma:generate
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

起動後は以下にアクセスします。

```text
http://localhost:3000
```

## 環境変数

以下の環境変数を使用します。実際の値は `.env.local` に設定してください。

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

例:

```env
DATABASE_URL=""
OPENAI_API_KEY=""
OPENAI_MODEL=""
AUTH_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
```

## GitHub OAuth 設定

GitHub ログインを利用する場合は、GitHub で OAuth App を作成してください。  
ローカル開発時の callback URL は以下です。

```text
http://localhost:3000/api/auth/callback/github
```

発行された Client ID / Client Secret を、それぞれ `AUTH_GITHUB_ID` と `AUTH_GITHUB_SECRET` に設定します。

## ディレクトリ構成

```text
src/
  app/            App Router のページと API Route
  components/     画面コンポーネントと共通 UI
  features/       チャット、guest 制御などの機能単位の実装
  i18n/           メッセージ定義と locale 処理
  lib/            Prisma、OpenAI、viewer などの共通処理
  types/          共通 TypeScript 型
prisma/
  schema.prisma   Prisma schema
note/             学習メモ、面接用資料
```

## 今後の改善予定

- モバイル表示の最適化
- コードブロック表示の改善
- 会話検索機能の強化
- メッセージ操作まわりの整理
- 会話一覧とメッセージ取得のキャッシュ設計見直し

