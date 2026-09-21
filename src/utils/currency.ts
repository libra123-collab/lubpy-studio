/**
 * Centralized Currency & Financial Calculation Helpers for LUBPY STUDIO
 */

export function formatVND(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 ₫';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(num).replace('VND', '₫').trim();
}

export function formatVNDShort(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 ₫';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)} Tỷ ₫`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} Tr ₫`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(0)}k ₫`;
  }
  return `${num} ₫`;
}

export function parseVND(val: string): number {
  if (!val) return 0;
  const cleaned = val.toString().replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

export interface FinancialSummary {
  totalRevenueVnd: number;
  totalDevCostVnd: number;
  netProfitVnd: number;
  avgDevCommissionRate: number;
}

export function calcProjectFinancials(
  priceVnd: number, 
  devCommissionRate: number = 65
): { devCostVnd: number; netProfitVnd: number; rate: number } {
  const rate = Math.max(40, Math.min(80, devCommissionRate || 65));
  const devCostVnd = Math.round(priceVnd * (rate / 100));
  const netProfitVnd = priceVnd - devCostVnd;
  return { devCostVnd, netProfitVnd, rate };
}

export function calcTotalFinancials(
  projects: Array<{ priceVnd?: number; devCommissionRate?: number; status?: string }>
): FinancialSummary {
  let totalRevenueVnd = 0;
  let totalDevCostVnd = 0;
  let totalRateSum = 0;
  let count = 0;

  projects.forEach(p => {
    const price = p.priceVnd || 0;
    const rate = p.devCommissionRate !== undefined ? p.devCommissionRate : 65;
    const { devCostVnd } = calcProjectFinancials(price, rate);
    
    totalRevenueVnd += price;
    totalDevCostVnd += devCostVnd;
    totalRateSum += rate;
    count++;
  });

  const netProfitVnd = totalRevenueVnd - totalDevCostVnd;
  const avgDevCommissionRate = count > 0 ? Math.round(totalRateSum / count) : 65;

  return {
    totalRevenueVnd,
    totalDevCostVnd,
    netProfitVnd,
    avgDevCommissionRate
  };
}
