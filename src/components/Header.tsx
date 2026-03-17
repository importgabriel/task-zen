"use client";

import Link from "next/link";

interface HeaderProps {
  userEmail?: string | null;
  onSignOut?: () => void;
  /** Show a skeleton while session is loading */
  loading?: boolean;
}

export default function Header({ userEmail, onSignOut, loading }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="text-indigo-500 text-xl font-bold leading-none">✓</span>
          <span className="text-lg font-semibold text-gray-900 tracking-tight">
            TodoApp
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-4 w-24 bg-gray-100 rounded-full animate-pulse" />
          ) : userEmail ? (
            <>
              <span className="hidden sm:block text-sm text-gray-500 max-w-[160px] truncate">
                {userEmail}
              </span>
              <button
                onClick={onSignOut}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Demo
              </span>
              <Link
                href="/login"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
