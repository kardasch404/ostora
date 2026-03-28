import Link from "next/link";
import { getPublicJobs } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await getPublicJobs();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="container-app flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-black rounded-button flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-black">Ostora</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/login" className="nav-link">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container-app py-20">
        <div className="grid-asymmetric items-center">
          <div className="space-y-6">
            <div className="badge-dark inline-flex">
              AI-Powered Job Matching
            </div>
            <h1 className="text-display-lg text-balance">
              Find the job that changes your trajectory
            </h1>
            <p className="text-body-lg text-gray-600 max-w-xl">
              Enterprise job platform with intelligent matching, automated applications, and real-time analytics.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/login" className="btn-primary">
                Start Applying
              </Link>
              <Link href="/jobs/1" className="btn-secondary">
                Explore Jobs
              </Link>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card space-y-6">
            <div>
              <p className="text-caption text-gray-400">Platform Stats</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-4xl font-bold text-black">10,000+</p>
                  <p className="text-body-sm text-gray-500">Active Jobs</p>
                </div>
                <div className="divider"></div>
                <div>
                  <p className="text-4xl font-bold text-black">5,000+</p>
                  <p className="text-body-sm text-gray-500">Companies</p>
                </div>
                <div className="divider"></div>
                <div>
                  <p className="text-4xl font-bold text-black">95%</p>
                  <p className="text-body-sm text-gray-500">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Jobs Section */}
      <section className="container-app py-16">
        <div className="mb-8">
          <p className="text-caption text-gray-400">Latest Opportunities</p>
          <h2 className="text-display-md mt-2">Live Job Openings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.slice(0, 6).map((job, index) => (
            <article
              key={job.id}
              className="card-flat hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="icon-wrapper">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <span className="badge text-xs">Remote</span>
              </div>
              <h3 className="text-display-sm mb-2">{job.title}</h3>
              <p className="text-body-sm text-gray-500 mb-4">{job.company}</p>
              <Link href={`/jobs/${job.id}`} className="text-body-sm font-medium text-black hover:underline">
                View Details →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-y border-gray-200 py-20">
        <div className="container-app">
          <div className="text-center mb-12">
            <p className="text-caption text-gray-400">Why Choose Ostora</p>
            <h2 className="text-display-md mt-2">Premium Features</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="icon-wrapper-dark mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="text-display-sm">AI Matching</h3>
              <p className="text-body text-gray-600">Intelligent job recommendations based on your profile and preferences</p>
            </div>

            <div className="text-center space-y-4">
              <div className="icon-wrapper-dark mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-display-sm">Fast Apply</h3>
              <p className="text-body text-gray-600">Apply to multiple jobs with one click using saved profiles</p>
            </div>

            <div className="text-center space-y-4">
              <div className="icon-wrapper-dark mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="text-display-sm">Analytics</h3>
              <p className="text-body text-gray-600">Track your applications with real-time insights and reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container-app">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-button flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                </div>
                <span className="text-lg font-bold">Ostora</span>
              </div>
              <p className="text-body-sm text-gray-400">Enterprise job platform with AI-powered matching</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-body-sm text-gray-400">
                <li><Link href="/jobs" className="hover:text-white">Find Jobs</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-body-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-body-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="divider bg-gray-800"></div>
          <p className="text-body-sm text-gray-400 text-center">© 2024 Ostora. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
