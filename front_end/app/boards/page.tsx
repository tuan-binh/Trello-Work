"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BoardItem {
  id: string;
  title: string;
  workspace: string;
  bgGradient: string;
  starred: boolean;
  recentViewed?: string;
}

const DEFAULT_BOARDS: BoardItem[] = [
  {
    id: "1",
    title: "Dự Án Phát Triển Trello Work 🚀",
    workspace: "Không gian làm việc chính",
    bgGradient: "from-blue-600 to-indigo-700",
    starred: true,
    recentViewed: "Vừa xong",
  },
  {
    id: "2",
    title: "Sprint Planning - Q4/2026",
    workspace: "Không gian làm việc chính",
    bgGradient: "from-emerald-500 to-teal-700",
    starred: true,
    recentViewed: "2 giờ trước",
  },
  {
    id: "3",
    title: "Thiết Kế UI/UX & Design System",
    workspace: "Đội ngũ Design",
    bgGradient: "from-purple-600 to-pink-600",
    starred: false,
    recentViewed: "Hôm qua",
  },
  {
    id: "4",
    title: "Bug Tracking & Hotfixes 🐞",
    workspace: "Không gian làm việc chính",
    bgGradient: "from-amber-500 to-orange-600",
    starred: false,
    recentViewed: "3 ngày trước",
  },
  {
    id: "5",
    title: "Kế Hoạch Marketing & Ra Mắt",
    workspace: "Marketing Hub",
    bgGradient: "from-rose-500 to-red-700",
    starred: false,
  },
];

export default function BoardsDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    fullName?: string;
    email?: string;
    avatarUrl?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"boards" | "templates" | "home">(
    "boards"
  );
  const [boards, setBoards] = useState<BoardItem[]>(DEFAULT_BOARDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardColor, setNewBoardColor] = useState(
    "from-blue-600 to-indigo-700"
  );
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    // Lấy thông tin user đăng nhập từ localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        setCurrentUser(null);
      }
    }

    // Lắng nghe phím ESC để đóng Modal tạo bảng và Dropdown
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCreateModalOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, starred: !b.starred } : b))
    );
  };

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    const newBoard: BoardItem = {
      id: Date.now().toString(),
      title: newBoardTitle.trim(),
      workspace: "Không gian làm việc chính",
      bgGradient: newBoardColor,
      starred: false,
      recentViewed: "Vừa xong",
    };

    setBoards([newBoard, ...boards]);
    setNewBoardTitle("");
    setIsCreateModalOpen(false);
  };

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const starredBoards = filteredBoards.filter((b) => b.starred);
  const recentBoards = filteredBoards.slice(0, 4);

  const colorOptions = [
    { name: "Ocean Blue", class: "from-blue-600 to-indigo-700" },
    { name: "Emerald Green", class: "from-emerald-500 to-teal-700" },
    { name: "Sunset Orange", class: "from-amber-500 to-orange-600" },
    { name: "Purple Dream", class: "from-purple-600 to-pink-600" },
    { name: "Ruby Red", class: "from-rose-500 to-red-700" },
    { name: "Dark Modern", class: "from-slate-700 to-slate-900" },
  ];

  const userInitial =
    currentUser?.fullName?.charAt(0).toUpperCase() ||
    currentUser?.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. TOP NAVBAR (Trello Style) */}
      <header className="h-13 bg-[#0c66e4] text-white flex items-center justify-between px-4 sticky top-0 z-40 border-b border-blue-600 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Trello App Switcher Icon */}
          <button className="p-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
            </svg>
          </button>

          {/* Logo */}
          <Link
            href="/boards"
            className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
          >
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-3.5 bg-[#0c66e4] rounded-xs"></span>
                <span className="w-1.5 h-2.5 bg-[#0c66e4] rounded-xs"></span>
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Trello Work
            </span>
          </Link>

          {/* Nav Dropdowns (Workspaces, Recent, Starred, Create) */}
          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer">
              Không gian làm việc
              <svg
                className="w-4 h-4 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer">
              Gần đây
              <svg
                className="w-4 h-4 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer">
              Đã đánh dấu sao
              <svg
                className="w-4 h-4 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Create Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white font-medium px-3.5 py-1.5 rounded-md text-sm transition-all flex items-center gap-1.5 ml-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Tạo mới
            </button>
          </div>
        </div>

        {/* Search Bar & Profile */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block w-52 md:w-64">
            <input
              type="text"
              placeholder="Tìm kiếm bảng, thẻ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/20 focus:bg-white text-white focus:text-slate-900 placeholder-white/80 focus:placeholder-slate-400 text-xs pl-8 pr-3 py-1.5 rounded-md border border-white/20 focus:border-transparent outline-none transition-all"
            />
            <svg
              className="w-4 h-4 absolute left-2.5 top-2 text-white/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Notifications Icon */}
          <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer relative">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="w-2 h-2 bg-red-400 rounded-full absolute top-1.5 right-1.5"></span>
          </button>

          {/* User Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-8 h-8 rounded-full bg-indigo-800 text-white font-bold text-xs flex items-center justify-center border-2 border-white/40 hover:border-white transition-all cursor-pointer overflow-hidden"
            >
              {currentUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Tài khoản
                  </p>
                  <p className="font-bold text-sm text-slate-900 mt-1 truncate">
                    {currentUser?.fullName || "Người dùng"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser?.email || "Chưa đăng nhập"}
                  </p>
                </div>

                <div className="py-1">
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Hồ sơ và chế độ hiển thị
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Hoạt động
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cài đặt
                  </a>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT (Sidebar + Content) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex gap-8">
        {/* Left Sidebar */}
        <aside className="w-60 shrink-0 hidden md:block">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("boards")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "boards"
                  ? "bg-blue-50 text-[#0c66e4]"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="3" y="3" width="7" height="15" rx="1.5" />
                <rect x="14" y="3" width="7" height="10" rx="1.5" />
              </svg>
              Các bảng (Boards)
            </button>

            <button
              onClick={() => setActiveTab("templates")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "templates"
                  ? "bg-blue-50 text-[#0c66e4]"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
              Mẫu bảng (Templates)
            </button>

            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "home"
                  ? "bg-blue-50 text-[#0c66e4]"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Trang tổng quan
            </button>
          </nav>

          <hr className="my-5 border-slate-200" />

          {/* Workspaces Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-2">
              <span>Không gian làm việc</span>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="hover:text-slate-800 p-0.5 rounded cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-800 bg-slate-200/60 rounded-lg">
                <span className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  K
                </span>
                <span className="truncate">Không gian chính</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                <span className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center">
                  D
                </span>
                <span className="truncate">Đội ngũ Design</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                <span className="w-6 h-6 rounded bg-gradient-to-br from-rose-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center">
                  M
                </span>
                <span className="truncate">Marketing Hub</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {/* Welcome User Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-md flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Xin chào, {currentUser?.fullName || "Bạn"}! 👋
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Chào mừng bạn trở lại với Trello Work. Xem các bảng và thẻ việc
                hôm nay.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white text-[#0c66e4] font-bold text-sm rounded-xl shadow hover:bg-blue-50 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Tạo bảng mới
            </button>
          </div>

          {/* Section: Starred Boards */}
          {starredBoards.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                <svg
                  className="w-5 h-5 text-amber-500 fill-amber-500"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <h2>Bảng đã đánh dấu sao</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {starredBoards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/boards/${board.id}`}
                    className={`h-28 rounded-xl p-3 text-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-br ${board.bgGradient} relative group`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm leading-snug line-clamp-2">
                        {board.title}
                      </span>
                      <button
                        onClick={(e) => toggleStar(board.id, e)}
                        className="text-amber-300 hover:text-amber-100 transition-colors cursor-pointer"
                        title="Bỏ đánh dấu sao"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-[11px] text-white/80 font-medium truncate">
                      {board.workspace}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Section: Recently Viewed */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2>Xem gần đây</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentBoards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className={`h-28 rounded-xl p-3 text-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-br ${board.bgGradient} relative group`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm leading-snug line-clamp-2">
                      {board.title}
                    </span>
                    <button
                      onClick={(e) => toggleStar(board.id, e)}
                      className={`transition-all cursor-pointer ${
                        board.starred
                          ? "text-amber-300 fill-amber-300"
                          : "opacity-0 group-hover:opacity-100 text-white/80 hover:text-white"
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 ${board.starred ? "fill-current" : ""}`}
                        fill={board.starred ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-white/80 font-medium">
                    <span className="truncate">{board.workspace}</span>
                    {board.recentViewed && <span>{board.recentViewed}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: Your Workspaces & All Boards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#0c66e4] text-white font-extrabold text-sm flex items-center justify-center">
                  K
                </span>
                <h2 className="text-lg font-bold text-slate-800">
                  Không gian làm việc chính
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBoards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className={`h-28 rounded-xl p-3 text-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-br ${board.bgGradient} relative group`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm leading-snug line-clamp-2">
                      {board.title}
                    </span>
                    <button
                      onClick={(e) => toggleStar(board.id, e)}
                      className={`transition-all cursor-pointer ${
                        board.starred
                          ? "text-amber-300 fill-amber-300"
                          : "opacity-0 group-hover:opacity-100 text-white/80 hover:text-white"
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 ${board.starred ? "fill-current" : ""}`}
                        fill={board.starred ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  </div>
                  <span className="text-[11px] text-white/80 font-medium truncate">
                    {board.workspace}
                  </span>
                </Link>
              ))}

              {/* Create Board Tile Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0c66e4] bg-slate-100/70 hover:bg-blue-50/50 text-slate-600 hover:text-[#0c66e4] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer font-medium text-sm group"
              >
                <div className="w-7 h-7 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-500 group-hover:text-[#0c66e4] group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span>Tạo bảng mới</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* 3. MODAL TẠO BẢNG MỚI */}
      {isCreateModalOpen && (
        <div
          onClick={() => setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-100 cursor-default"
          >
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              Tạo bảng mới
            </h3>

            {/* Preview Mini Board */}
            <div
              className={`h-24 rounded-xl p-3 text-white flex flex-col justify-between mb-4 bg-gradient-to-br ${newBoardColor} shadow-inner transition-colors duration-200`}
            >
              <div className="font-bold text-sm">
                {newBoardTitle.trim() || "Tiêu đề bảng của bạn..."}
              </div>
              <div className="flex gap-1.5">
                <div className="w-8 h-10 bg-white/30 rounded-xs"></div>
                <div className="w-8 h-7 bg-white/30 rounded-xs"></div>
                <div className="w-8 h-12 bg-white/30 rounded-xs"></div>
              </div>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Màu nền bảng
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.class}
                      type="button"
                      onClick={() => setNewBoardColor(c.class)}
                      className={`h-7 rounded-md bg-gradient-to-br ${c.class} cursor-pointer transition-transform ${
                        newBoardColor === c.class
                          ? "ring-2 ring-offset-2 ring-[#0c66e4] scale-105"
                          : "hover:opacity-90"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tiêu đề bảng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ví dụ: Dự án phát triển Website..."
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c66e4] focus:border-transparent"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newBoardTitle.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow cursor-pointer transition-all"
                >
                  Tạo bảng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
