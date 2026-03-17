/**
 * CRUD operations for the `todos` table.
 *
 * Every function first checks whether Supabase is configured.  When it is not
 * (i.e. the app runs without env vars), all operations delegate to an
 * in-memory mock store so the UI still works during development / demos.
 *
 * Exported functions are intentionally free of Next.js / React dependencies
 * so they can be called from anywhere: Route Handlers, Server Actions, or
 * Client Components that own their own data-fetching.
 */

import { createServerDbClient } from "./client";
import type { Todo, CreateTodoInput, UpdateTodoInput, DbResult } from "./types";

// ---------------------------------------------------------------------------
// Mock data store
// ---------------------------------------------------------------------------

/**
 * Module-level in-memory store keyed by user_id.
 * Pre-populated with realistic sample todos on first access per user.
 */
const mockStore = new Map<string, Todo[]>();

function seedMockTodos(userId: string): Todo[] {
  const now = Date.now();
  return [
    {
      id: "mock-1",
      user_id: userId,
      title: "Buy groceries",
      completed: false,
      created_at: new Date(now - 3 * 86_400_000).toISOString(),
    },
    {
      id: "mock-2",
      user_id: userId,
      title: "Read a good book",
      completed: true,
      created_at: new Date(now - 2 * 86_400_000).toISOString(),
    },
    {
      id: "mock-3",
      user_id: userId,
      title: "Go for a morning walk",
      completed: false,
      created_at: new Date(now - 86_400_000).toISOString(),
    },
    {
      id: "mock-4",
      user_id: userId,
      title: "Finish the todo app",
      completed: false,
      created_at: new Date(now - 3_600_000).toISOString(),
    },
  ];
}

function getMockList(userId: string): Todo[] {
  if (!mockStore.has(userId)) {
    mockStore.set(userId, seedMockTodos(userId));
  }
  return mockStore.get(userId) as Todo[];
}

function nextMockId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// getTodos
// ---------------------------------------------------------------------------

/**
 * Returns all todos for the given user, ordered newest-first.
 */
export async function getTodos(userId: string): Promise<DbResult<Todo[]>> {
  const client = createServerDbClient();

  if (!client) {
    // ── Mock path ──────────────────────────────────────────────────────────
    const todos = [...getMockList(userId)].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { data: todos, error: null };
  }

  // ── Supabase path ─────────────────────────────────────────────────────────
  try {
    const { data, error } = await client
      .from("todos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as Todo[], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch todos",
    };
  }
}

// ---------------------------------------------------------------------------
// createTodo
// ---------------------------------------------------------------------------

/**
 * Inserts a new todo row and returns the created record.
 */
export async function createTodo(
  input: CreateTodoInput
): Promise<DbResult<Todo>> {
  const { title, user_id } = input;

  const client = createServerDbClient();

  if (!client) {
    // ── Mock path ──────────────────────────────────────────────────────────
    const newTodo: Todo = {
      id: nextMockId(),
      user_id,
      title: title.trim(),
      completed: false,
      created_at: new Date().toISOString(),
    };
    getMockList(user_id).push(newTodo);
    return { data: newTodo, error: null };
  }

  // ── Supabase path ─────────────────────────────────────────────────────────
  try {
    const { data, error } = await client
      .from("todos")
      .insert({ user_id, title: title.trim(), completed: false })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Todo, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create todo",
    };
  }
}

// ---------------------------------------------------------------------------
// updateTodo
// ---------------------------------------------------------------------------

/**
 * Applies a partial update to a todo.  Commonly used to toggle `completed`.
 */
export async function updateTodo(
  id: string,
  patch: UpdateTodoInput
): Promise<DbResult<Todo>> {
  const client = createServerDbClient();

  if (!client) {
    // ── Mock path ──────────────────────────────────────────────────────────
    for (const list of mockStore.values()) {
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        const updated: Todo = { ...list[idx], ...patch };
        list[idx] = updated;
        return { data: updated, error: null };
      }
    }
    return { data: null, error: `Todo with id "${id}" not found` };
  }

  // ── Supabase path ─────────────────────────────────────────────────────────
  try {
    const { data, error } = await client
      .from("todos")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Todo, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update todo",
    };
  }
}

// ---------------------------------------------------------------------------
// toggleTodo  (convenience wrapper around updateTodo)
// ---------------------------------------------------------------------------

/**
 * Flips the `completed` flag of a todo.
 */
export async function toggleTodo(
  id: string,
  completed: boolean
): Promise<DbResult<Todo>> {
  return updateTodo(id, { completed });
}

// ---------------------------------------------------------------------------
// deleteTodo
// ---------------------------------------------------------------------------

/**
 * Deletes a todo by id.  Returns the deleted record on success.
 */
export async function deleteTodo(id: string): Promise<DbResult<Todo>> {
  const client = createServerDbClient();

  if (!client) {
    // ── Mock path ──────────────────────────────────────────────────────────
    for (const list of mockStore.values()) {
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        const [removed] = list.splice(idx, 1);
        return { data: removed, error: null };
      }
    }
    return { data: null, error: `Todo with id "${id}" not found` };
  }

  // ── Supabase path ─────────────────────────────────────────────────────────
  try {
    const { data, error } = await client
      .from("todos")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Todo, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete todo",
    };
  }
}
