"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCredits, formatDate } from "@/lib/utils";
import {
  Layers,
  PhoneCall,
  Wallet,
  Star,
  ArrowRight,
  Key,
  Bot,
  Plus,
  Activity,
} from "lucide-react";

interface DashboardData {
  agentName: string;
  totalCapabilities: number;
  totalCalls: number;
  totalEarnings: number;
  avgRating: number;
  recentActivity: Array<{
    id: string;
    capability_name: string;
    credits: number;
    status: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: agent } = await supabase
        .from("agents")
        .select("id, name")
        .eq("user_id", user.id)
        .single();

      const agentId = agent?.id;
      const agentName = agent?.name ?? "Agent";

      let totalCapabilities = 0;
      let totalCalls = 0;
      let totalEarnings = 0;
      let avgRating = 0;
      let recentActivity: DashboardData["recentActivity"] = [];

      if (agentId) {
        const { count: capCount } = await supabase
          .from("capabilities")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agentId);

        totalCapabilities = capCount ?? 0;

        const { data: caps } = await supabase
          .from("capabilities")
          .select("total_calls, avg_rating, price_per_call, review_count")
          .eq("agent_id", agentId);

        if (caps) {
          totalCalls = caps.reduce((s, c) => s + (c.total_calls ?? 0), 0);
          const weightedRating = caps.reduce(
            (s, c) => s + (c.avg_rating ?? 0) * (c.review_count ?? 0),
            0
          );
          const totalReviews = caps.reduce(
            (s, c) => s + (c.review_count ?? 0),
            0
          );
          avgRating = totalReviews > 0 ? weightedRating / totalReviews : 0;
        }

        const { data: txns } = await supabase
          .from("transactions")
          .select(
            `id, credits, status, created_at, capability:capability_id(name)`
          )
          .eq("provider_agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (txns) {
          recentActivity = txns.map((t: any) => ({
            id: t.id,
            capability_name: t.capability?.name ?? "Unknown",
            credits: t.credits,
            status: t.status,
            created_at: t.created_at,
          }));
        }
      }

      setData({
        agentName,
        totalCapabilities,
        totalCalls,
        totalEarnings,
        avgRating: Math.round(avgRating * 10) / 10,
        recentActivity,
      });
      setLoading(false);
    }

    loadDashboard();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Capabilities",
      value: data?.totalCapabilities ?? 0,
      icon: Layers,
      color: "text-blue-400",
    },
    {
      label: "Total Calls",
      value: data?.totalCalls ?? 0,
      icon: PhoneCall,
      color: "text-green-400",
    },
    {
      label: "Total Earnings",
      value: `${formatCredits(data?.totalEarnings ?? 0)} credits`,
      icon: Wallet,
      color: "text-yellow-400",
    },
    {
      label: "Average Rating",
      value: data?.avgRating ?? 0,
      icon: Star,
      color: "text-purple-400",
    },
  ];

  const quickActions = [
    {
      label: "Register New Capability",
      href: "/dashboard/register",
      icon: Plus,
      description: "List a new MCP tool, resource, or prompt",
    },
    {
      label: "View My Agents",
      href: "/dashboard/my-agents",
      icon: Bot,
      description: "Manage your registered capabilities",
    },
    {
      label: "API Keys",
      href: "/dashboard/api-keys",
      icon: Key,
      description: "Manage API keys for programmatic access",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-1">
          Welcome back, {data?.agentName ?? "Agent"}
        </h1>
        <p className="mt-2 text-zinc-400">
          Here&apos;s what&apos;s happening with your capabilities today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg bg-zinc-800 p-2", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="label">{stat.label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-zinc-100">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="heading-2 mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="card group cursor-pointer transition-colors hover:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-zinc-800 p-2 text-primary-400">
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="heading-3">{action.label}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">{action.description}</p>
              <ArrowRight className="mt-3 h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-400" />
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="heading-2 mb-4">Recent Activity</h2>
        <div className="card">
          {data && data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {activity.capability_name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-100">
                      {formatCredits(activity.credits)} credits
                    </p>
                    <span
                      className={cn(
                        "text-xs",
                        activity.status === "completed"
                          ? "text-green-400"
                          : activity.status === "pending"
                            ? "text-yellow-400"
                            : "text-red-400"
                      )}
                    >
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Activity className="mb-2 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-500">No recent activity</p>
              <p className="mt-1 text-xs text-zinc-600">
                Transactions will appear here once capabilities are called.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
