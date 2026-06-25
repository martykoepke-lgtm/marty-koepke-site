import { createAuthClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    /* env missing — sidebar shows without email */
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar userEmail={userEmail} />
      <main className="console-workspace flex-1 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
