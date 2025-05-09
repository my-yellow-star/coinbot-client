"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Ticker,
  OrderHistory,
  SignalLog,
  Market as MarketType,
} from "../types";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { getMarketSignalHistory, fetchMarkets } from "../lib/api";

// ApexCharts SSR 에러 방지를 위한 dynamic import
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ChartData {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  timestamp: number;
  candle_acc_trade_price: number;
  candle_acc_trade_volume: number;
  unit: number;
}

const CoinDetail = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [signalHistory, setSignalHistory] = useState<SignalLog[]>([]);
  const [chartType, setChartType] = useState<
    "1" | "3" | "5" | "15" | "30" | "60" | "240"
  >("15");
  const [orderHistories, setOrderHistories] = useState<OrderHistory[]>([]);
  const params = useParams<{ market: string }>();
  const marketCode = params.market;
  const [ticker, setTicker] = useState<Ticker>();
  const [marketDetails, setMarketDetails] = useState<MarketType | null>(null);
  const [expandedSignalIndex, setExpandedSignalIndex] = useState<number | null>(
    null
  );
  const { theme, systemTheme } = useTheme();
  const isDarkMode =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  const fetchMarketDetails = useCallback(async () => {
    if (!marketCode) return;
    try {
      const allMarkets: MarketType[] = await fetchMarkets();
      const currentMarket = allMarkets.find((m) => m.market === marketCode);
      setMarketDetails(currentMarket || null);
    } catch (error) {
      console.error("Error fetching market details:", error);
      setMarketDetails(null);
    }
  }, [marketCode]);

  const fetchTicker = useCallback(async () => {
    if (!marketCode) return;
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
      }/api/ticker?market=${marketCode}`
    );
    if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);
    const data = await response.json();
    setTicker(data);
  }, [marketCode]);

  const fetchChartData = useCallback(async () => {
    try {
      if (!marketCode) return;
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
        }/api/candles/minutes/${chartType}?market=${marketCode}&count=100`
      );
      if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);
      const data = await response.json();
      setChartData([...data].reverse());
    } catch (error) {
      console.error("차트 데이터 로딩 실패:", error);
    }
  }, [marketCode, chartType]);

  const fetchClosedOrders = useCallback(async () => {
    try {
      if (!marketCode) return;
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
        }/api/orders/closed?market=${marketCode}`
      );
      if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);
      setOrderHistories(await response.json());
    } catch (error) {
      console.error("종료된 주문 조회 실패:", error);
    }
  }, [marketCode]);

  const fetchSignalHistoryData = useCallback(async () => {
    if (!marketCode) return;
    try {
      setSignalHistory(await getMarketSignalHistory(marketCode, 50));
    } catch (error) {
      console.error(`Error fetching signal history for ${marketCode}:`, error);
      setSignalHistory([]);
    }
  }, [marketCode]);

  useEffect(() => {
    if (marketCode) {
      fetchMarketDetails();
      fetchTicker();
      fetchChartData();
      fetchClosedOrders();
      fetchSignalHistoryData();
      const interval = setInterval(() => {
        fetchTicker();
        fetchChartData();
        fetchClosedOrders();
        fetchSignalHistoryData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [
    marketCode,
    chartType,
    fetchMarketDetails,
    fetchTicker,
    fetchChartData,
    fetchClosedOrders,
    fetchSignalHistoryData,
  ]);

  const getChartOptions = useCallback(() => {
    const series = [
      {
        name: "캔들",
        data: chartData.map((c) => ({
          x: new Date(c.candle_date_time_kst),
          y: [c.opening_price, c.high_price, c.low_price, c.trade_price],
        })),
      },
    ];
    const annotations = {
      points: orderHistories
        .filter((o) => parseFloat(o.executed_volume) > 0)
        .map((o) => {
          const t = new Date(o.created_at),
            p = parseFloat(o.executed_funds) / parseFloat(o.executed_volume);
          return {
            x: t.getTime(),
            y: p,
            marker: {
              size: 8,
              fillColor: o.side === "bid" ? "#00B746" : "#FF4560",
              strokeColor: "#fff",
              radius: 2,
            },
            label: {
              borderColor: o.side === "bid" ? "#00B746" : "#FF4560",
              text: `${
                o.side === "bid" ? "매수" : "매도"
              } @ ${p.toLocaleString()}`,
              orientation: "horizontal",
              offsetY: o.side === "bid" ? -15 : 15,
              style: {
                background: o.side === "bid" ? "#00B746" : "#FF4560",
                color: "#fff",
                fontSize: "10px",
                fontWeight: "bold",
                padding: { left: 5, right: 5, top: 2, bottom: 2 },
              },
            },
          };
        }),
    };
    const textColor = isDarkMode ? "#E5E7EB" : "#374151",
      gridColor = isDarkMode ? "#4B5563" : "#E5E7EB",
      bgColor = isDarkMode ? "#1F2937" : "#FFFFFF";
    const options: ApexOptions = {
      chart: {
        type: "candlestick",
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        animations: { enabled: false },
        foreColor: textColor,
        background: bgColor,
      },
      title: {
        style: { fontSize: "18px", fontWeight: "bold", color: textColor },
      },
      annotations,
      xaxis: {
        type: "datetime",
        labels: {
          formatter: (v, ts) =>
            ts
              ? new Date(ts).toLocaleString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : v,
          style: { fontSize: "12px", fontWeight: "500", colors: textColor },
          rotateAlways: false,
        },
        axisBorder: { color: gridColor },
        axisTicks: { color: gridColor },
      },
      yaxis: {
        tooltip: { enabled: true },
        labels: {
          formatter: (v) => v.toLocaleString("ko-KR"),
          style: { fontSize: "12px", fontWeight: "500", colors: [textColor] },
        },
        axisBorder: { show: true, color: gridColor },
        axisTicks: { show: true, color: gridColor },
      },
      tooltip: {
        shared: false,
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const d = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
          if (!d || !d.x || !d.y || d.y.length < 4) return "";
          const dt = new Date(d.x).toLocaleString("ko-KR"),
            o = d.y[0].toLocaleString("ko-KR"),
            h = d.y[1].toLocaleString("ko-KR"),
            l = d.y[2].toLocaleString("ko-KR"),
            c = d.y[3].toLocaleString("ko-KR");
          return `<div class="apexcharts-tooltip-box p-2 text-xs sm:text-sm" style="background:${
            isDarkMode ? "#374151" : "#F9FAFB"
          };color:${isDarkMode ? "#F9FAFB" : "#111827"};border:1px solid ${
            isDarkMode ? "#6B7280" : "#D1D5DB"
          };border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);"><div class="font-bold mb-1">${dt}</div><div class="grid grid-cols-2 gap-x-2"><div>시가:</div><div class="text-right">${o}</div><div>고가:</div><div class="text-right">${h}</div><div>저가:</div><div class="text-right">${l}</div><div>종가:</div><div class="text-right font-bold">${c}</div></div></div>`;
        },
        theme: isDarkMode ? "dark" : "light",
        style: { fontSize: "12px" },
      },
      plotOptions: {
        candlestick: {
          colors: { upward: "#00B746", downward: "#FF4560" },
          wick: { useFillColor: true },
        },
      },
      grid: {
        borderColor: gridColor,
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      legend: { show: false },
      theme: { mode: isDarkMode ? "dark" : "light" },
    };
    return { options, series };
  }, [chartData, orderHistories, isDarkMode]);

  const chartOptionsAndSeries = useMemo(
    () =>
      chartData.length > 0
        ? getChartOptions()
        : { options: {} as ApexOptions, series: [] },
    [chartData, getChartOptions]
  );

  const getScoreChartOptions = useMemo(() => {
    const series = [
      {
        name: "매매 점수",
        data: signalHistory
          .map((l) => ({ x: new Date(l.timestamp).getTime(), y: l.score }))
          .reverse(),
      },
    ];
    const textColor = isDarkMode ? "#E5E7EB" : "#374151",
      gridColor = isDarkMode ? "#4B5563" : "#E5E7EB",
      bgColor = isDarkMode ? "#1F2937" : "#FFFFFF";
    const options: ApexOptions = {
      chart: {
        type: "line",
        height: 250,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        animations: { enabled: true, dynamicAnimation: { speed: 500 } },
        foreColor: textColor,
        background: bgColor,
      },
      colors: ["#FFD700"],
      stroke: { curve: "smooth", width: 2 },
      xaxis: {
        type: "datetime",
        labels: {
          formatter: (v, ts) =>
            ts
              ? new Date(ts).toLocaleString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : v,
          style: { colors: textColor, fontSize: "10px" },
        },
        axisBorder: { color: gridColor },
        axisTicks: { color: gridColor },
      },
      yaxis: {
        title: { text: "점수", style: { color: textColor, fontSize: "12px" } },
        min: 0,
        max: 100,
        labels: { style: { colors: textColor, fontSize: "10px" } },
        axisBorder: { color: gridColor },
        axisTicks: { color: gridColor },
      },
      grid: {
        borderColor: gridColor,
        row: { colors: [bgColor, "transparent"], opacity: 0.5 },
      },
      tooltip: {
        theme: isDarkMode ? "dark" : "light",
        x: { format: "yyyy/MM/dd HH:mm" },
        y: { formatter: (v) => v.toFixed(0) + "점" },
      },
      markers: { size: 3, hover: { size: 5 } },
    };
    return { series, options };
  }, [signalHistory, isDarkMode]);

  if (!marketCode || !ticker || !marketDetails) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-center text-gray-500 dark:text-gray-300">
            코인 정보를 불러오는 중이거나 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  const { options, series } = chartOptionsAndSeries;
  const { series: scoreSeries, options: scoreOptions } = getScoreChartOptions;

  const TableHeaderCell = ({ children }: { children: React.ReactNode }) => (
    <th
      scope="col"
      className="px-3 py-2 sm:px-4 sm:py-3 text-left text-[0.7rem] sm:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
    >
      {children}
    </th>
  );

  const TableCell = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <td
      className={`px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-[0.75rem] sm:text-sm text-gray-800 dark:text-gray-100 ${className}`}
    >
      {children}
    </td>
  );

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-0">
            {marketDetails.korean_name} ({marketCode})
          </h1>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              {new Intl.NumberFormat("ko-KR").format(ticker.trade_price)}원
            </p>
            <p
              className={`text-base sm:text-lg ${
                ticker.signed_change_rate > 0
                  ? "text-green-600"
                  : ticker.signed_change_rate < 0
                  ? "text-red-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {(ticker.signed_change_rate * 100).toFixed(2)}% (
              {ticker.signed_change_rate > 0 ? "+" : ""}
              {new Intl.NumberFormat("ko-KR").format(
                ticker.trade_price -
                  ticker.trade_price / (1 + ticker.signed_change_rate)
              )}
              )
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4">
          {[
            {
              label: "거래대금(24H)",
              value: ticker.acc_trade_price_24h,
              format: "currency",
            },
            {
              label: "고가(24H)",
              value: ticker.high_price,
              format: "currency",
            },
            { label: "저가(24H)", value: ticker.low_price, format: "currency" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded-md"
            >
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {item.label}
              </p>
              <p className="font-medium text-sm sm:text-base text-gray-800 dark:text-white">
                {item.format === "currency"
                  ? new Intl.NumberFormat("ko-KR", {
                      maximumFractionDigits: 0,
                    }).format(item.value) + "원"
                  : item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-0">
            {marketCode} ({chartType}분 캔들)
          </h2>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {(["1", "3", "5", "15", "30", "60", "240"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-2 py-1 sm:px-3 text-[0.7rem] sm:text-sm rounded ${
                  chartType === type
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {type}분
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 && typeof window !== "undefined" ? (
          <div className="h-80 sm:h-96 rounded-lg">
            <ReactApexChart
              options={options}
              series={series}
              type="candlestick"
              height="100%"
            />
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 p-4 text-base">
            차트 데이터를 불러오는 중이거나 표시할 데이터가 없습니다.
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white">
          매매 점수 변화 (최근{" "}
          {signalHistory.length > 0 ? signalHistory.length : "-"}개)
        </h2>
        {typeof window !== "undefined" &&
        scoreSeries &&
        scoreOptions &&
        signalHistory.length > 0 ? (
          <div className="h-64 sm:h-72">
            <ReactApexChart
              options={scoreOptions}
              series={scoreSeries}
              type="line"
              height="100%"
            />
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center p-4">
            매매 점수 기록이 없습니다.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white">
            최근 체결 내역 (최대 20개)
          </h2>
          {orderHistories.filter((o) => parseFloat(o.executed_volume) > 0)
            .length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <TableHeaderCell>시간</TableHeaderCell>
                    <TableHeaderCell>종류</TableHeaderCell>
                    <TableHeaderCell>체결가</TableHeaderCell>
                    <TableHeaderCell>수량</TableHeaderCell>
                    <TableHeaderCell>총액</TableHeaderCell>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orderHistories
                    .filter((o) => parseFloat(o.executed_volume) > 0)
                    .slice(0, 20)
                    .map((o) => {
                      const avgP =
                        parseFloat(o.executed_funds) /
                        parseFloat(o.executed_volume);
                      return (
                        <tr
                          key={o.uuid}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <TableCell>
                            {new Date(o.created_at).toLocaleString("ko-KR", {
                              year: "2-digit",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${
                                o.side === "bid"
                                  ? "text-green-500 dark:text-green-400"
                                  : "text-red-500 dark:text-red-400"
                              }`}
                            >
                              {o.side === "bid" ? "매수" : "매도"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("ko-KR").format(avgP)}
                          </TableCell>
                          <TableCell>
                            {parseFloat(o.executed_volume).toFixed(4)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("ko-KR", {
                              maximumFractionDigits: 0,
                            }).format(parseFloat(o.executed_funds))}
                          </TableCell>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 p-4">
              체결 내역이 없습니다.
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white">
            최근 매매 신호 (최대 50개)
          </h2>
          {signalHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <TableHeaderCell>시간</TableHeaderCell>
                    <TableHeaderCell>신호</TableHeaderCell>
                    <TableHeaderCell>점수</TableHeaderCell>
                    <TableHeaderCell>기준가</TableHeaderCell>
                    <TableHeaderCell>사유</TableHeaderCell>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {signalHistory.map((log, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        expandedSignalIndex === index
                          ? "bg-gray-100 dark:bg-gray-600"
                          : ""
                      }`}
                      onClick={() =>
                        setExpandedSignalIndex(
                          expandedSignalIndex === index ? null : index
                        )
                      }
                    >
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString("ko-KR", {
                          year: "2-digit",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            log.action === "buy"
                              ? "text-green-500 dark:text-green-400"
                              : log.action === "sell"
                              ? "text-red-500 dark:text-red-400"
                              : "text-yellow-500 dark:text-yellow-400"
                          }`}
                        >
                          {log.action.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{log.score.toFixed(0)}</TableCell>
                      <TableCell>
                        {log.price
                          ? new Intl.NumberFormat("ko-KR").format(log.price)
                          : "-"}
                      </TableCell>
                      <TableCell
                        className={`text-left max-w-[150px] sm:max-w-xs ${
                          expandedSignalIndex === index
                            ? "whitespace-pre-wrap break-words"
                            : "truncate"
                        }`}
                      >
                        {log.reason}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 p-4">
              매매 신호 기록이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;
