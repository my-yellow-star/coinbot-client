import { Market, OrderHistory } from "../types";

interface DetailedOrdersProps {
  orders: OrderHistory[];
  markets: Market[];
}

export default function DetailedOrders({
  orders,
  markets,
}: DetailedOrdersProps) {
  // 마켓 코드별 이름 매핑 생성
  const marketNameMap = markets.reduce((acc, market) => {
    acc[market.market] = market.korean_name;
    return acc;
  }, {} as Record<string, string>);

  // 최신순으로 정렬
  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">주문 내역</h2>
      </div>

      <div className="p-4">
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
                  주문 유형
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  가격
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  수량
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  체결량
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  체결액
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  수수료
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedOrders.map((order) => {
                const marketName = marketNameMap[order.market] || order.market;
                const orderDate = new Date(order.created_at);
                const price = parseFloat(order.price);
                const volume = parseFloat(order.volume);
                const executed_volume = parseFloat(order.executed_volume);
                const executed_funds = parseFloat(order.executed_funds || "0");
                const fee = parseFloat(order.paid_fee);

                // 주문 유형 한글화
                let orderType = "";
                switch (order.ord_type) {
                  case "limit":
                    orderType = "지정가";
                    break;
                  case "price":
                    orderType = "시장가(매수)";
                    break;
                  case "market":
                    orderType = "시장가(매도)";
                    break;
                  case "best":
                    orderType = "최유리";
                    break;
                  default:
                    orderType = order.ord_type;
                }

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
                    <td className="px-4 py-3 whitespace-nowrap">{orderType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                      }).format(price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {volume.toFixed(8)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {executed_volume.toFixed(8)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                      }).format(executed_funds)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                      }).format(fee)}
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
    </div>
  );
}
