import { DashboardData } from "../types";

const API_BASE_URL = "http://localhost:8080/api";

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
