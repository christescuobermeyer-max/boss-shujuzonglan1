import { Hono } from "hono";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import {
  FinanceQueryError,
  getFinanceMonthlySummary,
  getFinanceTransactions,
  parseFinanceMonthlySummaryQuery,
  parseFinanceTransactionsQuery
} from "../services/finance-expense-service.js";

export const mobileFinanceRoute = new Hono();

function financeErrorResponse(error: unknown) {
  if (error instanceof FinanceQueryError) {
    return {
      status: error.status,
      body: { success: false, error: error.message }
    };
  }

  const message = error instanceof Error ? error.message : "finance service unavailable";
  const isDatabaseError = /mongo|database|timed out|server selection|connection/i.test(message);
  return {
    status: isDatabaseError ? 503 : 500,
    body: {
      success: false,
      error: isDatabaseError ? "财务数据库暂时不可用" : "财务数据暂时无法加载"
    }
  };
}

mobileFinanceRoute.get(
  "/api/mobile/finance/monthly-summary",
  mobileAuthMiddleware,
  async (c) => {
    try {
      const query = parseFinanceMonthlySummaryQuery(c.req.url);
      const data = await getFinanceMonthlySummary(query);
      return c.json({ success: true, data });
    } catch (error) {
      const response = financeErrorResponse(error);
      return c.json(response.body, response.status as 400 | 500 | 503);
    }
  }
);

mobileFinanceRoute.get(
  "/api/mobile/finance/transactions",
  mobileAuthMiddleware,
  async (c) => {
    try {
      const query = parseFinanceTransactionsQuery(c.req.url);
      const data = await getFinanceTransactions(query);
      return c.json({ success: true, data });
    } catch (error) {
      const response = financeErrorResponse(error);
      return c.json(response.body, response.status as 400 | 500 | 503);
    }
  }
);
