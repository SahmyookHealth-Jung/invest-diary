/**
 * 미국 주식 영업일(Trading Days) 계산 유틸리티
 * - 주말(토/일) 제외
 * - 미국 공휴일(NYSE 휴장일) 제외
 */

// 2025~2027년 미국 주식 휴장일 (NYSE/NASDAQ 공식)
// 형식: "YYYY-MM-DD"
const US_MARKET_HOLIDAYS: string[] = [
  // 2025
  "2025-01-01", // New Year's Day
  "2025-01-20", // MLK Jr. Day
  "2025-02-17", // Presidents' Day
  "2025-04-18", // Good Friday
  "2025-05-26", // Memorial Day
  "2025-06-19", // Juneteenth
  "2025-07-04", // Independence Day
  "2025-09-01", // Labor Day
  "2025-11-27", // Thanksgiving
  "2025-12-25", // Christmas

  // 2026
  "2026-01-01", // New Year's Day
  "2026-01-19", // MLK Jr. Day
  "2026-02-16", // Presidents' Day
  "2026-04-03", // Good Friday
  "2026-05-25", // Memorial Day
  "2026-06-19", // Juneteenth
  "2026-07-03", // Independence Day (observed)
  "2026-09-07", // Labor Day
  "2026-11-26", // Thanksgiving
  "2026-12-25", // Christmas

  // 2027
  "2027-01-01", // New Year's Day
  "2027-01-18", // MLK Jr. Day
  "2027-02-15", // Presidents' Day
  "2027-03-26", // Good Friday
  "2027-05-31", // Memorial Day
  "2027-06-18", // Juneteenth (observed)
  "2027-07-05", // Independence Day (observed)
  "2027-09-06", // Labor Day
  "2027-11-25", // Thanksgiving
  "2027-12-24", // Christmas (observed)
];

const holidaySet = new Set(US_MARKET_HOLIDAYS);

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 해당 날짜가 영업일(개장일)인지 판별 */
export function isTradingDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // 주말
  return !holidaySet.has(toDateString(date));
}

/** 시작일~종료일 사이의 영업일 수 계산 (시작일 포함, 종료일 미포함) */
export function countTradingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current < endDate) {
    if (isTradingDay(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/** 오늘부터 N개월 후까지의 영업일 수 */
export function tradingDaysInMonths(months: number, from?: Date): number {
  const start = from ? new Date(from) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return countTradingDays(start, end);
}

/**
 * 목표 역산기: 현재 시드 → 목표 금액까지 일일 필요 수익률 계산
 * 복리 공식: targetAmount = seed * (1 + r)^tradingDays
 *          r = (targetAmount / seed)^(1/tradingDays) - 1
 */
export function calcDailyRateNeeded(
  seed: number,
  target: number,
  tradingDays: number
): number {
  if (tradingDays <= 0 || seed <= 0) return 0;
  return Math.pow(target / seed, 1 / tradingDays) - 1;
}

/**
 * 복리 예측기: 시드 + 일일 수익률 → N 영업일 후 잔액
 * balance = seed * (1 + dailyRate)^tradingDays
 */
export function calcCompoundBalance(
  seed: number,
  dailyRate: number,
  tradingDays: number
): number {
  return seed * Math.pow(1 + dailyRate, tradingDays);
}

/** N개월 후까지 영업일 수 + 복리 예측 결과를 한 번에 반환 */
export function forecastBalances(
  seed: number,
  dailyRatePercent: number,
  from?: Date
): { months: number; tradingDays: number; balance: number }[] {
  const dailyRate = dailyRatePercent / 100;
  return [1, 3, 6, 12].map((months) => {
    const td = tradingDaysInMonths(months, from);
    return {
      months,
      tradingDays: td,
      balance: calcCompoundBalance(seed, dailyRate, td),
    };
  });
}
