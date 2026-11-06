"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/config";
import { TextField, Checkbox, FormControlLabel } from "@mui/material";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
            (res.status === 401
              ? "Email hoặc mật khẩu không chính xác"
              : "Đăng nhập thất bại. Vui lòng thử lại!")
        );
      }

      // Lưu trữ thông tin đăng nhập vào localStorage
      if (typeof window !== "undefined") {
        if (data.accessToken) {
          localStorage.setItem("token", data.accessToken);
        }
        localStorage.setItem("user", JSON.stringify(data));
      }

      // Điều hướng về trang bảng làm việc sau khi đăng nhập thành công
      router.push("/boards");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Có lỗi không xác định xảy ra.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0052cc] via-[#0065ff] to-[#0747a6] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Kanban Elements */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-3xl rotate-12 blur-sm pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-400/15 rounded-3xl -rotate-12 blur-sm pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 relative z-10 border border-slate-100">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#0052cc] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="3" y="3" width="7" height="15" rx="1.5" />
              <rect x="14" y="3" width="7" height="10" rx="1.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Trello Work
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Đăng nhập để tiếp tục quản lý công việc và dự án
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-700 text-sm animate-fade-in">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Email tài khoản
            </label>
            <TextField
              type="email"
              required
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tenban@congty.com"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  backgroundColor: "rgba(248, 250, 252, 0.6)",
                  "& fieldset": {
                    borderColor: "#dcdfe4",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "#ffffff",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#0052cc",
                  },
                },
              }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mật khẩu
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Tính năng quên mật khẩu đang được phát triển!");
                }}
                className="text-xs font-medium text-[#0052cc] hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>
            <TextField
              type="password"
              required
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  backgroundColor: "rgba(248, 250, 252, 0.6)",
                  "& fieldset": {
                    borderColor: "#dcdfe4",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "#ffffff",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#0052cc",
                  },
                },
              }}
            />
          </div>

          <div className="flex items-center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  sx={{
                    color: "#94a3b8",
                    "&.Mui-checked": {
                      color: "#0052cc",
                    },
                  }}
                />
              }
              label={
                <span className="text-xs text-slate-600 select-none">
                  Ghi nhớ đăng nhập
                </span>
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#0052cc] hover:bg-[#0047b3] active:bg-[#0747a6] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Đang xử lý...
              </span>
            ) : (
              "Đăng nhập vào Trello Work"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-medium">
              Hoặc
            </span>
          </div>
        </div>

        {/* Switch to Register */}
        <p className="text-center text-sm text-slate-600">
          Chưa có tài khoản Trello Work?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#0052cc] hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-white/70 relative z-10">
        © 2026 Trello Work. Giữ cho công việc của nhóm luôn trôi chảy và hiệu quả.
      </footer>
    </div>
  );
}
