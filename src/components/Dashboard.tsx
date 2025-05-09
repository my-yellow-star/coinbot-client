"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "../types";
import { fetchDashboardData } from "../lib/api";
import Layout from "./Layout";
import AssetChart from "./AssetChart";
import DetailedAssetInfo from "./DetailedAssetInfo";
import DetailedOrders from "./DetailedOrders";
import DashboardTabs from "./Tabs";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await fetchDashboardData();
        setData(dashboardData);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError("데이터를 불러오는데 실패했습니다.");
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    // 초기 데이터 로딩
    fetchData();

    // 5초마다 데이터 폴링
    const intervalId = setInterval(fetchData, 5000);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(intervalId);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-bold mb-2">오류 발생</h2>
          <p>{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // 탭 구성
  const tabs = [
    {
      key: "assets",
      title: "자산 정보",
      content: <DetailedAssetInfo accounts={data.accounts} />,
    },
    {
      key: "orders",
      title: "주문 내역",
      content: <DetailedOrders orders={data.orders} markets={data.markets} />,
    },
  ];

  return (
    <Layout markets={data.markets} tickers={data.tickers}>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-2xl font-bold">코인 자동매매 대시보드</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          마지막 업데이트: {lastUpdated?.toLocaleString("ko-KR")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <AssetChart accounts={data.accounts} tickers={data.tickers} />
      </div>

      <DashboardTabs tabs={tabs} />
    </Layout>
  );
}
