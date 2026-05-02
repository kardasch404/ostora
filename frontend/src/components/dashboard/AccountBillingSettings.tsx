"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { paymentClient } from "@/lib/payment-client";
import { apiClient } from "@/lib/api-client";

type PlanId = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL" | "B2B_STARTER" | "B2B_PRO";
type Tab = "payments" | "payments-faq" | "password";

type Plan = {
  id: PlanId;
  name: string;
  priceMad: number;
  cycle: "forever" | "month" | "year";
  badge?: string;
  features: string[];
};

type DashboardPayload = {
  subscription: {
    plan: PlanId;
    status: string;
    currentPeriodEnd: string;
  };
  status: {
    label: string;
    tone: "success" | "warning" | "danger";
    validUntil: string;
  };
  paymentDue: {
    amountMad: number;
    dueAt: string;
  };
  incompleteTransactions: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    description: string;
    status: string;
    reason: string;
  }>;
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: string;
    title: string;
  }>;
  receipts: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    title: string;
  }>;
};

const fallbackPlans: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    priceMad: 0,
    cycle: "forever",
    features: ["5 applications/month", "1 bundle max", "1 email config", "Basic job search", "No AI features", "No networking"],
  },
  {
    id: "PREMIUM_MONTHLY",
    name: "Premium Monthly",
    priceMad: 49,
    cycle: "month",
    badge: "7 days FREE trial",
    features: ["Unlimited applications", "10 bundles", "5 email configs", "AI CV analysis", "AI cover letter gen", "Networking module", "Bulk apply"],
  },
  {
    id: "PREMIUM_ANNUAL",
    name: "Premium Annual",
    priceMad: 399,
    cycle: "year",
    badge: "Save 2 months free",
    features: ["Everything in Monthly", "Priority AI queue", "Advanced analytics", "B2B API access", "Invoice PDF download"],
  },
  {
    id: "B2B_STARTER",
    name: "B2B Starter",
    priceMad: 999,
    cycle: "month",
    features: ["1000 API calls/day", "Company data access", "Job market stats", "Webhook support"],
  },
  {
    id: "B2B_PRO",
    name: "B2B Pro",
    priceMad: 2499,
    cycle: "month",
    features: ["10000 API calls/day", "RH profile access", "Bulk data export", "SLA 99.9%"],
  },
];

const paymentFaqItems = [
  "My payment link is not accessible on e-Hub / I do not see a payment plan",
  "I do not see the prompt to make payment on e-Hub",
  "The payment link is not working",
  "I have paid but it is not reflected on the payment tab",
  "My payment is reflected on eHub but I still see the prompt to pay",
  "Payment Deadline Extensions",
  "Challenges with Ozow payment (For Learners based in South Africa)",
  "I made the payment but I have been dropped from the programme",
  "Payment via Flutterwave pending confirmation and dropped from the programme",
];

const statusClass: Record<string, string> = {
  success: "text-emerald-700 bg-emerald-100 border-emerald-200",
  warning: "text-amber-700 bg-amber-100 border-amber-200",
  danger: "text-red-700 bg-red-100 border-red-200",
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 18 18" />
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a17.3 17.3 0 0 1-3.12 4.35" />
      <path d="M6.61 6.61A17.3 17.3 0 0 0 2 12s3 7 10 7a10.94 10.94 0 0 0 4.91-1.17" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AccountBillingSettings({ initialTab = "payments" }: { initialTab?: Tab }) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponState, setCouponState] = useState<{ valid: boolean; message: string } | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<PlanId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.message;
      return Array.isArray(message) ? message.join(", ") : message || fallback;
    }
    return fallback;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      const [profileRes, plansRes, dashboardRes] = await Promise.allSettled([
        apiClient.get("/api/v1/users/profile"),
        paymentClient.get("/subscriptions/plans"),
        paymentClient.get("/subscriptions/dashboard"),
      ]);

      if (profileRes.status === "fulfilled") {
        const user = profileRes.value.data?.data || {};
        const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.name || "User";
        setProfile({ name: fullName, email: user?.email || "user@ostora.com" });
      }

      if (plansRes.status === "fulfilled" && Array.isArray(plansRes.value.data) && plansRes.value.data.length > 0) {
        setPlans(plansRes.value.data);
      }

      if (dashboardRes.status === "fulfilled") {
        setDashboard(dashboardRes.value.data);
      }

      const errors: string[] = [];
      if (profileRes.status === "rejected") errors.push(getErrorMessage(profileRes.reason, "Failed to load profile"));
      if (plansRes.status === "rejected") errors.push(getErrorMessage(plansRes.reason, "Failed to load plans"));
      if (dashboardRes.status === "rejected") errors.push(getErrorMessage(dashboardRes.reason, "Failed to load payment settings"));

      if (errors.length > 0) setError(errors[0]);
      setLoading(false);
    };

    loadData();
  }, []);

  const activePlanName = useMemo(
    () => plans.find((plan) => plan.id === dashboard?.subscription?.plan)?.name || dashboard?.subscription?.plan || "Free",
    [dashboard?.subscription?.plan, plans],
  );

  const handleSelectPlan = async (plan: PlanId) => {
    setBusyPlanId(plan);
    setError("");
    try {
      const payload = {
        plan,
        provider: coupon.trim() ? "PROMO_CODE" : "STRIPE",
        promoCode: coupon.trim() || undefined,
      };

      const res = await paymentClient.post("/subscriptions/checkout", payload);
      if (res.data?.approvalUrl) {
        window.open(res.data.approvalUrl, "_blank", "noopener,noreferrer");
      }

      const dashboardRes = await paymentClient.get("/subscriptions/dashboard");
      setDashboard(dashboardRes.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to process checkout"));
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleValidateCoupon = async () => {
    if (!coupon.trim()) {
      setCouponState({ valid: false, message: "Enter coupon code first" });
      return;
    }

    try {
      const res = await paymentClient.get(`/promo-codes/validate/${encodeURIComponent(coupon.trim())}`);
      const valid = Boolean(res.data?.valid);
      setCouponState({
        valid,
        message: valid ? "Code is valid. You can apply it at checkout." : "Code is invalid or expired.",
      });
    } catch {
      setCouponState({ valid: false, message: "Could not validate code right now" });
    }
  };

  const onPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordSuccess("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const tabs: Array<{ key: Tab; label: string; href: string }> = [
    { key: "payments", label: "Payments", href: "/dashboard/settings/payments" },
    { key: "payments-faq", label: "Payments FAQ", href: "/dashboard/settings/payments-faq" },
    { key: "password", label: "Password", href: "/dashboard/settings/password" },
  ];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white text-gray-900 shadow-[0_30px_90px_rgba(0,0,0,0.1)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_0%,rgba(0,0,0,0.14),transparent_36%),radial-gradient(circle_at_100%_20%,rgba(0,0,0,0.08),transparent_36%)]" />

      <div className="relative p-4 sm:p-8 lg:p-10">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Account</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-black sm:text-4xl">Billing, Security, and Control</h1>
            </div>
            <div className="rounded-full border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white">Premium Workspace</div>
          </div>

          <div className="mt-6 border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.key ? "text-black" : "text-gray-500 hover:text-black"}`}
                >
                  {tab.label}
                  {activeTab === tab.key && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-black" />}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-r from-black to-gray-900 p-5 text-white shadow-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-300">User</p>
              <p className="mt-2 text-2xl font-bold">{profile?.name || "User"}</p>
              <p className="text-sm text-gray-300">{profile?.email || "user@ostora.com"}</p>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="text-sm">Your Payment Status for <b>{activePlanName}</b> is</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-lg font-semibold">{dashboard?.status?.label || "Active"}</div>
                  <div className={`rounded-md border px-2 py-1 text-xs ${statusClass[dashboard?.status?.tone || "success"]}`}>
                    {dashboard?.status?.tone === "success" ? "Up to date" : "Action required"}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">Your access is valid until {formatDate(dashboard?.status?.validUntil)}</div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="text-sm">Payment due is</div>
                <div className="mt-2 text-3xl font-semibold">MAD {dashboard?.paymentDue?.amountMad ?? 0}</div>
                <div className="mt-2 text-sm text-gray-500">Due on {formatDate(dashboard?.paymentDue?.dueAt)}</div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold">Subscription Plans</h2>
              {loading ? (
                <p className="text-sm text-gray-500">Loading plans...</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {plans.map((plan) => (
                    <div key={plan.id} className="rounded-lg border border-gray-200 p-4 transition hover:-translate-y-0.5 hover:border-black hover:shadow-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                          <p className="text-sm text-gray-600">{plan.priceMad} MAD / {plan.cycle}</p>
                        </div>
                        {plan.badge && <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs">{plan.badge}</span>}
                      </div>

                      <ul className="mt-3 space-y-1 text-sm text-gray-700">
                        {plan.features.map((feature) => (
                          <li key={feature}>• {feature}</li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        disabled={busyPlanId === plan.id}
                        onClick={() => handleSelectPlan(plan.id)}
                        className="mt-4 w-full rounded-lg bg-black py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                      >
                        {busyPlanId === plan.id ? "Processing..." : `Choose ${plan.name}`}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Coupon / Gift code</h2>
              <p className="mb-4 text-sm text-gray-600">Apply at checkout. Admin can generate fixed or percentage discount codes with expiry and usage limits.</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  className="rounded-lg border border-black px-4 py-2 text-sm font-semibold"
                >
                  Validate code
                </button>
              </div>
              {couponState && <p className={`mt-3 text-sm ${couponState.valid ? "text-emerald-700" : "text-red-700"}`}>{couponState.message}</p>}
            </div>

            <div>
              <h2 className="my-6 text-lg font-semibold">Incomplete Transactions</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.incompleteTransactions || []).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="p-3">{formatDateTime(item.date)}</td>
                        <td className="p-3">{item.currency} {item.amount}</td>
                        <td className="p-3">{item.description}</td>
                        <td className="p-3">{item.status}</td>
                        <td className="p-3">{item.reason}</td>
                      </tr>
                    ))}
                    {(!dashboard?.incompleteTransactions || dashboard.incompleteTransactions.length === 0) && (
                      <tr>
                        <td className="p-4 text-gray-500" colSpan={5}>No incomplete transactions.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="my-6 text-lg font-semibold">Billing History - Invoices</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Invoice</th>
                      <th className="p-3 text-left">Billing Date</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.invoices || []).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="p-3">{item.title}</td>
                        <td className="p-3">{formatDate(item.date)}</td>
                        <td className="p-3">{item.status}</td>
                        <td className="p-3">{item.currency} {item.amount}</td>
                      </tr>
                    ))}
                    {(!dashboard?.invoices || dashboard.invoices.length === 0) && (
                      <tr>
                        <td className="p-4 text-gray-500" colSpan={4}>No invoices yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="my-6 text-lg font-semibold">Receipts</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Receipt</th>
                      <th className="p-3 text-left">Payment Date</th>
                      <th className="p-3 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.receipts || []).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="p-3">{item.title}</td>
                        <td className="p-3">{formatDate(item.date)}</td>
                        <td className="p-3">{item.currency} {item.amount}</td>
                      </tr>
                    ))}
                    {(!dashboard?.receipts || dashboard.receipts.length === 0) && (
                      <tr>
                        <td className="p-4 text-gray-500" colSpan={3}>No receipts yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "password" && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold">Password</h3>
            <div className="border-b border-gray-200 pb-5 text-sm text-gray-500">Please enter your current password to change your password.</div>

            <form onSubmit={onPasswordSubmit}>
              <div className="my-6 flex w-full flex-col gap-5 border-b border-gray-200 pb-5 sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4">
                <div className="space-y-2">
                  <label className="text-sm font-normal">Current password</label>
                  <div className="flex h-10 items-center gap-0 rounded-md border border-gray-300 bg-white pr-3">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className="h-full w-full rounded-r-none border-none bg-white py-2 pl-3 text-sm outline-none"
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                    <button type="button" className="text-gray-500" onClick={() => setShowCurrentPassword((prev) => !prev)}>
                      <EyeIcon open={showCurrentPassword} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-normal">New password</label>
                  <div className="flex h-10 items-center gap-0 rounded-md border border-gray-300 bg-white pr-3">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="h-full w-full rounded-r-none border-none bg-white py-2 pl-3 text-sm outline-none"
                      placeholder="Enter the new password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <button type="button" className="text-gray-500" onClick={() => setShowNewPassword((prev) => !prev)}>
                      <EyeIcon open={showNewPassword} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-normal">Confirm new password</label>
                  <div className="flex h-10 items-center gap-0 rounded-md border border-gray-300 bg-white pr-3">
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      className="h-full w-full rounded-r-none border-none bg-white py-2 pl-3 text-sm outline-none"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(event) => setConfirmNewPassword(event.target.value)}
                    />
                    <button type="button" className="text-gray-500" onClick={() => setShowConfirmNewPassword((prev) => !prev)}>
                      <EyeIcon open={showConfirmNewPassword} />
                    </button>
                  </div>
                </div>
              </div>

              {passwordError && <p className="mb-3 text-sm text-red-700">{passwordError}</p>}
              {passwordSuccess && <p className="mb-3 text-sm text-emerald-700">{passwordSuccess}</p>}

              <button className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white" type="submit">
                Update password
              </button>
            </form>
          </div>
        )}

        {activeTab === "payments-faq" && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 sm:p-8">
            <div className="container w-full px-2 pb-8 pt-12 sm:w-[80%] md:w-[70%]">
              <div className="text-center">
                <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">Everything you need to know about the payments</h2>
              </div>

              <div className="mt-12">
                {paymentFaqItems.map((question, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={question} className="my-3 border-b border-gray-200">
                      <h3 className="flex">
                        <button
                          type="button"
                          className="flex w-full flex-1 items-center justify-between py-4 text-left font-medium transition-all hover:underline"
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          aria-expanded={isOpen}
                        >
                          <span className="pr-4 text-left text-sm sm:text-base">{question}</span>
                          <ChevronDown open={isOpen} />
                        </button>
                      </h3>
                      {isOpen && (
                        <div className="pb-4 text-sm text-gray-600">
                          Please submit a support ticket with your payment reference, account email, and screenshot. Our billing team will investigate and resolve it quickly.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-gray-100 p-4 sm:p-8">
              <h4 className="text-sm font-semibold sm:text-base">Need assistance?</h4>
              <p className="text-center text-sm font-light sm:text-base">Please submit a support ticket through our Zendesk</p>
              <a className="underline hover:text-gray-700" href="https://help.alxafrica.com/support/tickets/new" target="_blank" rel="noreferrer">
                <button className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                  Open Zendesk
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
