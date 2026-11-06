"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextField } from "@mui/material";

interface BoardItem {
  id: string;
  title: string;
  workspace: string;
  bgGradient?: string;
  bgImage?: string;
  starred: boolean;
  recentViewed?: string;
}


const PHOTO_OPTIONS = [
  {
    id: "p1",
    name: "City Skyline Night",
    thumb: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "p2",
    name: "Mountain Horizon",
    thumb: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "p3",
    name: "Golden Sunset City",
    thumb: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "p4",
    name: "Dark Neon Lights",
    thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85",
  },
];

const COLOR_OPTIONS = [
  { id: "c1", name: "Xanh dương Trello", class: "from-blue-600 to-indigo-700", preview: "bg-[#0c66e4]" },
  { id: "c2", name: "Xanh ngọc biển", class: "from-sky-500 to-blue-600", preview: "bg-[#00c7e5]" },
  { id: "c3", name: "Xanh lá tươi", class: "from-emerald-500 to-teal-700", preview: "bg-[#1f845a]" },
  { id: "c4", name: "Cam hoàng hôn", class: "from-amber-500 to-orange-600", preview: "bg-[#e56910]" },
  { id: "c5", name: "Tím mộng mơ", class: "from-indigo-600 to-purple-700", preview: "bg-[#5e4db2]" },
  { id: "c6", name: "Đỏ hồng quyến rũ", class: "from-rose-500 to-pink-600", preview: "bg-[#c9372c]" },
];

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
  const [boardBgType, setBoardBgType] = useState<"photo" | "color">("photo");
  const [selectedPhoto, setSelectedPhoto] = useState(PHOTO_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [boardVisibility, setBoardVisibility] = useState("Không gian làm việc");
  const [boardTitleTouched, setBoardTitleTouched] = useState(false);
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

    // Đọc danh sách bảng tùy chỉnh từ localStorage
    try {
      const customBoardsStr = localStorage.getItem("trello_custom_boards");
      if (customBoardsStr) {
        const customBoards: BoardItem[] = JSON.parse(customBoardsStr);
        setBoards((prev) => {
          const ids = new Set(prev.map((b) => b.id));
          const toAdd = customBoards.filter((b) => !ids.has(b.id));
          return [...toAdd, ...prev];
        });
      }
    } catch {}

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
    if (!newBoardTitle.trim()) {
      setBoardTitleTouched(true);
      return;
    }

    const newBoard: BoardItem = {
      id: Date.now().toString(),
      title: newBoardTitle.trim(),
      workspace: "Không gian làm việc chính",
      bgGradient: boardBgType === "color" ? selectedColor.class : undefined,
      bgImage: boardBgType === "photo" ? selectedPhoto.full : undefined,
      starred: false,
      recentViewed: "Vừa xong",
    };

    setBoards([newBoard, ...boards]);
    try {
      const customBoardsStr = localStorage.getItem("trello_custom_boards");
      const list = customBoardsStr ? JSON.parse(customBoardsStr) : [];
      list.unshift(newBoard);
      localStorage.setItem("trello_custom_boards", JSON.stringify(list));
    } catch {}
    setNewBoardTitle("");
    setBoardTitleTouched(false);
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
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm kiếm bảng, thẻ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  color: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ffffff",
                  },
                },
                "& input": {
                  padding: "6px 10px",
                  "&::placeholder": {
                    color: "rgba(255, 255, 255, 0.8)",
                    opacity: 1,
                  },
                },
              }}
            />
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
                    style={board.bgImage ? { backgroundImage: `url("${board.bgImage}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                    className={`h-28 rounded-xl p-3 text-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${board.bgImage ? "bg-slate-900" : `bg-gradient-to-br ${board.bgGradient || "from-blue-600 to-indigo-700"}`} relative group`}
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
                  style={board.bgImage ? { backgroundImage: `url("${board.bgImage}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  className={`h-28 rounded-xl p-3 text-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${board.bgImage ? "bg-slate-900" : `bg-gradient-to-br ${board.bgGradient || "from-blue-600 to-indigo-700"}`} relative group`}
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
                  style={board.bgImage ? { backgroundImage: `url("${board.bgImage}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  className={`h-28 rounded-xl p-3 text-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${board.bgImage ? "bg-slate-900" : `bg-gradient-to-br ${board.bgGradient || "from-blue-600 to-indigo-700"}`} relative group`}
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

      {/* 3. MODAL TẠO BẢNG MỚI (THEME SÁNG TRẮNG CHUẨN ĐỒNG BỘ TRELLO) */}
      {isCreateModalOpen && (
        <div
          onClick={() => {
            setIsCreateModalOpen(false);
            setBoardTitleTouched(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[304px] sm:w-[320px] bg-white text-slate-800 rounded-2xl shadow-2xl p-4 border border-slate-200 cursor-default select-none animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar"
          >
            {/* Header: < Tạo bảng ✕ */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 relative">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setBoardTitleTouched(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Quay lại"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="font-bold text-sm text-slate-800 flex-1 text-center">
                Tạo bảng
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setBoardTitleTouched(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Đóng"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Board Preview Card with 3 Columns Skeleton & Trello Board Icon */}
            <div
              style={
                boardBgType === "photo"
                  ? {
                      backgroundImage: `url("${selectedPhoto.thumb}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
              className={`w-full h-[120px] rounded-lg relative overflow-hidden flex flex-col items-center justify-center p-3 mb-4 shadow-sm transition-all ${
                boardBgType === "color"
                  ? `bg-gradient-to-br ${selectedColor.class}`
                  : "bg-slate-800"
              }`}
            >
              {/* Overlay tint */}
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />

              {/* Trello App Switcher Header Icon */}
              <div className="relative z-10 w-4 h-4 bg-white/95 rounded-xs mb-1.5 flex items-center justify-center shadow-xs">
                <div className="flex gap-0.5">
                  <span className="w-1 h-2.5 bg-[#0c66e4] rounded-xs" />
                  <span className="w-1 h-1.5 bg-[#0c66e4] rounded-xs" />
                </div>
              </div>

              {/* 3 Columns Kanban Skeleton */}
              <div className="relative z-10 flex gap-2 w-full max-w-[210px] justify-center items-start">
                {/* Column 1 */}
                <div className="flex-1 bg-white/95 rounded-sm p-1 shadow-xs space-y-1">
                  <div className="h-1.5 bg-slate-400/40 rounded-xs w-3/4" />
                  <div className="h-2.5 bg-slate-300/60 rounded-xs w-full" />
                  <div className="h-2.5 bg-slate-300/60 rounded-xs w-full" />
                  <div className="h-1.5 bg-slate-300/40 rounded-xs w-1/2" />
                </div>
                {/* Column 2 */}
                <div className="flex-1 bg-white/95 rounded-sm p-1 shadow-xs space-y-1">
                  <div className="h-1.5 bg-slate-400/40 rounded-xs w-2/3" />
                  <div className="h-2.5 bg-slate-300/60 rounded-xs w-full" />
                  <div className="h-1.5 bg-slate-300/40 rounded-xs w-4/5" />
                </div>
                {/* Column 3 */}
                <div className="flex-1 bg-white/95 rounded-sm p-1 shadow-xs space-y-1">
                  <div className="h-1.5 bg-slate-400/40 rounded-xs w-3/4" />
                  <div className="h-2.5 bg-slate-300/60 rounded-xs w-full" />
                  <div className="h-2.5 bg-slate-300/60 rounded-xs w-full" />
                  <div className="h-2.5 bg-slate-300/60 rounded-xs w-3/4" />
                </div>
              </div>
            </div>

            {/* Phông nền Section */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phông nền
              </label>

              {/* 4 Photos Grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {PHOTO_OPTIONS.map((photo) => {
                  const isSelected = boardBgType === "photo" && selectedPhoto.id === photo.id;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => {
                        setBoardBgType("photo");
                        setSelectedPhoto(photo);
                      }}
                      style={{
                        backgroundImage: `url("${photo.thumb}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                      className={`h-10 rounded-md relative overflow-hidden transition-all cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-[#0c66e4] ring-offset-1 ring-offset-white scale-102"
                          : "hover:opacity-85"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 6 Colors Grid (Đầy đủ 6 màu đa dạng chuẩn Trello) */}
              <div className="grid grid-cols-6 gap-1.5">
                {COLOR_OPTIONS.map((color) => {
                  const isSelected = boardBgType === "color" && selectedColor.id === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      title={color.name}
                      onClick={() => {
                        setBoardBgType("color");
                        setSelectedColor(color);
                      }}
                      className={`h-7 rounded-md ${color.preview} transition-all cursor-pointer relative shadow-2xs ${
                        isSelected
                          ? "ring-2 ring-[#0c66e4] ring-offset-1 ring-offset-white scale-102"
                          : "hover:opacity-90"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleCreateBoard} className="space-y-3.5">
              {/* Tiêu đề bảng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề bảng <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Nhập tiêu đề bảng..."
                  value={newBoardTitle}
                  onChange={(e) => {
                    setNewBoardTitle(e.target.value);
                    if (e.target.value.trim()) {
                      setBoardTitleTouched(false);
                    }
                  }}
                  onBlur={() => {
                    if (!newBoardTitle.trim()) {
                      setBoardTitleTouched(true);
                    }
                  }}
                  className={`w-full bg-slate-50 focus:bg-white text-slate-800 text-xs px-3 py-2 rounded-md outline-none transition-all border ${
                    boardTitleTouched && !newBoardTitle.trim()
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20"
                  }`}
                />
                {/* Error requirement message */}
                {boardTitleTouched && !newBoardTitle.trim() && (
                  <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1 font-medium">
                    <span>👋</span> Tiêu đề bảng là bắt buộc
                  </p>
                )}
              </div>

              {/* Quyền xem Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quyền xem
                </label>
                <div className="relative">
                  <select
                    value={boardVisibility}
                    onChange={(e) => setBoardVisibility(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-700 text-xs px-3 py-2 rounded-md outline-none appearance-none cursor-pointer focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20"
                  >
                    <option value="Không gian làm việc">Không gian làm việc</option>
                    <option value="Riêng tư">Riêng tư</option>
                    <option value="Công khai">Công khai</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Workspace Quota Notice */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Không gian làm việc này còn 3 bảng còn lại. Các Không gian làm việc miễn phí chỉ có thể có 10 bảng mở.
              </p>

              {/* Action Buttons: Tạo mới & Bắt đầu với Mẫu */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={!newBoardTitle.trim()}
                  className={`w-full py-2 px-4 rounded-md text-xs font-semibold transition-all ${
                    newBoardTitle.trim()
                      ? "bg-[#0c66e4] hover:bg-[#0055cc] text-white cursor-pointer shadow-xs"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                  }`}
                >
                  Tạo mới
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setActiveTab("templates");
                  }}
                  className="w-full py-2 px-4 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  Bắt đầu với Mẫu
                </button>
              </div>

              {/* Footer Note */}
              <p className="text-[10px] text-slate-400 leading-normal pt-1">
                Bằng cách sử dụng hình ảnh từ Unsplash, bạn đồng ý với{" "}
                <span className="underline hover:text-slate-600 cursor-pointer">giấy phép</span> và{" "}
                <span className="underline hover:text-slate-600 cursor-pointer">Điều khoản dịch vụ</span>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
