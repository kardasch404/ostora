import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicJobById } from "@/lib/server-api";

interface JobDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { id } = await params;
  const job = await getPublicJobById(id);

  if (!job) {
    notFound();
  }

  return (
    <main className="page-shell">
      <article className="glass-card p-8">
        <p className="mb-2 inline-flex rounded-full bg-[var(--accent-2)]/60 px-3 py-1 text-xs font-semibold">
          Dynamic route /jobs/[id] - SSR
        </p>
        <h1 className="mb-2 text-4xl font-bold">{job.title}</h1>
        <p className="mb-6 text-[var(--muted)]">
          {job.company} · {job.city} · {job.remote ? "Remote" : "On-site"}
        </p>
        <p className="mb-8 max-w-3xl leading-7">{job.description}</p>
        <Link href="/" className="ring-focus rounded-lg border border-[var(--foreground)]/20 bg-white px-4 py-2">
          Back to home
        </Link>
      </article>
    </main>
  );
}
