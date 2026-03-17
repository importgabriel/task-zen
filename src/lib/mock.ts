// ---------------------------------------------------------------------------
// Mock-data layer — used when NEXT_PUBLIC_SUPABASE_URL is not configured.
// All persistence is localStorage-based so the app works out-of-the-box.
// ---------------------------------------------------------------------------

import type { Todo, Session } from "@/lib/types";

const MOCK_USER_ID = "mock-user-001";
const STORAGE_KEY_TODOS = "todo_app__todos";
const STORAGE_KEY_SESSION = "todo_app__session";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when Supabase env vars are absent — triggers mock mode. */
export function isMockMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.trim() === ""
  );
}

// ---------------------------------------------------------------------------
// Seeded todos shown on first visit
// ---------------------------------------------------------------------------

function seedTodos(): Todo[] {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      user_id: MOCK_USER_ID,
      title: "Buy groceries",
      completed: false,
      created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: "seed-2",
      user_id: MOCK_USER_ID,
      title: "Walk the dog",
      completed: true,
      created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "seed-3",
      user_id: MOCK_USER_ID,
      title: "Read a book",
      completed: false,
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: "seed-4",
      user_id: MOCK_USER_ID,
      title: "Write unit tests",
      completed: false,
      created_at: new Date(now - 1000 * 60 * 30).toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Todo persistence
// ---------------------------------------------------------------------------

export function getMockTodos(): Todo[] {
  if (typeof window === "undefined") return seedTodos();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TODOS);
    if (raw) return JSON.parse(raw) as Todo[];
    const initial = seedTodos();
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(initial));
    return initial;
  } catch {
    return seedTodos();
  }
}

export function saveMockTodos(todos: Todo[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
  } catch {
    // Quota exceeded or private browsing — ignore silently.
  }
}

export function createMockTodo(title: string): Todo {
  return {
    id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: MOCK_USER_ID,
    title,
    completed: false,
    created_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

export function getMockSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (raw) return JSON.parse(raw) as Session;
    return null;
  } catch {
    return null;
  }
}

export function setMockSession(email: string): Session {
  const session: Session = {
    user: { id: MOCK_USER_ID, email },
    access_token: `mock-token-${Date.now()}`,
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    } catch {
      // ignore
    }
  }
  return session;
}

export function clearMockSession(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {
      // ignore
    }
  }
}
