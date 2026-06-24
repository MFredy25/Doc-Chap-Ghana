"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  HeartPulse,
  CalendarCheck2,
  Video,
  FileText,
  CreditCard,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  ShieldCheck,
  Search,
  UserPlus,
  LogIn,
} from "lucide-react";

function InfoCard({
  title,
  description,
  icon: Icon,
  delayMs = 0,
  iconBgClass = "bg-emerald-600",
  tintClass = "from-emerald-500/10 via-teal-500/6 to-transparent",
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

export default function PatientsPage() {
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
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl" />

          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div style={heroStyle}>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <HeartPulse className="h-4 w-4" />
                  Patients
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
                  Find a doctor and book an appointment easily
                </h1>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Doc Chap Ghana helps you find doctors, book appointments,
                  access teleconsultations and manage your healthcare journey
                  simply and securely.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <BadgeCheck className="h-4 w-4" />
                    Verified doctors
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-900/40 dark:bg-teal-900/20 dark:text-teal-200">
                    <Sparkles className="h-4 w-4" />
                    Teleconsultation
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200">
                    <ShieldCheck className="h-4 w-4" />
                    Secure data
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => router.push("/search")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:bg-emerald-700"
                    style={{
                      animation: "softPulse 2.2s ease-in-out 0.9s infinite",
                    }}
                  >
                    Find a doctor
                    <Search className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/patients/signup")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 active:bg-zinc-950 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    Patient registration
                    <UserPlus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/patients/login")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                  >
                    Patient login
                    <LogIn className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div style={panelStyle} className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 shadow-sm">
                        <CalendarCheck2 className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-black dark:text-white">
                          Fast appointment booking
                        </div>

                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          Book an appointment with a doctor in just a few
                          clicks.
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-teal-600" />

                          <div className="text-sm font-semibold text-black dark:text-white">
                            Teleconsultation
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          Consult your doctor remotely from home.
                        </p>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-green-600" />

                          <div className="text-sm font-semibold text-black dark:text-white">
                            Secure payments
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          Mobile Money, bank card or secure wallet payments.
                        </p>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-emerald-600" />

                          <div className="text-sm font-semibold text-black dark:text-white">
                            Health records
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          Access your history, prescriptions and medical
                          documents.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                title="Find a doctor"
                description="Search by speciality, city or clinic."
                icon={Search}
                delayMs={mounted ? 0 : 0}
              />

              <InfoCard
                title="Book an appointment"
                description="Reserve your consultation quickly and simply."
                icon={CalendarCheck2}
                delayMs={mounted ? 90 : 0}
              />

              <InfoCard
                title="Teleconsultation"
                description="Consult your doctor remotely."
                icon={Video}
                delayMs={mounted ? 180 : 0}
              />

              <InfoCard
                title="Health records"
                description="Follow your history, prescriptions and documents."
                icon={FileText}
                delayMs={mounted ? 270 : 0}
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
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/6 to-transparent" />

            <div className="relative">
              <h2 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
                Get started with Doc Chap Ghana
              </h2>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                Create your patient account, find a doctor, book appointments
                and manage your healthcare journey more easily.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Download the Doc Chap app
                    </div>

                    <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                      Available on iPhone and Android to book appointments,
                      access your health records and connect to healthcare
                      services more easily.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    Apple App Store • Google Play
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => router.push("/patients/signup")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:bg-emerald-700"
                >
                  Create a patient account
                  <UserPlus className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/patients/login")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 active:bg-zinc-950 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Log in
                  <LogIn className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/search")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                >
                  Find a doctor
                  <Search className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/download")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                >
                  Download the app
                  <ArrowRight className="h-4 w-4" />
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