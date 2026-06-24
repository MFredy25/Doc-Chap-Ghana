"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  ArrowRight,
  BadgeCheck,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  Baby,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  Clock,
  UserRound,
  FileText,
  Users,
  Stethoscope,
} from "lucide-react";

function InfoCard({
  title,
  description,
  icon: Icon,
  delayMs = 0,
  iconBgClass = "bg-pink-600",
  tintClass = "from-pink-500/12 via-rose-500/8 to-transparent",
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
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tintClass}`} />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClass}`}>
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

export default function MidwivesPage() {
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
    <div className="min-h-screen bg-white dark:bg-black">
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
        <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-black">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-rose-500/10 blur-3xl" />

          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div style={heroStyle}>
                <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-800 dark:border-pink-900/40 dark:bg-pink-900/20 dark:text-pink-200">
                  <Baby className="h-4 w-4" />
                  Midwives
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
                  Join Doc Chap Ghana as a midwife
                </h1>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Present your profile, services and availability, and make it easier for patients seeking maternal health support to connect with you.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-800 dark:border-pink-900/40 dark:bg-pink-900/20 dark:text-pink-200">
                    <BadgeCheck className="h-4 w-4" />
                    Verified profile
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
                    <Sparkles className="h-4 w-4" />
                    Professional visibility
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-800 dark:border-fuchsia-900/40 dark:bg-fuchsia-900/20 dark:text-fuchsia-200">
                    <CalendarCheck className="h-4 w-4" />
                    Patient requests
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push("/midwives/signup")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-pink-500 active:bg-pink-700"
                    style={{
                      animation: "softPulse 2.2s ease-in-out 0.9s infinite",
                    }}
                  >
                    Create my midwife account
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/midwives/login")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-md transition hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                  >
                    Log in
                  </button>
                </div>

                <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  A simple page to present your practice, services, opening hours and service areas.
                </p>
              </div>

              <div style={panelStyle} className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-500/12 via-rose-500/8 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-600 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-black dark:text-white">
                          A clear professional workspace
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          Easier for midwives, more reassuring for patients.
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-white/90 p-4 dark:border-pink-900/40 dark:bg-zinc-950/70">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <ClipboardList className="h-5 w-5 text-pink-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Present your services
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Present your services: pregnancy follow-up, birth preparation, postnatal consultations, guidance and support.
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white/90 p-4 dark:border-rose-900/40 dark:bg-zinc-950/70">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <HeartPulse className="h-5 w-5 text-rose-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Maternal care
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Patients can find a midwife based on location, services offered and their follow-up needs.
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-fuchsia-100 bg-white/90 p-4 dark:border-fuchsia-900/40 dark:bg-zinc-950/70">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent" />

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <CalendarCheck className="h-5 w-5 text-fuchsia-700 dark:text-fuchsia-300" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Appointments & requests
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Centralise patient requests and make appointment management easier.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-6 overflow-hidden rounded-2xl border border-pink-100 bg-white/90 p-4 text-sm text-zinc-700 dark:border-pink-900/40 dark:bg-zinc-950/70 dark:text-zinc-200">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent" />

                      <div className="relative">
                        <div className="flex items-center gap-2 font-semibold">
                          <Users className="h-4 w-4 text-pink-600" />
                          Simpler patient relationships
                        </div>

                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          Present your experience, availability, service areas and contact methods.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-3xl bg-pink-500/10 blur-xl" />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                title="Professional profile"
                description="Present your identity, experience and contact details."
                icon={UserRound}
                delayMs={0}
                iconBgClass="bg-pink-600"
                tintClass="from-pink-500/12 via-rose-500/8 to-transparent"
              />

              <InfoCard
                title="Services proposés"
                description="Ajoutez vos consultations, suivis et accompagnements disponibles."
                icon={Stethoscope}
                delayMs={90}
                iconBgClass="bg-rose-600"
                tintClass="from-rose-500/12 via-pink-500/8 to-transparent"
              />

              <InfoCard
                title="Patient requests"
                description="Recevez les demandes et organisez vos prises en charge plus simplement."
                icon={CalendarCheck}
                delayMs={180}
                iconBgClass="bg-fuchsia-700"
                tintClass="from-fuchsia-500/12 via-rose-500/8 to-transparent"
              />

              <InfoCard
                title="Horaires & zones"
                description="Affichez vos disponibilités, communes et zones d’intervention."
                icon={Clock}
                delayMs={270}
                iconBgClass="bg-pink-700"
                tintClass="from-pink-500/12 via-fuchsia-500/8 to-transparent"
              />
            </div>
          </div>
        </section>

        <section className="w-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950/40 sm:px-6 lg:px-10">
          <div
            className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8"
            style={{
              animation: "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 240ms both",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-500/10 via-rose-500/6 to-transparent" />

            <div className="relative">
              <h2 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
                Rejoindre Doc Chap comme sage-femme
              </h2>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                Créez votre espace sage-femme pour présenter votre activité, vos
                services et vos disponibilités aux patientes.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/midwives/signup")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-pink-500 active:bg-pink-700"
                >
                  Create my midwife account
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/midwives/login")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-md transition hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                >
                  Log in
                </button>

                <Link
                  href="/sage-femme/espace-sage-femme"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-600 bg-white px-5 py-3 text-sm font-semibold text-pink-700 shadow-md transition hover:bg-pink-50 active:bg-pink-100 dark:border-pink-500 dark:bg-zinc-950 dark:text-white dark:hover:bg-pink-600/20"
                >
                  Découvrir l’espace sage-femme
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <FileText className="h-4 w-4" />
                Vous pourrez compléter vos informations professionnelles après
                la création du compte.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}