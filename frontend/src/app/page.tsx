import Link from "next/link";
import { getPublicJobs } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await getPublicJobs();

  return (
    <main className="page-shell">
      <section className="glass-card overflow-hidden p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-[var(--accent-2)]/50 px-3 py-1 text-sm font-semibold">
              Ostora Frontend - Next.js + TypeScript
            </p>
            <h1 className="hero-title mb-4">Find the job that changes your trajectory.</h1>
            <p className="max-w-xl text-[var(--muted)]">
              Public pages are server-rendered for performance and SEO. Authenticated spaces run on
              CSR with role-based protection and Redux state.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="ring-focus rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white">
                Go to Login
              </Link>
              <Link
                href="/jobs/1"
                className="ring-focus rounded-full border border-[var(--foreground)]/30 bg-white px-5 py-3 font-semibold"
              >
                Dynamic Job Route
              </Link>
            </div>
          </div>
          <div className="glass-card p-5">
            <h2 className="mb-4 text-lg font-bold">Live Job Snapshot (SSR)</h2>
            <ul className="space-y-3">
              {jobs.slice(0, 3).map((job) => (
                <li key={job.id} className="rounded-xl border border-[var(--foreground)]/15 bg-white p-3">
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-sm text-[var(--muted)]">{job.company}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
