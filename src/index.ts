#!/usr/bin/env node

/**
 * au カブコム証券 (kabu STATION) MCP Server
 *
 * kabu STATION API を MCP (Model Context Protocol) サーバーとしてラッピングし、
 * AIエージェントによる株式の自動売買を可能にします。
 *
 * 前提: kabu STATION デスクトップアプリがローカルで起動・ログイン済みであること
 *
 * 環境変数:
 *   KABUCOM_API_PASSWORD - kabu STATION API パスワード
 *   KABUCOM_ORDER_PASSWORD - 注文用パスワード
 *   KABUCOM_PRODUCTION - "true" で本番環境 (port 18080)、それ以外は検証環境 (port 18081)
 *   KABUCOM_BASE_URL - カスタムベースURL（省略可）
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { KabucomClient } from "./kabucom-client.js";

// ========== Setup ==========

const isProd = process.env.KABUCOM_PRODUCTION === "true";
const client = new KabucomClient(isProd, process.env.KABUCOM_BASE_URL);

const server = new McpServer({
  name: "au-kabucom-securities",
  version: "1.0.0",
});

// ========== Exchange / Side / OrderType constants ==========

const EXCHANGE_DESCRIPTIONS = `
取引所コード:
  1: 東証
  3: 名証
  5: 福証
  6: 札証
`;

const SIDE_DESCRIPTIONS = `
売買区分:
  "1": 売
  "2": 買
`;

const CASH_MARGIN_DESCRIPTIONS = `
現物信用区分:
  1: 現物
  2: 新規 (信用)
  3: 返済 (信用)
`;

const FRONT_ORDER_TYPE_DESCRIPTIONS = `
執行条件:
  10: 成行
  20: 指値
  21: 引成（前場）
  22: 引指（前場）
  23: 寄成（前場）
  24: 寄指（前場）
  25: 不成（前場）
  26: IOC成行
  27: IOC指値
  30: 逆指値
  31: 引成（後場）
  32: 引指（後場）
  33: 寄成（後場）
  34: 寄指（後場）
  35: 不成（後場）
`;

const ACCOUNT_TYPE_DESCRIPTIONS = `
口座区分:
  2: 一般
  4: 特定
  12: 法人
`;

const DELIV_TYPE_DESCRIPTIONS = `
受渡区分:
  0: 指定なし（現物の場合は自動設定）
  2: お預り金
  3: auマネーコネクト
`;

const FUND_TYPE_DESCRIPTIONS = `
資産区分:
  "  ": 現物売 or 信用返済
  "02": お預り金
  "AA": auマネーコネクト
  "11": 信用代用
  "  ": 信用取引（空白指定）
`;

// ========== Tools ==========

// --- 認証 ---

server.tool(
  "authenticate",
  `kabu STATION API の認証トークンを取得します。
他のツールを使用する前に、まずこのツールで認証してください。
環境変数 KABUCOM_API_PASSWORD が設定されている場合は自動的に使用されます。`,
  {
    password: z
      .string()
      .optional()
      .describe(
        "kabu STATION API パスワード（省略時は環境変数 KABUCOM_API_PASSWORD を使用）",
      ),
  },
  async ({ password }) => {
    const apiPassword = password || process.env.KABUCOM_API_PASSWORD;
    if (!apiPassword) {
      return {
        content: [
          {
            type: "text" as const,
            text: "エラー: APIパスワードが指定されていません。引数で指定するか、環境変数 KABUCOM_API_PASSWORD を設定してください。",
          },
        ],
      };
    }
    try {
      const result = await client.getToken(apiPassword);
      return {
        content: [
          {
            type: "text" as const,
            text: `認証成功。トークンが取得されました。（ResultCode: ${result.ResultCode}）`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `認証失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 板情報取得 ---

server.tool(
  "get_board",
  `指定した銘柄の板情報（気配値・現在値・出来高など）を取得します。
${EXCHANGE_DESCRIPTIONS}
symbolは "銘柄コード@取引所コード" の形式で指定します。例: "9433@1" (KDDI@東証)`,
  {
    symbol: z
      .string()
      .describe('銘柄コード@取引所コード（例: "9433@1"）'),
  },
  async ({ symbol }) => {
    try {
      const board = await client.getBoard(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(board, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `板情報の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 銘柄情報取得 ---

server.tool(
  "get_symbol_info",
  `指定した銘柄の詳細情報（銘柄名・業種・売買単位・値幅制限など）を取得します。
${EXCHANGE_DESCRIPTIONS}
symbolは "銘柄コード@取引所コード" の形式で指定します。例: "9433@1"`,
  {
    symbol: z
      .string()
      .describe('銘柄コード@取引所コード（例: "9433@1"）'),
    addinfo: z
      .string()
      .optional()
      .describe("追加情報の出力フラグ（true/false）"),
  },
  async ({ symbol, addinfo }) => {
    try {
      const info = await client.getSymbol(symbol, addinfo);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(info, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `銘柄情報の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 株式注文 ---

server.tool(
  "send_stock_order",
  `株式（現物・信用）の注文を発注します。

${EXCHANGE_DESCRIPTIONS}
${SIDE_DESCRIPTIONS}
${CASH_MARGIN_DESCRIPTIONS}
${FRONT_ORDER_TYPE_DESCRIPTIONS}
${ACCOUNT_TYPE_DESCRIPTIONS}
${DELIV_TYPE_DESCRIPTIONS}
${FUND_TYPE_DESCRIPTIONS}

SecurityType: 1 (株式)

注意: 成行注文の場合は price を 0 に設定してください。`,
  {
    symbol: z.string().describe("銘柄コード（例: 9433）"),
    exchange: z.number().describe("取引所コード（1: 東証 等）"),
    side: z.string().describe('売買区分（"1": 売, "2": 買）'),
    cash_margin: z
      .number()
      .describe("現物信用区分（1: 現物, 2: 新規, 3: 返済）"),
    margin_trade_type: z
      .number()
      .optional()
      .describe("信用取引区分（1: 制度信用, 2: 一般信用(長期), 3: 一般信用(デイトレ)）"),
    deliv_type: z.number().describe("受渡区分（0: 指定なし, 2: お預り金, 3: auマネーコネクト）"),
    fund_type: z.string().describe('資産区分'),
    account_type: z
      .number()
      .describe("口座区分（2: 一般, 4: 特定, 12: 法人）"),
    qty: z.number().describe("注文数量"),
    price: z
      .number()
      .describe("注文価格（成行の場合は0）"),
    front_order_type: z
      .number()
      .describe("執行条件（10: 成行, 20: 指値 等）"),
    expire_day: z
      .number()
      .optional()
      .describe("注文有効期限（YYYYMMDD形式、0: 当日中）")
      .default(0),
    password: z
      .string()
      .optional()
      .describe(
        "注文パスワード（省略時は環境変数 KABUCOM_ORDER_PASSWORD を使用）",
      ),
  },
  async ({
    symbol,
    exchange,
    side,
    cash_margin,
    margin_trade_type,
    deliv_type,
    fund_type,
    account_type,
    qty,
    price,
    front_order_type,
    expire_day,
    password,
  }) => {
    const orderPassword = password || process.env.KABUCOM_ORDER_PASSWORD;
    if (!orderPassword) {
      return {
        content: [
          {
            type: "text" as const,
            text: "エラー: 注文パスワードが指定されていません。引数で指定するか、環境変数 KABUCOM_ORDER_PASSWORD を設定してください。",
          },
        ],
      };
    }
    try {
      const order: any = {
        Password: orderPassword,
        Symbol: symbol,
        Exchange: exchange,
        SecurityType: 1,
        Side: side,
        CashMargin: cash_margin,
        DelivType: deliv_type,
        FundType: fund_type,
        AccountType: account_type,
        Qty: qty,
        Price: price,
        FrontOrderType: front_order_type,
        ExpireDay: expire_day ?? 0,
      };
      if (margin_trade_type !== undefined) {
        order.MarginTradeType = margin_trade_type;
      }
      const result = await client.sendOrder(order);
      return {
        content: [
          {
            type: "text" as const,
            text: `注文が発注されました。\nOrderId: ${result.OrderId}\nResult: ${result.Result}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `注文の発注に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 注文取消 ---

server.tool(
  "cancel_order",
  "指定した注文を取り消します。",
  {
    order_id: z.string().describe("取り消す注文のOrderId"),
    password: z
      .string()
      .optional()
      .describe(
        "注文パスワード（省略時は環境変数 KABUCOM_ORDER_PASSWORD を使用）",
      ),
  },
  async ({ order_id, password }) => {
    const orderPassword = password || process.env.KABUCOM_ORDER_PASSWORD;
    if (!orderPassword) {
      return {
        content: [
          {
            type: "text" as const,
            text: "エラー: 注文パスワードが指定されていません。",
          },
        ],
      };
    }
    try {
      const result = await client.cancelOrder({
        OrderId: order_id,
        Password: orderPassword,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `注文が取り消されました。\nOrderId: ${result.OrderId}\nResult: ${result.Result}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `注文の取消に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 注文一覧取得 ---

server.tool(
  "get_orders",
  `注文一覧を取得します。フィルタリング条件を指定できます。

state:
  1: 待機（未約定）
  2: 処理中
  3: 処理済
  4: 訂正取消送信中
  5: 終了
`,
  {
    product: z
      .string()
      .optional()
      .describe("商品区分（0: すべて, 1: 現物, 2: 信用, 3: 先物, 4: OP）"),
    symbol: z.string().optional().describe("銘柄コード"),
    state: z
      .string()
      .optional()
      .describe("状態（1: 待機, 2: 処理中, 3: 処理済, 4: 訂正取消送信中, 5: 終了）"),
    side: z
      .string()
      .optional()
      .describe('売買区分（"1": 売, "2": 買）'),
    cashmargin: z
      .string()
      .optional()
      .describe("現物信用区分（1: 現物, 2: 新規, 3: 返済）"),
  },
  async ({ product, symbol, state, side, cashmargin }) => {
    try {
      const orders = await client.getOrders({
        product,
        symbol,
        state,
        side,
        cashmargin,
      });
      return {
        content: [
          {
            type: "text" as const,
            text:
              orders.length === 0
                ? "注文はありません。"
                : JSON.stringify(orders, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `注文一覧の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- ポジション取得 ---

server.tool(
  "get_positions",
  "保有ポジション（建玉）一覧を取得します。",
  {
    product: z
      .string()
      .optional()
      .describe("商品区分（0: すべて, 1: 現物, 2: 信用, 3: 先物, 4: OP）"),
    symbol: z.string().optional().describe("銘柄コード"),
    side: z
      .string()
      .optional()
      .describe('売買区分（"1": 売, "2": 買）'),
    addinfo: z
      .string()
      .optional()
      .describe("追加情報の出力（true/false）"),
  },
  async ({ product, symbol, side, addinfo }) => {
    try {
      const positions = await client.getPositions({
        product,
        symbol,
        side,
        addinfo,
      });
      return {
        content: [
          {
            type: "text" as const,
            text:
              positions.length === 0
                ? "ポジションはありません。"
                : JSON.stringify(positions, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `ポジションの取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 取引余力（現物） ---

server.tool(
  "get_wallet_cash",
  "現物取引の買付余力を取得します。",
  {
    symbol: z
      .string()
      .optional()
      .describe('銘柄コード@取引所コード（例: "9433@1"）指定時はその銘柄の余力'),
  },
  async ({ symbol }) => {
    try {
      const wallet = await client.getWalletCash(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(wallet, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `取引余力の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 取引余力（信用） ---

server.tool(
  "get_wallet_margin",
  "信用取引の取引余力を取得します。",
  {
    symbol: z
      .string()
      .optional()
      .describe('銘柄コード@取引所コード（例: "9433@1"）'),
  },
  async ({ symbol }) => {
    try {
      const wallet = await client.getWalletMargin(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(wallet, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `信用取引余力の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- ランキング ---

server.tool(
  "get_ranking",
  `市場ランキングを取得します。

ランキング種別 (type):
  1: 値上がり率
  2: 値下がり率
  3: 売買高上位
  4: 売買代金上位
  5: TICK回数上位
  6: 売買高急増
  7: 売買代金急増
  8: 信用売残増
  9: 信用売残減
  10: 信用買残増
  11: 信用買残減
  12: 信用高倍率
  13: 信用低倍率
  14: 業種別値上がり率
  15: 業種別値下がり率

取引所区分 (exchange_division):
  ALL: 全市場
  T: 東証全体
  TP: 東証プライム
  TS: 東証スタンダード
  TG: 東証グロース
  M: 名証
  FK: 福証
  S: 札証`,
  {
    type: z.string().describe("ランキング種別"),
    exchange_division: z.string().describe("取引所区分"),
  },
  async ({ type, exchange_division }) => {
    try {
      const ranking = await client.getRanking(type, exchange_division);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(ranking, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `ランキングの取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 規制情報 ---

server.tool(
  "get_regulations",
  "指定した銘柄の規制情報を取得します。",
  {
    symbol: z
      .string()
      .describe('銘柄コード@取引所コード（例: "9433@1"）'),
  },
  async ({ symbol }) => {
    try {
      const regs = await client.getRegulations(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(regs, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `規制情報の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 主市場取得 ---

server.tool(
  "get_primary_exchange",
  "指定した銘柄の主市場を取得します。",
  {
    symbol: z.string().describe("銘柄コード（例: 9433）"),
  },
  async ({ symbol }) => {
    try {
      const result = await client.getPrimaryExchange(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `主市場の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- APIソフトリミット ---

server.tool(
  "get_api_soft_limit",
  "APIの注文上限数（ソフトリミット）を取得します。",
  {},
  async () => {
    try {
      const result = await client.getApiSoftLimit();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `ソフトリミットの取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 貸株料率 ---

server.tool(
  "get_margin_premium",
  "指定した銘柄の貸株料率（プレミアム料）を取得します。",
  {
    symbol: z
      .string()
      .describe('銘柄コード@取引所コード（例: "9433@1"）'),
  },
  async ({ symbol }) => {
    try {
      const result = await client.getMarginPremium(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `貸株料率の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 銘柄登録 (PUSH配信用) ---

server.tool(
  "register_symbols",
  "PUSH配信用に銘柄を登録します（最大50銘柄）。",
  {
    symbols: z
      .array(
        z.object({
          symbol: z.string().describe("銘柄コード"),
          exchange: z.number().describe("取引所コード"),
        }),
      )
      .describe("登録する銘柄リスト"),
  },
  async ({ symbols }) => {
    try {
      const result = await client.registerSymbols({
        Symbols: symbols.map((s) => ({
          Symbol: s.symbol,
          Exchange: s.exchange,
        })),
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `銘柄を登録しました。\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `銘柄登録に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 銘柄登録解除 ---

server.tool(
  "unregister_symbols",
  "PUSH配信用の銘柄登録を解除します。",
  {
    symbols: z
      .array(
        z.object({
          symbol: z.string().describe("銘柄コード"),
          exchange: z.number().describe("取引所コード"),
        }),
      )
      .describe("登録解除する銘柄リスト"),
  },
  async ({ symbols }) => {
    try {
      const result = await client.unregisterSymbols({
        Symbols: symbols.map((s) => ({
          Symbol: s.symbol,
          Exchange: s.exchange,
        })),
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `銘柄登録を解除しました。\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `銘柄登録解除に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 銘柄全登録解除 ---

server.tool(
  "unregister_all_symbols",
  "PUSH配信用の銘柄登録をすべて解除します。",
  {},
  async () => {
    try {
      const result = await client.unregisterAllSymbols();
      return {
        content: [
          {
            type: "text" as const,
            text: `全銘柄の登録を解除しました。\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `銘柄全登録解除に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 先物注文 ---

server.tool(
  "send_future_order",
  `先物の注文を発注します。

TradeType:
  1: 新規
  2: 返済

TimeInForce:
  1: FAS
  2: FAK
  3: FOK

${SIDE_DESCRIPTIONS}
${FRONT_ORDER_TYPE_DESCRIPTIONS}`,
  {
    symbol: z.string().describe("先物銘柄コード"),
    exchange: z.number().describe("取引所コード（2: 日通し, 23: 日中, 24: 夜間）"),
    trade_type: z.number().describe("取引区分（1: 新規, 2: 返済）"),
    time_in_force: z.number().describe("有効期間条件（1: FAS, 2: FAK, 3: FOK）"),
    side: z.string().describe('売買区分（"1": 売, "2": 買）'),
    qty: z.number().describe("注文数量"),
    front_order_type: z.number().describe("執行条件"),
    price: z.number().describe("注文価格（成行の場合は0）"),
    expire_day: z.number().optional().describe("注文有効期限").default(0),
    password: z.string().optional().describe("注文パスワード"),
  },
  async ({
    symbol,
    exchange,
    trade_type,
    time_in_force,
    side,
    qty,
    front_order_type,
    price,
    expire_day,
    password,
  }) => {
    const orderPassword = password || process.env.KABUCOM_ORDER_PASSWORD;
    if (!orderPassword) {
      return {
        content: [
          {
            type: "text" as const,
            text: "エラー: 注文パスワードが指定されていません。",
          },
        ],
      };
    }
    try {
      const result = await client.sendOrderFuture({
        Password: orderPassword,
        Symbol: symbol,
        Exchange: exchange,
        TradeType: trade_type,
        TimeInForce: time_in_force,
        Side: side,
        Qty: qty,
        FrontOrderType: front_order_type,
        Price: price,
        ExpireDay: expire_day ?? 0,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `先物注文が発注されました。\nOrderId: ${result.OrderId}\nResult: ${result.Result}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `先物注文の発注に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- オプション注文 ---

server.tool(
  "send_option_order",
  `オプションの注文を発注します。

TradeType:
  1: 新規
  2: 返済

TimeInForce:
  1: FAS
  2: FAK
  3: FOK

${SIDE_DESCRIPTIONS}
${FRONT_ORDER_TYPE_DESCRIPTIONS}`,
  {
    symbol: z.string().describe("オプション銘柄コード"),
    exchange: z.number().describe("取引所コード（2: 日通し, 23: 日中, 24: 夜間）"),
    trade_type: z.number().describe("取引区分（1: 新規, 2: 返済）"),
    time_in_force: z.number().describe("有効期間条件（1: FAS, 2: FAK, 3: FOK）"),
    side: z.string().describe('売買区分（"1": 売, "2": 買）'),
    qty: z.number().describe("注文数量"),
    front_order_type: z.number().describe("執行条件"),
    price: z.number().describe("注文価格（成行の場合は0）"),
    expire_day: z.number().optional().describe("注文有効期限").default(0),
    password: z.string().optional().describe("注文パスワード"),
  },
  async ({
    symbol,
    exchange,
    trade_type,
    time_in_force,
    side,
    qty,
    front_order_type,
    price,
    expire_day,
    password,
  }) => {
    const orderPassword = password || process.env.KABUCOM_ORDER_PASSWORD;
    if (!orderPassword) {
      return {
        content: [
          {
            type: "text" as const,
            text: "エラー: 注文パスワードが指定されていません。",
          },
        ],
      };
    }
    try {
      const result = await client.sendOrderOption({
        Password: orderPassword,
        Symbol: symbol,
        Exchange: exchange,
        TradeType: trade_type,
        TimeInForce: time_in_force,
        Side: side,
        Qty: qty,
        FrontOrderType: front_order_type,
        Price: price,
        ExpireDay: expire_day ?? 0,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `オプション注文が発注されました。\nOrderId: ${result.OrderId}\nResult: ${result.Result}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `オプション注文の発注に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 取引余力（先物） ---

server.tool(
  "get_wallet_future",
  "先物取引の取引余力を取得します。",
  {
    symbol: z
      .string()
      .optional()
      .describe('銘柄コード@取引所コード'),
  },
  async ({ symbol }) => {
    try {
      const wallet = await client.getWalletFuture(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(wallet, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `先物取引余力の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- 取引余力（オプション） ---

server.tool(
  "get_wallet_option",
  "オプション取引の取引余力を取得します。",
  {
    symbol: z
      .string()
      .optional()
      .describe('銘柄コード@取引所コード'),
  },
  async ({ symbol }) => {
    try {
      const wallet = await client.getWalletOption(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(wallet, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `オプション取引余力の取得に失敗: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ========== Start Server ==========

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("au カブコム証券 MCP Server started");
  console.error(`Mode: ${isProd ? "本番 (port 18080)" : "検証 (port 18081)"}`);
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
