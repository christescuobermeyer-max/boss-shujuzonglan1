import { buildCityMonthlyPointSummary } from "@/lib/stats/city-opened-point-summary";

type KeyCitySummaryParams = Omit<
  Parameters<typeof buildCityMonthlyPointSummary>[0],
  "cityName"
>;

export function buildKeyCityMonthlyPointSummaries(params: KeyCitySummaryParams) {
  return {
    wuhanMonthlyPointSummary: buildCityMonthlyPointSummary({
      cityName: "武汉",
      ...params
    }),
    yichangMonthlyPointSummary: buildCityMonthlyPointSummary({
      cityName: "宜昌",
      ...params
    })
  };
}
