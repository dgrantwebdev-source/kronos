"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCredits } from "@/lib/utils";
import {
  Bot,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";

interface Capability {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  total_calls: number;
  avg_rating: number;
  price_per_call: number | null;
}

export default function MyAgentsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadCapabilities() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!agent) {
        setLoading(false);
        return;
      }

      const { data: caps } = await supabase
        .from("capabilities")
        .select("id, name, category, is_active, total_calls, avg_rating, price_per_call")
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false });

      setCapabilities(caps ?? []);
      setLoading(false);
    }

    loadCapabilities();
  }, [supabase, router]);

  async function toggleActive(cap: Capability) {
    setToggling(cap.id);
    const { error } = await supabase
      .from("capabilities")
      .update({ is_active: !cap.is_active })
      .eq("id", cap.id);

    if (!error) {
      setCapabilities((prev) =>
        prev.map((c) =>
          c.id === cap.id ? { ...c, is_active: !c.is_active } : c
        )
      );
    }
    setToggling(null);
  }

  async function deleteCapability(id: string) {
    if (!confirm("Are you sure you want to delete this capability?")) return;
    setDeleting(id);
    const { error } = await supabase.from("capabilities").delete().eq("id", id);

    if (!error) {
      setCapabilities((prev) => prev.filter((c) => c.id !== id));
    }
    setDeleting(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500">Loading capabilities...</div>
      </div>
    );
  }

  if (capabilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Bot className="mb-4 h-12 w-12 text-zinc-600" />
        <h2 className="heading-2 mb-2">
          You haven&apos;t registered any capabilities yet
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          List your first MCP tool or resource for other agents to discover.
        </p>
        <Link href="/dashboard/register" className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Register Your First Capability
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1">My Capabilities</h1>
          <p className="mt-1 text-sm text-zinc-400">
            You have {capabilities.length} registered capability
            {capabilities.length !== 1 ? "ies" : "y"}.
          </p>
        </div>
        <Link href="/dashboard/register" className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Register New
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((cap) => (
          <div key={cap.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="heading-3">{cap.name}</h3>
                <span className="mt-1 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {cap.category}
                </span>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  cap.is_active
                    ? "bg-green-900/50 text-green-400"
                    : "bg-zinc-800 text-zinc-500"
                )}
              >
                {cap.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-zinc-100 font-medium">
                  {formatCredits(cap.total_calls)}
                </p>
                <p className="text-xs text-zinc-500">Calls</p>
              </div>
              <div>
                <p className="text-zinc-100 font-medium">
                  {cap.avg_rating > 0 ? cap.avg_rating.toFixed(1) : "—"}
                </p>
                <p className="text-xs text-zinc-500">Rating</p>
              </div>
              <div>
                <p className="text-zinc-100 font-medium">
                  {cap.price_per_call != null
                    ? `${formatCredits(cap.price_per_call)}`
                    : "Free"}
                </p>
                <p className="text-xs text-zinc-500">Price</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-4">
              <button
                onClick={() => toggleActive(cap)}
                disabled={toggling === cap.id}
                className="btn-ghost flex-1"
              >
                {toggling === cap.id ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : cap.is_active ? (
                  <ToggleRight className="mr-1 h-4 w-4 text-green-400" />
                ) : (
                  <ToggleLeft className="mr-1 h-4 w-4" />
                )}
                {cap.is_active ? "Deactivate" : "Activate"}
              </button>
              <Link
                href={`/dashboard/my-agents/${cap.id}/edit`}
                className="btn-ghost"
              >
                <Edit3 className="mr-1 h-4 w-4" />
                Edit
              </Link>
              <button
                onClick={() => deleteCapability(cap.id)}
                disabled={deleting === cap.id}
                className="btn-ghost text-red-400 hover:text-red-300"
              >
                {deleting === cap.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
