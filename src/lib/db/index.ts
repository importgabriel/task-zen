/**
 * Public API of the database layer.
 *
 * Other agents / modules should import exclusively from "@/lib/db" rather
 * than reaching into sub-files directly.
 *
 * Example:
 *   import { getTodos, createTodo, toggleTodo, deleteTodo } from "@/lib/db";
 *   import type { Todo, CreateTodoInput } from "@/lib/db";
 */

// Types
export type { Todo, CreateTodoInput, UpdateTodoInput, DbResult } from "./types";

// Client helpers (useful for client components that need direct Supabase access)
export {
  isSupabaseConfigured,
  createBrowserDbClient,
  createServerDbClient,
} from "./client";

// CRUD operations
export {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
} from "./todos";
