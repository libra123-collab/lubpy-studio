/**
 * CSV Export Utility for LUBPY STUDIO
 * Exports project & financial data with UTF-8 BOM so Excel opens Vietnamese text cleanly.
 */

import { formatVND } from './currency';

export interface ExportProjectRow {
  id: string; // Mã đồ án
  title: string; // Tên đề tài
  clientName: string; // Tên học viên
  school?: string; // Trường
  priceVnd: number; // Doanh thu
  devCommissionRate?: number; // % Dev
  devCostVnd?: number; // Chi phí Dev
  netProfitVnd?: number; // Lợi nhuận Ròng
  status: string; // Trạng thái
  defenseDate?: string; // Hạn bảo vệ
  assignedDev?: string; // Dev phụ trách
}

export function exportProjectsToCSV(
  projects: ExportProjectRow[],
  filename: string = `lubpy_báo_cáo_đồ_án_${new Date().toISOString().slice(0, 10)}.csv`
): void {
  const headers = [
    'Mã Đồ Án',
    'Tên Đề Tài',
    'Tên Học Viên',
    'Trường / Đơn Vị',
    'Doanh Thu (VNĐ)',
    '% Thù Lao Dev',
    'Chi Phí Dev (VNĐ)',
    'Lợi Nhuận Ròng (VNĐ)',
    'Trạng Thái',
    'Hạn Bảo Vệ',
    'Dev Phụ Trách'
  ];

  const rows = projects.map(p => {
    const rate = p.devCommissionRate !== undefined ? p.devCommissionRate : 65;
    const devCost = p.devCostVnd !== undefined ? p.devCostVnd : Math.round((p.priceVnd || 0) * (rate / 100));
    const netProfit = p.netProfitVnd !== undefined ? p.netProfitVnd : (p.priceVnd || 0) - devCost;

    return [
      `"${(p.id || '').replace(/"/g, '""')}"`,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(p.clientName || '').replace(/"/g, '""')}"`,
      `"${(p.school || '').replace(/"/g, '""')}"`,
      `"${formatVND(p.priceVnd)}"`,
      `"${rate}%"`,
      `"${formatVND(devCost)}"`,
      `"${formatVND(netProfit)}"`,
      `"${(p.status || '').replace(/"/g, '""')}"`,
      `"${(p.defenseDate || '').replace(/"/g, '""')}"`,
      `"${(p.assignedDev || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  // Include UTF-8 BOM so Excel opens Vietnamese characters correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportFinancialSummaryCSV(
  projects: ExportProjectRow[],
  filename: string = `lubpy_báo_cáo_tài_chính_${new Date().toISOString().slice(0, 10)}.csv`
): void {
  exportProjectsToCSV(projects, filename);
}
