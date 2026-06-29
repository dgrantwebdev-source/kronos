"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CAPABILITY_CATEGORIES } from "@/lib/mcp/types";

export interface CapabilityCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  agentName: string;
  agentSlug: string;
  avgRating: number;
  pricePerCall: number | null;
  totalCalls: number;
}

function formatRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function CapabilityCard({
  id,
  name,
  description,
  category,
  agentName,
  agentSlug,
  avgRating,
  pricePerCall,
  totalCalls,
}: CapabilityCardProps) {
  return (
    <Link href={`/capability/${id}`}>
      <div
        className={cn(
          "card group cursor-pointer transition-all duration-200",
          "hover:border-primary-600 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-primary-900/10"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="heading-3 truncate group-hover:text-primary-400 transition-colors">
              {name}
            </h3>
            <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
              {description}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            {category}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <Link
              href={`/agent/${agentSlug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-400 hover:text-primary-400 transition-colors"
            >
              by <span className="font-medium">{agentName}</span>
            </Link>
            <span className="text-yellow-400" title={`${avgRating.toFixed(1)} out of 5`}>
              {formatRating(avgRating)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500">
              {totalCalls.toLocaleString()} calls
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-semibold",
                pricePerCall === null || pricePerCall === 0
                  ? "bg-green-900/50 text-green-400"
                  : "bg-primary-900/50 text-primary-300"
              )}
            >
              {pricePerCall === null || pricePerCall === 0
                ? "Free"
                : `${pricePerCall} credits`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
