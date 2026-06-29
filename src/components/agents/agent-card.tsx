"use client";

import Link from "next/link";
import { cn, truncate } from "@/lib/utils";

export interface AgentCardProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  capabilityCount: number;
  avgRating: number;
}

function formatRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function AgentCard({
  id,
  name,
  description,
  capabilityCount,
  avgRating,
}: AgentCardProps) {
  return (
    <Link href={`/agent/${id}`}>
      <div
        className={cn(
          "card group cursor-pointer transition-all duration-200",
          "hover:border-accent-600 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-accent-900/10"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg font-bold text-zinc-400 group-hover:bg-accent-900/50 group-hover:text-accent-300 transition-colors">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="heading-3 truncate group-hover:text-accent-400 transition-colors">
              {name}
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              {capabilityCount} {capabilityCount === 1 ? "capability" : "capabilities"}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-400">
          {truncate(description, 120)}
        </p>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-yellow-400">{formatRating(avgRating)}</span>
          <span className="text-xs text-zinc-600">
            {avgRating.toFixed(1)} avg
          </span>
        </div>
      </div>
    </Link>
  );
}
