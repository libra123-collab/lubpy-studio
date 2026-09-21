import { User } from '../types';

export interface SpecialtyItem {
  id: string;
  name: string;
  scopeSkills: string;
  description: string;
}

export interface DepartmentSpecialtyConfig {
  deptKey: 'tech' | 'cs' | 'hr' | 'accounting';
  label: string;
  leadRoleTitle: string;
  shortLabel: string;
  specialtiesCount: number; // 6 for tech, 5 for cs, 5 for hr, 5 for accounting
  maxHeadsPerSpecialty: number; // Tối đa 2 trưởng phòng cho mỗi chuyên môn nghiệp vụ
  specialties: SpecialtyItem[];
}

export const DEPARTMENT_SPECIALTY_CONFIGS: Record<string, DepartmentSpecialtyConfig> = {
  tech: {
    deptKey: 'tech',
    label: 'Đội Ngũ Kỹ Thuật (Tech Lead)',
    leadRoleTitle: 'Trưởng Nghiệp Vụ Kỹ Thuật (Head of Engineering)',
    shortLabel: 'Kỹ Thuật',
    specialtiesCount: 6,
    maxHeadsPerSpecialty: 2,
    specialties: [
      {
        id: 'tech_spec_1',
        name: 'Fullstack Web, Mobile App, AI System & Architecture',
        scopeSkills: 'React, Node.js, Python, PostgreSQL, Docker, Flutter',
        description: 'Chỉ đạo kiến trúc phần mềm, web/mobile app quy mô lớn và tích hợp mô hình AI thực chiến.'
      },
      {
        id: 'tech_spec_2',
        name: 'Mobile App (iOS/Android) & Cross-Platform Architecture',
        scopeSkills: 'Flutter, React Native, Firebase, REST API, GraphQL',
        description: 'Phụ trách nền tảng ứng dụng di động đa nền tảng, tối ưu trải nghiệm và hiệu năng app.'
      },
      {
        id: 'tech_spec_3',
        name: 'AI System, Data Engineering & Machine Learning Systems',
        scopeSkills: 'Python, FastApi, PyTorch, OpenCV, Docker, PostgreSQL',
        description: 'Phụ trách đường ống dữ liệu, huấn luyện mô hình máy học, xử lý ảnh/ngôn ngữ tự nhiên.'
      },
      {
        id: 'tech_spec_4',
        name: 'DevOps, Cloud Infrastructure & Microservices Architecture',
        scopeSkills: 'Java, Spring Boot, Microservices, Kubernetes, Kafka, AWS',
        description: 'Phụ trách hạ tầng Cloud, CI/CD tự động hóa, điều phối cụm microservices và giám sát hệ thống.'
      },
      {
        id: 'tech_spec_5',
        name: 'Backend Heavy & High-Performance Database Design',
        scopeSkills: 'Node.js, Express, PostgreSQL, Redis, MongoDB, GraphQL',
        description: 'Thiết kế kiến trúc cơ sở dữ liệu chịu tải cao, tối ưu truy vấn SQL/NoSQL và caching phân tán.'
      },
      {
        id: 'tech_spec_6',
        name: 'Frontend System UI/UX & Web Performance Optimization',
        scopeSkills: 'Next.js, Vue, Tailwind CSS, Redux, Webpack, TypeScript',
        description: 'Xây dựng giao diện chuẩn tương tác, tối ưu Core Web Vitals và thiết kế Design System.'
      }
    ]
  },
  cs: {
    deptKey: 'cs',
    label: 'Chăm Sóc Khách Hàng (Customer Service)',
    leadRoleTitle: 'Trưởng Nghiệp Vụ CSKH & Tư Vấn Sinh Viên',
    shortLabel: 'CSKH',
    specialtiesCount: 5,
    maxHeadsPerSpecialty: 2,
    specialties: [
      {
        id: 'cs_spec_1',
        name: 'Tư vấn chọn đề tài, giải quyết thắc mắc & chăm sóc sinh viên 24/7',
        scopeSkills: 'Tư vấn Zalo, Hỗ trợ tiến độ, Hướng dẫn bảo vệ, CSKH VIP',
        description: 'Tiếp nhận sinh viên ban đầu, định hướng đề tài phù hợp và hỗ trợ kỹ thuật đồ án 24/7.'
      },
      {
        id: 'cs_spec_2',
        name: 'Tư vấn chọn đề tài & Định hướng sinh viên đồ án',
        scopeSkills: 'Tư vấn Hotline 24/7, Livechat, Chăm sóc Sinh viên VIP',
        description: 'Đánh giá tính khả thi đề tài của trường học, tư vấn công nghệ và lộ trình hoàn thành.'
      },
      {
        id: 'cs_spec_3',
        name: 'Tiếp nhận Yêu cầu, Báo giá & Chốt hợp đồng Đồ án',
        scopeSkills: 'Tư vấn Fanpage, Zalo OA, Hỗ trợ Sửa lỗi Đồ án khẩn cấp',
        description: 'Báo giá minh bạch theo khối lượng tính năng, ký kết thỏa thuận cam kết nghiệm thu.'
      },
      {
        id: 'cs_spec_4',
        name: 'Quản lý Đánh giá Hài lòng & Hướng dẫn Bảo vệ Đồ án',
        scopeSkills: 'Quản lý Feedback Sinh viên, Hỗ trợ Demo & Báo cáo Slide',
        description: 'Thu thập chỉ số CSAT sinh viên, tổ chức mock interview và hỗ trợ slide thuyết trình.'
      },
      {
        id: 'cs_spec_5',
        name: 'Xử lý Khiếu nại & Hỗ trợ Tiến độ Đồ án Sinh viên',
        scopeSkills: 'Hỗ trợ Tiến độ 24/7, Xử lý Đổi Devs, Hướng dẫn Đáp án Đồ án',
        description: 'Xử lý các tình huống khẩn cấp, điều phối đổi dev kịp deadline và giải quyết phát sinh.'
      }
    ]
  },
  hr: {
    deptKey: 'hr',
    label: 'Quản Lý Nhân Sự (HR Management)',
    leadRoleTitle: 'Trưởng Nghiệp Vụ Nhân Sự & Quản Lý Thù Lao Kỹ Sư',
    shortLabel: 'Nhân Sự',
    specialtiesCount: 5,
    maxHeadsPerSpecialty: 2,
    specialties: [
      {
        id: 'hr_spec_1',
        name: 'Tuyển dụng kỹ sư, đánh giá KPI & tính thù lao đồ án',
        scopeSkills: 'Săn nhân tài Devs, Quản lý CTV, Đánh giá KPI 65% thù lao, Hợp đồng',
        description: 'Phụ trách toàn bộ quy trình tìm kiếm kỹ sư thực chiến, nghiệm thu mã nguồn và chia thù lao.'
      },
      {
        id: 'hr_spec_2',
        name: 'Tuyển dụng kỹ sư & Đánh giá năng lực Devs thực chiến',
        scopeSkills: 'Quản lý Hợp đồng CTV, Bảng lương, Đào tạo Onboarding Kỹ sư',
        description: 'Phỏng vấn chuyên sâu tech stack, kiểm tra portfolio dự án và phân cấp bậc kỹ sư.'
      },
      {
        id: 'hr_spec_3',
        name: 'Xây dựng Chính sách & Quản lý Phân bổ Thù lao 65%',
        scopeSkills: 'Điều phối Nhân sự Đồ án, Theo dõi Tiến độ CTV Kỹ thuật',
        description: 'Xây dựng cơ chế thưởng đồ án xuất sắc, khấu trừ phạt trễ deadline và minh bạch thu nhập.'
      },
      {
        id: 'hr_spec_4',
        name: 'Đánh giá KPI Kỹ sư & Đào tạo Nhân sự Kỹ thuật mới',
        scopeSkills: 'Đánh giá Tiến độ Đồ án, Thù lao Kỹ sư, Đào tạo Quy chuẩn Code',
        description: 'Định kỳ xếp hạng sao (1-5 sao), kiểm tra quy chuẩn git/clean architecture và training.'
      },
      {
        id: 'hr_spec_5',
        name: 'Săn nhân tài (Headhunting) & Quản lý Mạng lưới CTV',
        scopeSkills: 'Chính sách Đãi ngộ, Xây dựng Văn hóa Doanh nghiệp LUBPY STUDIO',
        description: 'Mở rộng mạng lưới senior developer trên toàn quốc, kết nối mentor đồ án hàng đầu.'
      }
    ]
  },
  accounting: {
    deptKey: 'accounting',
    label: 'Kế Toán & Tài Chính (Finance & Accounting)',
    leadRoleTitle: 'Kế Toán Trưởng & Quản Lý Dòng Tiền LUBPY',
    shortLabel: 'Kế Toán',
    specialtiesCount: 5,
    maxHeadsPerSpecialty: 2,
    specialties: [
      {
        id: 'acc_spec_1',
        name: 'Quản lý doanh thu đồ án, đối soát tiền cọc 50% & quyết toán thù lao',
        scopeSkills: 'Báo cáo doanh số CSV, Hóa đơn/Biên nhận, Đối soát tiền cọc, Dòng tiền LUBPY',
        description: 'Kiểm soát dòng tiền cọc và tất toán từ sinh viên, duyệt chi thù lao kỹ sư đúng cam kết.'
      },
      {
        id: 'acc_spec_2',
        name: 'Quản lý Doanh thu Đồ án & Dòng tiền Toàn hệ thống LUBPY',
        scopeSkills: 'Xuất Hóa đơn điện tử, Quản lý Sổ sách Kế toán Doanh nghiệp',
        description: 'Theo dõi tổng thu toàn bộ các gói đồ án, đối chiếu sao kê ngân hàng và ví thanh toán.'
      },
      {
        id: 'acc_spec_3',
        name: 'Đối soát Tiền cọc 50% & Quyết toán Thù lao Kỹ sư 65%',
        scopeSkills: 'Quyết toán Thù lao 65% Kỹ sư, Bảng lương Định kỳ Hàng tháng',
        description: 'Tự động tính toán tỷ lệ 65% doanh thu thù lao đồ án, giải ngân nhanh chóng cho Devs.'
      },
      {
        id: 'acc_spec_4',
        name: 'Báo cáo Tài chính LUBPY STUDIO, Lợi nhuận & Thuế',
        scopeSkills: 'Phân tích Doanh thu Đồ án theo Tháng / Quý & Báo cáo Lợi nhuận',
        description: 'Lập báo cáo P&L định kỳ, dự báo biên lợi nhuận ròng và tối ưu chi phí vận hành studio.'
      },
      {
        id: 'acc_spec_5',
        name: 'Kiểm soát Chi phí Vận hành & Dự toán Ngân sách Đồ án',
        scopeSkills: 'Kiểm soát Quỹ LUBPY, Chi phí Máy chủ & Vận hành Studio',
        description: 'Dự toán chi phí bản quyền công nghệ, phí máy chủ cloud, marketing và quỹ dự phòng.'
      }
    ]
  }
};

/**
 * Lấy danh sách tất cả các Trưởng phòng trực thuộc một bộ phận nghiệp vụ (Cấp 2)
 */
export function getAllHeadsForDept(heads: Record<string, User> | undefined, deptKey: string): User[] {
  if (!heads) return [];
  const list: User[] = [];
  const seenEmails = new Set<string>();

  // Check all values in heads
  Object.values(heads).forEach(h => {
    if (h && h.email && (h.department === deptKey || h.role === deptKey)) {
      const emailLower = h.email.toLowerCase().trim();
      if (!seenEmails.has(emailLower)) {
        seenEmails.add(emailLower);
        list.push(h);
      }
    }
  });

  return list;
}

/**
 * Lấy danh sách các Trưởng phòng được phân công cho một chuyên môn nghiệp vụ cụ thể
 */
export function getHeadsForSpecialty(
  heads: Record<string, User> | undefined,
  deptKey: string,
  specialtyName: string
): User[] {
  const allDeptHeads = getAllHeadsForDept(heads, deptKey);
  const config = DEPARTMENT_SPECIALTY_CONFIGS[deptKey];
  const firstSpecName = config?.specialties[0]?.name;

  return allDeptHeads.filter(h => {
    // If head has matching competence
    if (h.competence && h.competence.trim().toLowerCase() === specialtyName.trim().toLowerCase()) {
      return true;
    }
    // If head has no competence but this is the first specialty, fallback to first specialty
    if (!h.competence && firstSpecName && firstSpecName.toLowerCase() === specialtyName.toLowerCase()) {
      return true;
    }
    return false;
  });
}

/**
 * Kiểm tra xem một chuyên môn nghiệp vụ đã đạt tối đa 2 Trưởng phòng hay chưa
 */
export function isSpecialtyLocked(
  heads: Record<string, User> | undefined,
  deptKey: string,
  specialtyName: string
): boolean {
  const currentHeads = getHeadsForSpecialty(heads, deptKey, specialtyName);
  return currentHeads.length >= 2;
}

/**
 * Kiểm tra xem có được phép tuyển thêm Trưởng phòng cho chuyên môn nghiệp vụ này không
 * - Tối đa 2 Trưởng phòng cho mỗi chuyên môn nghiệp vụ.
 * - Nếu đang chỉnh sửa hoặc thay thế nhân sự cũ (editingHeadUid), cho phép lưu (không tính tăng).
 */
export function canAppointHeadToSpecialty(
  heads: Record<string, User> | undefined,
  deptKey: string,
  specialtyName: string,
  replacingHeadUid?: string
): { allowed: boolean; reason?: string; currentCount: number } {
  const currentHeads = getHeadsForSpecialty(heads, deptKey, specialtyName);
  const currentCount = currentHeads.length;

  // If we are replacing or editing an existing head already in this specialty, count does not increase
  if (replacingHeadUid && currentHeads.some(h => h.uid === replacingHeadUid)) {
    return { allowed: true, currentCount };
  }

  if (currentCount >= 2) {
    return {
      allowed: false,
      reason: `Chuyên môn nghiệp vụ "${specialtyName}" đã có đủ 2/2 Trưởng phòng (Đã khóa). Vui lòng Cập nhật thông tin hoặc Thay đổi Trưởng phòng hiện có.`,
      currentCount
    };
  }

  return { allowed: true, currentCount };
}

/**
 * Thống kê tổng hợp số lượng và trạng thái tuyển dụng của một Bộ phận nghiệp vụ
 */
export function getDepartmentQuotaStats(heads: Record<string, User> | undefined, deptKey: string) {
  const config = DEPARTMENT_SPECIALTY_CONFIGS[deptKey];
  if (!config) {
    return {
      totalSpecialties: 0,
      maxHeadsCapacity: 0,
      currentHeadsCount: 0,
      filledSpecialtiesCount: 0,
      fullyLockedSpecialtiesCount: 0,
      isFullyLocked: false,
      remainingSlots: 0
    };
  }

  const allHeads = getAllHeadsForDept(heads, deptKey);
  const totalSpecialties = config.specialtiesCount; // 6 for tech, 5 for others
  const maxHeadsCapacity = totalSpecialties * config.maxHeadsPerSpecialty; // 12 for tech, 10 for others

  let filledSpecialtiesCount = 0;
  let fullyLockedSpecialtiesCount = 0;

  config.specialties.forEach(spec => {
    const count = getHeadsForSpecialty(heads, deptKey, spec.name).length;
    if (count >= 1) filledSpecialtiesCount++;
    if (count >= config.maxHeadsPerSpecialty) fullyLockedSpecialtiesCount++;
  });

  const currentHeadsCount = allHeads.length;
  // Đã khóa hoàn toàn khi tất cả các chuyên môn nghiệp vụ đều đã tuyển đủ 2/2 hoặc đã đạt capacity
  const isFullyLocked = fullyLockedSpecialtiesCount === totalSpecialties || currentHeadsCount >= maxHeadsCapacity;
  const remainingSlots = Math.max(0, maxHeadsCapacity - currentHeadsCount);

  return {
    totalSpecialties,
    maxHeadsCapacity,
    currentHeadsCount,
    filledSpecialtiesCount,
    fullyLockedSpecialtiesCount,
    isFullyLocked,
    remainingSlots
  };
}
