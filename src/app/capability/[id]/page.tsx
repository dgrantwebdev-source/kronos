import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

interface CapabilityPageProps {
  params: Promise<{ id: string }>;
}

function formatRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export default async function CapabilityPage({
  params,
}: CapabilityPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: capability } = await supabase
    .from("capabilities")
    .select(
      `
      *,
      agent:agents!inner(id, name, slug, description, avatar_url)
    `
    )
    .eq("id", id)
    .single();

  if (!capability) {
    notFound();
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      id,
      rating,
      review_text,
      created_at,
      agent:agents!inner(id, name, slug)
    `
    )
    .eq("capability_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/explore"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to explore
        </Link>
      </div>

      {/* Header */}
      <div className="card mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="heading-1 break-words">{capability.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                {capability.category}
              </span>
              {capability.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-950 px-2.5 py-0.5 text-xs text-primary-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 text-lg">
              {formatRating(capability.avg_rating)}
            </div>
            <p className="text-xs text-zinc-500">
              {capability.avg_rating.toFixed(1)} &middot;{" "}
              {capability.review_count} review
              {capability.review_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <p className="mt-4 text-zinc-300 leading-relaxed">
          {capability.description}
        </p>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-6 sm:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Price</p>
            <p
              className={cn(
                "mt-1 text-sm font-semibold",
                !capability.price_per_call
                  ? "text-green-400"
                  : "text-zinc-100"
              )}
            >
              {capability.price_per_call
                ? `${capability.price_per_call} credits`
                : "Free"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total Calls</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              {capability.total_calls.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Auth</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100 capitalize">
              {capability.endpoint_auth?.replace(/_/g, " ") ?? "None"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Version</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              {capability.version}
            </p>
          </div>
        </div>
      </div>

      {/* Provider Agent */}
      <div className="card mb-8">
        <h2 className="heading-2 mb-4">Provider Agent</h2>
        <Link
          href={`/agent/${capability.agent.id}`}
          className="group flex items-center gap-4"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl font-bold text-zinc-400 group-hover:bg-accent-900/50 group-hover:text-accent-300 transition-colors">
            {capability.agent.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-100 group-hover:text-accent-400 transition-colors">
              {capability.agent.name}
            </p>
            <p className="text-sm text-zinc-500">
              {capability.agent.description}
            </p>
          </div>
        </Link>
      </div>

      {/* MCP Schema */}
      <div className="card mb-8">
        <h2 className="heading-2 mb-4">MCP Schema</h2>
        <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-300 leading-relaxed">
          {JSON.stringify(capability.mcp_schema, null, 2)}
        </pre>
      </div>

      {/* Endpoint */}
      <div className="card mb-8">
        <h2 className="heading-2 mb-4">Endpoint</h2>
        <code className="block rounded-lg bg-zinc-950 p-4 text-sm text-zinc-300 break-all">
          {capability.endpoint_url}
        </code>
      </div>

      {/* Connect CTA */}
      <div className="card mb-8 border-primary-800 bg-primary-950/30">
        <h2 className="heading-2 text-primary-300">Connect Your Agent</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Direct your agent to this MCP endpoint to start using this
          capability:
        </p>
        <code className="mt-4 block rounded-lg bg-zinc-950 p-4 text-sm text-primary-300 break-all">
          {capability.endpoint_url}
        </code>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="heading-2 mb-6">
          Reviews ({capability.review_count})
        </h2>
        {!reviews || reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-200">
                      {Array.isArray(review.agent) ? review.agent[0]?.name : review.agent?.name}
                    </span>
                    <span className="text-yellow-400 text-sm">
                      {formatRating(review.rating)}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {review.review_text && (
                  <p className="mt-2 text-sm text-zinc-400">
                    {review.review_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
