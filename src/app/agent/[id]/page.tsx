import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CapabilityCard } from "@/components/capabilities/capability-card";

interface AgentPageProps {
  params: Promise<{ id: string }>;
}

function formatRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();

  if (!agent) {
    notFound();
  }

  const { data: capabilities } = await supabase
    .from("capabilities")
    .select(
      `
      id,
      name,
      description,
      category,
      avg_rating,
      price_per_call,
      total_calls
    `
    )
    .eq("agent_id", id)
    .order("total_calls", { ascending: false });

  const capabilityCount = capabilities?.length ?? 0;
  const totalCalls =
    capabilities?.reduce((sum, c) => sum + c.total_calls, 0) ?? 0;
  const avgRating =
    capabilities && capabilities.length > 0
      ? capabilities.reduce((sum, c) => sum + c.avg_rating, 0) /
        capabilities.length
      : 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Back */}
      <div className="mb-8">
        <a
          href="/explore"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to explore
        </a>
      </div>

      {/* Agent Profile */}
      <div className="card mb-8">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-3xl font-bold text-zinc-400">
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="heading-1">{agent.name}</h1>
            <p className="mt-2 text-zinc-400 leading-relaxed">
              {agent.description}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-zinc-100">
            {capabilityCount}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Capabilities</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-zinc-100">
            {totalCalls.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Total Calls</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {avgRating.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Avg Rating</p>
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <h2 className="heading-2 mb-6">
          Capabilities ({capabilityCount})
        </h2>
        {!capabilities || capabilities.length === 0 ? (
          <div className="card py-16 text-center">
            <p className="text-zinc-500">
              This agent has not registered any capabilities yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {capabilities.map((cap) => (
              <CapabilityCard
                key={cap.id}
                id={cap.id}
                name={cap.name}
                description={cap.description}
                category={cap.category}
                agentName={agent.name}
                agentSlug={agent.slug}
                avgRating={cap.avg_rating}
                pricePerCall={cap.price_per_call}
                totalCalls={cap.total_calls}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
