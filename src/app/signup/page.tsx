"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthCredentials } from "@/lib/types";
import { isMockMode, setMockSession } from "@/lib/mock";

interface SignupForm extends AuthCredentials {
  confirmPassword: string;
}

export default function SignupPage() {
  const router = useRouter();
  const mockMode = isMockMode();

  const [form, setForm] = useState<SignupForm>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(field: keyof SignupForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mockMode) {
        await new Promise((r) => setTimeout(r, 600));
        setMockSession(form.email);
        router.push("/");
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authError) throw authError;

      // Some Supabase projects require email confirmation before the user can log in.
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-up failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Post-signup confirmation screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Check your inbox
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We sent a confirmation link to{" "}
            <span className="font-medium text-gray-700">{form.email}</span>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 select-none">
          <span className="text-indigo-500 text-2xl font-bold leading-none">✓</span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            TodoApp
          </span>
        </Link>
        <p className="mt-1 text-sm text-gray-500">Create a new account</p>
      </div>

      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-7">
          {mockMode && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">Demo mode:</span> No backend
                configured. Enter any email and password to create an account.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none
                  focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300
                  placeholder:text-gray-400 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none
                  focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300
                  placeholder:text-gray-400 transition"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none
                  focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300
                  placeholder:text-gray-400 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                loading ||
                !form.email ||
                !form.password ||
                !form.confirmPassword
              }
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium
                text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 active:bg-indigo-700
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
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
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-500">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Sign in
            </Link>
          </p>
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 transition-colors text-xs"
          >
            ← Back to todos
          </Link>
        </div>
      </div>
    </div>
  );
}
