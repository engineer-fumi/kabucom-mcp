# kabucom-mcp

au カブコム証券（三菱UFJ eスマート証券）の [kabu STATION API](https://kabucom.github.io/kabusapi/reference/index.html) を MCP (Model Context Protocol) サーバーとしてラッピングし、AIエージェントによる株式自動売買を可能にします。

## 前提条件

- [kabu STATION](https://kabu.com/item/kabustation/) デスクトップアプリがローカルで起動・ログイン済みであること
- kabu STATION API が有効化されていること（kabu STATION Professional プラン以上）
- Node.js 18 以上

## インストール

```bash
npm install
npm run build
```

## 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `KABUCOM_API_PASSWORD` | kabu STATION API パスワード | - |
| `KABUCOM_ORDER_PASSWORD` | 注文用パスワード | - |
| `KABUCOM_PRODUCTION` | `true` で本番環境 (port 18080) | `false` (検証環境 port 18081) |
| `KABUCOM_BASE_URL` | カスタムベースURL（省略可） | - |

## MCP 設定

Claude Desktop や他の MCP クライアントに以下の設定を追加してください:

```json
{
  "mcpServers": {
    "au-kabucom": {
      "command": "node",
      "args": ["/path/to/kabucom-mcp/dist/index.js"],
      "env": {
        "KABUCOM_API_PASSWORD": "your_api_password",
        "KABUCOM_ORDER_PASSWORD": "your_order_password",
        "KABUCOM_PRODUCTION": "false"
      }
    }
  }
}
```

## 提供ツール一覧

### 認証
| ツール名 | 説明 |
|---------|------|
| `authenticate` | API トークンの取得（他ツール使用前に必須） |

### 市場情報
| ツール名 | 説明 |
|---------|------|
| `get_board` | 板情報（気配値・現在値・出来高）の取得 |
| `get_symbol_info` | 銘柄詳細情報の取得 |
| `get_ranking` | 市場ランキングの取得 |
| `get_regulations` | 銘柄の規制情報の取得 |
| `get_primary_exchange` | 銘柄の主市場の取得 |
| `get_margin_premium` | 貸株料率の取得 |
| `get_api_soft_limit` | API注文上限数の取得 |

### 注文
| ツール名 | 説明 |
|---------|------|
| `send_stock_order` | 株式（現物・信用）注文の発注 |
| `send_future_order` | 先物注文の発注 |
| `send_option_order` | オプション注文の発注 |
| `cancel_order` | 注文の取消 |

### ポートフォリオ
| ツール名 | 説明 |
|---------|------|
| `get_orders` | 注文一覧の取得 |
| `get_positions` | 保有ポジションの取得 |
| `get_wallet_cash` | 現物取引の買付余力の取得 |
| `get_wallet_margin` | 信用取引の取引余力の取得 |
| `get_wallet_future` | 先物取引の取引余力の取得 |
| `get_wallet_option` | オプション取引の取引余力の取得 |

### 銘柄登録（PUSH配信）
| ツール名 | 説明 |
|---------|------|
| `register_symbols` | 銘柄の登録（最大50銘柄） |
| `unregister_symbols` | 銘柄の登録解除 |
| `unregister_all_symbols` | 全銘柄の登録解除 |

## 使用例

AIエージェントでの使用例:

1. **認証**: `authenticate` ツールでトークンを取得
2. **銘柄調査**: `get_symbol_info` で銘柄情報を確認、`get_board` で現在の株価を確認
3. **余力確認**: `get_wallet_cash` で買付余力を確認
4. **発注**: `send_stock_order` で注文を発注
5. **約定確認**: `get_orders` で注文状態を確認

## API リファレンス

- [kabu STATION API Reference](https://kabucom.github.io/kabusapi/reference/index.html)
- [kabu STATION API Developer Portal](https://kabucom.github.io/kabusapi/ptal/)
- [GitHub - kabucom/kabusapi](https://github.com/kabucom/kabusapi)

## ライセンス

ISC
