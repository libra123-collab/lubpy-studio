import React, { useState, useEffect } from 'react';
import { User, UserRole, ProjectRequest, PROJECT_STATUS_LABELS } from '../types';
import { getStoredOrganization, saveOrganization, clearAllOrganizationStaff } from '../utils/organizationStore';
import { saveAccountToStorage, removeSavedAccountFromStorage } from '../utils/savedAccounts';
import { syncHeadAccountToAllStores, dobTo8Digits, nameToLubpyEmail, normalizeNameToEmail, normalizeEmailPrefix } from '../utils/authSyncHelper';
import { saveUserSession } from '../utils/session';
import { getVisibleNotificationsForUser } from '../utils/notificationStore';
import NotificationMailboxModal from './NotificationMailboxModal';
import WorkspaceNotificationBell from './WorkspaceNotificationBell';
import CameraAvatarModal from './CameraAvatarModal';
import { formatVND, calcProjectFinancials, calcTotalFinancials } from '../utils/currency';
import { exportProjectsToCSV } from '../utils/exportCsv';
import { compressImageFile } from '../utils/imageCompressor';
import { validateEmail, validatePhoneVN, validateFutureDate, validateRequired, validateNumberPositive } from '../utils/validation';
import { fetchProjectsFromDb, createProjectInDb, updateProjectInDb, createTransactionInDb, api } from '../utils/apiClient';

import { 
  Search as SearchIcon, ShieldCheck as ShieldCheckIcon, Plus as PlusIcon, 
  RefreshCw as RefreshCwIcon, HelpCircle as HelpCircleIcon, Mail as MailIcon, 
  Share2 as Share2Icon, BarChart3 as BarChart3Icon, TrendingUp as TrendingUpIcon, 
  MoreHorizontal as MoreHorizontalIcon, Settings as SettingsIcon, Filter as FilterIcon, 
  ChevronRight as ChevronRightIcon, X as XIcon, Crown as CrownIcon, Users as UsersIcon, 
  UserPlus as UserPlusIcon, Laptop as LaptopIcon, HeartHandshake as HeartHandshakeIcon, 
  Briefcase as BriefcaseIcon, Calculator as CalculatorIcon, FolderKanban as FolderKanbanIcon, 
  MessageSquare as MessageSquareIcon, Code2 as Code2Icon, UploadCloud as UploadCloudIcon, 
  Download as DownloadIcon, AlertCircle as AlertCircleIcon, Trash2 as Trash2Icon, 
  BookOpen as BookOpenIcon, Phone as PhoneIcon, User as UserIconComp, CheckCircle as CheckCircleIcon,
  DollarSign as DollarSignIcon, Clock as ClockIcon, Sparkles as SparklesIcon, Lock as LockIcon,
  Key as KeyIcon, Smartphone as SmartphoneIcon, Check as CheckIcon, Star as StarIcon,
  Target as TargetIcon, Zap as ZapIcon, Award as AwardIcon, CheckSquare as CheckSquareIcon,
  Activity as ActivityIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, Image as ImageIcon, Wand2 as Wand2Icon
} from 'lucide-react';
import AdminCustomerReviewsTab from './admin/AdminCustomerReviewsTab';
import AdminSubStaffMatrix from './admin/AdminSubStaffMatrix';
import AdminRepoProjectsCatalog from './admin/AdminRepoProjectsCatalog';
import { getStoredCustomerReviews } from '../utils/reviewStore';
import {
  canAppointHeadToSpecialty,
  getHeadsForSpecialty,
  getDepartmentQuotaStats
} from '../utils/departmentSpecialtiesConfig';
import ProjectContractModal from './ProjectContractModal';
import { getWorkflowProjects, WorkflowProject } from '../utils/projectWorkflowStore';

interface AdminFintrixityDashboardProps {
  user: User;
  onLogout: () => void;
  language: 'en' | 'vi';
  onSwitchToSystemManager: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export interface LubpyProjectItem {
  id: string; // Mã đồ án (DA-2026-01)
  title: string; // Tên đề tài
  clientName: string; // Khách hàng
  school: string; // Trường / Đơn vị
  techStack: string; // Công nghệ
  defenseDate: string; // Hạn bảo vệ
  status: 'Pending' | 'In Progress' | 'Completed' | 'Coaching' | 'Mới tiếp nhận' | 'Đã phân công Dev' | 'Đang triển khai' | 'Đã cọc (50%)' | 'Đã Demo/Review' | 'Thanh toán đủ (100%)' | 'Hoàn tất & Bàn giao';
  assignedDev: string;
  priceVnd: number;
  devCommissionRate?: number; // 40% - 80%, default 65%
  progress: number;
  thumbnailUrl?: string;
}

export function getCuratedThumbnail(title: string = '', tech: string = ''): string {
  const text = `${title} ${tech}`.toLowerCase();
  if (text.includes('ai') || text.includes('trí tuệ') || text.includes('machine learning') || text.includes('yolo') || text.includes('rag') || text.includes('recommender') || text.includes('deep learning')) {
    return '/src/assets/images/thumbnail_ai_ml_1789866580065.jpg';
  }
  if (text.includes('e-commerce') || text.includes('thương mại') || text.includes('bán hàng') || text.includes('fintech') || text.includes('thanh toán') || text.includes('chứng khoán') || text.includes('core banking') || text.includes('trading')) {
    return '/src/assets/images/thumbnail_ecommerce_1789866594605.jpg';
  }
  if (text.includes('mobile') || text.includes('flutter') || text.includes('app') || text.includes('android') || text.includes('ios') || text.includes('bệnh án') || text.includes('khám')) {
    return '/src/assets/images/thumbnail_mobile_app_1789866606466.jpg';
  }
  if (text.includes('blockchain') || text.includes('cloud') || text.includes('an toàn') || text.includes('bảo mật') || text.includes('security') || text.includes('devops')) {
    return '/src/assets/images/thumbnail_cloud_security_1789866645653.jpg';
  }
  if (text.includes('lms') || text.includes('quản lý') || text.includes('trường') || text.includes('doanh nghiệp') || text.includes('erp') || text.includes('iot')) {
    return '/src/assets/images/thumbnail_enterprise_erp_1789866658670.jpg';
  }
  return '/src/assets/images/project_thumbnail_default_1789866567242.jpg';
}

export interface LubpyLeadItem {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  school: string;
  topic: string;
  budgetVnd: number;
  status: 'Mới tiếp nhận' | 'Đang tư vấn' | 'Đã báo giá' | 'Đã chốt hợp đồng' | 'Hủy/Không phù hợp';
  source: 'Landing Page' | 'Zalo' | 'Facebook Fanpage' | 'Học viên giới thiệu';
  createdAt: string;
}

export interface LubpyDevItem {
  id: string;
  name: string;
  email: string;
  specialty: string;
  skillTags: string[];
  activeCount: number;
  status: 'Sẵn sàng' | 'Đang bận' | 'Nghỉ phép';
  rating: number;
}

export interface LubpyClientItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  school: string;
  workplace?: string;
  position?: string;
  tier: 'Mới' | 'Thân thiết' | 'Giới thiệu người khác';
  createdAt: string;
  notes?: string;
}

// Initial baseline mock data for LUBPY STUDIO Admin Workspace (10 Projects, 7 Leads, 0 Devs, 10 Clients, 16 Repo Docs)
export const INITIAL_ADMIN_PROJECTS: LubpyProjectItem[] = [
  {
    id: 'DA-2026-01',
    title: 'Hệ Thống E-Commerce AI Recommender & Microservices',
    clientName: 'Nguyễn Văn An',
    school: 'Đại Học Bách Khoa TP.HCM',
    techStack: 'Next.js 14, Node.js, Kafka, Redis, PostgreSQL',
    defenseDate: '30/10/2026',
    status: 'In Progress',
    assignedDev: 'Chưa phân công',
    priceVnd: 22000000,
    devCommissionRate: 65,
    progress: 65
  },
  {
    id: 'DA-2026-02',
    title: 'Nông Nghiệp Thông Minh IoT & Dự Báo Thời Tiết AI',
    clientName: 'Trần Thị Mai',
    school: 'Đại Học Quốc Gia',
    techStack: 'Flutter, Python FastAPI, ESP32, MQTT, PyTorch',
    defenseDate: '15/09/2026',
    status: 'Coaching',
    assignedDev: 'Chưa phân công',
    priceVnd: 18500000,
    devCommissionRate: 65,
    progress: 85
  },
  {
    id: 'DA-2026-03',
    title: 'Sàn Giao Dịch Chứng Khoán Ảo Real-time Trading Engine',
    clientName: 'Lê Hoàng Nam',
    school: 'Đại Học Kinh Tế Quốc Dân',
    techStack: 'React, Spring Boot, WebSocket, PostgreSQL, Docker',
    defenseDate: '28/07/2026',
    status: 'Coaching',
    assignedDev: 'Chưa phân công',
    priceVnd: 25000000,
    devCommissionRate: 65,
    progress: 90
  },
  {
    id: 'DA-2026-04',
    title: 'Hệ Thống Nhận Diện Khuôn Mặt & Điểm Danh AI Camera',
    clientName: 'Phạm Quốc Bảo',
    school: 'ĐH Công Nghệ - ĐHQGHN',
    techStack: 'Python, OpenCV, PyTorch, FastAPI, React',
    defenseDate: '12/08/2026',
    status: 'In Progress',
    assignedDev: 'Chưa phân công',
    priceVnd: 19000000,
    devCommissionRate: 65,
    progress: 60
  },
  {
    id: 'DA-2026-05',
    title: 'Ứng Dụng Đặt Lịch Khám & Hồ Sơ Bệnh Án Điện Tử',
    clientName: 'Vũ Thị Lan',
    school: 'ĐH Y Dược / ĐH CNTT',
    techStack: 'Flutter, NestJS, PostgreSQL, AWS S3, Redis',
    defenseDate: '05/11/2026',
    status: 'In Progress',
    assignedDev: 'Chưa phân công',
    priceVnd: 21000000,
    devCommissionRate: 65,
    progress: 45
  },
  {
    id: 'DA-2026-06',
    title: 'Hệ Thống Quản Lý Chuỗi Cung Ứng & Truy Xuất Nguồn Gốc Blockchain',
    clientName: 'Đỗ Minh Khang',
    school: 'Đại Học FPT',
    techStack: 'Solidity, Ethereum, React, Node.js, IPFS, Hardhat',
    defenseDate: '20/07/2026',
    status: 'Completed',
    assignedDev: 'Chưa phân công',
    priceVnd: 28000000,
    devCommissionRate: 65,
    progress: 100
  },
  {
    id: 'DA-2026-07',
    title: 'Chatbot AI Tư Vấn Pháp Luật Doanh Nghiệp RAG LangChain',
    clientName: 'Bùi Thùy Dung',
    school: 'ĐH Luật / ĐH CNTT',
    techStack: 'LangChain, OpenAI/Gemini, FastAPI, ChromaDB, Next.js',
    defenseDate: '18/11/2026',
    status: 'In Progress',
    assignedDev: 'Chưa phân công',
    priceVnd: 24000000,
    devCommissionRate: 65,
    progress: 55
  },
  {
    id: 'DA-2026-08',
    title: 'Nền Tảng Học Trực Tuyến LMS & Thi Trắc Nghiệm Chống Gian Lận',
    clientName: 'Ngô Gia Huy',
    school: 'ĐH Sư Phạm Kỹ Thuật TP.HCM',
    techStack: 'Next.js, Go Golang, WebRTC, Redis, PostgreSQL',
    defenseDate: '25/08/2026',
    status: 'In Progress',
    assignedDev: 'Chưa phân công',
    priceVnd: 20500000,
    devCommissionRate: 65,
    progress: 70
  },
  {
    id: 'DA-2026-09',
    title: 'Hệ Thống Giám Sát An Toàn Giao Thông & YOLOv8 Detection',
    clientName: 'Lý Thái Phong',
    school: 'Học Viện Công Nghệ Bưu Chính Viễn Thông',
    techStack: 'YOLOv8, DeepSORT, FastAPI, Vue.js 3, Docker',
    defenseDate: '15/07/2026',
    status: 'Completed',
    assignedDev: 'Chưa phân công',
    priceVnd: 26000000,
    devCommissionRate: 65,
    progress: 100
  },
  {
    id: 'DA-2026-10',
    title: 'Cổng Thanh Toán & Ví Điện Tử Fintech Mini Core Banking',
    clientName: 'Trịnh Thu Hà',
    school: 'Đại Học Ngân Hàng',
    techStack: 'Node.js, Express, Docker, RabbitMQ, PostgreSQL, React',
    defenseDate: '01/12/2026',
    status: 'Pending',
    assignedDev: 'Chưa phân công',
    priceVnd: 23000000,
    devCommissionRate: 65,
    progress: 10
  }
];

export const INITIAL_LEADS: LubpyLeadItem[] = [
  {
    id: 'LD-201',
    clientName: 'Hoàng Minh Đức',
    phone: '0905112233',
    email: 'duc.hm@hust.edu.vn',
    school: 'Đại Học Bách Khoa Hà Nội',
    topic: 'App Quản lý tài chính cá nhân & Phân tích chi tiêu AI',
    budgetVnd: 16000000,
    status: 'Mới tiếp nhận',
    source: 'Landing Page',
    createdAt: '23/07/2026'
  },
  {
    id: 'LD-202',
    clientName: 'Phan Thảo Nhi',
    phone: '0914223344',
    email: 'nhi.pt@uit.edu.vn',
    school: 'Đại Học Công Nghệ Thông Tin (UIT)',
    topic: 'Hệ thống Smart Home nhận diện giọng nói tiếng Việt offline',
    budgetVnd: 22000000,
    status: 'Đang tư vấn',
    source: 'Zalo',
    createdAt: '22/07/2026'
  },
  {
    id: 'LD-203',
    clientName: 'Lê Tấn Đạt',
    phone: '0925334455',
    email: 'dat.lt@dut.udn.vn',
    school: 'Đại Học Bách Khoa Đà Nẵng',
    topic: 'Nền tảng Booking khách sạn & Tour du lịch thông minh Next.js',
    budgetVnd: 18000000,
    status: 'Đã báo giá',
    source: 'Facebook Fanpage',
    createdAt: '21/07/2026'
  },
  {
    id: 'LD-204',
    clientName: 'Đặng Thùy Trang',
    phone: '0936445566',
    email: 'trang.dt@khtn.edu.vn',
    school: 'Đại Học Khoa Học Tự Nhiên',
    topic: 'Phân tích dữ liệu Y tế & Dự đoán biến chứng tiểu đường Machine Learning',
    budgetVnd: 19500000,
    status: 'Đã chốt hợp đồng',
    source: 'Học viên giới thiệu',
    createdAt: '19/07/2026'
  },
  {
    id: 'LD-205',
    clientName: 'Võ Anh Tuấn',
    phone: '0947556677',
    email: 'tuan.va@sgu.edu.vn',
    school: 'Đại Học Sài Gòn',
    topic: 'Ứng dụng Quản lý chuỗi Cửa hàng bán lẻ đa chi nhánh Flutter + NestJS',
    budgetVnd: 17000000,
    status: 'Đang tư vấn',
    source: 'Landing Page',
    createdAt: '22/07/2026'
  },
  {
    id: 'LD-206',
    clientName: 'Nguyễn Phương Linh',
    phone: '0958667788',
    email: 'linh.np@vku.udn.vn',
    school: 'ĐH CNTT & Truyền Thông Việt Hàn',
    topic: 'Website Tuyển dụng IT & Lọc CV tự động bằng NLP Matching',
    budgetVnd: 21000000,
    status: 'Mới tiếp nhận',
    source: 'Zalo',
    createdAt: '23/07/2026'
  },
  {
    id: 'LD-207',
    clientName: 'Trần Khắc Huy',
    phone: '0969778899',
    email: 'huy.tk@tdtu.edu.vn',
    school: 'Đại Học Tôn Đức Thắng',
    topic: 'Hệ thống Đấu giá trực tuyến Bidding Realtime WebSockets & Redis',
    budgetVnd: 25000000,
    status: 'Đã báo giá',
    source: 'Facebook Fanpage',
    createdAt: '20/07/2026'
  }
];

export const INITIAL_DEVS: LubpyDevItem[] = [];

export const INITIAL_CLIENTS: LubpyClientItem[] = [
  {
    id: 'CL-101',
    name: 'Nguyễn Văn An',
    phone: '0912345678',
    email: 'an.nguyen@bk.edu.vn',
    school: 'Đại Học Bách Khoa TP.HCM',
    workplace: 'Đại Học Bách Khoa TP.HCM (Khoa KH&KT Máy Tính)',
    position: 'Sinh Viên Năm Cuối (Học viên)',
    tier: 'Thân thiết',
    createdAt: '15/06/2026',
    notes: 'Khách hàng yêu cầu hỗ trợ cài đặt môi trường trực tiếp qua UltraViewer và tài liệu hướng dẫn chạy code chi tiết.'
  },
  {
    id: 'CL-102',
    name: 'Trần Thị Mai',
    phone: '0987654321',
    email: 'mai.tran@vnu.edu.vn',
    school: 'Đại Học Quốc Gia',
    workplace: 'Viện Đào Tạo Quốc Tế - ĐHQG TP.HCM',
    position: 'Học Viên Cao Học CNTT',
    tier: 'Mới',
    createdAt: '20/06/2026',
    notes: 'Cần tài liệu thuyết minh bám sát chuẩn IEEE 830, bảo mật thông tin đề tài luận văn.'
  },
  {
    id: 'CL-103',
    name: 'Lê Hoàng Nam',
    phone: '0903456789',
    email: 'nam.le@neu.edu.vn',
    school: 'Đại Học Kinh Tế Quốc Dân',
    workplace: 'Viện CNTT Kinh Tế & Chuyển Đổi Số - NEU',
    position: 'Kỹ Sư Phần Mềm Dự Bị / Học viên',
    tier: 'Giới thiệu người khác',
    createdAt: '10/05/2026',
    notes: 'Thường bảo vệ sớm hơn lịch chung 1 tuần, ưu tiên họp review code vào cuối tuần.'
  },
  {
    id: 'CL-104',
    name: 'Phạm Quốc Bảo',
    phone: '0934567890',
    email: 'bao.pham@uet.vnu.edu.vn',
    school: 'ĐH Công Nghệ - ĐHQGHN',
    workplace: 'Trường ĐH Công Nghệ - ĐHQGHN',
    position: 'Sinh Viên CNTT Khóa K66',
    tier: 'Mới',
    createdAt: '28/06/2026',
    notes: 'Cần hỗ trợ cấu hình Dockerfile và kịch bản demo trên server cloud Linux.'
  },
  {
    id: 'CL-105',
    name: 'Vũ Thị Lan',
    phone: '0945678901',
    email: 'lan.vu@meditech.edu.vn',
    school: 'ĐH Y Dược / ĐH CNTT',
    workplace: 'Bệnh viện Thống Nhất / ĐH Y Dược TP.HCM',
    position: 'Bác Sĩ Thực Tập / Học Viên IT Y Tế',
    tier: 'Mới',
    createdAt: '02/07/2026',
    notes: 'Đề tài bệnh án điện tử, cần bảo mật dữ liệu mẫu bệnh nhân giả lập và kiểm thử kỹ.'
  },
  {
    id: 'CL-106',
    name: 'Đỗ Minh Khang',
    phone: '0967890123',
    email: 'khang.do@fpt.edu.vn',
    school: 'Đại Học FPT',
    workplace: 'FPT Software (Phân hiệu ĐH FPT TP.HCM)',
    position: 'Fresher Developer / Học viên',
    tier: 'Thân thiết',
    createdAt: '18/04/2026',
    notes: 'Ưa thích công nghệ Blockchain & Next.js, thường xuyên phản hồi nhanh qua Zalo.'
  },
  {
    id: 'CL-107',
    name: 'Bùi Thùy Dung',
    phone: '0978901234',
    email: 'dung.bui@law.edu.vn',
    school: 'ĐH Luật / ĐH CNTT',
    workplace: 'Văn Phòng Luật Sư Sài Gòn / ĐH Luật TP.HCM',
    position: 'Học Viên Văn Bằng 2 CNTT',
    tier: 'Mới',
    createdAt: '05/07/2026',
    notes: 'Cần chú trọng phân tích yêu cầu nghiệp vụ và lưu đồ BPMN rõ ràng trong báo cáo.'
  },
  {
    id: 'CL-108',
    name: 'Ngô Gia Huy',
    phone: '0918902345',
    email: 'huy.ngo@hcmute.edu.vn',
    school: 'ĐH Sư Phạm Kỹ Thuật TP.HCM',
    workplace: 'ĐH Sư Phạm Kỹ Thuật TP.HCM',
    position: 'Sinh Viên Năm 4 Chuyên Ngành Mạng & Web',
    tier: 'Giới thiệu người khác',
    createdAt: '25/05/2026',
    notes: 'Yêu cầu có slide thuyết trình song ngữ (tiếng Anh và tiếng Việt) phục vụ hội đồng.'
  },
  {
    id: 'CL-109',
    name: 'Lý Thái Phong',
    phone: '0929013456',
    email: 'phong.ly@ptit.edu.vn',
    school: 'Học Viện Công Nghệ Bưu Chính Viễn Thông',
    workplace: 'Học Viện Công Nghệ Bưu Chính Viễn Thông (Cơ Sở TP.HCM)',
    position: 'Học Viên Khóa Chuyên Sâu AI & Thị Giác Máy Tính',
    tier: 'Thân thiết',
    createdAt: '10/04/2026',
    notes: 'Cần file trọng số YOLOv8 pre-trained và notebook hướng dẫn train trên Google Colab Pro.'
  },
  {
    id: 'CL-110',
    name: 'Trịnh Thu Hà',
    phone: '0939124567',
    email: 'ha.trinh@hub.edu.vn',
    school: 'Đại Học Ngân Hàng',
    workplace: 'Ngân Hàng TMCP Quân Đội (MB Bank) / ĐH Ngân Hàng TP.HCM',
    position: 'Chuyên Viên Phân Tích Nghiệp Vụ (BA)',
    tier: 'Mới',
    createdAt: '12/07/2026',
    notes: 'Cần tài liệu SRS và sơ đồ Use Case, ERD chuẩn mực phục vụ bảo vệ đề tài tốt nghiệp.'
  }
];

export const INITIAL_REPO_DOCS = [
  { id: 'DOC-01', name: 'Template_BaoCao_LuanVan_TotNghiep_Chuan_Bo_GD_2026.docx', size: '18.5 MB', type: 'DOC' },
  { id: 'DOC-02', name: 'Slide_ThuyetTrinh_BaoVe_DoAn_DatDiem10_Mau1.pptx', size: '24.2 MB', type: 'SLIDE' },
  { id: 'DOC-03', name: 'Slide_BaoVe_ChuyenNganh_AI_MachineLearning_DarkUI.pptx', size: '31.0 MB', type: 'SLIDE' },
  { id: 'DOC-04', name: 'Mau_SRS_DacTa_YeuCau_PhanMem_Chuan_IEEE830.pdf', size: '6.8 MB', type: 'DOC' },
  { id: 'DOC-05', name: 'KienTruc_Microservices_EventDriven_Architecture_Diagram.drawio', size: '4.2 MB', type: 'REPORT' },
  { id: 'DOC-06', name: 'Boilerplate_NextJS14_Tailwind_Prisma_Fullstack_Starter.zip', size: '85.4 MB', type: 'SOURCE' },
  { id: 'DOC-07', name: 'SourceCode_FastAPI_PyTorch_YOLOv8_ComputerVision_Module.zip', size: '142.0 MB', type: 'SOURCE' },
  { id: 'DOC-08', name: 'Template_Flutter_MobileApp_CleanArchitecture_BLoC.zip', size: '98.6 MB', type: 'SOURCE' },
  { id: 'DOC-09', name: 'SpringBoot3_Microservices_Kafka_DockerCompose_Template.zip', size: '115.0 MB', type: 'SOURCE' },
  { id: 'DOC-10', name: 'Database_Schema_PostgreSQL_Redis_Fintech_Trading_v2.sql', size: '12.4 MB', type: 'DATA' },
  { id: 'DOC-11', name: 'SmartFarm_IoT_ESP32_MQTT_Arduino_Firmware_Source.zip', size: '38.0 MB', type: 'SOURCE' },
  { id: 'DOC-12', name: 'Solidity_SmartContract_ERC721_Auction_Hardhat_Project.zip', size: '45.2 MB', type: 'SOURCE' },
  { id: 'DOC-13', name: 'Mau_So_Tay_CauHoi_PhanBien_HoiDong_DiemCao.pdf', size: '9.1 MB', type: 'DOC' },
  { id: 'DOC-14', name: 'Dataset_Medical_Image_ChestXRay_Preprocessed_Sample.zip', size: '210.5 MB', type: 'DATA' },
  { id: 'DOC-15', name: 'LangChain_RAG_ChromaDB_LawConsultant_Notebook.ipynb', size: '16.8 MB', type: 'SOURCE' },
  { id: 'DOC-16', name: 'QuyTrinh_KiemThu_TestPlan_UnitTest_Jest_Cypress.xlsx', size: '5.5 MB', type: 'REPORT' }
];

function RevenueBarChart({ projects }: { projects: LubpyProjectItem[] }) {
  const months = [
    { m: 'T7/2026 (Hiện tại)', key: '07' },
    { m: 'T8/2026', key: '08' },
    { m: 'T9/2026', key: '09' },
    { m: 'T10/2026', key: '10' },
    { m: 'T11/2026', key: '11' },
    { m: 'T12/2026', key: '12' },
  ];

  const chartData = months.map(month => {
    const monthProjects = projects.filter(p => {
      if (p.defenseDate && p.defenseDate.includes(`/${month.key}/`)) {
        return true;
      }
      if (month.key === '07' && (!p.defenseDate || !/\/(0[7-9]|1[0-2])\//.test(p.defenseDate))) {
        return true;
      }
      return false;
    });
    const vnd = monthProjects.reduce((acc, curr) => acc + curr.priceVnd, 0);
    return { ...month, vnd };
  });

  const maxVnd = Math.max(...chartData.map(d => d.vnd), 10000000);

  return (
    <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 pt-4 border-b border-white/10 px-2">
      {chartData.map((item) => {
        const pct = item.vnd > 0 ? (item.vnd / maxVnd) * 100 : 0;
        return (
          <div key={item.m} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950 border border-sky-400/30 text-[10px] font-mono px-2 py-1 rounded text-sky-300 mb-1 shadow-2xl">
              {formatVND(item.vnd)}
            </div>
            <div 
              style={{ height: `${item.vnd > 0 ? Math.max(pct, 8) : 4}%` }}
              className={`w-full rounded-t-xl transition-all duration-300 cursor-pointer flex items-end justify-center pb-2 ${
                item.vnd > 0 
                  ? 'bg-gradient-to-t from-sky-600 via-blue-600 to-sky-400 border-t border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                  : 'bg-slate-800/40 border-t border-white/10'
              }`}
            >
              {item.vnd > 0 && (
                <span className="text-[9px] font-black text-white rotate-270 hidden sm:block">
                  {((item.vnd ?? 0) / 1000000).toFixed(0)}M
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors text-center">
              {item.m}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ClientDetailModalContent({ 
  selectedClientForModal, 
  projects, 
  clientNotes, 
  setClientNotes 
}: { 
  selectedClientForModal: LubpyClientItem; 
  projects: LubpyProjectItem[]; 
  clientNotes: Record<string, string>; 
  setClientNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const clientPrjs = projects.filter(p => (p.clientName || '').toLowerCase() === (selectedClientForModal?.name || '').toLowerCase());
  const totalSpent = clientPrjs.reduce((sum, p) => sum + p.priceVnd, 0);

  // Determine payment status
  const hasIncomplete = clientPrjs.some(p => p.status !== 'Completed');
  const paymentStatusText = clientPrjs.length === 0
    ? 'Chưa phát sinh giao dịch'
    : !hasIncomplete
      ? `✅ Đã Tất Toán 100% (${formatVND(totalSpent)})`
      : `🟡 Đã Thanh Toán Cọc 50% (${formatVND(totalSpent * 0.5)}) • Còn lại: ${formatVND(totalSpent * 0.5)}`;

  return (
    <div className="space-y-6">
      {/* 1 to 4: HỒ SƠ KHÁCH HÀNG: HỌ TÊN, SĐT, NƠI LÀM VIỆC, CHỨC VỤ */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-sky-500/20 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-[11px] font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
            <span>👤</span> Thông Tin Định Danh Khách Hàng
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Hồ sơ khách hàng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* 1. Họ Tên */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">1. Họ &amp; Tên Khách Hàng:</span>
            <div className="text-sm font-black text-white">{selectedClientForModal.name}</div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedClientForModal.email}</div>
          </div>

          {/* 2. Số Điện Thoại */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">2. Số Điện Thoại / Zalo:</span>
            <div className="text-sm font-black text-emerald-400 font-mono">{selectedClientForModal.phone}</div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">Kênh liên hệ chính thức</div>
          </div>

          {/* 3. Nơi Làm Việc (Trường Học / Viện / Công Ty) */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">3. Nơi Làm Việc / Trường Học:</span>
            <div className="text-xs font-bold text-sky-200">
              {selectedClientForModal.workplace || selectedClientForModal.school || 'Đang cập nhật'}
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">Đơn vị công tác / Đào tạo</div>
          </div>

          {/* 4. Chức Vụ */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">4. Chức Vụ / Vị Trí:</span>
            <div className="text-xs font-bold text-amber-300">
              {selectedClientForModal.position || 'Học viên / Sinh viên CNTT'}
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">Hạng thành viên: {selectedClientForModal.tier}</div>
          </div>
        </div>
      </div>

      {/* 5, 6, 7: SỐ ĐỒ ÁN, SỐ TIỀN GIAO DỊCH, TÌNH TRẠNG THANH TOÁN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 5. Số Đồ Án Đã Đặt */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-white/10 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400">5. Số Đồ Án Đã Đặt</div>
          <div className="text-xl font-black text-white font-mono">{clientPrjs.length} Đồ án</div>
          <div className="text-[10px] text-sky-400">Tổng đề tài yêu cầu</div>
        </div>

        {/* 6. Số Tiền Giao Dịch */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-white/10 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400">6. Số Tiền Giao Dịch</div>
          <div className="text-xl font-black text-emerald-400 font-mono">{formatVND(totalSpent)}</div>
          <div className="text-[10px] text-emerald-400/80">Tổng doanh số tích lũy</div>
        </div>

        {/* 7. Tình Trạng Thanh Toán */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-white/10 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400">7. Tình Trạng Thanh Toán</div>
          <div className="text-xs font-bold text-amber-300 leading-tight">{paymentStatusText}</div>
          <div className="text-[10px] text-gray-400">Theo tiến độ hợp đồng</div>
        </div>
      </div>

      {/* 8. LỊCH SỬ NHỮNG ĐỒ ÁN MÀ KHÁCH HÀNG ĐÃ YÊU CẦU */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
            <span>📜</span> 8. Lịch Sử Những Đồ Án Mà Khách Hàng Đã Yêu Cầu ({clientPrjs.length}):
          </h4>
          <span className="text-[10px] text-gray-400 font-mono">Dữ liệu kiểm toán</span>
        </div>

        {clientPrjs.length === 0 ? (
          <div className="text-center py-6 bg-slate-950/60 rounded-xl border border-dashed border-white/10 text-xs text-gray-400">
            Chưa có đồ án chính thức nào được kích hoạt từ khách hàng này.
          </div>
        ) : (
          <div className="space-y-2">
            {clientPrjs.map(p => (
              <div key={p.id} className="p-3.5 bg-slate-950 rounded-xl border border-white/10 hover:border-sky-500/30 transition-all text-xs space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {p.id}
                      </span>
                      <span className="text-sm">{p.title}</span>
                    </div>
                    <div className="text-gray-400 font-mono text-[11px]">
                      Stack: <span className="text-gray-200">{p.techStack}</span> | Hạn bảo vệ: <span className="text-amber-300">{p.defenseDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-400 font-mono text-sm">{formatVND(p.priceVnd)}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold block mt-1">
                      {p.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>Tiến độ thực hiện kỹ thuật:</span>
                    <span className="text-sky-400 font-bold">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-sky-500 to-emerald-400 h-1.5 rounded-full" 
                      style={{ width: `${p.progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9. NHỮNG GHI CHÚ CỦA KHÁCH HÀNG */}
      <div className="space-y-2 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
            <span>📝</span> 9. Những Ghi Chú Của Khách Hàng &amp; Yêu Cầu Riêng Tư:
          </h4>
          <span className="text-[10px] text-amber-400 font-mono font-bold">Lưu tự động</span>
        </div>

        {/* Existing Note from Customer Registration */}
        {selectedClientForModal.notes && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed">
            <span className="font-bold block mb-0.5 text-amber-300">Yêu cầu từ khách hàng khi đăng ký:</span>
            {selectedClientForModal.notes}
          </div>
        )}

        <textarea 
          rows={3}
          value={clientNotes[selectedClientForModal.phone] || selectedClientForModal.notes || ''}
          onChange={(e) => {
            const val = e.target.value;
            const updated = { ...clientNotes, [selectedClientForModal.phone]: val };
            setClientNotes(updated);
            localStorage.setItem('lubpy_admin_client_notes', JSON.stringify(updated));
          }}
          placeholder="Ghi chú các yêu cầu đặc biệt, lưu ý tiến độ hoặc thói quen của khách hàng này..."
          className="w-full bg-slate-950 border border-white/10 text-xs text-gray-200 p-3 rounded-xl focus:border-sky-500 font-sans"
        />
      </div>
    </div>
  );
}

function AppointDepartmentHeadModalContent({
  selectedDeptForAppoint,
  setSelectedDeptForAppoint,
  DEPT_CONFIGS,
  orgData,
  handleAppointHead,
  handleRemoveHead,
  appointPhotoUrl,
  setAppointPhotoUrl,
  appointSpecialty,
  setAppointSpecialty,
  appointSkills,
  setAppointSkills,
  appointPresetSpecialty,
  replacingHeadUid
}: {
  selectedDeptForAppoint: string;
  setSelectedDeptForAppoint: (dept: string | null) => void;
  DEPT_CONFIGS: any;
  orgData: any;
  handleAppointHead: (e: React.FormEvent<HTMLFormElement>) => void;
  handleRemoveHead: (dept: string) => void;
  appointPhotoUrl: string;
  setAppointPhotoUrl: (url: string) => void;
  appointSpecialty: string;
  setAppointSpecialty: (spec: string) => void;
  appointSkills: string;
  setAppointSkills: (skills: string) => void;
  appointPresetSpecialty?: string | null;
  replacingHeadUid?: string | null;
}) {
  const currentConfig = DEPT_CONFIGS[selectedDeptForAppoint] || DEPT_CONFIGS['tech'];
  const replacingHead = replacingHeadUid
    ? (Object.values(orgData.heads) as User[]).find((h: any) => h?.uid === replacingHeadUid)
    : null;
  const currentHead = replacingHead || orgData.heads[selectedDeptForAppoint];
  const quotaStats = getDepartmentQuotaStats(orgData.heads, selectedDeptForAppoint);
  const currentSpecHeads = getHeadsForSpecialty(orgData.heads, selectedDeptForAppoint, appointSpecialty);
  const isCurrentSpecLocked = !replacingHead && currentSpecHeads.length >= 2;
  const isDeptFullyLocked = !replacingHead && quotaStats.isFullyLocked;

  const initialName = replacingHead ? '' : (currentHead?.name || '');
  const initialEmail = replacingHead ? '' : (currentHead?.email || (initialName ? normalizeNameToEmail(initialName) : ''));
  const [localName, setLocalName] = useState(initialName);
  const [localEmail, setLocalEmail] = useState(initialEmail);
  const [localDob, setLocalDob] = useState(currentHead?.dob || '');
  const initialDobPass = currentHead?.dob ? dobTo8Digits(currentHead.dob) : '';
  const [localPass, setLocalPass] = useState(
    initialDobPass || currentHead?.password || ''
  );
  const [showLocalPass, setShowLocalPass] = useState(false);

  const handleNameChange = (val: string) => {
    setLocalName(val);
    const autoEmail = normalizeNameToEmail(val);
    setLocalEmail(autoEmail);
  };

  return (
    <>
      <div className="flex items-center gap-3 pr-8">
        <div className="p-2.5 bg-slate-950 border border-white/10 rounded-xl text-amber-400">
          {currentConfig.icon}
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-white leading-tight">
            {replacingHead 
              ? `Thay Trưởng Phòng Mới: ${replacingHead.name}` 
              : currentHead 
              ? `Tuyển Thêm / Cập Nhật Trưởng Phòng ${currentConfig.label}` 
              : `Bổ Nhiệm Trưởng Phòng ${currentConfig.label}`}
          </h3>
          <p className="text-[11px] text-gray-400">
            {currentConfig.desc}
          </p>
        </div>
      </div>

      {isDeptFullyLocked && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
          <LockIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">🔒 HỆ THỐNG ĐÃ KHÓA TOÀN BỘ BỘ PHẬN ({quotaStats.currentHeadsCount}/{quotaStats.maxHeadsCapacity} Trưởng phòng)</div>
            <p className="text-[11px] text-gray-300 mt-0.5">
              Tất cả {quotaStats.totalSpecialties} chuyên môn nghiệp vụ của bộ phận này đều đã tuyển đủ 2 Trưởng phòng. Không thể tuyển thêm mới. Vui lòng bấm &quot;Thay Trưởng Phòng Mới&quot; hoặc &quot;Cập Nhật Thông Tin&quot; nếu cần thay đổi nhân sự.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleAppointHead} className="space-y-2.5 pt-2 border-t border-white/10">
        {/* Row 1: Dept & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">Bộ Phận / Nghiệp Vụ Bổ Nhiệm:</label>
            <select 
              name="deptKey"
              value={selectedDeptForAppoint}
              onChange={(e) => setSelectedDeptForAppoint(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-bold focus:border-amber-500 cursor-pointer"
            >
              <option value="tech">💻 Đội Ngũ Kỹ Thuật (Engineering)</option>
              <option value="cs">🤝 Chăm Sóc Khách Hàng (CSKH)</option>
              <option value="hr">💼 Quản Lý Nhân Sự (HR)</option>
              <option value="accounting">🧮 Kế Toán &amp; Tài Chính (Finance)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">Chức Danh Phân Công:</label>
            <input 
              name="title"
              type="text"
              required
              defaultValue={currentHead?.departmentTitle || currentConfig.roleTitle}
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-bold focus:border-amber-500"
            />
          </div>
        </div>

        {/* Avatar Upload Section for Appointed Head */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-white/10 space-y-2">
          <label className="block text-[11px] font-bold text-gray-300 uppercase flex items-center justify-between">
            <span>🖼️ Ảnh Đại Diện / Chân Dung Trưởng Phòng:</span>
            <span className="text-[10px] text-amber-400 font-normal">Tự động hiển thị khi Trưởng phòng đăng nhập</span>
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative shrink-0">
              <img 
                src={appointPhotoUrl || currentHead?.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentHead?.name || 'Head')}&backgroundColor=0f172a`} 
                alt="Avatar Trưởng Phòng" 
                className="w-14 h-14 rounded-xl object-cover border-2 border-amber-500/50 bg-slate-900 shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <label 
                  htmlFor="appoint-head-avatar-upload"
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow active:scale-95 transition-all"
                >
                  📁 <span>Tải ảnh từ máy...</span>
                </label>
                <input 
                  id="appoint-head-avatar-upload"
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImageFile(file, 256, 256, 0.75);
                        if (compressed) {
                          setAppointPhotoUrl(compressed);
                        }
                      } catch (err) {
                        console.error('Error compressing appoint photo:', err);
                      }
                    }
                  }}
                  className="hidden"
                />
                {appointPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setAppointPhotoUrl('')}
                    className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold rounded-xl border border-red-500/30 transition-all cursor-pointer"
                  >
                    ✕ Xóa ảnh chọn
                  </button>
                )}
                <span className="text-[10px] text-gray-400 font-mono">Tối đa 5MB (.png, .jpg, .webp)</span>
              </div>

              <input 
                name="photoUrl"
                type="text"
                value={appointPhotoUrl}
                onChange={(e) => setAppointPhotoUrl(e.target.value)}
                placeholder="Hoặc dán đường dẫn ảnh HTTPS trực tuyến..."
                className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-1.5 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
              Họ &amp; Tên Trưởng Phòng <span className="text-red-400">*</span>:
            </label>
            <input 
              name="name"
              type="text"
              required
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="VD: Nguyễn Văn A / Lê Bảo"
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500 transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-gray-300 uppercase">
                Email Công Việc <span className="text-red-400">*</span>:
              </label>
              <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                ⚡ @lubpystudio.vn
              </span>
            </div>
            <input 
              name="email"
              type="email"
              required
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              placeholder="nguyenvana@lubpystudio.vn"
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-mono focus:border-amber-500 transition-colors"
            />
            {localName.trim() && (
              <p className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1 font-mono truncate">
                ✓ Ràng buộc email chuẩn hóa: <span className="text-white font-bold">{localEmail || normalizeNameToEmail(localName)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Row 3: DOB, Phone, Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-gray-300 uppercase">🎂 Ngày Sinh (DOB):</label>
              {localDob && (
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  8 số: {dobTo8Digits(localDob)}
                </span>
              )}
            </div>
            <input 
              name="dob"
              type="date"
              value={localDob}
              onChange={(e) => {
                const newDob = e.target.value;
                setLocalDob(newDob);
                const digits = dobTo8Digits(newDob);
                // RÀNG BUỘC ĐIỀU KIỆN: Khi thay đổi ngày sinh, mật khẩu tự động cập nhật theo 8 số ngày sinh
                if (digits) {
                  setLocalPass(digits);
                }
              }}
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-2.5 py-2 rounded-xl font-mono focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">📞 Số Điện Thoại:</label>
            <input 
              name="phone"
              type="tel"
              defaultValue={currentHead?.phone || ''}
              placeholder="VD: 0912345678"
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-mono focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">💼 Kinh Nghiệm:</label>
            <select 
              name="experience"
              defaultValue={currentHead?.experience || 'Từ 2 đến 5 năm'}
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500 cursor-pointer"
            >
              <option value="Dưới 2 năm">Dưới 2 năm</option>
              <option value="Từ 2 đến 5 năm">Từ 2 đến 5 năm</option>
              <option value="Từ 5 đến 10 năm">Từ 5 đến 10 năm</option>
              <option value="Trên 10 năm">Trên 10 năm</option>
            </select>
          </div>
        </div>

        {/* Row 4: Specialty & Skills (Tailored per Department with Auto-Sync and Max 2 Quota Locks) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-gray-300 uppercase">{currentConfig.specialtyLabel}</label>
              <span className="text-[10px] text-amber-400 font-bold">
                Tối đa 2 Trưởng phòng / Chuyên môn
              </span>
            </div>
            <select 
              name="specialty"
              value={appointSpecialty}
              onChange={(e) => {
                const newSpec = e.target.value;
                setAppointSpecialty(newSpec);
                const specIdx = currentConfig.specialtyOptions.indexOf(newSpec);
                if (specIdx !== -1 && currentConfig.scopeOptions[specIdx]) {
                  setAppointSkills(currentConfig.scopeOptions[specIdx]);
                }
              }}
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:border-amber-500 cursor-pointer"
            >
              {currentConfig.specialtyOptions.map((opt: string, idx: number) => {
                const headsInOpt = getHeadsForSpecialty(orgData.heads, selectedDeptForAppoint, opt);
                const optLocked = headsInOpt.length >= 2 && (!replacingHead || replacingHead.competence !== opt);
                return (
                  <option key={idx} value={opt} disabled={optLocked}>
                    {optLocked 
                      ? `🔒 ${opt} (ĐÃ ĐỦ 2/2 - ĐÃ KHÓA)` 
                      : `${opt} (${headsInOpt.length}/2 Trưởng phòng)`}
                  </option>
                );
              })}
              {appointSpecialty && !currentConfig.specialtyOptions.includes(appointSpecialty) && (
                <option value={appointSpecialty}>{appointSpecialty}</option>
              )}
            </select>

            {isCurrentSpecLocked && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-2 mt-2">
                <LockIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Chuyên môn này đã đủ tối đa 2 Trưởng phòng ({currentSpecHeads.length}/2)</strong>. Hệ thống đã <strong>khóa</strong> không cho nhập thêm. Vui lòng chọn chuyên môn còn chỉ tiêu hoặc thay thế Trưởng phòng hiện có.
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">{currentConfig.scopeLabel}</label>
            <select 
              name="skills"
              value={appointSkills}
              onChange={(e) => setAppointSkills(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3 py-2 rounded-xl font-mono focus:border-amber-500 cursor-pointer"
            >
              {appointSkills && !currentConfig.scopeOptions.includes(appointSkills) && (
                <option value={appointSkills}>{appointSkills}</option>
              )}
              {currentConfig.scopeOptions.map((opt: string, idx: number) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Password Field Box */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1.5">
              🔑 Mật Khẩu Cấp Cho Trưởng Phòng <span className="text-red-400">*</span>:
            </label>
            {localDob ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                ✓ Ràng buộc 8 số ngày sinh ({dobTo8Digits(localDob)})
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-mono">
                (Chưa nhập ngày sinh)
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input 
              name="password"
              type={showLocalPass ? 'text' : 'password'}
              required={!currentHead && !localDob}
              value={localPass}
              onChange={(e) => setLocalPass(e.target.value)}
              placeholder="Nhập mật khẩu hoặc tự động gán theo ngày sinh..."
              className="w-full bg-slate-900 border border-white/10 text-xs text-white pl-3 pr-10 py-2 rounded-lg font-mono focus:border-amber-400 font-bold"
            />
            <button
              type="button"
              onClick={() => setShowLocalPass(!showLocalPass)}
              className="absolute right-2 p-1 text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
              title={showLocalPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showLocalPass ? <EyeOffIcon className="w-4 h-4 text-amber-400" /> : <EyeIcon className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          {localDob ? (
            <p className="text-[10px] text-emerald-400 leading-normal">
              ✓ <strong>Ràng buộc điều kiện:</strong> Mật khẩu tự động cập nhật là <strong>{dobTo8Digits(localDob)}</strong> theo ngày sinh (8 số). Khi cập nhật thay đổi ngày sinh, mật khẩu sẽ tự động cập nhật theo.
            </p>
          ) : (
            <p className="text-[10px] text-amber-400/90 leading-normal">
              🔒 Vui lòng nhập ngày tháng năm sinh để hệ thống tự động gán mật khẩu 8 số (DDMMYYYY).
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-2.5">
          {currentHead && (
            <button 
              type="button"
              onClick={() => {
                handleRemoveHead(replacingHead ? (replacingHead.uid || selectedDeptForAppoint) : selectedDeptForAppoint);
                setSelectedDeptForAppoint(null);
              }}
              className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              {replacingHead ? 'Miễn Nhiệm Trưởng Phòng Này' : 'Gỡ Bổ Nhiệm'}
            </button>
          )}
          <button 
            type="button"
            onClick={() => setSelectedDeptForAppoint(null)}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition-all"
          >
            Hủy Bỏ
          </button>
          <button 
            type="submit"
            disabled={isCurrentSpecLocked || isDeptFullyLocked}
            className={`flex-1 py-2 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all ${
              isCurrentSpecLocked || isDeptFullyLocked
                ? 'bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 cursor-pointer'
            }`}
          >
            {isCurrentSpecLocked || isDeptFullyLocked ? (
              '🔒 Đã Khóa (Đủ 2 Trưởng Phòng)'
            ) : replacingHead ? (
              '🔄 Lưu Thay Thế Trưởng Phòng Mới'
            ) : (
              `👑 Lưu Bổ Nhiệm [Vị Trí ${currentSpecHeads.length + 1}/2]`
            )}
          </button>
        </div>
      </form>
    </>
  );
}

export default function AdminFintrixityDashboard({ 
  user, 
  onLogout, 
  language,
  onSwitchToSystemManager,
  onUpdateUser
}: AdminFintrixityDashboardProps) {

  const isVi = language === 'vi';

  // Current Admin User Profile State
  const [adminUser, setAdminUser] = useState<User>(user);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAvatarUrl, setEditingAvatarUrl] = useState<string>(user.photoUrl);
  const [showAdminCameraModal, setShowAdminCameraModal] = useState(false);

  useEffect(() => {
    setAdminUser(user);
    setEditingAvatarUrl(user.photoUrl);
  }, [user]);

  // Notification Mailbox Modal State
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Active Admin Sidebar Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'projects' | 'contracts' | 'clients' | 'devs' | 'leads' | 'repository' | 'settings' | 'reviews'
  >('overview');

  const [workflowProjects, setWorkflowProjects] = useState<WorkflowProject[]>(() => getWorkflowProjects());
  const [selectedWorkflowContract, setSelectedWorkflowContract] = useState<WorkflowProject | null>(null);

  useEffect(() => {
    const handleWf = () => setWorkflowProjects(getWorkflowProjects());
    window.addEventListener('lubpy_workflow_projects_updated', handleWf);
    return () => window.removeEventListener('lubpy_workflow_projects_updated', handleWf);
  }, []);

  const [clientsSubTab, setClientsSubTab] = useState<'list' | 'reviews'>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Projects Master State - Initialized with baseline projects or loaded from PostgreSQL
  const [projects, setProjects] = useState<LubpyProjectItem[]>(() => {
    const saved = localStorage.getItem('lubpy_admin_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: LubpyProjectItem) => ({
            ...p,
            assignedDev: 'Chưa phân công',
            thumbnailUrl: p.thumbnailUrl || getCuratedThumbnail(p.title, p.techStack)
          }));
        }
      } catch (e) {}
    }
    return INITIAL_ADMIN_PROJECTS.map(p => ({
      ...p,
      thumbnailUrl: p.thumbnailUrl || getCuratedThumbnail(p.title, p.techStack)
    }));
  });

  // Fetch projects directly from backend on mount
  const loadProjectsFromDb = async () => {
    try {
      const dbProjects = await fetchProjectsFromDb();
      if (Array.isArray(dbProjects) && dbProjects.length > 0) {
        const formatted: LubpyProjectItem[] = dbProjects.map((p: any) => ({
          id: p.id,
          title: p.title,
          clientName: p.clientName,
          school: p.school || 'Đại Học CNTT',
          techStack: (() => {
            if (Array.isArray(p.techStack)) return p.techStack.join(', ');
            if (typeof p.techStack === 'string') {
              if (p.techStack.startsWith('[')) {
                try {
                  const arr = JSON.parse(p.techStack);
                  if (Array.isArray(arr)) return arr.join(', ');
                } catch (e) {}
              }
              return p.techStack;
            }
            return 'React';
          })(),
          defenseDate: p.deadline || '30/10/2026',
          status: p.status === 'coding' ? 'In Progress' : (p.status === 'delivered' ? 'Completed' : (p.status === 'pending' ? 'Pending' : p.status)),
          assignedDev: p.assignedDevName || 'Chưa phân công',
          priceVnd: Number(p.priceVnd) || 15000000,
          devCommissionRate: Number(p.devCommissionRate) || 65,
          progress: Number(p.progress) || 0,
          thumbnailUrl: p.thumbnailUrl || p.imageUrl || getCuratedThumbnail(p.title, typeof p.techStack === 'string' ? p.techStack : ''),
        }));
        setProjects(formatted);
      }
    } catch (err) {
      console.warn('Failed to load projects from PostgreSQL:', err);
    }
  };

  useEffect(() => {
    loadProjectsFromDb();
  }, []);

  // Save projects to localStorage when updated
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('lubpy_admin_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Operating Capital & Financial Reserve Fund (Vốn hiện có & Quỹ dự phòng điều hành LUBPY STUDIO)
  const [operatingCapitalVnd, setOperatingCapitalVnd] = useState<number>(() => {
    const saved = localStorage.getItem('lubpy_admin_operating_capital');
    if (saved) {
      const val = Number(saved);
      if (!isNaN(val) && val > 0) return val;
    }
    return 3850000000; // 3.85 Tỷ VNĐ Vốn Điều Hành & Quỹ Dự Phòng Hệ Thống
  });

  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [tempCapitalInput, setTempCapitalInput] = useState('3850000000');

  const handleUpdateCapital = (newVal: number) => {
    if (newVal > 0) {
      setOperatingCapitalVnd(newVal);
      localStorage.setItem('lubpy_admin_operating_capital', newVal.toString());
      setShowCapitalModal(false);
      triggerToast(`Đã cập nhật doanh số vốn điều hành hiện có: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newVal)}`);
    }
  };

  // Leads State
  const [leads, setLeads] = useState<LubpyLeadItem[]>(() => {
    const saved = localStorage.getItem('lubpy_admin_leads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_LEADS;
  });

  // Devs State (Danh mục phân công kỹ sư để trống theo yêu cầu)
  const [devs, setDevs] = useState<LubpyDevItem[]>(() => {
    localStorage.removeItem('lubpy_admin_devs');
    return [];
  });

  // Organization State (Level 1 Admin -> Level 2 Department Heads)
  const [orgData, setOrgData] = useState(() => getStoredOrganization());

  // Repository Docs State
  const [repoDocs, setRepoDocs] = useState<Array<{ id: string; name: string; size: string; type: string }>>(() => {
    const saved = localStorage.getItem('lubpy_admin_repo_docs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_REPO_DOCS;
  });

  // Clients State
  const [clients, setClients] = useState<LubpyClientItem[]>(() => {
    const saved = localStorage.getItem('lubpy_admin_clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_CLIENTS;
  });

  // Client Internal Notes State (key: clientName or client.id, value: string)
  const [clientNotes, setClientNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lubpy_admin_client_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Modals & Form States
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddDevModal, setShowAddDevModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [selectedProjectForDev, setSelectedProjectForDev] = useState<LubpyProjectItem | null>(null);
  const [selectedProjectForInspection, setSelectedProjectForInspection] = useState<LubpyProjectItem | null>(null);
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<LubpyLeadItem | null>(null);
  const [selectedLeadForReview, setSelectedLeadForReview] = useState<LubpyLeadItem | null>(null);
  const [selectedClientForModal, setSelectedClientForModal] = useState<LubpyClientItem | null>(null);
  const [projectProgressFilter, setProjectProgressFilter] = useState<'all' | 'completed' | 'in_progress' | 'urgent'>('all');
  const [selectedDeptForAppoint, setSelectedDeptForAppoint] = useState<string | null>(null);
  const [appointPresetSpecialty, setAppointPresetSpecialty] = useState<string | null>(null);
  const [replacingHeadUid, setReplacingHeadUid] = useState<string | null>(null);
  const [appointSpecialty, setAppointSpecialty] = useState<string>('');
  const [appointSkills, setAppointSkills] = useState<string>('');
  const [appointPhotoUrl, setAppointPhotoUrl] = useState<string>('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const [assignDevName, setAssignDevName] = useState('');

  // Filters State
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('Tất cả');
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>('Tất cả');
  const [repoSubTab, setRepoSubTab] = useState<'project_docs' | 'templates'>('project_docs');
  const [selectedDocProjectId, setSelectedDocProjectId] = useState<string>('all');

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newSchool, setNewSchool] = useState('');
  const [newTechStack, setNewTechStack] = useState('');
  const [newDefenseDate, setNewDefenseDate] = useState('');
  const [newPriceVnd, setNewPriceVnd] = useState('15000000');
  const [newThumbnail, setNewThumbnail] = useState('');
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);

  const handleGenerateThumbnail = async (title: string, tech: string) => {
    if (!title.trim()) return;
    setIsGeneratingThumb(true);
    try {
      const res = await api.projects.generateThumbnail({
        title: title.trim(),
        projectType: 'Đồ án tốt nghiệp',
        techStack: tech.trim(),
      });
      if (res && res.data && res.data.thumbnailUrl) {
        setNewThumbnail(res.data.thumbnailUrl);
        triggerToast('Đã tạo ảnh thumbnail AI cho đề tài thành công!');
      } else {
        const fallback = getCuratedThumbnail(title, tech);
        setNewThumbnail(fallback);
      }
    } catch (err) {
      const fallback = getCuratedThumbnail(title, tech);
      setNewThumbnail(fallback);
    } finally {
      setIsGeneratingThumb(false);
    }
  };

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadSchool, setNewLeadSchool] = useState('');
  const [newLeadTopic, setNewLeadTopic] = useState('');
  const [newLeadBudget, setNewLeadBudget] = useState('12000000');
  const [newLeadSource, setNewLeadSource] = useState<LubpyLeadItem['source']>('Landing Page');

  // New Dev Form State
  const [newDevName, setNewDevName] = useState('');
  const [newDevEmail, setNewDevEmail] = useState('');
  const [newDevSpecialty, setNewDevSpecialty] = useState('');
  const [newDevSkills, setNewDevSkills] = useState('');

  // New Client Form State
  const [newClientNameInput, setNewClientNameInput] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientSchool, setNewClientSchool] = useState('');
  const [newClientTier, setNewClientTier] = useState<LubpyClientItem['tier']>('Mới');

  // Derived Notification & Summary Data
  const { visibleNotifs: adminVisibleNotifs } = getVisibleNotificationsForUser(adminUser, orgData.heads);
  const adminEmailLower = (adminUser?.email || '').toLowerCase();
  const unreadAdminNotifCount = adminVisibleNotifs.filter(n => !n.readBy || !n.readBy.some(e => (e || '').toLowerCase() === adminEmailLower)).length;

  const allClientNames = Array.from(new Set([
    ...clients.map(c => c.name),
    ...projects.map(p => p.clientName)
  ]));

  const filteredLeads = leads.filter(l => {
    const matchStatus = leadStatusFilter === 'Tất cả' || l.status === leadStatusFilter;
    const matchSource = leadSourceFilter === 'Tất cả' || l.source === leadSourceFilter;
    return matchStatus && matchSource;
  });

  const finSummary = calcTotalFinancials(projects);

  // Department configurations tailored for appointment
  const DEPT_CONFIGS: Record<string, {
    label: string;
    roleTitle: string;
    icon: React.ReactNode;
    specialtyLabel: string;
    specialtyOptions: string[];
    scopeLabel: string;
    scopeOptions: string[];
    desc: string;
  }> = {
    tech: {
      label: 'Đội Ngũ Kỹ Thuật',
      roleTitle: 'Trưởng Phòng Kỹ Thuật (Head of Engineering)',
      icon: <LaptopIcon className="w-5 h-5 text-emerald-400" />,
      specialtyLabel: 'Chuyên Môn & Kiến Trúc Hệ Thống:',
      specialtyOptions: [
        'Fullstack Web, Mobile App, AI System & Architecture',
        'Mobile App (iOS/Android) & Cross-Platform Architecture',
        'AI System, Data Engineering & Machine Learning Systems',
        'DevOps, Cloud Infrastructure & Microservices Architecture',
        'Backend Heavy & High-Performance Database Design',
        'Frontend System UI/UX & Web Performance Optimization'
      ],
      scopeLabel: 'Công Nghệ Thế Mạnh / Skill Tags:',
      scopeOptions: [
        'React, Node.js, Python, PostgreSQL, Docker, Flutter',
        'Flutter, React Native, Firebase, REST API, GraphQL',
        'Python, FastApi, PyTorch, OpenCV, Docker, PostgreSQL',
        'Java, Spring Boot, Microservices, Kubernetes, Kafka, AWS',
        'Node.js, Express, PostgreSQL, Redis, MongoDB, GraphQL',
        'Next.js, Vue, Tailwind CSS, Redux, Webpack, TypeScript'
      ],
      desc: 'Phụ trách định hướng kỹ thuật, chỉ đạo Lead Devs, đánh giá mã nguồn và kiểm duyệt chất lượng đồ án.'
    },
    cs: {
      label: 'Chăm Sóc Khách Hàng',
      roleTitle: 'Trưởng Phòng CSKH & Tư Vấn Sinh Viên',
      icon: <HeartHandshakeIcon className="w-5 h-5 text-amber-400" />,
      specialtyLabel: 'Nghiệp Vụ CSKH & Hỗ Trợ Đề Tài:',
      specialtyOptions: [
        'Tư vấn chọn đề tài, giải quyết thắc mắc & chăm sóc sinh viên 24/7',
        'Tư vấn chọn đề tài & Định hướng sinh viên đồ án',
        'Tiếp nhận Yêu cầu, Báo giá & Chốt hợp đồng Đồ án',
        'Quản lý Đánh giá Hài lòng & Hướng dẫn Bảo vệ Đồ án',
        'Xử lý Khiếu nại & Hỗ trợ Tiến độ Đồ án Sinh viên'
      ],
      scopeLabel: 'Kênh Phụ Trách & Kỹ Năng Tư Vấn:',
      scopeOptions: [
        'Tư vấn Zalo, Hỗ trợ tiến độ, Hướng dẫn bảo vệ, CSKH VIP',
        'Tư vấn Hotline 24/7, Livechat, Chăm sóc Sinh viên VIP',
        'Tư vấn Fanpage, Zalo OA, Hỗ trợ Sửa lỗi Đồ án khẩn cấp',
        'Quản lý Feedback Sinh viên, Hỗ trợ Demo & Báo cáo Slide',
        'Hỗ trợ Tiến độ 24/7, Xử lý Đổi Devs, Hướng dẫn Đáp án Đồ án'
      ],
      desc: 'Phụ trách tiếp nhận sinh viên, tư vấn báo giá, theo dõi sự hài lòng và giải đáp thắc mắc trong suốt quá trình làm đồ án.'
    },
    hr: {
      label: 'Quản Lý Nhân Sự (HR)',
      roleTitle: 'Trưởng Phòng HR & Quản Lý Thù Lao Kỹ Sư',
      icon: <BriefcaseIcon className="w-5 h-5 text-indigo-400" />,
      specialtyLabel: 'Nghiệp Vụ Tuyển Dụng & Đánh Giá Devs:',
      specialtyOptions: [
        'Tuyển dụng kỹ sư, đánh giá KPI & tính thù lao đồ án',
        'Tuyển dụng kỹ sư & Đánh giá năng lực Devs thực chiến',
        'Xây dựng Chính sách & Quản lý Phân bổ Thù lao 65%',
        'Đánh giá KPI Kỹ sư & Đào tạo Nhân sự Kỹ thuật mới',
        'Săn nhân tài (Headhunting) & Quản lý Mạng lưới CTV'
      ],
      scopeLabel: 'Phạm Vi Quản Lý Nhân Sự & Hợp Đồng:',
      scopeOptions: [
        'Săn nhân tài Devs, Quản lý CTV, Đánh giá KPI 65% thù lao, Hợp đồng',
        'Quản lý Hợp đồng CTV, Bảng lương, Đào tạo Onboarding Kỹ sư',
        'Điều phối Nhân sự Đồ án, Theo dõi Tiến độ CTV Kỹ thuật',
        'Đánh giá Tiến độ Đồ án, Thù lao Kỹ sư, Đào tạo Quy chuẩn Code',
        'Chính sách Đãi ngộ, Xây dựng Văn hóa Doanh nghiệp LUBPY STUDIO'
      ],
      desc: 'Phụ trách tuyển dụng đội ngũ Devs chất lượng cao, xây dựng chính sách đãi ngộ, đánh giá KPI và quản lý phân bổ thù lao 65%.'
    },
    accounting: {
      label: 'Kế Toán & Tài Chính',
      roleTitle: 'Trưởng Phòng Kế Toán & Quản Lý Dòng Tiền',
      icon: <CalculatorIcon className="w-5 h-5 text-purple-400" />,
      specialtyLabel: 'Nghiệp Vụ Kế Toán & Dòng Tiền:',
      specialtyOptions: [
        'Quản lý doanh thu đồ án, đối soát tiền cọc 50% & quyết toán thù lao',
        'Quản lý Doanh thu Đồ án & Dòng tiền Toàn hệ thống LUBPY',
        'Đối soát Tiền cọc 50% & Quyết toán Thù lao Kỹ sư 65%',
        'Báo cáo Tài chính LUBPY STUDIO, Lợi nhuận & Thuế',
        'Kiểm soát Chi phí Vận hành & Dự toán Ngân sách Đồ án'
      ],
      scopeLabel: 'Nghiệp Vụ Tài Chính & Báo Cáo:',
      scopeOptions: [
        'Báo cáo doanh số CSV, Hóa đơn/Biên nhận, Đối soát tiền cọc, Dòng tiền LUBPY',
        'Xuất Hóa đơn điện tử, Quản lý Sổ sách Kế toán Doanh nghiệp',
        'Quyết toán Thù lao 65% Kỹ sư, Bảng lương Định kỳ Hàng tháng',
        'Phân tích Doanh thu Đồ án theo Tháng / Quý & Báo cáo Lợi nhuận',
        'Kiểm soát Quỹ LUBPY, Chi phí Máy chủ & Vận hành Studio'
      ],
      desc: 'Phụ trách kiểm soát 100% doanh thu cọc/nghiệm thu đồ án, xuất báo cáo tài chính LUBPY STUDIO và chi trả thù lao đúng hạn.'
    }
  };

  // Sync specialty & skills for department head appointment
  useEffect(() => {
    if (selectedDeptForAppoint && DEPT_CONFIGS[selectedDeptForAppoint]) {
      const config = DEPT_CONFIGS[selectedDeptForAppoint];
      const replacingHead = replacingHeadUid 
        ? (Object.values(orgData.heads) as User[]).find((h: any) => h?.uid === replacingHeadUid)
        : null;
      const currentHead = replacingHead || orgData.heads[selectedDeptForAppoint];
      const spec = appointPresetSpecialty || currentHead?.competence || config.specialtyOptions[0] || '';
      const specIdx = config.specialtyOptions.indexOf(spec);
      const sk = currentHead?.skills || (specIdx !== -1 ? config.scopeOptions[specIdx] : config.scopeOptions[0]) || '';
      setAppointSpecialty(spec);
      setAppointSkills(sk);
      setAppointPhotoUrl(currentHead?.photoUrl || '');
    }
  }, [selectedDeptForAppoint, appointPresetSpecialty, replacingHeadUid, orgData.heads]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('lubpy_admin_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('lubpy_admin_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('lubpy_admin_devs', JSON.stringify(devs));
  }, [devs]);

  useEffect(() => {
    localStorage.setItem('lubpy_admin_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('lubpy_admin_client_notes', JSON.stringify(clientNotes));
  }, [clientNotes]);

  const triggerToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3500);
  };

  // Urgent Defense Calculation (within 7 days of 2026-07-23)
  const isUrgentDefense = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
      if (parts.length === 3) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (dateStr.includes('-')) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        }
        const targetDate = new Date(year, month, day);
        const currentDate = new Date(2026, 6, 23); // Current system date: July 23, 2026
        const diffTime = targetDate.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  // Convert Lead to Project (Pipeline Step 1)
  const handleConvertLeadToProject = (
    lead: LubpyLeadItem, 
    techStack: string, 
    defenseDate: string, 
    priceVnd: number
  ) => {
    const newPrj: LubpyProjectItem = {
      id: `DA-2026-${String(projects.length + 1).padStart(2, '0')}`,
      title: lead.topic,
      clientName: lead.clientName,
      school: lead.school || 'Đại Học CNTT',
      techStack: techStack || 'React + Node.js',
      defenseDate: defenseDate || '30/10/2026',
      status: 'Pending',
      assignedDev: 'Chưa phân công',
      priceVnd: priceVnd || lead.budgetVnd || 15000000,
      progress: 0
    };

    // Update Projects
    setProjects(prev => [newPrj, ...prev]);

    // Update Lead Status
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'Đã chốt hợp đồng' } : l));

    // Also ensure client is in Client List
    if (!clients.some(c => (c.name || '').toLowerCase() === (lead.clientName || '').toLowerCase())) {
      setClients(prev => [{
        id: `CL-${Date.now().toString().slice(-4)}`,
        name: lead.clientName,
        phone: lead.phone,
        email: lead.email,
        school: lead.school,
        tier: 'Mới',
        createdAt: new Date().toLocaleDateString('vi-VN')
      }, ...prev]);
    }

    setSelectedLeadForConversion(null);
    triggerToast(`🚀 Đã chuyển Lead [${lead.id}] thành Đồ Án mã ${newPrj.id} thành công!`);
  };

  // 1-Click Dev Assignment (Pipeline Step 2)
  const handleOneClickAssignDev = (devName: string) => {
    if (!selectedProjectForDev) return;

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectForDev.id) {
        return {
          ...p,
          assignedDev: devName,
          status: p.status === 'Pending' ? ('In Progress' as const) : p.status
        };
      }
      return p;
    });

    // Increment dev active count
    const targetDevLower = (devName || '').toLowerCase();
    setDevs(prev => prev.map(d => {
      const dNameLower = (d.name || '').toLowerCase();
      if (dNameLower.includes(targetDevLower) || targetDevLower.includes(dNameLower)) {
        return { ...d, activeCount: d.activeCount + 1, status: 'Đang bận' };
      }
      return d;
    }));

    setProjects(updatedProjects);
    setSelectedProjectForDev(null);
    setAssignDevName('');
    triggerToast(`⚡ Giao việc 1-Click: Đã gán Kỹ sư ${devName} vào đồ án ${selectedProjectForDev.id}!`);
  };

  // Add New Lead Handler
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) return;

    const newLead: LubpyLeadItem = {
      id: `LD-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newLeadName.trim(),
      phone: newLeadPhone.trim(),
      email: newLeadEmail.trim() || 'student@lubpy.vn',
      school: newLeadSchool.trim() || 'ĐH Quốc Gia',
      topic: newLeadTopic.trim() || 'Đồ án CNTT theo yêu cầu',
      budgetVnd: parseFloat(newLeadBudget) || 12000000,
      status: 'Mới tiếp nhận',
      source: newLeadSource,
      createdAt: new Date().toLocaleDateString('vi-VN')
    };

    setLeads(prev => [newLead, ...prev]);
    setShowAddLeadModal(false);
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadEmail('');
    setNewLeadSchool('');
    setNewLeadTopic('');
    triggerToast(`Đã thêm Yêu cầu báo giá mới từ [${newLead.source}] thành công!`);
  };

  // Add New Dev Handler
  const handleCreateDev = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const rawName = (formData.get('name') as string || newDevName).trim();
    if (!rawName) return;

    const rawEmail = (formData.get('email') as string || newDevEmail).trim();
    const finalEmail = rawEmail || normalizeNameToEmail(rawName) || 'dev@lubpystudio.vn';
    const specialty = (formData.get('specialty') as string || newDevSpecialty).trim();
    const skillTags = (formData.get('skillTags') as string || newDevSkills).trim();

    const newDev: LubpyDevItem = {
      id: `dev-${Date.now().toString().slice(-4)}`,
      name: rawName,
      email: finalEmail,
      specialty: specialty || 'Fullstack React/NodeJS',
      skillTags: skillTags ? skillTags.split(',').map(s => s.trim()) : ['React', 'NodeJS'],
      activeCount: 0,
      status: 'Sẵn sàng',
      rating: 5.0
    };

    setDevs(prev => [newDev, ...prev]);
    setShowAddDevModal(false);
    setNewDevName('');
    setNewDevEmail('');
    setNewDevSpecialty('');
    setNewDevSkills('');
    triggerToast(`Đã thêm Kỹ sư ${newDev.name} (${newDev.email}) vào hệ thống!`);
  };

  // Add New Client Handler
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientNameInput.trim()) return;

    const newCli: LubpyClientItem = {
      id: `CL-${Date.now().toString().slice(-4)}`,
      name: newClientNameInput.trim(),
      phone: newClientPhone.trim() || '0901234567',
      email: newClientEmail.trim() || 'hocvien@lubpy.vn',
      school: newClientSchool.trim() || 'ĐH CNTT',
      tier: newClientTier,
      createdAt: new Date().toLocaleDateString('vi-VN')
    };

    setClients(prev => [newCli, ...prev]);
    setShowAddClientModal(false);
    setNewClientNameInput('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientSchool('');
    triggerToast(`Đã thêm thông tin Học viên ${newCli.name}!`);
  };

  // Progress Bar Adjustment Handler
  const handleProgressChange = (projectId: string, newProgress: number) => {
    const clamped = Math.min(100, Math.max(0, newProgress));
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        let newStatus = p.status;
        if (clamped === 100) newStatus = 'Completed';
        else if (clamped >= 80) newStatus = 'Coaching';
        else if (clamped > 0 && p.status === 'Pending') newStatus = 'In Progress';
        return { ...p, progress: clamped, status: newStatus };
      }
      return p;
    }));
  };

  // Export CSV Report Handler
  const handleExportCsv = () => {
    if (projects.length === 0) {
      triggerToast('Chưa có dữ liệu đồ án để xuất báo cáo!');
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Mã Đồ Án,Tên Đề Tài,Khách Hàng,Trường,Công Nghệ,Hạn Bảo Vệ,Trạng Thái,Kỹ Sư,Giá Trị Hợp Đồng (VNĐ),Tiến Độ (%)\n";
    projects.forEach(p => {
      csvContent += `"${p.id}","${p.title.replace(/"/g, '""')}","${p.clientName}","${p.school}","${p.techStack}","${p.defenseDate}","${p.status}","${p.assignedDev}",${p.priceVnd},${p.progress}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LUBPY_BaoCao_DoAn_DoanhThu_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Đã xuất báo cáo danh sách đồ án và doanh thu ra file CSV thành công!');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newClientName.trim()) return;

    const finalThumb = newThumbnail || getCuratedThumbnail(newTitle.trim(), newTechStack.trim());

    const newPrj: LubpyProjectItem = {
      id: `DA-2026-${String(projects.length + 1).padStart(2, '0')}`,
      title: newTitle.trim(),
      clientName: newClientName.trim(),
      school: newSchool.trim() || 'Đại Học CNTT',
      techStack: newTechStack.trim() || 'React + Node.js',
      defenseDate: newDefenseDate || '30/10/2026',
      status: 'Pending',
      assignedDev: 'Chưa phân công',
      priceVnd: parseFloat(newPriceVnd) || 15000000,
      progress: 0,
      thumbnailUrl: finalThumb,
    };

    const updated = [newPrj, ...projects];
    setProjects(updated);
    setShowAddProjectModal(false);
    setNewTitle('');
    setNewClientName('');
    setNewSchool('');
    setNewTechStack('');
    setNewThumbnail('');

    // Persist to database in background
    createProjectInDb({
      id: newPrj.id,
      title: newPrj.title,
      clientName: newPrj.clientName,
      school: newPrj.school,
      techStack: newPrj.techStack,
      defenseDate: newPrj.defenseDate,
      priceVnd: newPrj.priceVnd,
      thumbnailUrl: finalThumb,
      status: 'pending',
    }).catch(err => console.warn('Failed to sync new project to DB:', err));

    triggerToast(`Đã tiếp nhận thành công đồ án mã ${newPrj.id} với ảnh AI Thumbnail!`);
  };

  // Appointment Handler for Department Heads
  const handleAppointHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptForAppoint) return;

    const form = e.currentTarget as HTMLFormElement;
    const deptKey = (form.elements.namedItem('deptKey') as HTMLSelectElement).value || selectedDeptForAppoint;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const emailInput = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const email = emailInput || nameToLubpyEmail(name);
    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
    const specialty = (form.elements.namedItem('specialty') as HTMLInputElement).value.trim();
    const skills = (form.elements.namedItem('skills') as HTMLInputElement).value.trim();
    const dob = (form.elements.namedItem('dob') as HTMLInputElement)?.value.trim() || '';
    const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value.trim() || '';
    const experience = (form.elements.namedItem('experience') as HTMLInputElement)?.value.trim() || '';
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value.trim() || '';

    if (!name || !email) return;

    const isReplacing = !!replacingHeadUid;
    const existingHeadToReplace = isReplacing 
      ? (Object.values(orgData.heads) as User[]).find((h: any) => h?.uid === replacingHeadUid) 
      : null;

    // RÀNG BUỘC ĐIỀU KIỆN: Ứng với mỗi chuyên môn nghiệp vụ thì sẽ có tối đa 2 trưởng phòng cho mỗi chuyên môn nghiệp vụ đó,
    // khi đã tuyển đủ số trưởng phòng ứng với số chuyên môn nghiệp vụ đang có sẽ khóa và không cho nhập thêm trưởng phòng nữa.
    if (!isReplacing) {
      const quotaCheck = canAppointHeadToSpecialty(orgData.heads, deptKey, specialty);
      if (!quotaCheck.allowed) {
        alert(quotaCheck.reason);
        triggerToast(`❌ ${quotaCheck.reason}`);
        return;
      }
    }

    const finalPhotoUrl = appointPhotoUrl.trim() || existingHeadToReplace?.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a`;

    const customPass = password.trim();
    const dobDigits = dob ? dobTo8Digits(dob) : '';
    const defaultDeptPass = deptKey === 'tech' ? 'tech2026' : deptKey === 'cs' ? 'cs2026' : deptKey === 'hr' ? 'hr2026' : deptKey === 'accounting' ? 'acc2026' : '123456';
    // Ưu tiên: Mật khẩu nhập riêng -> 8 số ngày sinh -> Mật khẩu cũ -> Mật khẩu mặc định ngành
    const finalPassword = customPass || dobDigits || existingHeadToReplace?.password || defaultDeptPass;

    const newUid = isReplacing ? replacingHeadUid! : `head_${deptKey}_${Date.now()}`;

    const newHead: User = {
      uid: newUid,
      name,
      email,
      photoUrl: finalPhotoUrl,
      role: (deptKey === 'tech' ? 'tech' : deptKey === 'cs' ? 'cs' : deptKey === 'hr' ? 'hr' : deptKey === 'accounting' ? 'accounting' : 'admin') as any,
      isDepartmentHead: true,
      department: deptKey,
      departmentTitle: title || DEPT_CONFIGS[deptKey]?.roleTitle || 'Trưởng Phòng Nghiệp Vụ',
      competence: specialty,
      skills: skills,
      createdByAdmin: true,
      dob,
      phone,
      experience,
      password: finalPassword,
    };

    const updatedHeads = { ...orgData.heads };

    if (isReplacing) {
      let replaced = false;
      for (const k of Object.keys(updatedHeads)) {
        if (updatedHeads[k]?.uid === replacingHeadUid || (k === deptKey && updatedHeads[k]?.email === existingHeadToReplace?.email)) {
          updatedHeads[k] = newHead;
          replaced = true;
        }
      }
      if (!replaced) {
        updatedHeads[newUid] = newHead;
      }
      if (updatedHeads[deptKey]?.uid === replacingHeadUid) {
        updatedHeads[deptKey] = newHead;
      }
    } else {
      updatedHeads[newUid] = newHead;
      if (!updatedHeads[deptKey]) {
        updatedHeads[deptKey] = newHead;
      }
    }

    setOrgData(prev => ({
      ...prev,
      heads: updatedHeads
    }));

    saveOrganization(updatedHeads, orgData.members);

    // Sync user account and password to lubpy_users and saved_accounts
    try {
      syncHeadAccountToAllStores(newHead, finalPassword);
    } catch (err) {
      console.error('Failed to sync head user to stores:', err);
    }

    if (deptKey === 'tech' && !devs.some(d => d && d.email && d.email.toLowerCase() === email.toLowerCase())) {
      const newDev: LubpyDevItem = {
        id: `dev-${Date.now().toString().slice(-4)}`,
        name,
        email,
        specialty: specialty || 'Fullstack & Lead Engineer',
        skillTags: skills ? skills.split(',').map(s => s.trim()) : ['React', 'Node.js', 'System Design'],
        activeCount: 0,
        status: 'Sẵn sàng',
        rating: 5.0
      };
      setDevs(prev => [newDev, ...prev]);
    }

    const deptName = DEPT_CONFIGS[deptKey]?.label || deptKey;
    if (isReplacing) {
      triggerToast(`🔄 Đã thay đổi Trưởng phòng mới [${name}] cho chuyên môn [${specialty}] thành công! Mật khẩu 8 số ngày sinh (${finalPassword}) đã được cấp.`);
    } else {
      triggerToast(`👑 Đã bổ nhiệm Trưởng phòng [${name}] cho chuyên môn [${specialty}]! Mật khẩu 8 số ngày sinh (${finalPassword}) đã được cấp.`);
    }
    setSelectedDeptForAppoint(null);
    setReplacingHeadUid(null);
    setAppointPresetSpecialty(null);
  };

  const handleRemoveHead = (targetKeyOrUid: string) => {
    const updatedHeads: Record<string, User> = { ...orgData.heads };
    let headToRemove: User | null = null;

    if (updatedHeads[targetKeyOrUid]) {
      headToRemove = updatedHeads[targetKeyOrUid];
      delete updatedHeads[targetKeyOrUid];
    } else {
      for (const [k, val] of Object.entries(updatedHeads)) {
        const h = val as User | undefined;
        if (h && h.uid === targetKeyOrUid) {
          headToRemove = h;
          delete updatedHeads[k];
          break;
        }
      }
    }

    if (headToRemove) {
      for (const [k, val] of Object.entries(updatedHeads)) {
        const h = val as User | undefined;
        if (h && (h.uid === headToRemove.uid || h.email === headToRemove.email)) {
          delete updatedHeads[k];
        }
      }
    }

    setOrgData(prev => ({
      ...prev,
      heads: updatedHeads
    }));

    saveOrganization(updatedHeads, orgData.members);

    if (headToRemove && headToRemove.email) {
      removeSavedAccountFromStorage(headToRemove.email);
      try {
        const savedUsers = localStorage.getItem('lubpy_users');
        if (savedUsers) {
          const usersList: User[] = JSON.parse(savedUsers);
          const removeEmailLower = headToRemove.email.toLowerCase().trim();
          const updatedUsers = usersList.filter(u => u && u.email && (u.email.toLowerCase().trim() !== removeEmailLower || u.role === 'admin'));
          localStorage.setItem('lubpy_users', JSON.stringify(updatedUsers));
        }
      } catch (e) {}
      window.dispatchEvent(new Event('lubpy_saved_accounts_updated'));
      window.dispatchEvent(new Event('lubpy_users_updated'));
    }

    triggerToast(`Đã miễn nhiệm/gỡ Trưởng phòng [${headToRemove?.name || targetKeyOrUid}].`);
  };

  // Handler to update Admin profile information (Avatar, Name, DOB, Password, Phone)
  const handleUpdateAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem('adminName') as HTMLInputElement).value.trim();
    const photoUrl = (form.elements.namedItem('adminPhotoUrl') as HTMLInputElement).value.trim();
    const dob = (form.elements.namedItem('adminDob') as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem('adminPhone') as HTMLInputElement).value.trim();
    const newPassword = (form.elements.namedItem('adminNewPassword') as HTMLInputElement).value.trim();
    const confirmPassword = (form.elements.namedItem('adminConfirmPassword') as HTMLInputElement).value.trim();

    if (!name) {
      alert('Vui lòng nhập đầy đủ họ và tên Admin!');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      alert('Mật khẩu mới và mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
      return;
    }

    const updatedAdmin: User = {
      ...adminUser,
      name,
      photoUrl: photoUrl || adminUser.photoUrl,
      dob: dob || adminUser.dob,
      phone: phone || adminUser.phone,
      password: newPassword ? newPassword : adminUser.password
    };

    setAdminUser(updatedAdmin);
    saveUserSession(updatedAdmin);

    // Synchronize orgData
    setOrgData(prev => ({
      ...prev,
      admin: updatedAdmin
    }));
    saveOrganization(orgData.heads, orgData.members);

    // Synchronize localStorage users list
    try {
      const savedUsers = localStorage.getItem('lubpy_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        const updatedUsers = parsedUsers.map((u: User) => (u.role === 'admin' || u.uid === updatedAdmin.uid) ? updatedAdmin : u);
        localStorage.setItem('lubpy_users', JSON.stringify(updatedUsers));
      }
    } catch (err) {}

    // Synchronize savedAccounts
    try {
      saveAccountToStorage({
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: 'admin',
        isDepartmentHead: true,
        department: updatedAdmin.department,
        departmentTitle: updatedAdmin.departmentTitle,
        photoUrl: updatedAdmin.photoUrl,
        password: updatedAdmin.password,
        adminSecurityKey: 'ADMIN_SUPER_KEY_2026',
        savePasswordPreference: true
      });
    } catch (e) {}

    // Synchronize to backend storage
    try {
      api.auth.syncAccount({
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: 'SUPER_ADMIN',
        password: updatedAdmin.password,
        isDepartmentHead: true,
        department: updatedAdmin.department,
        departmentTitle: updatedAdmin.departmentTitle,
        phone: updatedAdmin.phone,
        dob: updatedAdmin.dob,
        photoUrl: updatedAdmin.photoUrl
      });
    } catch (e) {}

    if (onUpdateUser) {
      onUpdateUser(updatedAdmin);
    }

    triggerToast('🎉 Cập nhật ảnh đại diện, họ tên, ngày sinh, SĐT & mật khẩu Admin thành công!');
    setShowEditAdminModal(false);
  };

  const handleAssignDev = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForDev || !assignDevName) return;

    const updated = projects.map(p => {
      if (p.id === selectedProjectForDev.id) {
        return {
          ...p,
          assignedDev: assignDevName,
          status: p.status === 'Pending' ? ('In Progress' as const) : p.status
        };
      }
      return p;
    });

    setProjects(updated);
    setSelectedProjectForDev(null);
    setAssignDevName('');
    triggerToast(`Đã phân công ${assignDevName} phụ trách đồ án ${selectedProjectForDev.id}!`);
  };

  const handleStatusChange = (id: string, newStatus: LubpyProjectItem['status']) => {
    const updated = projects.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus,
          progress: newStatus === 'Completed' ? 100 : newStatus === 'Coaching' ? 85 : newStatus === 'In Progress' ? 50 : 10
        };
      }
      return p;
    });
    setProjects(updated);
    triggerToast(`Cập nhật trạng thái đồ án ${id} thành ${newStatus}!`);
  };

  // Filter projects by search
  const filteredProjects = projects.filter(p => {
    if (!p) return false;
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (p.id || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.clientName || '').toLowerCase().includes(q) ||
      (p.school || '').toLowerCase().includes(q) ||
      (p.techStack || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    );
  });

  // Calculate dynamic metrics directly from real user data (starts at 0 when empty)
  const totalProjectsCount = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;
  const coachingCount = projects.filter(p => p.status === 'Coaching').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const pendingCount = projects.filter(p => p.status === 'Pending').length;
  const urgentDefenseCount = projects.filter(p => isUrgentDefense(p.defenseDate)).length;
  const totalRevenueVnd = projects.reduce((acc, curr) => acc + curr.priceVnd, 0);

  // Deep metrics for comprehensive oversight
  const uniqueSchools = Array.from(new Set(projects.map(p => p.school).filter(Boolean)));
  const activeClientProjectsCount = projects.filter(p => p.status !== 'Completed').length;

  const totalDevTasks = devs.reduce((acc, d) => acc + (d.activeCount || 0), 0);
  const leadDevsCount = devs.filter(d => (((d as any).role || d.specialty || '').toLowerCase().includes('lead') || ((d as any).role || d.specialty || '').toLowerCase().includes('senior'))).length;
  const availableDevsCount = devs.filter(d => (d.activeCount || 0) <= 1).length;
  const overloadedDevsCount = devs.filter(d => (d.activeCount || 0) >= 3).length;
  const avgDevLoad = devs.length > 0 ? (totalDevTasks / devs.length).toFixed(1) : '0';

  const newLeadsCount = leads.filter(l => (l.status as string) === 'Mới tiếp nhận' || (l.status as string) === 'Chờ liên hệ').length;
  const consultingLeadsCount = leads.filter(l => l.status === 'Đang tư vấn' || l.status === 'Đã báo giá').length;
  const closedLeadsCount = leads.filter(l => l.status === 'Đã chốt hợp đồng').length;
  const leadConversionRate = leads.length > 0 ? Math.round((closedLeadsCount / leads.length) * 100) : 0;
  const totalLeadPipelineBudget = leads.reduce((acc, l) => acc + (l.budgetVnd || 0), 0);

  const srsDocsCount = repoDocs.filter(d => d.type === 'DOC' || d.type === 'REPORT').length;
  const slideDocsCount = repoDocs.filter(d => d.type === 'SLIDE').length;
  const sourceCodeDocsCount = repoDocs.filter(d => d.type === 'SOURCE' || d.type === 'DATA').length;

  const storedCustomerReviews = getStoredCustomerReviews();
  const customerReviewsCount = storedCustomerReviews.length;
  const reviewsAvgScore = customerReviewsCount > 0 
    ? (storedCustomerReviews.reduce((sum, r) => sum + r.ratingOverall, 0) / customerReviewsCount).toFixed(1)
    : '5.0';
  const satisfiedReviewsCount = storedCustomerReviews.filter(r => r.ratingOverall >= 4.0).length;
  const csatRate = customerReviewsCount > 0 
    ? Math.round((satisfiedReviewsCount / customerReviewsCount) * 100) 
    : 100;

  const totalSubStaffCount = orgData.members?.length || 0;
  const appointedHeadsCount = Object.values(orgData.heads || {}).filter(Boolean).length;
  const avgProjectProgress = totalProjectsCount > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || (p.status === 'Completed' ? 100 : p.status === 'Coaching' ? 85 : p.status === 'In Progress' ? 50 : 10)), 0) / totalProjectsCount)
    : 0;

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: LubpyProjectItem['status']) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">Pending</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-extrabold uppercase">In Progress</span>;
      case 'Coaching':
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-extrabold uppercase">Coaching</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">Completed</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-[#f3f4f6] font-sans overflow-x-hidden relative" id="lubpy-admin-workspace">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] bg-indigo-900/20 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Dynamic Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-l-4 border-sky-400 text-white px-5 py-4 rounded-2xl shadow-[0_10px_30px_rgba(56,189,248,0.2)] flex items-center gap-3 animate-bounce border border-white/10">
          <ShieldCheckIcon className="w-5 h-5 text-sky-400 shrink-0" />
          <span className="text-xs font-bold font-sans">{notificationMsg}</span>
        </div>
      )}

      <div className="flex h-full min-h-screen" id="lubpy-admin-inner-layout">
        
        {/* ================= SIDEBAR NAVIGATION (STEP 3.A) ================= */}
        <aside className="w-72 bg-[#121315] border-r border-[#1e2023] flex flex-col justify-between p-6 shrink-0 hidden lg:flex z-10" id="lubpy-admin-sidebar">
          
          <div className="space-y-8">
            {/* Brand Header */}
            <div className="flex items-center gap-3" id="sidebar-logo-group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-900/30 border border-sky-400/30">
                <span className="text-white font-black text-xl">🚀</span>
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>LUBPY ADMIN</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">Admin Workspace</p>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="relative" id="sidebar-search">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-500" />
              </span>
              <input 
                type="text"
                placeholder={isVi ? "Tìm đồ án, sinh viên, dev..." : "Search projects, clients..."}
                className="w-full pl-9 pr-4 py-2.5 bg-[#17191b] border border-[#212427] rounded-xl text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all font-sans"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sidebar Categories Menu (Step 3.A Exact 7 Items with Specific Live Control Data) */}
            <nav className="space-y-1.5" id="sidebar-nav-menu">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 px-2">
                Danh Mục Quản Lý &amp; Kiểm Soát
              </p>

              {/* 1. Overview */}
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'overview' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <BarChart3Icon className="w-4 h-4 text-sky-400" />
                  <span>📊 Tổng quan (Overview)</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded-full font-mono font-bold">
                  {projects.length} ĐA
                </span>
              </button>

              {/* 2. Projects */}
              <button 
                onClick={() => setActiveTab('projects')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'projects' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <FolderKanbanIcon className="w-4 h-4 text-blue-400" />
                  <span>📁 Quản Lý Đồ Án</span>
                </span>
                <span className="flex items-center gap-1">
                  {urgentDefenseCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-500/30 text-red-300 font-bold rounded-full animate-pulse">
                      {urgentDefenseCount}🚨
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 bg-sky-500/30 text-sky-200 font-bold rounded-full">
                    {projects.length}
                  </span>
                </span>
              </button>

              {/* 2.5. Contracts */}
              <button 
                onClick={() => setActiveTab('contracts')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'contracts' 
                    ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white shadow-lg border border-amber-400/40' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-4 h-4 text-amber-400" />
                  <span>📜 Ký Hợp Đồng</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full border border-amber-500/30">
                  {workflowProjects.length} HĐ
                </span>
              </button>

              {/* 3. Clients */}
              <button 
                onClick={() => setActiveTab('clients')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'clients' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <UsersIcon className="w-4 h-4 text-emerald-400" />
                  <span>👥 Quản Lý Khách Hàng</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full">
                  {allClientNames.length} KH
                </span>
              </button>

              {/* 4. Devs Assignment */}
              <button 
                onClick={() => setActiveTab('devs')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'devs' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Code2Icon className="w-4 h-4 text-amber-400" />
                  <span>👨‍💻 Phân Công Kỹ Sư</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full">
                  {devs.length} Dev ({totalDevTasks} task)
                </span>
              </button>

              {/* 5. Leads / Quotation List */}
              <button 
                onClick={() => setActiveTab('leads')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'leads' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <MessageSquareIcon className="w-4 h-4 text-purple-400" />
                  <span>📋 Danh Sách Báo Giá</span>
                </span>
                <span className="flex items-center gap-1">
                  {newLeadsCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/30 text-amber-300 font-bold rounded-full">
                      {newLeadsCount} mới
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold rounded-full">
                    {leads.length}
                  </span>
                </span>
              </button>

              {/* 6. Source Code & Docs */}
              <button 
                onClick={() => setActiveTab('repository')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'repository' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <BookOpenIcon className="w-4 h-4 text-pink-400" />
                  <span>📚 Kho Mã Nguồn &amp; Báo Cáo</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-pink-500/20 text-pink-300 font-bold rounded-full">
                  {repoDocs.length} file
                </span>
              </button>

              {/* 7. Customer Reviews */}
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'reviews' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>⭐ Nhận Xét Từ Khách Hàng</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono font-bold">
                  {customerReviewsCount} reviews • {reviewsAvgScore} ⭐
                </span>
              </button>

              {/* 8. Settings */}
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#17181b]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <SettingsIcon className="w-4 h-4 text-gray-400" />
                  <span>⚙️ Cấu Hình &amp; Nhân Sự</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-gray-300 font-bold rounded-full border border-white/10">
                  4 Khối ({totalSubStaffCount} NV)
                </span>
              </button>
            </nav>
          </div>

          {/* Quick Support Badge */}
          <div className="bg-[#17181b] border border-[#212427] rounded-2xl p-4 space-y-3" id="sidebar-promo">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span>LUBPY STUDIO Admin</span>
                <span>⚡</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-light leading-relaxed">
              Bảng kiểm soát tổng quan điều hành và quản lý cấp cao LUBPY STUDIO.
            </p>
            <div className="w-full py-2 px-3 bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-bold rounded-xl flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hệ Thống Trực Tuyến 24/7</span>
            </div>
          </div>

        </aside>

        {/* ================= MAIN DISPLAY REGION ================= */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 z-10" id="lubpy-admin-main-stage">
          
          {/* Top Bar Navigation */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1c1d21] pb-6 mb-6" id="lubpy-admin-topbar">
            {/* Breadcrumbs */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium" id="lubpy-admin-breadcrumb">
                <span className="hover:text-white cursor-pointer font-bold text-sky-400">LUBPY STUDIO</span>
                <span>&rsaquo;</span>
                <span className="text-gray-200 font-semibold uppercase">{activeTab}</span>
              </div>
              <p className="text-[11px] text-sky-400/80 font-mono hidden sm:block">
                Phiên làm việc Quản trị viên Tối cao (Super Admin Active Session)
              </p>
            </div>

            {/* Quick Header Actions */}
            <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-end">
              
              {/* Back to System Manager */}
              <button
                onClick={onSwitchToSystemManager}
                className="px-4 py-2 bg-[#1b2530] hover:bg-[#203144] text-sky-400 hover:text-sky-300 border border-sky-500/20 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>🔧</span>
                <span>Hệ Thống LUBPY</span>
              </button>

              {/* Bell Icon Dropdown with Project Updates & Backend Messages */}
              <WorkspaceNotificationBell
                user={adminUser}
                language={language}
                onSelectProject={() => {
                  setActiveTab('projects');
                }}
              />

              {/* Notification Mailbox */}
              <button 
                onClick={() => setShowNotificationModal(true)}
                className="w-10 h-10 rounded-xl bg-[#151719] border border-[#212427] hover:border-amber-500/40 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer relative group"
                title="Hộp thư thông báo chỉ đạo nội bộ (Admin & Trưởng phòng)"
              >
                <MailIcon className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                {unreadAdminNotifCount > 0 ? (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full border border-slate-950 shadow animate-pulse">
                    {unreadAdminNotifCount}
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-sky-400 rounded-full border-2 border-[#121315]" />
                )}
              </button>

              {/* User Profile Badge (Clickable to edit Admin info) */}
              <button 
                onClick={() => {
                  setEditingAvatarUrl(adminUser.photoUrl);
                  setShowEditAdminModal(true);
                }}
                className="flex items-center gap-2 pl-2 border-l border-[#212427] hover:opacity-90 cursor-pointer transition-all group"
                title="Bấm để cập nhật thông tin cá nhân Admin"
              >
                <div className="relative">
                  <img src={adminUser.photoUrl} alt={adminUser.name} className="w-10 h-10 rounded-xl border border-sky-400/40 group-hover:border-amber-400 bg-slate-900 object-cover transition-all" />
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1 rounded-full border border-slate-950 shadow">
                    ✏️
                  </span>
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-black text-white leading-tight group-hover:text-amber-300 transition-colors">{adminUser.name}</p>
                  <p className="text-[10px] text-sky-400 font-mono font-bold">SUPER ADMIN</p>
                </div>
              </button>

              {/* Logout Button */}
              <button 
                onClick={onLogout}
                className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2Icon className="w-3.5 h-3.5 text-red-400" />
                <span>Thoát</span>
              </button>
            </div>
          </header>

          {/* GLOBAL EXECUTIVE OVERSIGHT METRIC STRIP (DỮ LIỆU KIỂM SOÁT TỔNG THỂ TOÀN BỘ HỆ THỐNG) */}
          <div className="mb-8 p-3.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-sky-500/20 rounded-2xl shadow-xl flex items-center justify-between overflow-x-auto gap-4 scrollbar-thin">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-black text-sky-400 uppercase tracking-wider">
                Băng Giám Sát Điều Hành:
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <div 
                onClick={() => {
                  setTempCapitalInput(operatingCapitalVnd.toString());
                  setShowCapitalModal(true);
                }}
                className="flex items-center gap-1.5 bg-purple-950/80 hover:bg-purple-900/90 px-3 py-1.5 rounded-xl border border-purple-500/40 cursor-pointer transition-all shadow-md"
                title="Bấm để xem xét & phân bổ vốn điều hành"
              >
                <span className="text-purple-300">💼 Vốn Hiện Có:</span>
                <span className="font-extrabold text-amber-300">{formatVnd(operatingCapitalVnd)}</span>
                <span className="text-[10px] text-purple-400">✏️</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-gray-400">🚀 Đang Lập Trình:</span>
                <span className="font-bold text-sky-300">{inProgressCount}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-gray-400">🚨 Cận Hạn Bảo Vệ:</span>
                <span className={`font-bold ${urgentDefenseCount > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {urgentDefenseCount}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-gray-400">👥 Học Viên:</span>
                <span className="font-bold text-emerald-300">{clients.length || allClientNames.length}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-gray-400">👨‍💻 Kỹ Sư:</span>
                <span className="font-bold text-amber-300">{devs.length} ({avgDevLoad} load)</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-gray-400">💬 Lead Mới:</span>
                <span className="font-bold text-purple-300">{newLeadsCount}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-gray-400">⭐ CSAT:</span>
                <span className="font-bold text-amber-400">{reviewsAvgScore} ({csatRate}%)</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-gray-400">🏢 Nhân Sự 4 Khối:</span>
                <span className="font-bold text-pink-300">{appointedHeadsCount}/4 TB • {totalSubStaffCount} NV</span>
              </div>
            </div>
          </div>

          {/* ================= TAB 1: OVERVIEW (TỔNG QUAN) ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8" id="overview-stage">
              
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-white flex items-center gap-2">
                    <span>LUBPY STUDIO - Bảng Quản Trị Trung Tâm</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-light mt-1">
                    Tổng quan tiến độ đồ án CNTT, hiệu suất phòng ban &amp; số liệu thực tế toàn hệ thống.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setTempCapitalInput(operatingCapitalVnd.toString());
                    setShowCapitalModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg border border-amber-400/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <span>💼</span>
                  <span>Xem Xét &amp; Phân Bổ Vốn Điều Hành</span>
                </button>
              </div>

              {/* SPECIAL SHOWCASE: VỐN HIỆN CÓ & QUỸ DỰ PHÒNG TỔNG THỂ (DOANH SỐ VỐN TO RÕ RÀNG THEO YÊU CẦU) */}
              <section className="bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Bảo Chứng Tài Chính &amp; An Toàn Vốn
                        </span>
                        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sẵn sàng giải ngân 100%
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-300 mt-2">
                        Doanh Số Vốn Tiền Hiện Có (Quỹ Dự Phòng &amp; Điều Hành LUBPY)
                      </h3>
                      {/* DOANH SỐ VỐN HIỂN THỊ CỰC TO THEO YÊU CẦU CỦA ADMIN */}
                      <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mt-2 filter drop-shadow-[0_2px_12px_rgba(251,191,36,0.3)]">
                        {formatVnd(operatingCapitalVnd)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Tổng nguồn vốn khả dụng phục vụ cam kết bảo lãnh tiến độ đồ án, tạm ứng thù lao kỹ sư và mở rộng hệ thống máy chủ.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 self-start md:self-auto">
                      <button 
                        onClick={() => {
                          setTempCapitalInput(operatingCapitalVnd.toString());
                          setShowCapitalModal(true);
                        }}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-amber-400/40 text-amber-300 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <span>⚙️</span>
                        <span>Điều Chỉnh Mức Vốn</span>
                      </button>
                    </div>
                  </div>

                  {/* VỐN PHÂN BỔ 3 NGUỒN QUỸ CỤ THỂ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400">🏦 Vốn Cố Định Dự Phòng (65%)</span>
                        <span className="text-[10px] font-mono text-purple-400">Cố định</span>
                      </div>
                      <div className="text-xl font-black font-mono text-white">
                        {formatVnd(operatingCapitalVnd * 0.65)}
                      </div>
                      <p className="text-[11px] text-gray-500">Quỹ rủi ro &amp; bảo hiểm đồ án</p>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400">💵 Vốn Quỹ Lưu Động (35%)</span>
                        <span className="text-[10px] font-mono text-emerald-400">Lưu động</span>
                      </div>
                      <div className="text-xl font-black font-mono text-emerald-400">
                        {formatVnd(operatingCapitalVnd * 0.35)}
                      </div>
                      <p className="text-[11px] text-gray-500">Thanh toán thù lao &amp; server</p>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400">📈 Doanh Thu Ký Quỹ Đồ Án</span>
                        <span className="text-[10px] font-mono text-sky-400">{totalProjectsCount} Đề tài</span>
                      </div>
                      <div className="text-xl font-black font-mono text-sky-400">
                        {formatVnd(totalRevenueVnd)}
                      </div>
                      <p className="text-[11px] text-gray-500">Tổng giá trị hợp đồng sinh viên</p>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400">🛡️ An Toàn Dòng Tiền (CAR)</span>
                        <span className="text-[10px] font-mono text-amber-400">100% An Toàn</span>
                      </div>
                      <div className="text-xl font-black font-mono text-amber-300">
                        99.4%
                      </div>
                      <p className="text-[11px] text-gray-500">Khả năng thanh khoản hoàn hảo</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* STEP 3.B: TOP OVERVIEW CARDS (4 EXACT CARDS REQUESTED) */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="top-overview-cards">
                
                {/* 1. Tổng Đồ Án */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-sky-500/30 rounded-2xl p-5 shadow-xl hover:border-sky-400 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                      <FolderKanbanIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      +12% tháng này
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng Đồ Án</div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                    {totalProjectsCount} <span className="text-sm font-bold text-gray-400">Đồ án</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-light mt-2">Tổng đề tài đã tiếp nhận hệ thống</p>
                </div>

                {/* 2. Đang Triển Khai */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-blue-500/30 rounded-2xl p-5 shadow-xl hover:border-blue-400 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                      <Code2Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                      Đang Lập Trình
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Đang Triển Khai</div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                    {inProgressCount} <span className="text-xs font-bold text-sky-400">Đã phân công Kỹ sư</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-light mt-2">Đồ án đang thực hiện &amp; cập nhật commit</p>
                </div>

                {/* 3. Chờ Bảo Vệ */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl hover:border-amber-400 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Sắp Đến Hạn
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Chờ Bảo Vệ</div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-300 mt-1">
                    {coachingCount} <span className="text-xs font-bold text-amber-400">Đồ án chuẩn bị bảo vệ</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-light mt-2">Cần ôn tập slide &amp; tập dượt phản biện</p>
                </div>

                {/* 4. Doanh Thu (VNĐ) */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-5 shadow-xl hover:border-emerald-400 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                      <DollarSignIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      VNĐ Thực Thu
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Doanh Thu (VNĐ)</div>
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-emerald-400 mt-1">
                    {formatVnd(totalRevenueVnd)}
                  </div>
                  <p className="text-[11px] text-gray-400 font-light mt-2">Doanh số cọc &amp; nghiệm thu hợp đồng</p>
                </div>

              </section>

              {/* EXECUTIVE SYSTEM VITAL SIGNS (BĂNG CHỈ SỐ VẬN HÀNH ĐA CHIỀU CHO ADMIN) */}
              <section className="p-5 bg-slate-900/80 border border-sky-500/20 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4 text-sky-400" />
                    <span>Chỉ Số Sức Khỏe Vận Hành &amp; Kiểm Soát Chặt Chẽ Toàn Hệ Thống</span>
                  </h4>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                    Real-time Telemetry
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Tiến Độ Trung Bình</span>
                    <div className="text-lg font-mono font-black text-sky-300">{avgProjectProgress}%</div>
                    <p className="text-[10px] text-gray-500 font-sans">Tổng thể các đề tài</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Tỉ Lệ Nghiệm Thu</span>
                    <div className="text-lg font-mono font-black text-emerald-400">
                      {totalProjectsCount > 0 ? Math.round((completedCount / totalProjectsCount) * 100) : 0}%
                    </div>
                    <p className="text-[10px] text-gray-500 font-sans">{completedCount}/{totalProjectsCount} hoàn tất</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Tải Trọng Kỹ Sư</span>
                    <div className="text-lg font-mono font-black text-amber-300">{avgDevLoad} ĐA/Dev</div>
                    <p className="text-[10px] text-gray-500 font-sans">{overloadedDevsCount} kỹ sư quá tải</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Pipeline Tư Vấn</span>
                    <div className="text-lg font-mono font-black text-purple-300">{leadConversionRate}% Chốt</div>
                    <p className="text-[10px] text-gray-500 font-sans">{closedLeadsCount}/{leads.length} hợp đồng</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Chỉ Số CSAT</span>
                    <div className="text-lg font-mono font-black text-amber-400">⭐ {reviewsAvgScore}</div>
                    <p className="text-[10px] text-gray-500 font-sans">{csatRate}% Hài lòng</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Độ Phủ Trường ĐH</span>
                    <div className="text-lg font-mono font-black text-pink-300">{uniqueSchools.length} Trường</div>
                    <p className="text-[10px] text-gray-500 font-sans">{allClientNames.length} Học viên</p>
                  </div>
                </div>
              </section>

              {/* Chart & Revenue Insights */}
              <section className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <BarChart3Icon className="w-5 h-5 text-sky-400" />
                      <span>Thống Kê Doanh Thu &amp; Số Lượng Đồ Án Theo Tháng (VNĐ)</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-light">Tăng trưởng số lượng hợp đồng cọc đồ án LUBPY STUDIO 2026</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-500/20">
                    Đơn vị: VNĐ
                  </div>
                </div>

                {/* Handcrafted Animated Bar Chart (Dynamic based on real user data starting from T7/2026) */}
                <RevenueBarChart projects={projects} />
              </section>

              {/* STEP 3.C: RECENT PROJECTS TABLE (DANH SÁCH DỰ ÁN / ĐỒ ÁN MỚI NHẤT) */}
              <section className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6" id="recent-projects-table-section">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <FolderKanbanIcon className="w-5 h-5 text-sky-400" />
                      <span>Danh Sách Dự Án / Đồ Án Mới Nhất</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-light">Quản lý các hợp đồng đồ án tiếp nhận, trạng thái tiến độ và thời hạn bảo vệ</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="h-3.5 w-3.5 text-gray-500" />
                      </span>
                      <input 
                        type="text"
                        placeholder="Lọc mã đồ án, tên đề tài..."
                        className="w-full pl-9 pr-4 py-2 bg-[#191b1e] border border-[#24262a] rounded-xl text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-sky-500 font-sans"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* EXACT TABLE COLUMNS REQUESTED IN STEP 3.C */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-slate-950/40">
                        <th className="py-3.5 pl-4">Mã Đồ Án</th>
                        <th className="py-3.5">Tên Đề Tài &amp; Kỹ Sư Phụ Trách</th>
                        <th className="py-3.5">Khách Hàng / Trường</th>
                        <th className="py-3.5">Công Nghệ</th>
                        <th className="py-3.5">Hạn Bảo Vệ</th>
                        <th className="py-3.5">Tiến Trình Kỹ Thuật (Tech Team)</th>
                        <th className="py-3.5 pr-4 text-center">Giám Sát Kỹ Thuật</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500 font-mono">
                            Không tìm thấy đồ án phù hợp.
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                            
                            {/* Cột 1: Mã Đồ Án */}
                            <td className="py-4 pl-4 font-mono font-black text-sky-400">
                              <span className="bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                                {p.id}
                              </span>
                            </td>

                            {/* Cột 2: Tên Đề Tài & Kỹ sư kỹ thuật */}
                            <td className="py-4 font-bold text-white max-w-sm pr-3">
                              <div className="flex items-center gap-3">
                                {p.thumbnailUrl ? (
                                  <img 
                                    src={p.thumbnailUrl} 
                                    alt={p.title} 
                                    className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0 bg-slate-950" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                                    DA
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="truncate">{p.title}</div>
                                  <div className="text-[10px] text-gray-400 font-normal font-mono mt-0.5 flex items-center gap-1.5">
                                    <span>👨‍💻 Kỹ sư: <strong className="text-sky-300">{p.assignedDev}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Cột 3: Khách Hàng / Trường */}
                            <td className="py-4">
                              <div className="font-bold text-gray-200">{p.clientName}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{p.school}</div>
                            </td>

                            {/* Cột 4: Công Nghệ */}
                            <td className="py-4 font-mono text-gray-300">
                              <span className="bg-white/5 text-gray-300 px-2 py-0.5 rounded border border-white/10 text-[11px]">
                                {p.techStack}
                              </span>
                            </td>

                            {/* Cột 5: Hạn Bảo Vệ */}
                            <td className="py-4 font-mono text-amber-300 font-bold">
                              {p.defenseDate}
                            </td>

                            {/* Cột 6: Tiến Trình Kỹ Thuật (Tech Team) */}
                            <td className="py-4">
                              <div className="space-y-1 min-w-[130px]">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span className="text-gray-400">Tiến độ:</span>
                                  <span className="text-sky-300 font-bold">{p.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                                  <div 
                                    className={`h-1.5 rounded-full ${p.status === 'Completed' ? 'bg-emerald-400' : 'bg-sky-500'}`} 
                                    style={{ width: `${p.progress}%` }} 
                                  />
                                </div>
                                <div className="pt-0.5">
                                  {getStatusBadge(p.status)}
                                </div>
                              </div>
                            </td>

                            {/* Cột 7: Giám Sát / Xem Tiến Trình Kỹ Thuật */}
                            <td className="py-4 pr-4 text-center">
                              <button 
                                onClick={() => setSelectedProjectForInspection(p)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 mx-auto"
                              >
                                👁️ Xem Tiến Trình
                              </button>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </section>

            </div>
          )}

          {/* ================= TAB 2: PROJECTS (QUẢN LÝ ĐỒ ÁN) ================= */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <FolderKanbanIcon className="w-6 h-6 text-sky-400" />
                    <span>Quản Lý Toàn Bộ Dự Án &amp; Đồ Án CNTT</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Tổng quan theo dõi tiến độ, thời hạn bảo vệ và tình trạng thực hiện đồ án CNTT toàn hệ thống</p>
                </div>
              </div>

              {/* DỮ LIỆU KIỂM SOÁT ĐỒ ÁN CHẶT CHẼ DÀNH CHO ADMIN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Tổng Đồ Án</span>
                  <div className="text-2xl font-black font-mono text-white mt-1">{totalProjectsCount}</div>
                  <div className="text-[11px] text-sky-400 font-mono mt-0.5">{formatVnd(totalRevenueVnd)}</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-blue-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Đang Lập Trình</span>
                  <div className="text-2xl font-black font-mono text-blue-400 mt-1">{inProgressCount}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Tiến độ TB: {avgProjectProgress}%</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Chờ Bảo Vệ / Cận Hạn</span>
                  <div className="text-2xl font-black font-mono text-amber-300 mt-1 flex items-center gap-2">
                    <span>{coachingCount}</span>
                    {urgentDefenseCount > 0 && (
                      <span className="text-xs font-bold text-red-400 px-2 py-0.5 bg-red-500/20 rounded-full animate-pulse border border-red-500/30">
                        {urgentDefenseCount} 🚨
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Đang ôn tập phản biện</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Đã Nghiệm Thu</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{completedCount}</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Đạt 100% bàn giao</div>
                </div>
              </div>

              {/* Bộ lọc xem xét đồ án cho Admin */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2.5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-400 px-2">Xem tiến độ:</span>
                <button
                  onClick={() => setProjectProgressFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    projectProgressFilter === 'all'
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Tất Cả ({projects.length})
                </button>
                <button
                  onClick={() => setProjectProgressFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    projectProgressFilter === 'completed'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                  }`}
                >
                  <span>✅ Đã Nghiệm Thu</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40">{completedCount}</span>
                </button>
                <button
                  onClick={() => setProjectProgressFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    projectProgressFilter === 'in_progress'
                      ? 'bg-blue-500 text-white font-black'
                      : 'text-gray-400 hover:text-blue-300 hover:bg-blue-500/10'
                  }`}
                >
                  <span>⚙️ Đang Thực Hiện</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40">{projects.length - completedCount}</span>
                </button>
                <button
                  onClick={() => setProjectProgressFilter('urgent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    projectProgressFilter === 'urgent'
                      ? 'bg-red-500 text-white font-black'
                      : 'text-gray-400 hover:text-red-300 hover:bg-red-500/10'
                  }`}
                >
                  <span>🚨 Cận Hạn Bảo Vệ</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40">{urgentDefenseCount}</span>
                </button>
              </div>

              {/* Full Projects Grid / Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {projects.filter(p => {
                  if (projectProgressFilter === 'completed') return p.status === 'Completed';
                  if (projectProgressFilter === 'in_progress') return p.status !== 'Completed';
                  if (projectProgressFilter === 'urgent') return isUrgentDefense(p.defenseDate);
                  return true;
                }).length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto text-xl">
                      📁
                    </div>
                    <h4 className="text-base font-bold text-white">Không có đồ án trong mục này</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Admin đang ở chế độ xem xét tiến độ và giám sát đồ án đã nghiệm thu từ Đội ngũ Kỹ thuật.
                    </p>
                  </div>
                ) : (
                  projects.filter(p => {
                    if (projectProgressFilter === 'completed') return p.status === 'Completed';
                    if (projectProgressFilter === 'in_progress') return p.status !== 'Completed';
                    if (projectProgressFilter === 'urgent') return isUrgentDefense(p.defenseDate);
                    return true;
                  }).map(p => {
                    const urgent = isUrgentDefense(p.defenseDate);
                    return (
                      <div key={p.id} className={`bg-slate-900/60 border rounded-2xl p-5 space-y-4 shadow-xl relative transition-all ${
                        urgent ? 'border-red-500/50 shadow-red-950/20' : 'border-white/10'
                      }`}>
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sky-400 text-xs bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                              {p.id}
                            </span>
                            {urgent && (
                              <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                                🚨 Cấp Bách (Còn ≤ 7 ngày)
                              </span>
                            )}
                          </div>
                          {getStatusBadge(p.status)}
                        </div>

                        {p.thumbnailUrl && (
                          <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-white/10 group">
                            <img 
                              src={p.thumbnailUrl} 
                              alt={p.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 border border-white/10 text-[9px] font-mono text-sky-300 backdrop-blur-sm">
                              AI Thumbnail
                            </span>
                          </div>
                        )}

                        <div>
                          <h4 className="text-base font-bold text-white">{p.title}</h4>
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            Khách hàng: <strong className="text-gray-200">{p.clientName}</strong> ({p.school})
                          </p>
                        </div>

                        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                          <div className="flex justify-between text-gray-400">
                            <span>Công nghệ:</span>
                            <span className="font-mono text-sky-300 font-bold">{p.techStack}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Hạn bảo vệ:</span>
                            <span className={`font-mono font-bold ${urgent ? 'text-red-400 font-black' : 'text-amber-300'}`}>{p.defenseDate}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Giá trị hợp đồng:</span>
                            <span className="font-mono text-emerald-400 font-bold">{formatVnd(p.priceVnd)}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Kỹ sư phụ trách:</span>
                            <span className="font-bold text-white">{p.assignedDev}</span>
                          </div>
                        </div>

                        {/* Read-Only Technical Progress & Acceptance Status for Admin Oversight */}
                        <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-400">Tiến độ hoàn thành:</span>
                            <span className="text-sky-400 font-bold text-sm">{p.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${p.status === 'Completed' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-gradient-to-r from-sky-600 to-sky-400'}`} 
                              style={{ width: `${p.progress}%` }} 
                            />
                          </div>
                          <div className="pt-1">
                            {p.status === 'Completed' ? (
                              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                                <span>✅</span>
                                <span>Đã Nghiệm Thu: Đội ngũ Kỹ thuật đã kiểm thử &amp; bàn giao 100%</span>
                              </div>
                            ) : (
                              <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-300 text-xs font-bold flex items-center gap-1.5">
                                <span>⚙️</span>
                                <span>Tiến độ kỹ thuật: Đang thực hiện ({p.progress}%) - Do Đội ngũ Kỹ thuật phụ trách</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 flex gap-2">
                          <button 
                            onClick={() => setSelectedProjectForInspection(p)}
                            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            👁️ Xem Chi Tiết Tiến Độ &amp; Báo Cáo Kỹ Thuật
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 2.5: CONTRACTS (KÝ HỢP ĐỒNG) ================= */}
          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-amber-300 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded">
                      Chữ Ký Số Pháp Lý
                    </span>
                    <span className="text-xs text-gray-400 font-mono font-bold">
                      Quy trình ký hợp đồng số điện tử (Viettel-CA, VNPT-CA, FPT-CA)
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <ShieldCheckIcon className="w-6 h-6 text-amber-400" />
                    <span>Ký Hợp Đồng</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Admin xem xét các hợp đồng cần ký duyệt từ các trưởng nghiệp vụ (CSKH, Tech Lead, Kế toán). Nếu không có gì sai sót, Admin sẽ ký hợp đồng bằng Chữ Ký Số CA phổ biến nhất hiện nay.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-gray-400 block font-bold">Tổng Hồ Sơ Hợp Đồng</span>
                  <span className="text-xl font-black text-amber-300 font-mono">{workflowProjects.length} Hợp đồng</span>
                </div>
              </div>

              {/* Status summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">1. CSKH Thẩm Định</span>
                  <div className="text-xl font-black font-mono text-sky-400 mt-1">
                    {workflowProjects.filter(p => p.contract?.signatures?.some(s => s.role === 'CS_HEAD')).length}/{workflowProjects.length}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Tiếp nhận yêu cầu</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-blue-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">2. Tech Lead Ký Duyệt</span>
                  <div className="text-xl font-black font-mono text-blue-400 mt-1">
                    {workflowProjects.filter(p => p.contract?.signatures?.some(s => s.role === 'TECH_HEAD')).length}/{workflowProjects.length}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Cam kết kỹ thuật &amp; hạn chót</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">3. Kế Toán Trưởng</span>
                  <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                    {workflowProjects.filter(p => p.contract?.signatures?.some(s => s.role === 'ACCOUNTING_HEAD')).length}/{workflowProjects.length}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Thẩm tra chi phí &amp; hóa đơn</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">4. Admin Phê Chuẩn (Chữ Ký Số)</span>
                  <div className="text-xl font-black font-mono text-amber-300 mt-1">
                    {workflowProjects.filter(p => p.contract?.signatures?.some(s => s.role === 'SUPER_ADMIN')).length}/{workflowProjects.length}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Chữ ký số có giá trị pháp lý</div>
                </div>
              </div>

              {/* Projects Contracts List */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Danh Sách Hợp Đồng Cần Ký Duyệt
                  </h3>
                  <span className="text-xs text-amber-400 font-bold">
                    Admin xem xét &amp; ký chữ ký số
                  </span>
                </div>

                {workflowProjects.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    Chưa có dự án nào trong quy trình hợp đồng. Khi CS tiếp nhận yêu cầu từ khách hàng, hồ sơ sẽ hiển thị tại đây.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workflowProjects.map((prj) => {
                      const sigs = prj.contract?.signatures || [];
                      const hasDirectorSigned = sigs.some(s => s.role === 'SUPER_ADMIN');

                      return (
                        <div
                          key={prj.id}
                          className="p-4 rounded-xl bg-slate-950/80 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {prj.id}
                              </span>
                              <h4 className="text-sm font-bold text-white">{prj.projectName}</h4>
                              <span className="text-[10px] text-gray-400 font-mono">({prj.category})</span>
                            </div>

                            <p className="text-xs text-gray-400">
                              Khách hàng: <strong className="text-white">{prj.clientName}</strong> • CS: <strong className="text-sky-300">{prj.assignedCS}</strong> • Dev: <strong className="text-indigo-300">{prj.assignedDev}</strong> • Giá: <strong className="text-emerald-400">{formatVnd(prj.totalAmountVnd)}</strong>
                            </p>

                            {/* 4 Signatures Indicators */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px]">
                              {[
                                { key: 'CS_HEAD', label: 'CSKH' },
                                { key: 'TECH_HEAD', label: 'Tech Lead' },
                                { key: 'ACCOUNTING_HEAD', label: 'Kế Toán' },
                                { key: 'SUPER_ADMIN', label: 'Admin (Chữ Ký Số)' }
                              ].map((roleItem) => {
                                const signed = sigs.some(s => s.role === roleItem.key);
                                return (
                                  <span
                                    key={roleItem.key}
                                    className={`px-2 py-0.5 rounded font-bold ${
                                      signed
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/10'
                                    }`}
                                  >
                                    {signed ? '✓' : '○'} {roleItem.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto">
                            {hasDirectorSigned ? (
                              <span className="text-xs text-emerald-400 font-bold px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-1">
                                <CheckIcon className="w-3.5 h-3.5" /> Đã Ký Số CA Thành Công
                              </span>
                            ) : (
                              <span className="text-xs text-amber-300 font-bold px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5" /> Chờ Admin Ký Số
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedWorkflowContract(prj)}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <ShieldCheckIcon className="w-4 h-4" />
                              <span>{hasDirectorSigned ? 'Xem & In Hợp Đồng' : '✍️ Xem Xét & Ký Hợp Đồng Số'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: CLIENTS (QUẢN LÝ KHÁCH HÀNG) ================= */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <UsersIcon className="w-6 h-6 text-emerald-400" />
                    <span>Quản Lý Khách Hàng LUBPY</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Danh sách khách hàng đăng ký sử dụng dịch vụ, theo dõi hồ sơ cá nhân, nơi làm việc, chức vụ, số đồ án đã đặt, số tiền giao dịch và lịch sử yêu cầu chi tiết
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Sub-tab switcher */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setClientsSubTab('list')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        clientsSubTab === 'list' 
                          ? 'bg-emerald-500 text-slate-950 font-black' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      👥 Danh Sách Khách Hàng ({allClientNames.length})
                    </button>
                    <button
                      onClick={() => setClientsSubTab('reviews')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        clientsSubTab === 'reviews' 
                          ? 'bg-amber-500 text-slate-950 font-black' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <StarIcon className="w-3.5 h-3.5 fill-current" />
                      <span>⭐ Nhận Xét Từ Khách Hàng ({customerReviewsCount})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* DỮ LIỆU KIỂM SOÁT KHÁCH HÀNG DÀNH CHO ADMIN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Tổng Khách Hàng</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{allClientNames.length}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{uniqueSchools.length} trường ĐH &amp; cơ quan</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Đang Có Đồ Án Chạy</span>
                  <div className="text-2xl font-black font-mono text-sky-400 mt-1">{activeClientProjectsCount}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Khách hàng đang thực hiện</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Độ Hài Lòng &amp; CSAT</span>
                  <div className="text-2xl font-black font-mono text-amber-300 mt-1">⭐ {reviewsAvgScore}</div>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5">{csatRate}% Hài lòng tuyệt đối</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-purple-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Tổng Giao Dịch Đồ Án</span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-purple-300 mt-1">{formatVnd(totalRevenueVnd)}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Giá trị giao dịch tích lũy</div>
                </div>
              </div>

              {clientsSubTab === 'reviews' ? (
                <AdminCustomerReviewsTab onTriggerToast={triggerToast} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {allClientNames.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                        👥
                      </div>
                      <h4 className="text-base font-bold text-white">Chưa có thông tin khách hàng</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto">
                        Danh sách khách hàng đăng ký sử dụng được quản lý và ghi nhận tự động qua các hợp đồng và tài khoản người dùng.
                      </p>
                    </div>
                  ) : (
                    allClientNames.map((name, idx) => {
                      const nameLower = (name || '').toLowerCase();
                      const clientObj = clients.find(c => (c.name || '').toLowerCase() === nameLower);
                      const clientProjects = projects.filter(p => (p.clientName || '').toLowerCase() === nameLower);
                      const totalSpent = clientProjects.reduce((sum, curr) => sum + curr.priceVnd, 0);
                      const phone = clientObj?.phone || '0901234567';
                      const school = clientObj?.school || clientProjects[0]?.school || 'Đại Học CNTT';
                      const workplace = clientObj?.workplace || school;
                      const position = clientObj?.position || 'Khách hàng / Học viên CNTT';
                      const tier = clientObj?.tier || (clientProjects.length > 1 ? 'Thân thiết' : 'Mới');
                      const noteText = clientObj?.notes || clientNotes[name] || clientNotes[phone] || '';

                      return (
                        <div key={idx} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl hover:border-emerald-500/40 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a`} alt={name} className="w-12 h-12 rounded-full border border-emerald-400/30 bg-slate-950" />
                              <div>
                                <h4 className="text-base font-bold text-white">{name}</h4>
                                <p className="text-xs text-emerald-400 font-mono">{workplace}</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {tier}
                            </span>
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-xs space-y-1.5">
                            <div className="flex justify-between text-gray-400">
                              <span>Chức vụ:</span>
                              <span className="font-semibold text-gray-200">{position}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>SĐT liên hệ:</span>
                              <span className="font-mono text-white font-bold">{phone}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>Số đồ án đã đặt:</span>
                              <span className="font-mono text-sky-300 font-bold">{clientProjects.length} Đồ án</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>Tổng tiền giao dịch:</span>
                              <span className="font-mono text-emerald-400 font-bold">{formatVnd(totalSpent)}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => setSelectedClientForModal({
                              id: clientObj?.id || `CL-${idx}`,
                              name,
                              phone,
                              email: clientObj?.email || 'khachhang@lubpy.vn',
                              school,
                              workplace,
                              position,
                              tier,
                              createdAt: clientObj?.createdAt || '23/07/2026',
                              notes: noteText
                            })}
                            className="w-full py-2 bg-gradient-to-r from-slate-800 to-slate-850 hover:from-emerald-900/40 hover:to-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            👤 Xem Chi Tiết Profile &amp; Lịch Sử
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: DEVS (PHÂN CÔNG KỸ SƯ) ================= */}
          {activeTab === 'devs' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Code2Icon className="w-6 h-6 text-amber-400" />
                    <span>Đội Ngũ Kỹ Sư &amp; Giám Sát Tiến Độ Kỹ Thuật</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Tổng quan danh sách Kỹ sư trực thuộc Đội ngũ Kỹ thuật (do Trưởng Nghiệp vụ Kỹ thuật phân công và quản lý trực tiếp)</p>
                </div>
              </div>

              {/* DỮ LIỆU KIỂM SOÁT KỸ SƯ CHẶT CHẼ DÀNH CHO ADMIN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Tổng Kỹ Sư LUBPY</span>
                  <div className="text-2xl font-black font-mono text-amber-400 mt-1">{devs.length} Dev</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{leadDevsCount} Tech Lead/Senior</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Kỹ Sư Sẵn Sàng Tiếp Nhận</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{availableDevsCount}</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Tải trọng ≤ 1 đồ án</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-red-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Kỹ Sư Quá Tải (&ge; 3 ĐA)</span>
                  <div className="text-2xl font-black font-mono text-red-400 mt-1 flex items-center gap-2">
                    <span>{overloadedDevsCount}</span>
                    {overloadedDevsCount > 0 && <span className="text-xs font-bold text-red-300 animate-pulse">Cần điều phối</span>}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Tải trọng TB: {avgDevLoad} ĐA/Dev</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Đánh Giá Kỹ Thuật TB</span>
                  <div className="text-2xl font-black font-mono text-sky-400 mt-1">⭐ 4.9 / 5.0</div>
                  <div className="text-[11px] text-sky-300 font-mono mt-0.5">{totalDevTasks} Tasks đang chạy</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {devs.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl">
                      👨‍💻
                    </div>
                    <h4 className="text-base font-bold text-white">Chưa có kỹ sư trong hệ thống</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Đội ngũ Kỹ sư trực thuộc phòng Kỹ thuật do Trưởng Nghiệp vụ Kỹ thuật quản lý và phân công chuyên môn.
                    </p>
                  </div>
                ) : (
                  devs.map(d => {
                    const devNameLower = (d.name || '').toLowerCase();
                    const assignedPrjs = projects.filter(p => (p.assignedDev || '').toLowerCase().includes(devNameLower));
                    const isOverloaded = d.activeCount > 3 || assignedPrjs.length > 3;
                    const estimatedDevEarnings = assignedPrjs.reduce((acc, curr) => acc + (curr.priceVnd * 0.70), 0);

                    return (
                      <div key={d.id} className={`bg-slate-900/60 border rounded-2xl p-5 space-y-4 shadow-xl relative transition-all ${
                        isOverloaded ? 'border-red-500/50 shadow-red-950/20' : 'border-white/10'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(d.name)}&backgroundColor=0f172a`} alt={d.name} className="w-12 h-12 rounded-full border border-amber-400/40 bg-slate-950" />
                            <div>
                              <h4 className="text-base font-black text-white flex items-center gap-2">
                                <span>{d.name}</span>
                                {isOverloaded && (
                                  <span className="text-[10px] font-black text-red-300 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/40 animate-pulse">
                                    ⚠️ Đang Quá Tải (&gt; 3 Đồ Án)
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-gray-400 font-mono">{d.email}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isOverloaded 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                              : d.status === 'Sẵn sàng' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isOverloaded ? 'Đang Quá Tải' : d.status}
                          </span>
                        </div>

                        {/* Skill Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {(d.skillTags && d.skillTags.length > 0 ? d.skillTags : ['React', 'NodeJS', 'Python']).map((tag, tIdx) => (
                            <span key={tIdx} className="text-[10px] font-mono bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Chuyên môn chính:</span>
                            <span className="font-bold text-sky-300">{d.specialty}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Khối lượng đồ án đang phụ trách:</span>
                            <span className={`font-bold font-mono ${isOverloaded ? 'text-red-400' : 'text-amber-400'}`}>
                              {Math.max(d.activeCount, assignedPrjs.length)} Đồ án
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ước tính thù lao kỹ sư (70%):</span>
                            <span className="font-bold text-emerald-400 font-mono">{formatVnd(estimatedDevEarnings)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Đánh giá chất lượng:</span>
                            <span className="font-bold text-amber-300 font-mono">⭐ {d.rating} / 5.0</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 5: LEADS (DANH SÁCH BÁO GIÁ) ================= */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <MessageSquareIcon className="w-6 h-6 text-purple-400" />
                    <span>Danh Sách Báo Giá</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Admin xem xét tình hình báo giá của các khách hàng; việc liên hệ gọi tư vấn do nghiệp vụ Chăm Sóc Khách Hàng (CSKH) đảm nhiệm trực tiếp
                  </p>
                </div>
              </div>

              {/* DỮ LIỆU KIỂM SOÁT LEADS / BÁO GIÁ CHẶT CHẼ DÀNH CHO ADMIN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-purple-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Tổng Danh Sách Báo Giá</span>
                  <div className="text-2xl font-black font-mono text-purple-300 mt-1">{leads.length} Yêu cầu</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Pipeline: {formatVnd(totalLeadPipelineBudget)}</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Mới Tiếp Nhận</span>
                  <div className="text-2xl font-black font-mono text-amber-300 mt-1">{newLeadsCount}</div>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5">CSKH đang tiếp nhận</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Đang Tư Vấn &amp; Báo Giá</span>
                  <div className="text-2xl font-black font-mono text-sky-400 mt-1">{consultingLeadsCount}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Đã gửi giải pháp sơ bộ</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Tỉ Lệ Chốt Hợp Đồng</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{leadConversionRate}%</div>
                  <div className="text-[11px] text-emerald-300 font-mono mt-0.5">{closedLeadsCount} Hợp đồng thành công</div>
                </div>
              </div>

              {/* Filters for Lead Status & Source */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  <FilterIcon className="w-3.5 h-3.5 text-purple-400" /> Lọc trạng thái báo giá:
                </span>
                <select 
                  value={leadStatusFilter}
                  onChange={(e) => setLeadStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-white/10 text-xs text-gray-300 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <option value="Tất cả">Tất cả trạng thái</option>
                  <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                  <option value="Đang tư vấn">Đang tư vấn</option>
                  <option value="Đã báo giá">Đã báo giá</option>
                  <option value="Đã chốt hợp đồng">Đã chốt hợp đồng</option>
                  <option value="Hủy/Không phù hợp">Hủy/Không phù hợp</option>
                </select>

                <span className="text-xs font-bold text-gray-400 ml-2">Nguồn:</span>
                <select 
                  value={leadSourceFilter}
                  onChange={(e) => setLeadSourceFilter(e.target.value)}
                  className="bg-slate-950 border border-white/10 text-xs text-gray-300 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <option value="Tất cả">Tất cả nguồn</option>
                  <option value="Landing Page">Landing Page</option>
                  <option value="Zalo">Zalo</option>
                  <option value="Facebook Fanpage">Facebook Fanpage</option>
                  <option value="Học viên giới thiệu">Khách hàng giới thiệu</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto text-xl">
                      💬
                    </div>
                    <h4 className="text-base font-bold text-white">Chưa có báo giá nào</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Danh sách báo giá hiện đang trống. Yêu cầu mới từ khách hàng sẽ tự động ghi nhận tại đây để Admin xem xét.
                    </p>
                  </div>
                ) : (
                  filteredLeads.map(l => (
                    <div key={l.id} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl hover:border-purple-500/40 transition-all">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{l.id}</span>
                          <span className="text-xs text-gray-400">{l.createdAt}</span>
                          <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                            📍 {l.source || 'Landing Page'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            l.status === 'Đã chốt hợp đồng' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {l.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">{l.topic}</h4>
                        <p className="text-xs text-gray-300">
                          Khách hàng: <strong className="text-white">{l.clientName}</strong> | SĐT: <strong className="font-mono text-sky-300">{l.phone}</strong> ({l.school})
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-2 w-full md:w-auto">
                        <div className="text-sm font-mono font-bold text-emerald-400">
                          Ngân sách: {formatVnd(l.budgetVnd)}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[10px] text-gray-400 font-mono">
                            🎧 Nghiệp vụ CSKH phụ trách tư vấn
                          </span>
                          <button 
                            onClick={() => setSelectedLeadForReview(l)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                          >
                            👁️ Xem Xét Tình Hình Báo Giá
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 6: REPOSITORY (KHO MÃ NGUỒN & BÁO CÁO PHÂN CHIA RIÊNG BIỆT) ================= */}
          {activeTab === 'repository' && (
            <div className="space-y-6">
              <AdminRepoProjectsCatalog onNotify={triggerToast} />
            </div>
          )}

          {/* ================= TAB 7: SETTINGS (CẤU HÌNH & NHÂN SỰ) ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <SettingsIcon className="w-6 h-6 text-pink-400" />
                  <span>Cấu Hình &amp; Quản Trị Phân Cấp LUBPY STUDIO</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Hồ sơ Quản trị viên tối cao (Super Admin), xem và bổ nhiệm Trưởng Nghiệp vụ các phòng ban &amp; giám sát toàn bộ nhân sự cấp dưới
                </p>
              </div>

              {/* DỮ LIỆU KIỂM SOÁT CƠ CẤU TỔ CHỨC DÀNH CHO ADMIN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-pink-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Cơ Cấu Phòng Ban</span>
                  <div className="text-2xl font-black font-mono text-pink-300 mt-1">4 Khối Ban</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Kỹ Thuật, CSKH, HR, Kế Toán</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Trưởng Ban Đã Bổ Nhiệm</span>
                  <div className="text-2xl font-black font-mono text-sky-400 mt-1">{appointedHeadsCount} / 4</div>
                  <div className="text-[11px] text-sky-300 font-mono mt-0.5">Trưởng Nghiệp Vụ Chuyên Trách</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Tổng Nhân Sự Cấp Dưới</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{totalSubStaffCount} Nhân sự</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Trực thuộc 4 phòng ban</div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Cấp Bậc Quản Trị</span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1">Super Admin</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Quyền hạn tối cao</div>
                </div>
              </div>

              {/* PHẦN 1: XEM & CẬP NHẬT THÔNG TIN CÁ NHÂN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 font-mono text-xs font-black border border-pink-500/30">
                    PHẦN 1
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Xem &amp; Cập Nhật Thông Tin Cá Nhân (Hồ Sơ Super Admin)
                  </h3>
                </div>

                <div className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={() => {
                          setEditingAvatarUrl(adminUser.photoUrl);
                          setShowEditAdminModal(true);
                        }}
                        className="relative group cursor-pointer shrink-0" 
                        title="Bấm để cập nhật ảnh đại diện Admin"
                      >
                        <img src={adminUser.photoUrl} alt={adminUser.name} className="w-16 h-16 rounded-2xl border-2 border-pink-500/50 bg-slate-950 object-cover shadow-lg group-hover:border-amber-400 transition-all" />
                        <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-amber-300 text-xs font-bold transition-opacity">
                          ✏️ Sửa
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span>👑 Cấp 1 • Quản Trị Viên Tối Cao (Super Admin)</span>
                        </div>
                        <h3 className="text-xl font-black text-white mt-0.5">{adminUser.name}</h3>
                        <div className="text-xs text-gray-400 font-mono">{adminUser.email}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => {
                          setEditingAvatarUrl(adminUser.photoUrl);
                          setShowEditAdminModal(true);
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-pink-400/30 active:scale-95"
                      >
                        <span>✏️</span>
                        <span>Cập Nhật Hồ Sơ Admin</span>
                      </button>
                      <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold">
                        Super Administrator Active
                      </span>
                    </div>
                  </div>

                  {/* Administrative Profile Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Họ &amp; Tên Hợp Pháp:</span>
                      <p className="text-xs font-black text-white mt-0.5">{adminUser.name}</p>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Quản Trị:</span>
                      <p className="text-xs font-mono font-bold text-sky-400 mt-0.5 truncate">{adminUser.email}</p>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ngày Tháng Năm Sinh:</span>
                      <p className="text-xs font-bold text-amber-300 mt-0.5">{adminUser.dob || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Số Điện Thoại Liên Hệ:</span>
                      <p className="text-xs font-bold text-emerald-300 mt-0.5">{adminUser.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: XEM & BỔ NHIỆM TRƯỞNG NGHIỆP VỤ */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-black border border-amber-500/30">
                    PHẦN 2
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Xem &amp; Bổ Nhiệm Trưởng Nghiệp Vụ (Giám Sát Cán Bộ Cấp Dưới)
                  </h3>
                </div>

                {/* LEVEL 2 DEPARTMENT HEADS & LEVEL 3 SUB-STAFF REAL-TIME MATRIX */}
                <AdminSubStaffMatrix 
                  orgData={orgData}
                  projects={projects}
                  onAppointHead={(deptKey, specialtyPreset, replacingUid) => {
                    setSelectedDeptForAppoint(deptKey as any);
                    setAppointPresetSpecialty(specialtyPreset || null);
                    setReplacingHeadUid(replacingUid || null);
                  }}
                  onUpdateHead={(deptKey, updatedHead) => {
                    const updatedHeads = {
                      ...orgData.heads,
                      [updatedHead.uid || deptKey]: updatedHead
                    };
                    if (orgData.heads[deptKey]?.uid === updatedHead.uid || !orgData.heads[deptKey]) {
                      updatedHeads[deptKey] = updatedHead;
                    }
                    setOrgData(prev => ({
                      ...prev,
                      heads: updatedHeads
                    }));
                    saveOrganization(updatedHeads, orgData.members);
                    triggerToast(`✅ Đã cập nhật thông tin Trưởng phòng [${updatedHead.name}] thành công!`);
                  }}
                  onAssignDev={() => {
                    setActiveTab('projects');
                  }}
                />
              </div>

              {/* CLEAR ALL EMPLOYEES & DEPARTMENT HEADS UTILITY */}
              <div className="p-5 bg-red-950/20 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-bold text-red-300">Xóa Toàn Bộ Mọi Nhân Viên &amp; Trưởng Nghiệp Vụ</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Xóa sạch toàn bộ mọi tài khoản nhân viên, kỹ sư (Cấp 3) và tất cả Trưởng phòng nghiệp vụ (Cấp 2) khỏi hệ thống.</p>
                </div>
                <button 
                  onClick={() => {
                    setResetConfirmText('');
                    setShowResetConfirmModal(true);
                  }}
                  className="px-4 py-2.5 bg-red-900/70 hover:bg-red-800 text-red-200 border border-red-500/40 rounded-xl text-xs font-extrabold cursor-pointer shrink-0 shadow-lg flex items-center gap-2 transition-all hover:border-red-400 active:scale-95"
                >
                  <Trash2Icon className="w-4 h-4 text-red-400" />
                  <span>Xóa Toàn Bộ Nhân Sự</span>
                </button>
              </div>

            </div>
          )}

          {/* ================= TAB: CUSTOMER REVIEWS & CSAT ================= */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <AdminCustomerReviewsTab onTriggerToast={triggerToast} />
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: ADD NEW PROJECT */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowAddProjectModal(false)}
              className="absolute top-5 right-5 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <PlusIcon className="text-sky-400 w-5 h-5" />
              <span>Tiếp Nhận Đồ Án Mới LUBPY STUDIO</span>
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Tên Đề Tài Đồ Án:</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sky-500"
                  placeholder="Ví dụ: Smart E-Commerce với AI Recommendation System"
                  value={newTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewTitle(val);
                    if (val.trim() && !newThumbnail) {
                      setNewThumbnail(getCuratedThumbnail(val, newTechStack));
                    }
                  }}
                />
              </div>

              {/* AI Thumbnail Generation Preview */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                    <SparklesIcon className="w-4 h-4 text-sky-400" />
                    <span>Ảnh Thumbnail Đồ Án (AI Generated)</span>
                  </div>
                  <button
                    type="button"
                    disabled={isGeneratingThumb || !newTitle.trim()}
                    onClick={() => handleGenerateThumbnail(newTitle, newTechStack)}
                    className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isGeneratingThumb ? (
                      <>
                        <RefreshCwIcon className="w-3 h-3 animate-spin text-sky-400" />
                        <span>Đang tạo AI...</span>
                      </>
                    ) : (
                      <>
                        <Wand2Icon className="w-3 h-3 text-sky-400" />
                        <span>Tạo Thumbnail AI</span>
                      </>
                    )}
                  </button>
                </div>

                {newThumbnail ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-sky-500/30 bg-slate-900 group">
                    <img
                      src={newThumbnail}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono text-sky-300 bg-slate-900/80 px-2 py-0.5 rounded border border-white/10">
                      Tự động gán cho đề tài khi lưu
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-16 rounded-xl border border-dashed border-white/10 bg-slate-900/40 flex items-center justify-center text-center p-3 text-gray-400 text-xs gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Thumbnail sẽ được tự động tạo dựa theo tên đề tài khi lưu</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Tên Khách Hàng / Học Viên:</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sky-500"
                    placeholder="Ví dụ: Nguyễn Văn Hải"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Trường Học / Đơn Vị:</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sky-500"
                    placeholder="Ví dụ: ĐH Công Nghệ - UET"
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Công Nghệ Sử Dụng:</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="Next.js + Python"
                    value={newTechStack}
                    onChange={(e) => setNewTechStack(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Hạn Bảo Vệ Dự Kiến:</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="25/08/2026"
                    value={newDefenseDate}
                    onChange={(e) => setNewDefenseDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Giá Trị Hợp Đồng (VNĐ):</label>
                <input 
                  type="number"
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                  value={newPriceVnd}
                  onChange={(e) => setNewPriceVnd(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-gray-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  Tạo Đồ Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN DEV WITH 1-CLICK MATCHING */}
      {selectedProjectForDev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setSelectedProjectForDev(null)}
              className="absolute top-5 right-5 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Code2Icon className="text-sky-400 w-5 h-5" />
              <span>Phân Công Kỹ Sư Phụ Trách</span>
            </h3>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5 text-xs space-y-1">
              <div className="font-bold text-white text-sm">{selectedProjectForDev.title}</div>
              <div className="text-gray-400 font-mono">Mã: {selectedProjectForDev.id} | Sinh viên: {selectedProjectForDev.clientName} | Công nghệ: <span className="text-sky-300 font-bold">{selectedProjectForDev.techStack}</span></div>
            </div>

            {/* 1-CLICK RECOMMENDED DEVS LIST */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase">⚡ Gợi Ý Kỹ Sư Phù Hợp (1-Click Phân Công):</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {devs.map(d => {
                  const isAvailable = d.activeCount < 3 && d.status === 'Sẵn sàng';
                  return (
                    <div 
                      key={d.id}
                      className="p-3 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-between hover:border-sky-500/50 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{d.name}</span>
                          <span className="text-[10px] text-sky-300 font-mono">({d.specialty})</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Đang phụ trách: {d.activeCount} đồ án | Rating: ⭐ {d.rating}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleOneClickAssignDev(d.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                          isAvailable 
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md' 
                            : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                        }`}
                      >
                        ⚡ Gán Ngay
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleAssignDev} className="space-y-4 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Hoặc Chọn Thủ Công Từ Danh Sách:</label>
                <select 
                  required
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sky-500 font-bold"
                  value={assignDevName}
                  onChange={(e) => setAssignDevName(e.target.value)}
                >
                  <option value="">-- Chọn Lead Dev --</option>
                  {devs.map(d => (
                    <option key={d.id} value={`${d.name} (${d.specialty})`}>
                      {d.name} - {d.specialty} (Đang gánh {d.activeCount} đồ án)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedProjectForDev(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-gray-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  Xác Nhận Phân Công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONVERT LEAD TO PROJECT */}
      {selectedLeadForConversion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setSelectedLeadForConversion(null)}
              className="absolute top-5 right-5 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <SparklesIcon className="text-emerald-400 w-5 h-5" />
              <span>Chuyển Yêu Cầu [{selectedLeadForConversion.id}] Thành Đồ Án Chính Thức</span>
            </h3>

            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 space-y-1">
              <p className="font-bold">✨ Tự Động Đồng Bộ Dữ Liệu:</p>
              <p className="text-gray-300">Khách hàng <strong className="text-white">{selectedLeadForConversion.clientName}</strong> sẽ tự động được thêm vào danh sách Khách Hàng, và Lead này sẽ chuyển trạng thái thành <strong className="text-emerald-400">"Đã chốt hợp đồng"</strong>.</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const tech = (form.elements.namedItem('techStack') as HTMLInputElement).value || 'React / Node.js';
              const date = (form.elements.namedItem('defenseDate') as HTMLInputElement).value || '25/08/2026';
              const price = Number((form.elements.namedItem('priceVnd') as HTMLInputElement).value) || selectedLeadForConversion.budgetVnd;
              handleConvertLeadToProject(selectedLeadForConversion, tech, date, price);
              setSelectedLeadForConversion(null);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Tên Đề Tài Đồ Án:</label>
                <input 
                  type="text"
                  disabled
                  value={selectedLeadForConversion.topic}
                  className="w-full bg-slate-950/60 border border-white/10 text-xs text-gray-300 px-3.5 py-2.5 rounded-xl cursor-not-allowed font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Sinh Viên / Học Viên:</label>
                  <input 
                    type="text"
                    disabled
                    value={`${selectedLeadForConversion.clientName} (${selectedLeadForConversion.phone})`}
                    className="w-full bg-slate-950/60 border border-white/10 text-xs text-gray-300 px-3.5 py-2.5 rounded-xl cursor-not-allowed font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Trường Học / Đơn Vị:</label>
                  <input 
                    type="text"
                    disabled
                    value={selectedLeadForConversion.school}
                    className="w-full bg-slate-950/60 border border-white/10 text-xs text-gray-300 px-3.5 py-2.5 rounded-xl cursor-not-allowed font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Công Nghệ Thực Hiện:</label>
                  <input 
                    name="techStack"
                    type="text"
                    defaultValue="ReactJS + NodeJS"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Hạn Bảo Vệ Dự Kiến:</label>
                  <input 
                    name="defenseDate"
                    type="text"
                    defaultValue="25/08/2026"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Giá Trị Hợp Đồng Chốt (VNĐ):</label>
                <input 
                  name="priceVnd"
                  type="number"
                  defaultValue={selectedLeadForConversion.budgetVnd}
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedLeadForConversion(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-gray-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  🚀 Tạo Đồ Án Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW LEAD */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowAddLeadModal(false)}
              className="absolute top-5 right-5 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <MessageSquareIcon className="text-purple-400 w-5 h-5" />
              <span>Thêm Yêu Cầu Báo Giá &amp; Tư Vấn Mới</span>
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Tên Đề Tài Cần Tư Vấn:</label>
                <input 
                  name="topic"
                  type="text"
                  required
                  placeholder="Ví dụ: Xây dựng Hệ thống Quản lý Bãi xe Thông minh với IoT"
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Tên Khách Hàng / Sinh Viên:</label>
                  <input 
                    name="clientName"
                    type="text"
                    required
                    placeholder="Nguyễn Thị Mai"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Số Điện Thoại / Zalo:</label>
                  <input 
                    name="phone"
                    type="text"
                    required
                    placeholder="0987654321"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Trường Học / Viện:</label>
                  <input 
                    name="school"
                    type="text"
                    defaultValue="ĐH Bách Khoa"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Nguồn Yêu Cầu:</label>
                  <select 
                    name="source"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-purple-500"
                  >
                    <option value="Landing Page">Landing Page</option>
                    <option value="Zalo">Zalo</option>
                    <option value="Facebook Fanpage">Facebook Fanpage</option>
                    <option value="Học viên giới thiệu">Học viên giới thiệu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Ngân Sách Dự Kiến (VNĐ):</label>
                <input 
                  name="budgetVnd"
                  type="number"
                  defaultValue="12000000"
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-gray-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  Lưu Yêu Cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD NEW DEV */}
      {showAddDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowAddDevModal(false)}
              className="absolute top-5 right-5 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Code2Icon className="text-amber-400 w-5 h-5" />
              <span>Thêm Kỹ Sư Lập Trình Mới</span>
            </h3>

            <form onSubmit={handleCreateDev} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Họ &amp; Tên Kỹ Sư:</label>
                  <input 
                    name="name"
                    type="text"
                    required
                    value={newDevName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewDevName(val);
                      setNewDevEmail(normalizeNameToEmail(val));
                    }}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-amber-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-300 uppercase">Email Liên Hệ:</label>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">⚡ @lubpystudio.vn</span>
                  </div>
                  <input 
                    name="email"
                    type="email"
                    required
                    value={newDevEmail}
                    onChange={(e) => setNewDevEmail(e.target.value)}
                    placeholder="nguyenvana@lubpystudio.vn"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-amber-500"
                  />
                  {newDevName.trim() && (
                    <p className="text-[10px] text-emerald-400 font-mono mt-1 truncate">
                      ✓ Email chuẩn hóa: <span className="text-white font-bold">{newDevEmail || normalizeNameToEmail(newDevName)}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Chuyên Môn / Thế Mạnh:</label>
                <input 
                  name="specialty"
                  type="text"
                  required
                  placeholder="Fullstack Web & AI Expert"
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Skill Tags (cách nhau bởi dấu phẩy):</label>
                <input 
                  name="skillTags"
                  type="text"
                  defaultValue="React, Node.js, Python, PostgreSQL"
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddDevModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-gray-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  Thêm Kỹ Sư
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD NEW CLIENT */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowAddClientModal(false)}
              className="absolute top-5 right-5 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <UsersIcon className="text-indigo-400 w-5 h-5" />
              <span>Thêm Khách Hàng / Sinh Viên Mới</span>
            </h3>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Họ &amp; Tên Khách Hàng:</label>
                  <input 
                    name="name"
                    type="text"
                    required
                    placeholder="Phạm Quốc Bảo"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Số Điện Thoại / Zalo:</label>
                  <input 
                    name="phone"
                    type="text"
                    required
                    placeholder="0912345678"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Email:</label>
                  <input 
                    name="email"
                    type="email"
                    placeholder="bao.pq@gmail.com"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Trường Học / Đơn Vị:</label>
                  <input 
                    name="school"
                    type="text"
                    defaultValue="ĐH Sư Phạm Kỹ Thuật"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-gray-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  Lưu Khách Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: CLIENT PROFILE & FULL HISTORY */}
      {selectedClientForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedClientForModal(null)}
              className="absolute top-5 right-5 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xl">
                👤
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{selectedClientForModal.name}</h3>
                <p className="text-xs text-gray-400 font-mono">SĐT: {selectedClientForModal.phone} | Trường: {selectedClientForModal.school}</p>
              </div>
            </div>

            {/* CLIENT SUMMARY CARDS */}
            <ClientDetailModalContent 
              selectedClientForModal={selectedClientForModal}
              projects={projects}
              clientNotes={clientNotes}
              setClientNotes={setClientNotes}
            />

            <div className="pt-2 flex justify-end">
              <button 
                type="button"
                onClick={() => setSelectedClientForModal(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: CONFIRM DELETE ALL EMPLOYEES AND DEPARTMENT HEADS */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <button 
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute top-5 right-5 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-xl font-black shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Bạn có chắc chắn muốn xóa hết?</h3>
                <p className="text-xs font-bold text-red-400">Nếu xóa hết thì không thể khôi phục lại!</p>
              </div>
            </div>

            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3.5 space-y-2 text-xs text-red-200">
              <p className="font-semibold text-red-300">
                ⚠️ Cảnh báo xóa vĩnh viễn dữ liệu nhân sự:
              </p>
              <p className="text-gray-300 leading-relaxed">
                Hành động này sẽ <strong>xóa toàn bộ mọi nhân viên, kỹ sư (Cấp 3)</strong> và <strong>tất cả các Trưởng nghiệp vụ (Cấp 2)</strong> khỏi hệ thống quản trị.
              </p>
              <p className="text-red-400 font-bold text-[11px]">
                * Sau khi xác nhận xóa, dữ liệu nhân sự sẽ bị xóa vĩnh viễn và không thể khôi phục lại!
              </p>
            </div>

            <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-white/10">
              <label className="block text-xs text-gray-300">
                Để xác nhận, vui lòng nhập chính xác từ <strong className="text-red-400 font-mono">XÓA</strong> vào ô bên dưới:
              </label>
              <input 
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Nhập XÓA để xác nhận"
                className="w-full bg-slate-900 border border-white/20 text-xs text-white px-3 py-2 rounded-lg font-mono focus:border-red-500 uppercase"
                autoFocus
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Hủy Bỏ
              </button>
              <button 
                type="button"
                disabled={resetConfirmText.trim().toUpperCase() !== 'XÓA' && resetConfirmText.trim().toUpperCase() !== 'XOA'}
                onClick={() => {
                  const emptyOrg = clearAllOrganizationStaff();
                  setOrgData(emptyOrg);
                  setDevs([]);
                  setShowResetConfirmModal(false);
                  triggerToast('🗑️ Đã xóa toàn diện toàn bộ nhân viên, kỹ sư và trưởng nghiệp vụ thành công!');
                }}
                className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all shadow-lg ${
                  (resetConfirmText.trim().toUpperCase() === 'XÓA' || resetConfirmText.trim().toUpperCase() === 'XOA')
                    ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                    : 'bg-red-950/40 text-gray-500 cursor-not-allowed border border-white/5'
                }`}
              >
                Xác Nhận Xóa Hết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: DEPARTMENT HEAD APPOINTMENT (TAILORED FOR EACH DEPT) */}
      {selectedDeptForAppoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-5 relative max-h-[90vh] overflow-y-auto space-y-3">
            <button 
              onClick={() => {
                setSelectedDeptForAppoint(null);
                setReplacingHeadUid(null);
                setAppointPresetSpecialty(null);
              }}
              className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-white cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <AppointDepartmentHeadModalContent 
              selectedDeptForAppoint={selectedDeptForAppoint}
              setSelectedDeptForAppoint={(dept) => {
                setSelectedDeptForAppoint(dept);
                if (!dept) {
                  setReplacingHeadUid(null);
                  setAppointPresetSpecialty(null);
                }
              }}
              DEPT_CONFIGS={DEPT_CONFIGS}
              orgData={orgData}
              handleAppointHead={handleAppointHead}
              handleRemoveHead={handleRemoveHead}
              appointPhotoUrl={appointPhotoUrl}
              setAppointPhotoUrl={setAppointPhotoUrl}
              appointSpecialty={appointSpecialty}
              setAppointSpecialty={setAppointSpecialty}
              appointSkills={appointSkills}
              setAppointSkills={setAppointSkills}
              appointPresetSpecialty={appointPresetSpecialty}
              replacingHeadUid={replacingHeadUid}
            />
          </div>
        </div>
      )}

      {/* MODAL 10: UPDATE ADMIN PROFILE (HỒ SƠ QUẢN TRỊ VIÊN) */}
      {showEditAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditAdminModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-800 rounded-xl text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-pink-400/30">
                👑
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Cập Nhật Thông Tin Quản Trị Viên</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Cập nhật ảnh đại diện, họ tên, ngày tháng năm sinh, số điện thoại &amp; mật khẩu tài khoản
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateAdminProfile} className="space-y-4">
              {/* Avatar Section & Quick Presets */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                <label className="block text-xs font-bold text-gray-300 uppercase">
                  🖼️ Ảnh Đại Diện Quản Trị (Avatar):
                </label>
                
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img 
                      src={editingAvatarUrl || adminUser.photoUrl} 
                      alt="Preview Avatar" 
                      className="w-16 h-16 rounded-2xl border-2 border-pink-500 bg-slate-900 object-cover shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin_default';
                      }}
                    />
                    <span className="absolute -bottom-1 -right-1 bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-950">
                      ADMIN
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label 
                        htmlFor="admin-avatar-file-upload"
                        className="px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow active:scale-95 transition-all"
                      >
                        📁 <span>Tải ảnh từ máy...</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAdminCameraModal(true)}
                        className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow active:scale-95 transition-all"
                        id="admin-take-camera-photo-btn"
                      >
                        📸 <span>Chụp ảnh Camera...</span>
                      </button>
                      <input 
                        id="admin-avatar-file-upload"
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImageFile(file, 256, 256, 0.75);
                              if (compressed) {
                                setEditingAvatarUrl(compressed);
                              }
                            } catch (err) {
                              console.error('Error compressing admin avatar:', err);
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-[10px] text-gray-400 font-mono">Tối đa 5MB (.jpg, .png)</span>
                    </div>

                    <input 
                      name="adminPhotoUrl"
                      type="url"
                      value={editingAvatarUrl}
                      onChange={(e) => setEditingAvatarUrl(e.target.value)}
                      placeholder="Hoặc dán đường dẫn ảnh HTTPS trực tuyến..."
                      className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-1.5 rounded-xl focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    👤 Họ &amp; Tên Quản Trị Viên:
                  </label>
                  <input 
                    name="adminName"
                    type="text"
                    required
                    defaultValue={adminUser.name}
                    placeholder="VD: LUBPY ADMIN"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-bold focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    🎂 Ngày Tháng Năm Sinh:
                  </label>
                  <input 
                    name="adminDob"
                    type="date"
                    defaultValue={adminUser.dob || ''}
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    📞 Số Điện Thoại Liên Hệ:
                  </label>
                  <input 
                    name="adminPhone"
                    type="tel"
                    defaultValue={adminUser.phone || ''}
                    placeholder="VD: 0912345678"
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl font-mono focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    ✉️ Email Tài Khoản (Cố Định):
                  </label>
                  <input 
                    type="email"
                    disabled
                    value={adminUser.email}
                    className="w-full bg-slate-950/50 border border-white/5 text-xs text-gray-400 px-3.5 py-2.5 rounded-xl font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Security & Password Change */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  🔒 Đổi Mật Khẩu Đăng Nhập (Bỏ trống nếu giữ nguyên):
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Mật khẩu mới:</label>
                    <input 
                      name="adminNewPassword"
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Xác nhận mật khẩu mới:</label>
                    <input 
                      name="adminConfirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowEditAdminModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl cursor-pointer transition-all active:scale-95 border border-pink-400/30"
                >
                  💾 Lưu Cập Nhật Thông Tin Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM XÉT & PHÂN BỔ VỐN ĐIỀU HÀNH LUBPY */}
      {showCapitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-2xl shadow-lg">
                  💼
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Xem Xét &amp; Phân Bổ Vốn Điều Hành</h3>
                  <p className="text-xs text-gray-400">Doanh số vốn tiền hiện có &amp; quản trị quỹ bảo chứng LUBPY STUDIO</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCapitalModal(false)}
                className="text-gray-400 hover:text-white text-xl font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/20 space-y-2">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  💰 Doanh Số Vốn Tiền Hiện Có (VNĐ):
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    value={tempCapitalInput}
                    onChange={(e) => setTempCapitalInput(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/40 text-lg sm:text-xl text-amber-300 px-4 py-3 rounded-xl font-mono font-bold focus:border-amber-400 focus:outline-none"
                    placeholder="VD: 3850000000"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-mono font-bold text-gray-400">VNĐ</span>
                </div>
                <div className="text-right text-xs font-mono text-emerald-400 font-bold">
                  = {formatVnd(Number(tempCapitalInput) || 0)}
                </div>
              </div>

              {/* Phân bổ tỷ lệ đề xuất */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-300 block">⚡ Chọn nhanh các mức vốn dự kiến:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '2.5 Tỷ VNĐ', val: 2500000000 },
                    { label: '3.85 Tỷ VNĐ (Chuẩn)', val: 3850000000 },
                    { label: '5.0 Tỷ VNĐ (Mở rộng)', val: 5000000000 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setTempCapitalInput(preset.val.toString())}
                      className={`px-2 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        Number(tempCapitalInput) === preset.val
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-white/10 text-gray-300 hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mô phỏng cơ cấu phân bổ vốn */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
                <div className="font-bold text-gray-300 border-b border-white/5 pb-1">
                  📊 Dự Phóng Phân Bổ Nguồn Vốn:
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>🏦 Quỹ Dự Phòng Cố Định (65%):</span>
                  <span className="font-mono font-bold text-purple-300">{formatVnd((Number(tempCapitalInput) || 0) * 0.65)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>💵 Quỹ Lưu Động Tiền Mặt (35%):</span>
                  <span className="font-mono font-bold text-emerald-400">{formatVnd((Number(tempCapitalInput) || 0) * 0.35)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>📈 Doanh Thu Hợp Đồng Đang Chạy:</span>
                  <span className="font-mono font-bold text-sky-400">{formatVnd(totalRevenueVnd)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCapitalModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleUpdateCapital(Number(tempCapitalInput) || 0)}
                className="flex-1 py-3 bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl cursor-pointer active:scale-95 border border-amber-400/30"
              >
                💾 Xác Nhận &amp; Cập Nhật Vốn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 11: NOTIFICATION MAILBOX MODAL */}
      <NotificationMailboxModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        user={adminUser}
        orgHeads={orgData.heads}
        onTriggerToast={triggerToast}
      />

      {/* MODAL 12: CAMERA AVATAR MODAL */}
      <CameraAvatarModal
        isOpen={showAdminCameraModal}
        onClose={() => setShowAdminCameraModal(false)}
        currentPhotoUrl={editingAvatarUrl || adminUser.photoUrl}
        onPhotoCaptured={(photoDataUrl) => {
          setEditingAvatarUrl(photoDataUrl);
          setShowAdminCameraModal(false);
        }}
        userName={adminUser.name}
        language={language}
      />

      {/* MODAL 13: 4-ROLE PROJECT CONTRACT MODAL */}
      {selectedWorkflowContract && (
        <ProjectContractModal
          project={selectedWorkflowContract}
          currentUser={adminUser}
          onClose={() => setSelectedWorkflowContract(null)}
          onContractUpdated={(updatedPrj) => {
            setSelectedWorkflowContract(updatedPrj);
            setWorkflowProjects(getWorkflowProjects());
            triggerToast('📜 Đã cập nhật chữ ký số và tiến trình hợp đồng dự án!');
          }}
          language={language}
        />
      )}

      {/* MODAL: GIÁM SÁT TIẾN TRÌNH & NGHIỆM THU KỸ THUẬT (DÀNH CHO ADMIN) */}
      {selectedProjectForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-sky-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center text-2xl shadow-lg">
                  📋
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {selectedProjectForInspection.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-slate-950 px-2 py-0.5 rounded">
                      Giám Sát Nghiệp Vụ Kỹ Thuật
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">{selectedProjectForInspection.title}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProjectForInspection(null)}
                className="text-gray-400 hover:text-white text-xl font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Thẻ trạng thái & Tiến trình */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Trạng thái nghiệm thu:</span>
                  {selectedProjectForInspection.status === 'Completed' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✅ Đã Nghiệm Thu Hoàn Toàn (100%)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      ⚙️ Đang Triển Khai Kỹ Thuật ({selectedProjectForInspection.progress}%)
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Tiến độ thực hiện:</span>
                    <span className="text-sky-300 font-bold">{selectedProjectForInspection.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        selectedProjectForInspection.status === 'Completed' ? 'bg-emerald-400' : 'bg-gradient-to-r from-sky-600 to-sky-400'
                      }`}
                      style={{ width: `${selectedProjectForInspection.progress}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin nhân sự kỹ thuật & Hợp đồng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 space-y-1.5">
                  <div className="text-gray-400">👨‍💻 Đội ngũ Kỹ thuật phụ trách:</div>
                  <div className="font-bold text-white text-sm">{selectedProjectForInspection.assignedDev}</div>
                  <div className="text-[11px] text-gray-400 font-mono">Công nghệ: <strong className="text-sky-300">{selectedProjectForInspection.techStack}</strong></div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 space-y-1.5">
                  <div className="text-gray-400">👤 Khách hàng đặt đồ án:</div>
                  <div className="font-bold text-white text-sm">{selectedProjectForInspection.clientName}</div>
                  <div className="text-[11px] text-gray-400 font-mono">Trường / Đơn vị: {selectedProjectForInspection.school}</div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 space-y-1.5">
                  <div className="text-gray-400">🗓️ Thời hạn bảo vệ:</div>
                  <div className="font-bold text-amber-300 font-mono text-sm">{selectedProjectForInspection.defenseDate}</div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 space-y-1.5">
                  <div className="text-gray-400">💰 Giá trị hợp đồng:</div>
                  <div className="font-bold text-emerald-400 font-mono text-sm">{formatVnd(selectedProjectForInspection.priceVnd)}</div>
                </div>
              </div>

              {/* Báo cáo phân đoạn kỹ thuật */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  📌 Tiến Trình Giai Đoạn Nghiệp Vụ Kỹ Thuật:
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/5">
                    <span>1. Phân tích tài liệu &amp; kiến trúc cơ sở dữ liệu</span>
                    <span className="text-emerald-400 font-bold font-mono">Hoàn thành ✓</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/5">
                    <span>2. Lập trình backend API &amp; tích hợp hệ thống</span>
                    <span className="text-emerald-400 font-bold font-mono">Hoàn thành ✓</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/5">
                    <span>3. Xây dựng giao diện Frontend &amp; trải nghiệm</span>
                    <span className={selectedProjectForInspection.progress >= 70 ? 'text-emerald-400 font-bold font-mono' : 'text-sky-300 font-bold font-mono'}>
                      {selectedProjectForInspection.progress >= 70 ? 'Hoàn thành ✓' : 'Đang xử lý ⏳'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/5">
                    <span>4. Đóng gói Source Code, Viết Báo Cáo &amp; Slide thuyết trình</span>
                    <span className={selectedProjectForInspection.progress === 100 ? 'text-emerald-400 font-bold font-mono' : 'text-gray-500 font-mono'}>
                      {selectedProjectForInspection.progress === 100 ? 'Hoàn tất nghiệm thu ✓' : 'Theo kế hoạch'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedProjectForInspection(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Đóng Hồ Sơ Giám Sát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XEM XÉT TÌNH HÌNH BÁO GIÁ (DÀNH CHO ADMIN) */}
      {selectedLeadForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center text-2xl shadow-lg">
                  📑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {selectedLeadForReview.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-slate-950 px-2 py-0.5 rounded">
                      Xem Xét Tình Hình Báo Giá
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">Thông Tin Báo Giá Khách Hàng</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLeadForReview(null)}
                className="text-gray-400 hover:text-white text-xl font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Trạng thái báo giá:</span>
                  <span className={`px-2.5 py-1 rounded-full font-bold ${
                    selectedLeadForReview.status === 'Đã chốt hợp đồng'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {selectedLeadForReview.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Nguồn tiếp nhận:</span>
                  <span className="font-mono text-sky-300 font-bold">{selectedLeadForReview.source || 'Landing Page'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Thời điểm gửi yêu cầu:</span>
                  <span className="font-mono text-gray-300">{selectedLeadForReview.createdAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Ngân sách dự kiến:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">{formatVnd(selectedLeadForReview.budgetVnd)}</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="font-bold text-gray-300 border-b border-white/5 pb-1">
                  👤 Thông Tin Khách Hàng:
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Họ và tên:</span>
                  <span className="font-bold text-white">{selectedLeadForReview.clientName}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Số điện thoại:</span>
                  <span className="font-mono text-sky-300 font-bold">{selectedLeadForReview.phone}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Trường / Nơi làm việc:</span>
                  <span className="font-semibold text-gray-200">{selectedLeadForReview.school}</span>
                </div>
                <div className="text-gray-400 pt-1">
                  <span>Đề tài / Nhu cầu báo giá:</span>
                  <div className="mt-1 p-2.5 bg-slate-900 rounded-xl border border-white/5 text-gray-200 font-medium">
                    {selectedLeadForReview.topic}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-1">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span>🎧</span> Phân Công Nghiệp Vụ:
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Admin giám sát tình hình tiến độ báo giá. Việc liên hệ, gọi điện tư vấn và hỗ trợ khách hàng do đội ngũ chuyên viên Chăm Sóc Khách Hàng (CSKH) thực hiện trực tiếp.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedLeadForReview(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Đóng Báo Cáo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
