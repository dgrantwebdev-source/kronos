import { z } from "zod";

// MCP 2026-07-28 Protocol Types

export const MCP_PROTOCOL_VERSION = "2026-07-28";

// JSON-RPC 2.0 request
export const MCPRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z
    .object({
      name: z.string().optional(),
      arguments: z.record(z.any()).optional(),
      cursor: z.string().optional(),
    })
    .optional(),
});

export type MCPRequest = z.infer<typeof MCPRequestSchema>;

// JSON-RPC 2.0 response
export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// MCP Tool Schema (what providers register)
export const MCPToolSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().min(1).max(500),
  inputSchema: z.object({
    type: z.literal("object"),
    properties: z.record(
      z.object({
        type: z.string(),
        description: z.string().optional(),
        enum: z.array(z.string()).optional(),
      })
    ),
    required: z.array(z.string()).optional(),
  }),
});

export type MCPTool = z.infer<typeof MCPToolSchema>;

// Capability registration schema
export const CapabilityRegistrationSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(50),
  tags: z.array(z.string().max(30)).max(10).optional(),
  mcp_type: z.enum(["tool", "resource", "prompt"]),
  mcp_schema: MCPToolSchema,
  endpoint_url: z.string().url().refine((url) => url.startsWith("https://"), {
    message: "Endpoint must use HTTPS",
  }),
  endpoint_auth: z.enum(["none", "api_key", "oauth"]).default("api_key"),
  price_per_call: z.number().int().min(0).optional(),
  free_tier_limit: z.number().int().min(0).default(0),
});

export type CapabilityRegistration = z.infer<typeof CapabilityRegistrationSchema>;

// MCP Discovery result
export interface DiscoveryResult {
  capability_id: string;
  name: string;
  description: string;
  category: string;
  agent_name: string;
  agent_slug: string;
  avg_rating: number;
  price_per_call: number | null;
  total_calls: number;
  relevance: number;
}

// MCP Capability detail
export interface CapabilityDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  mcp_type: string;
  mcp_schema: MCPTool;
  endpoint_url: string;
  endpoint_auth: string;
  price_per_call: number | null;
  free_tier_limit: number;
  version: string;
  total_calls: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
  agent: {
    id: string;
    name: string;
    slug: string;
    description: string;
    avatar_url: string | null;
  };
}

// Supported capability categories
export const CAPABILITY_CATEGORIES = [
  "general",
  "data-extraction",
  "developer-tools",
  "communication",
  "data-analysis",
  "language",
  "image-processing",
  "audio-processing",
  "search",
  "automation",
  "content-generation",
  "analytics",
  "security",
  "infrastructure",
  "other",
] as const;

export type CapabilityCategory = (typeof CAPABILITY_CATEGORIES)[number];
