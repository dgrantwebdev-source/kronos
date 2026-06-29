"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateApiKey, maskApiKey } from "@/lib/api-keys/crypto";
import { cn, formatDate } from "@/lib/utils";
import {
  Key,
  Plus,
  Copy,
  X,
  Loader2,
  Ban,
  Eye,
  EyeOff,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const supabase = createClient();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [newKeyId, setNewKeyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("api_keys")
      .select("id, name, prefix, created_at, last_used_at, is_active")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setKeys(data ?? []);
    setLoading(false);
  }

  async function generateNewKey() {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setGenerating(false);
      return;
    }

    const { key, prefix, hash } = generateApiKey();

    const { data, error: insertError } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        name: newKeyName.trim(),
        prefix,
        hash,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to create key");
      setGenerating(false);
      return;
    }

    setNewKeyId(data.id);
    setGeneratedKey(key);
    setCopied(false);
    setGenerating(false);
    setNewKeyName("");

    await loadKeys();
  }

  async function revokeKey(id: string) {
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", id);

    if (!error) {
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, is_active: false } : k))
      );
    }
  }

  async function copyKey() {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
    }
  }

  function closeModal() {
    setShowModal(false);
    setGeneratedKey(null);
    setNewKeyId(null);
    setNewKeyName("");
    setCopied(false);
    setShowKey(false);
    setError(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage API keys for programmatic access to your capabilities.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Generate New Key
        </button>
      </div>

      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Key className="mb-4 h-12 w-12 text-zinc-600" />
          <h2 className="heading-2 mb-2">No API keys yet</h2>
          <p className="mb-6 text-sm text-zinc-500">
            Generate your first API key to start integrating programmatically.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className={cn(
                "card flex items-center justify-between",
                !key.is_active && "opacity-50"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    key.is_active
                      ? "bg-primary-900/30 text-primary-400"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {key.name}
                  </p>
                  <p className="text-xs font-mono text-zinc-500">
                    {maskApiKey(key.prefix.padEnd(12, "*"))}
                  </p>
                  <div className="mt-1 flex gap-3 text-xs text-zinc-600">
                    <span>Created {formatDate(key.created_at)}</span>
                    {key.last_used_at && (
                      <span>Last used {formatDate(key.last_used_at)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {newKeyId === key.id && generatedKey && (
                  <button onClick={copyKey} className="btn-ghost text-xs">
                    {copied ? (
                      "Copied!"
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
                {key.is_active ? (
                  <button
                    onClick={() => revokeKey(key.id)}
                    className="btn-ghost text-xs text-red-400 hover:text-red-300"
                  >
                    <Ban className="mr-1 h-3 w-3" />
                    Revoke
                  </button>
                ) : (
                  <span className="text-xs text-zinc-600">Revoked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="heading-3">Generate New API Key</h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {generatedKey ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-400">
                  <strong>Save this key now.</strong> You won&apos;t be able to
                  see it again after closing this dialog.
                </div>

                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    readOnly
                    className="input font-mono text-xs pr-20"
                    value={generatedKey}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyKey}
                    className="btn-primary flex-1"
                  >
                    {copied ? (
                      "Copied!"
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Key
                      </>
                    )}
                  </button>
                  <button onClick={closeModal} className="btn-secondary">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="key-name" className="label">
                    Key Name
                  </label>
                  <input
                    id="key-name"
                    type="text"
                    className="input mt-1"
                    placeholder="e.g. Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") generateNewKey();
                    }}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={generateNewKey}
                    disabled={generating || !newKeyName.trim()}
                    className="btn-primary flex-1"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </button>
                  <button onClick={closeModal} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
