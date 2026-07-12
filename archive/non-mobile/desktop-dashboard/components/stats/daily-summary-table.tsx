"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailySummaryRow } from "@/lib/stats/daily-summary-rows";

const ROWS_PER_PAGE = 10;

function formatAmount(value: number) {
  return `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function DailySummaryTable({ rows }: { rows: DailySummaryRow[] }) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return rows.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [currentPage, rows]);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="daily-summary-shell">
      <div className="daily-summary-table-wrap">
        <table className="daily-summary-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>每日抽点店铺数</th>
              <th>每日回款金额</th>
              <th>武汉累计回款金额</th>
              <th>美团回款金额</th>
              <th>饿了么回款金额</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length > 0 ? (
              pageRows.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{row.dailyPointShopCount}</td>
                  <td>{formatAmount(row.totalAmount)}</td>
                  <td>{formatAmount(row.wuhanAmount)}</td>
                  <td>{formatAmount(row.meituanAmount)}</td>
                  <td>{formatAmount(row.elemeAmount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="daily-summary-empty">
                  当前月份暂无逐日回款明细
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="daily-summary-pagination">
        <button
          type="button"
          className="page-btn"
          disabled={currentPage <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          上一页
        </button>
        <div className="page-number-list">
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`page-number-btn${pageNumber === currentPage ? " active" : ""}`}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="page-btn"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
