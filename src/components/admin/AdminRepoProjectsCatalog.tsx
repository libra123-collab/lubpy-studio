import React, { useState } from 'react';
import { 
  REPO_PROJECTS_CATALOG, 
  STANDALONE_REPORTS_CATALOG,
  STARTER_REPOS_CATALOG,
  RepoProjectItem, 
  RepoProjectPackage,
  RepoReportItem,
  StarterRepoItem
} from '../../data/repoProjects';
import { 
  BookOpen as BookOpenIcon, 
  Download as DownloadIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Star as StarIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  Sparkles as SparklesIcon, 
  DollarSign as DollarSignIcon, 
  ExternalLink as ExternalLinkIcon, 
  Copy as CopyIcon, 
  Layers as LayersIcon, 
  Code2 as Code2Icon, 
  FileText as FileTextIcon, 
  Presentation as PresentationIcon, 
  Database as DatabaseIcon, 
  Eye as EyeIcon, 
  Share2 as Share2Icon, 
  Plus as PlusIcon, 
  X as XIcon, 
  Check as CheckIcon, 
  Tag as TagIcon, 
  ShieldCheck as ShieldCheckIcon,
  Terminal as TerminalIcon,
  FolderTree as FolderTreeIcon,
  FileCheck2 as FileCheck2Icon,
  GraduationCap as GraduationCapIcon,
  Cpu as CpuIcon,
  Boxes as BoxesIcon,
  FileSpreadsheet as FileSpreadsheetIcon
} from 'lucide-react';

interface AdminRepoProjectsCatalogProps {
  onNotify?: (msg: string) => void;
}

export default function AdminRepoProjectsCatalog({ onNotify }: AdminRepoProjectsCatalogProps) {
  // Main view state: 'code' (Kho Mã Nguồn) vs 'reports' (Kho Báo Cáo) vs 'combo' (Trọn Bộ Đồ Án)
  const [mainView, setMainView] = useState<'code' | 'reports' | 'combo'>('code');

  const [projectsList] = useState<RepoProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem('lubpy_repo_projects_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return REPO_PROJECTS_CATALOG;
  });

  const [reportsList] = useState<RepoReportItem[]>(STANDALONE_REPORTS_CATALOG);
  const [startersList] = useState<StarterRepoItem[]>(STARTER_REPOS_CATALOG);

  // Search & Filter for Code
  const [codeSearch, setCodeSearch] = useState('');
  const [codeCategory, setCodeCategory] = useState<string>('all');

  // Search & Filter for Reports
  const [reportSearch, setReportSearch] = useState('');
  const [reportType, setReportType] = useState<string>('all');

  // Modals
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<RepoProjectItem | null>(null);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<RepoReportItem | null>(null);
  const [selectedCodeRepoForDetail, setSelectedCodeRepoForDetail] = useState<RepoProjectItem | StarterRepoItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    if (onNotify) {
      onNotify(msg);
    }
  };

  const handleCopy = (text: string, id: string, label: string = 'Đã sao chép vào bộ nhớ tạm!') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Code Repositories
  const filteredCodeProjects = projectsList.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(codeSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(codeSearch.toLowerCase()) ||
      p.techLead.toLowerCase().includes(codeSearch.toLowerCase()) ||
      p.techStack.some(t => t.toLowerCase().includes(codeSearch.toLowerCase())) ||
      p.assignedTechTeam.toLowerCase().includes(codeSearch.toLowerCase());

    const matchesCategory = codeCategory === 'all' || p.category === codeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredStarters = startersList.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(codeSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(codeSearch.toLowerCase()) ||
      s.techStack.some(t => t.toLowerCase().includes(codeSearch.toLowerCase()));

    const matchesCategory = codeCategory === 'all' || s.category === codeCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered Reports
  const filteredReports = reportsList.filter(r => {
    const matchesSearch = 
      r.title.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.projectTitle.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.targetMajor.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.techLeadAuthor.toLowerCase().includes(reportSearch.toLowerCase());

    const matchesType = 
      reportType === 'all' || 
      (reportType === 'THESIS_DOC' && r.type === 'THESIS_DOC') ||
      (reportType === 'SLIDE' && r.type === 'SLIDE') ||
      (reportType === 'SRS_SPEC' && r.type === 'SRS_SPEC') ||
      (reportType === 'DEFENSE_QA' && (r.type === 'DEFENSE_QA' || r.type === 'TEST_PLAN'));

    return matchesSearch && matchesType;
  });

  const codeCategories = [
    { key: 'all', label: 'Tất Cả Công Nghệ' },
    { key: 'Web Fullstack', label: 'Web Fullstack' },
    { key: 'AI & Computer Vision', label: 'AI & Khoa Học Dữ Liệu' },
    { key: 'Mobile App', label: 'Mobile App (Flutter)' },
    { key: 'Microservices & Cloud', label: 'Microservices & Cloud' },
    { key: 'IoT & Hệ Thống Nhúng', label: 'IoT & Phần Cứng Nhúng' },
    { key: 'Blockchain Web3', label: 'Blockchain Web3' }
  ];

  const reportCategories = [
    { key: 'all', label: 'Tất Cả Tài Liệu', count: reportsList.length },
    { key: 'THESIS_DOC', label: 'Báo Cáo Luận Văn (.docx)', count: reportsList.filter(r => r.type === 'THESIS_DOC').length },
    { key: 'SLIDE', label: 'Slide Bảo Vệ (.pptx)', count: reportsList.filter(r => r.type === 'SLIDE').length },
    { key: 'SRS_SPEC', label: 'Đặc Tả SRS & Sơ Đồ (.pdf)', count: reportsList.filter(r => r.type === 'SRS_SPEC').length },
    { key: 'DEFENSE_QA', label: 'Cẩm Nang Phản Biện & Test', count: reportsList.filter(r => r.type === 'DEFENSE_QA' || r.type === 'TEST_PLAN').length }
  ];

  return (
    <div className="space-y-6" id="admin-repo-projects-catalog-container">
      {/* Header Info */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 font-mono text-xs font-black border border-pink-500/30">
              TRUNG TÂM TÀI NGUYÊN KỸ THUẬT LUBPY
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
              Đã Phân Chia Riêng Biệt
            </span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5 mt-1.5">
            <BookOpenIcon className="w-6 h-6 text-pink-400" />
            <span>Kho Mã Nguồn &amp; Báo Cáo Luận Văn Đồ Án</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-3xl">
            Tài nguyên được tổ chức phân tách rành mạch thành <strong>Kho Mã Nguồn (Source Code Repositories)</strong> và <strong>Kho Báo Cáo &amp; Luận Văn (Thesis &amp; Slide Reports)</strong> giúp tìm kiếm, tải xuống và bàn giao đúng mục đích.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (mainView === 'code') {
                const text = filteredCodeProjects.map(p => `[CODE] ${p.id} - ${p.title} (${p.techStack.join(', ')})`).join('\n');
                handleCopy(text, 'export-all', 'Đã sao chép danh mục Kho Mã Nguồn!');
              } else if (mainView === 'reports') {
                const text = filteredReports.map(r => `[REPORT] ${r.id} - ${r.title} (${r.pagesOrSlides} - ${r.format})`).join('\n');
                handleCopy(text, 'export-all', 'Đã sao chép danh mục Kho Báo Cáo & Luận Văn!');
              } else {
                const text = projectsList.map(p => `[COMBO] ${p.id} - ${p.title}: Giá từ ${p.pricingPackages[0].priceVnd.toLocaleString('vi-VN')}đ`).join('\n');
                handleCopy(text, 'export-all', 'Đã sao chép danh mục Combo 10 Đồ Án!');
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Share2Icon className="w-4 h-4" />
            <span>Xuất Danh Mục Hiện Tại</span>
          </button>
        </div>
      </div>

      {/* ================= PRIMARY PILLAR SWITCHER ================= */}
      <div className="bg-slate-900/90 border border-white/10 p-1.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl">
        <div className="grid grid-cols-3 w-full sm:w-auto gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-white/5">
          <button
            onClick={() => setMainView('code')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              mainView === 'code'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2Icon className="w-4 h-4 text-emerald-300" />
            <span>💻 KHO MÃ NGUỒN</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              mainView === 'code' ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {projectsList.length + startersList.length}
            </span>
          </button>

          <button
            onClick={() => setMainView('reports')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              mainView === 'reports'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileTextIcon className="w-4 h-4 text-sky-300" />
            <span>📄 KHO BÁO CÁO</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              mainView === 'reports' ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {reportsList.length}
            </span>
          </button>

          <button
            onClick={() => setMainView('combo')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              mainView === 'combo'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BoxesIcon className="w-4 h-4 text-pink-300" />
            <span>📚 TRỌN BỘ COMBO</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              mainView === 'combo' ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {projectsList.length}
            </span>
          </button>
        </div>

        <div className="text-right px-3 hidden md:block">
          <span className="text-[11px] text-gray-400">
            {mainView === 'code' && 'Đang xem: Mã nguồn dự án thực tế, Repo GitHub & Bộ khung Starter'}
            {mainView === 'reports' && 'Đang xem: Báo cáo luận văn tốt nghiệp, Slide bảo vệ & Đặc tả SRS'}
            {mainView === 'combo' && 'Đang xem: Trọn gói cả Mã nguồn + Báo cáo + Slide đi kèm từng đề tài'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW PHÂN MỤC: KHO MÃ NGUỒN (SOURCE CODE REPOSITORIES)                 */}
      {/* ========================================================================= */}
      {mainView === 'code' && (
        <div className="space-y-6">
          {/* Metrics riêng cho Kho Mã Nguồn */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-gray-400">Kho Mã Nguồn Đồ Án</span>
              <div className="text-2xl font-black font-mono text-emerald-300 mt-1">10 Repositories</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Fullstack, Microservices, AI, IoT</div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-teal-500/30">
              <span className="text-[10px] uppercase font-bold text-gray-400">Khung Mã Nguồn Starter</span>
              <div className="text-2xl font-black font-mono text-teal-300 mt-1">{startersList.length} Boilerplates</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Next.js, FastAPI, Flutter, Spring</div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
              <span className="text-[10px] uppercase font-bold text-gray-400">Trạng Thái Kiểm Thử Mã</span>
              <div className="text-2xl font-black font-mono text-sky-400 mt-1">100% Passed</div>
              <div className="text-[11px] text-sky-300 font-mono mt-0.5">Build sạch &amp; chạy ngay</div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-gray-400">Kỹ Sư Trưởng Phụ Trách</span>
              <div className="text-2xl font-black font-mono text-amber-300 mt-1">4 Tech Leads</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Giám sát &amp; hỗ trợ cài đặt</div>
            </div>
          </div>

          {/* Quick Starter Boilerplates Carousel / Mini Section */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Bộ Khung Mã Nguồn Khởi Tạo Nhanh (Starter Kits &amp; Boilerplates)
                </h3>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Dành cho sinh viên tự triển khai đồ án mới</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStarters.map((starter) => (
                <div key={starter.id} className="p-3 bg-slate-950/80 rounded-xl border border-white/5 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30">
                        {starter.id}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{starter.size}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">{starter.title}</h4>
                    <p className="text-[10px] text-gray-400 line-clamp-2">{starter.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {starter.techStack.map((tech, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-gray-300 text-[9px] font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopy(starter.gitCloneUrl, starter.id, 'Đã sao chép lệnh git clone!')}
                      className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono cursor-pointer"
                      title="Sao chép lệnh git clone"
                    >
                      <CopyIcon className="w-3 h-3" />
                      <span>{copiedId === starter.id ? 'Đã chép!' : 'git clone'}</span>
                    </button>

                    <button
                      onClick={() => triggerToast(`Đang tải xuống bộ khung mã nguồn ${starter.fileName}...`)}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      <DownloadIcon className="w-3 h-3" />
                      <span>Tải .zip</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter & Search Bar cho Kho Mã Nguồn */}
          <div className="p-4 bg-slate-900/90 border border-white/10 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm kho mã nguồn theo tên đề tài, ngôn ngữ lập trình (React, Spring, Python, Flutter, Solidity...), mã repo..."
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 font-bold hidden sm:inline">Phân loại:</span>
                <div className="flex flex-wrap gap-1.5">
                  {codeCategories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setCodeCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        codeCategory === cat.key
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Danh Sách 10 Kho Mã Nguồn Đồ Án Lớn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCodeProjects.map((project) => {
              const codeDeliverable = project.deliverables.find(d => d.type === 'SOURCE') || project.deliverables[0];
              const sqlDeliverable = project.deliverables.find(d => d.type === 'DATA');

              return (
                <div
                  key={project.id}
                  className="bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black border border-emerald-500/30 uppercase">
                            {project.id}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                            {project.category}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-gray-300 font-mono text-[10px]">
                            Kho Code v3.2
                          </span>
                        </div>

                        <h3 
                          onClick={() => setSelectedCodeRepoForDetail(project)}
                          className="text-base font-black text-white hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          {project.title}
                        </h3>
                        <p className="text-xs text-sky-400 font-medium">{project.subtitle}</p>
                      </div>

                      <span className="px-2 py-1 rounded bg-emerald-950/80 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 shrink-0">
                        {project.status}
                      </span>
                    </div>

                    {/* Git Clone Box */}
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-mono flex items-center gap-1 text-emerald-400">
                          <TerminalIcon className="w-3 h-3" /> Lệnh Clone Mã Nguồn:
                        </span>
                        <button
                          onClick={() => handleCopy(`git clone https://github.com/lubpy-studio/${project.id.toLowerCase()}.git`, project.id, 'Đã sao chép lệnh git clone!')}
                          className="text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <CopyIcon className="w-2.5 h-2.5" />
                          <span>{copiedId === project.id ? 'Đã chép!' : 'Chép lệnh'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] font-mono text-gray-300 truncate bg-slate-900/60 p-1.5 rounded">
                        git clone https://github.com/lubpy-studio/{project.id.toLowerCase()}.git
                      </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-800/90 text-gray-300 text-[10px] font-mono border border-white/5"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Responsible Tech Lead */}
                    <div className="p-2.5 bg-slate-950/40 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-400">Kỹ sư Code phụ trách:</span>
                      <span className="text-amber-300 font-bold">{project.techLead}</span>
                    </div>

                    {/* Deliverable Code Packages List */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        💻 Tệp Tin Mã Nguồn &amp; Cơ Sở Dữ Liệu:
                      </span>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-emerald-500/20">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Code2Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-gray-200 truncate font-mono text-[11px]">{codeDeliverable.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 shrink-0">{codeDeliverable.size}</span>
                        </div>

                        {sqlDeliverable && (
                          <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-purple-500/20">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <DatabaseIcon className="w-4 h-4 text-purple-400 shrink-0" />
                              <span className="text-gray-200 truncate font-mono text-[11px]">{sqlDeliverable.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-purple-300 shrink-0">{sqlDeliverable.size}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Báo Cáo Đính Kèm Theo Mã Nguồn */}
                    {(() => {
                      const attachedReports = project.deliverables.filter(d => ['DOC', 'SLIDE', 'REPORT', 'VIDEO'].includes(d.type));
                      return (
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-sky-500/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-sky-400 flex items-center gap-1.5 tracking-wider">
                              <FileTextIcon className="w-3.5 h-3.5 text-sky-400" />
                              <span>📎 Báo Cáo &amp; Tài Liệu Đính Kèm ({attachedReports.length} tệp):</span>
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono border border-sky-500/20 font-bold">
                              Đồng Bộ 100%
                            </span>
                          </div>
                          <div className="space-y-1">
                            {attachedReports.map((rep, rIdx) => (
                              <div key={rIdx} className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-white/5 text-[11px]">
                                <div className="flex items-center gap-2 truncate">
                                  {rep.type === 'DOC' && <FileTextIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                                  {rep.type === 'SLIDE' && <PresentationIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                  {rep.type === 'REPORT' && <FileSpreadsheetIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                  {rep.type === 'VIDEO' && <EyeIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                                  <span className="text-gray-300 truncate font-mono text-[10px]">{rep.name}</span>
                                </div>
                                <span className="text-[9px] text-gray-500 font-mono ml-2 shrink-0">{rep.size}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Gói Mã Nguồn Riêng:</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {project.pricingPackages[0].priceVnd.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCodeRepoForDetail(project)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderTreeIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cấu Trúc Mã</span>
                      </button>

                      <button
                        onClick={() => triggerToast(`Đang nén và tải xuống toàn bộ mã nguồn ${codeDeliverable.name}...`)}
                        className="py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        <span>Tải Mã Nguồn (.zip)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW PHÂN MỤC: KHO BÁO CÁO & LUẬN VĂN (THESIS REPORTS & DOCS)          */}
      {/* ========================================================================= */}
      {mainView === 'reports' && (
        <div className="space-y-6">
          {/* Metrics riêng cho Kho Báo Cáo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
              <span className="text-[10px] uppercase font-bold text-gray-400">Báo Cáo Luận Văn Đồ Án</span>
              <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                {reportsList.filter(r => r.type === 'THESIS_DOC').length} Cuốn Luận Văn
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">100 - 130 trang chuẩn Bộ GD</div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-gray-400">Slide Thuyết Trình Bảo Vệ</span>
              <div className="text-2xl font-black font-mono text-amber-300 mt-1">
                {reportsList.filter(r => r.type === 'SLIDE').length} Bộ Slide PPTX
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Hiệu ứng bảo vệ mẫu điểm 10</div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-purple-500/30">
              <span className="text-[10px] uppercase font-bold text-gray-400">Đặc Tả SRS &amp; Kiến Trúc</span>
              <div className="text-2xl font-black font-mono text-purple-300 mt-1">
                {reportsList.filter(r => r.type === 'SRS_SPEC').length} Bản Vẽ &amp; Spec
              </div>
              <div className="text-[11px] text-purple-400 font-mono mt-0.5">IEEE 830 &amp; Draw.io Diagrams</div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-gray-400">Điểm Hội Đồng Chấm Mẫu</span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">9.8 - 10.0</div>
              <div className="text-[11px] text-emerald-300 font-mono mt-0.5">Bảo vệ xuất sắc thủ khoa</div>
            </div>
          </div>

          {/* Filter & Search Bar cho Kho Báo Cáo */}
          <div className="p-4 bg-slate-900/90 border border-white/10 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm báo cáo, luận văn tốt nghiệp, slide bảo vệ, tài liệu SRS theo đề tài, chuyên ngành đào tạo..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 font-bold hidden sm:inline">Thể loại:</span>
                <div className="flex flex-wrap gap-1.5">
                  {reportCategories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setReportType(cat.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        reportType === cat.key
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[10px] opacity-75 font-mono">({cat.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Danh Sách Các Tài Liệu & Báo Cáo Luận Văn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-900/80 border border-white/10 hover:border-sky-500/40 rounded-2xl p-5 space-y-4 shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-black border border-sky-500/30 uppercase">
                          {report.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                          {report.format}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          ★ {report.defenseScore}
                        </span>
                      </div>

                      <h3 
                        onClick={() => setSelectedReportForDetail(report)}
                        className="text-base font-black text-white hover:text-sky-300 transition-colors cursor-pointer"
                      >
                        {report.title}
                      </h3>
                      <p className="text-xs text-amber-400 font-mono">{report.targetMajor}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-sky-300 block">{report.pagesOrSlides}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{report.size}</span>
                    </div>
                  </div>

                  {/* Summary / Trích yếu */}
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                    {report.summary}
                  </p>

                  {/* Chapters Outline Mini Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Mục lục các chương chính:
                    </span>
                    <div className="space-y-1 text-[11px] text-gray-400">
                      {report.chapters.slice(0, 3).map((ch, chIdx) => (
                        <div key={chIdx} className="flex items-center gap-1.5 truncate">
                          <CheckCircle2Icon className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{ch}</span>
                        </div>
                      ))}
                      {report.chapters.length > 3 && (
                        <div className="text-[10px] text-sky-400 font-mono pl-4">
                          + {report.chapters.length - 3} chương &amp; phụ lục chi tiết khác...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Academic Standard */}
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-white/5 text-[10px] text-gray-400 flex items-center justify-between">
                    <span className="truncate">Quy cách: {report.academicStandard}</span>
                    <span className="text-amber-300 font-bold shrink-0 ml-2">{report.techLeadAuthor.split('(')[0]}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Giá tài liệu:</span>
                    <span className="text-sm font-black text-sky-400 font-mono">
                      {report.priceVnd.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReportForDetail(report)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <EyeIcon className="w-3.5 h-3.5 text-sky-400" />
                      <span>Xem Mục Lục</span>
                    </button>

                    <button
                      onClick={() => triggerToast(`Đang tải xuống báo cáo luận văn: ${report.fileName}...`)}
                      className="py-2 px-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span>Tải Báo Cáo</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW PHÂN MỤC: TRỌN BỘ COMBO (MÃ NGUỒN + BÁO CÁO ĐI KÈM)               */}
      {/* ========================================================================= */}
      {mainView === 'combo' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-indigo-950/40 border border-pink-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <BoxesIcon className="w-4 h-4 text-pink-400" />
                <span>Trọn Gói Đồ Án Hoàn Chỉnh (Mã Nguồn + Luận Văn Word + Slide Bảo Vệ)</span>
              </h3>
              <p className="text-xs text-gray-300 mt-0.5">
                Dành cho khách hàng/học viên cần bàn giao trọn gói giải pháp để bảo vệ đạt điểm 9-10.
              </p>
            </div>

            <button
              onClick={() => {
                const fullText = projectsList.map(p => `[${p.id}] ${p.title}\n- Gói Sinh Viên: ${p.pricingPackages[0].priceVnd.toLocaleString('vi-VN')}đ\n- Gói Tiêu Chuẩn: ${p.pricingPackages[1].priceVnd.toLocaleString('vi-VN')}đ\n- Gói VIP: ${p.pricingPackages[2].priceVnd.toLocaleString('vi-VN')}đ`).join('\n\n');
                handleCopy(fullText, 'quote-all', 'Đã sao chép bảng báo giá trọn gói 10 đồ án!');
              }}
              className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <CopyIcon className="w-3.5 h-3.5" />
              <span>Chép Toàn Bộ Báo Giá</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projectsList.map((project) => {
              const defaultPkg = project.pricingPackages.find(p => p.recommended) || project.pricingPackages[0];

              return (
                <div
                  key={project.id}
                  className="bg-slate-900/80 border border-white/10 hover:border-pink-500/40 rounded-2xl p-5 space-y-4 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[10px] font-black border border-pink-500/30 uppercase">
                            {project.id}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                            {project.category}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                            ★ {project.defenseScore}
                          </span>
                        </div>
                        <h3 
                          onClick={() => setSelectedProjectForDetail(project)}
                          className="text-base font-black text-white hover:text-pink-300 transition-colors cursor-pointer mt-1"
                        >
                          {project.title}
                        </h3>
                        <p className="text-xs text-sky-400 font-medium">{project.subtitle}</p>
                      </div>

                      {project.status === 'Hot' && (
                        <span className="px-2 py-1 rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-white font-black text-[9px] uppercase tracking-wider shrink-0 shadow">
                          🔥 Bán Chạy
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Deliverables Breakdown: Code + Report + Slide */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Trọn bộ bàn giao gồm ({project.deliverables.length} tài nguyên):
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {project.deliverables.map((d, didx) => (
                          <div key={didx} className="flex items-center gap-1.5 text-gray-300 bg-slate-950/40 p-1.5 rounded border border-white/5 truncate">
                            {d.type === 'SOURCE' && <Code2Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {d.type === 'DOC' && <FileTextIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                            {d.type === 'SLIDE' && <PresentationIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            {d.type === 'DATA' && <DatabaseIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            {d.type === 'REPORT' && <LayersIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                            {d.type === 'VIDEO' && <SparklesIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                            <span className="truncate">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Footer */}
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex justify-between items-center bg-gradient-to-r from-pink-950/30 to-indigo-950/30 p-2.5 rounded-xl border border-pink-500/20">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase">Giá bán trọn bộ (Gói Tiêu Chuẩn):</span>
                        <span className="text-base font-black text-pink-400 font-mono">
                          {defaultPkg.priceVnd.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">3 Gói lựa chọn:</span>
                        <span className="text-[11px] text-emerald-400 font-bold">Từ 850.000đ - 2.6tr</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedProjectForDetail(project)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <EyeIcon className="w-3.5 h-3.5 text-sky-400" />
                        <span>Xem Chi Tiết &amp; 3 Gói</span>
                      </button>

                      <button
                        onClick={() => triggerToast(`Bắt đầu tải xuống trọn bộ tài liệu đồ án ${project.id}: Source, Báo cáo và Slide.`)}
                        className="py-2 px-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        <span>Tải Trọn Bộ Đồ Án</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CHI TIẾT KHO MÃ NGUỒN (SOURCE CODE REPO DETAILS)                 */}
      {/* ========================================================================= */}
      {selectedCodeRepoForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedCodeRepoForDetail(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-slate-800 border border-white/10 cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black border border-emerald-500/30 uppercase">
                  {selectedCodeRepoForDetail.id}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  {selectedCodeRepoForDetail.category}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-2">
                {selectedCodeRepoForDetail.title}
              </h3>
            </div>

            {/* Git Clone box */}
            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-mono flex items-center gap-1.5 text-emerald-400">
                  <TerminalIcon className="w-3.5 h-3.5" /> Lệnh Clone Git Repository:
                </span>
                <button
                  onClick={() => handleCopy(`git clone https://github.com/lubpy-studio/${selectedCodeRepoForDetail.id.toLowerCase()}.git`, 'modal-git', 'Đã sao chép lệnh clone!')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CopyIcon className="w-3 h-3" />
                  <span>Sao chép</span>
                </button>
              </div>
              <div className="text-xs font-mono text-emerald-300 bg-slate-900 p-2 rounded border border-white/5 truncate">
                git clone https://github.com/lubpy-studio/{selectedCodeRepoForDetail.id.toLowerCase()}.git
              </div>
            </div>

            {/* Folder Structure */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <FolderTreeIcon className="w-4 h-4 text-emerald-400" />
                <span>Cấu Trúc Thư Mục Mã Nguồn</span>
              </h4>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5 font-mono text-xs text-gray-300 space-y-1">
                <div>📁 /{selectedCodeRepoForDetail.id.toLowerCase()}</div>
                <div className="pl-4">├── 📁 frontend/ (React / Next.js / Flutter)</div>
                <div className="pl-4">├── 📁 backend-api/ (Services &amp; Controllers)</div>
                <div className="pl-4">├── 📁 database/ (PostgreSQL Schema &amp; Seed Data)</div>
                <div className="pl-4">├── 📄 docker-compose.yml</div>
                <div className="pl-4">└── 📄 README.md (Hướng dẫn khởi động chi tiết)</div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-400 block">Công Nghệ Sử Dụng:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCodeRepoForDetail.techStack.map((tech, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-gray-200 text-xs font-mono border border-white/5">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setSelectedCodeRepoForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl border border-white/10 cursor-pointer"
              >
                Đóng Lại
              </button>
              <button
                onClick={() => {
                  triggerToast(`Đang tải toàn bộ mã nguồn của ${selectedCodeRepoForDetail.id}...`);
                  setSelectedCodeRepoForDetail(null);
                }}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>Tải Mã Nguồn (.zip)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHI TIẾT BÁO CÁO & LUẬN VĂN (THESIS REPORT DETAILS)              */}
      {/* ========================================================================= */}
      {selectedReportForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-sky-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedReportForDetail(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-slate-800 border border-white/10 cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-xs font-black border border-sky-500/30 uppercase">
                  {selectedReportForDetail.id}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  {selectedReportForDetail.format}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  Điểm: {selectedReportForDetail.defenseScore}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-2 leading-snug">
                {selectedReportForDetail.title}
              </h3>
              <p className="text-xs text-sky-400 font-mono mt-0.5">{selectedReportForDetail.projectTitle}</p>
            </div>

            {/* Quick Meta */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block">Dung lượng:</span>
                <span className="font-mono text-white font-bold">{selectedReportForDetail.size}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Độ dài:</span>
                <span className="font-mono text-sky-300 font-bold">{selectedReportForDetail.pagesOrSlides}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Chuyên ngành:</span>
                <span className="text-gray-200 truncate block">{selectedReportForDetail.targetMajor}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Tác giả/Cố vấn:</span>
                <span className="text-amber-300 font-bold truncate block">{selectedReportForDetail.techLeadAuthor.split('(')[0]}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Trích Yếu Đề Tài:</h4>
              <p className="text-xs text-gray-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
                {selectedReportForDetail.summary}
              </p>
            </div>

            {/* Detailed Chapters Outline */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2Icon className="w-4 h-4 text-sky-400" />
                <span>Mục Lục Toàn Bộ Các Chương Báo Cáo</span>
              </h4>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5 space-y-2 text-xs">
                {selectedReportForDetail.chapters.map((chap, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-gray-300">
                    <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                      0{idx + 1}
                    </span>
                    <span className="leading-snug">{chap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic standard box */}
            <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5 text-[11px] text-gray-400 flex items-center gap-2">
              <GraduationCapIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Quy cách: {selectedReportForDetail.academicStandard}</span>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <div className="text-xs font-mono">
                <span className="text-gray-400">Đơn giá tài liệu: </span>
                <span className="text-sky-400 font-black text-sm">{selectedReportForDetail.priceVnd.toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReportForDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl border border-white/10 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    triggerToast(`Đang tải file ${selectedReportForDetail.fileName}...`);
                    setSelectedReportForDetail(null);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Tải Báo Cáo Xuống</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHI TIẾT TRỌN BỘ ĐỒ ÁN & BẢNG GIÁ 3 GÓI                          */}
      {/* ========================================================================= */}
      {selectedProjectForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-pink-500/40 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedProjectForDetail(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-slate-800 border border-white/10 cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 font-mono text-xs font-black border border-pink-500/30 uppercase">
                  {selectedProjectForDetail.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  {selectedProjectForDetail.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                  Điểm bảo vệ: {selectedProjectForDetail.defenseScore}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-2 leading-snug">
                {selectedProjectForDetail.title}
              </h3>
              <p className="text-xs text-sky-300 font-mono mt-0.5">{selectedProjectForDetail.subtitle}</p>
            </div>

            {/* Responsible Tech Lead & Team */}
            <div className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[11px] text-gray-400 block uppercase font-bold">Kỹ sư Trưởng phụ trách bàn giao:</span>
                <span className="text-sm font-black text-amber-300">{selectedProjectForDetail.techLead}</span>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedProjectForDetail.assignedTechTeam}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-gray-400 block uppercase font-bold">Đối tượng phù hợp:</span>
                <span className="text-xs text-gray-200">{selectedProjectForDetail.targetStudents}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-pink-400" />
                <span>Mô Tả Chuyên Môn &amp; Tính Năng Nổi Bật Đồ Án</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-white/5">
                {selectedProjectForDetail.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedProjectForDetail.keyFeatures.map((feat, fidx) => (
                  <div key={fidx} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables Files List */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <LayersIcon className="w-4 h-4 text-sky-400" />
                <span>Trọn Bộ Files &amp; Tài Liệu Bàn Giao ({selectedProjectForDetail.deliverables.length} tệp tin)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedProjectForDetail.deliverables.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      {item.type === 'SOURCE' && <Code2Icon className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {item.type === 'DOC' && <FileTextIcon className="w-4 h-4 text-sky-400 shrink-0" />}
                      {item.type === 'SLIDE' && <PresentationIcon className="w-4 h-4 text-amber-400 shrink-0" />}
                      {item.type === 'DATA' && <DatabaseIcon className="w-4 h-4 text-purple-400 shrink-0" />}
                      {item.type === 'REPORT' && <LayersIcon className="w-4 h-4 text-pink-400 shrink-0" />}
                      {item.type === 'VIDEO' && <SparklesIcon className="w-4 h-4 text-indigo-400 shrink-0" />}
                      <div className="truncate">
                        <span className="font-bold text-gray-200 block truncate">{item.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{item.size} • {item.type}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerToast(`Đang tải file ${item.name}...`)}
                      className="p-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-lg shrink-0 border border-pink-500/30 cursor-pointer"
                      title="Tải xuống tệp này"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 PRICING TIERS FOR SALE */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSignIcon className="w-4 h-4 text-amber-400" />
                <span>Bảng Giá 3 Gói Bán &amp; Bàn Giao Cho Người Dùng</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {selectedProjectForDetail.pricingPackages.map((pkg, pidx) => (
                  <div
                    key={pidx}
                    className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                      pkg.recommended
                        ? 'bg-gradient-to-b from-pink-950/40 via-slate-900 to-slate-950 border-pink-500 shadow-xl'
                        : 'bg-slate-950/60 border-white/10'
                    }`}
                  >
                    <div className="space-y-2">
                      {pkg.recommended && (
                        <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white font-bold text-[9px] uppercase tracking-wider inline-block">
                          Khuyên Dùng Cho Sinh Viên
                        </span>
                      )}
                      <h5 className="text-xs font-black text-white">{pkg.name}</h5>
                      <div className="text-lg font-black text-pink-400 font-mono">
                        {pkg.priceVnd.toLocaleString('vi-VN')} đ
                      </div>
                      <p className="text-[11px] text-gray-400 leading-snug">{pkg.description}</p>

                      <div className="space-y-1 pt-2 border-t border-white/5">
                        {pkg.features.map((feat, fidx) => (
                          <div key={fidx} className="flex items-start gap-1.5 text-[10px] text-gray-300">
                            <CheckIcon className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const quoteText = `BÁO GIÁ ĐỒ ÁN LUBPY STUDIO:\n- Mã đồ án: ${selectedProjectForDetail.id}\n- Tên đề tài: ${selectedProjectForDetail.title}\n- Gói chọn: ${pkg.name}\n- Đơn giá: ${pkg.priceVnd.toLocaleString('vi-VN')} VNĐ\n- Bàn giao: ${pkg.features.join(', ')}\n- Hỗ trợ bởi: ${selectedProjectForDetail.techLead}`;
                        handleCopy(quoteText, `pkg-${pidx}`, `Đã sao chép báo giá [${pkg.name}]!`);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        pkg.recommended
                          ? 'bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 text-white shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10'
                      }`}
                    >
                      Xuất Báo Giá Gói Này
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const info = `[${selectedProjectForDetail.id}] ${selectedProjectForDetail.title}\nCông nghệ: ${selectedProjectForDetail.techStack.join(', ')}\nĐiểm bảo vệ: ${selectedProjectForDetail.defenseScore}\nKỹ sư phụ trách: ${selectedProjectForDetail.techLead}`;
                    handleCopy(info, 'modal-summary', 'Đã sao chép tóm tắt thông tin đồ án!');
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl border border-white/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>Sao Chép Tóm Tắt</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedProjectForDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl border border-white/10 cursor-pointer"
                >
                  Đóng Lại
                </button>

                <button
                  onClick={() => {
                    triggerToast(`Tải xuống trọn bộ ZIP đồ án ${selectedProjectForDetail.id} thành công!`);
                    setSelectedProjectForDetail(null);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Tải Toàn Bộ Tệp Bàn Giao</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
