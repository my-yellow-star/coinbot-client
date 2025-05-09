// 계좌 정보 타입
export interface Account {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string; // 매수 평균 가격
  avg_buy_price_modified: boolean; // 매수 평균 가격 수정 여부
  unit_currency: string; // 화폐 단위
}

// 마켓 코드 타입
export interface Market {
  market: string;
  korean_name: string;
  english_name: string;
}

// 현재가 정보 타입
export interface Ticker {
  market: string;
  trade_price: number;
  signed_change_rate: number;
  acc_trade_price_24h: number;
  high_price: number;
  low_price: number;
}

// 주문 타입
export interface Order {
  market: string;
  side: "bid" | "ask"; // bid: 매수, ask: 매도
  volume: string | null; // null: 최유리 주문
  price: string;
  ord_type: "limit" | "price" | "market" | "best"; // limit: 지정가, price: 시장가(매수), market: 시장가(매도), best: 최유리
}

export interface OrderHistory {
  uuid: string;
  side: "bid" | "ask";
  ord_type: "limit" | "price" | "market" | "best";
  price: string; // 주문 당시 화폐 가격
  state: "wait" | "watch";
  market: string;
  created_at: string;
  volume: string;
  remaining_volume: string;
  reserved_fee: string; // 수수료 예약 비용
  remaining_fee: string; // 남은 수수료
  paid_fee: string; // 사용된 수수료
  locked: string; // 거래에 사용중인 비용
  executed_volume: string; // 체결된 양
  executed_funds: string; // 체결된 금액
}

// 대시보드 데이터 타입
export interface DashboardData {
  timestamp: string;
  accounts: Account[];
  markets: Market[];
  tickers: Ticker[];
  orders: OrderHistory[];
}

// 매매 신호 로그 타입 (서버 API 응답 기반)
export interface SignalLog {
  timestamp: string; // ISO 8601 형식
  market: string;
  action: "buy" | "sell" | "hold";
  price?: number; // 매수 또는 매도 결정 시의 가격
  score: number;
  reason: string;
  // 서버의 SignalLog에 indicators 등이 있다면 여기에 추가 가능
}
