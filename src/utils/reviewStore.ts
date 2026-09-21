export interface CustomerReview {
  id: string;
  projectId?: string;
  projectTitle: string;
  clientName: string;
  clientEmail?: string;
  clientSchool?: string;
  clientAvatar?: string;
  departmentKey: 'tech' | 'cs' | 'hr' | 'accounting';
  departmentName: string;
  assignedDevName?: string;
  assignedHeadName?: string;
  ratingOverall: number; // 1 to 5
  ratingCodeQuality: number; // 1 to 5
  ratingTimeline: number; // 1 to 5
  ratingSupport: number; // 1 to 5
  comment: string;
  highlightTag?: string;
  createdAt: string;
  adminReply?: {
    author: string;
    authorRole?: string;
    authorAvatar?: string;
    content: string;
    repliedAt: string;
    templateCase?: number;
  };
  status: 'published' | 'pending_review' | 'featured';
}

// 3 Standard Response Templates requested by User
export const STANDARD_REVIEW_TEMPLATES = {
  CASE_1_UNSATISFIED: {
    caseNum: 1,
    rangeLabel: '1 sao đến 2 sao (Yếu hoặc Không hài lòng)',
    shortLabel: '1 - 2 ⭐ Yếu / Chưa hài lòng',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    content: 'Cảm ơn quý khách đã dành thời gian đánh giá. Chúng tôi rất tiếc khi sản phẩm/dịch vụ chưa đáp ứng được kỳ vọng của quý khách; đội ngũ kỹ thuật sẽ tiếp nhận phản hồi, kiểm tra lại các vấn đề liên quan và cải thiện chất lượng để mang đến trải nghiệm tốt hơn trong những lần tiếp theo.'
  },
  CASE_2_AVERAGE: {
    caseNum: 2,
    rangeLabel: '3 sao (Đánh giá tầm trung / Góp ý)',
    shortLabel: '3 ⭐ Tầm trung / Góp ý',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    content: 'Cảm ơn quý khách đã đánh giá và đóng góp ý kiến. Chúng tôi ghi nhận những điểm quý khách chưa thực sự hài lòng và sẽ cùng đội ngũ kỹ thuật rà soát, hoàn thiện sản phẩm/dịch vụ để nâng cao chất lượng và đáp ứng tốt hơn nhu cầu của quý khách.'
  },
  CASE_3_SATISFIED: {
    caseNum: 3,
    rangeLabel: '4 sao đến 5 sao (Hài lòng / Đánh giá tích cực)',
    shortLabel: '4 - 5 ⭐ Hài lòng / Tích cực',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    content: 'Cảm ơn quý khách đã tin tưởng và đánh giá tích cực! Đội ngũ chúng tôi rất vui khi sản phẩm/dịch vụ đáp ứng được nhu cầu của quý khách và sẽ tiếp tục duy trì chất lượng, cải tiến kỹ thuật để mang đến trải nghiệm ngày càng tốt hơn.'
  }
};

export function getStandardResponseByRating(rating: number): string {
  if (rating < 3.0) {
    return STANDARD_REVIEW_TEMPLATES.CASE_1_UNSATISFIED.content;
  } else if (rating >= 3.0 && rating < 4.0) {
    return STANDARD_REVIEW_TEMPLATES.CASE_2_AVERAGE.content;
  } else {
    return STANDARD_REVIEW_TEMPLATES.CASE_3_SATISFIED.content;
  }
}

export const INITIAL_CUSTOMER_REVIEWS: CustomerReview[] = [
  // TIER 1: 4.5 - 5.0 SAO (HÀI LÒNG / ĐÁNH GIÁ TÍCH CỰC) - 8 Reviews
  {
    id: 'REV-2026-101',
    projectId: 'DA-2026-01',
    projectTitle: 'Hệ Thống E-Commerce AI Recommender & Microservices',
    clientName: 'Nguyễn Văn An',
    clientEmail: 'an.nguyen@bk.edu.vn',
    clientSchool: 'Đại Học Bách Khoa TP.HCM',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Hoàng Long',
    ratingOverall: 5,
    ratingCodeQuality: 5,
    ratingTimeline: 5,
    ratingSupport: 5,
    comment: 'Đồ án hoàn thành xuất sắc vượt mong đợi! Source code viết rất sạch sẽ theo chuẩn Clean Architecture, tài liệu SRS và hướng dẫn bảo vệ chi tiết. Hội đồng phản biện đánh giá 9.8 điểm xuất sắc.',
    highlightTag: 'Điểm 9.8 Xuất Sắc',
    createdAt: '18/07/2026',
    status: 'featured',
    adminReply: {
      author: 'Admin LUBPY & Trưởng Phòng Kỹ Thuật',
      authorRole: 'Hội Đồng Kỹ Thuật LUBPY STUDIO',
      content: STANDARD_REVIEW_TEMPLATES.CASE_3_SATISFIED.content,
      repliedAt: '18/07/2026',
      templateCase: 3
    }
  },
  {
    id: 'REV-2026-102',
    projectId: 'DA-2026-02',
    projectTitle: 'Nông Nghiệp Thông Minh IoT & Dự Báo Thời Tiết AI',
    clientName: 'Trần Thị Mai',
    clientEmail: 'mai.tran@vnu.edu.vn',
    clientSchool: 'Đại Học Quốc Gia',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Minh Quân',
    ratingOverall: 5,
    ratingCodeQuality: 5,
    ratingTimeline: 5,
    ratingSupport: 5,
    comment: 'Kỹ sư Minh Quân hỗ trợ siêu nhiệt tình phần kết nối ESP32 lên MQTT broker và cấu hình FastAPI. Slide thuyết trình làm rất chuyên nghiệp, thầy cô khen ngợi tính thực tiễn cao.',
    highlightTag: 'Kỹ sư hỗ trợ 24/7',
    createdAt: '19/07/2026',
    status: 'published',
    adminReply: {
      author: 'Chuyên Viên CSKH LUBPY',
      authorRole: 'Ban Chăm Sóc Sinh Viên',
      content: STANDARD_REVIEW_TEMPLATES.CASE_3_SATISFIED.content,
      repliedAt: '19/07/2026',
      templateCase: 3
    }
  },
  {
    id: 'REV-2026-103',
    projectId: 'DA-2026-06',
    projectTitle: 'Hệ Thống Quản Lý Chuỗi Cung Ứng Blockchain',
    clientName: 'Đỗ Minh Khang',
    clientEmail: 'khang.do@fpt.edu.vn',
    clientSchool: 'Đại Học FPT',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Hoàng Long',
    ratingOverall: 5,
    ratingCodeQuality: 5,
    ratingTimeline: 5,
    ratingSupport: 5,
    comment: 'Smart Contract Solidity tối ưu gas rất tốt, có đầy đủ Unit Test Hardhat. Mình được hướng dẫn demo trực tiếp từng giao dịch trên mạng thử nghiệm rất tự tin.',
    highlightTag: 'Blockchain Đỉnh Cao',
    createdAt: '20/07/2026',
    status: 'featured',
    adminReply: {
      author: 'Trưởng Phòng CSKH',
      authorRole: 'Ban Quản Trị LUBPY',
      content: STANDARD_REVIEW_TEMPLATES.CASE_3_SATISFIED.content,
      repliedAt: '20/07/2026',
      templateCase: 3
    }
  },
  {
    id: 'REV-2026-104',
    projectId: 'DA-2026-09',
    projectTitle: 'Hệ Thống Giám Sát Giao Thông & YOLOv8',
    clientName: 'Lý Thái Phong',
    clientEmail: 'phong.ly@ptit.edu.vn',
    clientSchool: 'Học Viện Công Nghệ Bưu Chính Viễn Thông',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Đức Thắng',
    ratingOverall: 5,
    ratingCodeQuality: 5,
    ratingTimeline: 4,
    ratingSupport: 5,
    comment: 'Mô hình AI detect xe cộ và đo tốc độ real-time mượt mà trên GPU. Kỹ sư hỗ trợ sửa theo góp ý của giảng viên hướng dẫn trong vòng chưa đầy 1 ngày.',
    highlightTag: 'AI Realtime Chuẩn Xác',
    createdAt: '21/07/2026',
    status: 'published'
  },
  {
    id: 'REV-2026-105',
    projectId: 'DA-2026-08',
    projectTitle: 'Nền Tảng Học LMS & Thi Trắc Nghiệm Go/NextJS',
    clientName: 'Ngô Gia Huy',
    clientEmail: 'huy.ngo@hcmute.edu.vn',
    clientSchool: 'ĐH Sư Phạm Kỹ Thuật TP.HCM',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Tuấn Kiệt',
    ratingOverall: 5,
    ratingCodeQuality: 5,
    ratingTimeline: 5,
    ratingSupport: 4,
    comment: 'Hệ thống chịu tải tốt với backend Golang và WebSocket, giao diện học viên hiện đại, tính năng webcam chống gian lận hoạt động ổn định.',
    highlightTag: 'Backend High Performance',
    createdAt: '21/07/2026',
    status: 'published'
  },
  {
    id: 'REV-2026-106',
    projectId: 'DA-2026-05',
    projectTitle: 'Ứng Dụng Hồ Sơ Bệnh Án Điện Tử Flutter',
    clientName: 'Vũ Thị Lan',
    clientEmail: 'lan.vu@meditech.edu.vn',
    clientSchool: 'ĐH Y Dược / ĐH CNTT',
    departmentKey: 'cs',
    departmentName: 'Chăm Sóc Khách Hàng',
    assignedDevName: 'Hải Đăng',
    ratingOverall: 4.5,
    ratingCodeQuality: 5,
    ratingTimeline: 4,
    ratingSupport: 5,
    comment: 'Giao diện ứng dụng mobile Flutter thiết kế theo phong cách y tế rất trang nhã, bảo mật dữ liệu tốt, đội ngũ CSKH nhắc lịch và gửi tài liệu đúng hạn.',
    highlightTag: 'Giao Diện Chuẩn UX/UI',
    createdAt: '22/07/2026',
    status: 'published'
  },
  {
    id: 'REV-2026-107',
    projectId: 'DA-2026-07',
    projectTitle: 'Chatbot AI Tư Vấn Pháp Luật RAG LangChain',
    clientName: 'Bùi Thùy Dung',
    clientEmail: 'dung.bui@law.edu.vn',
    clientSchool: 'ĐH Luật / ĐH CNTT',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Minh Quân',
    ratingOverall: 4.5,
    ratingCodeQuality: 5,
    ratingTimeline: 4,
    ratingSupport: 5,
    comment: 'Vector Database ChromaDB truy xuất văn bản luật rất chính xác, câu trả lời có trích dẫn điều khoản luật rõ ràng, thầy phản biện rất hài lòng.',
    highlightTag: 'RAG AI Logic Cao',
    createdAt: '22/07/2026',
    status: 'published'
  },
  {
    id: 'REV-2026-108',
    projectId: 'DA-2026-10',
    projectTitle: 'Cổng Thanh Toán & Ví Điện Tử Fintech',
    clientName: 'Hoàng Minh Tú',
    clientEmail: 'tu.hm@hub.edu.vn',
    clientSchool: 'Đại Học Ngân Hàng',
    departmentKey: 'accounting',
    departmentName: 'Kế Toán & Tài Chính',
    assignedDevName: 'Tuấn Kiệt',
    ratingOverall: 4.5,
    ratingCodeQuality: 4,
    ratingTimeline: 5,
    ratingSupport: 5,
    comment: 'Tài liệu hướng dẫn cài đặt Docker compose và quy trình thanh toán giả lập rất chi tiết, dễ dàng thiết lập trên máy cá nhân.',
    highlightTag: 'Tài Liệu Cực Chuẩn',
    createdAt: '23/07/2026',
    status: 'published'
  },

  // TIER 2: 3.0 - 3.5 SAO (ĐÁNH GIÁ TẦM TRUNG / GÓP Ý CẢI TIẾN) - 3 Reviews
  {
    id: 'REV-2026-201',
    projectId: 'DA-2026-03',
    projectTitle: 'Sàn Giao Dịch Chứng Khoán Ảo Real-time Trading',
    clientName: 'Lê Hoàng Nam',
    clientEmail: 'nam.le@neu.edu.vn',
    clientSchool: 'Đại Học Kinh Tế Quốc Dân',
    departmentKey: 'cs',
    departmentName: 'Chăm Sóc Khách Hàng',
    assignedDevName: 'Tuấn Kiệt',
    ratingOverall: 3.5,
    ratingCodeQuality: 4,
    ratingTimeline: 3,
    ratingSupport: 4,
    comment: 'Tính năng giao dịch realtime và nến chart chạy tốt, tuy nhiên ở đợt bàn giao báo cáo đầu tiên bị muộn hơn 1 buổi so với lịch hẹn nên mình hơi lo lắng. Sau đó bên CSKH đã nhiệt tình hỗ trợ bù.',
    highlightTag: 'Góp Ý Về Tiến Độ Báo Cáo',
    createdAt: '19/07/2026',
    status: 'published',
    adminReply: {
      author: 'Trưởng Phòng CSKH & Quản Lý Dòng Tiền',
      authorRole: 'Ban Điều Hành LUBPY STUDIO',
      content: STANDARD_REVIEW_TEMPLATES.CASE_2_AVERAGE.content,
      repliedAt: '19/07/2026',
      templateCase: 2
    }
  },
  {
    id: 'REV-2026-202',
    projectId: 'DA-2026-04',
    projectTitle: 'Hệ Thống Nhận Diện Khuôn Mặt & Điểm Danh AI',
    clientName: 'Phạm Quốc Bảo',
    clientEmail: 'bao.pham@uet.vnu.edu.vn',
    clientSchool: 'ĐH Công Nghệ - ĐHQGHN',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Đức Thắng',
    ratingOverall: 3.5,
    ratingCodeQuality: 4,
    ratingTimeline: 4,
    ratingSupport: 3,
    comment: 'Code nhận diện khuôn mặt chạy rất chính xác trên camera, nhưng phần cài đặt thư viện dlib và OpenCV trên máy Mac ban đầu hơi phức tạp, mong studio có file bash script cài đặt 1 click tiện hơn.',
    highlightTag: 'Cần Thêm Script Cài Đặt Tự Động',
    createdAt: '20/07/2026',
    status: 'published',
    adminReply: {
      author: 'Trưởng Phòng Kỹ Thuật LUBPY',
      authorRole: 'Đội Ngũ Kỹ Thuật',
      content: STANDARD_REVIEW_TEMPLATES.CASE_2_AVERAGE.content,
      repliedAt: '20/07/2026',
      templateCase: 2
    }
  },
  {
    id: 'REV-2026-203',
    projectId: 'DA-2026-10',
    projectTitle: 'Hệ Thống Phân Tích Dữ Liệu Khách Hàng CRM',
    clientName: 'Trịnh Thu Hà',
    clientEmail: 'ha.trinh@hub.edu.vn',
    clientSchool: 'Đại Học Ngân Hàng',
    departmentKey: 'cs',
    departmentName: 'Chăm Sóc Khách Hàng',
    assignedDevName: 'Chưa phân công',
    ratingOverall: 3.0,
    ratingCodeQuality: 3,
    ratingTimeline: 3,
    ratingSupport: 3,
    comment: 'Chức năng cơ bản đã đủ nhưng giao diện biểu đồ mong muốn nhiều màu sắc tùy biến hơn. Các anh hỗ trợ nhiệt tình nhưng thời gian phản hồi giữa các đợt sửa nên nhanh hơn một chút.',
    highlightTag: 'Góp Ý Tốc Độ Phản Hồi',
    createdAt: '21/07/2026',
    status: 'published',
    adminReply: {
      author: 'Chuyên Viên CSKH LUBPY',
      authorRole: 'Ban CSKH',
      content: STANDARD_REVIEW_TEMPLATES.CASE_2_AVERAGE.content,
      repliedAt: '21/07/2026',
      templateCase: 2
    }
  },

  // TIER 3: 1.0 - 2.5 SAO (CHƯA HÀI LÒNG / CẦN CẢI THIỆN) - 2 Reviews
  {
    id: 'REV-2026-301',
    projectId: 'DA-2026-11',
    projectTitle: 'Hệ Thống Quản Trị Log Tập Trung ElasticSearch & Kibana',
    clientName: 'Nguyễn Thành Đạt',
    clientEmail: 'dat.nt@hust.edu.vn',
    clientSchool: 'Đại Học Bách Khoa Hà Nội',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Đức Thắng',
    ratingOverall: 2.0,
    ratingCodeQuality: 3,
    ratingTimeline: 2,
    ratingSupport: 2,
    comment: 'Cấu hình ElasticSearch nặng máy khi chạy docker, mình nhắn tin lúc 23h đêm để hỏi lỗi thì sáng hôm sau mới nhận được phản hồi làm mình hơi sốt ruột trước buổi duyệt đồ án.',
    highlightTag: 'Cần Tăng Tốc Hỗ Trợ Đêm',
    createdAt: '17/07/2026',
    status: 'published',
    adminReply: {
      author: 'Ban Giám Đốc Điều Hành LUBPY',
      authorRole: 'Đại Diện Ban Điều Hành Studio',
      content: STANDARD_REVIEW_TEMPLATES.CASE_1_UNSATISFIED.content,
      repliedAt: '17/07/2026',
      templateCase: 1
    }
  },
  {
    id: 'REV-2026-302',
    projectId: 'DA-2026-12',
    projectTitle: 'Phần Mềm Quản Lý Kho Đa Kênh Microservices',
    clientName: 'Lê Quốc Hùng',
    clientEmail: 'hung.lq@khtn.edu.vn',
    clientSchool: 'ĐH Khoa Học Tự Nhiên',
    departmentKey: 'tech',
    departmentName: 'Đội Ngũ Kỹ Thuật',
    assignedDevName: 'Hoàng Long',
    ratingOverall: 2.0,
    ratingCodeQuality: 3,
    ratingTimeline: 2,
    ratingSupport: 2,
    comment: 'Lần đầu tải source code về bị xung đột port Redis và database PostgreSQL trên máy cá nhân, dù dev đã sửa lại ngay trong sáng hôm sau nhưng mình mong muốn quy trình kiểm tra trước khi bàn giao được hoàn thiện kỹ càng hơn.',
    highlightTag: 'Cần Kiểm Tra Môi Trường Kỹ Hơn',
    createdAt: '18/07/2026',
    status: 'published',
    adminReply: {
      author: 'Trưởng Phòng CSKH & Kiểm Định Chất Lượng',
      authorRole: 'Hội Đồng CSKH LUBPY',
      content: STANDARD_REVIEW_TEMPLATES.CASE_1_UNSATISFIED.content,
      repliedAt: '18/07/2026',
      templateCase: 1
    }
  }
];

export function getStoredCustomerReviews(): CustomerReview[] {
  try {
    const saved = localStorage.getItem('lubpy_customer_reviews');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading customer reviews from localStorage:', e);
  }
  return INITIAL_CUSTOMER_REVIEWS;
}

export function saveCustomerReviews(reviews: CustomerReview[]) {
  try {
    localStorage.setItem('lubpy_customer_reviews', JSON.stringify(reviews));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('lubpy_reviews_updated'));
  } catch (e) {
    console.error('Error saving customer reviews:', e);
  }
}

export function addCustomerReview(newReview: Omit<CustomerReview, 'id' | 'createdAt'>): CustomerReview {
  const all = getStoredCustomerReviews();
  const nextId = `REV-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, '0')}`;
  const created: CustomerReview = {
    ...newReview,
    id: nextId,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    status: newReview.status || 'published'
  };
  const updated = [created, ...all];
  saveCustomerReviews(updated);
  return created;
}

export function deleteCustomerReview(reviewId: string): CustomerReview[] {
  const all = getStoredCustomerReviews();
  const updated = all.filter(r => r.id !== reviewId);
  saveCustomerReviews(updated);
  return updated;
}

export function replyToCustomerReview(
  reviewId: string, 
  replyContent: string, 
  authorName: string = 'Chuyên Viên CSKH',
  authorRole: string = 'Ban Chăm Sóc Khách Hàng LUBPY',
  authorAvatar?: string,
  templateCase?: number
): CustomerReview[] {
  const all = getStoredCustomerReviews();
  const updated = all.map(r => {
    if (r.id === reviewId) {
      return {
        ...r,
        adminReply: {
          author: authorName,
          authorRole: authorRole,
          authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(authorName)}&backgroundColor=0f172a`,
          content: replyContent,
          repliedAt: new Date().toLocaleDateString('vi-VN'),
          templateCase: templateCase || (r.ratingOverall < 3.0 ? 1 : r.ratingOverall < 4.0 ? 2 : 3)
        }
      };
    }
    return r;
  });
  saveCustomerReviews(updated);
  return updated;
}
