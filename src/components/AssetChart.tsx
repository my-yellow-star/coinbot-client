"use client";

import { Account, Ticker } from "../types";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AssetChartProps {
  accounts: Account[];
  tickers: Ticker[];
}

export default function AssetChart({ accounts, tickers }: AssetChartProps) {
  // KRW 제외한 계좌만 필터링
  const cryptoAccounts = accounts.filter(
    (account) => account.currency !== "KRW"
  );

  // 시세 정보 맵 생성
  const tickerMap = tickers.reduce((acc, ticker) => {
    acc[ticker.market] = ticker;
    return acc;
  }, {} as Record<string, Ticker>);

  // 차트 데이터 생성
  const assets = cryptoAccounts.map((account) => {
    const marketCode = `KRW-${account.currency}`;
    const currentPrice = tickerMap[marketCode]?.trade_price || 0;
    const avgPrice = parseFloat(account.avg_buy_price);
    const balance = parseFloat(account.balance);
    const currentValue = currentPrice * balance;

    // 손익률 계산
    const profitRate =
      avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

    return {
      currency: account.currency,
      balance,
      avgPrice,
      currentPrice,
      currentValue,
      profitRate,
    };
  });

  // KRW 계좌 데이터
  const krwAccount = accounts.find((account) => account.currency === "KRW");
  const krwBalance = krwAccount ? parseFloat(krwAccount.balance) : 0;

  // 총 자산 가치
  const totalAssetValue = assets.reduce(
    (total, asset) => total + asset.currentValue,
    krwBalance
  );

  // 차트 데이터
  const chartData = {
    labels: [...assets.map((asset) => asset.currency), "KRW"],
    datasets: [
      {
        data: [...assets.map((asset) => asset.currentValue), krwBalance],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(199, 199, 199, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(199, 199, 199, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: "right" as const,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: TooltipItem<"doughnut">) {
            const value = Number(tooltipItem.raw);
            const percentage = ((value / totalAssetValue) * 100).toFixed(1);
            return `${tooltipItem.label}: ${new Intl.NumberFormat("ko-KR", {
              style: "currency",
              currency: "KRW",
            }).format(value)} (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">자산 분포</h2>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-1/2" style={{ height: "300px" }}>
          <Doughnut data={chartData} options={chartOptions} />
        </div>

        <div className="w-full md:w-1/2">
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300">총 보유 자산</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: "KRW",
              }).format(totalAssetValue)}
            </p>
          </div>

          <div className="overflow-y-auto max-h-44">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    화폐
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    현재가치
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    손익률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {assets.map((asset) => (
                  <tr
                    key={asset.currency}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-2 py-2 whitespace-nowrap">
                      {asset.currency}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                        maximumFractionDigits: 0,
                      }).format(asset.currentValue)}
                    </td>
                    <td
                      className={`px-2 py-2 whitespace-nowrap ${
                        asset.profitRate > 0
                          ? "text-green-600"
                          : asset.profitRate < 0
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {asset.profitRate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-2 py-2 whitespace-nowrap">KRW</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {new Intl.NumberFormat("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                      maximumFractionDigits: 0,
                    }).format(krwBalance)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
