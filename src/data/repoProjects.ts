export interface RepoProjectPackage {
  name: string;
  priceVnd: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface RepoProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Web Fullstack' | 'AI & Computer Vision' | 'Mobile App' | 'Blockchain Web3' | 'IoT & Hệ Thống Nhúng' | 'Microservices & Cloud';
  assignedTechTeam: string;
  techLead: string;
  techStack: string[];
  defenseScore: string; // E.g., '10.0 / 10'
  targetStudents: string;
  description: string;
  keyFeatures: string[];
  deliverables: {
    name: string;
    type: 'SOURCE' | 'DOC' | 'SLIDE' | 'DATA' | 'REPORT' | 'VIDEO';
    size: string;
    downloadUrl?: string;
  }[];
  pricingPackages: RepoProjectPackage[];
  status: 'Sẵn sàng bàn giao' | 'Đã kiểm thử 100%' | 'Hot';
  demoUrl?: string;
}

export const REPO_PROJECTS_CATALOG: RepoProjectItem[] = [
  {
    id: 'LUBPY-REPO-01',
    title: 'Hệ Thống Sàn Thương Mại Điện Tử Microservices & Cổng Thanh Toán MoMo/VNPAY',
    subtitle: 'Đồ án tốt nghiệp Chuyên ngành Kỹ thuật Phần mềm (SE)',
    category: 'Microservices & Cloud',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối Web & Backend Core)',
    techLead: 'Phan Quốc Bảo (Tech Lead Engineering)',
    techStack: ['React 18', 'Spring Boot 3', 'Apache Kafka', 'PostgreSQL', 'Redis', 'Docker', 'VNPAY API'],
    defenseScore: '10.0 / 10 (Xuất sắc)',
    targetStudents: 'Sinh viên ĐH Bách Khoa, KHTN, FPT, Công nghệ Bưu chính Viễn thông',
    description: 'Hệ thống E-Commerce chuẩn kiến trúc Microservices phân tán cao cấp: Auth Service, Product Service, Order Service, Notification Service qua Kafka, tích hợp thanh toán quét mã QR VNPAY/MoMo chuẩn ngân hàng và quản lý đơn hàng thời gian thực.',
    keyFeatures: [
      'Kiến trúc Event-Driven Microservices với Apache Kafka & Docker Compose',
      'Tích hợp Cổng thanh toán Sandbox MoMo & VNPAY quét mã QR thanh toán tức thì',
      'Hệ thống Caching Redis tăng tốc độ truy vấn gấp 8 lần, chống nghẽn đơn flash sale',
      'Trang quản trị Admin Dashboard phân quyền RBAC và thống kê doanh thu đa chiều'
    ],
    deliverables: [
      { name: 'SourceCode_Fullstack_Ecommerce_Microservices_v3.2.zip', type: 'SOURCE', size: '128.5 MB' },
      { name: 'BaoCao_LuanVan_TotNghiep_Ecommerce_Microservices_115Trang.docx', type: 'DOC', size: '22.4 MB' },
      { name: 'Slide_ThuyetTrinh_BaoVe_DoAn_DatDiem10_Mau1.pptx', type: 'SLIDE', size: '28.6 MB' },
      { name: 'Database_PostgreSQL_Schema_Seed_Ecommerce_Full.sql', type: 'DATA', size: '14.2 MB' },
      { name: 'SoDo_KienTruc_Microservices_ERD_SequenceDiagram.drawio', type: 'REPORT', size: '6.5 MB' },
      { name: 'Video_HuongDan_CaiDat_Docker_ChayDemo_FullHD.mp4', type: 'VIDEO', size: '240.0 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Mã Nguồn + Database)',
        priceVnd: 890000,
        description: 'Toàn bộ Source code Frontend, Backend Microservices và Database Schema đầy đủ script nạp dữ liệu.',
        features: ['Full Source Code React + Spring Boot', 'File Database PostgreSQL + Docker Compose', 'File README hướng dẫn từng bước khởi động']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source Code + Báo Cáo + Slide)',
        priceVnd: 1650000,
        recommended: true,
        description: 'Trọn bộ mã nguồn hoàn chỉnh kèm Báo cáo đồ án luận văn 115 trang và Slide thuyết trình chuyên nghiệp.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Cuốn Báo Cáo Thuyết Minh 115 trang chuẩn Bộ GD&ĐT', 'Slide bảo vệ PowerPoint (.pptx) hiệu ứng chuyên sâu', 'Sơ đồ UML, UseCase, Sequence, ERD thiết kế sẵn']
      },
      {
        name: 'Gói VIP Toàn Diện (Hỗ Trợ Cài Đặt + Hướng Dẫn Phản Biện)',
        priceVnd: 2450000,
        description: 'Đội ngũ Kỹ sư LUBPY hỗ trợ cài đặt chạy mượt mà trên máy của bạn qua Ultraview/Anydesk và chia sẻ bộ câu hỏi bảo vệ.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Kỹ sư hỗ trợ cài đặt Ultraviewer/AnyDesk 1-1', 'Sổ tay 50 câu hỏi phản biện của Hội đồng và đáp án', 'Bảo hành fix lỗi đồ án đến ngày lên sàn bảo vệ']
      }
    ],
    status: 'Hot',
    demoUrl: 'https://ecommerce-microservices-demo.lubpystudio.vn'
  },
  {
    id: 'LUBPY-REPO-02',
    title: 'Hệ Thống AI Nhận Diện Khuôn Mặt Điểm Danh & Phát Hiện Vi Phạm Lớp Học',
    subtitle: 'Đồ án tốt nghiệp Chuyên ngành Trí Tuệ Nhân Tạo (AI) & Khoa Học Dữ Liệu',
    category: 'AI & Computer Vision',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối Computer Vision & AI)',
    techLead: 'Trần Hoàng Nam (Senior AI/CV Specialist)',
    techStack: ['Python', 'FastAPI', 'PyTorch', 'YOLOv8', 'DeepSORT', 'InsightFace', 'React Dashboard'],
    defenseScore: '9.9 / 10 (Xuất sắc)',
    targetStudents: 'Sinh viên chuyên ngành Khoa học Máy tính, AI, Kỹ thuật Dữ liệu',
    description: 'Hệ thống nhận diện khuôn mặt điểm danh tự động từ camera thời gian thực với độ chính xác 99.4%, chống giả mạo khuôn mặt (Anti-Spoofing Liveness Detection) và cảnh báo sinh viên dùng điện thoại hoặc quay cóp trong phòng thi.',
    keyFeatures: [
      'Mô hình InsightFace trích xuất vector đặc trưng 512D tốc độ 30 FPS trên GPU/CPU',
      'Cơ chế chống gian lận Anti-Spoofing phát hiện ảnh chụp điện thoại / in giấy',
      'Module điểm danh tự động đồng bộ thời gian thực vào cơ sở dữ liệu học vụ',
      'API FastAPI chuẩn RESTful tích hợp giao diện quản trị React Tailwind'
    ],
    deliverables: [
      { name: 'SourceCode_FastAPI_PyTorch_YOLOv8_InsightFace_AI.zip', type: 'SOURCE', size: '210.0 MB' },
      { name: 'BaoCao_LuanVan_AI_DiemDanh_NhanDienKhuonMat_108Trang.docx', type: 'DOC', size: '19.8 MB' },
      { name: 'Slide_BaoVe_ChuyenNganh_AI_MachineLearning_DarkUI.pptx', type: 'SLIDE', size: '31.0 MB' },
      { name: 'TrongSo_MoHinh_Pretrained_Weights_YOLO_InsightFace.onnx', type: 'DATA', size: '185.0 MB' },
      { name: 'Dataset_Mau_FaceAntiSpoofing_Clean_2000Imgs.zip', type: 'DATA', size: '145.0 MB' },
      { name: 'Video_ThucNghiem_NhanDien_CamRealtime_Test.mp4', type: 'VIDEO', size: '190.0 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Mã Nguồn + Trọng Số Model)',
        priceVnd: 950000,
        description: 'Source code FastAPI AI, Web React và toàn bộ trọng số mô hình đã train sẵn.',
        features: ['Full Source Code Python + React', 'Trọng số Model InsightFace + YOLOv8 ONNX', 'Dataset mẫu thực nghiệm']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo + Slide AI)',
        priceVnd: 1750000,
        recommended: true,
        description: 'Trọn bộ mã nguồn kèm Báo cáo giải thuật AI 108 trang và Slide bảo vệ chuẩn Dark Modern.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo thuyết minh công thức toán, loss function, ma trận nhầm lẫn', 'Slide thuyết trình bảo vệ đồ án chuẩn đồ thị AI']
      },
      {
        name: 'Gói VIP Toàn Diện (Cài Đặt GPU + Tập Dượt Bảo Vệ)',
        priceVnd: 2600000,
        description: 'Kỹ sư AI hỗ trợ config CUDA/cuDNN GPU hoặc tối ưu CPU mượt mà và luyện tập demo.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Cài đặt môi trường Python CUDA/cuDNN trực tiếp', 'Bộ câu hỏi phản biện chuyên sâu về Overfitting, Liveness, Precision/Recall']
      }
    ],
    status: 'Hot',
    demoUrl: 'https://ai-face-attendance.lubpystudio.vn'
  },
  {
    id: 'LUBPY-REPO-03',
    title: 'Nền Tảng Bác Sĩ Gia Đình & Khám Bệnh Trực Tuyến Telemedicine WebRTC',
    subtitle: 'Đồ án tốt nghiệp Hệ thống Thông tin Y tế & Web Thời Gian Thực',
    category: 'Web Fullstack',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối Y Tế Số & WebRTC)',
    techLead: 'Lê Hoàng Long (Fullstack Lead Architect)',
    techStack: ['Next.js 14', 'NestJS', 'WebRTC', 'Socket.IO', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
    defenseScore: '9.8 / 10 (Xuất sắc)',
    targetStudents: 'Sinh viên ngành Hệ thống Thông tin (MIS), Công nghệ Phần mềm',
    description: 'Nền tảng kết nối bệnh nhân và bác sĩ gia đình: Gọi video trực tuyến khám bệnh qua WebRTC HD, đặt lịch khám theo khung giờ, quản lý bệnh án điện tử (EMR) bảo mật và kê đơn thuốc gửi Zalo/SMS tự động.',
    keyFeatures: [
      'Phòng khám Video trực tuyến độ trễ siêu thấp (<200ms) qua WebRTC & Socket.IO',
      'Quản lý hồ sơ bệnh án điện tử (EMR) tuân thủ tiêu chuẩn bảo mật dữ liệu y tế',
      'Lịch hẹn thông minh với hệ thống nhắc lịch tự động qua SMS và Email',
      'Đơn thuốc điện tử tích hợp chữ ký số và tra cứu tương tác thuốc an toàn'
    ],
    deliverables: [
      { name: 'SourceCode_NextJS14_NestJS_Telemedicine_Full.zip', type: 'SOURCE', size: '95.0 MB' },
      { name: 'BaoCao_LuanVan_HeThong_KhamBenh_TuXa_Telemedicine_102Trang.docx', type: 'DOC', size: '18.2 MB' },
      { name: 'Slide_ThuyetTrinh_BaoVe_DeTai_YTeSo_Telehealth.pptx', type: 'SLIDE', size: '25.0 MB' },
      { name: 'Database_Medical_Schema_PostgreSQL.sql', type: 'DATA', size: '11.5 MB' },
      { name: 'TaiLieu_KienTruc_WebRTC_Signaling_Server.pdf', type: 'REPORT', size: '4.8 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Mã Nguồn + Cấu Hình Signaling)',
        priceVnd: 850000,
        description: 'Mã nguồn Next.js 14 + NestJS kèm server WebRTC Signaling chạy trơn tru.',
        features: ['Full Source Code Next.js & NestJS', 'Cấu hình WebRTC STUN/TURN Server', 'Kịch bản dữ liệu bệnh án mẫu']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo Y Tế + Slide)',
        priceVnd: 1550000,
        recommended: true,
        description: 'Đầy đủ Báo cáo nghiên cứu đề tài Y tế số 102 trang và Slide thuyết trình.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo tốt nghiệp 102 trang chuẩn quy định', 'Slide PowerPoint bảo vệ đẹp mắt']
      },
      {
        name: 'Gói VIP Toàn Diện (Hỗ Trợ Triển Khai Cloud & Cài Đặt)',
        priceVnd: 2350000,
        description: 'Hỗ trợ cấu hình camera, mic, chạy demo 2 thiết bị gọi video thực tế.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Hỗ trợ kỹ thuật cấu hình gọi video trực tiếp', 'Tập kịch bản demo khám bệnh 10 phút bảo đảm điểm 10']
      }
    ],
    status: 'Sẵn sàng bàn giao',
    demoUrl: 'https://telemedicine-lubpy-demo.vercel.app'
  },
  {
    id: 'LUBPY-REPO-04',
    title: 'App Quản Lý Chi Tiêu Cá Nhân & AI Quét Hóa Đơn OCR Thông Minh (Flutter)',
    subtitle: 'Đồ án tốt nghiệp Chuyên ngành Phát triển Ứng dụng Di động (Mobile App)',
    category: 'Mobile App',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối Mobile iOS/Android)',
    techLead: 'Vũ Đức Thắng (Senior Flutter Mobile Specialist)',
    techStack: ['Flutter 3.x', 'Dart', 'Firebase Auth', 'Gemini Vision AI OCR', 'SQLite / Hive', 'BLoC Pattern'],
    defenseScore: '9.9 / 10 (Xuất sắc)',
    targetStudents: 'Sinh viên khoa Công nghệ Thông tin, Kỹ thuật Máy tính, Ứng dụng Di động',
    description: 'Ứng dụng mobile đa nền tảng iOS & Android quản lý ngân sách thu chi hàng tháng: Tự động chụp và bóc tách hóa đơn siêu thị/nhà hàng bằng Gemini AI OCR, biểu đồ phân tích chi tiêu sinh động và đồng bộ đám mây.',
    keyFeatures: [
      'Chụp ảnh hóa đơn -> Gemini Vision AI tự động nhận diện danh mục, số tiền, ngày giờ',
      'Kiến trúc Clean Architecture với BLoC State Management chuẩn mực',
      'Hỗ trợ chế độ Offline-First với Local Database Hive, tự đồng bộ khi có mạng',
      'Báo cáo trực quan đa chiều dạng biểu đồ Donut, Bar Chart và xuất file Excel/PDF'
    ],
    deliverables: [
      { name: 'SourceCode_Flutter_MobileApp_CleanArchitecture_BLoC.zip', type: 'SOURCE', size: '105.0 MB' },
      { name: 'BaoCao_LuanVan_App_Mobile_QuanLyChiTieu_AI_OCR_95Trang.docx', type: 'DOC', size: '16.5 MB' },
      { name: 'Slide_ThuyetTrinh_MobileApp_Finance_ChuyenNghiep.pptx', type: 'SLIDE', size: '22.0 MB' },
      { name: 'File_CaiDat_Android_Release_APK_Demo.apk', type: 'DATA', size: '42.0 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Source Flutter + File APK)',
        priceVnd: 890000,
        description: 'Mã nguồn Flutter sạch đẹp, chạy ngay trên Android Studio / VSCode và file APK cài thử.',
        features: ['Full Source Code Flutter + Dart', 'File APK cài đặt trên điện thoại thực tế', 'Tích hợp sẵn API OCR miễn phí']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo Mobile + Slide)',
        priceVnd: 1590000,
        recommended: true,
        description: 'Source code kèm Báo cáo thiết kế ứng dụng Mobile chuẩn IEEE và Slide thuyết trình.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo tốt nghiệp 95 trang phân tích chi tiết BLoC Pattern', 'Slide thuyết trình bảo vệ mobile bắt mắt']
      },
      {
        name: 'Gói VIP Toàn Diện (Hỗ Trợ Build Máy Thật & Phản Biện)',
        priceVnd: 2390000,
        description: 'Kỹ sư hỗ trợ build app trực tiếp lên điện thoại của bạn, chuẩn bị kịch bản demo chấm điểm.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Hỗ trợ build chạy trên máy thật Android/iOS', 'Bộ câu hỏi phản biện chuyên sâu về Flutter Lifecycle & State']
      }
    ],
    status: 'Hot',
    demoUrl: 'https://flutter-finance-ai.lubpystudio.vn'
  },
  {
    id: 'LUBPY-REPO-05',
    title: 'Hệ Sinh Thái Nông Nghiệp Thông Minh IoT Giám Sát Thời Gian Thực & Điều Khiển',
    subtitle: 'Đồ án tốt nghiệp Kỹ thuật Máy tính, Điện - Điện Tử & Mạng Cảm Biến IoT',
    category: 'IoT & Hệ Thống Nhúng',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối IoT & Hệ Thống Nhúng)',
    techLead: 'Đinh Tuấn Kiệt (IoT & Embedded Systems Engineer)',
    techStack: ['ESP32', 'C/C++ Arduino', 'MQTT Broker', 'FreeRTOS', 'React Dashboard', 'Node.js Backend'],
    defenseScore: '10.0 / 10 (Thủ khoa đề tài)',
    targetStudents: 'Sinh viên ĐH Bách Khoa, Sư phạm Kỹ thuật, Bưu chính Viễn thông',
    description: 'Hệ thống Smart Farm giám sát độ ẩm đất, nhiệt độ không khí, nồng độ pH, ánh sáng và tự động bật bơm tưới nhỏ giọt, điều khiển quạt làm mát qua giao thức MQTT thời gian thực kèm ứng dụng Web điều khiển từ xa.',
    keyFeatures: [
      'Firmware ESP32 đa nhiệm FreeRTOS tiết kiệm năng lượng, chống mất kết nối WiFi',
      'Giao thức MQTT truyền dữ liệu cực nhanh với QoS 1, hiển thị biểu đồ tức thì trên Web',
      'Cơ chế tự động hóa theo ngưỡng cảm biến (Threshold) hoặc lịch hẹn tùy chỉnh',
      'Cảnh báo sự cố qua thông báo đẩy Web Push và tin nhắn Telegram Bot tự động'
    ],
    deliverables: [
      { name: 'SmartFarm_IoT_ESP32_MQTT_Arduino_Firmware_Source.zip', type: 'SOURCE', size: '48.0 MB' },
      { name: 'BaoCao_LuanVan_NongNghiepThongMinh_IoT_ESP32_110Trang.docx', type: 'DOC', size: '24.0 MB' },
      { name: 'Slide_ThuyetTrinh_BaoVe_DoAn_IoT_Hardware.pptx', type: 'SLIDE', size: '30.0 MB' },
      { name: 'SoDo_Mach_NguyenLy_Fritzing_PCB_Layout.pdf', type: 'REPORT', size: '12.0 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Firmware C++ + Web Dashboard)',
        priceVnd: 850000,
        description: 'Mã nguồn nạp chip ESP32 (Arduino IDE) và Web Dashboard React điều khiển MQTT.',
        features: ['Full Source Code ESP32 C/C++', 'Web Dashboard React thời gian thực', 'Sơ đồ nối chân cảm biến chi tiết']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo Phần Cứng + Slide)',
        priceVnd: 1550000,
        recommended: true,
        description: 'Bao gồm toàn bộ mã nguồn, báo cáo 110 trang có sơ đồ nguyên lý mạch và slide bảo vệ.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo luận văn 110 trang có tính toán nguồn và linh kiện', 'Slide bảo vệ phần cứng chuyên nghiệp']
      },
      {
        name: 'Gói VIP Toàn Diện (Hỗ Trợ Nạp Code ESP32 & Mô Phỏng Wokwi)',
        priceVnd: 2290000,
        description: 'Kỹ sư hướng dẫn nạp code trực tiếp vào mạch hoặc chạy mô phỏng 100% trên Wokwi nếu chưa kịp mua linh kiện.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Link mô phỏng mạch điện tử chạy 100% trên Wokwi online', 'Kịch bản trả lời Hội đồng về nhiễu tín hiệu và giao thức MQTT']
      }
    ],
    status: 'Đã kiểm thử 100%',
    demoUrl: 'https://smartfarm-iot.lubpystudio.vn'
  },
  {
    id: 'LUBPY-REPO-06',
    title: 'Trợ Lý AI Tư Vấn Pháp Luật Doanh Nghiệp RAG & Tra Cứu Văn Bản Luật',
    subtitle: 'Đồ án tốt nghiệp Hệ Thống Thông Tin & Ứng Dụng Mô Hình Ngôn Ngữ Lớn (LLM)',
    category: 'AI & Computer Vision',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối Generative AI & NLP)',
    techLead: 'Trần Hoàng Nam (Senior AI/CV Specialist)',
    techStack: ['Python', 'FastAPI', 'LangChain', 'ChromaDB', 'Gemini Pro API', 'React 18', 'Tailwind CSS'],
    defenseScore: '9.8 / 10 (Xuất sắc)',
    targetStudents: 'Sinh viên ngành Khoa học Máy tính, Trí tuệ Nhân tạo, Hệ thống Thông tin',
    description: 'Ứng dụng kiến trúc Retrieval-Augmented Generation (RAG) tiên tiến: Cho phép người dùng đặt câu hỏi pháp lý tự nhiên, AI tự động tra cứu văn bản luật Việt Nam tương ứng, trích dẫn chính xác điều khoản, khoản mục và giải đáp chi tiết.',
    keyFeatures: [
      'Vector Database ChromaDB lưu trữ hơn 15.000 điều luật Doanh nghiệp & Lao động',
      'Kỹ thuật Chunking & Semantic Search tối ưu độ tương đồng văn bản pháp lý',
      'Trả lời kèm đường link trích dẫn chính xác Nghị định, Thông tư của Nhà nước',
      'Giao diện Chat trực quan dạng Streaming phản hồi từng từ như ChatGPT'
    ],
    deliverables: [
      { name: 'LangChain_RAG_ChromaDB_LawConsultant_FullCode.zip', type: 'SOURCE', size: '82.0 MB' },
      { name: 'BaoCao_LuanVan_AI_RAG_TuVanPhapLuat_105Trang.docx', type: 'DOC', size: '17.5 MB' },
      { name: 'Slide_ThuyetTrinh_DeTai_GenerativeAI_RAG.pptx', type: 'SLIDE', size: '26.0 MB' },
      { name: 'Dataset_VanBanPhapLuat_Vectorized_ChromaDB.zip', type: 'DATA', size: '92.0 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Source Code RAG + Vector DB)',
        priceVnd: 950000,
        description: 'Mã nguồn RAG LangChain hoàn chỉnh kèm Vector Database đã nạp sẵn dữ liệu luật.',
        features: ['Full Source Code Python FastAPI + React', 'Cơ sở dữ liệu Vector ChromaDB chuẩn bị sẵn', 'File hướng dẫn chạy local']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo RAG + Slide)',
        priceVnd: 1690000,
        recommended: true,
        description: 'Đầy đủ Báo cáo phân tích chuyên sâu về RAG, Vector Search, Prompt Engineering và Slide bảo vệ.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo thuyết minh 105 trang phân tích Embedding & RAG', 'Slide thuyết trình bảo vệ AI cực kỳ ấn tượng']
      },
      {
        name: 'Gói VIP Toàn Diện (Tối Ưu Key API & Luyện Phản Biện)',
        priceVnd: 2490000,
        description: 'Kỹ sư AI hỗ trợ setup API Key miễn phí, tối ưu chi phí token và chuẩn bị các câu hỏi hóc búa về Hallucination.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Hỗ trợ kỹ thuật cấu hình API Key chạy tức thì', 'Bộ câu hỏi phản biện về hiện tượng ảo giác (Hallucination) và giải pháp khắc phục']
      }
    ],
    status: 'Hot',
    demoUrl: 'https://ai-legal-assistant.lubpystudio.vn'
  },
  {
    id: 'LUBPY-REPO-07',
    title: 'Hệ Thống Quản Trị Kho Vận & Chuỗi Cung Ứng Thông Minh (WMS & Logistics)',
    subtitle: 'Đồ án tốt nghiệp Ngành Hệ thống Thông tin Quản lý & Kỹ thuật Phần mềm',
    category: 'Web Fullstack',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối Doanh Nghiệp & ERP)',
    techLead: 'Lê Hoàng Long (Fullstack Lead Architect)',
    techStack: ['React 18', 'Golang Gin / Node.js', 'PostgreSQL', 'Redis', 'QR/Barcode Scanner', 'Chart.js'],
    defenseScore: '9.7 / 10 (Xuất sắc)',
    targetStudents: 'Sinh viên ngành Thương mại Điện tử, Hệ thống Thông tin, Kỹ thuật Phần mềm',
    description: 'Hệ thống Quản lý Kho bãi thông minh chuẩn ERP: Nhập kho, xuất kho, kiểm kê hàng hóa bằng máy quét mã vạch/QR Code trên điện thoại, thuật toán cảnh báo hết hàng tự động và dự báo tồn kho tối ưu.',
    keyFeatures: [
      'Quét mã vạch/QR Code xuất nhập kho bằng Camera điện thoại hoặc súng quét mã',
      'Quy trình kiểm kê kho đa vị trí (Zone / Aisle / Shelf / Bin Location)',
      'Hệ thống cảnh báo hàng tồn cận date, hàng dưới định mức an toàn tự động',
      'Báo cáo doanh thu, tồn kho theo phương pháp FIFO/LIFO chuyên nghiệp'
    ],
    deliverables: [
      { name: 'SourceCode_WMS_Warehouse_Logistics_Fullstack.zip', type: 'SOURCE', size: '78.0 MB' },
      { name: 'BaoCao_LuanVan_QuanTriKho_WMS_ERP_100Trang.docx', type: 'DOC', size: '16.0 MB' },
      { name: 'Slide_ThuyetTrinh_BaoVe_DoAn_WMS.pptx', type: 'SLIDE', size: '23.5 MB' },
      { name: 'Database_WMS_PostgreSQL_Schema_SampleData.sql', type: 'DATA', size: '8.5 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Mã Nguồn + Database WMS)',
        priceVnd: 850000,
        description: 'Mã nguồn hoàn chỉnh kèm dữ liệu mẫu các loại mặt hàng và kho bãi.',
        features: ['Full Source Code Web App', 'Database PostgreSQL có sẵn dữ liệu test', 'Tài liệu hướng dẫn cài đặt']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo WMS + Slide)',
        priceVnd: 1550000,
        recommended: true,
        description: 'Đầy đủ báo cáo đồ án nghiệp vụ kho vận 100 trang và Slide thuyết trình.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo thuyết minh 100 trang chuẩn chỉ', 'Slide PowerPoint bảo vệ đẹp mắt']
      },
      {
        name: 'Gói VIP Toàn Diện (Hỗ Trợ Cài Đặt + Kịch Bản Demo)',
        priceVnd: 2250000,
        description: 'Hỗ trợ cài đặt toàn diện và chuẩn bị kịch bản demo quét mã trực tiếp trên điện thoại.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Hỗ trợ cấu hình quét camera điện thoại thực tế', 'Bảo hành sửa lỗi đồ án đến ngày chấm điểm']
      }
    ],
    status: 'Sẵn sàng bàn giao',
    demoUrl: 'https://smart-wms-demo.lubpystudio.vn'
  },
  {
    id: 'LUBPY-REPO-08',
    title: 'Sàn Đấu Giá Số & Giao Dịch Chứng Nhận Bản Quyền Web3 Smart Contract',
    subtitle: 'Đồ án tốt nghiệp Chuyên ngành Công Nghệ Chuỗi Khối (Blockchain)',
    category: 'Blockchain Web3',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối Blockchain & Smart Contract)',
    techLead: 'Phan Quốc Bảo (Tech Lead Engineering)',
    techStack: ['Solidity', 'Hardhat', 'Ethers.js', 'React', 'MetaMask', 'IPFS / Pinata', 'Sepolia Testnet'],
    defenseScore: '10.0 / 10 (Thủ khoa ngành)',
    targetStudents: 'Sinh viên định hướng Blockchain, FinTech, An toàn Thông tin',
    description: 'Nền tảng đấu giá tài sản số phi tập trung (DApp): Smart Contract viết bằng Solidity chuẩn ERC-721/ERC-1155, kết nối ví MetaMask, đấu giá kiểu Anh (English Auction), tự động hoàn tiền người thua đấu giá và lưu trữ phi tập trung trên IPFS.',
    keyFeatures: [
      'Smart Contract Solidity bảo mật cao đã audit chống tấn công Reentrancy Attack',
      'Đấu giá kiểu Anh thời gian thực: Tự động gia hạn khi có người đặt cược phút chót',
      'Hợp đồng thông minh tự động chuyển giao NFT cho người thắng và hoàn tiền cho người thua',
      'Lưu trữ Metadata hình ảnh và thông tin vĩnh viễn trên mạng phân tán IPFS'
    ],
    deliverables: [
      { name: 'Solidity_SmartContract_ERC721_Auction_Hardhat_Project.zip', type: 'SOURCE', size: '65.0 MB' },
      { name: 'BaoCao_LuanVan_Blockchain_SmartContract_DauGia_112Trang.docx', type: 'DOC', size: '20.5 MB' },
      { name: 'Slide_ThuyetTrinh_DeTai_Blockchain_Web3.pptx', type: 'SLIDE', size: '29.0 MB' },
      { name: 'Unit_Test_Scripts_GasOptimization_Coverage100.zip', type: 'REPORT', size: '14.0 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Source Code DApp + Smart Contract)',
        priceVnd: 950000,
        description: 'Mã nguồn Smart Contract Solidity đã deploy Testnet kèm giao diện Web React.',
        features: ['Full Source Code Smart Contract Hardhat', 'Giao diện React Web3 kết nối ví MetaMask', 'Script deploy và verify trên Etherscan']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo Blockchain + Slide)',
        priceVnd: 1750000,
        recommended: true,
        description: 'Đầy đủ báo cáo 112 trang giải thích cơ chế Gas, EVM, Smart Contract và Slide bảo vệ đỉnh cao.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo thuyết minh 112 trang chuyên sâu về Blockchain', 'Slide thuyết trình bảo vệ chuyên ngành Web3']
      },
      {
        name: 'Gói VIP Toàn Diện (Hỗ Trợ Tặng ETH Testnet & Cài Đặt)',
        priceVnd: 2550000,
        description: 'Kỹ sư hỗ trợ cài đặt ví MetaMask, tặng ETH Sepolia Testnet để demo và luyện phản biện bảo mật hợp đồng.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Hỗ trợ cấu hình ví MetaMask và tặng ETH Testnet demo thoải mái', 'Bộ câu hỏi phản biện chuyên sâu về Reentrancy, Gas Optimization']
      }
    ],
    status: 'Hot',
    demoUrl: 'https://web3-auction-lubpy.vercel.app'
  },
  {
    id: 'LUBPY-REPO-09',
    title: 'Nền Tảng Khảo Sát & Thi Trắc Nghiệm Trực Tuyến Chống Gian Lận (AI Proctoring)',
    subtitle: 'Đồ án tốt nghiệp Hệ thống Giáo dục Trực tuyến (EdTech) & Trí Tuệ Nhân Tạo',
    category: 'Web Fullstack',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối EdTech & Web AI)',
    techLead: 'Lê Hoàng Long (Fullstack Lead Architect)',
    techStack: ['Next.js 14', 'Express.js', 'PostgreSQL', 'TensorFlow.js', 'Socket.IO', 'Tailwind CSS'],
    defenseScore: '9.8 / 10 (Xuất sắc)',
    targetStudents: 'Sinh viên ngành Sư phạm Tin, Công nghệ Phần mềm, Hệ thống Thông tin',
    description: 'Hệ thống thi trắc nghiệm trực tuyến giám sát thông minh bằng AI: Tự động phát hiện thí sinh quay mặt đi nơi khác, phát hiện mở tab trình duyệt khác, xáo trộn câu hỏi và đáp án tự động, chấm điểm tức thì và xuất bảng điểm Excel.',
    keyFeatures: [
      'TensorFlow.js chạy trực tiếp trên trình duyệt phát hiện chuyển hướng nhìn và rời khỏi khung hình',
      'Khóa toàn màn hình (Full-screen Lock) và cảnh báo khi thí sinh chuyển tab hoặc copy/paste',
      'Hệ thống ngân hàng câu hỏi phân chia theo mức độ nhận biết, thông hiểu, vận dụng',
      'Chấm điểm tự động và phân tích độ khó câu hỏi theo phương pháp trắc nghiệm hiện đại'
    ],
    deliverables: [
      { name: 'SourceCode_NextJS_EdTech_AIProctoring_Full.zip', type: 'SOURCE', size: '88.0 MB' },
      { name: 'BaoCao_LuanVan_HeThong_ThiTracNghiem_ChongGianLan_104Trang.docx', type: 'DOC', size: '18.0 MB' },
      { name: 'Slide_ThuyetTrinh_EdTech_ThiOnline.pptx', type: 'SLIDE', size: '24.0 MB' },
      { name: 'Database_Exam_Schema_PostgreSQL.sql', type: 'DATA', size: '9.0 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Mã Nguồn + Ngân Hàng Đề Thi Mẫu)',
        priceVnd: 850000,
        description: 'Mã nguồn Next.js + Express kèm 500 câu hỏi trắc nghiệm mẫu đa dạng.',
        features: ['Full Source Code Next.js & Express.js', 'Database PostgreSQL có sẵn câu hỏi mẫu', 'Hướng dẫn khởi chạy local chi tiết']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo EdTech + Slide)',
        priceVnd: 1550000,
        recommended: true,
        description: 'Trọn bộ mã nguồn kèm Báo cáo thuyết minh 104 trang và Slide thuyết trình.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo thuyết minh 104 trang chi tiết', 'Slide thuyết trình bảo vệ đẹp mắt']
      },
      {
        name: 'Gói VIP Toàn Diện (Cài Đặt Camera Giám Sát & Phản Biện)',
        priceVnd: 2290000,
        description: 'Hỗ trợ cài đặt chạy demo thực tế tính năng bắt gian lận camera trực tiếp.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Hỗ trợ cấu hình camera AI giám sát trên máy sinh viên', 'Kịch bản demo ấn tượng trước Hội đồng bảo vệ']
      }
    ],
    status: 'Sẵn sàng bàn giao',
    demoUrl: 'https://edtech-exam-proctoring.lubpystudio.vn'
  },
  {
    id: 'LUBPY-REPO-10',
    title: 'Hệ Thống Đặt Chuyến & Điều Phối Đội Xe Logistics Đô Thị Thời Gian Thực',
    subtitle: 'Đồ án tốt nghiệp Hệ Thống Bản Đồ Số (GIS) & Tối Ưu Hóa Tuyến Đường (Routing)',
    category: 'Mobile App',
    assignedTechTeam: 'Đội Ngũ Kỹ Thuật LUBPY (Khối GIS & Thuật Toán Tối Ưu)',
    techLead: 'Vũ Đức Thắng (Senior Flutter Mobile Specialist)',
    techStack: ['Flutter', 'Django REST Framework', 'PostGIS', 'Socket.IO', 'OpenStreetMap / OSRM', 'Leaflet'],
    defenseScore: '9.9 / 10 (Xuất sắc)',
    targetStudents: 'Sinh viên khoa Công nghệ Thông tin, Kỹ thuật Giao thông, Khoa học Máy tính',
    description: 'Hệ thống gọi xe và điều phối giao hàng tương tự Grab/Gojek: Ứng dụng khách hàng và tài xế chạy trên nền Flutter, định vị GPS thời gian thực, thuật toán Dijkstra / A* tìm đường ngắn nhất tối ưu chi phí và tính giá cước động.',
    keyFeatures: [
      'Bản đồ thời gian thực hiển thị vị trí tài xế di chuyển mượt mà qua Socket.IO',
      'Thuật toán ghép nối tài xế gần nhất (Matching Algorithm) trong bán kính 3km',
      'Hỗ trợ tích hợp bản đồ OpenStreetMap hoàn toàn miễn phí không lo tốn phí Google Maps API',
      'Theo dõi trạng thái đơn hàng từ lúc nhận hàng đến lúc giao thành công kèm ảnh chụp chữ ký'
    ],
    deliverables: [
      { name: 'SourceCode_Logistics_RideHailing_Flutter_Django.zip', type: 'SOURCE', size: '118.0 MB' },
      { name: 'BaoCao_LuanVan_HeThong_DieuPhoi_DoiXe_Logistics_106Trang.docx', type: 'DOC', size: '19.0 MB' },
      { name: 'Slide_ThuyetTrinh_DeTai_GiaoThongThongMinh.pptx', type: 'SLIDE', size: '27.5 MB' },
      { name: 'Database_PostGIS_Spatial_Schema.sql', type: 'DATA', size: '15.0 MB' }
    ],
    pricingPackages: [
      {
        name: 'Gói Sinh Viên (Source Code Mobile + Backend GIS)',
        priceVnd: 890000,
        description: 'Source code Flutter + Django REST và hệ thống định vị bản đồ không giới hạn.',
        features: ['Full Source Code 2 App Khách & Tài xế', 'Backend Django REST + PostGIS', 'Tài liệu cấu hình bản đồ OpenStreetMap miễn phí']
      },
      {
        name: 'Gói Tiêu Chuẩn (Source + Báo Cáo GIS + Slide)',
        priceVnd: 1650000,
        recommended: true,
        description: 'Đầy đủ báo cáo nghiên cứu thuật toán định tuyến 106 trang và Slide bảo vệ.',
        features: ['Bao gồm toàn bộ Gói Sinh Viên', 'Báo cáo luận văn 106 trang phân tích thuật toán Routing & Matching', 'Slide PowerPoint bảo vệ chuyên nghiệp']
      },
      {
        name: 'Gói VIP Toàn Diện (Hỗ Trợ Demo Giả Lập GPS Di Chuyển)',
        priceVnd: 2450000,
        description: 'Kỹ sư hỗ trợ cài đặt script giả lập xe di chuyển trên bản đồ trực tiếp lúc bảo vệ.',
        features: ['Bao gồm toàn bộ Gói Tiêu Chuẩn', 'Script giả lập xe tài xế chạy trên bản đồ cho Hội đồng xem trực tiếp', 'Bộ câu hỏi phản biện chuyên sâu về Geocoding & WebSocket']
      }
    ],
    status: 'Đã kiểm thử 100%',
    demoUrl: 'https://logistics-routing.lubpystudio.vn'
  }
];

export interface RepoReportItem {
  id: string;
  title: string;
  fileName: string;
  projectId: string;
  projectTitle: string;
  type: 'THESIS_DOC' | 'SLIDE' | 'SRS_SPEC' | 'DEFENSE_QA' | 'TEST_PLAN';
  format: 'Word (.docx)' | 'PowerPoint (.pptx)' | 'PDF (.pdf)' | 'Excel (.xlsx)' | 'Diagram (.drawio)';
  pagesOrSlides: string;
  size: string;
  defenseScore: string;
  academicStandard: string;
  techLeadAuthor: string;
  targetMajor: string;
  priceVnd: number;
  summary: string;
  chapters: string[];
}

export interface StarterRepoItem {
  id: string;
  title: string;
  fileName: string;
  category: string;
  techStack: string[];
  size: string;
  gitCloneUrl: string;
  stars: number;
  description: string;
  folderStructure: string[];
  runCommands: string[];
}

export const STARTER_REPOS_CATALOG: StarterRepoItem[] = [
  {
    id: 'STARTER-01',
    title: 'Next.js 14 App Router + Tailwind + Prisma Starter Boilerplate',
    fileName: 'Boilerplate_NextJS14_Tailwind_Prisma_Fullstack_Starter.zip',
    category: 'Web Fullstack',
    techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Prisma ORM', 'NextAuth.js'],
    size: '85.4 MB',
    gitCloneUrl: 'git clone https://github.com/lubpy-studio/nextjs14-prisma-starter.git',
    stars: 184,
    description: 'Bộ khung dự án Web Fullstack chuẩn mực với Authentication, Dark/Light mode, bảo mật CSRF và CRUD mẫu.',
    folderStructure: ['/src/app/(routes)', '/src/components/ui', '/src/lib/prisma.ts', '/prisma/schema.prisma'],
    runCommands: ['npm install', 'npx prisma db push', 'npm run dev']
  },
  {
    id: 'STARTER-02',
    title: 'FastAPI + PyTorch + OpenCV Computer Vision Microservice Template',
    fileName: 'SourceCode_FastAPI_PyTorch_YOLOv8_ComputerVision_Module.zip',
    category: 'AI & Computer Vision',
    techStack: ['Python 3.10', 'FastAPI', 'PyTorch', 'OpenCV', 'Docker'],
    size: '142.0 MB',
    gitCloneUrl: 'git clone https://github.com/lubpy-studio/fastapi-pytorch-cv-starter.git',
    stars: 215,
    description: 'Khung API hiệu năng cao chuyên nhận diện hình ảnh, stream video camera và suy luận mô hình AI với GPU/CPU.',
    folderStructure: ['/app/api/v1', '/app/models/weights', '/app/core/config.py', 'Dockerfile'],
    runCommands: ['pip install -r requirements.txt', 'uvicorn app.main:app --reload --port 8000']
  },
  {
    id: 'STARTER-03',
    title: 'Flutter 3.x Clean Architecture + BLoC Mobile Starter Kit',
    fileName: 'Template_Flutter_MobileApp_CleanArchitecture_BLoC.zip',
    category: 'Mobile App',
    techStack: ['Flutter 3', 'Dart', 'flutter_bloc', 'Dio', 'Hive Local DB'],
    size: '98.6 MB',
    gitCloneUrl: 'git clone https://github.com/lubpy-studio/flutter-clean-architecture-bloc.git',
    stars: 162,
    description: 'Khung ứng dụng di động chuẩn Clean Architecture phân tách Presentation, Domain và Data layer sắc nét.',
    folderStructure: ['/lib/core', '/lib/features/auth', '/lib/features/home', '/pubspec.yaml'],
    runCommands: ['flutter pub get', 'flutter run -d chrome/emulator']
  },
  {
    id: 'STARTER-04',
    title: 'Spring Boot 3 + Kafka + Docker Compose Microservices Skeleton',
    fileName: 'SpringBoot3_Microservices_Kafka_DockerCompose_Template.zip',
    category: 'Microservices & Cloud',
    techStack: ['Java 17', 'Spring Boot 3', 'Apache Kafka', 'PostgreSQL', 'Docker'],
    size: '115.0 MB',
    gitCloneUrl: 'git clone https://github.com/lubpy-studio/springboot3-kafka-microservices.git',
    stars: 198,
    description: 'Bộ khung kiến trúc microservices phân tán Event-Driven tích hợp sẵn Kafka Producer/Consumer và Docker Compose.',
    folderStructure: ['/auth-service', '/product-service', '/order-service', 'docker-compose.yml'],
    runCommands: ['docker-compose up -d', './mvnw clean spring-boot:run']
  },
  {
    id: 'STARTER-05',
    title: 'ESP32 IoT FreeRTOS + MQTT Firmware Framework',
    fileName: 'SmartFarm_IoT_ESP32_MQTT_Arduino_Firmware_Source.zip',
    category: 'IoT & Phần Cứng Nhúng',
    techStack: ['ESP32', 'C/C++ Arduino', 'FreeRTOS', 'MQTT PubSubClient'],
    size: '38.0 MB',
    gitCloneUrl: 'git clone https://github.com/lubpy-studio/esp32-freertos-mqtt-framework.git',
    stars: 140,
    description: 'Mã nguồn nhúng ESP32 đa luồng điều khiển cảm biến, tự động kết nối lại WiFi/MQTT và tiết kiệm năng lượng.',
    folderStructure: ['/firmware_src', '/lib/SensorDrivers', 'platformio.ini'],
    runCommands: ['pio run', 'pio run --target upload']
  },
  {
    id: 'STARTER-06',
    title: 'Hardhat + Solidity ERC721/ERC20 Smart Contract Suite',
    fileName: 'Solidity_SmartContract_ERC721_Auction_Hardhat_Project.zip',
    category: 'Blockchain Web3',
    techStack: ['Solidity 0.8.20', 'Hardhat', 'Ethers.js', 'OpenZeppelin'],
    size: '45.2 MB',
    gitCloneUrl: 'git clone https://github.com/lubpy-studio/hardhat-solidity-web3-starter.git',
    stars: 153,
    description: 'Môi trường phát triển Smart Contract chuẩn OpenZeppelin kèm bộ test suite 100% code coverage.',
    folderStructure: ['/contracts', '/scripts/deploy.js', '/test', 'hardhat.config.js'],
    runCommands: ['npm install', 'npx hardhat compile', 'npx hardhat test']
  }
];

export const STANDALONE_REPORTS_CATALOG: RepoReportItem[] = [
  {
    id: 'BC-01',
    title: 'Báo Cáo Luận Văn: Sàn Thương Mại Điện Tử Microservices & Cổng Thanh Toán MoMo/VNPAY',
    fileName: 'BaoCao_LuanVan_TotNghiep_Ecommerce_Microservices_115Trang.docx',
    projectId: 'LUBPY-REPO-01',
    projectTitle: 'Hệ Thống Sàn Thương Mại Điện Tử Microservices & Cổng Thanh Toán MoMo/VNPAY',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '115 Trang',
    size: '22.4 MB',
    defenseScore: '10.0 / 10',
    academicStandard: 'Chuẩn Bộ GD&ĐT 2026 (Times New Roman 13, Giãn dòng 1.5, Đầy đủ Lời cam đoan, Tài liệu tham khảo IEEE)',
    techLeadAuthor: 'Phan Quốc Bảo (Tech Lead Engineering)',
    targetMajor: 'Kỹ Thuật Phần Mềm (Software Engineering)',
    priceVnd: 590000,
    summary: 'Cuốn báo cáo nghiên cứu chuyên sâu về kiến trúc phân tán Microservices với Apache Kafka, phân tích 42 Use Case, 28 bảng ERD và đánh giá hiệu năng chịu tải 10,000 req/sec bằng Apache JMeter.',
    chapters: [
      'Chương 1: Tổng quan bài toán Thương Mại Điện Tử tải cao và lý do chọn kiến trúc Microservices',
      'Chương 2: Cơ sở lý thuyết về Event-Driven Architecture, Apache Kafka, Docker Container & Caching Redis',
      'Chương 3: Phân tích đặc tả yêu cầu chức năng, phi chức năng và thiết kế hệ thống (Use Case, ERD, Sequence)',
      'Chương 4: Hiện thực hóa các dịch vụ lõi (Auth, Product, Order, Payment) và tích hợp Sandbox VNPAY/MoMo',
      'Chương 5: Thực nghiệm đo lường hiệu năng chịu tải, kết luận và phương hướng mở rộng tương lai'
    ]
  },
  {
    id: 'BC-02',
    title: 'Báo Cáo Luận Văn: Hệ Thống AI Nhận Diện Khuôn Mặt Điểm Danh & Chống Giả Mạo Liveness',
    fileName: 'BaoCao_LuanVan_AI_DiemDanh_NhanDienKhuonMat_108Trang.docx',
    projectId: 'LUBPY-REPO-02',
    projectTitle: 'Hệ Thống AI Nhận Diện Khuôn Mặt Điểm Danh & Phát Hiện Vi Phạm Lớp Học',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '108 Trang',
    size: '19.8 MB',
    defenseScore: '9.9 / 10',
    academicStandard: 'Chuẩn Hội Đồng Khoa Học Máy Tính & AI (Đầy đủ ma trận nhầm lẫn Confusion Matrix, công thức Loss ArcFace)',
    techLeadAuthor: 'Trần Hoàng Nam (Senior AI/CV Specialist)',
    targetMajor: 'Khoa Học Máy Tính & Trí Tuệ Nhân Tạo',
    priceVnd: 620000,
    summary: 'Phân tích thuật toán trích xuất đặc trưng InsightFace 512 chiều, thuật toán phát hiện giả mạo Anti-Spoofing kiểm tra phản quang da và chuyển động mắt, độ chính xác thực nghiệm đạt 99.4%.',
    chapters: [
      'Chương 1: Giới thiệu bài toán điểm danh tự động và thách thức gian lận hình ảnh trong trường học',
      'Chương 2: Cơ sở lý thuyết Mạng nơ-ron tích chập (CNN), giải thuật YOLOv8 và hàm mất mát ArcFace Loss',
      'Chương 3: Thiết kế quy trình xử lý thị giác máy tính và cơ chế phát hiện gian lận Anti-Spoofing',
      'Chương 4: Cài đặt hệ thống với FastAPI, PyTorch và đồng bộ cơ sở dữ liệu học vụ thời gian thực',
      'Chương 5: Đánh giá độ chính xác thực nghiệm trên 2,000 khuôn mặt mẫu và kết luận đề tài'
    ]
  },
  {
    id: 'BC-03',
    title: 'Báo Cáo Luận Văn: Nền Tảng Bác Sĩ Gia Đình & Khám Bệnh Trực Tuyến Telemedicine WebRTC',
    fileName: 'BaoCao_LuanVan_HeThong_KhamBenh_TuXa_Telemedicine_102Trang.docx',
    projectId: 'LUBPY-REPO-03',
    projectTitle: 'Nền Tảng Bác Sĩ Gia Đình & Khám Bệnh Trực Tuyến Telemedicine WebRTC',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '102 Trang',
    size: '18.2 MB',
    defenseScore: '9.8 / 10',
    academicStandard: 'Chuẩn Hệ Thống Thông Tin Quản Lý (MIS) & Tiêu chuẩn bảo mật dữ liệu y tế điện tử EMR',
    techLeadAuthor: 'Lê Hoàng Long (Fullstack Lead Architect)',
    targetMajor: 'Hệ Thống Thông Tin & Y Tế Số',
    priceVnd: 550000,
    summary: 'Khảo sát quy trình khám bệnh từ xa, thiết kế giao thức Signaling qua WebRTC & Socket.IO, cơ sở dữ liệu bệnh án điện tử mã hóa AES-256 và quy trình kê đơn thuốc điện tử an toàn.',
    chapters: [
      'Chương 1: Khảo sát thực trạng y tế cơ sở và nhu cầu khám bệnh trực tuyến sau thời kỳ chuyển đổi số',
      'Chương 2: Công nghệ truyền thông thời gian thực WebRTC, giao thức STUN/TURN và bảo mật y tế',
      'Chương 3: Thiết kế kiến trúc tổng thể, mô hình thực thể quan hệ ERD và đặc tả Use Case khám bệnh',
      'Chương 4: Hiện thực hóa phòng khám ảo Video HD, chức năng kê đơn và thanh toán viện phí online',
      'Chương 5: Thử nghiệm độ trễ mạng (<200ms), đánh giá trải nghiệm người dùng và kết luận'
    ]
  },
  {
    id: 'BC-04',
    title: 'Báo Cáo Luận Văn: Ứng Dụng Mobile Quản Lý Chi Tiêu Cá Nhân & AI OCR Hóa Đơn (Flutter)',
    fileName: 'BaoCao_LuanVan_App_Mobile_QuanLyChiTieu_AI_OCR_95Trang.docx',
    projectId: 'LUBPY-REPO-04',
    projectTitle: 'App Quản Lý Chi Tiêu Cá Nhân & AI Quét Hóa Đơn OCR Thông Minh (Flutter)',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '95 Trang',
    size: '16.5 MB',
    defenseScore: '9.9 / 10',
    academicStandard: 'Chuẩn Kỹ Thuật Phần Mềm Di Động (Mobile App Design Pattern & Clean Architecture)',
    techLeadAuthor: 'Vũ Đức Thắng (Senior Flutter Mobile Specialist)',
    targetMajor: 'Công Nghệ Thông Tin & Lập Trình Di Động',
    priceVnd: 520000,
    summary: 'Nghiên cứu kiến trúc Clean Architecture trên Flutter kết hợp BLoC state pattern, ứng dụng Gemini Vision API bóc tách thông tin hóa đơn tiếng Việt tự động và cơ chế lưu trữ Offline-first với Hive DB.',
    chapters: [
      'Chương 1: Tổng quan về quản lý tài chính cá nhân và xu hướng số hóa chi tiêu của giới trẻ',
      'Chương 2: Nền tảng Flutter, kiến trúc Clean Architecture, BLoC Pattern và công nghệ OCR hình ảnh',
      'Chương 3: Thiết kế trải nghiệm người dùng UI/UX mobile, sơ đồ luồng dữ liệu và thiết kế CSDL Offline',
      'Chương 4: Xây dựng module nhận diện hóa đơn thông minh và module thống kê tài chính trực quan',
      'Chương 5: Đánh giá hiệu quả tiết kiệm thời gian nhập liệu, kiểm thử ứng dụng và kết luận'
    ]
  },
  {
    id: 'BC-05',
    title: 'Báo Cáo Luận Văn: Hệ Sinh Thái Nông Nghiệp Thông Minh IoT Giám Sát & Điều Khiển Tự Động',
    fileName: 'BaoCao_LuanVan_NongNghiepThongMinh_IoT_ESP32_110Trang.docx',
    projectId: 'LUBPY-REPO-05',
    projectTitle: 'Hệ Sinh Thái Nông Nghiệp Thông Minh IoT Giám Sát Thời Gian Thực & Điều Khiển',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '110 Trang',
    size: '24.0 MB',
    defenseScore: '10.0 / 10',
    academicStandard: 'Chuẩn Kỹ Thuật Máy Tính & Mạng Cảm Biến IoT (Bao gồm sơ đồ mạch Fritzing, mã lệnh vi điều khiển)',
    techLeadAuthor: 'Đinh Tuấn Kiệt (IoT & Embedded Systems Engineer)',
    targetMajor: 'Kỹ Thuật Máy Tính & Hệ Thống Nhúng',
    priceVnd: 590000,
    summary: 'Nghiên cứu thiết kế trạm cảm biến môi trường dùng vi điều khiển ESP32 và hệ điều hành FreeRTOS, truyền tin qua giao thức MQTT đến broker đám mây, tích hợp thuật toán điều khiển mờ (Fuzzy Logic) tưới tiêu.',
    chapters: [
      'Chương 1: Đặt vấn đề chuyển đổi số nông nghiệp công nghệ cao và tự động hóa nhà màng',
      'Chương 2: Kiến trúc mạng cảm biến không dây WSN, vi điều khiển ESP32, giao thức MQTT và FreeRTOS',
      'Chương 3: Thiết kế phần cứng (Schematic, PCB, nguồn pin năng lượng mặt trời) và kiến trúc máy chủ Web',
      'Chương 4: Lập trình firmware ESP32 đa nhiệm và xây dựng Dashboard theo dõi chỉ số thời gian thực',
      'Chương 5: Kết quả thử nghiệm tại trang trại thực tế, tính ổn định kết nối và kết luận'
    ]
  },
  {
    id: 'BC-06',
    title: 'Báo Cáo Luận Văn: Sàn Giao Dịch NFT & Đấu Giá Bản Quyền Số Web3 Smart Contract',
    fileName: 'BaoCao_LuanVan_Blockchain_NFT_SmartContract_120Trang.docx',
    projectId: 'LUBPY-REPO-06',
    projectTitle: 'Sàn Giao Dịch NFT & Đấu Giá Trực Tuyến Web3 Smart Contract (Solidity)',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '120 Trang',
    size: '20.5 MB',
    defenseScore: '9.9 / 10',
    academicStandard: 'Chuẩn An Toàn Thông Tin & Mạng Máy Tính (Audit bảo mật Reentrancy, Gas Optimization)',
    techLeadAuthor: 'Phan Quốc Bảo (Tech Lead Engineering)',
    targetMajor: 'An Toàn Thông Tin & Công Nghệ Chuỗi Khối (Blockchain)',
    priceVnd: 650000,
    summary: 'Nghiên cứu chuẩn token ERC-721 và cơ chế đấu giá kiểu Anh/Hà Lan trên hợp đồng thông minh Solidity, lưu trữ phi tập trung IPFS, tối ưu chi phí Gas và kiểm tra an toàn lỗ hổng bằng Slither.',
    chapters: [
      'Chương 1: Sự phát triển của kinh tế số Web3 và bài toán sở hữu trí tuệ kỹ thuật số',
      'Chương 2: Công nghệ chuỗi khối Ethereum, cơ chế đồng thuận PoS, máy ảo EVM và chuẩn ERC-721',
      'Chương 3: Thiết kế hợp đồng thông minh đấu giá (Auction Contract) và lưu trữ metadata trên IPFS',
      'Chương 4: Hiện thực hóa DApp với Next.js, Ethers.js, ví MetaMask và kiểm thử mã nguồn với Hardhat',
      'Chương 5: Phân tích kết quả kiểm toán bảo mật (Security Audit), tối ưu Gas và kết luận'
    ]
  },
  {
    id: 'BC-07',
    title: 'Báo Cáo Luận Văn: Hệ Thống Quản Lý Kho Vận & Tối Ưu Lộ Trình Giao Hàng Logistics Fleet',
    fileName: 'BaoCao_LuanVan_QuanLy_KhoVan_Logistics_Fleet_118Trang.docx',
    projectId: 'LUBPY-REPO-07',
    projectTitle: 'Hệ Thống Quản Lý Kho Vận & Tối Ưu Lộ Trình Giao Hàng Logistics Fleet',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '118 Trang',
    size: '21.0 MB',
    defenseScore: '9.8 / 10',
    academicStandard: 'Chuẩn Quản Lý Chuỗi Cung Ứng & Hệ Thống Thông Tin Doanh Nghiệp',
    techLeadAuthor: 'Lê Hoàng Long (Fullstack Lead Architect)',
    targetMajor: 'Hệ Thống Thông Tin & Logistics',
    priceVnd: 580000,
    summary: 'Nghiên cứu giải thuật giải bài toán Vehicle Routing Problem (VRP) kết hợp OpenStreetMap OSRM, quản lý vòng đời đơn hàng đa kho bãi và bảng điều khiển giám sát hành trình xe tải.',
    chapters: [
      'Chương 1: Khái quát ngành Logistics chặng cuối (Last-mile Delivery) và bài toán chi phí nhiên liệu',
      'Chương 2: Thuật toán tối ưu đường đi VRP, thuật toán di truyền Genetic Algorithm và bản đồ số GIS',
      'Chương 3: Thiết kế hệ thống quản lý kho WMS và module lập kế hoạch lộ trình thông minh',
      'Chương 4: Cài đặt hệ thống Spring Boot, React Leaflet và kiểm thử điều phối thực tế 50 xe',
      'Chương 5: Đánh giá chỉ số giảm thiểu quãng đường (18.5%) và kết luận đề tài'
    ]
  },
  {
    id: 'BC-08',
    title: 'Báo Cáo Luận Văn: Trợ Lý Pháp Luật AI RAG Tra Cứu Văn Bản Luật Việt Nam (LangChain + ChromaDB)',
    fileName: 'BaoCao_LuanVan_TroLy_PhapLuat_RAG_ChromaDB_125Trang.docx',
    projectId: 'LUBPY-REPO-08',
    projectTitle: 'Trợ Lý Pháp Luật Ảo RAG AI Tra Cứu Văn Bản Luật Việt Nam',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '125 Trang',
    size: '23.0 MB',
    defenseScore: '9.9 / 10',
    academicStandard: 'Chuẩn Xử Lý Ngôn Ngữ Tự Nhiên (NLP) & Trí Tuệ Nhân Tạo Sinh (Generative AI)',
    techLeadAuthor: 'Trần Hoàng Nam (Senior AI/CV Specialist)',
    targetMajor: 'Khoa Học Dữ Liệu & Trí Tuệ Nhân Tạo',
    priceVnd: 640000,
    summary: 'Nghiên cứu kiến trúc Retrieval-Augmented Generation (RAG) loại bỏ ảo giác (hallucination) của LLM, phân đoạn và tạo vector nhúng 20,000 điều luật Việt Nam vào ChromaDB, trích dẫn chính xác nguồn văn bản.',
    chapters: [
      'Chương 1: Thực trạng tiếp cận văn bản quy phạm pháp luật và bài toán tư vấn pháp lý tự động',
      'Chương 2: Mô hình ngôn ngữ lớn (LLM), kỹ thuật RAG, Vector Database ChromaDB và Semantic Search',
      'Chương 3: Thu thập, tiền xử lý và xây dựng đồ thị tri thức pháp lý từ nguồn Cơ sở Dữ liệu Quốc gia',
      'Chương 4: Xây dựng pipeline LangChain kết hợp Gemini AI và giao diện đàm thoại thân thiện',
      'Chương 5: Đánh giá độ tin cậy câu trả lời bằng khung RAGAS (Faithfulness, Answer Relevance)'
    ]
  },
  {
    id: 'BC-09',
    title: 'Báo Cáo Luận Văn: Mạng Xã Hội Giới Trẻ Tích Hợp Chat Realtime & Bản Tin Story 24h',
    fileName: 'BaoCao_LuanVan_MangXaHoi_Realtime_Chat_WebRTC_112Trang.docx',
    projectId: 'LUBPY-REPO-09',
    projectTitle: 'Mạng Xã Hội Giới Trẻ Tích Hợp Chat Realtime & Story 24h (MERN Stack)',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '112 Trang',
    size: '19.5 MB',
    defenseScore: '9.8 / 10',
    academicStandard: 'Chuẩn Kỹ Thuật Phần Mềm Ứng Dụng Web Tương Tác Cao',
    techLeadAuthor: 'Lê Hoàng Long (Fullstack Lead Architect)',
    targetMajor: 'Kỹ Thuật Phần Mềm (Software Engineering)',
    priceVnd: 540000,
    summary: 'Thiết kế hệ thống mạng xã hội tương tác cao: Bản tin Story tự hủy sau 24h với Redis TTL, phòng chat nhóm Socket.IO mã hóa đầu cuối và cơ chế gợi ý bạn bè theo sở thích chung.',
    chapters: [
      'Chương 1: Phân tích hành vi tương tác của thế hệ Gen Z trên các nền tảng mạng xã hội hiện đại',
      'Chương 2: Ngăn xếp công nghệ MERN (MongoDB, Express, React, Node.js) và truyền thông WebSocket',
      'Chương 3: Thiết kế mô hình cơ sở dữ liệu phi quan hệ MongoDB, phân quyền JWT và thiết kế API REST',
      'Chương 4: Hiện thực hóa tính năng chia sẻ bài viết, tương tác cảm xúc, Chat âm thanh & Story 24h',
      'Chương 5: Đánh giá trải nghiệm người dùng và giải pháp phòng chống spam bài viết độc hại'
    ]
  },
  {
    id: 'BC-10',
    title: 'Báo Cáo Luận Văn: Hệ Thống Chẩn Đoán Bệnh Phổi X-Ray Bằng Mạng Nơ-ron DenseNet121',
    fileName: 'BaoCao_LuanVan_DeepLearning_ChanDoan_Phoi_XRay_130Trang.docx',
    projectId: 'LUBPY-REPO-10',
    projectTitle: 'Hệ Thống Chẩn Đoán Bệnh Phổi Tự Động X-Ray Bằng Deep Learning DenseNet121',
    type: 'THESIS_DOC',
    format: 'Word (.docx)',
    pagesOrSlides: '130 Trang',
    size: '25.0 MB',
    defenseScore: '10.0 / 10',
    academicStandard: 'Chuẩn Khoa Học Dữ Liệu Y Sinh & Trí Tuệ Nhân Tạo Y Khoa (Đạt AUC 0.94)',
    techLeadAuthor: 'Trần Hoàng Nam (Senior AI/CV Specialist)',
    targetMajor: 'Khoa Học Máy Tính & Tin Học Y Sinh',
    priceVnd: 690000,
    summary: 'Huấn luyện mạng nơ-ron sâu DenseNet121 trên 112,000 ảnh chụp lồng ngực ChestX-ray14, ứng dụng kỹ thuật Grad-CAM tạo bản đồ nhiệt (Heatmap) trực quan hóa vùng tổn thương phổi giúp bác sĩ thẩm định.',
    chapters: [
      'Chương 1: Vai trò của ảnh chụp X-quang trong chẩn đoán sớm bệnh lý phổi và áp lực của bác sĩ lâm sàng',
      'Chương 2: Cơ sở lý thuyết Học sâu (Deep Learning), Transfer Learning và mạng DenseNet121',
      'Chương 3: Tiền xử lý dữ liệu ảnh DICOM, cân bằng lớp dữ liệu và kỹ thuật giải thích mô hình Grad-CAM',
      'Chương 4: Triển khai mô hình chẩn đoán 14 bệnh lý phổi và xây dựng Web Dashboard y tế hỗ trợ bác sĩ',
      'Chương 5: Đánh giá chỉ số AUC-ROC, độ nhạy (Sensitivity), độ đặc hiệu (Specificity) và kết luận'
    ]
  },
  // SLIDES DEFENSE PRESENTATIONS
  {
    id: 'SL-01',
    title: 'Slide Thuyết Trình Bảo Vệ: Đề Tài Sàn TMĐT Microservices & Kafka (Đạt Điểm 10)',
    fileName: 'Slide_ThuyetTrinh_BaoVe_DoAn_DatDiem10_Mau1.pptx',
    projectId: 'LUBPY-REPO-01',
    projectTitle: 'Hệ Thống Sàn Thương Mại Điện Tử Microservices & Cổng Thanh Toán MoMo/VNPAY',
    type: 'SLIDE',
    format: 'PowerPoint (.pptx)',
    pagesOrSlides: '32 Slides',
    size: '28.6 MB',
    defenseScore: '10.0 / 10',
    academicStandard: 'Chuẩn Trình Chiếu Hội Đồng Bảo Vệ (Bố cục 16:9, Animation chuyên nghiệp, Sơ đồ trực quan)',
    techLeadAuthor: 'Phan Quốc Bảo (Tech Lead Engineering)',
    targetMajor: 'Kỹ Thuật Phần Mềm',
    priceVnd: 350000,
    summary: 'Bộ slide PowerPoint thiết kế hiện đại, đầy đủ các phần: Lý do chọn đề tài, Kiến trúc Microservices, Demo các kịch bản mua hàng và thanh toán QR, Thống kê chịu tải.',
    chapters: [
      'Slide 1-5: Giới thiệu đề tài, mục tiêu nghiên cứu và phạm vi dự án',
      'Slide 6-14: Kiến trúc hệ thống, sơ đồ luồng dữ liệu Apache Kafka và cơ chế phân tán',
      'Slide 15-24: Các chức năng đã hiện thực, video/ảnh chụp giao diện thanh toán Sandbox',
      'Slide 25-29: Kết quả đo kiểm hiệu năng Apache JMeter và tính sẵn sàng cao',
      'Slide 30-32: Kết luận, bài học kinh nghiệm và phần hỏi đáp với Hội đồng (Q&A)'
    ]
  },
  {
    id: 'SL-02',
    title: 'Slide Thuyết Trình Bảo Vệ: Chuyên Ngành AI & Thị Giác Máy Tính (Dark UI Cao Cấp)',
    fileName: 'Slide_BaoVe_ChuyenNganh_AI_MachineLearning_DarkUI.pptx',
    projectId: 'LUBPY-REPO-02',
    projectTitle: 'Hệ Thống AI Nhận Diện Khuôn Mặt Điểm Danh & Phát Hiện Vi Phạm Lớp Học',
    type: 'SLIDE',
    format: 'PowerPoint (.pptx)',
    pagesOrSlides: '36 Slides',
    size: '31.0 MB',
    defenseScore: '9.9 / 10',
    academicStandard: 'Chuẩn Hội Đồng AI (Tông màu Dark Neon hiện đại, biểu đồ Loss & Accuracy sinh động)',
    techLeadAuthor: 'Trần Hoàng Nam (Senior AI/CV Specialist)',
    targetMajor: 'Khoa Học Máy Tính & AI',
    priceVnd: 380000,
    summary: 'Slide chuyên dụng cho đề tài Trí tuệ nhân tạo, trực quan hóa mạng nơ-ron tích chập, công thức toán ArcFace và so sánh chỉ số F1-Score trước và sau tinh chỉnh.',
    chapters: [
      'Slide 1-6: Bài toán nhận diện khuôn mặt và gian lận liveness',
      'Slide 7-18: Cấu trúc mô hình YOLOv8 kết hợp InsightFace, trích xuất vector 512D',
      'Slide 19-28: Thực nghiệm chống gian lận ảnh in, ảnh điện thoại và video giả mạo',
      'Slide 29-33: Kết quả tích hợp phần mềm điểm danh thời gian thực',
      'Slide 34-36: Lời cảm ơn và chuẩn bị câu hỏi phản biện'
    ]
  },
  {
    id: 'SL-03',
    title: 'Slide Thuyết Trình Bảo Vệ: Ứng Dụng Mobile Flutter & Clean Architecture',
    fileName: 'Slide_ThuyetTrinh_MobileApp_Finance_ChuyenNghiep.pptx',
    projectId: 'LUBPY-REPO-04',
    projectTitle: 'App Quản Lý Chi Tiêu Cá Nhân & AI Quét Hóa Đơn OCR Thông Minh (Flutter)',
    type: 'SLIDE',
    format: 'PowerPoint (.pptx)',
    pagesOrSlides: '30 Slides',
    size: '22.0 MB',
    defenseScore: '9.9 / 10',
    academicStandard: 'Chuẩn Thiết Kế Ứng Dụng Mobile (Có khung mockup iPhone/Android minh họa từng bước)',
    techLeadAuthor: 'Vũ Đức Thắng (Senior Flutter Mobile Specialist)',
    targetMajor: 'Lập Trình Di Động & CNTT',
    priceVnd: 320000,
    summary: 'Slide trình bày sinh động toàn bộ luồng hoạt động ứng dụng: Chụp ảnh hóa đơn, OCR xử lý bóc tách, vẽ biểu đồ chi tiêu và kiến trúc BLoC phân tách rõ ràng.',
    chapters: [
      'Slide 1-5: Nhu cầu quản lý chi tiêu và giải pháp thông minh',
      'Slide 6-12: Kiến trúc Clean Architecture và BLoC Pattern trên Flutter',
      'Slide 13-22: Trực quan hóa luồng quét OCR hóa đơn và bóc tách dữ liệu',
      'Slide 23-27: Các biểu đồ phân tích ngân sách và tính năng sao lưu đám mây',
      'Slide 28-30: Kết luận và giải đáp thắc mắc'
    ]
  },
  {
    id: 'SL-04',
    title: 'Slide Thuyết Trình Bảo Vệ: Đề Tài IoT Smart Farm & Vi Điều Khiển ESP32',
    fileName: 'Slide_ThuyetTrinh_BaoVe_DoAn_IoT_Hardware.pptx',
    projectId: 'LUBPY-REPO-05',
    projectTitle: 'Hệ Sinh Thái Nông Nghiệp Thông Minh IoT Giám Sát Thời Gian Thực & Điều Khiển',
    type: 'SLIDE',
    format: 'PowerPoint (.pptx)',
    pagesOrSlides: '34 Slides',
    size: '30.0 MB',
    defenseScore: '10.0 / 10',
    academicStandard: 'Chuẩn Kỹ Thuật Điện Tử Nhúng & IoT (Ảnh chụp mô hình thực tế, sơ đồ kết nối chân vi điều khiển)',
    techLeadAuthor: 'Đinh Tuấn Kiệt (IoT & Embedded Systems Engineer)',
    targetMajor: 'Kỹ Thuật Máy Tính & Điện Tử',
    priceVnd: 350000,
    summary: 'Slide chứa đầy đủ sơ đồ khối hệ thống phần cứng, giao thức MQTT Broker, ảnh chụp mô hình nhà kính mini thực nghiệm và video nhúng bật tắt thiết bị từ xa.',
    chapters: [
      'Slide 1-6: Tổng quan nông nghiệp thông minh và các bài toán môi trường',
      'Slide 7-16: Sơ đồ khối phần cứng, vi điều khiển ESP32, các cảm biến độ ẩm, nhiệt độ, pH',
      'Slide 17-25: Kiến trúc FreeRTOS đa nhiệm và kết nối MQTT thời gian thực',
      'Slide 26-31: Dashboard giám sát trên Web và cơ chế tự động bật bơm nước',
      'Slide 32-34: Kết luận đề tài và hướng thương mại hóa sản phẩm'
    ]
  },
  // TECHNICAL SPECIFICATIONS & DIAGRAMS
  {
    id: 'SRS-01',
    title: 'Mẫu Tài Liệu Đặc Tả Yêu Cầu Phần Mềm (SRS) Chuẩn Quốc Tế IEEE 830',
    fileName: 'Mau_SRS_DacTa_YeuCau_PhanMem_Chuan_IEEE830.pdf',
    projectId: 'GENERAL-SPEC',
    projectTitle: 'Tài Liệu Kỹ Thuật Mẫu LUBPY STUDIO',
    type: 'SRS_SPEC',
    format: 'PDF (.pdf)',
    pagesOrSlides: '48 Trang',
    size: '6.8 MB',
    defenseScore: 'Chuẩn Quốc Tế',
    academicStandard: 'IEEE Std 830-1998 Recommended Practice for Software Requirements Specifications',
    techLeadAuthor: 'Đội Ngũ Kỹ Thuật LUBPY (Khối R&D)',
    targetMajor: 'Tất cả các ngành Kỹ thuật Phần mềm & CNTT',
    priceVnd: 290000,
    summary: 'Mẫu đặc tả yêu cầu phần mềm hoàn chỉnh theo cấu trúc IEEE: Đặc tả người dùng (User Stories), 45 yêu cầu chức năng (Functional Requirements), yêu cầu phi chức năng (Non-Functional) về bảo mật, hiệu năng và ma trận truy vết yêu cầu (Traceability Matrix).',
    chapters: [
      'Phần 1: Giới thiệu, mục đích, phạm vi và các định nghĩa thuật ngữ',
      'Phần 2: Mô tả tổng quan về sản phẩm, các lớp người dùng và môi trường hoạt động',
      'Phần 3: Các yêu cầu giao diện bên ngoài (Giao diện người dùng, phần cứng, phần mềm, truyền thông)',
      'Phần 4: Các tính năng và yêu cầu chức năng chi tiết của hệ thống',
      'Phần 5: Các yêu cầu phi chức năng (Hiệu năng, an toàn, bảo mật, độ tin cậy) và phụ lục'
    ]
  },
  {
    id: 'SRS-02',
    title: 'Sơ Đồ Kiến Trúc Hệ Thống Microservices & Event-Driven Architecture (.drawio)',
    fileName: 'KienTruc_Microservices_EventDriven_Architecture_Diagram.drawio',
    projectId: 'LUBPY-REPO-01',
    projectTitle: 'Sàn Thương Mại Điện Tử Microservices & Cổng Thanh Toán',
    type: 'SRS_SPEC',
    format: 'Diagram (.drawio)',
    pagesOrSlides: '8 Trang Diagram',
    size: '4.2 MB',
    defenseScore: '10.0 / 10',
    academicStandard: 'Mô hình kiến trúc C4 Model & UML 2.5 (Phù hợp nộp cùng đồ án hoặc in khổ A3)',
    techLeadAuthor: 'Phan Quốc Bảo (Tech Lead Engineering)',
    targetMajor: 'Kỹ Thuật Phần Mềm & Cloud Computing',
    priceVnd: 250000,
    summary: 'File thiết kế Draw.io chỉnh sửa được 100%: Bao gồm System Context Diagram, Container Diagram, Component Diagram, sơ đồ luồng Kafka Topics và cấu trúc Docker Swarm/Kubernetes.',
    chapters: [
      'Layer 1: System Context Diagram (Người dùng, Cổng thanh toán, Email Server)',
      'Layer 2: Container Diagram (API Gateway, Microservices, Redis Cache, Database per Service)',
      'Layer 3: Component Diagram nội bộ của Payment & Order Services',
      'Layer 4: Sơ đồ chuỗi Sequence Diagram quy trình thanh toán MoMo/VNPAY 2 chiều'
    ]
  },
  // DEFENSE QA & TEST PLAN
  {
    id: 'QA-01',
    title: 'Sổ Tay 50 Câu Hỏi Phản Biện Của Hội Đồng Chấm Thi & Gợi Ý Trả Lời Đạt Điểm Cao',
    fileName: 'Mau_So_Tay_CauHoi_PhanBien_HoiDong_DiemCao.pdf',
    projectId: 'GENERAL-QA',
    projectTitle: 'Cẩm Nang Bảo Vệ Đồ Án LUBPY STUDIO',
    type: 'DEFENSE_QA',
    format: 'PDF (.pdf)',
    pagesOrSlides: '54 Trang',
    size: '9.1 MB',
    defenseScore: 'Cẩm Nang Thủ Khoa',
    academicStandard: 'Tổng hợp từ hơn 200 buổi bảo vệ đồ án tại ĐH Bách Khoa, KHTN, FPT, Bưu Chính Viễn Thông',
    techLeadAuthor: 'Đội Ngũ Cố Vấn Chuyên Môn LUBPY',
    targetMajor: 'Tất cả sinh viên bảo vệ đồ án tốt nghiệp',
    priceVnd: 320000,
    summary: 'Sổ tay tổng hợp 50 câu hỏi "bẫy" thường gặp nhất của các thầy cô Hội đồng (về kiến trúc, tại sao chọn công nghệ này mà không chọn công nghệ kia, cách tối ưu database, xử lý concurrency, bảo mật injection, tính mới của đề tài) và hướng dẫn trả lời tự tin, đúng trọng tâm để đạt điểm 9-10.',
    chapters: [
      'Phần 1: Nhóm câu hỏi về Lý do chọn đề tài và Tính mới/Đóng góp thực tiễn của sinh viên',
      'Phần 2: Nhóm câu hỏi về Kiến trúc hệ thống, Thiết kế CSDL và Tối ưu hiệu năng',
      'Phần 3: Nhóm câu hỏi về An toàn thông tin, Bảo mật và Xử lý ngoại lệ lỗi hệ thống',
      'Phần 4: Nhóm câu hỏi về Kiểm thử, Đo lường tải và Độ tin cậy mô hình',
      'Phần 5: Kỹ năng xử lý tình huống khi Demo bị lỗi hoặc Hội đồng hỏi câu chưa chuẩn bị'
    ]
  },
  {
    id: 'QA-02',
    title: 'Kế Hoạch & Kịch Bản Kiểm Thử Test Plan Mẫu Chuẩn Quốc Tế (Jest / Cypress / Postman)',
    fileName: 'QuyTrinh_KiemThu_TestPlan_UnitTest_Jest_Cypress.xlsx',
    projectId: 'GENERAL-TEST',
    projectTitle: 'Quy Trình QA & Kiểm Thử Phần Mềm',
    type: 'TEST_PLAN',
    format: 'Excel (.xlsx)',
    pagesOrSlides: '12 Sheets',
    size: '5.5 MB',
    defenseScore: 'Chuẩn QA Quốc Tế',
    academicStandard: 'Tiêu chuẩn kiểm thử phần mềm ISTQB (Bao gồm ma trận Traceability & Test Case Report)',
    techLeadAuthor: 'Đội Ngũ Kỹ Thuật LUBPY (Khối QA/QC)',
    targetMajor: 'Kiểm Thử Phần Mềm & Kỹ Thuật Phần Mềm',
    priceVnd: 280000,
    summary: 'File Excel đầy đủ 120 Test Case mẫu cho các chức năng: Đăng nhập phân quyền, Validate form, Giỏ hàng, Thanh toán, API Endpoint, kiểm tra bảo mật SQL Injection & XSS, sẵn sàng nộp cùng phụ lục đồ án.',
    chapters: [
      'Sheet 1: Tổng quan Test Strategy & Môi trường kiểm thử',
      'Sheet 2: Ma trận Test Matrix phân loại độ ưu tiên High/Medium/Low',
      'Sheet 3: 45 Test Cases chức năng người dùng (Front-end UI/UX)',
      'Sheet 4: 35 Test Cases kiểm thử API Backend (Status code, Schema validation)',
      'Sheet 5: 20 Test Cases kiểm thử bảo mật & tải cao (Security & Stress testing)'
    ]
  }
];

