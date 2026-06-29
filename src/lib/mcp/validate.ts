import { MCPRequestSchema, CapabilityRegistrationSchema, type MCPRequest } from "./types";
import type { NextRequest } from "next/server";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates MCP protocol headers
 */
export function validateMcpHeaders(request: NextRequest): ValidationResult<{
  method: string;
  name: string;
  protocolVersion: string;
}> {
  const mcpMethod = request.headers.get("Mcp-Method");
  const mcpName = request.headers.get("Mcp-Name");
  const protocolVersion = request.headers.get("MCP-Protocol-Version");

  if (!mcpMethod || !mcpName) {
    return {
      success: false,
      error: "Missing required MCP headers: Mcp-Method, Mcp-Name",
    };
  }

  if (protocolVersion !== "2026-07-28") {
    return {
      success: false,
      error: `Unsupported MCP protocol version: ${protocolVersion}. Expected 2026-07-28`,
    };
  }

  return {
    success: true,
    data: { method: mcpMethod, name: mcpName, protocolVersion },
  };
}

/**
 * Validates a JSON-RPC 2.0 MCP request body
 */
export function validateMcpRequestBody(body: unknown): ValidationResult<MCPRequest> {
  const result = MCPRequestSchema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      error: `Invalid MCP request: ${result.error.message}`,
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates a capability registration payload
 */
export function validateCapabilityRegistration(body: unknown) {
  const result = CapabilityRegistrationSchema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      error: `Invalid capability: ${result.error.message}`,
      issues: result.error.issues,
    };
  }
  return { success: true, data: result.data };
}

// Standard MCP error codes
export const MCP_ERRORS = {
  PARSE_ERROR: { code: -32700, message: "Parse error" },
  INVALID_REQUEST: { code: -32600, message: "Invalid request" },
  METHOD_NOT_FOUND: { code: -32601, message: "Method not found" },
  INVALID_PARAMS: { code: -32602, message: "Invalid params" },
  INTERNAL_ERROR: { code: -32603, message: "Internal error" },
  AUTH_REQUIRED: { code: -32001, message: "Authentication required" },
  FORBIDDEN: { code: -32003, message: "Forbidden" },
  RATE_LIMITED: { code: -32029, message: "Rate limited" },
} as const;
