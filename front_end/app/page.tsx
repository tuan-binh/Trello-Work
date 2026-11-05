import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header / Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#0052cc] rounded-lg flex items-center justify-center text-white shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7" height="15" rx="1.5" />
              <rect x="14" y="3" width="7" height="10" rx="1.5" />
            </svg>
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">
            Trello Work
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#0052cc] transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#0052cc] hover:bg-[#0047b3] rounded-lg shadow-sm transition-all"
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 max-w-4xl mx-auto">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-100 text-[#0052cc] mb-6">
          Hệ thống quản trị công việc Kanban
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Quản lý dự án, cộng tác nhóm hiệu quả cùng{" "}
          <span className="text-[#0052cc]">Trello Work</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl">
          Tập trung các bảng công việc, danh sách và thẻ bài nhiệm vụ vào một nơi
          duy nhất. Đơn giản hóa quy trình và tăng tốc độ hoàn thành mục tiêu.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-[#0052cc] hover:bg-[#0047b3] text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-500/25 transition-all text-center"
          >
            Tạo tài khoản mới
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-base rounded-xl border border-slate-300 shadow-sm transition-all text-center"
          >
            Đăng nhập tài khoản
          </Link>
        </div>

        {/* Mockup Preview */}
        <div className="mt-16 w-full bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-slate-200">
          <div className="flex gap-4 overflow-x-auto pb-4 text-left">
            {/* Column 1 */}
            <div className="w-64 shrink-0 bg-slate-100 rounded-xl p-3 border border-slate-200">
              <div className="font-bold text-xs uppercase tracking-wide text-slate-700 mb-3 flex items-center justify-between">
                <span>Cần làm (To Do)</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[11px]">
                  3
                </span>
              </div>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/80 text-sm font-medium text-slate-800">
                  <div className="h-1.5 w-8 bg-blue-500 rounded-full mb-2"></div>
                  Thiết kế giao diện đăng nhập & đăng ký
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/80 text-sm font-medium text-slate-800">
                  <div className="h-1.5 w-8 bg-emerald-500 rounded-full mb-2"></div>
                  Viết tài liệu API Authentication
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="w-64 shrink-0 bg-slate-100 rounded-xl p-3 border border-slate-200">
              <div className="font-bold text-xs uppercase tracking-wide text-slate-700 mb-3 flex items-center justify-between">
                <span>Đang thực hiện (In Progress)</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[11px]">
                  1
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/80 text-sm font-medium text-slate-800">
                <div className="h-1.5 w-8 bg-amber-500 rounded-full mb-2"></div>
                Tích hợp Spring Security với JWT
              </div>
            </div>

            {/* Column 3 */}
            <div className="w-64 shrink-0 bg-slate-100 rounded-xl p-3 border border-slate-200">
              <div className="font-bold text-xs uppercase tracking-wide text-slate-700 mb-3 flex items-center justify-between">
                <span>Hoàn thành (Done)</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[11px]">
                  2
                </span>
              </div>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/80 text-sm font-medium text-slate-800">
                  <div className="h-1.5 w-8 bg-purple-500 rounded-full mb-2"></div>
                  Khởi tạo CSDL MySQL & Flyway
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/80 text-sm font-medium text-slate-800">
                  <div className="h-1.5 w-8 bg-sky-500 rounded-full mb-2"></div>
                  Cấu hình Nginx SSL Reverse Proxy
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © 2026 Trello Work. Đồ án nâng cao năng suất quản lý công việc nhóm.
      </footer>
    </div>
  );
}
