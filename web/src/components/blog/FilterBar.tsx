"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";

export default function FilterBar({
  topics,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
}: {
  topics: string[];
  activeFilter: string;
  onFilterChange: (topic: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}) {
  return (
    <div className="border-b border-border pb-4 mb-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-[11px] font-mono text-primary shrink-0">
          $ ls -filter
        </span>
        <button
          onClick={() => onFilterChange("")}
          className={`px-3 py-1 text-[11px] font-mono border transition-colors shrink-0 ${
            activeFilter === ""
              ? "border-primary text-primary bg-primary/10"
              : "border-border text-muted hover:text-foreground hover:border-foreground/30"
          }`}
        >
          All
        </button>
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => onFilterChange(topic)}
            className={`px-3 py-1 text-[11px] font-mono border transition-colors shrink-0 ${
              activeFilter === topic
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {topic.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onViewModeChange("grid")}
          className={`p-1.5 transition-colors ${
            viewMode === "grid" ? "text-primary" : "text-muted hover:text-foreground"
          }`}
          aria-label="Grid view"
        >
          <LayoutGrid size={14} />
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={`p-1.5 transition-colors ${
            viewMode === "list" ? "text-primary" : "text-muted hover:text-foreground"
          }`}
          aria-label="List view"
        >
          <List size={14} />
        </button>
      </div>
    </div>
  );
}
