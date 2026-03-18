import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="page-shell">
      <section className="glass-card p-8 text-center">
        <h1 className="mb-3 text-3xl font-bold">403 - Forbidden</h1>
        <p className="mb-6 text-[var(--muted)]">You do not have permission to access this page.</p>
        <Link href="/dashboard" className="ring-focus rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
