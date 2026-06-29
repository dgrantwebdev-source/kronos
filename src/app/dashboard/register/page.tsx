"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CAPABILITY_CATEGORIES } from "@/lib/mcp/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface FormData {
  name: string;
  description: string;
  category: string;
  tags: string;
  mcp_type: string;
  endpoint_url: string;
  endpoint_auth: string;
  price_per_call: string;
  free_tier_limit: string;
  mcp_schema: string;
}

interface FormErrors {
  [key: string]: string;
}

const MCP_TYPES = ["tool", "resource", "prompt"] as const;
const AUTH_TYPES = ["none", "api_key", "oauth"] as const;

const defaultSchema = JSON.stringify(
  {
    name: "",
    description: "",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  null,
  2
);

export default function RegisterCapabilityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    category: "",
    tags: "",
    mcp_type: "tool",
    endpoint_url: "",
    endpoint_auth: "api_key",
    price_per_call: "",
    free_tier_limit: "0",
    mcp_schema: defaultSchema,
  });

  useEffect(() => {
    async function init() {
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
        router.push("/dashboard");
        return;
      }

      setAgentId(agent.id);
    }

    init();
  }, [supabase, router]);

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const errs: FormErrors = {};

    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.category) errs.category = "Category is required";
    if (!form.endpoint_url.trim()) {
      errs.endpoint_url = "Endpoint URL is required";
    } else if (!form.endpoint_url.startsWith("https://")) {
      errs.endpoint_url = "Endpoint URL must use HTTPS";
    }

    if (form.mcp_schema.trim()) {
      try {
        const parsed = JSON.parse(form.mcp_schema);
        if (!parsed.name || !parsed.inputSchema) {
          errs.mcp_schema =
            "Schema must include name and inputSchema fields";
        }
      } catch {
        errs.mcp_schema = "Invalid JSON schema";
      }
    } else {
      errs.mcp_schema = "MCP Schema is required";
    }

    const price = Number(form.price_per_call);
    if (form.price_per_call && (isNaN(price) || price < 0)) {
      errs.price_per_call = "Must be a non-negative number";
    }

    const freeLimit = Number(form.free_tier_limit);
    if (isNaN(freeLimit) || freeLimit < 0) {
      errs.free_tier_limit = "Must be a non-negative number";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !agentId) return;

    setSubmitting(true);

    let mcpSchema;
    try {
      mcpSchema = JSON.parse(form.mcp_schema);
    } catch {
      setErrors((prev) => ({
        ...prev,
        mcp_schema: "Invalid JSON schema",
      }));
      setSubmitting(false);
      return;
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { error } = await supabase.from("capabilities").insert({
      agent_id: agentId,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      tags,
      mcp_type: form.mcp_type,
      mcp_schema: mcpSchema,
      endpoint_url: form.endpoint_url.trim(),
      endpoint_auth: form.endpoint_auth,
      price_per_call: form.price_per_call
        ? Number(form.price_per_call)
        : null,
      free_tier_limit: Number(form.free_tier_limit),
      is_active: true,
      version: "1.0.0",
      total_calls: 0,
      avg_rating: 0,
      review_count: 0,
    });

    setSubmitting(false);

    if (error) {
      setErrors({ form: error.message });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="heading-1 mb-2">Register New Capability</h1>
      <p className="mb-8 text-zinc-400">
        List a new MCP tool, resource, or prompt for other agents to discover
        and use.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
            {errors.form}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              className={cn("input mt-1", errors.name && "border-red-500")}
              placeholder="e.g. Web Scraper"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              className={cn(
                "input mt-1 min-h-[80px] resize-y",
                errors.description && "border-red-500"
              )}
              placeholder="Describe what this capability does..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="label">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                id="category"
                className={cn(
                  "input mt-1",
                  errors.category && "border-red-500"
                )}
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
              >
                <option value="">Select a category</option>
                {CAPABILITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-400">{errors.category}</p>
              )}
            </div>

            <div>
              <label htmlFor="tags" className="label">
                Tags
              </label>
              <input
                id="tags"
                type="text"
                className="input mt-1"
                placeholder="web, scraping, html (comma-separated)"
                value={form.tags}
                onChange={(e) => setField("tags", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mcp_type" className="label">
                MCP Type <span className="text-red-400">*</span>
              </label>
              <select
                id="mcp_type"
                className="input mt-1"
                value={form.mcp_type}
                onChange={(e) => setField("mcp_type", e.target.value)}
              >
                {MCP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="endpoint_auth" className="label">
                Endpoint Auth Type
              </label>
              <select
                id="endpoint_auth"
                className="input mt-1"
                value={form.endpoint_auth}
                onChange={(e) => setField("endpoint_auth", e.target.value)}
              >
                {AUTH_TYPES.map((auth) => (
                  <option key={auth} value={auth}>
                    {auth}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="endpoint_url" className="label">
              Endpoint URL <span className="text-red-400">*</span>
            </label>
            <input
              id="endpoint_url"
              type="url"
              className={cn(
                "input mt-1",
                errors.endpoint_url && "border-red-500"
              )}
              placeholder="https://api.example.com/mcp/tool"
              value={form.endpoint_url}
              onChange={(e) => setField("endpoint_url", e.target.value)}
            />
            {errors.endpoint_url && (
              <p className="mt-1 text-xs text-red-400">
                {errors.endpoint_url}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price_per_call" className="label">
                Price per Call (credits)
              </label>
              <input
                id="price_per_call"
                type="number"
                min="0"
                className={cn(
                  "input mt-1",
                  errors.price_per_call && "border-red-500"
                )}
                placeholder="0"
                value={form.price_per_call}
                onChange={(e) =>
                  setField("price_per_call", e.target.value)
                }
              />
              {errors.price_per_call && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.price_per_call}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="free_tier_limit" className="label">
                Free Tier Limit (calls)
              </label>
              <input
                id="free_tier_limit"
                type="number"
                min="0"
                className={cn(
                  "input mt-1",
                  errors.free_tier_limit && "border-red-500"
                )}
                placeholder="0"
                value={form.free_tier_limit}
                onChange={(e) =>
                  setField("free_tier_limit", e.target.value)
                }
              />
              {errors.free_tier_limit && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.free_tier_limit}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="mcp_schema" className="label">
              MCP Schema (JSON) <span className="text-red-400">*</span>
            </label>
            <textarea
              id="mcp_schema"
              className={cn(
                "input mt-1 min-h-[200px] resize-y font-mono text-xs",
                errors.mcp_schema && "border-red-500"
              )}
              value={form.mcp_schema}
              onChange={(e) => setField("mcp_schema", e.target.value)}
            />
            {errors.mcp_schema && (
              <p className="mt-1 text-xs text-red-400">
                {errors.mcp_schema}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-500">
              JSON object with <code>name</code>, <code>description</code>,
              and <code>inputSchema</code> fields.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {submitting ? "Registering..." : "Register Capability"}
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
