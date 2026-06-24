"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  FileText,
  CreditCard,
  Video,
  Building2,
  Download,
  Search,
  ClipboardList,
  CalendarCheck,
  ShieldCheck,
  Lock,
  BadgeCheck,
  ReceiptText,
  CheckCircle2,
  Sparkles,
  Scale,
  Landmark,
  FileCheck2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

/* ----------------------------- Feature Card ----------------------------- */
function FeatureCard({
  title,
  description,
  icon: Icon,
  iconBgClass,
  wrapperClassName = "",
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBgClass?: string;
  wrapperClassName?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-teal-100 bg-white p-8 transition dark:border-zinc-800 dark:bg-zinc-950 ${wrapperClassName}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClass || "bg-teal-700"
            }`}
        >
          <Icon className="h-5 w-5 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {title}
        </h3>
      </div>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

/* ----------------------------- How It Works Card ----------------------------- */
function StepCard({
  title,
  description,
  icon: Icon,
  iconBgClass,
  wrapperClassName = "",
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBgClass: string;
  wrapperClassName?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-6 transition dark:border-zinc-800 dark:bg-zinc-950 ${wrapperClassName}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </span>
        <h4 className="text-base font-semibold text-black dark:text-white">
          {title}
        </h4>
      </div>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

/* ----------------------------- Trust Mini Card ----------------------------- */
function TrustMiniCard({
  title,
  description,
  icon: Icon,
  iconBgClass,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBgClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </span>

        <div>
          <h4 className="text-sm font-semibold text-black dark:text-white sm:text-base">
            {title}
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Legal Card ----------------------------- */
function LegalCard({
  title,
  description,
  icon: Icon,
  iconBgClass,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBgClass: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </span>

        <div>
          <h4 className="text-base font-semibold text-black dark:text-white">
            {title}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Animate-on-scroll hook ----------------------------- */
function useInViewOnce<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px", ...(options || {}) }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, options]);

  return { ref, inView };
}

export default function HomePage() {
  const router = useRouter();

  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [time, setTime] = useState<string>(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0");
    return `${hh}:${mi}`;
  });

  const [persons, setPersons] = useState<number>(1);
  const [address, setAddress] = useState<string>("");

  const [locating, setLocating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ✅ Animation uniquement pour les 2 images
  const clinicImg = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });
  const doctorImg = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });

  // ✅ Animation pour les 4 features
  const feat1 = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });
  const feat2 = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });
  const feat3 = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });
  const feat4 = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });

  // ✅ Animation pour la section confiance premium
  const trustSection = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });
  const trustLeft = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });
  const trustRight = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });
  const trustBottom = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });

  // ✅ Animation pour les 4 steps
  const step1 = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });
  const step2 = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });
  const step3 = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });
  const step4 = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px",
  });

  // ✅ Animation section cadre juridique
  const legalSection = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });
  const legalCard1 = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });
  const legalCard2 = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });
  const legalCard3 = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });
  const legalCard4 = useInViewOnce<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -5% 0px",
  });

  // Geolocation + reverse geocoding
  const handleLocate = useCallback(() => {
    setErrorMsg("");
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
          });

          if (!res.ok) {
            setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          } else {
            const data = (await res.json()) as { display_name?: string };
            const label =
              data?.display_name ||
              `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setAddress(label);
          }
        } catch {
          setAddress("Location detected");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setErrorMsg(
            "Allow location access to use this feature."
          );
        } else {
          setErrorMsg("Unable to get your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Desktop/tablet navigation
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (persons) params.set("persons", String(persons));
    if (address) params.set("address", address);

    router.push(`/search?${params.toString()}`);
  }, [address, date, persons, router, time]);

  // Mobile navigation: simple search only
  const handleMobileSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (address.trim()) params.set("address", address.trim());

    router.push(`/search?${params.toString()}`);
  }, [address, router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />

      {/* HERO vidéo plein écran + barre de recherche */}
      <section className="relative w-full overflow-hidden">
        <video
          src="/videos/doctor.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-[62vh] md:h-[72vh] lg:h-[77vh] object-cover object-[50%_40%] sm:object-[50%_45%] lg:object-center"
        />
        <div className="absolute inset-0 bg-black/40 dark:bg-black/50" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-6xl px-4 sm:px-6 md:px-8">
            <div className="text-center text-white">
              <h1 className="font-semibold text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
                Book appointments easily{" "}
                <br className="hidden sm:block" />
                with a doctor or clinic
              </h1>

              <p className="mt-3 text-sm sm:text-base md:text-lg text-white/90">
                Find a doctor or clinic, book and pay online,
                then access care securely.
              </p>
            </div>

            {/* Mobile search bar */}
            <div className="mt-6 flex justify-center md:hidden">
              <div className="w-full max-w-xl">
                <div className="rounded-xl bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-md p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 flex-1 min-w-0">
                      <span className="text-gray-700 dark:text-gray-200 text-sm">
                        🔍
                      </span>
                      <input
                        type="text"
                        placeholder="City, area, doctor name…"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent outline-none text-gray-600 dark:text-gray-300 text-sm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleMobileSearch}
                      className="shrink-0 whitespace-nowrap rounded-lg px-4 py-2 font-medium shadow bg-emerald-600 hover:bg-emerald-700 text-white transition text-sm"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop/tablet search bar */}
            <div className="mt-6 sm:mt-8 hidden md:flex justify-center">
              <div className="w-full max-w-4xl">
                <div className="rounded-xl bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-md">
                  <div className="overflow-x-auto">
                    <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-3 p-3 sm:p-4">
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shrink-0">
                        <span className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
                          📅
                        </span>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="bg-transparent outline-none text-gray-700 dark:text-gray-200 text-sm sm:text-base w-[125px] sm:w-auto"
                        />
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shrink-0">
                        <span className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
                          ⏰
                        </span>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="bg-transparent outline-none text-gray-700 dark:text-gray-200 text-sm sm:text-base w-[85px] sm:w-auto"
                        />
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shrink-0">
                        <span className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
                          👤
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={persons}
                          onChange={(e) =>
                            setPersons(Math.max(1, Number(e.target.value || 1)))
                          }
                          className="bg-transparent outline-none text-gray-700 dark:text-gray-200 text-sm sm:text-base w-[60px] sm:w-16"
                        />
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 min-w-[190px] sm:min-w-0 flex-1">
                        <span className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
                          🔍
                        </span>
                        <input
                          type="text"
                          placeholder="Address, city, area…"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="flex-1 bg-transparent outline-none text-gray-600 dark:text-gray-300 text-sm sm:text-base min-w-[130px]"
                        />
                        <button
                          type="button"
                          onClick={handleLocate}
                          aria-label="Use my location"
                          title="Use my location"
                          className="ml-auto rounded-md px-2 py-1 text-sm sm:text-base shrink-0"
                        >
                          <span className="text-red-600">📍</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSearch}
                        className="whitespace-nowrap rounded-lg px-4 py-2 font-medium shadow bg-emerald-600 hover:bg-emerald-700 text-white transition shrink-0"
                      >
                        {locating ? "Locating..." : "Search"}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="px-4 pb-3 text-sm text-red-600 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* End search bar */}
          </div>
        </div>
      </section>

      <main>
        <section id="features" className="bg-white dark:bg-zinc-950 py-20">
          <div className="w-full px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-black dark:text-white">
                Everything you need to manage your healthcare in one place
              </h2>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Appointments, teleconsultation and secure payments in just a few clicks.
              </p>

              <div className="mt-5 flex justify-center">
                <a
                  href="/telemedicine-guidance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:underline dark:border-indigo-900/50 dark:bg-zinc-950 dark:text-indigo-400 dark:hover:bg-zinc-900"
                >
                  Learn more about telemedicine and healthcare regulations in Ghana
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div
                ref={feat1.ref}
                className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${feat1.inView
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 -translate-y-8 scale-90"
                  }`}
              >
                <FeatureCard
                  title="Health Records & Care"
                  description="Manage patient information, medical history, documents and care journeys."
                  icon={FileText}
                  iconBgClass="bg-blue-600"
                  wrapperClassName="hover:shadow-md hover:scale-[1.02] transition-transform duration-300"
                />
              </div>

              <div
                ref={feat2.ref}
                className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${feat2.inView
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-10 scale-90"
                  }`}
              >
                <FeatureCard
                  title="Integrated Payments"
                  description="Mobile Money, wallets and card payments with automated invoicing."
                  icon={CreditCard}
                  iconBgClass="bg-emerald-600"
                  wrapperClassName="hover:shadow-md hover:scale-[1.02] transition-transform duration-300"
                />
              </div>

              <div
                ref={feat3.ref}
                className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${feat3.inView
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 -translate-y-12 rotate-[-1deg] scale-90"
                  }`}
              >
                <FeatureCard
                  title="Teleconsultation"
                  description="Secure video consultations integrated into the platform."
                  icon={Video}
                  iconBgClass="bg-purple-600"
                  wrapperClassName="hover:shadow-md hover:scale-[1.02] transition-transform duration-300"
                />
              </div>

              <div
                ref={feat4.ref}
                className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${feat4.inView
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-12 rotate-[1deg] scale-90"
                  }`}
              >
                <FeatureCard
                  title="Clinics"
                  description="Find a clinic, explore its services and book quickly."
                  icon={Building2}
                  iconBgClass="bg-orange-600"
                  wrapperClassName="hover:shadow-md hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            </div>

            {/* Premium trust section */}
            <div
              ref={trustSection.ref}
              className={`mt-16 rounded-[32px] border border-zinc-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
                ${trustSection.inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
                }`}
            >
              <div className="px-6 pt-8 sm:px-8 lg:px-10 lg:pt-10">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-zinc-950 dark:text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                    Trust · security · transparency
                  </div>

                  <h3 className="mt-4 text-3xl font-bold text-black dark:text-white">
                    Book your healthcare with confidence
                  </h3>

                  <p className="mx-auto mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300">
                    Doc Chap Ghana is designed to offer a clearer, more reassuring and more secure healthcare experience,
                    from your search through to your appointment.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 px-6 py-8 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-10 lg:py-10">
                {/* Main left card */}
                <div
                  ref={trustLeft.ref}
                  className={`lg:col-span-6 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${trustLeft.inView
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-10"
                    }`}
                >
                  <div className="h-full rounded-[28px] bg-slate-900 p-7 text-white shadow-xl">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/20">
                      <ShieldCheck className="h-7 w-7 text-emerald-400" />
                    </div>

                    <h4 className="mt-6 text-2xl font-bold leading-tight">
                      Appointments designed to inspire confidence
                    </h4>

                    <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
                      Doc Chap Ghana helps patients find healthcare professionals,
                      book appointments and access services with confidence,
                      in a clear, structured and secure environment.
                    </p>

                    <div className="mt-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                        <p className="text-sm text-white/85">
                          Clear information before booking with healthcare professionals
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                        <p className="text-sm text-white/85">
                          A secure experience at every stage of the patient journey,
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                        <p className="text-sm text-white/85">
                          A platform built for patients, doctors and clinics.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right cards */}
                <div
                  ref={trustRight.ref}
                  className={`lg:col-span-6 flex flex-col gap-4 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${trustRight.inView
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-10"
                    }`}
                >
                  <TrustMiniCard
                    title="Trusted clinics"
                    description="Clinics can be reviewed and validated before becoming visible on the platform."
                    icon={ShieldCheck}
                    iconBgClass="bg-emerald-600"
                  />

                  <TrustMiniCard
                    title="Verified doctors"
                    description="Doctors can be reviewed based on the professional information and documents required for the platform."
                    icon={Lock}
                    iconBgClass="bg-blue-600"
                  />

                  <TrustMiniCard
                    title="Secure payments"
                    description="Payments are integrated into the platform for a more reliable, simpler and more reassuring experience."
                    icon={BadgeCheck}
                    iconBgClass="bg-purple-600"
                  />
                </div>
              </div>

              {/* Bottom bar */}
              <div
                ref={trustBottom.ref}
                className={`border-t border-zinc-200/80 bg-white/70 px-6 py-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/60 sm:px-8 lg:px-10 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${trustBottom.inView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                  }`}
              >
                <div className="grid grid-cols-1 gap-3 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Trusted clinics
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    Verified doctors
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-purple-600" />
                    Secure payments
                  </div>
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-orange-600" />
                    Confidential data
                  </div>
                </div>
              </div>
            </div>
            {/* End trust section */}

            {/* Clinics section */}
            <div className="mt-12 flex flex-col md:flex-row items-center gap-10">
              <div className="w-full md:w-1/2">
                <h3 className="text-3xl font-bold text-black dark:text-white">
                  Access trusted clinics near you
                </h3>

                <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Search for a clinic by city, area or specialty, explore availability,
                  key information such as services, location and profile,
                  then book an appointment directly from your phone, anytime.
                </p>

                <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Doc Chap Ghana helps you compare clinics and services, then choose
                  the healthcare facility that suits your needs: in-person consultations
                  or teleconsultation, based on your preferences and availability.
                </p>

                <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
                  Tip: use search and location to find
                  the clinics closest to you at any time.
                </p>
              </div>

              <div
                ref={clinicImg.ref}
                className={`w-full md:w-1/2 flex md:justify-end transform transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${clinicImg.inView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-32"
                  }`}
              >
                <img
                  src="/images/doctor.jpg"
                  alt="Clinics"
                  className="w-full max-w-xl h-auto rounded-xl shadow-md object-cover"
                />
              </div>
            </div>

            {/* Doctors section */}
            <div className="mt-14 flex flex-col md:flex-row items-center gap-10">
              <div
                ref={doctorImg.ref}
                className={`w-full md:w-1/2 transform transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${doctorImg.inView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-32"
                  }
                  order-2 md:order-1`}
              >
                <img
                  src="/images/professionels.jpg"
                  alt="Doctors"
                  className="w-full max-w-xl h-auto rounded-xl shadow-md object-cover"
                />
              </div>

              <div className="w-full md:w-1/2 order-1 md:order-2">
                <h3 className="text-3xl font-bold text-black dark:text-white">
                  Find the right doctor at the right time
                </h3>

                <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  View the key information before booking: specialty,
                  availability and consultation type. Everything is designed to help you
                  choose the healthcare professional who best meets your needs.
                </p>

                <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Find doctors based on your needs, choose the consultation type
                  (in clinic or by video), select an available time slot and confirm your
                  appointment with ease.
                </p>

                <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  With Doc Chap Ghana, book appointments in a few clicks on web or mobile,
                  pay directly online securely, and access
                  your consultation history from your account.
                </p>

                <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
                  Payment methods: Mobile Money and card payments. Ghana payment providers
                  will be configured for the local market.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <h3 className="text-3xl font-bold text-black dark:text-white">
                How does it work for patients?
              </h3>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Book appointments in a few simple and secure steps.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                ref={step1.ref}
                className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${step1.inView
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-32 scale-90"
                  }`}
              >
                <StepCard
                  title="Download the app"
                  description="Install Doc Chap on your phone to find a doctor, book appointments and manage your consultations easily."
                  icon={Download}
                  iconBgClass="bg-blue-600"
                  wrapperClassName="hover:shadow-md hover:scale-[1.05] transition-transform duration-300"
                />
              </div>

              <div
                ref={step2.ref}
                className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${step2.inView
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-32 scale-90"
                  }`}
              >
                <StepCard
                  title="Search for a doctor or clinic"
                  description="Quickly find a healthcare professional or facility based on your needs, location and availability."
                  icon={Search}
                  iconBgClass="bg-emerald-600"
                  wrapperClassName="hover:shadow-md hover:scale-[1.05] transition-transform duration-300"
                />
              </div>

              <div
                ref={step3.ref}
                className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${step3.inView
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-32 scale-90"
                  }`}
              >
                <StepCard
                  title="Enter your information"
                  description="Complete the information needed for your care to book faster and enjoy a smoother experience."
                  icon={ClipboardList}
                  iconBgClass="bg-purple-600"
                  wrapperClassName="hover:shadow-md hover:scale-[1.05] transition-transform duration-300"
                />
              </div>

              <div
                ref={step4.ref}
                className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${step4.inView
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-32 scale-90"
                  }`}
              >
                <StepCard
                  title="Confirm your appointment"
                  description="Choose a time slot, confirm your booking, pay online and attend your appointment securely. "
                  icon={CalendarCheck}
                  iconBgClass="bg-orange-600"
                  wrapperClassName="hover:shadow-md hover:scale-[1.05] transition-transform duration-300"
                />
              </div>
            </div>

            <div className="mt-16 text-center">
              <h3 className="text-3xl font-bold text-black dark:text-white">
                Our goal
              </h3>
              <p className="mt-4 text-zinc-700 dark:text-zinc-300 text-base sm:text-lg">
                Simplify access to healthcare and offer patients a smoother,
                more reassuring and more accessible experience, while helping doctors and clinics
                organize their work more effectively.
              </p>

              <div className="mt-12 text-center">
                <p className="text-zinc-700 dark:text-zinc-300 text-base sm:text-lg">
                  Doc Chap Ghana brings search, appointment booking,
                  teleconsultation, payments and follow-up together in one platform
                  designed to simplify every stage of the healthcare journey.
                </p>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Our goal: simplify access to healthcare and improve the experience
                  for everyone.
                </p>
              </div>
            </div>

            {/* Legal and regulatory section */}
            <div
              ref={legalSection.ref}
              className={`mt-14 rounded-[30px] border border-zinc-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50/70 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 sm:p-8 lg:p-10 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
                ${legalSection.inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
                }`}
            >
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm dark:border-indigo-900/50 dark:bg-zinc-950 dark:text-indigo-400">
                  <Scale className="h-4 w-4" />
                  Legal and regulatory information
                </div>

                <h3 className="mt-4 text-3xl font-bold text-black dark:text-white">
                  A healthcare service designed with compliance and trust in mind
                </h3>

                <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  To strengthen patient confidence, Doc Chap Ghana will present the applicable
                  legal and professional framework for teleconsultation and healthcare practice
                  in Ghana. This transparency supports a clearer,
                  more credible and more reassuring experience.
                </p>

                <div className="mt-5 flex justify-center">
                  <a
                    href="/telemedicine-guidance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:underline dark:border-indigo-900/50 dark:bg-zinc-950 dark:text-indigo-400 dark:hover:bg-zinc-900"
                  >
                    View telemedicine guidance
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div
                  ref={legalCard1.ref}
                  className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${legalCard1.inView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                    }`}
                >
                  <LegalCard
                    title="Telemedicine framework"
                    description="Teleconsultation services will be developed in line with the applicable requirements, professional standards and guidance in Ghana."
                    icon={Landmark}
                    iconBgClass="bg-indigo-600"
                  />
                </div>

                <div
                  ref={legalCard2.ref}
                  className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${legalCard2.inView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                    }`}
                >
                  <LegalCard
                    title="Medical practice"
                    description="Medical services on the platform are intended to align with the applicable rules and professional obligations governing healthcare practice in Ghana."
                    icon={FileCheck2}
                    iconBgClass="bg-emerald-600"
                  />
                </div>

                <div
                  ref={legalCard3.ref}
                  className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${legalCard3.inView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                    }`}
                >
                  <LegalCard
                    title="Consent and identification"
                    description="Telemedicine relies on patient information, consent and reliable identification of the people involved."
                    icon={ShieldCheck}
                    iconBgClass="bg-blue-600"
                  />
                </div>

                <div
                  ref={legalCard4.ref}
                  className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${legalCard4.inView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                    }`}
                >
                  <LegalCard
                    title="Confidentiality and security"
                    description="Teleconsultation-related exchanges should respect confidentiality, security and the protection of health information."
                    icon={ShieldAlert}
                    iconBgClass="bg-rose-600"
                  />
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <Scale className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                    <span className="font-semibold">Transparency:</span> this section is intended
                    to inform patients about the main guidance and requirements
                    relevant to teleconsultation and healthcare practice in
                    Ghana, helping improve understanding and confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bandeau promo FULL WIDTH */}
        <section className="relative w-full h-64 sm:h-72 md:h-80 overflow-hidden">
          <img
            src="/images/docteur.png"
            alt="Join Doc Chap Ghana"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/30 dark:bg-black/40" />

          <div className="relative h-full flex items-center">
            <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16">
              <div className="max-w-xl rounded-xl bg-slate-900/80 text-white p-4 sm:p-5 md:p-6 shadow-lg backdrop-blur">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug">
                  Do you own or manage a clinic?
                </h3>

                <p className="mt-3 text-sm sm:text-base text-white/90">
                  Join Doc Chap Ghana to increase your visibility,
                  simplify appointment management and offer teleconsultation
                  to your patients through a modern and secure platform.
                </p>

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm sm:text-base font-semibold text-white shadow hover:bg-emerald-700 transition"
                  >
                    Learn more
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}