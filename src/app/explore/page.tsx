import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CapabilityCard } from "@/components/capabilities/capability-card";
import { CAPABILITY_CATEGORIES } from "@/lib/mcp/types";

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: "popular" | "rating" | "newest";
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 12;

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const sort = params.sort ?? "popular";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createServerSupabaseClient();

  let dbQuery = supabase
    .from("capabilities")
    .select(
      `
      id,
      name,
      description,
      category,
      avg_rating,
      price_per_call,
      total_calls,
      agent:agents!inner(id, name, slug)
    `,
      { count: "exact" }
    );

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  if (category) {
    dbQuery = dbQuery.eq("category", category);
  }

  switch (sort) {
    case "rating":
      dbQuery = dbQuery.order("avg_rating", { ascending: false });
      break;
    case "newest":
      dbQuery = dbQuery.order("created_at", { ascending: false });
      break;
    default:
      dbQuery = dbQuery.order("total_calls", { ascending: false });
  }

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  dbQuery = dbQuery.range(from, to);

  const { data: capabilities, count } = await dbQuery;

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 1;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="heading-1 mb-8">Explore Capabilities</h1>

      <form
        className="mb-8 flex flex-col gap-4 sm:flex-row"
        method="GET"
        action="/explore"
      >
        <input
          name="q"
          type="text"
          placeholder="Search capabilities..."
          defaultValue={query}
          className="input flex-1"
          autoComplete="off"
        />
        <select
          name="category"
          defaultValue={category}
          className="input w-full sm:w-48"
        >
          <option value="">All Categories</option>
          {CAPABILITY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="input w-full sm:w-44"
        >
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="newest">Newest</option>
        </select>
        <button type="submit" className="btn-primary shrink-0">
          Search
        </button>
      </form>

      {(!capabilities || capabilities.length === 0) ? (
        <div className="card py-20 text-center">
          <p className="text-lg text-zinc-400">
            No capabilities found &mdash; be the first to register one!
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 text-sm text-zinc-500">
            {count} {count === 1 ? "capability" : "capabilities"} found
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(capabilities as any[])?.map((cap) => {
              const agent = Array.isArray(cap.agent) ? cap.agent[0] : cap.agent;
              return (
                <CapabilityCard
                  key={cap.id}
                  id={cap.id}
                  name={cap.name}
                  description={cap.description}
                  category={cap.category}
                  agentName={agent?.name ?? "Unknown"}
                  agentSlug={agent?.slug ?? "unknown"}
                  avgRating={cap.avg_rating}
                  pricePerCall={cap.price_per_call}
                  totalCalls={cap.total_calls}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (p) => {
                  const sp = new URLSearchParams({ ...params, page: String(p) });
                  return (
                    <a
                      key={p}
                      href={`/explore?${sp.toString()}`}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-primary-600 text-white"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      }`}
                    >
                      {p}
                    </a>
                  );
                }
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
