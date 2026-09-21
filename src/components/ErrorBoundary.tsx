import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      // Clear potentially malformed local states while keeping safe essentials
      const safeKeys = ['lubpy_language'];
      const preserved: Record<string, string> = {};
      safeKeys.forEach(k => {
        const v = localStorage.getItem(k);
        if (v) preserved[k] = v;
      });
      localStorage.clear();
      sessionStorage.clear();
      Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div id="app_error_boundary_container" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Hệ thống phát hiện lỗi không mong muốn
              </h2>
              <p className="text-sm text-slate-400">
                Ứng dụng đã tự động ngăn ngừa lỗi gián đoạn để bảo vệ phiên làm việc của bạn.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left overflow-x-auto max-h-36 text-xs text-red-300/90 font-mono">
                {this.state.error.message || 'Lỗi không xác định'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                id="btn_error_retry"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại</span>
              </button>
              <button
                id="btn_error_reload"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Tải lại trang</span>
              </button>
            </div>

            <button
              id="btn_error_clear_cache"
              onClick={this.handleClearAndReload}
              className="text-xs text-slate-500 hover:text-slate-400 underline underline-offset-2 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Khôi phục dữ liệu ban đầu và tải lại</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
