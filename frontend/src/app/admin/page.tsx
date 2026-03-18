"use client";

export default function AdminPage() {
  return (
    <main className="page-shell">
      <section className="glass-card p-8">
        <p className="mb-1 text-sm text-[var(--muted)]">Role-protected route</p>
        <h1 className="mb-3 text-3xl font-bold">Admin Control Panel</h1>
        <p className="text-[var(--muted)]">
          This route is guarded by middleware and only allows users with ADMIN role.
        </p>
      </section>
    </main>
  );
}
