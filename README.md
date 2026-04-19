# AI Chat Workspace

中文：一个基于 Next.js App Router、Prisma、PostgreSQL 与 OpenAI Responses API 构建的 AI 聊天工作台示例项目。项目重点不是“一次性做完整产品”，而是按步骤逐步搭建出一套清晰、可讲解、适合学习与面试展示的 AI Chat Workspace。

日本語：Next.js App Router、Prisma、PostgreSQL、OpenAI Responses API を使って構築した AI チャットワークスペースのサンプルプロジェクトです。完成品を一気に作るのではなく、段階的に実装しながら、学習用・面接説明用として理解しやすい構成を重視しています。

## 项目简介 / プロジェクト概要

中文：

- 支持多语言界面：`zh-CN` / `ja`
- 支持 light / dark theme
- 支持数据库驱动的 chat / message 持久化
- 支持 OpenAI 流式回复、停止生成、重新生成
- 支持 Guest 试用限额与 GitHub 登录分流

日本語：

- 多言語 UI 対応：`zh-CN` / `ja`
- light / dark theme 対応
- chat / message の DB 永続化
- OpenAI のストリーミング返信、生成停止、再生成に対応
- Guest 試用回数制限と GitHub ログイン分岐に対応

## 核心功能 / 主な機能

中文：

- 新建对话、切换对话、删除对话、重命名对话
- 自动根据首条 user message 生成会话标题
- user / assistant 双向消息流
- OpenAI Responses API 流式输出
- 停止生成（Stop generation）
- 重新生成最后一条 assistant 回复（Regenerate response）
- assistant message 的 Markdown 渲染
- 首页快捷模板分组与点击填充输入框
- Guest 用户试用次数限制，登录用户跳过试用限制
- GitHub 登录

日本語：

- 新規チャット、チャット切り替え、削除、名前変更
- 最初の user message からチャットタイトルを自動生成
- user / assistant の双方向メッセージフロー
- OpenAI Responses API のストリーミング出力
- 生成停止（Stop generation）
- 最後の assistant 返信の再生成（Regenerate response）
- assistant message の Markdown レンダリング
- ホーム画面のクイックテンプレートと入力欄への自動入力
- Guest の試用回数制限、ログイン済みユーザーは制限なし
- GitHub ログイン

## 技术栈 / 技術スタック

- Next.js 16（App Router）
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- PostgreSQL 15
- NextAuth.js v4（GitHub Provider）
- OpenAI Responses API
- React Markdown + remark-gfm + remark-breaks

## 本地运行步骤 / ローカル起動手順

### 1. 安装依赖 / 依存関係のインストール

```bash
npm install
```

### 2. 启动 PostgreSQL / PostgreSQL を起動

当前项目默认按下面的 Docker 方式启动本地 PostgreSQL：

このプロジェクトでは、以下の Docker コマンドでローカル PostgreSQL を起動する前提です。

```bash
docker run --name chat-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=chat_db \
  -p 5432:5432 \
  -d postgres:15
```

如果容器已经存在，可以直接启动：

コンテナがすでに存在する場合は、次で起動できます。

```bash
docker start chat-postgres
```

### 3. 配置环境变量 / 環境変数を設定

复制 `.env.example` 到 `.env.local`：

`.env.example` を `.env.local` にコピーします。

```bash
cp .env.example .env.local
```

然后按本地环境填入真实值。

その後、ローカル環境に合わせて実際の値を設定してください。

### 4. 初始化数据库 / データベースを初期化

```bash
npm run prisma:migrate
```

说明：

- 该命令会执行 Prisma migration
- 同时根据 `prisma/schema.prisma` 生成 Prisma Client

説明：

- Prisma migration を実行します
- `prisma/schema.prisma` に基づいて Prisma Client も生成されます

### 5. 启动开发服务器 / 開発サーバーを起動

```bash
npm run dev
```

默认访问地址：

デフォルトのアクセス先：

```text
http://localhost:3000
```

## 环境变量说明 / 環境変数

项目当前最关键的环境变量如下：

現在このプロジェクトで重要な環境変数は以下の通りです。

| 变量 / 変数          | 说明（中文）                                       | 説明（日本語）                                                 |
| -------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL 连接串，Prisma 与服务端读写数据库会用到 | PostgreSQL の接続文字列。Prisma とサーバー側 DB アクセスで使用 |
| `OPENAI_API_KEY`     | OpenAI API Key，仅服务端使用                       | OpenAI API Key。サーバー側のみで使用                           |
| `OPENAI_MODEL`       | 预留的模型配置项，便于后续切换模型                 | 将来のモデル切り替え用の設定値                                 |
| `AUTH_SECRET`        | NextAuth 会话加密所需 secret                       | NextAuth のセッション暗号化に必要な secret                     |
| `AUTH_GITHUB_ID`     | GitHub OAuth App Client ID                         | GitHub OAuth App の Client ID                                  |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret                     | GitHub OAuth App の Client Secret                              |
| `NEXTAUTH_URL`       | 本地或部署环境中的应用地址                         | ローカルまたは本番環境でのアプリ URL                           |

## 数据库初始化说明 / データベース初期化

中文：

- Prisma schema 位于 [prisma/schema.prisma](/Users/liushaowei/Desktop/doing/latest-ai-workspace/ai-chat-workspace/prisma/schema.prisma)
- 当前最小模型包括：
  - `Chat`
  - `Message`
  - `GuestUsage`
- `Message` 通过 `chatId` 关联到 `Chat`
- 删除 `Chat` 时，关联 `Message` 会通过 `onDelete: Cascade` 一起删除

日本語：

- Prisma schema は [prisma/schema.prisma](/Users/liushaowei/Desktop/doing/latest-ai-workspace/ai-chat-workspace/prisma/schema.prisma) にあります
- 現在の最小モデルは以下です：
  - `Chat`
  - `Message`
  - `GuestUsage`
- `Message` は `chatId` で `Chat` に紐づきます
- `Chat` を削除すると、関連する `Message` も `onDelete: Cascade` で削除されます

如果是第一次初始化数据库，建议顺序如下：

初回セットアップ時の推奨手順は以下です。

```bash
npm install
cp .env.example .env.local
npm run prisma:migrate
npm run dev
```

## GitHub 登录配置 / GitHub ログイン設定

中文：

- 需要在 GitHub 中创建一个 OAuth App
- 常用配置：
  - Application name：自定义
  - Homepage URL：`http://localhost:3000`
  - Authorization callback URL：`http://localhost:3000/api/auth/callback/github`
- 然后把生成的 Client ID / Client Secret 分别写入：
  - `AUTH_GITHUB_ID`
  - `AUTH_GITHUB_SECRET`

日本語：

- GitHub で OAuth App を作成してください
- よく使う設定例：
  - Application name：任意
  - Homepage URL：`http://localhost:3000`
  - Authorization callback URL：`http://localhost:3000/api/auth/callback/github`
- 発行された Client ID / Client Secret を以下に設定します：
  - `AUTH_GITHUB_ID`
  - `AUTH_GITHUB_SECRET`

## OpenAI API 配置 / OpenAI API 設定

中文：

- 当前使用 OpenAI Responses API
- API Key 只应放在服务端环境变量中，不应暴露给前端
- 至少需要设置：
  - `OPENAI_API_KEY`

日本語：

- 現在は OpenAI Responses API を使用しています
- API Key はサーバー側の環境変数にのみ設定し、フロントエンドには公開しないでください
- 最低限必要な設定：
  - `OPENAI_API_KEY`

说明：

- 当前代码中 `src/lib/ai/openai.ts` 默认会根据环境选择模型
- `OPENAI_MODEL` 已预留在 `.env.example` 中，便于后续统一切换

説明：

- 現在の `src/lib/ai/openai.ts` では、環境に応じてモデルを選択しています
- `OPENAI_MODEL` は将来の切り替え用として `.env.example` に用意しています

## 项目结构概览 / プロジェクト構成

```text
src/
  app/              Next.js App Router 页面与 API Route
  components/       共享组件与 App Shell 组件
  components/ui/    基础 UI 组件
  features/chat/    聊天相关的控制逻辑、数据访问、流式请求
  features/guest/   Guest 限额与 guestId 逻辑
  i18n/             多语言消息资源
  lib/              Prisma、OpenAI 等共享集成层
  lib/ai/           OpenAI 服务封装
  types/            共享 TypeScript 类型
prisma/
  schema.prisma     Prisma 数据模型定义
```
