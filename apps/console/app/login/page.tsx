import { signIn } from "./actions";

type SearchParams = Promise<{ error?: string; next?: string; notice?: string }>;

export const metadata = {
  title: "Sign in — Practical Informatics Console",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = params?.error;
  const notice = params?.notice;
  const next = params?.next ?? "/";

  const envMissing =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-xl font-semibold text-paper tracking-tight">
            Practical Informatics
          </div>
          <div className="text-sm text-paper/65 mt-1">Operator console</div>
        </div>

        {envMissing ? (
          <div className="border border-rule-strong bg-paper rounded-md p-5 text-sm">
            <div className="font-medium text-forest-dark mb-2">
              Configuration needed
            </div>
            <p className="text-charcoal/80 leading-relaxed">
              The console is missing Supabase environment variables. Add{" "}
              <code className="bg-cream-dim px-1.5 py-0.5 rounded text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="bg-cream-dim px-1.5 py-0.5 rounded text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              to <code className="bg-cream-dim px-1.5 py-0.5 rounded text-xs">.env.local</code>{" "}
              and restart the dev server.
            </p>
          </div>
        ) : (
          <form
            action={signIn}
            className="border border-rule-strong bg-paper rounded-md p-6 space-y-4"
          >
            <input type="hidden" name="next" value={next} />

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                className="w-full border border-rule-strong rounded-md px-3 py-2 text-sm bg-paper-dim focus:bg-paper focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-rule-strong rounded-md px-3 py-2 text-sm bg-paper-dim focus:bg-paper focus:outline-none focus:border-forest"
              />
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            {notice && (
              <div className="text-xs text-forest-dark bg-forest/5 border border-forest/20 rounded-md px-3 py-2">
                {notice}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-forest text-cream rounded-md py-2 text-sm font-medium hover:bg-forest-dark transition-colors"
            >
              Sign in
            </button>
          </form>
        )}

        <p className="text-xs text-paper/58 text-center mt-6">
          Console access is operator-only. Add yourself in Supabase Studio →
          Authentication → Users.
        </p>
      </div>
    </main>
  );
}
