"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-zinc-100">
            Kronos
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/explore"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Explore
            </Link>
            <Link
              href="/dashboard/register"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Register Agent
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className="btn-secondary text-sm">
                Dashboard
              </Link>
              <button onClick={handleSignOut} className="btn-ghost text-sm">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
