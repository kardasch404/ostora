"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  linkedIn: string;
  github: string;
  website: string;
}

interface ApiUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  summary?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
}

const emptyProfile: ProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  title: "",
  summary: "",
  linkedIn: "",
  github: "",
  website: "",
};

type ProfileTab = "personal" | "education" | "work" | "demographic";

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [languages, setLanguages] = useState<string[]>(["English - Intermediate", "Arabic - Native"]);
  const [interests, setInterests] = useState<string[]>(["Networking", "Open Source"]);
  const [languageInput, setLanguageInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/api/v1/users/me");
        const raw: ApiUser = (res.data?.data || res.data || {}) as ApiUser;

        setUserId(raw.id || "");

        const fallbackName = raw.name || "";
        const fallbackFirst = fallbackName.split(" ")[0] || "";
        const fallbackLast = fallbackName.split(" ").slice(1).join(" ");

        setForm({
          firstName: raw.firstName || fallbackFirst,
          lastName: raw.lastName || fallbackLast,
          email: raw.email || "",
          phone: raw.phone || "",
          location: raw.location || "",
          title: raw.title || "",
          summary: raw.summary || "",
          linkedIn: raw.linkedIn || "",
          github: raw.github || "",
          website: raw.website || "",
        });
      } catch {
        setError("Could not load profile data.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const completion = useMemo(() => {
    const values = [
      form.firstName,
      form.lastName,
      form.email,
      form.phone,
      form.location,
      form.title,
      form.summary,
      form.linkedIn,
      form.github,
      form.website,
    ];
    const filled = values.filter((value) => value.trim().length > 0).length;
    return Math.round((filled / values.length) * 100);
  }, [form]);

  const completionItems = useMemo(
    () => [
      { label: "About Me", done: form.summary.trim().length > 0 },
      { label: "Languages", done: languages.length > 0 },
      { label: "Social Profiles", done: Boolean(form.linkedIn || form.github || form.website) },
      { label: "Contact Info", done: Boolean(form.email && form.phone && form.location) },
      { label: "Interests", done: interests.length > 0 },
    ],
    [form, interests.length, languages.length],
  );

  const fullName = useMemo(() => {
    const value = `${form.firstName} ${form.lastName}`.trim();
    return value || "Your Name";
  }, [form.firstName, form.lastName]);

  const initials = useMemo(() => {
    const first = form.firstName.trim().charAt(0).toUpperCase();
    const last = form.lastName.trim().charAt(0).toUpperCase();
    return `${first}${last}`.trim() || "U";
  }, [form.firstName, form.lastName]);

  const setField = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  };

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  const addLanguage = () => {
    const value = languageInput.trim();
    if (!value) return;
    setLanguages((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setLanguageInput("");
  };

  const addInterest = () => {
    const value = interestInput.trim();
    if (!value) return;
    setInterests((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setInterestInput("");
  };

  const removeLanguage = (value: string) => {
    setLanguages((prev) => prev.filter((item) => item !== value));
  };

  const removeInterest = (value: string) => {
    setInterests((prev) => prev.filter((item) => item !== value));
  };

  const copyProfileLink = async () => {
    if (typeof window === "undefined") return;
    const profileUrl = `${window.location.origin}/dashboard/profile`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setSuccess("Profile link copied.");
    } catch {
      setError("Could not copy profile link.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!userId) {
        throw new Error("Missing user id");
      }

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        location: form.location,
        title: form.title,
        summary: form.summary,
        linkedIn: form.linkedIn,
        github: form.github,
        website: form.website,
      };

      await apiClient.put(`/api/v1/users/${userId}`, payload);
      setSuccess("Profile updated successfully.");
    } catch {
      setError("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm flex items-start gap-2">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          Your profile is visible to recruiters based on what you complete here.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative h-44 sm:h-64">
          <div
            role="img"
            aria-label="Cover"
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${coverPreview || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1400&q=80"})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
          <div className="absolute left-6 bottom-6 text-white max-w-xl">
            <p className="text-xs uppercase tracking-wider text-yellow-300 font-semibold">Profile Spotlight</p>
            <h1 className="text-2xl sm:text-4xl leading-tight font-semibold">Showcase your potential here</h1>
          </div>
          <label className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
        </div>

        <div className="relative px-5 sm:px-8 pb-6">
          <div className="-mt-12 sm:-mt-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm relative flex items-center justify-center">
                {avatarPreview ? (
                  <div
                    role="img"
                    aria-label="Avatar"
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatarPreview})` }}
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-purple-700">{initials}</span>
                )}
                <label className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-xs font-semibold">
                  Edit
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <div className="pb-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{fullName}</h2>
                <p className="text-sm text-gray-600 mt-1">{form.title || "Add your current title"}</p>
                <p className="text-sm text-gray-500 mt-1">{form.location || "Add your location"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyProfileLink}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => firstNameInputRef.current?.focus()}
                className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 text-sm font-semibold"
              >
                Edit profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 sm:p-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {[
            { id: "personal", label: "Personal Information" },
            { id: "education", label: "Education Info" },
            { id: "work", label: "Work Info" },
            { id: "demographic", label: "Demographic Info" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "personal" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">About me</h3>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
              <textarea
                rows={6}
                value={form.summary}
                onChange={(e) => setField("summary", e.target.value)}
                placeholder="Tell recruiters what drives you, what you build, and what problems you love solving."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal details</h3>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    ref={firstNameInputRef}
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    placeholder="First name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="Email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="Phone"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    placeholder="Location"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="Current role"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Languages</h3>
                  <div className="space-y-2 mb-3">
                    {languages.map((language) => (
                      <div key={language} className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-sm">
                        <span className="text-gray-700">{language}</span>
                        <button
                          type="button"
                          onClick={() => removeLanguage(language)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      placeholder="French - Basic"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addLanguage}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Social profiles</h3>
                  <div className="space-y-2">
                    <input
                      value={form.linkedIn}
                      onChange={(e) => setField("linkedIn", e.target.value)}
                      placeholder="LinkedIn URL"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      value={form.github}
                      onChange={(e) => setField("github", e.target.value)}
                      placeholder="GitHub URL"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      value={form.website}
                      onChange={(e) => setField("website", e.target.value)}
                      placeholder="Portfolio URL"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {interests.map((interest) => (
                    <span key={interest} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-700">
                      {interest}
                      <button type="button" onClick={() => removeInterest(interest)} className="text-gray-400 hover:text-red-500">
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="Machine learning"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addInterest}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Current location</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold text-gray-900">Country of origin:</span> {form.location || "Not set"}</p>
                  <p><span className="font-semibold text-gray-900">Residence:</span> {form.location || "Not set"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Personal info completion</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{completion}%</span>
              </div>
              <p className="text-sm text-gray-600">Complete your profile to improve job match quality.</p>
            </div>
            <div className="space-y-2">
              {completionItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done ? (
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    </svg>
                  )}
                  <span className={item.done ? "text-gray-700" : "text-gray-500"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab !== "personal" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {activeTab === "education" ? "Education Info" : activeTab === "work" ? "Work Info" : "Demographic Info"}
          </h3>
          <p className="text-gray-500 mb-4">This section is prepared for the next step. You can start with Personal Information now.</p>
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
          >
            Back to Personal Information
          </button>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
    </div>
  );
}
