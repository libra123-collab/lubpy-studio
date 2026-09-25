/**
 * Accounting Export Utility for LUBPY FINANCE
 * Powered by SheetJS (xlsx) for TRUE AutoFit Column Width in Microsoft Excel & Google Sheets,
 * plus UTF-8 BOM CSV exports with balanced visual alignment and Vietnamese diacritics.
 */

import * as XLSX from 'xlsx';
import { AccountantStaff } from './staffSyncStore';
import { User } from '../types';

export interface CashflowSummaryData {
  totalRevenue: number;
  totalDepositCollected: number;
  totalPendingBalance: number;
  totalDevPayouts: number;
  netRevenue: number;
  totalProjectsCount: number;
  timeRangeLabel?: string;
}

// Currency formatter for reports
export const formatReportVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' VNĐ';
};

/**
 * Calculates optimal AutoFit Column Widths for SheetJS Worksheet (`ws['!cols']`).
 * Analyzes content lengths, header titles, adds padding for Vietnamese accents,
 * and sets minimum/maximum readable boundaries so columns are never squished.
 */
export function calculateAutoFitCols(data: any[][]): XLSX.ColInfo[] {
  if (!data || data.length === 0) return [];
  const colCount = Math.max(...data.map(r => r.length));
  const colWidths: number[] = new Array(colCount).fill(16);

  data.forEach(row => {
    row.forEach((cell, colIdx) => {
      if (cell !== null && cell !== undefined) {
        const text = String(cell);
        // Estimate visual character width (Vietnamese accents and bold headers take extra visual space)
        const visualLength = Math.ceil(text.length * 1.18);
        if (visualLength > colWidths[colIdx]) {
          colWidths[colIdx] = visualLength;
        }
      }
    });
  });

  return colWidths.map(w => ({
    wch: Math.min(Math.max(w + 4, 16), 75) // Minimum 16, maximum 75 chars
  }));
}

/**
 * Pads a string for CSV text alignment
 */
export function padVisual(str: string, minWidth: number, alignRight: boolean = false): string {
  const len = str.length;
  if (len >= minWidth) return str;
  const padding = ' '.repeat(minWidth - len);
  return alignRight ? padding + str : str + padding;
}

/**
 * Escapes CSV field and applies visual width padding
 */
export function formatCsvCell(val: string | number | undefined | null, minWidth: number = 0, alignRight: boolean = false): string {
  const cleanVal = val === undefined || val === null ? '' : String(val);
  const escaped = cleanVal.replace(/"/g, '""');
  const padded = minWidth > 0 ? padVisual(escaped, minWidth, alignRight) : escaped;
  return `"${padded}"`;
}

/**
 * Standard status mapper for accounting personnel
 */
export function mapStaffStatusToVi(status?: string): string {
  switch (status) {
    case 'free':
    case 'online':
      return 'Sẵn sàng / Đang hoạt động';
    case 'busy':
      return 'Đang kiểm soát hóa đơn';
    case 'overloaded':
      return 'Đang xử lý nhiều hợp đồng';
    case 'inactive':
      return 'Tạm nghỉ / Ngoại tuyến';
    default:
      return 'Đang hoạt động';
  }
}

/**
 * Helper to download raw CSV string with UTF-8 BOM
 */
function downloadCsvString(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to export an Array-of-Arrays table into an Excel (.xlsx) file with AutoFit column widths
 */
function downloadExcelAOA(aoaData: any[][], sheetName: string, filename: string): void {
  const ws = XLSX.utils.aoa_to_sheet(aoaData);
  // Set TRUE AutoFit column widths
  ws['!cols'] = calculateAutoFitCols(aoaData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

// --------------------------------------------------------------------------
// 1. ACCOUNTING STAFF REPORT (Báo Cáo Nhân Sự Kế Toán & Đối Soát)
// --------------------------------------------------------------------------

function buildStaffReportAOA(staffList: AccountantStaff[], currentUser?: User): any[][] {
  let effectiveList = [...staffList];
  if (effectiveList.length === 0 && currentUser) {
    effectiveList.push({
      id: currentUser.uid || 'ACC-01',
      name: currentUser.name || 'Kế Toán Trưởng',
      email: currentUser.email || 'ketoan@lubpystudio.vn',
      phone: currentUser.phone || '0988000999',
      title: currentUser.departmentTitle || 'Kế Toán Trưởng / Trưởng Ban Tài Chính',
      level: 'Trưởng Nghiệp Vụ',
      status: 'free',
      rating: 5.0,
      avatarUrl: currentUser.photoUrl || '',
      skills: ['Quản Lý Dòng Tiền', 'Ký Duyệt Hóa Đơn', 'Đối Soát Thù Lao Dev', 'Báo Cáo Thuế'],
      reconciliationAssigned: 'Quản lý toàn bộ dòng tiền, hóa đơn cọc & quyết toán thù lao Kỹ sư',
      invoicesProcessedCount: 24,
      totalReconciledAmountVnd: 125000000
    });
  }

  const headers = [
    'Mã Nhân Viên',
    'Họ Và Tên Nhân Viên',
    'Chức Danh Nghiệp Vụ',
    'Cấp Bậc Nhân Sự',
    'Nhiệm Vụ Phụ Trách',
    'Số Hóa Đơn Đã Kiểm Soát',
    'Tổng Tiền Đã Kiểm Soát (VNĐ)',
    'Trạng Thái Hoạt Động'
  ];

  const rows = effectiveList.map(s => {
    const scope = s.reconciliationAssigned || s.assignedScope || 'Kiểm soát hóa đơn cọc & đối soát thù lao';
    const count = s.invoicesProcessedCount ?? s.auditedInvoicesCount ?? 0;
    const amount = s.totalReconciledAmountVnd ?? s.auditedAmountVND ?? 0;
    const statusVi = mapStaffStatusToVi(s.status);

    return [
      s.id || 'ACC-01',
      s.name,
      s.title || 'Chuyên Viên Kế Toán Hóa Đơn',
      s.level || 'Nhân Viên / Chuyên Viên',
      scope,
      `${count} Hóa đơn`,
      formatReportVND(amount),
      statusVi
    ];
  });

  return [headers, ...rows];
}

/**
 * EXPORT 1: Báo cáo Nhân Sự Kế Toán
 * Generates Excel (.xlsx) with True AutoFit Column Width AND CSV with UTF-8 BOM
 */
export function exportAccountingStaffToCSV(
  staffList: AccountantStaff[],
  currentUser?: User,
  baseFilename?: string
): void {
  const todayStr = new Date().toISOString().slice(0, 10);
  const aoa = buildStaffReportAOA(staffList, currentUser);

  // 1. Download Excel (.xlsx) with AutoFit column widths
  const excelName = baseFilename 
    ? baseFilename.replace(/\.csv$/i, '.xlsx') 
    : `lubpy_bao_cao_nhan_su_ke_toan_${todayStr}.xlsx`;
  downloadExcelAOA(aoa, 'Nhân Sự Kế Toán', excelName);

  // 2. Also download clean CSV
  const csvName = baseFilename 
    ? (baseFilename.endsWith('.csv') ? baseFilename : `${baseFilename}.csv`)
    : `lubpy_bao_cao_nhan_su_ke_toan_${todayStr}.csv`;
  const autoCols = calculateAutoFitCols(aoa);
  const csvRows = aoa.map(row => 
    row.map((val, idx) => formatCsvCell(val, autoCols[idx]?.wch || 0, idx === 5 || idx === 6)).join(',')
  ).join('\r\n');
  
  // Download CSV with small delay to avoid browser popup blocks
  setTimeout(() => {
    downloadCsvString(csvRows, csvName);
  }, 250);
}

export function exportAccountingStaffToExcelXML(
  staffList: AccountantStaff[],
  currentUser?: User,
  filename?: string
): void {
  const todayStr = new Date().toISOString().slice(0, 10);
  const excelName = filename || `lubpy_bao_cao_nhan_su_ke_toan_${todayStr}.xlsx`;
  const aoa = buildStaffReportAOA(staffList, currentUser);
  downloadExcelAOA(aoa, 'Nhân Sự Kế Toán', excelName);
}

// --------------------------------------------------------------------------
// 2. CASHFLOW DETAIL REPORT (Báo Cáo Dòng Tiền Chi Tiết)
// --------------------------------------------------------------------------

function buildCashflowReportAOA(data: CashflowSummaryData): any[][] {
  const headers = [
    'Chỉ Tiêu Tài Chính Dòng Tiền',
    'Giá Trị Thực Tế (VNĐ)',
    'Ghi Chú & Diễn Giải Chi Tiết'
  ];

  const rows = [
    [
      'Tổng Doanh Thu Hợp Đồng Đồ Án',
      formatReportVND(data.totalRevenue),
      'Tổng giá trị tất cả hợp đồng đồ án IT đã ký kết với khách hàng'
    ],
    [
      'Tiền Cọc Đã Thu (50%)',
      formatReportVND(data.totalDepositCollected),
      'Thực nhận về tài khoản trung gian LUBPY STUDIO bảo chứng an toàn'
    ],
    [
      'Thanh Toán Còn Lại (Chờ Nghiệm Thu 50%)',
      formatReportVND(data.totalPendingBalance),
      'Khoản thu khi hoàn tất bàn giao source code & nghiệm thu đồ án'
    ],
    [
      'Thù Lao Trả Devs & Chi Phí Vận Hành',
      formatReportVND(data.totalDevPayouts),
      'Quỹ chi trả thù lao cho đội ngũ Kỹ sư lập trình & chi phí máy chủ'
    ],
    [
      'Doanh Thu Ròng Thực Tế',
      formatReportVND(data.netRevenue),
      'Lợi nhuận gộp sau khi thanh toán đầy đủ thù lao cho đội ngũ Dev'
    ],
    [
      'Tổng Số Hợp Đồng Đồ Án Đã Nhận',
      `${data.totalProjectsCount} Đồ án`,
      'Tổng số lượng đồ án công nghệ thông tin đã tiếp nhận trong hệ thống'
    ]
  ];

  return [headers, ...rows];
}

/**
 * EXPORT 2: Báo cáo Dòng Tiền Chi Tiết
 * Generates Excel (.xlsx) with True AutoFit Column Width AND CSV with UTF-8 BOM
 */
export function exportCashflowReportToCSV(
  data: CashflowSummaryData,
  baseFilename?: string
): void {
  const todayStr = new Date().toISOString().slice(0, 10);
  const aoa = buildCashflowReportAOA(data);

  // 1. Download Excel (.xlsx) with AutoFit column widths
  const excelName = baseFilename 
    ? baseFilename.replace(/\.csv$/i, '.xlsx') 
    : `lubpy_bao_cao_dong_tien_chi_tiet_${todayStr}.xlsx`;
  downloadExcelAOA(aoa, 'Báo Cáo Dòng Tiền', excelName);

  // 2. Also download clean CSV
  const csvName = baseFilename 
    ? (baseFilename.endsWith('.csv') ? baseFilename : `${baseFilename}.csv`)
    : `lubpy_bao_cao_dong_tien_chi_tiet_${todayStr}.csv`;
  const autoCols = calculateAutoFitCols(aoa);
  const csvRows = aoa.map(row => 
    row.map((val, idx) => formatCsvCell(val, autoCols[idx]?.wch || 0, idx === 1)).join(',')
  ).join('\r\n');

  setTimeout(() => {
    downloadCsvString(csvRows, csvName);
  }, 250);
}

export function exportCashflowReportToExcelXML(
  data: CashflowSummaryData,
  filename?: string
): void {
  const todayStr = new Date().toISOString().slice(0, 10);
  const excelName = filename || `lubpy_bao_cao_dong_tien_chi_tiet_${todayStr}.xlsx`;
  const aoa = buildCashflowReportAOA(data);
  downloadExcelAOA(aoa, 'Báo Cáo Dòng Tiền', excelName);
}

// --------------------------------------------------------------------------
// 3. INVOICES REPORT (Báo Cáo Thu Tiền & Hóa Đơn Đồ Án)
// --------------------------------------------------------------------------

function buildInvoicesReportAOA(
  invoices: Array<{
    id: string;
    projectName: string;
    studentName: string;
    studentPhone: string;
    totalCost: number;
    depositAmount: number;
    remainingAmount: number;
    status: string;
    createdDate: string;
    assignedDev: string;
  }>
): any[][] {
  const headers = [
    'Mã Hóa Đơn / Đồ Án',
    'Tên Đồ Án / Đề Tài Khách Hàng',
    'Họ Tên Học Viên',
    'Số Điện Thoại',
    'Tổng Chi Phí (VNĐ)',
    'Tiền Cọc Đã Thu (VNĐ)',
    'Còn Lại Cần Thu (VNĐ)',
    'Trạng Thái Thu Tiền',
    'Ngày Khởi Tạo',
    'Kỹ Sư Đảm Nhận'
  ];

  const rows = invoices.map(i => [
    i.id,
    i.projectName,
    i.studentName,
    i.studentPhone,
    formatReportVND(i.totalCost),
    formatReportVND(i.depositAmount),
    formatReportVND(i.remainingAmount),
    i.status,
    i.createdDate,
    i.assignedDev
  ]);

  return [headers, ...rows];
}

export function exportInvoicesToCSV(
  invoices: any[],
  baseFilename?: string
): void {
  const todayStr = new Date().toISOString().slice(0, 10);
  const aoa = buildInvoicesReportAOA(invoices);

  // 1. Download Excel (.xlsx) with AutoFit column widths
  const excelName = baseFilename 
    ? baseFilename.replace(/\.csv$/i, '.xlsx') 
    : `lubpy_bao_cao_hoa_don_do_an_${todayStr}.xlsx`;
  downloadExcelAOA(aoa, 'Hóa Đơn Đồ Án', excelName);

  // 2. Also download CSV
  const csvName = baseFilename 
    ? (baseFilename.endsWith('.csv') ? baseFilename : `${baseFilename}.csv`)
    : `lubpy_bao_cao_hoa_don_do_an_${todayStr}.csv`;
  const autoCols = calculateAutoFitCols(aoa);
  const csvRows = aoa.map(row => 
    row.map((val, idx) => formatCsvCell(val, autoCols[idx]?.wch || 0, idx >= 4 && idx <= 6)).join(',')
  ).join('\r\n');

  setTimeout(() => {
    downloadCsvString(csvRows, csvName);
  }, 250);
}

// --------------------------------------------------------------------------
// 4. DEV PAYOUTS REPORT (Báo Cáo Quyết Toán Lương Kỹ Sư Devs)
// --------------------------------------------------------------------------

function buildDevPayoutsReportAOA(
  payouts: Array<{
    id: string;
    devName: string;
    assignedProjects: string[];
    payoutRate: string;
    earnedAmount: number;
    bankInfo?: string;
    status: string;
  }>
): any[][] {
  const headers = [
    'Mã Phiếu Chi',
    'Họ Tên Kỹ Sư / Lập Trình Viên',
    'Đồ Án Đảm Nhận',
    'Tỷ Lệ Thù Lao',
    'Tổng Thù Lao Được Hưởng (VNĐ)',
    'Thông Tin Ngân Hàng Thụ Hưởng',
    'Trạng Thái Chi Trả'
  ];

  const rows = payouts.map(p => [
    p.id,
    p.devName,
    p.assignedProjects.join('; '),
    p.payoutRate,
    formatReportVND(p.earnedAmount),
    p.bankInfo || 'Chưa cập nhật',
    p.status
  ]);

  return [headers, ...rows];
}

export function exportDevPayoutsToCSV(
  payouts: any[],
  baseFilename?: string
): void {
  const todayStr = new Date().toISOString().slice(0, 10);
  const aoa = buildDevPayoutsReportAOA(payouts);

  // 1. Download Excel (.xlsx) with AutoFit column widths
  const excelName = baseFilename 
    ? baseFilename.replace(/\.csv$/i, '.xlsx') 
    : `lubpy_bao_cao_thu_lao_devs_${todayStr}.xlsx`;
  downloadExcelAOA(aoa, 'Lương Kỹ Sư', excelName);

  // 2. Also download CSV
  const csvName = baseFilename 
    ? (baseFilename.endsWith('.csv') ? baseFilename : `${baseFilename}.csv`)
    : `lubpy_bao_cao_thu_lao_devs_${todayStr}.csv`;
  const autoCols = calculateAutoFitCols(aoa);
  const csvRows = aoa.map(row => 
    row.map((val, idx) => formatCsvCell(val, autoCols[idx]?.wch || 0, idx === 4)).join(',')
  ).join('\r\n');

  setTimeout(() => {
    downloadCsvString(csvRows, csvName);
  }, 250);
}
