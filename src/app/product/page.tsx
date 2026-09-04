"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function ProductPage() {
  const [selected, setSelected] = useState<"basic" | "pro" | "enterprise">("basic");
  const [refLink, setRefLink] = useState("");

  const packages = {
    basic: {
      title: "Basic",
      price: "Free",
      badge: "free",
      benefits: [
        "Access to waifu dashboard",
        "Limited coin tracking (10 coins)",
        "Email notifications",
        "Community forum access",
      ],
      cta: "Get Basic",
      ctaLink: "/product?basic",
      description: "Start tracking your favorite coins with basic features.",
    },
    pro: {
      title: "Pro",
      price: "$9/mo",
      badge: "pro",
      benefits: [
        "Unlimited coin tracking",
        "Real-time price alerts",
        "Advanced analytics",
        "Priority support",
        "Access to bot trading terminal",
      ],
      cta: "Subscribe Pro",
      ctaLink: "/product?pro",
      description: "Full-featured suite for serious traders.",
    },
    enterprise: {
      title: "Enterprise",
      price: "Custom",
      badge: "enterprise",
      benefits: [
        "Dedicated account manager",
        "Custom integrations",
        "SLA-backed uptime",
        "White-label dashboard",
        "Bulk API access",
      ],
      cta: "Talk to Sales",
      ctaLink: "/product?enterprise",
      description: "Tailored solution for institutions and large teams.",
    },
  };

  // Generate referral link on plan change
  useEffect(() => {
    setRefLink(`https://emergent-matrix.vercel.app/ref?shared=${selected}`);
  }, [selected]);

  return (
    <section className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 border-b border-white/15 pb-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Panther Digital · Product
          </h1>
          <p className="mt-2 text-white/60 text-lg">
            Choose the plan that fits your journey.
          </p>
        </header>

        {/* Package grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(packages).map(([key, pkg]) => (
            <div
              key={key}
              className={`glass rounded-2xl p-6 border border-white/10 transition-all hover:border-white/20 ${
                selected === key
                  ? "border-white/30 shadow-lg"
                  : ""
              }`}
            >
              <div className="text-3xl font-bold mb-2">{pkg.title}{" "}<span className="text-white/40">{pkg.badge}</span></div>
              <p className="text-white/40 text-base mb-4">{pkg.price}</p>
              <ul className="space-y-2 text-white/70 text-sm">
                {pkg.benefits.map((b, i) => (
                  <li key={i} className="flex items-start">
                    <span className="size-3 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center mt-1">
                      {/* using a simple checkmark via ▸ */}
                    </span>
                    <span className="ml-2 flex-1">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={pkg.ctaLink}
                  className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    selected === key
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {pkg.cta}
                  <svg
                    className="ml-2 size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M5 12h3m4 0h3m4 0h3M6 7l10 9-10 9H5z" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Referral program */}
        <div className="mt-8 glass rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">Referral Program</h2>
          <p className="text-white/60 text-base mb-6">
            Earn rewards by sharing Panther Digital with friends. When they subscribe, you get a percentage of their first payment.
          </p>

          <div className="border rounded-xl p-4 mb-6" style={{ borderColor: "white/20" }}>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="text"
                id="ref-link"
                value={refLink}
                readOnly
                className="flex-1 rounded border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                onChange={e => setRefLink(e.target.value)}
                placeholder="Copy your referral link"
              />
              <button
                onClick={() => navigator.clipboard.writeText(refLink)}
                className="accent-btn rounded px-4 py-2 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-white/50">
              Referral link automatically includes your selected plan tag.
            </p>
          </div>

          <div className="space-y-3 text-white/70 text-sm">
            <div>
              <span className="font-medium">Earn:</span>
              <span>10% of first payment per referral</span>
            </div>
            <div>
              <span className="font-medium">Payout:</span>
              <span>Monthly, via your preferred method</span>
            </div>
            <div>
              <span className="font-medium">Track:</span>
              <span>Dashboard in your account panel</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
