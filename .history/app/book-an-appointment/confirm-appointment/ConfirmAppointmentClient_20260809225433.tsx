"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
} from "@/lib/firebase/client";

type ProviderType =
  | "doctor"
  | "clinic";

type AppointmentType =
  | "in_person"
  | "teleconsultation"
  | "phone";

type BookingDraft = {
  version: number;

  provider: {
    id: string;
    type: ProviderType;
    name: string;
    specialty: string;
    city: string;
    region: string;
    address: string;
    photoUrl: string;
    durationMinutes: number;
    currency: string;
  };

  patient: {
    uid: string;
    fullName: string;
    email: string;
    phone: string;
    beneficiary:
      | "self"
      | "other";
    beneficiaryName: string;
  };

  appointment: {
    type: AppointmentType;
    reason: string;
  };

  selectedSlot: {
    date: string;
    startAt: string;
    endAt: string;
  };

  createdAtIso: string;
};

type ConfirmedAppointment = {
  id: string;
  status: string;
  providerType: ProviderType;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  patientId: string;
  beneficiaryName: string;
  appointmentType: AppointmentType;
  reason: string;
  date: string;
  startAt: string;
  endAt: string;
  timezone: string;
};

type ConfirmResponse = {
  ok: boolean;
  appointment?: ConfirmedAppointment;
  error?: string;
};

const DRAFT_KEY =
  "docchapghana:booking-draft:v2";

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function parseDraft(
  value: string | null
): BookingDraft | null {
  if (!value) return null;

  try {
    return JSON.parse(
      value
    ) as BookingDraft;
  } catch {
    return null;
  }
}

function formatDate(
  value: string
): string {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      timeZone:
        "Africa/Accra",
      weekday:
        "long",
      day:
        "2-digit",
      month:
        "long",
      year:
        "numeric",
    }
  ).format(
    new Date(
      `${value}T12:00:00.000Z`
    )
  );
}

function formatTime(
  value: string
): string {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      timeZone:
        "Africa/Accra",
      hour:
        "2-digit",
      minute:
        "2-digit",
      hour12:
        false,
    }
  ).format(
    new Date(value)
  );
}

function appointmentTypeLabel(
  value: AppointmentType
): string {
  if (
    value ===
    "teleconsultation"
  ) {
    return "Teleconsultation";
  }

  if (
    value ===
    "phone"
  ) {
    return "Phone consultation";
  }

  return "In-person consultation";
}

async function readJsonResponse<T>(
  response: Response
): Promise<T> {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return (
      await response.json()
    ) as T;
  }

  const text =
    await response.text();

  throw new Error(
    response.status ===
      404
      ? "The confirmation API route was not found. Check app/api/book-an-appointment/confirm/route.ts."
      : `Invalid response from confirmation service (${response.status}): ${text.slice(
          0,
          80
        )}`
  );
}

function ProviderIcon({
  type,
}: {
  type: ProviderType;
}) {
  if (
    type ===
    "doctor"
  ) {
    return (
      <Stethoscope className="h-6 w-6" />
    );
  }

  return (
    <Building2 className="h-6 w-6" />
  );
}

export default function ConfirmAppointmentClient() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const rawType =
    s(
      searchParams.get(
        "type"
      )
    ).toLowerCase();

  const providerId =
    s(
      searchParams.get(
        "id"
      )
    );

  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    authLoading,
    setAuthLoading,
  ] =
    useState(true);

  const [
    draft,
    setDraft,
  ] =
    useState<BookingDraft | null>(
      null
    );

  const [
    confirming,
    setConfirming,
  ] =
    useState(false);

  const [
    confirmed,
    setConfirmed,
  ] =
    useState<ConfirmedAppointment | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    try {
      const stored =
        parseDraft(
          window.sessionStorage.getItem(
            DRAFT_KEY
          )
        );

      if (
        !stored ||
        stored.provider.id !==
          providerId ||
        stored.provider.type !==
          rawType
      ) {
        setError(
          "The appointment information is missing or no longer matches this provider."
        );

        return;
      }

      setDraft(
        stored
      );
    } catch {
      setError(
        "Unable to restore the appointment information."
      );
    }
  }, [
    providerId,
    rawType,
  ]);

  useEffect(() => {
    if (
      !auth
    ) {
      setAuthLoading(
        false
      );

      setError(
        "Firebase is not initialized."
      );

      return;
    }

    const firebaseAuth =
      auth;

    return onAuthStateChanged(
      firebaseAuth,
      (
        currentUser
      ) => {
        if (
          !currentUser
        ) {
          const next =
            `/book-an-appointment/confirm-appointment?type=${encodeURIComponent(
              rawType
            )}&id=${encodeURIComponent(
              providerId
            )}`;

          router.replace(
            `/patients/login?next=${encodeURIComponent(
              next
            )}`
          );

          return;
        }

        setUser(
          currentUser
        );

        setAuthLoading(
          false
        );
      }
    );
  }, [
    providerId,
    rawType,
    router,
  ]);

  const location =
    useMemo(
      () => {
        if (
          !draft
        ) {
          return "Ghana";
        }

        return [
          draft.provider.city,
          draft.provider.region,
        ]
          .filter(Boolean)
          .join(", ") ||
          "Ghana";
      },
      [
        draft,
      ]
    );

  async function confirmAppointment() {
    if (
      !draft ||
      !user ||
      confirming
    ) {
      return;
    }

    setConfirming(
      true
    );

    setError(
      null
    );

    try {
      const idToken =
        await user.getIdToken(
          true
        );

      const response =
        await fetch(
          "/api/book-an-appointment/confirm",
          {
            method:
              "POST",

            headers: {
              "content-type":
                "application/json",

              authorization:
                `Bearer ${idToken}`,
            },

            body:
              JSON.stringify(
                {
                  provider:
                    draft.provider,

                  patient:
                    draft.patient,

                  appointment:
                    draft.appointment,

                  selectedSlot:
                    draft.selectedSlot,
                }
              ),
          }
        );

      const payload =
        await readJsonResponse<ConfirmResponse>(
          response
        );

      if (
        !response.ok ||
        payload.ok !==
          true ||
        !payload.appointment
      ) {
        throw new Error(
          payload.error ||
          "Unable to confirm this appointment."
        );
      }

      setConfirmed(
        payload.appointment
      );

      try {
        window.sessionStorage.removeItem(
          DRAFT_KEY
        );
      } catch {
        // Non-blocking.
      }
    } catch (
      confirmError
    ) {
      console.error(
        "[ConfirmAppointment] Confirmation error:",
        confirmError
      );

      setError(
        confirmError instanceof
          Error
          ? confirmError.message
          : "Unable to confirm the appointment."
      );
    } finally {
      setConfirming(
        false
      );
    }
  }

  if (
    authLoading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </main>

        <Footer />
      </div>
    );
  }

  if (
    confirmed
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="overflow-hidden rounded-[32px] border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-zinc-950">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-10 text-center text-white sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <h1 className="mt-5 text-3xl font-black">
                Appointment confirmed
              </h1>

              <p className="mt-2 text-sm text-emerald-50">
                Your appointment has been registered with {confirmed.providerName}.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                  <div className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                    Date
                  </div>
                  <div className="mt-1 text-sm font-bold">
                    {formatDate(
                      confirmed.date
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                  <Clock3 className="h-5 w-5 text-blue-600" />
                  <div className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                    Time
                  </div>
                  <div className="mt-1 text-sm font-bold">
                    {formatTime(
                      confirmed.startAt
                    )} –{" "}
                    {formatTime(
                      confirmed.endAt
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                  <ProviderIcon
                    type={
                      confirmed.providerType
                    }
                  />
                  <div className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                    Provider
                  </div>
                  <div className="mt-1 text-sm font-bold">
                    {confirmed.providerName}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {confirmed.providerSpecialty}
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                  <UserRound className="h-5 w-5 text-violet-600" />
                  <div className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                    Patient
                  </div>
                  <div className="mt-1 text-sm font-bold">
                    {confirmed.beneficiaryName}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-xs font-black uppercase tracking-wide text-zinc-400">
                  Appointment reference
                </div>
                <div className="mt-1 break-all text-sm font-black text-zinc-950 dark:text-white">
                  {confirmed.id}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/search"
                  className="flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-black text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
                >
                  Find another provider
                </Link>

                <Link
                  href="/patients/dashboard"
                  className="flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white"
                >
                  Go to my account
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (
    !draft
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="mx-auto max-w-xl px-4 py-14 sm:px-6">
          <div className="rounded-[28px] border border-red-200 bg-white p-7 text-center shadow-sm dark:border-red-900/40 dark:bg-zinc-950">
            <AlertCircle className="mx-auto h-9 w-9 text-red-500" />

            <h1 className="mt-4 text-xl font-black">
              Appointment information unavailable
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {error ||
                "Please restart the booking from the provider profile."}
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

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main>
        <section className="border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
            <Link
              href={`/book-an-appointment/${encodeURIComponent(
                draft.provider.id
              )}?type=${encodeURIComponent(
                draft.provider.type
              )}`}
              className="inline-flex items-center gap-2 text-xs font-black text-emerald-50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Edit appointment
            </Link>

            <h1 className="mt-5 text-3xl font-black sm:text-4xl">
              Confirm your appointment
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
              Review the appointment below. The appointment is only created when you press the final confirmation button.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-600">
                    {draft.provider.photoUrl ? (
                      <img
                        src={
                          draft.provider.photoUrl
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ProviderIcon
                        type={
                          draft.provider.type
                        }
                      />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      {draft.provider.name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-zinc-500">
                      {draft.provider.specialty}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      {location}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                  Appointment
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <CalendarDays className="h-5 w-5 text-emerald-600" />
                    <div className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                      Date
                    </div>
                    <div className="mt-1 text-sm font-bold">
                      {formatDate(
                        draft.selectedSlot.date
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <Clock3 className="h-5 w-5 text-blue-600" />
                    <div className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                      Time
                    </div>
                    <div className="mt-1 text-sm font-bold">
                      {formatTime(
                        draft.selectedSlot.startAt
                      )} –{" "}
                      {formatTime(
                        draft.selectedSlot.endAt
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-sm font-black">
                    {draft.appointment.type ===
                      "teleconsultation" ? (
                      <Video className="h-5 w-5 text-violet-600" />
                    ) : draft.appointment.type ===
                      "phone" ? (
                      <Phone className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <UserRound className="h-5 w-5 text-cyan-600" />
                    )}

                    {appointmentTypeLabel(
                      draft.appointment.type
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {draft.appointment.reason}
                  </p>
                </div>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                  Patient
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <UserRound className="h-4 w-4 text-violet-600" />
                    {draft.patient.beneficiaryName}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Mail className="h-4 w-4" />
                    {draft.patient.email}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Phone className="h-4 w-4" />
                    {draft.patient.phone}
                  </div>
                </div>
              </section>

              <button
                type="button"
                disabled={
                  confirming
                }
                onClick={
                  confirmAppointment
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm appointment
                  </>
                )}
              </button>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}