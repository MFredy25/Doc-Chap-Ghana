"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  Building2,
  ArrowRight,
  CalendarCheck2,
  CreditCard,
  Users,
  HeartPulse,
  BadgeCheck,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  Stethoscope,
  FileText,
} from "lucide-react";

function InfoCard({
  title,
  description,
  icon: Icon,
  delayMs = 0,
  iconBgClass = "bg-teal-600",
  tintClass = "from-teal-500/12 via-emerald-500/8 to-transparent",
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  delayMs?: number;
  iconBgClass?: string;
  tintClass?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
      style={{
        animation: `fadeUp 900ms cubic-bezier(0.22,1,0.36,1) ${delayMs}ms both`,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tintClass}`}
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClass}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </span>

          <h3 className="text-base font-semibold text-black dark:text-white">
            {title}
          </h3>
        </div>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function ClinicsPage() {
  const router = useRouter();

  const heroStyle = useMemo(
    () => ({
      animation: "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 0ms both",
    }),
    []
  );

  const panelStyle = useMemo(
    () => ({
      animation: "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 120ms both",
    }),
    []
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes softPulse {
          0% { transform: scale(1); opacity: .92; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: .92; }
        }
      `}</style>

      <main>
        <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div style={heroStyle}>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-900/40 dark:bg-teal-900/20 dark:text-teal-200">
                  <Building2 className="h-4 w-4" />
                  Clinics
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
                  Manage your clinic with Doc Chap Ghana
                </h1>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Centralise appointments, team management, payments and
                  visibility on one modern, clear and secure healthcare
                  platform.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <BadgeCheck className="h-4 w-4" />
                    Centralised management
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-900/40 dark:bg-cyan-900/20 dark:text-cyan-200">
                    <Sparkles className="h-4 w-4" />
                    Clinic workspace
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-900/40 dark:bg-teal-900/20 dark:text-teal-200">
                    <HeartPulse className="h-4 w-4" />
                    Patient journey
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push("/clinics/signup")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500 active:bg-teal-700"
                    style={{
                      animation: "softPulse 2.2s ease-in-out 0.9s infinite",
                    }}
                  >
                    Create a clinic account
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/clinics/login")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-600 bg-white px-5 py-3 text-sm font-semibold text-teal-700 shadow-md transition hover:bg-teal-50 active:bg-teal-100 dark:border-teal-500 dark:bg-zinc-950 dark:text-white dark:hover:bg-teal-600/20"
                  >
                    Log in
                  </button>
                </div>

                <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  A clear public page to present your clinic offering, followed
                  by a dedicated workspace for daily operations.
                </p>
              </div>

              <div style={panelStyle} className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/12 via-emerald-500/8 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-black dark:text-white">
                          A better organised clinic
                        </div>

                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          Easier for your team, smoother for your patients.
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <CalendarCheck2 className="h-5 w-5 text-teal-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Appointment management
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Organise consultations, confirmations,
                            cancellations and availability.
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <Stethoscope className="h-5 w-5 text-emerald-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Doctor scheduling
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Manage practitioners, specialities and available
                            time slots in one place.
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Payments & invoices
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Follow payments, collections and clinic invoicing.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />

                      <div className="relative">
                        <div className="flex items-center gap-2 font-semibold">
                          <Users className="h-4 w-4 text-emerald-600" />
                          Team & visibility
                        </div>

                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          Add team members, organise access and make your clinic
                          easier to find for patients.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-3xl bg-teal-500/10 blur-xl" />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                title="Appointments"
                description="Scheduling, confirmations and consultation tracking."
                icon={CalendarCheck2}
                delayMs={0}
                iconBgClass="bg-teal-600"
                tintClass="from-teal-500/12 via-emerald-500/8 to-transparent"
              />

              <InfoCard
                title="Doctors"
                description="Manage practitioner schedules and availability."
                icon={Stethoscope}
                delayMs={90}
                iconBgClass="bg-emerald-600"
                tintClass="from-emerald-500/12 via-teal-500/8 to-transparent"
              />

              <InfoCard
                title="Payments"
                description="Track payments, invoices and financial activity."
                icon={CreditCard}
                delayMs={180}
                iconBgClass="bg-cyan-700"
                tintClass="from-cyan-500/12 via-emerald-500/8 to-transparent"
              />

              <InfoCard
                title="Patient journey"
                description="A simpler, clearer and better structured experience."
                icon={FileText}
                delayMs={270}
                iconBgClass="bg-teal-700"
                tintClass="from-teal-500/12 via-cyan-500/8 to-transparent"
              />
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-12 sm:px-6 lg:px-10">
          <div
            className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8"
            style={{
              animation:
                "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 240ms both",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 via-emerald-500/6 to-transparent" />

            <div className="relative">
              <h2 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
                Join Doc Chap Ghana for clinics
              </h2>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                Create your clinic account to get started, or explore the
                clinic workspace first to learn more about the product.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/clinics/signup")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500 active:bg-teal-700"
                >
                  Create a clinic account
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/clinics/login")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-md transition hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                >
                  Log in
                </button>

                <Link
                  href="/clinics/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-600 bg-white px-5 py-3 text-sm font-semibold text-teal-700 shadow-md transition hover:bg-teal-50 active:bg-teal-100 dark:border-teal-500 dark:bg-zinc-950 dark:text-white dark:hover:bg-teal-600/20"
                >
                  Discover the clinic workspace
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}