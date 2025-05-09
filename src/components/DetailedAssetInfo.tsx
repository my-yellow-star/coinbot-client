import { Account } from "../types";

interface DetailedAssetInfoProps {
  accounts: Account[];
}

export default function DetailedAssetInfo({
  accounts,
}: DetailedAssetInfoProps) {
  // 총 보유 자산 계산 (KRW 기준)
  const totalAsset = accounts.reduce((total, account) => {
    // KRW 계좌는 그대로 더함
    if (account.currency === "KRW") {
      return total + parseFloat(account.balance);
    }

    // 암호화폐의 경우 평균 매수가 * 보유량으로 환산하여 더함
    const value =
      parseFloat(account.balance) * parseFloat(account.avg_buy_price);
    return total + value;
  }, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">상세 자산 정보</h2>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">총 보유 자산</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("ko-KR", {
              style: "currency",
              currency: "KRW",
            }).format(totalAsset)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  화폐
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  보유량
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  잠긴 금액
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  평균 매수가
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  평가금액
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {accounts.map((account) => (
                <tr
                  key={account.currency}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium">{account.currency}</div>
                        <div className="text-sm text-gray-500">
                          {account.unit_currency || "-"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {parseFloat(account.balance).toFixed(8)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {parseFloat(account.locked).toFixed(8)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {account.currency !== "KRW"
                      ? new Intl.NumberFormat("ko-KR", {
                          style: "currency",
                          currency: "KRW",
                        }).format(parseFloat(account.avg_buy_price))
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {account.currency === "KRW"
                      ? new Intl.NumberFormat("ko-KR", {
                          style: "currency",
                          currency: "KRW",
                        }).format(parseFloat(account.balance))
                      : new Intl.NumberFormat("ko-KR", {
                          style: "currency",
                          currency: "KRW",
                        }).format(
                          parseFloat(account.balance) *
                            parseFloat(account.avg_buy_price)
                        )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
