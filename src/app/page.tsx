"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import TodoItem from "@/components/TodoItem";
import TodoForm from "@/components/TodoForm";
import type { Todo, Session } from "@/lib/types";
import {
  getMockTodos,
  saveMockTodos,
  getMockSession,
  clearMockSession,
  createMockTodo,
  isMockMode,
} from "@/lib/mock";

type Filter = "all" | "active" | "completed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <>
      {[100, 70, 85].map((w, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
          <div className="w-5 h-5 rounded-full bg-gray-100 flex-shrink-0" />
          <div className={`h-4 bg-gray-100 rounded-full`} style={{ width: `${w}%` }} />
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [todosLoading, setTodosLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState(false);

  const mockMode = isMockMode();

  // ---------------------------------------------------------------------------
  // Initialise session + todos
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setSessionLoading(true);
      setTodosLoading(true);

      if (mockMode) {
        const mockSession = getMockSession();
        const mockTodos = getMockTodos();
        if (!cancelled) {
          setSession(mockSession);
          setTodos(mockTodos);
          setSessionLoading(false);
          setTodosLoading(false);
        }
        return;
      }

      // --- Supabase path ---
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const {
          data: { session: supaSession },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (supaSession) {
          const mappedSession: Session = {
            user: {
              id: supaSession.user.id,
              email: supaSession.user.email ?? "",
            },
            access_token: supaSession.access_token,
          };
          setSession(mappedSession);
          setSessionLoading(false);

          const { data, error: fetchError } = await supabase
            .from("todos")
            .select("*")
            .order("created_at", { ascending: false });

          if (!cancelled) {
            if (fetchError) throw fetchError;
            setTodos((data as Todo[]) ?? []);
          }
        } else {
          // Not signed in — still show mock todos so the page isn't blank
          if (!cancelled) {
            setSession(null);
            setTodos(getMockTodos());
            setSessionLoading(false);
          }
        }
      } catch (err) {
        console.warn("Supabase unavailable, falling back to mock data.", err);
        if (!cancelled) {
          setSession(getMockSession());
          setTodos(getMockTodos());
          setSessionLoading(false);
        }
      } finally {
        if (!cancelled) setTodosLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [mockMode]);

  // ---------------------------------------------------------------------------
  // Sign-out
  // ---------------------------------------------------------------------------
  const handleSignOut = useCallback(async () => {
    if (mockMode) {
      clearMockSession();
      setSession(null);
      return;
    }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    } finally {
      clearMockSession();
      setSession(null);
    }
  }, [mockMode]);

  // ---------------------------------------------------------------------------
  // Add todo
  // ---------------------------------------------------------------------------
  const handleAdd = useCallback(
    async (title: string) => {
      setSaving(true);
      const optimistic = createMockTodo(title);

      // Optimistic insert
      setTodos((prev) => {
        const next = [optimistic, ...prev];
        if (mockMode) saveMockTodos(next);
        return next;
      });

      if (mockMode) {
        setSaving(false);
        return;
      }

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error: insertError } = await supabase
          .from("todos")
          .insert({ title, user_id: session?.user.id })
          .select()
          .single();
        if (insertError) throw insertError;
        setTodos((prev) =>
          prev.map((t) => (t.id === optimistic.id ? (data as Todo) : t))
        );
      } catch (err) {
        console.error(err);
        // Roll back the optimistic todo
        setTodos((prev) => prev.filter((t) => t.id !== optimistic.id));
        setError("Could not save todo. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [mockMode, session]
  );

  // ---------------------------------------------------------------------------
  // Toggle completion
  // ---------------------------------------------------------------------------
  const handleToggle = useCallback(
    async (id: string) => {
      const target = todos.find((t) => t.id === id);
      if (!target) return;
      const newCompleted = !target.completed;

      setTodos((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, completed: newCompleted } : t
        );
        if (mockMode) saveMockTodos(next);
        return next;
      });

      if (!mockMode) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { error: updateError } = await supabase
            .from("todos")
            .update({ completed: newCompleted })
            .eq("id", id);
          if (updateError) throw updateError;
        } catch (err) {
          console.error(err);
          // Roll back
          setTodos((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, completed: !newCompleted } : t
            )
          );
          setError("Could not update todo.");
        }
      }
    },
    [todos, mockMode]
  );

  // ---------------------------------------------------------------------------
  // Delete todo
  // ---------------------------------------------------------------------------
  const handleDelete = useCallback(
    async (id: string) => {
      const snapshot = todos;
      setTodos((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (mockMode) saveMockTodos(next);
        return next;
      });

      if (!mockMode) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { error: deleteError } = await supabase
            .from("todos")
            .delete()
            .eq("id", id);
          if (deleteError) throw deleteError;
        } catch (err) {
          console.error(err);
          setTodos(snapshot);
          setError("Could not delete todo.");
        }
      }
    },
    [todos, mockMode]
  );

  // ---------------------------------------------------------------------------
  // Edit todo title
  // ---------------------------------------------------------------------------
  const handleEdit = useCallback(
    async (id: string, title: string) => {
      setTodos((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, title } : t));
        if (mockMode) saveMockTodos(next);
        return next;
      });

      if (!mockMode) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { error: updateError } = await supabase
            .from("todos")
            .update({ title })
            .eq("id", id);
          if (updateError) throw updateError;
        } catch (err) {
          console.error(err);
          setError("Could not save edit.");
        }
      }
    },
    [mockMode]
  );

  // ---------------------------------------------------------------------------
  // Clear completed
  // ---------------------------------------------------------------------------
  const handleClearCompleted = useCallback(async () => {
    const completedIds = todos
      .filter((t) => t.completed)
      .map((t) => t.id);
    if (completedIds.length === 0) return;

    setTodos((prev) => {
      const next = prev.filter((t) => !t.completed);
      if (mockMode) saveMockTodos(next);
      return next;
    });

    if (!mockMode) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: deleteError } = await supabase
          .from("todos")
          .delete()
          .in("id", completedIds);
        if (deleteError) throw deleteError;
      } catch (err) {
        console.error(err);
        setError("Could not clear completed todos.");
      }
    }
  }, [todos, mockMode]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.length - completedCount;

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const isLoading = sessionLoading || todosLoading;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        userEmail={session?.user.email}
        onSignOut={handleSignOut}
        loading={sessionLoading}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            My Todos
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 h-5">
            {!isLoading &&
              (activeCount === 0
                ? "All done — great job! 🎉"
                : `${activeCount} task${activeCount !== 1 ? "s" : ""} remaining`)}
          </p>
        </div>

        {/* Add-todo form */}
        <div className="mb-4">
          <TodoForm onAdd={handleAdd} disabled={saving || isLoading} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
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
            <p className="flex-1 text-sm text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss"
              className="text-red-300 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filter tabs */}
          <div className="flex border-b border-gray-100 px-3 pt-1 gap-1">
            {(["all", "active", "completed"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-sm capitalize font-medium border-b-2 -mb-px transition-colors ${
                  filter === f
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {f}
                {f === "active" && activeCount > 0 && !isLoading && (
                  <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">
                    {activeCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="divide-y divide-gray-50 px-1 py-1 min-h-[4rem]">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-3xl select-none">
                  {filter === "completed" ? "🏆" : filter === "active" ? "✨" : "📝"}
                </span>
                <p className="text-sm text-gray-400">
                  {filter === "completed"
                    ? "No completed tasks yet"
                    : filter === "active"
                    ? "No active tasks"
                    : "No todos yet — add one above!"}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>

          {/* Footer: stats + clear completed */}
          {!isLoading && todos.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {completedCount} of {todos.length} done
              </span>
              {completedCount > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear completed
                </button>
              )}
            </div>
          )}
        </div>

        {/* Demo-mode notice */}
        {mockMode && !isLoading && (
          <p className="mt-5 text-center text-xs text-gray-400">
            Running in{" "}
            <span className="font-medium text-amber-600">demo mode</span> —
            todos are saved to your browser.{" "}
            <a
              href="/login"
              className="text-indigo-400 hover:text-indigo-600 underline underline-offset-2 transition-colors"
            >
              Sign in
            </a>{" "}
            to sync across devices.
          </p>
        )}
      </main>
    </div>
  );
}
