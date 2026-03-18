"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAppSelector } from "@/store/hooks";
import Link from "next/link";

export default function DashboardPage() {
  const authState = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState({
    applications: 12,
    interviews: 4,
    savedJobs: 36,
    profileViews: 89,
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await apiClient.get("/api/v1/users/me");
        setUser(response.data?.data || authState.user);
      } catch {
        setUser(authState.user);
      }
    };
    loadData();
  }, [authState.user]);

  const recentApplications = [
    { id: 1, title: "Senior Developer", company: "Tech Corp", status: "Under Review", date: "2 days ago", logo: "TC" },
    { id: 2, title: "Full Stack Engineer", company: "StartupXYZ", status: "Interview", date: "5 days ago", logo: "SX" },
    { id: 3, title: "Backend Developer", company: "MegaSoft", status: "Rejected", date: "1 week ago", logo: "MS" },
  ];

  const recommendedJobs = [
    { id: 1, title: "Senior Frontend Developer", company: "Innovation Labs", location: "Remote", salary: "$120k - $150k", match: 95 },
    { id: 2, title: "DevOps Engineer", company: "Cloud Systems", location: "Berlin", salary: "$100k - $130k", match: 88 },
    { id: 3, title: "Product Manager", company: "Digital Ventures", location: "London", salary: "$110k - $140k", match: 82 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || user?.name || "User"}! 👋
        </h1>
        <p className="text-purple-100 mb-6">
          You have {stats.applications} active applications and {stats.interviews} upcoming interviews
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/jobs"
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Find Jobs
          </Link>
          <Link
            href="/dashboard/profile"
            className="px-6 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-green-500 text-sm font-semibold">+12%</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Applications</p>
          <p className="text-3xl font-bold text-gray-900">{stats.applications}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-green-500 text-sm font-semibold">+2</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Interviews</p>
          <p className="text-3xl font-bold text-gray-900">{stats.interviews}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span className="text-green-500 text-sm font-semibold">+8</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Saved Jobs</p>
          <p className="text-3xl font-bold text-gray-900">{stats.savedJobs}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-green-500 text-sm font-semibold">+23</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Profile Views</p>
          <p className="text-3xl font-bold text-gray-900">{stats.profileViews}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
            <Link href="/dashboard/applications" className="text-purple-600 hover:text-purple-700 text-sm font-semibold">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-purple-200 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {app.logo}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.title}</h3>
                    <p className="text-sm text-gray-600">{app.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    app.status === "Interview" ? "bg-green-100 text-green-700" :
                    app.status === "Under Review" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {app.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{app.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recommended</h2>
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="space-y-4">
            {recommendedJobs.map((job) => (
              <div key={job.id} className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    {job.match}% Match
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{job.location}</span>
                  <span className="font-semibold text-gray-700">{job.salary}</span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/jobs"
            className="mt-4 block w-full text-center py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
          >
            View All Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
