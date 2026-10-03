import React from "react";

export default function AdminLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Header Placeholder */}
      <div className="flex items-center justify-between pb-4">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-3.5 w-60 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg hidden sm:block"></div>
      </div>

      {/* 4 Metric Cards Placeholder */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 sm:size-10 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
              <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-6 sm:h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content Card Placeholder */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>

        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-12 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center justify-between px-4"
            >
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
