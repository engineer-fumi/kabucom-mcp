/**
 * kabu STATION API Client
 * au カブコム証券 (三菱UFJ eスマート証券) の kabu STATION API をラッピングするクライアント
 *
 * API Reference: https://kabucom.github.io/kabusapi/reference/index.html
 */

// ========== Types ==========

export interface TokenRequest {
  APIPassword: string;
}

export interface TokenResponse {
  ResultCode: number;
  Token: string;
}

/** 株式注文リクエスト */
export interface SendOrderRequest {
  Password: string;
  Symbol: string;
  Exchange: number;
  SecurityType: number;
  Side: string;
  CashMargin: number;
  MarginTradeType?: number;
  MarginPremiumUnit?: number;
  DelivType: number;
  FundType: string;
  AccountType: number;
  Qty: number;
  ClosePositionOrder?: number;
  ClosePositions?: ClosePosition[];
  Price: number;
  ExpireDay: number;
  FrontOrderType: number;
  ReverseLimitOrder?: ReverseLimitOrder;
}

export interface ClosePosition {
  HoldID: string;
  Qty: number;
}

export interface ReverseLimitOrder {
  TriggerSec: number;
  TriggerPrice: number;
  UnderOver: number;
  AfterHitOrderType: number;
  AfterHitPrice: number;
}

/** 先物注文リクエスト */
export interface SendOrderFutureRequest {
  Password: string;
  Symbol: string;
  Exchange: number;
  TradeType: number;
  TimeInForce: number;
  Side: string;
  Qty: number;
  ClosePositionOrder?: number;
  ClosePositions?: ClosePosition[];
  FrontOrderType: number;
  Price: number;
  ExpireDay: number;
  ReverseLimitOrder?: ReverseLimitOrder;
}

/** オプション注文リクエスト */
export interface SendOrderOptionRequest {
  Password: string;
  Symbol: string;
  Exchange: number;
  TradeType: number;
  TimeInForce: number;
  Side: string;
  Qty: number;
  ClosePositionOrder?: number;
  ClosePositions?: ClosePosition[];
  FrontOrderType: number;
  Price: number;
  ExpireDay: number;
  ReverseLimitOrder?: ReverseLimitOrder;
}

/** 注文取消リクエスト */
export interface CancelOrderRequest {
  OrderId: string;
  Password: string;
}

export interface OrderResponse {
  Result: number;
  OrderId: string;
}

export interface CancelOrderResponse {
  Result: number;
  OrderId: string;
}

/** 板情報 */
export interface BoardResponse {
  Symbol: string;
  SymbolName: string;
  Exchange: number;
  ExchangeName: string;
  CurrentPrice: number;
  CurrentPriceTime: string;
  CurrentPriceChangeStatus: string;
  CurrentPriceStatus: number;
  CalcPrice: number;
  PreviousClose: number;
  PreviousCloseTime: string;
  ChangePreviousClose: number;
  ChangePreviousClosePer: number;
  OpeningPrice: number;
  OpeningPriceTime: string;
  HighPrice: number;
  HighPriceTime: string;
  LowPrice: number;
  LowPriceTime: string;
  TradingVolume: number;
  TradingVolumeTime: string;
  VWAP: number;
  TradingValue: number;
  BidQty: number;
  BidPrice: number;
  BidTime: string;
  BidSign: string;
  MarketOrderSellQty: number;
  Sell1: { Price: number; Qty: number; Sign: string; Time: string };
  Sell2: { Price: number; Qty: number };
  Sell3: { Price: number; Qty: number };
  Sell4: { Price: number; Qty: number };
  Sell5: { Price: number; Qty: number };
  Sell6: { Price: number; Qty: number };
  Sell7: { Price: number; Qty: number };
  Sell8: { Price: number; Qty: number };
  Sell9: { Price: number; Qty: number };
  Sell10: { Price: number; Qty: number };
  AskQty: number;
  AskPrice: number;
  AskTime: string;
  AskSign: string;
  MarketOrderBuyQty: number;
  Buy1: { Price: number; Qty: number; Sign: string; Time: string };
  Buy2: { Price: number; Qty: number };
  Buy3: { Price: number; Qty: number };
  Buy4: { Price: number; Qty: number };
  Buy5: { Price: number; Qty: number };
  Buy6: { Price: number; Qty: number };
  Buy7: { Price: number; Qty: number };
  Buy8: { Price: number; Qty: number };
  Buy9: { Price: number; Qty: number };
  Buy10: { Price: number; Qty: number };
  OverSellQty: number;
  UnderBuyQty: number;
  TotalMarketValue: number;
  SecurityType: number;
}

/** 銘柄情報 */
export interface SymbolResponse {
  Symbol: string;
  SymbolName: string;
  DisplayName: string;
  Exchange: number;
  ExchangeName: string;
  BisCategory: string;
  TotalMarketValue: number;
  TotalStocks: number;
  TradingUnit: number;
  FiscalYearEndBasic: number;
  PriceRangeGroup: string;
  KCMarginBuy: boolean;
  KCMarginSell: boolean;
  MarginBuy: boolean;
  MarginSell: boolean;
  UpperLimit: number;
  LowerLimit: number;
}

/** 注文一覧 */
export interface OrderDetail {
  SeqNum: number;
  ID: string;
  RecType: number;
  ExchangeID: string;
  State: number;
  OrderState: number;
  OrdType: number;
  RecvTime: string;
  Symbol: string;
  SymbolName: string;
  Exchange: number;
  ExchangeName: string;
  TimeInForce: number;
  Price: number;
  OrderQty: number;
  CumQty: number;
  Side: string;
  CashMargin: number;
  AccountType: number;
  DelivType: number;
  ExpireDay: number;
  MarginTradeType: number;
  Details: unknown[];
}

/** ポジション */
export interface PositionDetail {
  ExecutionID: string;
  AccountType: number;
  Symbol: string;
  SymbolName: string;
  Exchange: number;
  ExchangeName: string;
  SecurityType: number;
  ExecutionDay: number;
  Price: number;
  LeavesQty: number;
  HoldQty: number;
  Side: string;
  Expenses: number;
  Commission: number;
  CommissionTax: number;
  ExpireDay: number;
  MarginTradeType: number;
  CurrentPrice: number;
  Valuation: number;
  ProfitLoss: number;
  ProfitLossRate: number;
}

/** 取引余力（現物） */
export interface WalletCashResponse {
  StockAccountWallet: number;
}

/** 取引余力（信用） */
export interface WalletMarginResponse {
  MarginAccountWallet: number;
  DepositkeepRate: number;
  ConsignmentDepositRate: number;
  CashOfConsignmentDepositRate: number;
}

/** 取引余力（先物） */
export interface WalletFutureResponse {
  FutureTradeLimit: number;
  MarginRequirement: number;
}

/** 取引余力（オプション） */
export interface WalletOptionResponse {
  OptionBuyTradeLimit: number;
  OptionSellTradeLimit: number;
  MarginRequirement: number;
}

/** ランキング */
export interface RankingResponse {
  Type: string;
  ExchangeDivision: string;
  Ranking: unknown[];
}

/** 銘柄登録 */
export interface RegisterRequest {
  Symbols: { Symbol: string; Exchange: number }[];
}

export interface RegisterResponse {
  RegistList: { Symbol: string; Exchange: number }[];
}

/** 規制情報 */
export interface RegulationsResponse {
  Symbol: string;
  RegulationsInfo: unknown[];
}

/** 主市場 */
export interface PrimaryExchangeResponse {
  Symbol: string;
  PrimaryExchange: number;
}

/** APIソフトリミット */
export interface ApiSoftLimitResponse {
  Stock: number;
  Margin: number;
  Future: number;
  FutureMini: number;
  Option: number;
  OptionMini: number;
  KabuSMini: number;
}

/** 貸株料率 */
export interface MarginPremiumResponse {
  Symbol: string;
  GeneralMargin: unknown;
  DayTrade: unknown;
}

// ========== Client ==========

export class KabucomClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(
    private isProd: boolean = false,
    baseUrl?: string,
  ) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else {
      this.baseUrl = isProd
        ? "http://localhost:18080/kabusapi"
        : "http://localhost:18081/kabusapi";
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["X-API-KEY"] = this.token;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `kabu STATION API error: ${res.status} ${res.statusText} - ${errorBody}`,
      );
    }

    return (await res.json()) as T;
  }

  // --- 認証 ---

  async getToken(password: string): Promise<TokenResponse> {
    const result = await this.request<TokenResponse>("POST", "/token", {
      APIPassword: password,
    });
    this.token = result.Token;
    return result;
  }

  setToken(token: string): void {
    this.token = token;
  }

  getCurrentToken(): string | null {
    return this.token;
  }

  // --- 注文 ---

  async sendOrder(order: SendOrderRequest): Promise<OrderResponse> {
    return this.request<OrderResponse>("POST", "/sendorder", order);
  }

  async sendOrderFuture(
    order: SendOrderFutureRequest,
  ): Promise<OrderResponse> {
    return this.request<OrderResponse>("POST", "/sendorder/future", order);
  }

  async sendOrderOption(
    order: SendOrderOptionRequest,
  ): Promise<OrderResponse> {
    return this.request<OrderResponse>("POST", "/sendorder/option", order);
  }

  async cancelOrder(req: CancelOrderRequest): Promise<CancelOrderResponse> {
    return this.request<CancelOrderResponse>("PUT", "/cancelorder", req);
  }

  // --- 取引余力 ---

  async getWalletCash(symbol?: string): Promise<WalletCashResponse> {
    const path = symbol ? `/wallet/cash/${symbol}` : "/wallet/cash";
    return this.request<WalletCashResponse>("GET", path);
  }

  async getWalletMargin(symbol?: string): Promise<WalletMarginResponse> {
    const path = symbol ? `/wallet/margin/${symbol}` : "/wallet/margin";
    return this.request<WalletMarginResponse>("GET", path);
  }

  async getWalletFuture(symbol?: string): Promise<WalletFutureResponse> {
    const path = symbol ? `/wallet/future/${symbol}` : "/wallet/future";
    return this.request<WalletFutureResponse>("GET", path);
  }

  async getWalletOption(symbol?: string): Promise<WalletOptionResponse> {
    const path = symbol ? `/wallet/option/${symbol}` : "/wallet/option";
    return this.request<WalletOptionResponse>("GET", path);
  }

  // --- 情報 ---

  async getBoard(symbol: string): Promise<BoardResponse> {
    return this.request<BoardResponse>("GET", `/board/${symbol}`);
  }

  async getSymbol(
    symbol: string,
    addinfo?: string,
  ): Promise<SymbolResponse> {
    const query = addinfo ? `?addinfo=${addinfo}` : "";
    return this.request<SymbolResponse>("GET", `/symbol/${symbol}${query}`);
  }

  async getOrders(params?: {
    product?: string;
    id?: string;
    updtime?: string;
    details?: string;
    symbol?: string;
    state?: string;
    side?: string;
    cashmargin?: string;
  }): Promise<OrderDetail[]> {
    const query = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
          .join("&")
      : "";
    return this.request<OrderDetail[]>("GET", `/orders${query}`);
  }

  async getPositions(params?: {
    product?: string;
    symbol?: string;
    side?: string;
    addinfo?: string;
  }): Promise<PositionDetail[]> {
    const query = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
          .join("&")
      : "";
    return this.request<PositionDetail[]>("GET", `/positions${query}`);
  }

  async getRanking(
    type: string,
    exchangeDivision: string,
  ): Promise<RankingResponse> {
    return this.request<RankingResponse>(
      "GET",
      `/ranking?type=${type}&exchangedivision=${exchangeDivision}`,
    );
  }

  async getRegulations(symbol: string): Promise<RegulationsResponse> {
    return this.request<RegulationsResponse>(
      "GET",
      `/regulations/${symbol}`,
    );
  }

  async getPrimaryExchange(
    symbol: string,
  ): Promise<PrimaryExchangeResponse> {
    return this.request<PrimaryExchangeResponse>(
      "GET",
      `/primaryexchange/${symbol}`,
    );
  }

  async getApiSoftLimit(): Promise<ApiSoftLimitResponse> {
    return this.request<ApiSoftLimitResponse>("GET", "/apisoftlimit");
  }

  async getMarginPremium(symbol: string): Promise<MarginPremiumResponse> {
    return this.request<MarginPremiumResponse>(
      "GET",
      `/margin/marginpremium/${symbol}`,
    );
  }

  // --- 銘柄登録 ---

  async registerSymbols(req: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("PUT", "/register", req);
  }

  async unregisterSymbols(req: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("PUT", "/unregister", req);
  }

  async unregisterAllSymbols(): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("PUT", "/unregister/all");
  }
}
