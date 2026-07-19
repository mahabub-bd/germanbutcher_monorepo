"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function SearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className={cn("relative group", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <Input
        type="search"
        placeholder="Search products..."
        className="w-full pl-9 pr-8 py-2 h-10 transition-all border-muted group-focus-within:border-primary"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
