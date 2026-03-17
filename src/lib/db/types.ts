/**
 * Core Todo entity — matches the `todos` table in Supabase.
 * Re-exported from @/lib/db so the rest of the app imports from one place.
 */
export interface Todo {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

/** Shape required to insert a new todo row. */
export interface CreateTodoInput {
  title: string;
  user_id: string;
}

/** Fields that can be patched on an existing todo. */
export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

/** Generic typed result wrapper used by all db functions. */
export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };
