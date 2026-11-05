"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/config";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
            (res.status === 409
              ? "Email này đã được sử dụng. Vui lòng chọn email khác!"
              : "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!")
        );
      }

      setSuccess("Tạo tài khoản thành công! Đang chuyển hướng sang Đăng nhập...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
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
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-3xl -rotate-12 blur-sm pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-400/15 rounded-3xl rotate-12 blur-sm pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 relative z-10 border border-slate-100">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center mb-6">
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
            Tạo tài khoản Trello Work
          </h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Bắt đầu tạo bảng công việc và cộng tác cùng đội ngũ của bạn
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-700 text-sm">
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

        {/* Success Alert */}
        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-200/80 flex items-start gap-3 text-green-700 text-sm">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="leading-snug">{success}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Họ và tên
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent transition-all bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tenban@congty.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent transition-all bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Xác nhận
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Ảnh đại diện (URL tuỳ chọn)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent transition-all bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="pt-2">
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
                  Đang khởi tạo tài khoản...
                </span>
              ) : (
                "Đăng ký tài khoản"
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-medium">
              Đã có tài khoản?
            </span>
          </div>
        </div>

        {/* Switch to Login */}
        <p className="text-center text-sm text-slate-600">
          <Link
            href="/login"
            className="font-semibold text-[#0052cc] hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-white/70 relative z-10">
        © 2026 Trello Work. Quản lý dự án khoa học & hiện đại.
      </footer>
    </div>
  );
}
