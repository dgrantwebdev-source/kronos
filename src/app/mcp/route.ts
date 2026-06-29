import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateMcpHeaders, validateMcpRequestBody, MCP_ERRORS } from "@/lib/mcp/validate";
import { verifyApiKeyHash } from "@/lib/api-keys/crypto";

/**
 * MCP 2026-07-28 Protocol Endpoint
 * 
 * This is the core of the Kronos marketplace — agents connect here
 * to discover and query available capabilities.
 * 
 * Headers:
 *   Mcp-Method: tools/call | tools/list
 *   Mcp-Name: find_capability | list_capabilities | get_capability_schema
 *   MCP-Protocol-Version: 2026-07-28
 *   Authorization: Bearer <api_key>
 * 
 * Body: JSON-RPC 2.0
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // 1. Validate MCP protocol headers
  const headerValidation = validateMcpHeaders(request);
  if (!headerValidation.success) {
    return mcpError(null, MCP_ERRORS.INVALID_REQUEST.code, headerValidation.error!);
  }

  // 2. Authenticate via API key
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return mcpError(null, MCP_ERRORS.AUTH_REQUIRED.code, "Missing or invalid Authorization header");
  }

  const apiKey = authHeader.slice(7);
  const supabase = await createServerSupabaseClient();

  // Look up the API key by its prefix
  const keyPrefix = apiKey.slice(0, 8);
  const { data: keyRecord, error: keyError } = await supabase
    .from("api_keys")
    .select("id, agent_id, key_hash, is_active")
    .eq("key_prefix", keyPrefix)
    .eq("is_active", true)
    .single();

  if (keyError || !keyRecord) {
    return mcpError(null, MCP_ERRORS.AUTH_REQUIRED.code, "Invalid API key");
  }

  // Verify the key hash
  if (!verifyApiKeyHash(apiKey, keyRecord.key_hash)) {
    return mcpError(null, MCP_ERRORS.AUTH_REQUIRED.code, "Invalid API key");
  }

  // Update last used timestamp
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  // 3. Parse and validate JSON-RPC body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return mcpError(null, MCP_ERRORS.PARSE_ERROR.code, "Invalid JSON body");
  }

  const bodyValidation = validateMcpRequestBody(body);
  if (!bodyValidation.success || !bodyValidation.data) {
    return mcpError(null, MCP_ERRORS.INVALID_REQUEST.code, bodyValidation.error ?? "Invalid request body");
  }

  const { id, method, params } = bodyValidation.data;

  // 4. Route to handler based on method
  try {
    switch (method) {
      case "tools/call":
        return handleToolsCall(id, params, supabase);

      case "tools/list":
        return handleToolsList(id, params, supabase);

      default:
        return mcpError(id, MCP_ERRORS.METHOD_NOT_FOUND.code, `Method not found: ${method}`);
    }
  } catch (error) {
    console.error("MCP handler error:", error);
    return mcpError(id, MCP_ERRORS.INTERNAL_ERROR.code, "Internal server error");
  }
}

/**
 * tools/call - Execute a specific tool (find_capability, get_capability_schema)
 */
async function handleToolsCall(
  id: string | number,
  params: any,
  supabase: any
): Promise<NextResponse> {
  const toolName = params?.name;

  if (!toolName) {
    return mcpError(id, MCP_ERRORS.INVALID_PARAMS.code, "Missing tool name");
  }

  switch (toolName) {
    case "find_capability": {
      const args = params?.arguments || {};
      const query = args.query || "";
      const maxResults = Math.min(args.max_results || 5, 20);
      const minRating = args.min_reputation || 0;
      const category = args.category || null;

      const { data, error } = await supabase.rpc("search_capabilities", {
        query_text: query,
        category_filter: category,
        min_rating: minRating,
        page_size: maxResults,
        page_offset: 0,
      });

      if (error) {
        return mcpError(id, MCP_ERRORS.INTERNAL_ERROR.code, "Search failed");
      }

      return mcpResult(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(data || []),
          },
        ],
        isError: false,
      });
    }

    case "get_capability_schema": {
      const args = params?.arguments || {};
      const capabilityId = args.capability_id;

      if (!capabilityId) {
        return mcpError(id, MCP_ERRORS.INVALID_PARAMS.code, "Missing capability_id");
      }

      const { data, error } = await supabase
        .from("capabilities")
        .select(`
          id, name, description, category, tags, mcp_type, mcp_schema,
          endpoint_url, endpoint_auth, price_per_call, free_tier_limit,
          version, total_calls, avg_rating, review_count,
          agent:agents(id, name, slug, description)
        `)
        .eq("id", capabilityId)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return mcpError(id, MCP_ERRORS.INVALID_PARAMS.code, "Capability not found");
      }

      return mcpResult(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
        isError: false,
      });
    }

    default:
      return mcpError(id, MCP_ERRORS.METHOD_NOT_FOUND.code, `Tool not found: ${toolName}`);
  }
}

/**
 * tools/list - List available tools (capabilities)
 */
async function handleToolsList(
  id: string | number,
  params: any,
  supabase: any
): Promise<NextResponse> {
  const cursor = params?.cursor;
  const pageSize = 20;

  const { data, error } = await supabase
    .from("capabilities")
    .select(`
      id, name, description, category, mcp_type,
      price_per_call, avg_rating, total_calls,
      agent:agents(name, slug)
    `)
    .eq("is_active", true)
    .order("total_calls", { ascending: false })
    .limit(pageSize);

  if (error) {
    return mcpError(id, MCP_ERRORS.INTERNAL_ERROR.code, "Failed to list capabilities");
  }

  // Format as MCP tools list
  const tools = data.map((c: any) => ({
    name: c.name,
    description: c.description,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
    },
    meta: {
      category: c.category,
      provider: c.agent.name,
      price: c.price_per_call,
      rating: c.avg_rating,
      calls: c.total_calls,
    },
  }));

  return mcpResult(id, {
    tools,
    nextCursor: data.length === pageSize ? String(pageSize) : null,
  });
}

// Helper: Return MCP JSON-RPC error response
function mcpError(
  id: string | number | null,
  code: number,
  message: string
): NextResponse {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id,
      error: { code, message },
    },
    {
      status: code === MCP_ERRORS.PARSE_ERROR.code ? 400 :
              code === MCP_ERRORS.AUTH_REQUIRED.code ? 401 :
              code === MCP_ERRORS.FORBIDDEN.code ? 403 :
              code >= 32000 ? 500 : 400,
      headers: {
        "MCP-Protocol-Version": "2026-07-28",
        "Content-Type": "application/json",
      },
    }
  );
}

// Helper: Return MCP JSON-RPC success response
function mcpResult(id: string | number, result: unknown): NextResponse {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id,
      result,
    },
    {
      headers: {
        "MCP-Protocol-Version": "2026-07-28",
        "Content-Type": "application/json",
      },
    }
  );
}
