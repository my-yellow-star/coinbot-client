"use client";

import { ReactNode, useState } from "react";
import CoinPrices from "./CoinPrices";
import { Market, Ticker } from "../types";

interface LayoutProps {
  children: ReactNode;
  markets: Market[];
  tickers: Ticker[];
}

export default function Layout({ children, markets, tickers }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* 모바일 메뉴 토글 버튼 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 p-3 rounded-full bg-blue-500 text-white shadow-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {sidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* 사이드바 - 코인 시세 */}
      <div
        className={`
        fixed md:relative inset-y-0 left-0 transform 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 transition duration-200 ease-in-out
        w-64 bg-white dark:bg-gray-800 overflow-y-auto
        md:block z-30 border-r border-gray-200 dark:border-gray-700
      `}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">코인 시세</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          <CoinPrices markets={markets} tickers={tickers} isSidebar={true} />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
