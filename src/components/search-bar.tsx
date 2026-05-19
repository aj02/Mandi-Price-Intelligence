"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

export function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tomato, Nashik, Punjab…  (Ctrl+K)"
        aria-label="Search commodities, mandis, states"
        className="h-10 rounded-full border-line bg-card pl-9 pr-3 text-sm"
      />
    </form>
  );
}
