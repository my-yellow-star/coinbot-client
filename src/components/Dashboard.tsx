"use client";

import { useEffect, useState } from "react";
import { DashboardData, SignalLog } from "../types";
import { fetchDashboardData, getLatestSignalLogs } from "../lib/api";
import Layout from "./Layout";
import AssetChart from "./AssetChart";
import DetailedAssetInfo from "./DetailedAssetInfo";
import DetailedOrders from "./DetailedOrders";
import DashboardTabs from "./Tabs";
import Link from "next/link";

// 새로운 컴포넌트: 매매 신호 요약
interface SignalSummaryProps {
  signalLogs: Record<string, SignalLog | null>;
  markets: DashboardData["markets"]; // 기존 DashboardData에서 market 정보 활용
}

function SignalSummary({ signalLogs, markets }: SignalSummaryProps) {
  if (Object.keys(signalLogs).length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        매매 신호 정보가 없습니다.
      </p>
    );
  }

  // market 코드를 한글 이름으로 매핑 (효율을 위해 미리 생성)
  const marketNameMap = new Map(markets.map((m) => [m.market, m.korean_name]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(signalLogs).map(([market, log]) => {
        if (!log) return null;
        const marketName = marketNameMap.get(market) || market;
        let bgColor = "bg-gray-100 dark:bg-gray-700";
        if (log.action === "buy") bgColor = "bg-green-100 dark:bg-green-800";
        else if (log.action === "sell") bgColor = "bg-red-100 dark:bg-red-800";

        return (
          <div key={market} className={`p-4 rounded-lg shadow ${bgColor}`}>
            <Link href={`/coin/${market}`}>
              <h3 className="text-lg font-semibold mb-1">
                {marketName} ({market})
              </h3>
              <p className="text-sm mb-1">
                <span className="font-medium">신호: </span>
                <span
                  className={
                    log.action === "buy"
                      ? "text-green-600 dark:text-green-400 font-bold"
                      : log.action === "sell"
                      ? "text-red-600 dark:text-red-400 font-bold"
                      : "text-yellow-600 dark:text-yellow-300"
                  }
                >
                  {log.action.toUpperCase()} (점수: {log.score.toFixed(0)})
                </span>
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                <span className="font-medium">요약:</span> {log.reason}
              </p>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [latestSignals, setLatestSignals] = useState<
    Record<string, SignalLog | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await fetchDashboardData();
        const signalsData = await getLatestSignalLogs();
        setData(dashboardData);
        setLatestSignals(signalsData);
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
      key: "signals",
      title: "매매 신호 요약",
      content: (
        <SignalSummary signalLogs={latestSignals} markets={data.markets} />
      ),
    },
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
