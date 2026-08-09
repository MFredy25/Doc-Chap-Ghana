"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
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

type PublicDoctor = {
  id: string;
  type?: string;

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
  description?: string;

  acceptsNewPatients?: boolean;

  consultationModes?: {
    inPerson?: boolean;
    teleconsultation?: boolean;
    phone?: boolean;
  };

  configuration?: {
    profileVisible?: boolean;
    acceptsNewPatients?: boolean;

    inPersonEnabled?: boolean;
    teleconsultationEnabled?: boolean;
    phoneConsultationEnabled?: boolean;

    messagingEnabled?: boolean;
    showWhatsApp?: boolean;
    showPracticeAddress?: boolean;

    defaultConsultationDuration?: number;
    defaultConsultationFee?: number;

    currency?: string;
  };
};

type SearchApiResponse = {
  ok: boolean;
  doctors?: PublicDoctor[];
  error?: string;
};

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function doctorName(
  doctor: PublicDoctor
): string {
  const name =
    s(
      doctor.name
    ) ||
    "Doctor";

  return /^dr\.?\s+/i.test(
    name
  )
    ? name
    : `Dr. ${name}`;
}

function DoctorPhoto({
  doctor,
}: {
  doctor: PublicDoctor;
}) {
  const image =
    s(
      doctor.photoUrl
    );

  if (
    image
  ) {
    return (
      <img
        src={
          image
        }
        alt={
          doctorName(
            doctor
          )
        }
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <Stethoscope className="h-10 w-10" />
  );
}

export default function DoctorDetailClient() {
  const params =
    useParams<{
      id: string;
    }>();

  const id =
    decodeURIComponent(
      s(
        params?.id
      )
    );

  const [
    doctor,
    setDoctor,
  ] =
    useState<PublicDoctor | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (
      !id
    ) {
      setError(
        "Invalid doctor profile."
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

    async function loadDoctor() {
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

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          throw new Error(
            `Unable to load doctor profile (${response.status}). ${text.slice(
              0,
              80
            )}`
          );
        }

        const payload =
          (
            await response.json()
          ) as SearchApiResponse;

        if (
          !response.ok ||
          payload.ok !==
            true
        ) {
          throw new Error(
            payload.error ||
            "Unable to load doctor profile."
          );
        }

        const found =
          (
            payload.doctors ||
            []
          ).find(
            (
              item
            ) =>
              s(
                item.id
              ) ===
              id
          ) ||
          null;

        if (
          !found
        ) {
          throw new Error(
            "This doctor profile is not available."
          );
        }

        if (
          found.active ===
          false
        ) {
          throw new Error(
            "This doctor is not currently available."
          );
        }

        if (
          !cancelled
        ) {
          setDoctor(
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
          "[DoctorDetail] Load error:",
          loadError
        );

        if (
          !cancelled
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load doctor profile."
          );

          setDoctor(
            null
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

    void loadDoctor();

    return () => {
      cancelled =
        true;

      controller.abort();
    };
  }, [
    id,
  ]);

  const configuration =
    doctor?.configuration;

  const location =
    useMemo(
      () => {
        if (
          !doctor
        ) {
          return "Ghana";
        }

        return [
          s(
            doctor.city
          ),
          s(
            doctor.region
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
        doctor,
      ]
    );

  const acceptsNewPatients =
    configuration?.acceptsNewPatients ??
    doctor?.acceptsNewPatients ??
    true;

  const inPerson =
    configuration?.inPersonEnabled ??
    doctor?.consultationModes?.inPerson ??
    true;

  const teleconsultation =
    configuration?.teleconsultationEnabled ??
    doctor?.consultationModes?.teleconsultation ??
    true;

  const phoneConsultation =
    configuration?.phoneConsultationEnabled ??
    doctor?.consultationModes?.phone ??
    false;

  const showPhone =
    configuration?.showWhatsApp ??
    true;

  const showAddress =
    configuration?.showPracticeAddress ??
    true;

  const duration =
    Number(
      configuration?.defaultConsultationDuration
    ) ||
    30;

  const currency =
    s(
      configuration?.currency
    ) ||
    "GHS";

  const description =
    s(
      doctor?.bio ||
      doctor?.description
    );

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-4 text-sm font-bold text-zinc-700 dark:text-zinc-200">
              Loading doctor profile...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (
    error ||
    !doctor
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/40 dark:bg-zinc-950">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

            <h1 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
              Doctor unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {error ||
                "This doctor profile could not be found."}
            </p>

            <Link
              href="/search?type=doctor"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to doctors
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const name =
    doctorName(
      doctor
    );

  const specialty =
    s(
      doctor.specialty
    ) ||
    "Medical professional";

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b4f78] to-[#0f8f7b] text-white">
          <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
            <Link
              href="/search?type=doctor"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-3 py-2 text-xs font-bold backdrop-blur transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to doctors
            </Link>

            <div className="mt-7 flex flex-col gap-6 md:flex-row md:items-end">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[30px] border border-white/20 bg-white/15 text-white shadow-xl backdrop-blur">
                <DoctorPhoto
                  doctor={
                    doctor
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                    <Stethoscope className="h-4 w-4" />

                    Doctor
                  </span>

                  {doctor.verified && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-300/15 px-3 py-1.5 text-xs font-bold text-emerald-50">
                      <BadgeCheck className="h-4 w-4" />

                      Verified
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  {name}
                </h1>

                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-50 sm:text-base">
                  <GraduationCap className="h-4 w-4" />

                  {specialty}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/15 px-3 py-2 text-xs font-semibold backdrop-blur">
                    <MapPin className="h-4 w-4" />

                    {location}
                  </span>
                </div>
              </div>

              {acceptsNewPatients && (
                <Link
                  href={`/book-an-appointment/${encodeURIComponent(
                    doctor.id
                  )}?type=doctor`}
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#071b3a] shadow-xl transition hover:bg-blue-50 md:w-auto"
                >
                  <CalendarDays className="h-5 w-5" />

                  Book an appointment
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      About the doctor
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Public professional information.
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  {description ||
                    `${name} is a ${specialty.toLowerCase()} available through the Doc Chap Ghana healthcare directory.`}
                </p>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Contact & practice
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Public contact and practice information.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <MapPin className="h-5 w-5 text-emerald-600" />

                    <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-zinc-400">
                      Practice location
                    </div>

                    <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                      {showAddress &&
                      s(
                        doctor.address
                      )
                        ? `${s(
                            doctor.address
                          )}, ${location}`
                        : location}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <Phone className="h-5 w-5 text-blue-600" />

                    <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-zinc-400">
                      Phone
                    </div>

                    <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                      {showPhone &&
                      s(
                        doctor.phone
                      )
                        ? s(
                            doctor.phone
                          )
                        : "Not publicly displayed"}
                    </div>
                  </div>
                </div>

                {showPhone &&
                  s(
                    doctor.phone
                  ) && (
                  <a
                    href={`tel:${s(
                      doctor.phone
                    )}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <Phone className="h-4 w-4" />

                    Call doctor
                  </a>
                )}
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
                    <Stethoscope className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Consultation options
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Consultation modes currently offered by this doctor.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div
                    className={`rounded-2xl border p-4 ${
                      inPerson
                        ? "border-cyan-200 bg-cyan-50 dark:border-cyan-900/40 dark:bg-cyan-950/20"
                        : "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <UserRound className="h-5 w-5 text-cyan-600" />

                    <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                      In-person
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      {inPerson
                        ? "Available"
                        : "Unavailable"}
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${
                      teleconsultation
                        ? "border-violet-200 bg-violet-50 dark:border-violet-900/40 dark:bg-violet-950/20"
                        : "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <Video className="h-5 w-5 text-violet-600" />

                    <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                      Teleconsultation
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      {teleconsultation
                        ? "Available"
                        : "Unavailable"}
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${
                      phoneConsultation
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                        : "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <Phone className="h-5 w-5 text-emerald-600" />

                    <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                      Phone consultation
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      {phoneConsultation
                        ? "Available"
                        : "Unavailable"}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Doc Chap Ghana doctor
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  This doctor is listed in the Doc Chap Ghana healthcare directory.
                </p>

                {doctor.verified && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <BadgeCheck className="h-4 w-4" />

                    Verified doctor
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                <CalendarDays className="h-6 w-6 text-blue-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Appointments
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {acceptsNewPatients
                    ? "This doctor is currently accepting appointment requests."
                    : "This doctor is not currently accepting new patients."}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  <Clock3 className="h-4 w-4 text-blue-600" />

                  Default consultation: {duration} min
                </div>

                {acceptsNewPatients && (
                  <Link
                    href={`/book-an-appointment/${encodeURIComponent(
                      doctor.id
                    )}?type=doctor`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <CalendarDays className="h-4 w-4" />

                    Book an appointment
                  </Link>
                )}
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Professional information
                </h3>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500">
                      Specialty
                    </span>

                    <span className="text-right font-bold text-zinc-800 dark:text-zinc-200">
                      {specialty}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500">
                      Country
                    </span>

                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      Ghana
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500">
                      New patients
                    </span>

                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {acceptsNewPatients
                        ? "Accepted"
                        : "Not accepted"}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500">
                      Currency
                    </span>

                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {currency}
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}