# VibeCode 🎨

わたしのはじめてのVibeCodingプロジェクト！

## コンセプト

完璧なコードよりも、まず「動くもの」を最優先。
UIのセンスを最大限に発揮して、いい感じに作っていきます。

## 方針

1. ✅ 動くものを最優先
2. ✅ 複数ファイルを一気に書き換え
3. ✅ UIのセンスを最大限に発揮
4. ✅ エラーは原因推測して即座に修正

## プロジェクト概要

Auth0と連携したReact + FastAPI + PostgreSQLの認証アプリケーションです。

## 技術スタック

- **フロントエンド**: React + Vite
- **バックエンド**: FastAPI
- **データベース**: PostgreSQL
- **認証**: Auth0
- **スタイリング**: モダンなCSS

## 機能要件

1. **ログイン機能**
   - Auth0のログインボタン
   - ソーシャルログイン対応（Google、GitHubなど）

2. **ログアウト機能**
   - ログアウトボタン

3. **ユーザー情報表示**
   - ログイン後のユーザー名・メールアドレス表示
   - プロフィール画像表示（あれば）

4. **保護されたAPI**
   - JWTトークン検証
   - ユーザー情報のDB保存・取得

## ファイル構成

```
VibeCode/
├── readme.md
├── package.json
├── vite.config.js
├── index.html
├── .env.example
├── .gitignore
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles.css
│   ├── hooks/
│   │   └── useAuth0.jsx
│   └── components/
│       ├── Login.jsx
│       ├── UserProfile.jsx
│       └── ProtectedContent.jsx
└── backend/
    ├── main.py
    ├── requirements.txt
    └── .env.example
```

## セットアップ手順

### 1. PostgreSQLのセットアップ

```bash
# PostgreSQLがインストールされていることを確認
psql --version

# データベースとユーザーを作成
createdb vibecode
# または psql で直接作成
# psql -U postgres
# CREATE DATABASE vibecode;
```

### 2. フロントエンドのセットアップ

#### WSL環境でのNode.jsインストール

WSL環境では、Windows版のNode.jsは使えません。WSL内でNode.jsをインストールする必要があります。

**方法1: NodeSourceリポジトリを使用（推奨）**

```bash
# Node.js 20.x LTSをインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# インストール確認
node --version
npm --version
```

**方法2: nvmを使用（推奨）**

```bash
# nvmをインストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# シェルを再起動するか、以下を実行
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.js LTSをインストール
nvm install --lts
nvm use --lts

# インストール確認
node --version
npm --version
```

**方法3: aptパッケージマネージャーを使用**

```bash
sudo apt update
sudo apt install nodejs npm

# インストール確認
node --version
npm --version
```

#### 依存関係のインストール

```bash
cd /home/snem11/src/VibeCode
npm install
```

### 3. バックエンドのセットアップ

```bash
cd backend

# Python仮想環境の作成（推奨）
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt
```

### 4. Auth0の設定

1. [Auth0](https://auth0.com)でアカウントを作成
2. ダッシュボードで「Applications」→「Create Application」
3. アプリケーション名を入力し、「Single Page Web Applications」を選択
4. 設定画面で以下を確認・設定：
   - **Domain**: `your-tenant.auth0.com`
   - **Client ID**: コピーして保存
   - **Allowed Callback URLs**: `http://localhost:3000`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
   - **Allowed Origins (CORS)**: `http://localhost:3000`

5. **APIの作成**:
   - 「APIs」→「Create API」
   - Identifier: `https://your-domain.auth0.com/api/v2/`（または任意の値）
   - このIdentifierを`AUTH0_AUDIENCE`として使用

### 5. 環境変数の設定

#### フロントエンド（`.env`ファイルをルートに作成）

```bash
cp .env.example .env
```

`.env`ファイルを編集：
```
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
```

#### バックエンド（`backend/.env`ファイルを作成）

```bash
cd backend
cp .env.example .env
```

`backend/.env`ファイルを編集：
```
DATABASE_URL=postgresql://snem11@/vibecode?host=/var/run/postgresql
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://your-domain.auth0.com/api/v2/
```

### 6. アプリケーションの起動

#### バックエンドを起動（別ターミナル）

```bash
cd backend
source venv/bin/activate  # 仮想環境が有効な場合
python main.py
# または
uvicorn main:app --reload --port 8000
```

バックエンドは `http://localhost:8000` で起動します。

#### フロントエンドを起動（別ターミナル）

```bash
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

## 使い方

1. バックエンドとフロントエンドを起動
2. ブラウザで `http://localhost:3000` にアクセス
3. 「ログイン」ボタンをクリックしてAuth0のログイン画面に遷移
4. ログイン後、ユーザー情報と保護されたコンテンツが表示されます
5. 保護されたAPIエンドポイント（`/api/protected`）が呼び出され、ユーザー情報がDBに保存されます
6. 「ログアウト」ボタンでログアウトできます

## APIエンドポイント

### `GET /`
- APIの状態確認

### `GET /api/protected`
- 保護されたエンドポイント
- 認証が必要（Bearerトークン）
- ユーザー情報をDBに保存/取得

### `GET /api/users/me`
- 現在のユーザー情報を取得
- 認証が必要（Bearerトークン）

## 実装済み機能

✅ React + Viteプロジェクト構成  
✅ Auth0認証ロジック（ログイン/ログアウト/ユーザー情報取得）  
✅ FastAPIバックエンド  
✅ PostgreSQLデータベース連携  
✅ JWTトークン検証  
✅ ユーザー情報のDB保存  
✅ モダンなUIデザイン  
✅ レスポンシブ対応  
✅ CORS設定  

## トラブルシューティング

### データベース接続エラー
- PostgreSQLが起動しているか確認: `sudo systemctl status postgresql`
- DATABASE_URLが正しいか確認
- データベースが存在するか確認: `psql -l`

### Auth0認証エラー
- `.env`ファイルの設定値が正しいか確認
- Auth0ダッシュボードの設定（Callback URLs等）を確認
- ブラウザのコンソールでエラーメッセージを確認

### API接続エラー
- バックエンドが起動しているか確認（`http://localhost:8000`）
- CORS設定を確認
- トークンが正しく送信されているか確認

---

**Let's Vibe Coding! 🚀**
