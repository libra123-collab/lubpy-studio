import React, { useState, useEffect } from 'react';
import { 
  CustomerReview, 
  getStoredCustomerReviews, 
  replyToCustomerReview,
  addCustomerReview,
  deleteCustomerReview,
  STANDARD_REVIEW_TEMPLATES,
  getStandardResponseByRating
} from '../../utils/reviewStore';
import { 
  Star as StarIcon, 
  MessageSquare as MessageSquareIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  ThumbsUp as ThumbsUpIcon, 
  ShieldCheck as ShieldCheckIcon, 
  Sparkles as SparklesIcon,
  X as XIcon,
  Code2 as Code2Icon,
  Clock as ClockIcon,
  HeartHandshake as HeartHandshakeIcon,
  Edit3 as Edit3Icon,
  AlertTriangle as AlertTriangleIcon,
  Check as CheckIcon,
  Send as SendIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon
} from 'lucide-react';

interface AdminCustomerReviewsTabProps {
  onTriggerToast?: (msg: string) => void;
}

export default function AdminCustomerReviewsTab({ onTriggerToast }: AdminCustomerReviewsTabProps) {
  const [reviews, setReviews] = useState<CustomerReview[]>(() => getStoredCustomerReviews());
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState<'all' | '5_4' | '3' | '2_1'>('all');
  const [replyFilter, setReplyFilter] = useState<'all' | 'unreplied' | 'replied'>('all');
  const [deptFilter, setDeptFilter] = useState<'all' | 'tech' | 'cs' | 'hr' | 'accounting'>('all');

  // Modal State for Viewing / Admin Supervision
  const [inspectingReview, setInspectingReview] = useState<CustomerReview | null>(null);
  const [replyingReview, setReplyingReview] = useState<CustomerReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAuthorRole, setReplyAuthorRole] = useState('Chuyên Viên CSKH LUBPY');
  const [replyAuthorName, setReplyAuthorName] = useState('Chu Phiêu Dật');
  const [selectedCaseNum, setSelectedCaseNum] = useState<number>(3);

  // Auto reload when reviews change
  useEffect(() => {
    const handleUpdate = () => {
      setReviews(getStoredCustomerReviews());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('lubpy_reviews_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('lubpy_reviews_updated', handleUpdate);
    };
  }, []);

  // Calculations for CSAT Analytics
  const totalReviewsCount = reviews.length;
  const avgOverall = totalReviewsCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.ratingOverall, 0) / totalReviewsCount).toFixed(2)
    : '0.00';
  const avgCode = totalReviewsCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.ratingCodeQuality, 0) / totalReviewsCount).toFixed(1)
    : '0.0';
  const avgTimeline = totalReviewsCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.ratingTimeline, 0) / totalReviewsCount).toFixed(1)
    : '0.0';
  const avgSupport = totalReviewsCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.ratingSupport, 0) / totalReviewsCount).toFixed(1)
    : '0.0';
  
  const highRatingCount = reviews.filter(r => r.ratingOverall >= 4.0).length;
  const midRatingCount = reviews.filter(r => r.ratingOverall >= 3.0 && r.ratingOverall < 4.0).length;
  const lowRatingCount = reviews.filter(r => r.ratingOverall < 3.0).length;
  const unrepliedCount = reviews.filter(r => !r.adminReply).length;
  const repliedCount = reviews.filter(r => !!r.adminReply).length;

  // Filter Reviews
  const filteredReviews = reviews.filter(r => {
    const matchesSearch = 
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.assignedDevName && r.assignedDevName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.clientSchool && r.clientSchool.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.adminReply?.author && r.adminReply.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.adminReply?.content && r.adminReply.content.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = deptFilter === 'all' || r.departmentKey === deptFilter;

    let matchesStar = true;
    if (starFilter === '5_4') {
      matchesStar = r.ratingOverall >= 4.0;
    } else if (starFilter === '3') {
      matchesStar = r.ratingOverall >= 3.0 && r.ratingOverall < 4.0;
    } else if (starFilter === '2_1') {
      matchesStar = r.ratingOverall < 3.0;
    }

    let matchesReply = true;
    if (replyFilter === 'unreplied') {
      matchesReply = !r.adminReply;
    } else if (replyFilter === 'replied') {
      matchesReply = !r.adminReply ? false : true;
    }

    return matchesSearch && matchesDept && matchesStar && matchesReply;
  });

  // Open Reply / Supervise Modal with auto-selected standard template
  const handleOpenReplyModal = (rev: CustomerReview) => {
    setReplyingReview(rev);
    
    // Auto-detect template case
    let defaultCase = 3;
    if (rev.ratingOverall < 3.0) {
      defaultCase = 1;
    } else if (rev.ratingOverall < 4.0) {
      defaultCase = 2;
    } else {
      defaultCase = 3;
    }
    
    setSelectedCaseNum(defaultCase);
    setReplyText(rev.adminReply ? rev.adminReply.content : getStandardResponseByRating(rev.ratingOverall));
    if (rev.adminReply?.author) {
      setReplyAuthorName(rev.adminReply.author);
    }
    if (rev.adminReply?.authorRole) {
      setReplyAuthorRole(rev.adminReply.authorRole);
    }
  };

  // Apply a specific template
  const handleApplyTemplate = (caseNum: number) => {
    setSelectedCaseNum(caseNum);
    if (caseNum === 1) {
      setReplyText(STANDARD_REVIEW_TEMPLATES.CASE_1_UNSATISFIED.content);
    } else if (caseNum === 2) {
      setReplyText(STANDARD_REVIEW_TEMPLATES.CASE_2_AVERAGE.content);
    } else {
      setReplyText(STANDARD_REVIEW_TEMPLATES.CASE_3_SATISFIED.content);
    }
  };

  // Handle Admin / CS Reply Submit
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;

    const updated = replyToCustomerReview(
      replyingReview.id, 
      replyText.trim(), 
      replyAuthorName.trim() || 'Chuyên Viên CSKH LUBPY',
      replyAuthorRole.trim() || 'Ban Chăm Sóc Khách Hàng',
      undefined,
      selectedCaseNum
    );
    setReviews(updated);
    if (onTriggerToast) onTriggerToast(`💬 Đã lưu câu trả lời cho đánh giá của khách hàng ${replyingReview.clientName}!`);
    setReplyingReview(null);
    setReplyText('');
  };

  // Handle Delete Review
  const handleDeleteReview = (revId: string, clientName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đánh giá của học viên "${clientName}" không?`)) {
      const updated = deleteCustomerReview(revId);
      setReviews(updated);
      if (onTriggerToast) onTriggerToast(`🗑️ Đã xóa đánh giá của học viên ${clientName}`);
    }
  };

  return (
    <div className="space-y-6" id="admin-customer-reviews-hub">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <StarIcon className="w-6 h-6 fill-amber-400 text-amber-400" />
            </span>
            <span>Giám Sát Đánh Giá Khách Hàng &amp; Phản Hồi CSKH (CSAT Oversight)</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Góc nhìn Quản Trị Viên: Theo dõi mức độ hài lòng của học viên và giám sát toàn bộ câu trả lời từ đội ngũ Chuyên viên Chăm Sóc Khách Hàng (CSKH) theo 3 bộ kịch bản phản hồi tiêu chuẩn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalReviewsCount > 0 && (
            unrepliedCount > 0 ? (
              <div className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>{unrepliedCount} đánh giá chờ CSKH trả lời</span>
              </div>
            ) : (
              <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-300">
                <CheckIcon className="w-4 h-4 text-emerald-400" />
                <span>100% Đánh giá đã được CSKH phản hồi</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: CSAT Overall */}
        <div className="bg-slate-900/70 border border-amber-500/30 p-5 rounded-2xl space-y-2 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Điểm CSAT Toàn Hệ Thống</span>
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <ThumbsUpIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">{avgOverall}</span>
            <span className="text-sm font-bold text-gray-400">/ 5.0 ⭐</span>
          </div>
          <div className="flex items-center text-amber-400 gap-1 pt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <StarIcon key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-[10px] text-gray-400 ml-1 font-mono">({totalReviewsCount} phản hồi)</span>
          </div>
        </div>

        {/* Metric 2: Code Quality */}
        <div className="bg-slate-900/70 border border-emerald-500/30 p-5 rounded-2xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Chất Lượng Code &amp; Kiến Trúc</span>
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Code2Icon className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{avgCode}</span>
            <span className="text-sm font-bold text-gray-400">/ 5.0 ⭐</span>
          </div>
          <p className="text-[10px] text-emerald-300/80 font-medium">Clean Code, video walkthrough &amp; báo cáo</p>
        </div>

        {/* Metric 3: Delivery Timeline */}
        <div className="bg-slate-900/70 border border-sky-500/30 p-5 rounded-2xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Tiến Độ Bàn Giao Đồ Án</span>
            <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
              <ClockIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-400 font-mono">{avgTimeline}</span>
            <span className="text-sm font-bold text-gray-400">/ 5.0 ⭐</span>
          </div>
          <p className="text-[10px] text-sky-300/80 font-medium">Bàn giao trước thời hạn bảo vệ của trường</p>
        </div>

        {/* Metric 4: Support & Coaching */}
        <div className="bg-slate-900/70 border border-purple-500/30 p-5 rounded-2xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Thái Độ CSKH &amp; Hỗ Trợ</span>
            <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
              <HeartHandshakeIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400 font-mono">{avgSupport}</span>
            <span className="text-sm font-bold text-gray-400">/ 5.0 ⭐</span>
          </div>
          <p className="text-[10px] text-purple-300/80 font-medium">Teamview hướng dẫn 1-1 phản biện tốt nghiệp</p>
        </div>
      </div>

      {/* 3 STANDARD RESPONSE TEMPLATES OVERVIEW CARD */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>3 Kịch Bản Trả Lời Chuẩn Của Hệ Thống Theo Xếp Hạng Sao</span>
          </h4>
          <span className="text-[10px] text-gray-400 font-mono">Tự động đề xuất khi nhấn trả lời</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Case 1 */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-red-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                1. Yếu / Không Hài Lòng (1 - 2 ⭐)
              </span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed italic line-clamp-3">
              "{STANDARD_REVIEW_TEMPLATES.CASE_1_UNSATISFIED.content}"
            </p>
          </div>

          {/* Case 2 */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                2. Tầm Trung / Góp Ý (3 ⭐)
              </span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed italic line-clamp-3">
              "{STANDARD_REVIEW_TEMPLATES.CASE_2_AVERAGE.content}"
            </p>
          </div>

          {/* Case 3 */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                3. Hài Lòng / Tích Cực (4 - 5 ⭐)
              </span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed italic line-clamp-3">
              "{STANDARD_REVIEW_TEMPLATES.CASE_3_SATISFIED.content}"
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-500" />
          </span>
          <input 
            type="text"
            placeholder="Tìm theo tên học viên, trường, đề tài, kỹ sư, nội dung đánh giá..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Reply Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={replyFilter}
            onChange={(e) => setReplyFilter(e.target.value as any)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất Cả Trạng Thái Trả Lời</option>
            <option value="unreplied">⏳ Đang Chờ Trả Lời ({unrepliedCount})</option>
            <option value="replied">✅ Đã Phản Hồi ({totalReviewsCount - unrepliedCount})</option>
          </select>
        </div>

        {/* Star Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setStarFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              starFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Tất Cả ({totalReviewsCount})
          </button>
          <button
            onClick={() => setStarFilter('5_4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
              starFilter === '5_4' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>4-5 ⭐ Hài Lòng</span>
            <span className="text-[10px] opacity-80">({highRatingCount})</span>
          </button>
          <button
            onClick={() => setStarFilter('3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
              starFilter === '3' ? 'bg-amber-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>3 ⭐ Tầm Trung</span>
            <span className="text-[10px] opacity-80">({midRatingCount})</span>
          </button>
          <button
            onClick={() => setStarFilter('2_1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
              starFilter === '2_1' ? 'bg-red-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>1-2 ⭐ Yếu</span>
            <span className="text-[10px] opacity-80">({lowRatingCount})</span>
          </button>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              ⭐
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                {reviews.length === 0 ? 'Hệ thống chưa có đánh giá nào từ học viên' : 'Không tìm thấy đánh giá phù hợp với bộ lọc'}
              </h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {reviews.length === 0 
                  ? 'Đánh giá được ghi nhận tự động từ học viên sau khi hoàn thành buổi bảo vệ đồ án hoặc thông qua cổng tiếp nhận của phòng Chăm Sóc Khách Hàng.'
                  : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc phân loại sao/trạng thái trả lời.'}
              </p>
            </div>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isUnsatisfied = rev.ratingOverall < 3.0;
            const isAverage = rev.ratingOverall >= 3.0 && rev.ratingOverall < 4.0;
            const isSatisfied = rev.ratingOverall >= 4.0;

            const cardBorderClass = isUnsatisfied 
              ? 'border-red-500/30 hover:border-red-500/60'
              : isAverage 
              ? 'border-amber-500/30 hover:border-amber-500/60'
              : 'border-white/10 hover:border-emerald-500/40';

            return (
              <div 
                key={rev.id}
                className={`bg-slate-900/70 border rounded-2xl p-5 space-y-4 shadow-xl transition-all ${cardBorderClass}`}
              >
                {/* Review Header: Student & Rating */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={rev.clientAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(rev.clientName)}&backgroundColor=0f172a`} 
                      alt={rev.clientName}
                      className="w-12 h-12 rounded-full border border-amber-500/40 bg-slate-950 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black text-white">{rev.clientName}</h4>
                        {rev.highlightTag && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                            isUnsatisfied 
                              ? 'bg-red-500/20 border-red-500/30 text-red-300' 
                              : isAverage 
                              ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                          }`}>
                            <SparklesIcon className="w-3 h-3" />
                            <span>{rev.highlightTag}</span>
                          </span>
                        )}
                        {/* Rating Category Tag */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          isUnsatisfied ? 'bg-red-500/20 text-red-300' :
                          isAverage ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {isUnsatisfied ? 'Trường hợp 1: Yếu (1-2 ⭐)' :
                           isAverage ? 'Trường hợp 2: Tầm trung (3 ⭐)' :
                           'Trường hợp 3: Hài lòng (4-5 ⭐)'}
                        </span>
                      </div>
                      <p className="text-xs text-sky-400 font-mono mt-0.5">{rev.clientSchool || 'Đại Học CNTT'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="flex items-center text-amber-400 gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <StarIcon 
                          key={i} 
                          className={`w-4 h-4 ${i <= Math.round(rev.ratingOverall) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} 
                        />
                      ))}
                      <span className={`text-sm font-black font-mono ml-1.5 ${
                        isUnsatisfied ? 'text-red-400' : isAverage ? 'text-amber-300' : 'text-emerald-300'
                      }`}>
                        {rev.ratingOverall.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">Đánh giá: {rev.createdAt}</span>
                  </div>
                </div>

                {/* Project & Staff Assignment Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/5 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Đề Tài Đồ Án:</span>
                    <span className="text-white font-bold leading-tight line-clamp-1">{rev.projectTitle}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Nghiệp Vụ Phụ Trách:</span>
                    <span className="text-sky-300 font-medium">{rev.departmentName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Kỹ Sư Lập Trình:</span>
                    <span className="text-amber-300 font-bold">{rev.assignedDevName || 'Trần Hoàng Nam (Lead)'}</span>
                  </div>
                </div>

                {/* Sub-ratings grid */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <span className="text-gray-500">Chất lượng Code:</span>
                    <span className="text-emerald-400 font-bold">{rev.ratingCodeQuality.toFixed(1)} ⭐</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <span className="text-gray-500">Tiến độ bàn giao:</span>
                    <span className="text-sky-400 font-bold">{rev.ratingTimeline.toFixed(1)} ⭐</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <span className="text-gray-500">Hỗ trợ &amp; Coaching:</span>
                    <span className="text-purple-400 font-bold">{rev.ratingSupport.toFixed(1)} ⭐</span>
                  </div>
                </div>

                {/* Comment Content */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Nhận Xét Của Khách Hàng:</span>
                  <p className="text-xs text-gray-200 leading-relaxed font-normal italic">
                    "{rev.comment}"
                  </p>
                </div>

                {/* CS Staff Reply Card or Pending Notice */}
                {rev.adminReply ? (
                  <div className="bg-slate-950/90 border border-emerald-500/30 p-4 rounded-xl ml-1 sm:ml-4 space-y-2.5 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={rev.adminReply.authorAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(rev.adminReply.author)}&backgroundColor=0f172a`} 
                          alt={rev.adminReply.author} 
                          className="w-8 h-8 rounded-lg border border-emerald-500/40 bg-slate-900 object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-emerald-300 flex items-center gap-1.5">
                              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                              <span>{rev.adminReply.author}</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              {rev.adminReply.authorRole || 'Chuyên Viên CSKH'}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">Thời gian phản hồi: {rev.adminReply.repliedAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {rev.adminReply.templateCase && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/20">
                            Kịch bản #{rev.adminReply.templateCase}
                          </span>
                        )}
                        <button
                          onClick={() => setInspectingReview(rev)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1"
                          title="Xem chi tiết giám sát"
                        >
                          <SearchIcon className="w-3 h-3" />
                          <span>Giám Sát</span>
                        </button>
                        <button
                          onClick={() => handleOpenReplyModal(rev)}
                          className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-gray-300 border border-white/10 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1"
                          title="Chỉnh sửa câu trả lời nếu cần can thiệp"
                        >
                          <Edit3Icon className="w-3 h-3" />
                          <span>Hiệu Chỉnh</span>
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.clientName)}
                          className="p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Xóa đánh giá này"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-200 leading-relaxed bg-[#0d1218] p-3 rounded-lg border border-emerald-500/10">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Nội dung câu trả lời gửi đến khách hàng:</span>
                      <p className="italic">{rev.adminReply.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-dashed border-amber-500/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangleIcon className="w-4 h-4 text-amber-400" />
                        <span>Chưa Có Câu Trả Lời Từ Chuyên Viên CSKH</span>
                      </span>
                      <p className="text-[11px] text-gray-400">
                        Đang chờ đội ngũ CSKH tiếp nhận và gửi câu trả lời theo chuẩn dịch vụ CSAT.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInspectingReview(rev)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <SearchIcon className="w-3.5 h-3.5" />
                        <span>Xem Chi Tiết</span>
                      </button>
                      <button
                        onClick={() => handleOpenReplyModal(rev)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-lg"
                      >
                        <MessageSquareIcon className="w-3.5 h-3.5" />
                        <span>Chỉ Đạo / Trả Lời</span>
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev.id, rev.clientName)}
                        className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                        title="Xóa đánh giá này"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* INSPECTION MODAL (XEM CHI TIẾT GIÁM SÁT) */}
      {inspectingReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101a26] border border-sky-500/30 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-sky-400" />
                  <span>Hồ Sơ Giám Sát Đánh Giá &amp; Đối Soát CSAT</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Mã phiếu đánh giá: <span className="text-sky-300 font-mono font-bold">{inspectingReview.id}</span></p>
              </div>
              <button 
                onClick={() => setInspectingReview(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Client & Project Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/70 p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Khách Hàng / Học Viên:</span>
                <p className="text-white font-bold text-sm mt-0.5">{inspectingReview.clientName}</p>
                <span className="text-sky-400 text-xs font-mono">{inspectingReview.clientSchool || 'Đại Học CNTT'}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Đề Tài Đồ Án:</span>
                <p className="text-white font-bold mt-0.5">{inspectingReview.projectTitle}</p>
                <span className="text-amber-300 text-xs">Phụ trách: {inspectingReview.assignedDevName || 'Kỹ sư LUBPY'}</span>
              </div>
            </div>

            {/* Ratings Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/20">
                <span className="text-gray-400 block text-[10px]">Tổng Quan</span>
                <span className="text-base font-black text-amber-400 font-mono">{inspectingReview.ratingOverall.toFixed(1)} ⭐</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/20">
                <span className="text-gray-400 block text-[10px]">Chất Lượng Code</span>
                <span className="text-base font-black text-emerald-400 font-mono">{inspectingReview.ratingCodeQuality.toFixed(1)} ⭐</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-sky-500/20">
                <span className="text-gray-400 block text-[10px]">Tiến Độ Bàn Giao</span>
                <span className="text-base font-black text-sky-400 font-mono">{inspectingReview.ratingTimeline.toFixed(1)} ⭐</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-purple-500/20">
                <span className="text-gray-400 block text-[10px]">Hỗ Trợ & CSKH</span>
                <span className="text-base font-black text-purple-400 font-mono">{inspectingReview.ratingSupport.toFixed(1)} ⭐</span>
              </div>
            </div>

            {/* Client Comment */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 space-y-1 text-xs">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Nhận xét của học viên:</span>
              <p className="text-gray-200 italic leading-relaxed text-sm">
                "{inspectingReview.comment}"
              </p>
            </div>

            {/* CS Reply Section */}
            <div className="space-y-2 text-xs">
              <span className="text-gray-300 font-bold block uppercase text-[10px]">Phản hồi từ Đội ngũ Chăm Sóc Khách Hàng:</span>
              {inspectingReview.adminReply ? (
                <div className="bg-[#0e1620] border border-emerald-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-300">{inspectingReview.adminReply.author}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-medium">
                        {inspectingReview.adminReply.authorRole || 'Chuyên Viên CSKH'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Ngày trả lời: {inspectingReview.adminReply.repliedAt}</span>
                  </div>
                  <p className="text-gray-200 leading-relaxed italic">
                    "{inspectingReview.adminReply.content}"
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/60 border border-dashed border-amber-500/30 rounded-xl text-amber-300 text-center">
                  Chuyên viên CSKH chưa thực hiện trả lời cho đánh giá này.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setInspectingReview(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const rev = inspectingReview;
                  setInspectingReview(null);
                  handleOpenReplyModal(rev);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Edit3Icon className="w-3.5 h-3.5" />
                <span>{inspectingReview.adminReply ? 'Hiệu Chỉnh Câu Trả Lời' : 'Chỉ Đạo / Trả Lời Ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPLY TO CUSTOMER WITH 3 STANDARD CASES */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101a26] border border-amber-500/30 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <MessageSquareIcon className="w-5 h-5 text-amber-400" />
                  <span>Trả Lời Đánh Giá Của Khách Hàng: {replyingReview.clientName}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Đồ án: <span className="text-sky-300 font-bold">{replyingReview.projectTitle}</span> ({replyingReview.ratingOverall.toFixed(1)} ⭐)
                </p>
              </div>
              <button 
                onClick={() => setReplyingReview(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Student's Comment Recap */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/10 space-y-1 text-xs">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Nội dung khách hàng đã nhận xét:</span>
              <p className="text-gray-300 italic font-medium">
                "{replyingReview.comment}"
              </p>
            </div>

            {/* 3 Quick Template Selector Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                Chọn Kịch Bản Trả Lời Chuẩn (3 Trường Hợp):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Case 1 Button */}
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(1)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedCaseNum === 1
                      ? 'bg-red-950/40 border-red-500 text-white shadow-lg ring-1 ring-red-500'
                      : 'bg-slate-950/60 border-white/10 text-gray-400 hover:border-red-500/40 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-red-400">1. Yếu / Không Hài Lòng</span>
                    {selectedCaseNum === 1 && <CheckIcon className="w-4 h-4 text-red-400" />}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono block">1 ⭐ đến 2 ⭐</span>
                </button>

                {/* Case 2 Button */}
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(2)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedCaseNum === 2
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg ring-1 ring-amber-500'
                      : 'bg-slate-950/60 border-white/10 text-gray-400 hover:border-amber-500/40 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400">2. Tầm Trung / Góp Ý</span>
                    {selectedCaseNum === 2 && <CheckIcon className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono block">3 ⭐</span>
                </button>

                {/* Case 3 Button */}
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(3)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedCaseNum === 3
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                      : 'bg-slate-950/60 border-white/10 text-gray-400 hover:border-emerald-500/40 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-400">3. Hài Lòng / Tích Cực</span>
                    {selectedCaseNum === 3 && <CheckIcon className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono block">4 ⭐ đến 5 ⭐</span>
                </button>
              </div>
            </div>

            {/* Editable Response Form */}
            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1.5 flex items-center justify-between">
                  <span>Nội Dung Câu Trả Lời Gửi Khách Hàng:</span>
                  <span className="text-[10px] text-gray-500 font-normal">(Có thể chỉnh sửa thêm nếu cần)</span>
                </label>
                <textarea 
                  rows={5}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập nội dung phản hồi gửi đến học viên..."
                  className="w-full bg-slate-950 border border-white/20 rounded-xl p-3.5 text-white leading-relaxed focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-90 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg flex items-center gap-2 uppercase tracking-wider"
                >
                  <SendIcon className="w-4 h-4" />
                  <span>Gửi Câu Trả Lời</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
