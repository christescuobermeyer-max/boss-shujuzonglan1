import { describe, expect, it } from "vitest";
import {
  AFTERSALES_PERSON_FILTERS,
  buildAftersalesEmployeeRows,
  getDefaultAftersalesDateKey,
  buildWorkflowProgressRows,
  filterAftersalesRecords,
  formatOpenApiDateTime,
  getAftersalesShopCounts,
  getRecentAftersalesRecords,
  type AftersalesDailyRecordsPayload
} from "@/lib/mobile-work-boards";

describe("mobile work board helpers", () => {
  it("按待处理数量排序运营工作进度", () => {
    const result = buildWorkflowProgressRows({
      totalPendingShops: 9,
      generatedAt: "2026-06-25T03:20:00.000Z",
      operatorStats: [
        {
          operatorName: "王涛",
          pendingShopCount: 2,
          flowPendingShopCount: 1,
          patrolPendingShopCount: 1
        },
        {
          operatorName: "",
          pendingShopCount: 7,
          flowPendingShopCount: 4,
          patrolPendingShopCount: 3
        }
      ]
    });

    expect(result).toEqual([
      {
        operatorName: "未分配",
        pendingShopCount: 7,
        flowPendingShopCount: 4,
        patrolPendingShopCount: 3
      },
      {
        operatorName: "王涛",
        pendingShopCount: 2,
        flowPendingShopCount: 1,
        patrolPendingShopCount: 1
      }
    ]);
  });

  it("按动作数量排序售后人员并提取最近记录", () => {
    const payload = {
      dateKey: "2026-06-25",
      totalCount: 3,
      generatedAt: "2026-06-25T03:25:00.000Z",
      employees: [
        {
          operatorName: "售后一",
          actionCount: 1,
          shopCount: 1,
          records: [
            {
              shopName: "A店",
              merchantId: "1",
              deliveryPlatform: "美团餐饮",
              shopStatus: "正常",
              actionType: "phone_followup",
              actionLabel: "电话跟进",
              operatorName: "售后一",
              note: "已沟通",
              createdAt: "2026-06-25T02:00:00.000Z"
            }
          ]
        },
        {
          operatorName: "售后二",
          actionCount: 2,
          shopCount: 2,
          records: [
            {
              shopName: "B店",
              merchantId: "2",
              deliveryPlatform: "饿了么餐饮",
              shopStatus: "新店",
              actionType: "dianjin_recharge",
              actionLabel: "点金充值",
              operatorName: "售后二",
              note: "充值完成",
              rechargeAmount: 80,
              createdAt: "2026-06-25T03:00:00.000Z"
            }
          ]
        }
      ]
    };

    expect(buildAftersalesEmployeeRows(payload).map((item) => item.operatorName)).toEqual([
      "售后二",
      "售后一"
    ]);
    expect(getRecentAftersalesRecords(payload, 1)).toEqual([
      expect.objectContaining({
        shopName: "B店",
        actionLabel: "点金充值",
        rechargeAmount: 80
      })
    ]);
  });

  it("售后每日记录默认返回当日全部内容", () => {
    const payload = {
      dateKey: "2026-06-25",
      totalCount: 9,
      generatedAt: "2026-06-25T03:25:00.000Z",
      employees: [
        {
          operatorName: "售后",
          actionCount: 9,
          shopCount: 9,
          records: Array.from({ length: 9 }, (_, index) => ({
            shopName: `${index + 1}店`,
            merchantId: `${index + 1}`,
            deliveryPlatform: "美团餐饮",
            shopStatus: "正常",
            actionType: "phone_followup",
            actionLabel: "电话跟进",
            operatorName: "售后",
            note: `第${index + 1}条`,
            createdAt: `2026-06-25T${String(index).padStart(2, "0")}:00:00.000Z`
          }))
        }
      ]
    };

    expect(getRecentAftersalesRecords(payload)).toHaveLength(9);
  });

  it("格式化开放 API 时间为手机端更新时间", () => {
    expect(formatOpenApiDateTime("2026-06-25T03:20:00.000Z")).toMatch(/\d{2}:\d{2}/);
    expect(formatOpenApiDateTime("")).toBe("暂无更新时间");
  });

  it("按上海时区默认展示昨天的售后每日工作", () => {
    const result = getDefaultAftersalesDateKey(new Date("2026-06-26T01:30:00+08:00"));

    expect(result).toBe("2026-06-25");
  });

  it("按固定人员筛选售后记录并继承外层人员名称", () => {
    const payload: AftersalesDailyRecordsPayload = {
      dateKey: "2026-06-25",
      totalCount: 4,
      generatedAt: "2026-06-25T03:25:00.000Z",
      employees: [
        {
          operatorName: "梁智",
          actionCount: 1,
          shopCount: 1,
          records: [{
            shopName: "梁智店",
            merchantId: "1",
            deliveryPlatform: "美团餐饮",
            shopStatus: "正常",
            actionType: "phone_followup",
            actionLabel: "电话跟进",
            operatorName: "梁智",
            note: "已沟通",
            createdAt: "2026-06-25T01:00:00.000Z"
          }]
        },
        {
          operatorName: "朱雯雯",
          actionCount: 2,
          shopCount: 2,
          records: [
            {
              shopName: "朱雯雯店",
              merchantId: "2",
              deliveryPlatform: "饿了么餐饮",
              shopStatus: "已解约",
              actionType: "reject_termination",
              actionLabel: "驳回解约",
              operatorName: "朱雯雯",
              note: "已驳回",
              createdAt: "2026-06-25T02:00:00.000Z"
            },
            {
              shopName: "继承人员店",
              merchantId: "3",
              deliveryPlatform: "美团餐饮",
              shopStatus: "已解约",
              actionType: "reject_termination",
              actionLabel: "驳回解约",
              operatorName: "",
              note: "继承外层人员",
              createdAt: "2026-06-25T03:00:00.000Z"
            }
          ]
        },
        {
          operatorName: "冯姗姗",
          actionCount: 1,
          shopCount: 1,
          records: [{
            shopName: "冯姗姗店",
            merchantId: "4",
            deliveryPlatform: "美团餐饮",
            shopStatus: "已解约",
            actionType: "reject_termination",
            actionLabel: "驳回解约",
            operatorName: "冯姗姗",
            note: "已驳回",
            createdAt: "2026-06-25T00:00:00.000Z"
          }]
        }
      ]
    };

    expect(AFTERSALES_PERSON_FILTERS.map((item) => item.label)).toEqual([
      "全部",
      "梁智",
      "朱雯雯",
      "冯姗姗"
    ]);
    expect(filterAftersalesRecords(payload, "all").map((item) => item.shopName)).toEqual([
      "继承人员店",
      "朱雯雯店",
      "梁智店",
      "冯姗姗店"
    ]);
    expect(filterAftersalesRecords(payload, "梁智").map((item) => item.shopName)).toEqual([
      "梁智店"
    ]);
    expect(filterAftersalesRecords(payload, "朱雯雯").map((item) => item.shopName)).toEqual([
      "继承人员店",
      "朱雯雯店"
    ]);
    expect(filterAftersalesRecords(payload, "冯姗姗").map((item) => item.shopName)).toEqual([
      "冯姗姗店"
    ]);
  });

  it("按商家编号优先并按店铺名称回退统计去重店铺数", () => {
    const createRecord = (
      operatorName: string,
      merchantId: string,
      shopName: string,
      createdAt: string
    ) => ({
      shopName,
      merchantId,
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      actionType: "phone_followup",
      actionLabel: "电话跟进",
      operatorName,
      note: "已沟通",
      createdAt
    });
    const payload: AftersalesDailyRecordsPayload = {
      dateKey: "2026-06-25",
      totalCount: 6,
      generatedAt: "2026-06-25T03:25:00.000Z",
      employees: [
        {
          operatorName: "梁智",
          actionCount: 2,
          shopCount: 1,
          records: [
            createRecord("梁智", "100", "同一家店", "2026-06-25T01:00:00.000Z"),
            createRecord("梁智", "100", "同一家店", "2026-06-25T02:00:00.000Z")
          ]
        },
        {
          operatorName: "朱雯雯",
          actionCount: 1,
          shopCount: 1,
          records: [
            createRecord("朱雯雯", "100", "跨人员同店", "2026-06-25T03:00:00.000Z")
          ]
        },
        {
          operatorName: "冯姗姗",
          actionCount: 3,
          shopCount: 1,
          records: [
            createRecord("冯姗姗", "", " 名称店 ", "2026-06-25T04:00:00.000Z"),
            createRecord("冯姗姗", "", "名称店", "2026-06-25T05:00:00.000Z"),
            createRecord("冯姗姗", "", "", "2026-06-25T06:00:00.000Z")
          ]
        }
      ]
    };

    expect(getAftersalesShopCounts(payload)).toEqual({
      all: 2,
      梁智: 1,
      朱雯雯: 1,
      冯姗姗: 1
    });
  });
});
