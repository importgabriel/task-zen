"use client";

import { useState, useRef } from "react";

interface TodoFormProps {
  onAdd: (title: string) => void;
  /** Disable while a save request is in-flight */
  disabled?: boolean;
}

export default function TodoForm({ onAdd, disabled }: TodoFormProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    inputRef.current?.focus();
  }

  const canSubmit = value.trim().length > 0 && !disabled;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What needs to be done?"
        disabled={disabled}
        autoComplete="off"
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none
          focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300
          disabled:bg-gray-50 disabled:cursor-not-allowed
          placeholder:text-gray-400 transition"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg
          hover:bg-indigo-600 active:bg-indigo-700
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors"
      >
        Add
      </button>
    </form>
  );
}
