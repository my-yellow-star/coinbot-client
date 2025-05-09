"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Ticker, OrderHistory } from "../types";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";

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

interface ApexTooltipParams {
  seriesIndex: number;
  dataPointIndex: number;
  w: {
    globals: {
      initialSeries: {
        data: {
          x: number;
          y: number[];
        }[];
      }[];
    };
  };
}

const CoinDetail = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartType, setChartType] = useState<
    "1" | "3" | "5" | "15" | "30" | "60" | "240"
  >("15");
  const [orderHistories, setOrderHistories] = useState<OrderHistory[]>([]);
  const params = useParams();
  const market = params.market;
  const [ticker, setTicker] = useState<Ticker>();
  const { theme, systemTheme } = useTheme();
  const isDarkMode =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  const fetchTicker = useCallback(async () => {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
      }/api/ticker?market=${market}`
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    setTicker(data);
  }, [market]);

  // 차트 데이터 가져오기 (useCallback으로 최적화)
  const fetchChartData = useCallback(async () => {
    try {
      if (!market) return;
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
        }/api/candles/minutes/${chartType}?market=${market}&count=100`
      );

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      const sortedData = [...data].reverse(); // 시간순 정렬을 위해 reverse (불변성 유지)
      setChartData(sortedData);
    } catch (error) {
      console.error("차트 데이터 로딩 실패:", error);
    }
  }, [market, chartType]);

  const fetchClosedOrders = useCallback(async () => {
    try {
      if (!market) return;

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
        }/api/orders/closed?market=${market}`
      );

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      setOrderHistories(data);
    } catch (error) {
      console.error("종료된 주문 조회 실패:", error);
    }
  }, [market]);

  useEffect(() => {
    fetchChartData();
    fetchClosedOrders();
    fetchTicker();

    const interval = setInterval(() => {
      fetchChartData();
      fetchClosedOrders();
      fetchTicker();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchChartData, fetchClosedOrders, fetchTicker]);

  // ApexCharts 설정 (useMemo로 최적화)
  const getChartOptions = useCallback(() => {
    const series = [
      {
        name: "캔들",
        data: chartData.map((candle) => ({
          x: new Date(candle.candle_date_time_kst),
          y: [
            candle.opening_price,
            candle.high_price,
            candle.low_price,
            candle.trade_price,
          ],
        })),
      },
    ];

    // 매수/매도 주문 내역을 차트 마커로 표시
    const annotations = {
      points: orderHistories
        .filter((order) => parseFloat(order.executed_volume) > 0) // 체결된 주문만 표시
        .map((order) => {
          const orderTime = new Date(order.created_at);
          const price =
            parseFloat(order.price) / parseFloat(order.executed_volume);

          return {
            x: orderTime.getTime(),
            y: price,
            marker: {
              size: 8, // 마커 크기 증가
              fillColor: order.side === "bid" ? "#00B746" : "#FF4560",
              strokeColor: "#fff",
              radius: 2,
            },
            label: {
              borderColor: order.side === "bid" ? "#00B746" : "#FF4560",
              text: order.side === "bid" ? "매수" : "매도",
              style: {
                background: order.side === "bid" ? "#00B746" : "#FF4560",
                color: "#fff",
                fontSize: "12px", // 폰트 크기 증가
                fontWeight: "bold",
                padding: {
                  left: 5,
                  right: 5,
                  top: 2,
                  bottom: 2,
                },
              },
            },
          };
        }),
    };

    const textColor = isDarkMode ? "#E5E7EB" : "#374151";
    const gridColor = isDarkMode ? "#4B5563" : "#E5E7EB";
    const bgColor = isDarkMode ? "#1F2937" : "#FFFFFF";

    const options: ApexOptions = {
      chart: {
        type: "candlestick" as const,
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
        animations: {
          enabled: false,
        },
        foreColor: textColor, // 기본 텍스트 색상 설정
        background: bgColor,
      },
      title: {
        text: `${market} (${chartType}분 캔들)`,
        align: "left",
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          color: textColor,
        },
      },
      annotations: annotations,
      xaxis: {
        type: "datetime",
        labels: {
          formatter: function (value: string, timestamp?: number) {
            if (timestamp) {
              return new Date(timestamp).toLocaleString("ko-KR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            }
            return value;
          },
          style: {
            fontSize: "13px",
            fontWeight: "500",
            colors: textColor,
          },
          rotateAlways: false,
        },
        axisBorder: {
          color: gridColor,
        },
        axisTicks: {
          color: gridColor,
        },
      },
      yaxis: {
        tooltip: {
          enabled: true,
        },
        labels: {
          formatter: (value) => {
            return value.toLocaleString("ko-KR");
          },
          style: {
            fontSize: "13px",
            fontWeight: "500",
            colors: [textColor],
          },
        },
      },
      tooltip: {
        shared: true,
        custom: function ({
          seriesIndex,
          dataPointIndex,
          w,
        }: ApexTooltipParams) {
          const data =
            w.globals.initialSeries[seriesIndex].data[dataPointIndex];
          const date = new Date(data.x).toLocaleString("ko-KR");
          const o = data.y[0].toLocaleString("ko-KR");
          const h = data.y[1].toLocaleString("ko-KR");
          const l = data.y[2].toLocaleString("ko-KR");
          const c = data.y[3].toLocaleString("ko-KR");

          return `
            <div class="apexcharts-tooltip-box p-2 text-base" style="background: ${
              isDarkMode ? "#374151" : "#F9FAFB"
            }; color: ${
            isDarkMode ? "#F9FAFB" : "#111827"
          }; border: 1px solid ${
            isDarkMode ? "#6B7280" : "#D1D5DB"
          }; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
              <div class="font-bold mb-1">${date}</div>
              <div class="grid grid-cols-2 gap-x-2">
                <div>시가:</div><div class="text-right">${o}원</div>
                <div>고가:</div><div class="text-right">${h}원</div>
                <div>저가:</div><div class="text-right">${l}원</div>
                <div>종가:</div><div class="text-right font-bold">${c}원</div>
              </div>
            </div>
          `;
        },
        theme: isDarkMode ? "dark" : "light",
        style: {
          fontSize: "14px",
        },
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: "#00B746",
            downward: "#FF4560",
          },
          wick: {
            useFillColor: true,
          },
        },
      },
      grid: {
        borderColor: gridColor,
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      legend: {
        labels: {
          colors: textColor,
        },
      },
      theme: {
        mode: isDarkMode ? "dark" : "light",
      },
    };

    return { options, series };
  }, [chartData, chartType, market, orderHistories, isDarkMode]);

  const chartOptionsAndSeries = useMemo(() => {
    return chartData.length > 0
      ? getChartOptions()
      : { options: {} as ApexOptions, series: [] };
  }, [chartData, getChartOptions]);

  if (!market || !ticker) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="text-center text-gray-500">
          코인 정보를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const { options, series } = chartOptionsAndSeries;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{market}</h1>

          <div className="text-right">
            <p className="text-3xl font-bold">
              {new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: "KRW",
              }).format(ticker.trade_price)}
            </p>
            <p
              className={`text-lg ${
                ticker.signed_change_rate > 0
                  ? "text-green-600"
                  : ticker.signed_change_rate < 0
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {(ticker.signed_change_rate * 100).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-500">거래대금 (24H)</p>
            <p className="font-medium">
              {new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: "KRW",
                maximumFractionDigits: 0,
              }).format(ticker.acc_trade_price_24h)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-500">고가 (24H)</p>
            <p className="font-medium">
              {new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: "KRW",
              }).format(ticker.high_price)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-500">저가 (24H)</p>
            <p className="font-medium">
              {new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: "KRW",
              }).format(ticker.low_price)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">가격 차트</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setChartType("1")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "1"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              1분
            </button>
            <button
              onClick={() => setChartType("3")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "3"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              3분
            </button>
            <button
              onClick={() => setChartType("5")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "5"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              5분
            </button>
            <button
              onClick={() => setChartType("15")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "15"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              15분
            </button>
            <button
              onClick={() => setChartType("30")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "30"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              30분
            </button>
            <button
              onClick={() => setChartType("60")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "60"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              60분
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-96 rounded-lg">
            <ReactApexChart
              options={options}
              series={series}
              type="candlestick"
              height={380}
            />
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 p-4 text-lg">
            차트 데이터를 불러올 수 없습니다.
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">이 코인의 최근 주문 내역</h2>
        {orderHistories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    주문 유형
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    주문 가격
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    당시 시장가
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    가격차이
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    수량
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    날짜
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orderHistories.map((order) => {
                  const orderPrice = parseFloat(order.price);
                  const marketPrice =
                    orderPrice / parseFloat(order.executed_volume);
                  const priceDiff =
                    ((ticker.trade_price - marketPrice) / marketPrice) * 100;

                  return (
                    <tr
                      key={order.uuid}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.side === "bid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.side === "bid" ? "매수" : "매도"}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {order.ord_type === "limit"
                            ? "지정가"
                            : order.ord_type === "price"
                            ? "시장가(매수)"
                            : order.ord_type === "market"
                            ? "시장가(매도)"
                            : "최유리"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Intl.NumberFormat("ko-KR", {
                          style: "currency",
                          currency: "KRW",
                        }).format(orderPrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Intl.NumberFormat("ko-KR", {
                          style: "currency",
                          currency: "KRW",
                        }).format(Number(marketPrice))}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {priceDiff !== null ? (
                          <span
                            className={
                              priceDiff > 0
                                ? "text-green-600"
                                : priceDiff < 0
                                ? "text-red-600"
                                : "text-gray-500"
                            }
                          >
                            {priceDiff > 0 ? "+" : ""}
                            {priceDiff.toFixed(2)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {parseFloat(
                          order.executed_volume || order.volume
                        ).toFixed(8)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.state === "wait"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {order.state === "wait" ? "대기" : "체결"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString("ko-KR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 p-4">
            이 코인에 대한 주문 내역이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
};

export default CoinDetail;
