import Link from "next/link";
import { getPublicJobs } from "@/lib/server-api";
import OstoraLogo from "@/components/brand/OstoraLogo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await getPublicJobs();

  return (
    <main className="min-h-screen bg-[#060606] text-white">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(255,255,255,0.07),transparent_25%)]" />

        <nav className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <OstoraLogo
            href="/"
            textClassName="text-xl font-extrabold tracking-tight text-[#f5d48d]"
            iconWrapperClassName="grid h-10 w-10 place-items-center rounded-xl border border-[#f5d48d]/35 bg-[#f5d48d]/10"
          />

          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/50 hover:bg-white/10">
              Sign In
            </Link>
            <Link href="/register" className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-white/85">
              Get Started
            </Link>
          </div>
        </nav>

        <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24">
          <div>
            <span className="inline-flex rounded-full border border-[#f5d48d]/30 bg-[#f5d48d]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5d48d]">
              Premium AI Career OS
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Build a <span className="bg-gradient-to-r from-[#f8e2aa] to-[#c58f2f] bg-clip-text text-transparent">premium career engine</span>, not just another application list.
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/70 sm:text-lg">
              Ostora merges AI matching, multi-channel applications, and insight dashboards into one premium black workspace designed for speed and focus.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/85">
                Start Applying
              </Link>
              <Link href="/jobs/1" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/55 hover:bg-white/10">
                Explore Jobs
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
                <p className="text-2xl font-black">10K+</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/60">Active Jobs</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
                <p className="text-2xl font-black">5K+</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/60">Companies</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
                <p className="text-2xl font-black">95%</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/60">Success Rate</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.45)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Application Pulse</p>
            <div className="mt-6 space-y-4">
              {[
                "CV match score climbed by +18% this week",
                "3 premium roles are waiting for one-click apply",
                "Your profile visibility is in top 12%",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/85">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Realtime Conversion</p>
              <p className="mt-2 text-3xl font-black">+42.7%</p>
              <p className="mt-1 text-sm text-white/65">Average interview callback uplift after AI optimization.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Live Opportunities</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Top Jobs Right Now</h2>
          </div>
          <Link href="/jobs" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/50 hover:text-white">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.slice(0, 6).map((job) => (
            <article key={job.id} className="group rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 transition hover:-translate-y-1 hover:border-white/30 hover:bg-[#111]">
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Remote</div>
                <span className="text-xs text-white/45">Live</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">{job.title}</h3>
              <p className="mt-2 text-sm text-white/60">{job.company}</p>
              <div className="mt-5">
                <Link href={`/jobs/${job.id}`} className="inline-flex rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 transition hover:border-white/55 hover:text-white">
                  Open Role
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-14 md:grid-cols-3">
          {[
            {
              title: "AI Matching",
              text: "Precision ranking built from your profile, behavior, and skill trajectory.",
            },
            {
              title: "Fast Apply",
              text: "Push your profile to multiple quality roles without repetitive forms.",
            },
            {
              title: "Analytics",
              text: "Track conversion at each stage and optimize the funnel with confidence.",
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-xl font-bold tracking-tight">{feature.title}</h3>
              <p className="mt-3 text-sm text-white/65">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-7xl px-6 py-10 text-sm text-white/55">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p>© 2026 Ostora. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
