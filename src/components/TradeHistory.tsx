// 이 파일은 더 이상 사용하지 않습니다.
// 더 상세한 주문 내역을 표시하는 DetailedOrders.tsx로 대체되었습니다.

import { Market, OrderHistory } from "../types";

interface TradeHistoryProps {
  orders: OrderHistory[];
  markets: Market[];
}

export default function TradeHistory({ orders, markets }: TradeHistoryProps) {
  // 마켓 코드별 이름 매핑 생성
  const marketNameMap = markets.reduce((acc, market) => {
    acc[market.market] = market.korean_name;
    return acc;
  }, {} as Record<string, string>);

  // 최근 거래 내역만 표시 (최대 10개)
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">거래 내역</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                시간
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                종목
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                타입
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                가격
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                수량
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                거래금액
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                상태
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {recentOrders.map((order) => {
              const marketName = marketNameMap[order.market] || order.market;
              const orderDate = new Date(order.created_at);
              const executed_funds = parseFloat(order.executed_funds || "0");
              const executed_volume = parseFloat(order.executed_volume || "0");
              const price = parseFloat(order.price);

              return (
                <tr
                  key={order.uuid}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {orderDate.toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium">{marketName}</div>
                        <div className="text-sm text-gray-500">
                          {order.market}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap ${
                      order.side === "bid" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {order.side === "bid" ? "매수" : "매도"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Intl.NumberFormat("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                    }).format(price)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {executed_volume.toFixed(8)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Intl.NumberFormat("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                    }).format(executed_funds || price * executed_volume)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.state === "wait"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {order.state === "wait" ? "대기" : "주시"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
