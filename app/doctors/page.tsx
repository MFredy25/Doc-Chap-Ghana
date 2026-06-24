"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  Stethoscope,
  ShieldCheck,
  CalendarCheck2,
  CreditCard,
  Video,
  FileText,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  LineChart,
} from "lucide-react";

function InfoCard({
  title,
  description,
  icon: Icon,
  delayMs = 0,
  iconBgClass = "bg-blue-600",
  tintClass = "from-blue-500/10 via-indigo-500/6 to-transparent",
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
        animation: `fadeUp 900ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms both`,
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

export default function DoctorsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
          0% { transform: scale(1); opacity: .9; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: .9; }
        }
      `}</style>

      <main>
        <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div style={heroStyle}>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
                  <Stethoscope className="h-4 w-4" />
                  Doctors
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
                  Grow your practice with Doc Chap Ghana
                </h1>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Create your profile, receive appointments, manage your
                  schedule, offer teleconsultations and follow your payments on
                  a modern and secure healthcare platform.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <BadgeCheck className="h-4 w-4" />
                    Security & access
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-200">
                    <Sparkles className="h-4 w-4" />
                    Teleconsultation
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200">
                    <LineChart className="h-4 w-4" />
                    Payments & tracking
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push("/doctors/signup")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 active:bg-blue-700"
                    style={{
                      animation: "softPulse 2.2s ease-in-out 0.9s infinite",
                    }}
                  >
                    Sign up as a doctor
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/doctors/login")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50 active:bg-blue-100 dark:border-blue-500 dark:bg-zinc-950 dark:text-white dark:hover:bg-blue-600/20"
                  >
                    Log in
                  </button>
                </div>

                <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  Already registered? Log in to access your doctor dashboard.
                </p>
              </div>

              <div style={panelStyle} className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/12 via-indigo-500/8 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-black dark:text-white">
                          Security & access
                        </div>

                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          Access controls, protected data and traceability.
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <CalendarCheck2 className="h-5 w-5 text-blue-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Schedule & appointments
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Manage your availability and follow your
                            consultations.
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <Video className="h-5 w-5 text-indigo-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Teleconsultation
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Activate video consultations according to your
                            practice model.
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-emerald-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Payments & invoices
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Online payments, activity tracking and invoices.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent" />

                      <div className="relative">
                        <div className="flex items-center gap-2 font-semibold">
                          <FileText className="h-4 w-4 text-sky-600" />
                          Patient records & follow-up
                        </div>

                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          A clearer patient journey with records, history and
                          documents.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-3xl bg-blue-500/10 blur-xl" />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                title="Professional profile"
                description="Present your specialities, fees and availability."
                icon={Stethoscope}
                delayMs={mounted ? 0 : 0}
                iconBgClass="bg-blue-600"
                tintClass="from-blue-500/12 via-indigo-500/8 to-transparent"
              />

              <InfoCard
                title="Appointments"
                description="Receive and manage appointments with less friction."
                icon={CalendarCheck2}
                delayMs={mounted ? 90 : 0}
                iconBgClass="bg-indigo-600"
                tintClass="from-indigo-500/12 via-sky-500/8 to-transparent"
              />

              <InfoCard
                title="Teleconsultation"
                description="Offer video consultations with more flexibility."
                icon={Video}
                delayMs={mounted ? 180 : 0}
                iconBgClass="bg-sky-600"
                tintClass="from-sky-500/12 via-blue-500/8 to-transparent"
              />

              <InfoCard
                title="Payments"
                description="Mobile Money, wallet and card payments with simple tracking."
                icon={CreditCard}
                delayMs={mounted ? 270 : 0}
                iconBgClass="bg-emerald-600"
                tintClass="from-emerald-500/12 via-lime-500/8 to-transparent"
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
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/6 to-transparent" />

            <div className="relative">
              <h2 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
                Get started in 2 minutes
              </h2>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                Sign up, complete your profile with your specialities,
                consultation modes and opening hours, then activate your
                services. You will be ready to receive appointments and follow
                your activity.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/doctors/signup")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 active:bg-blue-700"
                >
                  Sign up now
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/doctors/login")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-md transition hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                >
                  I already have an account
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}