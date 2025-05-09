import { DashboardData } from "../types";
import { SignalLog } from "../types";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

// 대시보드 데이터 가져오기
export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch(`${API_BASE_URL}/dashboard`);
  if (!response.ok) {
    throw new Error("대시보드 데이터를 불러오는데 실패했습니다.");
  }
  return response.json();
}

// 계좌 정보 가져오기
export async function fetchAccounts() {
  const response = await fetch(`${API_BASE_URL}/accounts`);
  if (!response.ok) {
    throw new Error("계좌 정보를 불러오는데 실패했습니다.");
  }
  return response.json();
}

// 마켓 정보 가져오기
export async function fetchMarkets() {
  const response = await fetch(`${API_BASE_URL}/markets`);
  if (!response.ok) {
    throw new Error("마켓 정보를 불러오는데 실패했습니다.");
  }
  return response.json();
}

// 종료된 주문 조회
export async function fetchClosedOrders() {
  const response = await fetch(`${API_BASE_URL}/orders/closed`);
  if (!response.ok) {
    throw new Error("주문 내역을 불러오는데 실패했습니다.");
  }
  return response.json();
}

// 특정 코인의 수익률 조회
export async function fetchProfitRate(market: string) {
  const response = await fetch(`${API_BASE_URL}/profit/${market}`);
  if (!response.ok) {
    throw new Error("수익률 정보를 불러오는데 실패했습니다.");
  }
  return response.json();
}

// 매매 신호 관련 API

/**
 * 모든 마켓의 가장 최근 신호 분석 로그를 가져옵니다.
 */
export async function getLatestSignalLogs(): Promise<
  Record<string, SignalLog | null>
> {
  try {
    const response = await fetch(`${API_BASE_URL}/signals/latest`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch latest signal logs: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching latest signal logs:", error);
    // 실제 애플리케이션에서는 사용자에게 보여줄 오류 처리 또는 Sentry/LogRocket 등으로 로깅
    return {}; // 빈 객체 또는 적절한 오류 상태 반환
  }
}

/**
 * 특정 마켓의 신호 분석 로그 목록(히스토리)을 가져옵니다.
 * @param market 마켓 코드 (예: "KRW-BTC")
 * @param limit 가져올 로그 개수 (기본값 50)
 * @returns SignalLog 객체 배열
 */
export async function getMarketSignalHistory(
  market: string,
  limit: number = 100
): Promise<SignalLog[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/signals/${market}/history?limit=${limit}`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch signal history for ${market}: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching signal history for ${market}:`, error);
    return []; // 빈 배열 또는 적절한 오류 상태 반환
  }
}
