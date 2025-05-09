import { Market, Ticker } from "../types";
import { useState } from "react";

interface CoinPricesProps {
  markets: Market[];
  tickers: Ticker[];
  isSidebar?: boolean;
}

export default function CoinPrices({
  markets,
  tickers,
  isSidebar = false,
}: CoinPricesProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // 마켓 코드별 이름 매핑 생성
  const marketNameMap = markets.reduce((acc, market) => {
    acc[market.market] = market.korean_name;
    return acc;
  }, {} as Record<string, string>);

  // 매핑된 시세 정보 생성
  const tickerData = tickers.map((ticker) => {
    const marketName = marketNameMap[ticker.market] || ticker.market;
    return { ...ticker, marketName };
  });

  // 거래대금 기준으로 정렬
  const sortedData = [...tickerData].sort(
    (a, b) => b.acc_trade_price_24h - a.acc_trade_price_24h
  );

  // 검색어로 필터링
  const filteredData = sortedData.filter((ticker) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      ticker.marketName.toLowerCase().includes(lowerSearchTerm) ||
      ticker.market.toLowerCase().includes(lowerSearchTerm)
    );
  });

  // 검색 입력 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 사이드바용 간소화된 버전
  if (isSidebar) {
    return (
      <div className="overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="코인 검색..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredData.map((ticker) => (
            <li
              key={ticker.market}
              className="py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{ticker.marketName}</p>
                  <p className="text-xs text-gray-500">{ticker.market}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                      maximumFractionDigits: 0,
                    }).format(ticker.trade_price)}
                  </p>
                  <p
                    className={`text-xs ${
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
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 기존 테이블 버전
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">코인 시세</h2>
        <div className="w-1/3">
          <input
            type="text"
            placeholder="코인 검색..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                종목
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                현재가
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                변동률
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                거래대금 (24H)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                고가
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                저가
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((ticker) => (
              <tr
                key={ticker.market}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-2">
                      <div className="font-medium">{ticker.marketName}</div>
                      <div className="text-sm text-gray-500">
                        {ticker.market}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Intl.NumberFormat("ko-KR", {
                    style: "currency",
                    currency: "KRW",
                  }).format(ticker.trade_price)}
                </td>
                <td
                  className={`px-4 py-3 whitespace-nowrap ${
                    ticker.signed_change_rate > 0
                      ? "text-green-600"
                      : ticker.signed_change_rate < 0
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {(ticker.signed_change_rate * 100).toFixed(2)}%
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Intl.NumberFormat("ko-KR", {
                    style: "currency",
                    currency: "KRW",
                    maximumFractionDigits: 0,
                  }).format(ticker.acc_trade_price_24h)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Intl.NumberFormat("ko-KR", {
                    style: "currency",
                    currency: "KRW",
                  }).format(ticker.high_price)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Intl.NumberFormat("ko-KR", {
                    style: "currency",
                    currency: "KRW",
                  }).format(ticker.low_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
