"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  ArrowRight,
  CreditCard,
  BadgeCheck,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  Pill,
  PackageCheck,
  Truck,
  ShoppingBag,
  SearchCheck,
  Clock,
} from "lucide-react";

function InfoCard({
  title,
  description,
  icon: Icon,
  delayMs = 0,
  iconBgClass = "bg-blue-600",
  tintClass = "from-blue-500/12 via-sky-500/8 to-transparent",
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
      className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-md dark:border-blue-900/40 dark:bg-blue-950/20"
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

export default function PharmaciesPage() {
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
    <div className="min-h-screen bg-blue-50/40 dark:bg-black">
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
        <section className="relative overflow-hidden border-b border-blue-100 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div style={heroStyle}>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
                  <Pill className="h-4 w-4" />
                  Pharmacies
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
                  Manage your pharmacy with Doc Chap Ghana
                </h1>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  List your pharmacy, publish available products, make patient orders easier and increase your visibility on a modern, clear and secure platform.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
                    <BadgeCheck className="h-4 w-4" />
                    Available products
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-900/40 dark:bg-sky-900/30 dark:text-sky-200">
                    <Sparkles className="h-4 w-4" />
                    Pharmacy workspace
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-900/40 dark:bg-cyan-900/30 dark:text-cyan-200">
                    <ShoppingBag className="h-4 w-4" />
                    Patient orders
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push("/pharmacies/signup")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 active:bg-blue-700"
                    style={{
                      animation: "softPulse 2.2s ease-in-out 0.9s infinite",
                    }}
                  >
                    List my pharmacy
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/pharmacies/login")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50 active:bg-blue-100 dark:border-blue-500 dark:bg-zinc-950 dark:text-white dark:hover:bg-blue-600/20"
                  >
                    Log in
                  </button>
                </div>

                <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  A clear page to present your pharmacy, services, opening hours and product availability.
                </p>
              </div>

              <div style={panelStyle} className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-blue-50/70 p-6 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/12 via-sky-500/8 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-black dark:text-white">
                          A more visible pharmacy
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          Easier for your team, more convenient for patients.
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white/80 p-4 dark:border-blue-900/40 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <PackageCheck className="h-5 w-5 text-blue-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Product availability
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Add available medicines and products to help patients quickly find what they need.
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white/80 p-4 dark:border-sky-900/40 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <SearchCheck className="h-5 w-5 text-sky-600" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Patient search
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Patients can search for a pharmacy, a product or a location from the platform.
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-white/80 p-4 dark:border-cyan-900/40 dark:bg-zinc-950/60">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                            <div className="text-sm font-semibold text-black dark:text-white">
                              Orders & payments
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Prepare orders, track requests and simplify the patient purchasing journey.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white/80 p-4 text-sm text-zinc-700 dark:border-blue-900/40 dark:bg-zinc-950/60 dark:text-zinc-200">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 font-semibold">
                          <Truck className="h-4 w-4 text-blue-600" />
                          Pickup, delivery & services
                        </div>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          Present your services: pharmacy pickup, delivery, on-call service, opening hours, availability and contact methods.
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
                title="Catalogue produits"
                description="Ajoutez vos médicaments, produits de santé et disponibilités."
                icon={Pill}
                delayMs={0}
                iconBgClass="bg-blue-600"
                tintClass="from-blue-500/12 via-sky-500/8 to-transparent"
              />
              <InfoCard
                title="Disponibilité"
                description="Indiquez les produits disponibles, en rupture ou sur commande."
                icon={PackageCheck}
                delayMs={90}
                iconBgClass="bg-sky-600"
                tintClass="from-sky-500/12 via-blue-500/8 to-transparent"
              />
              <InfoCard
                title="Commandes"
                description="Recevez les demandes des patients et organisez la préparation."
                icon={ShoppingBag}
                delayMs={180}
                iconBgClass="bg-cyan-700"
                tintClass="from-cyan-500/12 via-sky-500/8 to-transparent"
              />
              <InfoCard
                title="Horaires & services"
                description="Affichez vos horaires, services, garde, livraison et contact."
                icon={Clock}
                delayMs={270}
                iconBgClass="bg-blue-700"
                tintClass="from-blue-500/12 via-cyan-500/8 to-transparent"
              />
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-12 sm:px-6 lg:px-10">
          <div
            className="relative overflow-hidden rounded-3xl border border-blue-100 bg-blue-50/70 p-6 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20 sm:p-8"
            style={{
              animation: "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 240ms both",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-sky-500/6 to-transparent" />

            <div className="relative">
              <h2 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
                Rejoindre Doc Chap pour les pharmacies
              </h2>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                Créez votre compte pharmacie pour commencer à présenter votre
                établissement, vos services et les produits disponibles pour les
                patients.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/pharmacies/signup")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 active:bg-blue-700"
                >
                  List my pharmacy
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/pharmacies/login")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-md transition hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                >
                  Log in
                </button>

                <Link
                  href="/pharmacies/espace-pharmacies"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50 active:bg-blue-100 dark:border-blue-500 dark:bg-zinc-950 dark:text-white dark:hover:bg-blue-600/20"
                >
                  Discover the pharmacy workspace
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