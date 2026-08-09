"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

type SearchType =
  | "doctor"
  | "clinic"
  | "pharmacy";

type PublicSearchItem = {
  id: string;
  type: SearchType;
  name?: string;
  specialty?: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  photoUrl?: string;
  verified?: boolean;
  active?: boolean;
  bio?: string;
  acceptsNewPatients?: boolean;
  consultationModes?: {
    inPerson?: boolean;
    teleconsultation?: boolean;
    phone?: boolean;
  };
};

type HealthcareSearchApiResponse = {
  ok: boolean;
  doctors?: PublicSearchItem[];
  clinics?: PublicSearchItem[];
  pharmacies?: PublicSearchItem[];
  error?: string;
};

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function typeLabel(
  type: SearchType
): string {
  if (
    type ===
    "doctor"
  ) {
    return "Doctor";
  }

  if (
    type ===
    "clinic"
  ) {
    return "Clinic";
  }

  return "Pharmacy";
}

function TypeIcon({
  type,
  className,
}: {
  type: SearchType;
  className?: string;
}) {
  if (
    type ===
    "doctor"
  ) {
    return (
      <Stethoscope
        className={
          className
        }
      />
    );
  }

  if (
    type ===
    "clinic"
  ) {
    return (
      <Building2
        className={
          className
        }
      />
    );
  }

  return (
    <HeartPulse
      className={
        className
      }
    />
  );
}

export default function SearchDetailClient() {
  const params =
    useParams<{
      id: string;
    }>();

  const searchParams =
    useSearchParams();

  const id =
    decodeURIComponent(
      s(
        params?.id
      )
    );

  const requestedType =
    s(
      searchParams.get(
        "type"
      )
    ).toLowerCase();

  const type:
    | SearchType
    | null =
    requestedType ===
      "doctor" ||
    requestedType ===
      "clinic" ||
    requestedType ===
      "pharmacy"
      ? requestedType
      : null;

  const [
    item,
    setItem,
  ] =
    useState<PublicSearchItem | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    localHour,
    setLocalHour,
  ] =
    useState<number | null>(
      null
    );

  useEffect(() => {
    function updateLocalHour() {
      setLocalHour(
        new Date().getHours()
      );
    }

    updateLocalHour();

    const timer =
      window.setInterval(
        updateLocalHour,
        60_000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, []);

  const isNight =
    localHour !== null &&
    (
      localHour >= 18 ||
      localHour < 7
    );

  const bannerImage =
    isNight
      ? "/images/accra-by-night.png"
      : "/images/accra-by-the-day.png";

  useEffect(() => {
    if (
      !id ||
      !type
    ) {
      setError(
        "Invalid healthcare profile."
      );

      setLoading(
        false
      );

      return;
    }

    let cancelled =
      false;

    const controller =
      new AbortController();

    async function loadItem() {
      setLoading(
        true
      );

      setError(
        null
      );

      try {
        const response =
          await fetch(
            "/api/search-healthcare",
            {
              method:
                "GET",

              cache:
                "no-store",

              signal:
                controller.signal,
            }
          );

        const payload =
          (
            await response.json()
          ) as HealthcareSearchApiResponse;

        if (
          !response.ok ||
          payload.ok !==
            true
        ) {
          throw new Error(
            payload.error ||
              "Unable to load this healthcare profile."
          );
        }

        const source =
          type ===
            "doctor"
            ? payload.doctors ||
              []
            : type ===
                "clinic"
              ? payload.clinics ||
                []
              : payload.pharmacies ||
                [];

        const found =
          source.find(
            (
              candidate
            ) =>
              s(
                candidate.id
              ) === id
          ) ||
          null;

        if (
          !found
        ) {
          throw new Error(
            "This healthcare profile is not available or is no longer visible."
          );
        }

        if (
          !cancelled
        ) {
          setItem(
            found
          );
        }
      } catch (
        loadError
      ) {
        if (
          cancelled ||
          (
            loadError instanceof
              DOMException &&
            loadError.name ===
              "AbortError"
          )
        ) {
          return;
        }

        console.error(
          "[SearchDetail] Load error:",
          loadError
        );

        if (
          !cancelled
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load this healthcare profile."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void loadItem();

    return () => {
      cancelled =
        true;

      controller.abort();
    };
  }, [
    id,
    type,
  ]);

  const location =
    useMemo(
      () => {
        if (
          !item
        ) {
          return "Ghana";
        }

        return [
          s(
            item.city
          ),
          s(
            item.region
          ),
        ]
          .filter(
            Boolean
          )
          .join(
            ", "
          ) ||
          "Ghana";
      },
      [
        item,
      ]
    );

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

            <p className="mt-4 text-sm font-bold text-zinc-700 dark:text-zinc-200">
              Loading healthcare profile...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (
    error ||
    !item ||
    !type
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/40 dark:bg-zinc-950">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

            <h1 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
              Profile unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {error ||
                "This healthcare profile could not be found."}
            </p>

            <Link
              href="/search"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to search
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const modes =
    item.consultationModes;

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main>
        <section
          className="relative overflow-hidden border-b border-emerald-950/20 bg-[#063b34] text-white"
          style={{
            backgroundImage: `url("${bannerImage}")`,
            backgroundPosition:
              "center",
            backgroundRepeat:
              "no-repeat",
            backgroundSize:
              "cover",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-emerald-950/45" />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
            <Link
              href={`/search?type=${type}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-xs font-bold backdrop-blur"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to search
            </Link>

            <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-white/15 shadow-xl backdrop-blur">
                {item.photoUrl ? (
                  <img
                    src={
                      item.photoUrl
                    }
                    alt={
                      s(
                        item.name
                      )
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <TypeIcon
                    type={
                      type
                    }
                    className="h-10 w-10"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                    {typeLabel(
                      type
                    )}
                  </span>

                  {item.verified && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-300/15 px-3 py-1.5 text-xs font-bold">
                      <BadgeCheck className="h-4 w-4" />

                      Verified
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                  {s(
                    item.name
                  )}
                </h1>

                <p className="mt-2 text-sm font-semibold text-emerald-50">
                  {s(
                    item.specialty
                  ) ||
                    typeLabel(
                      type
                    )}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-emerald-50">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 backdrop-blur">
                    <MapPin className="h-4 w-4" />

                    {location}
                  </span>

                  {item.phone && (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 backdrop-blur">
                      <Phone className="h-4 w-4" />

                      {item.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                  About
                </h2>

                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  {s(
                    item.bio
                  ) ||
                    `${s(
                      item.name
                    )} is available in the Doc Chap Ghana healthcare directory.`}
                </p>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                  Contact & location
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <MapPin className="h-5 w-5 text-emerald-600" />

                    <div className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                      Location
                    </div>

                    <div className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">
                      {item.address
                        ? `${item.address}, ${location}`
                        : location}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <Phone className="h-5 w-5 text-blue-600" />

                    <div className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                      Phone
                    </div>

                    <div className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">
                      {item.phone ||
                        "Not publicly displayed"}
                    </div>
                  </div>
                </div>
              </section>

              {(type ===
                "doctor" ||
                type ===
                  "clinic") && (
                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Consultation options
                  </h2>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <UserRound className="h-5 w-5 text-blue-600" />

                      <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                        In person
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {modes?.inPerson !==
                        false
                          ? "Available"
                          : "Unavailable"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                      <Video className="h-5 w-5 text-violet-600" />

                      <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                        Teleconsultation
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {modes?.teleconsultation !==
                        false
                          ? "Available"
                          : "Unavailable"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <Phone className="h-5 w-5 text-emerald-600" />

                      <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                        Phone
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {modes?.phone ===
                        true
                          ? "Available"
                          : "Unavailable"}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Doc Chap Ghana profile
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  This profile is currently visible in the Doc Chap Ghana healthcare directory.
                </p>
              </section>

              {(type ===
                "doctor" ||
                type ===
                  "clinic") && (
                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <CalendarDays className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Appointment
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    {item.acceptsNewPatients ===
                    false
                      ? "This provider is not currently accepting new patients."
                      : "Choose your consultation details, then view the provider's available dates and times."}
                  </p>

                  {item.acceptsNewPatients !==
                    false && (
                    <Link
                      href={`/book-an-appointment?type=${encodeURIComponent(
                        type
                      )}&id=${encodeURIComponent(
                        item.id
                      )}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <CalendarDays className="h-4 w-4" />

                      Book an appointment
                    </Link>
                  )}
                </section>
              )}

              <Link
                href={`/search?type=${type}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to search
              </Link>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}