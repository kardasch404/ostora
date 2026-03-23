"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "MA", name: "Morocco", dialCode: "+212" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "ES", name: "Spain", dialCode: "+34" },
  { code: "IT", name: "Italy", dialCode: "+39" },
  { code: "NL", name: "Netherlands", dialCode: "+31" },
  { code: "BE", name: "Belgium", dialCode: "+32" },
  { code: "CH", name: "Switzerland", dialCode: "+41" },
  { code: "AT", name: "Austria", dialCode: "+43" },
  { code: "SE", name: "Sweden", dialCode: "+46" },
  { code: "NO", name: "Norway", dialCode: "+47" },
  { code: "DK", name: "Denmark", dialCode: "+45" },
  { code: "FI", name: "Finland", dialCode: "+358" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "IE", name: "Ireland", dialCode: "+353" },
  { code: "PT", name: "Portugal", dialCode: "+351" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "MX", name: "Mexico", dialCode: "+52" },
  { code: "BR", name: "Brazil", dialCode: "+55" },
  { code: "AR", name: "Argentina", dialCode: "+54" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { code: "QA", name: "Qatar", dialCode: "+974" },
  { code: "EG", name: "Egypt", dialCode: "+20" },
  { code: "DZ", name: "Algeria", dialCode: "+213" },
  { code: "TN", name: "Tunisia", dialCode: "+216" },
  { code: "TR", name: "Turkey", dialCode: "+90" },
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "PK", name: "Pakistan", dialCode: "+92" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "CN", name: "China", dialCode: "+86" },
  { code: "KR", name: "South Korea", dialCode: "+82" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "NZ", name: "New Zealand", dialCode: "+64" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
];

const PROFILE_DRAFT_KEY = "ostora.profile.draft.v2";

type ProfileTab = "personal" | "education" | "work" | "demographic";
type Visibility = "PUBLIC" | "PRIVATE" | "RECRUITERS_ONLY";

interface WorkEntry {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  summary?: string;
}

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  grade?: string;
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  avatar: string;
  title: string;
  company: string;
  industry: string;
  experienceYears: string;
  salary: string;
  salaryCurrency: string;
  location: string;
  remote: boolean;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
  birthDate: string;
  city: string;
  country: string;
  postalCode: string;
  address: string;
  visibility: Visibility;
}

interface EducationForm {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  grade: string;
}

interface ApiProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  title?: string;
  company?: string;
  industry?: string;
  experienceYears?: number;
  salary?: number;
  salaryCurrency?: string;
  location?: string;
  remote?: boolean;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  birthDate?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  address?: string;
  visibility?: Visibility;
  jobPreferences?: { workEntries?: WorkEntry[]; coverImageUrl?: string };
}

const emptyProfile: ProfileForm = {
  firstName: "",
  lastName: "",
  phone: "",
  bio: "",
  avatar: "",
  title: "",
  company: "",
  industry: "",
  experienceYears: "",
  salary: "",
  salaryCurrency: "USD",
  location: "",
  remote: false,
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  websiteUrl: "",
  birthDate: "",
  city: "",
  country: "",
  postalCode: "",
  address: "",
  visibility: "PUBLIC",
};

const emptyEducation: EducationForm = {
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
  grade: "",
};

function unwrap<T>(payload: unknown): T {
  const value = payload as { data?: T } & T;
  if (value && typeof value === "object" && "data" in value && value.data !== undefined) {
    return value.data;
  }
  return value as T;
}

function parseError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data?.message[0] || fallback;
    if (typeof data?.message === "string") return data.message;
  }
  return fallback;
}

function toDateInput(value?: string | Date): string {
  if (!value) return "";
  const raw = typeof value === "string" ? value : value.toISOString();
  return raw.slice(0, 10);
}

function toNumOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function flagFromCode(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function sanitizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function findCountryByName(name?: string): CountryOption | undefined {
  const target = (name || "").trim().toLowerCase();
  return COUNTRY_OPTIONS.find((item) => item.name.toLowerCase() === target);
}

function findCountryByCode(code?: string): CountryOption {
  return COUNTRY_OPTIONS.find((item) => item.code === code) || COUNTRY_OPTIONS[0];
}

function findCountryByPhone(phone?: string): CountryOption | undefined {
  if (!phone?.startsWith("+")) return undefined;
  return [...COUNTRY_OPTIONS]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((item) => phone.startsWith(item.dialCode));
}

function splitLocalPhone(phone: string | undefined, countryCode: string): string {
  if (!phone) return "";
  const country = findCountryByCode(countryCode);
  if (phone.startsWith(country.dialCode)) {
    return sanitizePhoneDigits(phone.slice(country.dialCode.length));
  }
  return sanitizePhoneDigits(phone);
}

function composeInternationalPhone(countryCode: string, localNumber: string): string {
  const country = findCountryByCode(countryCode);
  const digits = sanitizePhoneDigits(localNumber);
  if (!digits) return "";
  return `${country.dialCode}${digits}`;
}

function isValidInternationalPhone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

function getFilledScore(form: ProfileForm): number {
  return Object.values(form).filter((value) => {
    if (typeof value === "boolean") return value;
    return String(value || "").trim().length > 0;
  }).length;
}

function splitLocation(location?: string): { place: string; countryCode: string } {
  const raw = (location || "").trim();
  if (!raw) {
    return { place: "", countryCode: "MA" };
  }

  const matched = COUNTRY_OPTIONS.find((item) => raw.toLowerCase().endsWith(item.name.toLowerCase()));
  if (!matched) {
    return { place: raw, countryCode: "MA" };
  }

  const withoutCountry = raw.slice(0, raw.length - matched.name.length).replace(/[,-]\s*$/, "").trim();
  return { place: withoutCountry, countryCode: matched.code };
}

function composeLocation(place: string, countryCode: string): string {
  const country = findCountryByCode(countryCode).name;
  const cleanPlace = place.trim();
  if (!cleanPlace) return country;
  return `${cleanPlace}, ${country}`;
}

function isLikelyImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const lower = url.pathname.toLowerCase();
    if (/\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i.test(lower)) return true;
    if (lower.includes("/image") || lower.includes("/avatar") || lower.includes("/photo")) return true;
    if (url.hostname.includes("amazonaws.com") || url.hostname.includes("cloudfront.net")) return true;
    return false;
  } catch {
    return false;
  }
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingSection, setSavingSection] = useState<ProfileTab | "" >("");

  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);

  const [eduForm, setEduForm] = useState<EducationForm>(emptyEducation);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduSaving, setEduSaving] = useState(false);

  const [workForm, setWorkForm] = useState<WorkEntry>({
    id: "",
    role: "",
    company: "",
    startDate: "",
    endDate: "",
    current: false,
    summary: "",
  });
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);

  const [coverPreview, setCoverPreview] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState<"" | "avatar" | "cover">("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("MA");
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [locationCountryCode, setLocationCountryCode] = useState("MA");
  const [locationPlace, setLocationPlace] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      let localDraftForm: ProfileForm | null = null;
      if (typeof window !== "undefined") {
        try {
          const rawDraft = window.localStorage.getItem(PROFILE_DRAFT_KEY);
          if (rawDraft) {
            const parsed = JSON.parse(rawDraft) as {
              form?: ProfileForm;
              workEntries?: WorkEntry[];
              education?: EducationEntry[];
              phoneCountryCode?: string;
              phoneLocalNumber?: string;
              locationCountryCode?: string;
              locationPlace?: string;
            };

            if (parsed.form) {
              localDraftForm = parsed.form;
              setForm(parsed.form);
              setWorkEntries(parsed.workEntries || []);
              setEducation(parsed.education || []);
              setPhoneCountryCode(parsed.phoneCountryCode || "MA");
              setPhoneLocalNumber(parsed.phoneLocalNumber || "");
              setLocationCountryCode(parsed.locationCountryCode || "MA");
              setLocationPlace(parsed.locationPlace || "");
              setSuccess("Draft restored from previous session.");
            }
          }
        } catch {
          // Ignore corrupted drafts and continue with server data.
        }
      }

      try {
        const [profileRes, educationRes] = await Promise.all([
          apiClient.get("/api/v1/users/profile"),
          apiClient.get("/api/v1/users/education"),
        ]);

        const profile = unwrap<ApiProfile>(profileRes.data);
        const list = unwrap<EducationEntry[] | { items?: EducationEntry[] }>(educationRes.data);
        const eduList = Array.isArray(list) ? list : list?.items || [];

        const serverForm: ProfileForm = {
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          phone: profile?.phone || "",
          bio: profile?.bio || "",
          avatar: profile?.avatar || "",
          title: profile?.title || "",
          company: profile?.company || "",
          industry: profile?.industry || "",
          experienceYears: profile?.experienceYears?.toString?.() || "",
          salary: profile?.salary?.toString?.() || "",
          salaryCurrency: profile?.salaryCurrency || "USD",
          location: profile?.location || "",
          remote: Boolean(profile?.remote),
          linkedinUrl: profile?.linkedinUrl || "",
          githubUrl: profile?.githubUrl || "",
          portfolioUrl: profile?.portfolioUrl || "",
          websiteUrl: profile?.websiteUrl || "",
          birthDate: toDateInput(profile?.birthDate),
          city: profile?.city || "",
          country: profile?.country || "",
          postalCode: profile?.postalCode || "",
          address: profile?.address || "",
          visibility: (profile?.visibility as Visibility) || "PUBLIC",
        };

        const selectedForm = localDraftForm && getFilledScore(localDraftForm) > getFilledScore(serverForm)
          ? localDraftForm
          : serverForm;

        setForm(selectedForm);

        const inferredCountry =
          findCountryByName(selectedForm.country) ||
          findCountryByPhone(selectedForm.phone) ||
          COUNTRY_OPTIONS[0];
        setPhoneCountryCode(inferredCountry.code);
        setPhoneLocalNumber(splitLocalPhone(selectedForm.phone, inferredCountry.code));

        const locationParts = splitLocation(selectedForm.location);
        setLocationCountryCode(locationParts.countryCode);
        setLocationPlace(locationParts.place);

        const persistedWork = profile?.jobPreferences?.workEntries;
        const persistedCover = profile?.jobPreferences?.coverImageUrl || "";
        setWorkEntries(Array.isArray(persistedWork) ? persistedWork : []);
        setCoverImageUrl(persistedCover);
        setEducation(eduList);
      } catch (loadErr) {
        if (axios.isAxiosError(loadErr) && loadErr.response?.status === 404) {
          setEducation([]);
          setWorkEntries([]);
          setForm(emptyProfile);
        } else {
          setError(parseError(loadErr, "Could not load profile data."));
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;

    const payload = {
      form,
      education,
      workEntries,
      phoneCountryCode,
      phoneLocalNumber,
      locationCountryCode,
      locationPlace,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(payload));
  }, [
    education,
    form,
    loading,
    locationCountryCode,
    locationPlace,
    phoneCountryCode,
    phoneLocalNumber,
    workEntries,
  ]);

  useEffect(() => {
    const composed = composeLocation(locationPlace, locationCountryCode);
    setForm((prev) => (prev.location === composed ? prev : { ...prev, location: composed }));
  }, [locationCountryCode, locationPlace]);

  const fullName = useMemo(() => {
    const value = `${form.firstName} ${form.lastName}`.trim();
    return value || "Your Name";
  }, [form.firstName, form.lastName]);

  const initials = useMemo(() => {
    const first = form.firstName.trim().charAt(0).toUpperCase();
    const last = form.lastName.trim().charAt(0).toUpperCase();
    return `${first}${last}`.trim() || "U";
  }, [form.firstName, form.lastName]);

  const completion = useMemo(() => {
    const checks = [
      form.firstName,
      form.lastName,
      form.phone,
      form.bio,
      form.title,
      form.location,
      form.city,
      form.country,
      form.linkedinUrl,
      form.githubUrl,
      form.websiteUrl,
      education.length > 0 ? "yes" : "",
      workEntries.length > 0 ? "yes" : "",
    ];

    const filled = checks.filter((v) => String(v).trim().length > 0).length;
    return Math.round((filled / checks.length) * 100);
  }, [education.length, form, workEntries.length]);

  const setField = (key: keyof ProfileForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSuccess("");
  };

  const setInlineError = (key: string, value: string) => {
    setFieldErrors((prev) => ({ ...prev, [key]: value }));
  };

  const clearInlineError = (key: string) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onPhoneCountryChange = (countryCode: string) => {
    setPhoneCountryCode(countryCode);
    const mergedPhone = composeInternationalPhone(countryCode, phoneLocalNumber);
    setForm((prev) => ({
      ...prev,
      phone: mergedPhone,
      country: prev.country || findCountryByCode(countryCode).name,
    }));
    clearInlineError("phone");
  };

  const onPhoneLocalNumberChange = (value: string) => {
    const local = sanitizePhoneDigits(value);
    setPhoneLocalNumber(local);
    const mergedPhone = composeInternationalPhone(phoneCountryCode, local);
    setForm((prev) => ({ ...prev, phone: mergedPhone }));
    clearInlineError("phone");
  };

  const onLocationCountryChange = (countryCode: string) => {
    setLocationCountryCode(countryCode);
    clearInlineError("location");
  };

  const onLocationPlaceChange = (value: string) => {
    setLocationPlace(value);
    clearInlineError("location");
  };

  const uploadProfileImage = async (file: File, kind: "avatar" | "cover") => {
    setUploadingMedia(kind);
    setError("");
    setSuccess("");

    try {
      const createRes = await apiClient.post("/api/v1/users/profile/upload-url", {
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        kind,
      });

      const payload = unwrap<{ uploadUrl: string; publicUrl: string }>(createRes.data);

      if (!payload?.uploadUrl || !payload?.publicUrl) {
        throw new Error("Upload URL was not returned.");
      }

      const uploadRes = await fetch(payload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`S3 upload failed with status ${uploadRes.status}.`);
      }

      if (kind === "avatar") {
        setForm((prev) => ({ ...prev, avatar: payload.publicUrl }));
        await saveProfile("personal", { avatar: payload.publicUrl });
        setSuccess("Avatar uploaded and saved.");
      } else {
        setCoverImageUrl(payload.publicUrl);
        await apiClient.patch("/api/v1/users/profile", {
          jobPreferences: {
            workEntries,
            coverImageUrl: payload.publicUrl,
          },
        });
        setSuccess("Cover photo uploaded and saved.");
      }
    } catch (uploadErr) {
      setError(parseError(uploadErr, `Could not upload ${kind} photo.`));
    } finally {
      setUploadingMedia("");
    }
  };

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    await uploadProfileImage(file, "cover");
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    await uploadProfileImage(file, "avatar");
  };

  const saveProfile = async (tab: ProfileTab, partial: Partial<ProfileForm>, work?: WorkEntry[]) => {
      const effective: ProfileForm = { ...form, ...partial };

    setSavingSection(tab);
    setError("");
    setSuccess("");

    const urlFields: Array<keyof ProfileForm> = [
      "avatar",
      "linkedinUrl",
      "githubUrl",
      "portfolioUrl",
      "websiteUrl",
    ];

    const invalidFields = urlFields.filter((field) => {
      const raw = partial[field];
      if (typeof raw !== "string") return false;
      const value = raw.trim();
      if (!value) return false;
      return !isValidHttpUrl(value);
    });

    if (invalidFields.length > 0) {
      setSavingSection("");
      setError(
        `Please enter valid URLs (starting with http:// or https://) for: ${invalidFields.join(", ")}.`,
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (tab === "personal") {
      if (!String(effective.firstName || "").trim()) {
        setInlineError("firstName", "First name is required.");
        setError("First name is required.");
        setSavingSection("");
        return;
      }
      if (!String(effective.lastName || "").trim()) {
        setInlineError("lastName", "Last name is required.");
        setError("Last name is required.");
        setSavingSection("");
        return;
      }

      if (!String(effective.location || "").trim()) {
        setInlineError("location", "Location is required.");
        setError("Please provide your location.");
        setSavingSection("");
        return;
      }

      if (phoneLocalNumber.trim().length > 0) {
        const composedPhone = composeInternationalPhone(phoneCountryCode, phoneLocalNumber);
        if (!isValidInternationalPhone(composedPhone)) {
          setInlineError("phone", "Use a valid international phone number.");
          setError("Use a valid phone number with country code.");
          setSavingSection("");
          return;
        }
        partial.phone = composedPhone;
      }

      if (effective.linkedinUrl?.trim()) {
        const host = new URL(effective.linkedinUrl).hostname;
        if (!host.includes("linkedin.com")) {
          setInlineError("linkedinUrl", "LinkedIn URL must be from linkedin.com.");
          setError("LinkedIn URL must point to linkedin.com.");
          setSavingSection("");
          return;
        }
      }

      if (effective.githubUrl?.trim()) {
        const host = new URL(effective.githubUrl).hostname;
        if (!host.includes("github.com")) {
          setInlineError("githubUrl", "GitHub URL must be from github.com.");
          setError("GitHub URL must point to github.com.");
          setSavingSection("");
          return;
        }
      }

      if (effective.avatar?.trim() && !isLikelyImageUrl(effective.avatar.trim())) {
        setInlineError("avatar", "Avatar must be a direct image URL (.jpg, .png, .webp, etc)." );
        setError("Avatar URL must point directly to an image file.");
        setSavingSection("");
        return;
      }

      partial.location = composeLocation(locationPlace, locationCountryCode);
    }

    if (tab === "demographic") {
      const countryValue = String(partial.country || "").trim();
      if (!countryValue) {
        setInlineError("country", "Country is required.");
        setError("Please select your country.");
        setSavingSection("");
        return;
      }

      if (!findCountryByName(countryValue)) {
        setInlineError("country", "Select a country from the list.");
        setError("Please select a valid country from the dropdown list.");
        setSavingSection("");
        return;
      }

      if (partial.birthDate && new Date(partial.birthDate).getTime() > Date.now()) {
        setInlineError("birthDate", "Birth date cannot be in the future.");
        setError("Birth date cannot be in the future.");
        setSavingSection("");
        return;
      }
    }

    try {
      const payload = {
        ...partial,
        avatar: typeof partial.avatar === "string" ? partial.avatar.trim() || undefined : partial.avatar,
        linkedinUrl:
          typeof partial.linkedinUrl === "string" ? partial.linkedinUrl.trim() || undefined : partial.linkedinUrl,
        githubUrl: typeof partial.githubUrl === "string" ? partial.githubUrl.trim() || undefined : partial.githubUrl,
        portfolioUrl:
          typeof partial.portfolioUrl === "string" ? partial.portfolioUrl.trim() || undefined : partial.portfolioUrl,
        websiteUrl:
          typeof partial.websiteUrl === "string" ? partial.websiteUrl.trim() || undefined : partial.websiteUrl,
      };

      await apiClient.patch("/api/v1/users/profile", {
        ...payload,
        experienceYears: partial.experienceYears !== undefined ? toNumOrUndefined(String(partial.experienceYears)) : undefined,
        salary: partial.salary !== undefined ? toNumOrUndefined(String(partial.salary)) : undefined,
        jobPreferences: work ? { workEntries: work, ...(coverImageUrl ? { coverImageUrl } : {}) } : undefined,
      });
      setSuccess(`${tab.charAt(0).toUpperCase() + tab.slice(1)} information saved.`);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PROFILE_DRAFT_KEY);
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (saveErr) {
      setError(parseError(saveErr, `Could not save ${tab} information.`));
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setSavingSection("");
    }
  };

  const resetSection = async (tab: ProfileTab) => {
    if (tab === "education") {
      setError("Use delete on each education entry to clear this section.");
      return;
    }

    if (tab === "work") {
      setWorkEntries([]);
      await saveProfile("work", {}, []);
      return;
    }

    if (tab === "personal") {
      const cleared = {
        firstName: "",
        lastName: "",
        phone: "",
        bio: "",
        avatar: "",
        linkedinUrl: "",
        githubUrl: "",
        portfolioUrl: "",
        websiteUrl: "",
      };
      setForm((prev) => ({ ...prev, ...cleared }));
      await saveProfile("personal", cleared);
      return;
    }

    const cleared = {
      birthDate: "",
      city: "",
      country: "",
      postalCode: "",
      address: "",
      visibility: "PUBLIC" as Visibility,
    };

    setForm((prev) => ({ ...prev, ...cleared }));
    await saveProfile("demographic", cleared);
  };

  const saveEducation = async () => {
    if (!eduForm.institution.trim() || !eduForm.degree.trim() || !eduForm.startDate) {
      setError("Institution, degree, and start date are required.");
      return;
    }

    setEduSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        institution: eduForm.institution,
        degree: eduForm.degree,
        field: eduForm.field || undefined,
        startDate: eduForm.startDate,
        endDate: eduForm.current ? undefined : eduForm.endDate || undefined,
        current: eduForm.current,
        description: eduForm.description || undefined,
        grade: eduForm.grade || undefined,
      };

      if (editingEduId) {
        const res = await apiClient.patch(`/api/v1/users/education/${editingEduId}`, payload);
        const updated = unwrap<EducationEntry>(res.data);
        setEducation((prev) => prev.map((item) => (item.id === editingEduId ? updated : item)));
        setSuccess("Education entry updated.");
      } else {
        const res = await apiClient.post("/api/v1/users/education", payload);
        const created = unwrap<EducationEntry>(res.data);
        setEducation((prev) => [created, ...prev]);
        setSuccess("Education entry created.");
      }

      setEduForm(emptyEducation);
      setEditingEduId(null);
    } catch (eduErr) {
      setError(parseError(eduErr, "Could not save education entry."));
    } finally {
      setEduSaving(false);
    }
  };

  const editEducation = (entry: EducationEntry) => {
    setEduForm({
      institution: entry.institution,
      degree: entry.degree,
      field: entry.field || "",
      startDate: toDateInput(entry.startDate),
      endDate: toDateInput(entry.endDate),
      current: Boolean(entry.current),
      description: entry.description || "",
      grade: entry.grade || "",
    });
    setEditingEduId(entry.id);
  };

  const deleteEducation = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/users/education/${id}`);
      setEducation((prev) => prev.filter((entry) => entry.id !== id));
      setSuccess("Education entry deleted.");
      if (editingEduId === id) {
        setEditingEduId(null);
        setEduForm(emptyEducation);
      }
    } catch (deleteErr) {
      setError(parseError(deleteErr, "Could not delete education entry."));
    }
  };

  const saveWorkEntry = () => {
    if (!workForm.role.trim() || !workForm.company.trim() || !workForm.startDate) {
      setError("Role, company, and start date are required for work entry.");
      return;
    }

    const item: WorkEntry = {
      ...workForm,
      id: editingWorkId || `${Date.now()}`,
      endDate: workForm.current ? "" : workForm.endDate,
    };

    if (editingWorkId) {
      setWorkEntries((prev) => prev.map((entry) => (entry.id === editingWorkId ? item : entry)));
      setSuccess("Work entry updated locally. Click Save Work Info to persist.");
    } else {
      setWorkEntries((prev) => [item, ...prev]);
      setSuccess("Work entry added locally. Click Save Work Info to persist.");
    }

    setEditingWorkId(null);
    setWorkForm({ id: "", role: "", company: "", startDate: "", endDate: "", current: false, summary: "" });
  };

  const editWorkEntry = (entry: WorkEntry) => {
    setEditingWorkId(entry.id);
    setWorkForm({
      ...entry,
      startDate: toDateInput(entry.startDate),
      endDate: toDateInput(entry.endDate),
      summary: entry.summary || "",
    });
  };

  const removeWorkEntry = (id: string) => {
    setWorkEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (editingWorkId === id) {
      setEditingWorkId(null);
      setWorkForm({ id: "", role: "", company: "", startDate: "", endDate: "", current: false, summary: "" });
    }
    setSuccess("Work entry removed locally. Click Save Work Info to persist.");
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

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#d6ddd2] bg-[#f8faf7] p-6 text-sm text-[#385246]">
        Loading profile workspace...
      </div>
    );
  }

  return (
    <div
      className="space-y-5 profile-shell"
      style={{
        fontFamily: "Sora, Manrope, ui-sans-serif, system-ui",
      }}
    >
      <div className="profile-bg" aria-hidden="true" />

      <div className="rounded-2xl border border-[#bfe6cf] bg-[#e6f7ee] text-[#1f5d44] px-4 py-3 text-sm flex items-start gap-2 animate-enter">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Your profile powers matching quality and recruiter trust. Complete each section and save changes.</p>
      </div>

      <div className="glass-card overflow-hidden animate-enter delay-1">
        <div className="relative h-52 sm:h-64">
          <div
            role="img"
            aria-label="Cover"
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${coverPreview || coverImageUrl || "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1600&q=80"})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2b30]/75 via-[#0d2b30]/30 to-transparent" />
          <div className="absolute left-6 bottom-6 text-white max-w-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[#ffd8a8] font-semibold">Professional Identity</p>
            <h1 className="text-2xl sm:text-4xl leading-tight font-semibold">Shape a profile recruiters remember</h1>
          </div>
          <label className="absolute right-4 top-4 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-[#0e3a40] flex items-center justify-center cursor-pointer transition-transform hover:scale-105">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
          {uploadingMedia === "cover" && (
            <div className="absolute right-4 top-16 text-[11px] px-2 py-1 rounded bg-black/60 text-white">Uploading cover...</div>
          )}
        </div>

        <div className="relative px-5 sm:px-8 pb-6">
          <div className="-mt-12 sm:-mt-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg relative flex items-center justify-center">
                {avatarPreview || form.avatar ? (
                  <div
                    role="img"
                    aria-label="Avatar"
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatarPreview || form.avatar})` }}
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-[#0d4b55]">{initials}</span>
                )}
                <label className="absolute inset-0 bg-black/45 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-xs font-semibold">
                  Edit
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              {uploadingMedia === "avatar" && (
                <div className="text-[11px] px-2 py-1 rounded bg-[#0b5561] text-white h-fit">Uploading avatar...</div>
              )}

              <div className="pb-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#102a2f]">{fullName}</h2>
                <p className="text-sm text-[#33545a] mt-1">{form.title || "Add your current role"}</p>
                <p className="text-sm text-[#547077] mt-1">{form.location || "Add your location"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyProfileLink}
                className="px-4 py-2 bg-[#0b5561] text-white rounded-xl hover:bg-[#083d46] text-sm font-semibold transition-transform hover:-translate-y-0.5"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => firstNameInputRef.current?.focus()}
                className="px-4 py-2 border border-[#0b5561]/30 text-[#0b5561] rounded-xl hover:bg-[#e8f4f6] text-sm font-semibold"
              >
                Edit profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-2 sm:p-3 overflow-x-auto animate-enter delay-2">
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
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#0b5561] text-white shadow"
                  : "text-[#38545b] hover:bg-[#edf4f4]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          {activeTab === "personal" && (
            <section className="glass-card p-6 animate-enter">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#102a2f]">Personal Information</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => resetSection("personal")}
                    className="px-3 py-1.5 border border-[#d6d6d6] text-[#56666b] rounded-lg text-xs font-semibold"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      saveProfile("personal", {
                        firstName: form.firstName,
                        lastName: form.lastName,
                        phone: form.phone,
                        bio: form.bio,
                        avatar: form.avatar,
                        title: form.title,
                        location: form.location,
                        linkedinUrl: form.linkedinUrl,
                        githubUrl: form.githubUrl,
                        portfolioUrl: form.portfolioUrl,
                        websiteUrl: form.websiteUrl,
                      })
                    }
                    disabled={savingSection === "personal" || uploadingMedia !== ""}
                    className="px-3 py-1.5 bg-[#0b5561] text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingSection === "personal" ? "Saving..." : uploadingMedia !== "" ? "Uploading photo..." : "Save Personal"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  ref={firstNameInputRef}
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  placeholder="First name"
                  className="input"
                />
                <input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} placeholder="Last name" className="input" />
                <input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Current role" className="input" />
                <input value={form.linkedinUrl} onChange={(e) => setField("linkedinUrl", e.target.value)} placeholder="LinkedIn URL" className="input" />
                <input value={form.githubUrl} onChange={(e) => setField("githubUrl", e.target.value)} placeholder="GitHub URL" className="input" />
                <input value={form.portfolioUrl} onChange={(e) => setField("portfolioUrl", e.target.value)} placeholder="Portfolio URL" className="input" />
                <input value={form.websiteUrl} onChange={(e) => setField("websiteUrl", e.target.value)} placeholder="Website URL" className="input" />
              </div>

              <div className="mt-4 rounded-xl border border-[#d8e2df] bg-white p-3">
                <p className="text-xs font-semibold text-[#45656d] uppercase tracking-[0.08em] mb-2">Location with country flag</p>
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
                  <div className="input px-3 py-2 flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">{flagFromCode(locationCountryCode)}</span>
                    <select
                      value={locationCountryCode}
                      onChange={(e) => onLocationCountryChange(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm"
                    >
                      {COUNTRY_OPTIONS.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={locationPlace}
                    onChange={(e) => onLocationPlaceChange(e.target.value)}
                    placeholder="City, district, or workplace area"
                    className="input"
                  />
                </div>
                <p className="mt-2 text-xs text-[#6d848a]">Saved as: {form.location || composeLocation(locationPlace, locationCountryCode)}</p>
              </div>

              <div className="mt-4 rounded-xl border border-[#d8e2df] bg-[#f8fbfc] p-3">
                <p className="text-xs font-semibold text-[#45656d] uppercase tracking-[0.08em]">Profile photo source</p>
                <p className="mt-1 text-sm text-[#5b747a]">Use the avatar upload button above. Direct avatar URLs are restricted to image links only.</p>
              </div>

              <div className="mt-4 rounded-xl border border-[#d8e2df] bg-white p-3">
                <p className="text-xs font-semibold text-[#45656d] uppercase tracking-[0.08em] mb-2">Phone (Google-style international format)</p>
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
                  <div className="input px-3 py-2 flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">{flagFromCode(phoneCountryCode)}</span>
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => onPhoneCountryChange(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm"
                    >
                      {COUNTRY_OPTIONS.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name} ({item.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={phoneLocalNumber}
                    onChange={(e) => onPhoneLocalNumberChange(e.target.value)}
                    placeholder="Phone number"
                    className="input"
                    inputMode="numeric"
                  />
                </div>
                <p className="mt-2 text-xs text-[#6d848a]">Saved as: {form.phone || `${findCountryByCode(phoneCountryCode).dialCode}...`}</p>
              </div>

              {(fieldErrors.firstName || fieldErrors.lastName || fieldErrors.location || fieldErrors.phone || fieldErrors.linkedinUrl || fieldErrors.githubUrl || fieldErrors.avatar) && (
                <div className="mt-3 rounded-lg border border-[#f0d3d3] bg-[#fff6f6] p-3 text-xs text-[#9a3f3f] space-y-1">
                  {fieldErrors.firstName && <p>{fieldErrors.firstName}</p>}
                  {fieldErrors.lastName && <p>{fieldErrors.lastName}</p>}
                  {fieldErrors.location && <p>{fieldErrors.location}</p>}
                  {fieldErrors.phone && <p>{fieldErrors.phone}</p>}
                  {fieldErrors.linkedinUrl && <p>{fieldErrors.linkedinUrl}</p>}
                  {fieldErrors.githubUrl && <p>{fieldErrors.githubUrl}</p>}
                  {fieldErrors.avatar && <p>{fieldErrors.avatar}</p>}
                </div>
              )}

              <textarea
                rows={6}
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                placeholder="Tell recruiters what makes you effective and what value you bring."
                className="input mt-4 resize-none"
              />
            </section>
          )}

          {activeTab === "education" && (
            <section className="glass-card p-6 animate-enter">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#102a2f]">Education Info</h3>
                {editingEduId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEduId(null);
                      setEduForm(emptyEducation);
                    }}
                    className="px-3 py-1.5 border border-[#d6d6d6] text-[#56666b] rounded-lg text-xs font-semibold"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={eduForm.institution} onChange={(e) => setEduForm((p) => ({ ...p, institution: e.target.value }))} placeholder="Institution" className="input" />
                <input value={eduForm.degree} onChange={(e) => setEduForm((p) => ({ ...p, degree: e.target.value }))} placeholder="Degree" className="input" />
                <input value={eduForm.field} onChange={(e) => setEduForm((p) => ({ ...p, field: e.target.value }))} placeholder="Field of study" className="input" />
                <input value={eduForm.grade} onChange={(e) => setEduForm((p) => ({ ...p, grade: e.target.value }))} placeholder="Grade (optional)" className="input" />
                <input type="date" value={eduForm.startDate} onChange={(e) => setEduForm((p) => ({ ...p, startDate: e.target.value }))} className="input" />
                <input type="date" value={eduForm.endDate} disabled={eduForm.current} onChange={(e) => setEduForm((p) => ({ ...p, endDate: e.target.value }))} className="input disabled:opacity-60" />
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#33545a]">
                <input
                  type="checkbox"
                  checked={eduForm.current}
                  onChange={(e) => setEduForm((p) => ({ ...p, current: e.target.checked, endDate: e.target.checked ? "" : p.endDate }))}
                />
                I currently study here
              </label>
              <textarea value={eduForm.description} onChange={(e) => setEduForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" rows={4} className="input mt-3 resize-none" />

              <button
                type="button"
                onClick={saveEducation}
                disabled={eduSaving}
                className="mt-4 px-4 py-2 bg-[#0b5561] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {eduSaving ? "Saving..." : editingEduId ? "Update Education" : "Add Education"}
              </button>

              <div className="mt-6 space-y-3">
                {education.length === 0 && <p className="text-sm text-[#5d7379]">No education entries yet.</p>}
                {education.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-[#d9e4e0] bg-white/80 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#122f36]">{entry.degree} - {entry.institution}</p>
                      <p className="text-sm text-[#4f6a70]">{entry.field || "General"} | {toDateInput(entry.startDate)} - {entry.current ? "Present" : toDateInput(entry.endDate) || "-"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editEducation(entry)} className="px-3 py-1.5 text-xs rounded-lg bg-[#e6f0f2] text-[#0b5561]">Edit</button>
                      <button type="button" onClick={() => deleteEducation(entry.id)} className="px-3 py-1.5 text-xs rounded-lg bg-[#ffecec] text-[#a43b3b]">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "work" && (
            <section className="glass-card p-6 animate-enter">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#102a2f]">Experience</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWorkId(null);
                      setWorkForm({ id: "", role: "", company: "", startDate: "", endDate: "", current: false, summary: "" });
                    }}
                    className="w-8 h-8 rounded-full border border-[#d6d6d6] text-[#45656d] grid place-items-center"
                    aria-label="Add experience"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => resetSection("work")} className="px-3 py-1.5 border border-[#d6d6d6] text-[#56666b] rounded-lg text-xs font-semibold">Reset</button>
                  <button
                    type="button"
                    onClick={() =>
                      saveProfile(
                        "work",
                        {
                          title: form.title,
                          company: form.company,
                          industry: form.industry,
                          experienceYears: form.experienceYears,
                          salary: form.salary,
                          salaryCurrency: form.salaryCurrency,
                          remote: form.remote,
                          location: form.location,
                        },
                        workEntries,
                      )
                    }
                    disabled={savingSection === "work"}
                    className="px-3 py-1.5 bg-[#0b5561] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {savingSection === "work" ? "Saving..." : "Save Work Info"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Current title" className="input" />
                <input value={form.company} onChange={(e) => setField("company", e.target.value)} placeholder="Current company" className="input" />
                <input value={form.industry} onChange={(e) => setField("industry", e.target.value)} placeholder="Industry" className="input" />
                <input value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Work location" className="input" />
                <input value={form.experienceYears} onChange={(e) => setField("experienceYears", e.target.value)} placeholder="Experience years" className="input" />
                <input value={form.salary} onChange={(e) => setField("salary", e.target.value)} placeholder="Expected salary" className="input" />
                <input value={form.salaryCurrency} onChange={(e) => setField("salaryCurrency", e.target.value)} placeholder="Salary currency" className="input" />
                <label className="input flex items-center gap-2 text-sm text-[#33545a] cursor-pointer">
                  <input type="checkbox" checked={form.remote} onChange={(e) => setField("remote", e.target.checked)} />
                  Open to remote work
                </label>
              </div>

              <div className="mt-6 rounded-2xl border border-[#dbe6e3] bg-white/80 p-4">
                <h4 className="font-semibold text-[#102a2f] mb-3">Add or Edit Experience</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={workForm.role} onChange={(e) => setWorkForm((p) => ({ ...p, role: e.target.value }))} placeholder="Role" className="input" />
                  <input value={workForm.company} onChange={(e) => setWorkForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company" className="input" />
                  <input type="date" value={workForm.startDate} onChange={(e) => setWorkForm((p) => ({ ...p, startDate: e.target.value }))} className="input" />
                  <input type="date" disabled={workForm.current} value={workForm.endDate || ""} onChange={(e) => setWorkForm((p) => ({ ...p, endDate: e.target.value }))} className="input disabled:opacity-60" />
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-[#33545a]">
                  <input type="checkbox" checked={workForm.current || false} onChange={(e) => setWorkForm((p) => ({ ...p, current: e.target.checked, endDate: e.target.checked ? "" : p.endDate }))} />
                  Current role
                </label>
                <textarea value={workForm.summary || ""} onChange={(e) => setWorkForm((p) => ({ ...p, summary: e.target.value }))} rows={3} placeholder="What did you accomplish?" className="input mt-3 resize-none" />
                <button type="button" onClick={saveWorkEntry} className="mt-3 px-4 py-2 bg-[#0b5561] text-white rounded-xl text-sm font-semibold">
                  {editingWorkId ? "Update Work Entry" : "Add Work Entry"}
                </button>

                <div className="mt-5 border-t border-[#e1e9e6] pt-4 space-y-3">
                  {workEntries.length === 0 && <p className="text-sm text-[#5d7379]">No work entries yet.</p>}
                  {workEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-[#d9e4e0] bg-[#fbfdfd] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#dfeaec] text-[#224e57] grid place-items-center font-bold text-sm shrink-0">
                            {entry.company.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a3840]">{entry.role}</p>
                            <p className="text-sm text-[#4c6870]">{entry.company} · Full-time</p>
                            <p className="text-xs text-[#587178] mt-1">{toDateInput(entry.startDate)} - {entry.current ? "Present" : toDateInput(entry.endDate) || "-"}</p>
                            <p className="text-xs text-[#587178]">{form.location || "Location not set"}</p>
                            {entry.summary && <p className="text-xs text-[#3f5e66] mt-2">{entry.summary}</p>}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editWorkEntry(entry)}
                            className="w-8 h-8 rounded-full bg-[#e6f0f2] text-[#0b5561] grid place-items-center"
                            aria-label="Edit experience"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1-1v2m6.586 2.586a2 2 0 010 2.828l-8.172 8.172a4 4 0 01-1.414.943L6 21l.471-2.999a4 4 0 01.943-1.414l8.172-8.172a2 2 0 012.828 0z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeWorkEntry(entry.id)}
                            className="w-8 h-8 rounded-full bg-[#ffecec] text-[#a43b3b] grid place-items-center"
                            aria-label="Delete experience"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7v10m6-10v10M10 4h4a1 1 0 011 1v2H9V5a1 1 0 011-1zM7 7h10v12a1 1 0 01-1 1H8a1 1 0 01-1-1V7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === "demographic" && (
            <section className="glass-card p-6 animate-enter">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#102a2f]">Demographic Info</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => resetSection("demographic")} className="px-3 py-1.5 border border-[#d6d6d6] text-[#56666b] rounded-lg text-xs font-semibold">Reset</button>
                  <button
                    type="button"
                    onClick={() =>
                      saveProfile("demographic", {
                        birthDate: form.birthDate,
                        city: form.city,
                        country: form.country,
                        postalCode: form.postalCode,
                        address: form.address,
                        visibility: form.visibility,
                      })
                    }
                    disabled={savingSection === "demographic"}
                    className="px-3 py-1.5 bg-[#0b5561] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {savingSection === "demographic" ? "Saving..." : "Save Demographic"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="date" value={form.birthDate} onChange={(e) => setField("birthDate", e.target.value)} className="input" />
                <input value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="City" className="input" />
                <div className="input p-0 overflow-hidden flex items-center gap-2 px-3 py-2">
                  <span aria-hidden="true">{flagFromCode(findCountryByName(form.country)?.code || "MA")}</span>
                  <select
                    value={findCountryByName(form.country)?.code || "MA"}
                    onChange={(e) => setField("country", findCountryByCode(e.target.value).name)}
                    className="w-full bg-transparent outline-none"
                  >
                    {COUNTRY_OPTIONS.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} placeholder="Postal code" className="input" />
                <input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Address" className="input md:col-span-2" />
                <select value={form.visibility} onChange={(e) => setField("visibility", e.target.value as Visibility)} className="input md:col-span-2">
                  <option value="PUBLIC">Public</option>
                  <option value="RECRUITERS_ONLY">Recruiters only</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              {(fieldErrors.country || fieldErrors.birthDate) && (
                <div className="mt-3 rounded-lg border border-[#f0d3d3] bg-[#fff6f6] p-3 text-xs text-[#9a3f3f] space-y-1">
                  {fieldErrors.country && <p>{fieldErrors.country}</p>}
                  {fieldErrors.birthDate && <p>{fieldErrors.birthDate}</p>}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="glass-card p-6 h-fit animate-enter delay-3">
          <h3 className="text-lg font-bold text-[#102a2f] mb-4">Profile completion</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-24 h-24 rounded-full grid place-items-center progress-ring" style={{ ["--progress" as string]: `${completion}%` }}>
              <span className="text-xl font-bold text-[#102a2f]">{completion}%</span>
            </div>
            <p className="text-sm text-[#4c666c]">Balanced profiles perform better in discovery and shortlisting.</p>
          </div>

          <div className="space-y-2 text-sm">
            {[
              { label: "Personal", done: Boolean(form.firstName && form.lastName && form.bio) },
              { label: "Education", done: education.length > 0 },
              { label: "Work", done: workEntries.length > 0 || Boolean(form.title) },
              { label: "Demographic", done: Boolean(form.country && form.city) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.done ? (
                  <svg className="w-4 h-4 text-[#29a36a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#a2b3b7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  </svg>
                )}
                <span className={item.done ? "text-[#29444a]" : "text-[#6f858b]"}>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {error && <div className="rounded-lg border border-[#f2c9c9] bg-[#fff4f4] p-3 text-sm text-[#9a3f3f]">{error}</div>}
      {success && <div className="rounded-lg border border-[#b9e5cc] bg-[#eafaf0] p-3 text-sm text-[#1f6b48]">{success}</div>}

      <style jsx>{`
        .profile-shell {
          position: relative;
          isolation: isolate;
        }

        .profile-bg {
          position: absolute;
          inset: -40px -20px auto -20px;
          height: 360px;
          background:
            radial-gradient(circle at 15% 20%, rgba(11, 85, 97, 0.18), transparent 45%),
            radial-gradient(circle at 80% 10%, rgba(228, 146, 72, 0.2), transparent 42%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(233, 245, 244, 0.85));
          z-index: -1;
          filter: blur(0.2px);
          border-radius: 28px;
        }

        .glass-card {
          border: 1px solid #dbe7e4;
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(8px);
          border-radius: 18px;
          box-shadow: 0 8px 26px rgba(20, 55, 62, 0.07);
        }

        .input {
          width: 100%;
          border: 1px solid #d8e2df;
          background: #ffffff;
          border-radius: 12px;
          padding: 0.62rem 0.78rem;
          font-size: 0.92rem;
          color: #13343b;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input:focus {
          outline: none;
          border-color: #0b5561;
          box-shadow: 0 0 0 3px rgba(11, 85, 97, 0.14);
        }

        .progress-ring {
          background: conic-gradient(#0b5561 var(--progress), #d9e4e6 0);
          border-radius: 50%;
        }

        .progress-ring::after {
          content: "";
          position: absolute;
          inset: 8px;
          background: #fff;
          border-radius: 50%;
        }

        .progress-ring span {
          position: relative;
          z-index: 1;
        }

        .animate-enter {
          animation: riseIn 0.55s ease both;
        }

        .delay-1 {
          animation-delay: 80ms;
        }

        .delay-2 {
          animation-delay: 150ms;
        }

        .delay-3 {
          animation-delay: 220ms;
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
