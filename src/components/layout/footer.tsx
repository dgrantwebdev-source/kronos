import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Kronos</h3>
            <p className="mt-1 text-sm text-zinc-400">
              &mdash; The Agent Marketplace
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Built for the AI Tinkerer
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-300">Links</h4>
            <ul className="mt-2 space-y-2">
              <li>
                <Link
                  href="https://github.com"
                  className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://x.com"
                  className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  Twitter / X
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-300">Protocol</h4>
            <p className="mt-2 text-sm text-zinc-400">
              Powered by MCP Protocol
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-800 pt-8 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Kronos. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
