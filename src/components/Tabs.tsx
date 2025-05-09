"use client";

import { ReactNode } from "react";
import { Tab } from "@headlessui/react";

interface TabItem {
  key: string;
  title: string;
  content: ReactNode;
}

interface DashboardTabsProps {
  tabs: TabItem[];
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardTabs({ tabs }: DashboardTabsProps) {
  return (
    <div className="w-full">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/10 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-400 hover:bg-white/[0.12] hover:text-blue-700 dark:hover:text-blue-400"
                )
              }
            >
              {tab.title}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {tabs.map((tab) => (
            <Tab.Panel
              key={tab.key}
              className={classNames("rounded-xl p-3", "focus:outline-none")}
            >
              {tab.content}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
