"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { extractContactInfo } from "@/lib/contact-extractor";
import { APPLICATION_HISTORY_STORAGE_KEY, FAST_APPLY_QUEUE_STORAGE_KEY } from "@/lib/application-state";

interface Job {
  id: number;
  job_title: string;
  job_url?: string;
  company_name: string;
  company_logo_url?: string;
  company_profile_url?: string;
  company_website_url?: string;
  company_description?: string;
  category_name: string;
  category_slug?: string;
  city?: string;
  postal_code?: string;
  full_address?: string;
  contact_name?: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_image_url?: string;
  contacts?: string;
  employment_type?: string;
  salary?: string;
  start_date?: string;
  raw_html?: string;
  extracted_text?: string;
  source_name?: string;
  status?: string;
  country: string;
  language?: string;
  posted_at?: string;
  expires_at?: string;
  created_at: string;
  // legacy fields kept for queue compatibility
  location?: string;
  website?: string;
  content?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    country: ""
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [companyModalJob, setCompanyModalJob] = useState<Job | null>(null);
  const [fastApplyQueue, setFastApplyQueue] = useState<Job[]>([]);
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const canOpenFastApply = fastApplyQueue.length >= 2;

  const sanitizeQueueItems = useCallback((items: Job[]) => {
    const seen = new Set<number>();
    const cleaned: Job[] = [];

    (Array.isArray(items) ? items : []).forEach((item) => {
      const id = Number(item?.id || 0);
      const title = String(item?.job_title || "").trim();
      const company = String(item?.company_name || "").trim();

      if (!Number.isFinite(id) || id <= 0 || !title || !company || seen.has(id)) {
        return;
      }

      seen.add(id);
      cleaned.push({
        ...item,
        id,
        job_title: title,
        company_name: company,
        location: String(item?.location || ""),
        country: String(item?.country || ""),
      });
    });

    return cleaned.slice(0, 50);
  }, []);

  useEffect(() => {
    loadCategories();

    if (typeof window !== "undefined") {
      const historyRaw = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
      if (historyRaw) {
        try {
          const parsed = JSON.parse(historyRaw) as Array<{ jobId?: string; status?: string }>;
          if (Array.isArray(parsed)) {
            setAppliedJobIds(new Set(parsed.filter((item) => item.status === "sent").map((item) => String(item.jobId || "")).filter(Boolean)));
          }
        } catch {
          setAppliedJobIds(new Set());
        }
      }

      const queueRaw = window.localStorage.getItem(FAST_APPLY_QUEUE_STORAGE_KEY);
      if (queueRaw) {
        try {
          const parsed = JSON.parse(queueRaw) as Job[];
          if (Array.isArray(parsed)) {
            const cleaned = sanitizeQueueItems(parsed);
            setFastApplyQueue(cleaned);
            if (cleaned.length !== parsed.length) {
              window.localStorage.setItem(FAST_APPLY_QUEUE_STORAGE_KEY, JSON.stringify(cleaned));
            }
          }
        } catch {
          setFastApplyQueue([]);
        }
      }
    }
  }, [sanitizeQueueItems]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
        ...filters
      });
      const res = await apiClient.get(`/api/v1/jobs?${params}`);
      setJobs(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch {
      console.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const loadCategories = async () => {
    try {
      const res = await apiClient.get("/api/v1/jobs/categories");
      setCategories(res.data?.data || []);
    } catch {
      console.error("Failed to load categories");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const cleanJobHtml = (html: string, website?: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const host = website?.toLowerCase() || "";
    const siteOrigin = (() => {
      try {
        return website ? new URL(website).origin : "";
      } catch {
        return "";
      }
    })();

    const normalizeUrl = (rawUrl: string): string => {
      if (!rawUrl) return rawUrl;
      if (rawUrl.startsWith("//")) {
        return `https:${rawUrl}`;
      }
      if (rawUrl.startsWith("/") && siteOrigin) {
        return `${siteOrigin}${rawUrl}`;
      }
      if (rawUrl.startsWith("./") && siteOrigin) {
        return `${siteOrigin}/${rawUrl.slice(2)}`;
      }
      return rawUrl;
    };

    const fallbackMediaUrls = Array.from(doc.querySelectorAll("img[src]"))
      .map((img) => normalizeUrl(img.getAttribute("src") || ""))
      .filter(Boolean)
      .filter((src) => {
        const lower = src.toLowerCase();
        const looksLikeGallery =
          lower.includes("job_posting_gallery") ||
          lower.includes("beschreibungheader") ||
          lower.includes("berufsbild") ||
          lower.includes("gallery");
        const looksLikeNoise =
          lower.includes("logo") ||
          lower.includes("icon") ||
          lower.includes("avatar") ||
          lower.includes("placeholder") ||
          lower.includes("contact_person") ||
          lower.includes("subsidiary_logo") ||
          lower.includes("corporation_logo") ||
          lower.includes("profile");
        const unsupportedExt = /\.(tif|tiff|svg)(\?|$)/i.test(lower);

        return looksLikeGallery && !looksLikeNoise && !unsupportedExt;
      });

    const removeSelectors = [
      "script",
      "style",
      "noscript",
      "svg",
      "use",
      "header",
      "footer",
      "nav",
      "form",
      "button",
      "input",
      "textarea",
      "select",
      ".jp-c-header",
      ".jp-header-non-eu-v2",
      ".js-header-data",
      ".mobile-border",
      ".jp-c-header__share",
      ".js-share-overlay",
      ".share-button",
      ".non-eu-apply-button-v2",
      ".apply-button-v2",
      ".apply-button-v2-js",
      "#js-jp-header",
      ".mds-fixed-container",
      ".job-details__social-share",
      ".job-posting-contact-person",
      ".mds-tabs__list",
      ".mds-tabs__panel--hidden",
      ".tns-custom-controls",
      ".tns-nav",
      ".d-print-none",
      ".mds-display-none",
      ".mds-button",
      ".cta-button",
      ".apply-now",
      ".share-this",
      ".social-share",
      ".choice-chips",
      "a[href*='EmailAFriend']",
      "a[href*='ContinueJobApplication']",
      "a[href*='facebook.com/sharer']",
      "a[href*='twitter.com/intent']",
      "a[href*='linkedin.com/shareArticle']",
      "[data-bs-toggle='modal']",
    ];
    removeSelectors.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Validate content and remove generic social/publicity/apply fragments.
    const blockedTextTokens = [
      "facebook",
      "twitter",
      "linkedin",
      "share this job",
      "send job",
      "apply now",
      "jetzt bewerben",
      "whatsapp-bewerbung",
      "view more categories",
      "view less categories",
      "stelle teilen",
      "per whatsapp",
      "per e-mail",
      "link kopieren",
      "visit employer hub",
      "erstelle dein",
      "weiter mit google",
      "schneller bewerben",
      "stellen merken",
      "benachrichtigen lassen",
      "du hast bereits einen account",
      "einloggen",
      "konto erstellen",
      "jetzt registrieren",
      "ausbildung.de-konto",
    ];

    const blockedClassTokens = [
      "social",
      "share",
      "apply",
      "cta",
      "emailafriend",
      "whatsapp",
      "mds-button",
      "btn",
    ];

    doc.querySelectorAll("a, button, summary, span, p, li, div").forEach((el) => {
      const rawText = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!rawText) {
        return;
      }

      const text = rawText.toLowerCase();
      const classAndId = `${el.getAttribute("class") || ""} ${el.getAttribute("id") || ""}`.toLowerCase();
      const href = (el.getAttribute("href") || "").toLowerCase();

      const hasBlockedText = blockedTextTokens.some((token) => text === token || text.includes(token));
      const hasBlockedClass = blockedClassTokens.some((token) => classAndId.includes(token));
      const hasBlockedHref =
        href.includes("continuejobapplication") ||
        href.includes("emailafriend") ||
        href.includes("facebook.com/sharer") ||
        href.includes("twitter.com/intent") ||
        href.includes("linkedin.com/sharearticle") ||
        href.includes("whatsapp.com/send");

      if (!(hasBlockedText || hasBlockedClass || hasBlockedHref)) {
        return;
      }

      const wrapper = el.closest("li, dd, dt, p, div, section");
      if (wrapper && wrapper !== doc.body) {
        wrapper.remove();
        return;
      }

      el.remove();
    });

    const blockedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "OBJECT", "EMBED"]);
    const iframeAllowList = ["youtube.com", "youtu.be", "player.vimeo.com"];

    const toAbsoluteUrl = (rawUrl: string): string => normalizeUrl(rawUrl);

    doc.querySelectorAll("*").forEach((el) => {
      if (blockedTags.has(el.tagName)) {
        el.remove();
        return;
      }

      if (el.tagName === "IFRAME") {
        const src = el.getAttribute("src") || "";
        const normalizedSrc = toAbsoluteUrl(src);
        const isAllowed = iframeAllowList.some((domain) => normalizedSrc.includes(domain));

        if (!isAllowed) {
          el.remove();
          return;
        }

        el.setAttribute("src", normalizedSrc);
        el.setAttribute("loading", "lazy");
        el.setAttribute("referrerpolicy", "no-referrer");
        el.setAttribute("allowfullscreen", "true");
      }

      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();

        if (name.startsWith("on") || name === "style") {
          el.removeAttribute(attr.name);
          return;
        }

        if (name === "href" || name === "src" || name === "srcset") {
          if (name === "srcset") {
            const normalizedSrcset = value
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
              .map((entry) => {
                const [raw, descriptor] = entry.split(/\s+/, 2);
                const normalized = toAbsoluteUrl(raw);
                return descriptor ? `${normalized} ${descriptor}` : normalized;
              })
              .join(", ");

            if (normalizedSrcset) {
              el.setAttribute("srcset", normalizedSrcset);
            } else {
              el.removeAttribute(attr.name);
            }
            return;
          }

          const normalizedValue = toAbsoluteUrl(value);
          const lower = normalizedValue.toLowerCase();
          const safeProtocol = lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("/") || lower.startsWith("mailto:") || lower.startsWith("tel:");
          if (!safeProtocol) {
            el.removeAttribute(attr.name);
          } else {
            el.setAttribute(attr.name, normalizedValue);
          }
        }
      });

      if (el.tagName === "A") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer nofollow");

        const href = (el.getAttribute("href") || "").toLowerCase();
        if (
          href.includes("continuejobapplication") ||
          href.includes("emailafriend") ||
          href.includes("facebook.com/sharer") ||
          href.includes("twitter.com/intent") ||
          href.includes("linkedin.com/sharearticle") ||
          href.includes("whatsapp.com/send")
        ) {
          el.remove();
        }
      }
    });

    const getCandidates = (): Element[] => {
      // Detect content structure dynamically from CSS classes present in the HTML
      // This works for any website — no hardcoded domain names
      if (doc.querySelector('.jp-facts, .jp-description, .jp-media')) {
        return Array.from(doc.querySelectorAll('.jp-facts, .jp-description, .jp-media'));
      }
      if (doc.querySelector('#stellenbeschreibung')) {
        return Array.from(doc.querySelectorAll('#stellenbeschreibung, .user-input'));
      }
      if (doc.querySelector('.mds-tabs__panel, .mds-prose, .mds-list--definition')) {
        return Array.from(doc.querySelectorAll('.mds-tabs__panel__content, .mds-prose, .mds-list--definition'));
      }
      // Generic fallback — works for any unknown website
      return Array.from(
        doc.querySelectorAll(
          'article, main, [class*="job-description"], [class*="job-content"], [class*="description"], [id*="job"], [id*="description"], .content, .user-input'
        )
      );
    };

    const candidates = getCandidates().filter((node) => {
      const textLen = (node.textContent || "").trim().length;
      const hasMedia = Boolean(node.querySelector("img, picture, source, video, iframe"));
      return textLen > 40 || hasMedia;
    });
    const output = doc.createElement("div");
    const seen = new Set<string>();

    candidates.forEach((node) => {
      const key = node.textContent?.trim().slice(0, 220) || "";
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      output.appendChild(node.cloneNode(true));
    });

    const hasAnyMediaInOutput = Boolean(output.querySelector("img, picture, source, video, iframe"));
    if (!hasAnyMediaInOutput && fallbackMediaUrls.length > 0) {
      const uniqueUrls = Array.from(new Set(fallbackMediaUrls)).slice(0, 8);
      const mediaWrap = doc.createElement("div");
      mediaWrap.className = "job-media-showcase";

      const title = doc.createElement("h3");
      title.className = "job-media-showcase__title";
      title.textContent = "Gallery";
      mediaWrap.appendChild(title);

      const grid = doc.createElement("div");
      grid.className = "job-media-showcase__grid";

      uniqueUrls.forEach((src) => {
        const mediaItem = doc.createElement("div");
        mediaItem.className = "job-media-showcase__item";
        const image = doc.createElement("img");
        image.setAttribute("src", src);
        image.setAttribute("alt", "Job image");
        image.setAttribute("loading", "lazy");
        mediaItem.appendChild(image);
        grid.appendChild(mediaItem);
      });

      mediaWrap.appendChild(grid);

      output.appendChild(mediaWrap);
    }

    // Replace emoji spans in jp-facts with SVG icons
    const emojiIconMap: Record<string, string> = {
      '🗓': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
      '⏳': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>',
      '🎓': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c3.333 1.667 8.667 1.667 12 0v-5"/></svg>',
      '📁': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
      '🕒': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
      '💼': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
      '📍': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      '💰': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
      '🏢': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21v-4h6v4"/></svg>',
    };
    output.querySelectorAll('.emoji').forEach((el) => {
      const text = el.textContent?.trim() || '';
      const svg = emojiIconMap[text];
      if (svg) {
        el.innerHTML = svg;
        (el as HTMLElement).style.display = 'inline-flex';
        (el as HTMLElement).style.alignItems = 'center';
        (el as HTMLElement).style.color = '#a1a1aa';
      }
    });

    if (!output.children.length) {
      return doc.body.innerHTML;
    }

    return output.innerHTML;
  };

  // Derive German job type label from title + employment_type
  const getJobTypeLabel = (job: Job): { label: string; color: string } => {
    const title = (job.job_title || '').toLowerCase();
    const type = (job.employment_type || '').toLowerCase();
    if (title.includes('duales studium') || title.includes('dual studium')) {
      return { label: 'Duales Studium', color: 'border-sky-700 bg-sky-950/60 text-sky-300' };
    }
    if (title.includes('ausbildung') || type === 'apprenticeship') {
      return { label: 'Ausbildung', color: 'border-violet-700 bg-violet-950/60 text-violet-300' };
    }
    if (title.includes('praktikum') || type === 'internship') {
      return { label: 'Praktikum', color: 'border-amber-700 bg-amber-950/60 text-amber-300' };
    }
    if (title.includes('werkstudent') || type === 'working-student') {
      return { label: 'Werkstudent', color: 'border-teal-700 bg-teal-950/60 text-teal-300' };
    }
    if (type === 'fulltime' || type === 'full-time' || title.includes('vollzeit')) {
      return { label: 'Vollzeit', color: 'border-emerald-700 bg-emerald-950/60 text-emerald-300' };
    }
    if (type === 'parttime' || type === 'part-time' || title.includes('teilzeit')) {
      return { label: 'Teilzeit', color: 'border-orange-700 bg-orange-950/60 text-orange-300' };
    }
    if (type === 'freelance' || title.includes('freelance')) {
      return { label: 'Freelance', color: 'border-pink-700 bg-pink-950/60 text-pink-300' };
    }
    if (type || title) {
      return { label: 'Stelle', color: 'border-zinc-700 bg-zinc-900 text-zinc-400' };
    }
    return { label: '', color: '' };
  };

  const selectedJobContact = useMemo(() => {
    if (!selectedJob) return { name: '', position: '', email: '', phone: '', image: '' };
    // Use structured DB fields first, fall back to HTML extraction
    const name = selectedJob.contact_name || '';
    const position = selectedJob.contact_position || '';
    const email = selectedJob.contact_email || '';
    const phone = selectedJob.contact_phone || '';
    const image = selectedJob.contact_image_url || '';
    if (name || email || phone) return { name, position, email, phone, image };
    // fallback: parse raw_html if DB fields are empty
    return extractContactInfo(selectedJob.raw_html || selectedJob.content || '');
  }, [selectedJob]);

  const hasContactDetails = Boolean(
    selectedJobContact.name || selectedJobContact.email || selectedJobContact.phone
  );

  const router = useRouter();

  const handleApply = (job: Job) => {
    if (appliedJobIds.has(String(job.id))) return;
    const params = new URLSearchParams({
      jobId: String(job.id),
      title: job.job_title || '',
      company: job.company_name || '',
      location: job.city || job.full_address || job.location || '',
      recipientEmail: job.contact_email || '',
      recipientPhone: job.contact_phone || '',
    });
    router.push(`/dashboard/applications?${params}`);
  };

  const openJobDetail = async (job: Job) => {
    setSelectedJob(job);
    setDetailLoading(true);
    try {
      // Use timestamp param for cache-busting — avoids CORS preflight for Cache-Control header
      const res = await apiClient.get(`/api/v1/jobs/${job.id}?_t=${Date.now()}`);
      setSelectedJob(res.data);
    } catch {
      // keep card data shown
    } finally {
      setDetailLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ category: "", location: "", country: "" });
    setSearch("");
    setPage(1);
  };



  const persistFastApplyQueue = (items: Job[]) => {
    const cleaned = sanitizeQueueItems(items);
    setFastApplyQueue(cleaned);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FAST_APPLY_QUEUE_STORAGE_KEY, JSON.stringify(cleaned));
    }
  };

  const toggleFastApplyQueue = (job: Job) => {
    const exists = fastApplyQueue.some((item) => item.id === job.id);
    const next = exists ? fastApplyQueue.filter((item) => item.id !== job.id) : [job, ...fastApplyQueue];
    persistFastApplyQueue(next);
  };

  const openFastApplyFromQueue = () => {
    if (fastApplyQueue.length < 2) return;
    router.push("/dashboard/fast-apply?source=queue");
  };

  const quickAddJobs = useMemo(
    () => jobs.filter((job) => !fastApplyQueue.some((item) => item.id === job.id)).slice(0, 8),
    [jobs, fastApplyQueue]
  );

  const addVisibleToQueue = () => {
    if (!quickAddJobs.length) return;
    persistFastApplyQueue([...fastApplyQueue, ...quickAddJobs]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-[radial-gradient(circle_at_10%_10%,#2a2a2a_0%,#141414_45%,#090909_100%)] p-8 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Find Your Dream Job</h1>
        <p className="text-zinc-300 text-sm md:text-base">Browse opportunities with a premium shortlist workflow.</p>
        <div className="mt-6 flex gap-3">
          {canOpenFastApply ? (
            <button
              type="button"
              onClick={openFastApplyFromQueue}
              className="inline-flex items-center justify-center rounded-button px-4 py-2 text-white font-semibold text-sm bg-black hover:bg-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-zinc-700"
            >
              Fast Apply ({fastApplyQueue.length})
            </button>
          ) : (
            <div className="inline-flex items-center rounded-button px-4 py-2 text-xs font-semibold border border-zinc-600 text-zinc-300 bg-zinc-900/70">
              Select at least 2 jobs for Fast Apply ({fastApplyQueue.length}/2)
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-zinc-400">
          Queue control moved to the floating button at bottom-right.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs, companies, keywords..."
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-black bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              placeholder="Location"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black"
            />

            <input
              type="text"
              value={filters.country}
              onChange={(e) => handleFilterChange("country", e.target.value)}
              placeholder="Country"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {(filters.category || filters.location || filters.country || search) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-body-sm text-black hover:underline font-semibold"
            >
              Clear all filters
            </button>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">
            {loading ? 'Laden...' : `${total.toLocaleString('de-DE')} Stellen gefunden`}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const alreadyApplied = appliedJobIds.has(String(job.id));

            return (
            <div
              key={job.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0f0f0f] shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-zinc-600 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
            >
              {/* Top accent line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex flex-col gap-3 p-4 flex-1">
                {/* Company logo (clickable) + job type badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCompanyModalJob(job)}
                      className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 flex items-center justify-center hover:border-zinc-500 transition-colors"
                      title={`Über ${job.company_name}`}
                    >
                      {job.company_logo_url ? (
                        <Image src={job.company_logo_url} alt={job.company_name} width={40} height={40} className="h-full w-full object-contain p-1" unoptimized onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-300 truncate max-w-[140px]">{job.company_name}</p>
                      <p className="text-[10px] text-zinc-500 truncate max-w-[140px]">{job.city || job.country || '—'}</p>
                    </div>
                  </div>
                  {(() => { const t = getJobTypeLabel(job); return t.label ? (
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide border ${t.color}`}>
                      {t.label}
                    </span>
                  ) : null; })()}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold line-clamp-2 leading-snug bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent group-hover:from-yellow-200 group-hover:to-white transition-all">
                  {job.job_title || 'No Title'}
                </h3>

                {/* Meta row */}
                <div className="flex flex-wrap gap-1.5">
                  {(job.city || job.location) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] text-zinc-400">
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                      <span className="truncate max-w-[110px]">{job.city || job.location}</span>
                    </span>
                  )}
                  {job.category_name && (
                    <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] text-zinc-400 truncate max-w-[150px]">
                      {job.category_name}
                    </span>
                  )}
                </div>

                {/* Start date */}
                {job.start_date && (
                  <p className="text-[11px] text-zinc-500 mt-auto">
                    Start: {job.start_date}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="mx-4 h-px bg-zinc-800" />

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2 p-3">
                <button
                  onClick={() => handleApply(job)}
                  disabled={alreadyApplied}
                  className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                    alreadyApplied
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  {alreadyApplied ? '✓ Applied' : 'Apply'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFastApplyQueue(job)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    fastApplyQueue.some((item) => item.id === job.id)
                      ? 'border-white bg-white/10 text-white'
                      : 'border-zinc-700 text-zinc-300 bg-transparent hover:border-zinc-500'
                  }`}
                >
                  {fastApplyQueue.some((item) => item.id === job.id) ? '✓ Queued' : 'Queue'}
                </button>
                <button
                  onClick={() => openJobDetail(job)}
                  className="py-2 rounded-xl text-xs font-semibold border border-zinc-700 text-zinc-300 bg-transparent hover:border-zinc-500 hover:text-white transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          );
          })}

          {jobs.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-semibold">No jobs found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-1 flex-wrap justify-center">
              {(() => {
                const pages: (number | '...')[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push('...');
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                  if (page < totalPages - 2) pages.push('...');
                  pages.push(totalPages);
                }
                return pages.map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-zinc-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`px-4 py-2 rounded-button text-sm ${
                        page === p ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setQueueDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full border border-zinc-700 bg-black text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)] hover:bg-zinc-800 transition-colors"
        aria-label="Open fast apply queue"
      >
        <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-white text-black text-[11px] font-black px-1.5 flex items-center justify-center">
          {fastApplyQueue.length}
        </span>
        <svg className="mx-auto h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m6 6H5a2 2 0 01-2-2V6a2 2 0 012-2h9.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V18a2 2 0 01-2 2z" />
        </svg>
      </button>

      {queueDrawerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setQueueDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]" />
          <div
            className="absolute inset-y-0 right-0 w-full max-w-md border-l border-zinc-800 bg-[linear-gradient(180deg,#101010_0%,#070707_100%)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500 font-semibold">Fast Apply Controller</p>
                <h3 className="text-lg font-black text-zinc-100">Queue ({fastApplyQueue.length})</h3>
                <p className="text-xs text-zinc-400">Manage jobs from here, then launch Fast Apply.</p>
              </div>
              <button
                type="button"
                onClick={() => setQueueDrawerOpen(false)}
                className="h-8 w-8 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                aria-label="Close queue panel"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={openFastApplyFromQueue}
                disabled={!canOpenFastApply}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-white text-black disabled:opacity-40"
              >
                Open Fast Apply
              </button>
              <button
                type="button"
                onClick={() => persistFastApplyQueue([])}
                disabled={!fastApplyQueue.length}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold border border-zinc-700 bg-zinc-900 text-zinc-200 disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="mb-4">
              {fastApplyQueue.length === 0 ? (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-3 text-sm text-zinc-500">
                  Queue is empty. Click &quot;Queue&quot; on job cards to add jobs.
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-700 bg-zinc-950 overflow-hidden">
                  <div className="max-h-[34vh] overflow-y-auto divide-y divide-zinc-800">
                    {fastApplyQueue.map((job, index) => (
                      <div key={job.id} className="flex items-start justify-between gap-3 px-3 py-2.5 hover:bg-zinc-900/80">
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-500">#{index + 1}</p>
                          <p className="text-sm font-semibold text-zinc-100 truncate">{job.job_title}</p>
                          <p className="text-xs text-zinc-400 truncate">{job.company_name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFastApplyQueue(job)}
                          className="shrink-0 rounded-lg border border-red-900 bg-red-950/40 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-900/40"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 font-semibold">Quick Add From Visible Jobs</p>
                <button
                  type="button"
                  onClick={addVisibleToQueue}
                  disabled={!quickAddJobs.length}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 disabled:opacity-40"
                >
                  Add All Visible
                </button>
              </div>
              <div className="space-y-2 max-h-[26vh] overflow-y-auto pr-1">
                {quickAddJobs.length === 0 ? (
                  <p className="text-xs text-zinc-500">All visible jobs are already in queue.</p>
                ) : (
                  quickAddJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => toggleFastApplyQueue(job)}
                      className="w-full text-left rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 hover:border-zinc-500"
                    >
                      <p className="text-xs font-semibold text-zinc-200 truncate">{job.company_name}</p>
                      <p className="text-xs text-zinc-400 truncate">+ {job.job_title}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="relative bg-zinc-950 w-full md:max-w-[56%] h-full shadow-2xl flex flex-col animate-slide-in border-r border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
              <div className="flex items-start gap-3 flex-1 pr-3">
                {selectedJob.company_logo_url && (
                  <div className="h-12 w-12 shrink-0 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden flex items-center justify-center">
                    <Image src={selectedJob.company_logo_url} alt={selectedJob.company_name} width={48} height={48} className="h-full w-full object-contain p-1" unoptimized />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-tight mb-0.5 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent">{selectedJob.job_title}</h2>
                  <p className="text-zinc-300 font-semibold text-sm">{selectedJob.company_name}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-zinc-400">
                    {(selectedJob.city || selectedJob.full_address) && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        {selectedJob.city || selectedJob.full_address}
                      </span>
                    )}
                    {selectedJob.employment_type && (
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${getJobTypeLabel(selectedJob).color}`}>{getJobTypeLabel(selectedJob).label}</span>
                    )}
                    {selectedJob.category_name && (
                      <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded-full border border-zinc-700">{selectedJob.category_name}</span>
                    )}
                    {selectedJob.start_date && (
                      <span className="text-zinc-500">Start: {selectedJob.start_date}</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 bg-zinc-950 space-y-4">

              {/* Company card */}
              {(selectedJob.company_description || selectedJob.company_website_url || selectedJob.company_profile_url) && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">About the Company</p>
                  <div className="flex items-start gap-3">
                    {selectedJob.company_logo_url && (
                      <div className="h-10 w-10 shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden">
                        <Image src={selectedJob.company_logo_url} alt={selectedJob.company_name} width={40} height={40} className="h-full w-full object-contain p-1" unoptimized />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-100">{selectedJob.company_name}</p>
                      {selectedJob.company_description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-3">{selectedJob.company_description}</p>
                      )}
                      <div className="flex gap-3 mt-2">
                        {selectedJob.company_website_url && (
                          <a href={selectedJob.company_website_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-400 hover:text-white underline underline-offset-2">
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact card from DB fields */}
              {hasContactDetails && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Contact</p>
                  <div className="flex items-center gap-3">
                    {selectedJobContact.image && (
                      <div className="h-10 w-10 shrink-0 rounded-full border border-zinc-700 overflow-hidden bg-zinc-900">
                        <Image src={selectedJobContact.image} alt={selectedJobContact.name || 'Contact'} width={40} height={40} className="h-full w-full object-cover" unoptimized />
                      </div>
                    )}
                    <div>
                      {selectedJobContact.name && <p className="text-sm font-semibold text-zinc-100">{selectedJobContact.name}</p>}
                      {selectedJobContact.position && <p className="text-xs text-zinc-400">{selectedJobContact.position}</p>}
                      <div className="flex gap-3 mt-1">
                        {selectedJobContact.email && (
                          <a href={`mailto:${selectedJobContact.email}`} className="text-[11px] text-zinc-300 hover:text-white underline underline-offset-2">{selectedJobContact.email}</a>
                        )}
                        {selectedJobContact.phone && (
                          <a href={`tel:${selectedJobContact.phone}`} className="text-[11px] text-zinc-300 hover:text-white underline underline-offset-2">{selectedJobContact.phone}</a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Job content from raw_html */}
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 rounded-full border-2 border-zinc-600 border-t-zinc-200 animate-spin" />
                </div>
              ) : selectedJob.raw_html ? (
                <div
                  className="job-content text-sm text-zinc-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: cleanJobHtml(selectedJob.raw_html, selectedJob.company_website_url || selectedJob.website) }}
                />
              ) : selectedJob.extracted_text ? (
                <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">{selectedJob.extracted_text}</p>
              ) : (
                <p className="text-zinc-500 text-sm">No description available.</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-zinc-800 bg-zinc-900/70">
              <button
                onClick={() => handleApply(selectedJob)}
                disabled={appliedJobIds.has(String(selectedJob.id))}
                className={`w-full py-3 rounded-lg transition-colors font-bold text-sm ${
                  appliedJobIds.has(String(selectedJob.id))
                    ? "bg-zinc-700 text-zinc-300 cursor-not-allowed"
                    : "bg-black text-white hover:bg-zinc-800 border border-zinc-700"
                }`}
              >
                {appliedJobIds.has(String(selectedJob.id)) ? "Already Applied" : "Apply Now"}
              </button>
            </div>
          </div>
          {/* Backdrop - click to close */}
          <div className="flex-1 bg-black/70 backdrop-blur-[1px]" onClick={() => setSelectedJob(null)} />
        </div>
      )}

      {/* Company modal — opens when logo is clicked on card */}
      {companyModalJob && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={() => setCompanyModalJob(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div
            className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-yellow-500/20 bg-[#0a0a0a] shadow-[0_0_80px_rgba(234,179,8,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold top accent */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

            {/* Header banner */}
            <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-6 pt-6 pb-5">
              <button
                onClick={() => setCompanyModalJob(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="flex items-center gap-4">
                {/* Large logo */}
                <div className="h-20 w-20 shrink-0 rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                  {companyModalJob.company_logo_url ? (
                    <Image src={companyModalJob.company_logo_url} alt={companyModalJob.company_name} width={80} height={80} className="h-full w-full object-contain p-2" unoptimized />
                  ) : (
                    <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Premium gold company name */}
                  <h3 className="text-lg font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent leading-tight">
                    {companyModalJob.company_name}
                  </h3>
                  {(companyModalJob.city || companyModalJob.country) && (
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                      {[companyModalJob.city, companyModalJob.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {companyModalJob.company_website_url && (
                    <a
                      href={companyModalJob.company_website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-yellow-500/80 hover:text-yellow-400 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      {companyModalJob.company_website_url.replace(/^https?:\/\//, '').replace(/\/.*/, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Job being viewed */}
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Aktuelle Stelle</p>
                <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{companyModalJob.job_title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {(() => { const t = getJobTypeLabel(companyModalJob); return t.label ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${t.color}`}>{t.label}</span>
                  ) : null; })()}
                  {companyModalJob.start_date && (
                    <span className="text-[11px] text-zinc-500">Start: {companyModalJob.start_date}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {companyModalJob.company_description && (
              <div className="px-6 py-4 border-t border-zinc-800/60">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Über das Unternehmen</p>
                <p className="text-sm text-zinc-300 leading-relaxed max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                  {companyModalJob.company_description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 pb-6 pt-4 border-t border-zinc-800/60 flex gap-3">
              <button
                onClick={() => { setCompanyModalJob(null); openJobDetail(companyModalJob); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-400 to-amber-400 text-black hover:from-yellow-300 hover:to-amber-300 transition-all shadow-[0_4px_20px_rgba(234,179,8,0.3)]"
              >
                Stelle ansehen
              </button>
              <button
                onClick={() => { setCompanyModalJob(null); handleApply(companyModalJob); }}
                disabled={appliedJobIds.has(String(companyModalJob.id))}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-zinc-700 text-zinc-200 hover:border-yellow-500/50 hover:text-yellow-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {appliedJobIds.has(String(companyModalJob.id)) ? '✓ Beworben' : 'Bewerben'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        /* ── job content prose ── */
        .job-content { font-size: 0.875rem; color: #e4e4e7; line-height: 1.72; }
        .job-content h1, .job-content h2, .job-content h3, .job-content h4, .job-content h5, .job-content h6 {
          color: #fafafa;
          font-weight: 700;
          line-height: 1.35;
          margin: 1.2rem 0 0.65rem;
        }
        .job-content h1 { font-size: 1.2rem; }
        .job-content h2 { font-size: 1.1rem; }
        .job-content h3 { font-size: 1rem; }
        .job-content p { margin-bottom: 0.8rem; }
        .job-content b, .job-content strong { font-weight: 700; color: #f4f4f5; }
        .job-content ul, .job-content ol { padding-left: 1.2rem; margin-bottom: 0.8rem; }
        .job-content li { margin-bottom: 0.35rem; }
        .job-content a { color: #f4f4f5; text-decoration: underline; text-underline-offset: 2px; }
        .job-content img { max-width: 100%; border-radius: 8px; margin: 0.9rem 0; border: 1px solid #3f3f46; }
        .job-content picture,
        .job-content figure { display: block; margin: 0.9rem 0; }
        .job-content video,
        .job-content iframe {
          width: 100%;
          max-width: 100%;
          min-height: 220px;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          margin: 0.9rem 0;
          background: #18181b;
        }

        .job-content .jp-media__slider {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.8rem;
        }

        .job-content .jp-media-slider__slide,
        .job-content .jp-media-slider__slide--inner {
          height: 100%;
        }

        .job-content .jp-media__img {
          width: 100%;
          height: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #3f3f46;
          background: #111827;
        }

        .job-content .job-media-showcase {
          border: 1px solid #3f3f46;
          border-radius: 12px;
          padding: 0.85rem;
          background: #18181b;
          margin-top: 1rem;
        }

        .job-content .job-media-showcase__title {
          margin: 0 0 0.65rem;
          color: #a1a1aa;
          font-size: 0.74rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 700;
        }

        .job-content .job-media-showcase__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 0.7rem;
        }

        .job-content .job-media-showcase__item {
          border: 1px solid #3f3f46;
          border-radius: 8px;
          overflow: hidden;
          background: #111827;
        }

        .job-content .job-media-showcase__item img {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          display: block;
          border: 0;
          margin: 0;
        }
        .job-content hr { border: 0; border-top: 1px solid #3f3f46; margin: 1rem 0; }
        .job-content table { width: 100%; border-collapse: collapse; margin: 0.9rem 0; }
        .job-content th, .job-content td { border: 1px solid #3f3f46; padding: 0.5rem; text-align: left; }
        .job-content i.fa, .job-content i[class*="fa-"] { display: none !important; }

        .job-content .jp-facts,
        .job-content .job-posting-contact-person,
        .job-content #stellenbeschreibung,
        .job-content #sidebar .bg-white,
        .job-content .mds-surface__inner,
        .job-content .mds-tabs__panel__content {
          border: 1px solid #3f3f46;
          border-radius: 10px;
          padding: 0.9rem;
          margin-bottom: 0.95rem;
          background: #18181b;
        }

        .job-content .facts-list__facts { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.5rem; }
        .job-content .facts-list__fact { background: #111827; border: 1px solid #27272a; border-radius: 8px; padding: 0.6rem 0.75rem; }
        .job-content .fact__content { display: flex; align-items: flex-start; gap: 0.5rem; }
        .job-content .fact__content .emoji { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; color: #71717a; flex-shrink: 0; margin-top: 1px; }
        .job-content .fact__content .emoji svg { width: 14px; height: 14px; }
        .job-content .fact__content .contents { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .job-content .fact__content .label { font-size: 0.68rem; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .job-content .fact__content .value { font-size: 0.82rem; color: #f4f4f5; font-weight: 600; }

        .job-content .mds-list--definition dt,
        .job-content .mds-list--definition dd {
          margin: 0;
          padding: 0.2rem 0;
        }

        .job-content .mds-list--definition dt {
          color: #a1a1aa;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .job-content .mds-list--definition dd {
          color: #f4f4f5;
          font-size: 0.86rem;
          margin-bottom: 0.45rem;
        }

        .job-content [class*="grid"],
        .job-content [class*="col-"] {
          width: 100%;
        }

        .job-contact-card {
          border: 1px solid #3f3f46;
          border-radius: 10px;
          background: #18181b;
          padding: 0.9rem;
        }

        .job-contact-title {
          margin: 0 0 0.45rem;
          color: #a1a1aa;
          font-size: 0.74rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 700;
        }

        .job-contact-name {
          margin: 0;
          font-weight: 700;
          color: #fafafa;
        }

        .job-contact-avatar-wrap {
          width: 70px;
          height: 70px;
          margin-bottom: 0.55rem;
          border-radius: 9999px;
          overflow: hidden;
          border: 1px solid #3f3f46;
          background: #111827;
        }

        .job-contact-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .job-contact-position {
          margin: 0.2rem 0 0;
          color: #d4d4d8;
          font-size: 0.84rem;
        }

        .job-contact-links {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .job-contact-link {
          color: #f4f4f5;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-size: 0.84rem;
          word-break: break-all;
        }

        @media (max-width: 768px) {
          .job-content { font-size: 0.84rem; }
          .job-content h1 { font-size: 1.1rem; }
          .job-content h2 { font-size: 1rem; }
          .job-content video,
          .job-content iframe { min-height: 180px; }
        }
      `}</style>
    </div>
  );
}
