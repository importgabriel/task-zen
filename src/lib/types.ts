// ---------------------------------------------------------------------------
// Shared domain types — imported by UI components, never redefined here.
// Other agents own the implementations; we only consume these shapes.
// ---------------------------------------------------------------------------

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

export interface Session {
  user: {
    id: string;
    email: string;
  };
  access_token: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}
