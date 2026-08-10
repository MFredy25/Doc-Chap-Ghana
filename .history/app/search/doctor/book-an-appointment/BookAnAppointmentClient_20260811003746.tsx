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
  doc,
  getDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Stethoscope,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type AppointmentType =
  | "in_person"
  | "teleconsultation"
  | "phone";

type Provider = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  region: string;
  address: string;
  photoUrl: string;
  acceptsNewPatients: boolean;
  durationMinutes: number;

  modes: {
    inPerson: boolean;
    teleconsultation: boolean;
    phone: boolean;
  };
};

type DaySchedule = {
  open: boolean;
  start: string | null;
  end: string | null;
};

type BusyInterval = {
  startAt: string;
  endAt: string;
};

type ApiResponse = {
  ok: boolean;
  doctor?: Provider;
  schedule?: DaySchedule;
  busy?: BusyInterval[];
  appointment?: {
    id: string;
    status: string;
    providerId: string;
    providerName: string;
    specialtyName?: string;
    date: string;
    startAt: string;
    endAt: string;
    appointmentType: AppointmentType;
  };
  error?: string;
};

type SearchDoctor = {
  id: string;
  name?: string;
  specialty?: string;
  city?: string;
  region?: string;
  address?: string;
  photoUrl?: string;
  active?: boolean;
  acceptsNewPatients?: boolean;
  consultationModes?: {
    inPerson?: boolean;
    teleconsultation?: boolean;
    phone?: boolean;
  };
  configuration?: {
    acceptsNewPatients?: boolean;
    inPersonEnabled?: boolean;
    teleconsultationEnabled?: boolean;
    phoneConsultationEnabled?: boolean;
    defaultConsultationDuration?: number;
  };
};

type SearchHealthcareResponse = {
  ok: boolean;
  doctors?: SearchDoctor[];
  error?: string;
};

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function ghanaDate(
  offset = 0
): string {
  const date =
    new Date(
      Date.now() +
        offset * 86_400_000
    );

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Africa/Accra",
      year:
        "numeric",
      month:
        "2-digit",
      day:
        "2-digit",
    }
  ).format(date);
}

function formatDay(
  date: string
): string {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      timeZone:
        "Africa/Accra",
      weekday:
        "short",
      day:
        "2-digit",
      month:
        "short",
    }
  ).format(
    new Date(
      `${date}T12:00:00.000Z`
    )
  );
}

function formatTime(
  iso: string
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
    new Date(iso)
  );
}

function normalizePhone(
  value: string
): string {
  let digits =
    value.replace(/\D/g, "");

  if (
    digits.startsWith("233")
  ) {
    digits =
      digits.slice(3);
  }

  if (
    digits.startsWith("0")
  ) {
    digits =
      digits.slice(1);
  }

  return `+233${digits}`;
}

function buildSlots(
  date: string,
  schedule: DaySchedule | null,
  duration: number,
  busy: BusyInterval[]
) {
  if (
    !schedule?.open ||
    !schedule.start ||
    !schedule.end
  ) {
    return [];
  }

  const start =
    new Date(
      `${date}T${schedule.start}:00.000Z`
    );

  const close =
    new Date(
      `${date}T${schedule.end}:00.000Z`
    );

  const now =
    new Date();

  const slots: Array<{
    startAt: string;
    endAt: string;
    taken: boolean;
  }> = [];

  for (
    let cursor = new Date(start);
    cursor < close;
    cursor =
      new Date(
        cursor.getTime() +
          duration * 60_000
      )
  ) {
    const end =
      new Date(
        cursor.getTime() +
          duration * 60_000
      );

    if (end > close) break;

    const taken =
      cursor <= now ||
      busy.some(
        (item) => {
          const busyStart =
            new Date(
              item.startAt
            );

          const busyEnd =
            new Date(
              item.endAt
            );

          return (
            cursor < busyEnd &&
            end > busyStart
          );
        }
      );

    slots.push({
      startAt:
        cursor.toISOString(),
      endAt:
        end.toISOString(),
      taken,
    });
  }

  return slots;
}

function mapSearchDoctorToProvider(
  doctor: SearchDoctor
): Provider {
  const configuration =
    doctor.configuration || {};

  return {
    id:
      s(
        doctor.id
      ),

    name:
      s(
        doctor.name
      ) ||
      "Doctor",

    specialty:
      s(
        doctor.specialty
      ) ||
      "Medical professional",

    city:
      s(
        doctor.city
      ),

    region:
      s(
        doctor.region
      ),

    address:
      s(
        doctor.address
      ),

    photoUrl:
      s(
        doctor.photoUrl
      ),

    acceptsNewPatients:
      configuration.acceptsNewPatients ??
      doctor.acceptsNewPatients ??
      true,

    durationMinutes:
      Number(
        configuration.defaultConsultationDuration
      ) ||
      30,

    modes: {
      inPerson:
        configuration.inPersonEnabled ??
        doctor.consultationModes?.inPerson ??
        true,

      teleconsultation:
        configuration.teleconsultationEnabled ??
        doctor.consultationModes?.teleconsultation ??
        true,

      phone:
        configuration.phoneConsultationEnabled ??
        doctor.consultationModes?.phone ??
        false,
    },
  };
}

async function loadDoctorFallback(
  providerId: string,
  signal?: AbortSignal
): Promise<Provider | null> {
  const response =
    await fetch(
      "/api/search-healthcare",
      {
        method:
          "GET",

        cache:
          "no-store",

        signal,
      }
    );

  if (
    !response.ok
  ) {
    return null;
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    return null;
  }

  const payload =
    await response.json() as SearchHealthcareResponse;

  if (
    !payload.ok
  ) {
    return null;
  }

  const found =
    (
      payload.doctors ||
      []
    ).find(
      (doctor) =>
        s(
          doctor.id
        ) ===
        providerId &&
        doctor.active !== false
    ) ||
    null;

  return found
    ? mapSearchDoctorToProvider(
        found
      )
    : null;
}

export default function BookAnAppointmentClient() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const providerId =
    s(
      searchParams.get("id")
    );

  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    provider,
    setProvider,
  ] =
    useState<Provider | null>(
      null
    );

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    appointmentType,
    setAppointmentType,
  ] =
    useState<AppointmentType | null>(
      null
    );

  const [
    reason,
    setReason,
  ] =
    useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      ghanaDate()
    );

  const [
    schedule,
    setSchedule,
  ] =
    useState<DaySchedule | null>(
      null
    );

  const [
    busy,
    setBusy,
  ] =
    useState<BusyInterval[]>(
      []
    );

  const [
    selectedStartAt,
    setSelectedStartAt,
  ] =
    useState("");

  const [
    selectedEndAt,
    setSelectedEndAt,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (
      !auth ||
      !db
    ) {
      setError(
        "Firebase is not initialized."
      );
      setLoading(false);
      return;
    }

    const firebaseAuth =
      auth;

    const firestore =
      db;

    return onAuthStateChanged(
      firebaseAuth,
      async (currentUser) => {
        if (!currentUser) {
          const next =
            "/search/doctor/book-an-appointment?id=" +
            encodeURIComponent(
              providerId
            );

          router.replace(
            "/patients/login?next=" +
              encodeURIComponent(
                next
              )
          );
          return;
        }

        setUser(
          currentUser
        );

        try {
          const snapshot =
            await getDoc(
              doc(
                firestore,
                "patients",
                currentUser.uid
              )
            );

          const data =
            snapshot.exists()
              ? snapshot.data()
              : {};

          const profile =
            (
              data.profile &&
              typeof data.profile ===
                "object"
            )
              ? data.profile as Record<string, unknown>
              : {};

          const firstName =
            s(
              profile.firstName
            );

          const lastName =
            s(
              profile.lastName
            );

          setFullName(
            s(
              profile.fullName ||
              profile.displayName ||
              data.fullName ||
              data.displayName
            ) ||
            `${firstName} ${lastName}`.trim() ||
            s(
              currentUser.displayName
            )
          );

          setEmail(
            s(
              profile.email ||
              data.email ||
              currentUser.email
            )
          );

          setPhone(
            s(
              profile.phone ||
              profile.phoneNumber ||
              data.phone ||
              currentUser.phoneNumber
            )
          );
        } catch (profileError) {
          console.warn(
            "[DoctorBooking] Patient profile:",
            profileError
          );
        }
      }
    );
  }, [
    providerId,
    router,
  ]);

  useEffect(() => {
    if (
      !providerId
    ) {
      setProvider(
        null
      );

      setError(
        "Doctor ID is missing. Please return to the doctor profile and select Book an appointment again."
      );

      setLoading(
        false
      );

      return;
    }

    if (
      !selectedDate
    ) {
      setLoading(
        false
      );

      return;
    }

    let cancelled =
      false;

    const controller =
      new AbortController();

    async function loadAvailability() {
      setLoading(true);

      try {
        const params =
          new URLSearchParams({
            id:
              providerId,
            date:
              selectedDate,
          });

        const response =
          await fetch(
            "/api/doctor-book-an-appointment?" +
              params.toString(),
            {
              cache:
                "no-store",
            }
          );

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        let payload:
          ApiResponse | null =
          null;

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          payload =
            await response.json() as ApiResponse;
        }

        if (
          !response.ok ||
          !payload?.ok ||
          !payload.doctor
        ) {
          const fallbackDoctor =
            await loadDoctorFallback(
              providerId,
              controller.signal
            );

          if (
            cancelled
          ) {
            return;
          }

          if (
            !fallbackDoctor
          ) {
            throw new Error(
              payload?.error ||
              "This doctor profile is not available."
            );
          }

          setProvider(
            fallbackDoctor
          );

          setSchedule(
            null
          );

          setBusy(
            []
          );

          setAppointmentType(
            fallbackDoctor.modes.inPerson
              ? "in_person"
              : fallbackDoctor.modes.teleconsultation
              ? "teleconsultation"
              : fallbackDoctor.modes.phone
              ? "phone"
              : null
          );

          setSelectedStartAt(
            ""
          );

          setSelectedEndAt(
            ""
          );

          setError(
            response.status === 404
              ? "Doctor information loaded. Appointment availability is temporarily unavailable."
              : payload?.error ||
                "Appointment availability is temporarily unavailable."
          );

          return;
        }

        if (cancelled) return;

        const loaded =
          payload.doctor;

        setProvider(
          loaded
        );

        setSchedule(
          payload.schedule || null
        );

        setBusy(
          payload.busy || []
        );

        setAppointmentType(
          (current) => {
            if (
              current === "in_person" &&
              loaded.modes.inPerson
            ) {
              return current;
            }

            if (
              current === "teleconsultation" &&
              loaded.modes.teleconsultation
            ) {
              return current;
            }

            if (
              current === "phone" &&
              loaded.modes.phone
            ) {
              return current;
            }

            if (
              loaded.modes.inPerson
            ) {
              return "in_person";
            }

            if (
              loaded.modes.teleconsultation
            ) {
              return "teleconsultation";
            }

            if (
              loaded.modes.phone
            ) {
              return "phone";
            }

            return null;
          }
        );

        setSelectedStartAt("");
        setSelectedEndAt("");
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load appointment information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    providerId,
    selectedDate,
  ]);

  const days =
    useMemo(
      () =>
        Array.from(
          {
            length: 14,
          },
          (_, index) =>
            ghanaDate(index)
        ),
      []
    );

  const slots =
    useMemo(
      () =>
        buildSlots(
          selectedDate,
          schedule,
          provider?.durationMinutes ||
            30,
          busy
        ),
      [
        busy,
        provider,
        schedule,
        selectedDate,
      ]
    );

  async function confirmAppointment() {
    if (
      !provider ||
      !user ||
      !appointmentType ||
      !selectedStartAt ||
      !selectedEndAt
    ) {
      setError(
        "Complete the form and select an available time."
      );
      return;
    }

    const cleanPhone =
      normalizePhone(phone);

    if (
      s(fullName).length < 2
    ) {
      setError(
        "Enter your full name."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        s(email)
      )
    ) {
      setError(
        "Enter a valid email address."
      );
      return;
    }

    if (
      !/^\+233\d{9}$/.test(
        cleanPhone
      )
    ) {
      setError(
        "Enter a valid Ghana phone number."
      );
      return;
    }

    if (
      s(reason).length < 3
    ) {
      setError(
        "Enter the reason for the appointment."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token =
        await user.getIdToken(
          true
        );

      const response =
        await fetch(
          "/api/doctor-book-an-appointment",
          {
            method:
              "POST",
            headers: {
              "content-type":
                "application/json",
              authorization:
                `Bearer ${token}`,
            },
            body:
              JSON.stringify({
                doctorId:
                  provider.id,
                patient: {
                  uid:
                    user.uid,
                  fullName:
                    s(fullName),
                  email:
                    s(email)
                      .toLowerCase(),
                  phone:
                    cleanPhone,
                },
                appointment: {
                  type:
                    appointmentType,
                  reason:
                    s(reason),
                  date:
                    selectedDate,
                  startAt:
                    selectedStartAt,
                  endAt:
                    selectedEndAt,
                },
              }),
          }
        );

      const payload =
        await response.json() as ApiResponse;

      if (
        !response.ok ||
        !payload.ok ||
        !payload.appointment
      ) {
        throw new Error(
          payload.error ||
          "Unable to confirm appointment."
        );
      }

      const confirmation = {
        appointmentId:
          payload.appointment.id,
        doctorId:
          provider.id,
        doctorName:
          payload.appointment.providerName ||
          provider.name,
        specialty:
          payload.appointment.specialtyName ||
          provider.specialty,
        date:
          payload.appointment.date,
        startAt:
          payload.appointment.startAt,
        endAt:
          payload.appointment.endAt,
        appointmentType:
          payload.appointment.appointmentType,
        reason:
          s(reason),
      };

      try {
        const emailResponse =
          await fetch(
            "/api/send-email-doctor-new-appointment",
            {
              method:
                "POST",

              headers: {
                "content-type":
                  "application/json",

                authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  appointmentId:
                    payload.appointment.id,

                  doctorId:
                    provider.id,
                }),
            }
          );

        const emailPayload =
          await emailResponse
            .json()
            .catch(
              () => null
            );

        if (
          !emailResponse.ok ||
          !emailPayload?.ok
        ) {
          console.warn(
            "[DoctorBooking] Appointment email notification failed:",
            emailPayload
          );
        }
      } catch (
        emailError
      ) {
        console.warn(
          "[DoctorBooking] Appointment email notification error:",
          emailError
        );
      }

      window.sessionStorage.setItem(
        "docchapghana:doctor-appointment-confirmed",
        JSON.stringify(
          confirmation
        )
      );

      router.push(
        "/search/doctor/book-an-appointment/appointment-confirmed"
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to confirm appointment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main>
        <section className="bg-gradient-to-br from-[#071b3a] via-[#0b4f78] to-[#0f8f7b] text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
            <Link
              href={
                "/search/doctor/" +
                encodeURIComponent(
                  providerId
                )
              }
              className="inline-flex items-center gap-2 text-xs font-black text-white/80 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to doctor
            </Link>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white/15">
                {provider?.photoUrl ? (
                  <img
                    src={
                      provider.photoUrl
                    }
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Stethoscope className="h-8 w-8" />
                )}
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Book an appointment
                </div>

                <h1 className="mt-2 text-3xl font-black">
                  {provider?.name ||
                    "Doctor"}
                </h1>

                <p className="mt-1 text-sm text-white/80">
                  {provider?.specialty}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : provider ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black">
                    Patient information
                  </h2>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="text-sm font-bold">
                        Full name
                      </span>

                      <input
                        value={
                          fullName
                        }
                        onChange={(
                          event
                        ) =>
                          setFullName(
                            event.target.value
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      />
                    </label>

                    <label>
                      <span className="text-sm font-bold">
                        Email
                      </span>

                      <div className="relative mt-2">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          value={
                            email
                          }
                          onChange={(
                            event
                          ) =>
                            setEmail(
                              event.target.value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                        />
                      </div>
                    </label>

                    <label>
                      <span className="text-sm font-bold">
                        Ghana phone number
                      </span>

                      <div className="relative mt-2">
                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          value={
                            phone
                          }
                          onChange={(
                            event
                          ) =>
                            setPhone(
                              event.target.value
                            )
                          }
                          placeholder="+233..."
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                        />
                      </div>
                    </label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black">
                    Consultation type
                  </h2>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {provider.modes.inPerson && (
                      <button
                        type="button"
                        onClick={() =>
                          setAppointmentType(
                            "in_person"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left ${
                          appointmentType ===
                          "in_person"
                            ? "border-cyan-400 bg-cyan-50"
                            : "border-zinc-200"
                        }`}
                      >
                        <UserRound className="h-5 w-5 text-cyan-600" />
                        <div className="mt-2 text-sm font-black">
                          In-person
                        </div>
                      </button>
                    )}

                    {provider.modes.teleconsultation && (
                      <button
                        type="button"
                        onClick={() =>
                          setAppointmentType(
                            "teleconsultation"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left ${
                          appointmentType ===
                          "teleconsultation"
                            ? "border-violet-400 bg-violet-50"
                            : "border-zinc-200"
                        }`}
                      >
                        <Video className="h-5 w-5 text-violet-600" />
                        <div className="mt-2 text-sm font-black">
                          Teleconsultation
                        </div>
                      </button>
                    )}

                    {provider.modes.phone && (
                      <button
                        type="button"
                        onClick={() =>
                          setAppointmentType(
                            "phone"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left ${
                          appointmentType ===
                          "phone"
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-zinc-200"
                        }`}
                      >
                        <Phone className="h-5 w-5 text-emerald-600" />
                        <div className="mt-2 text-sm font-black">
                          Phone
                        </div>
                      </button>
                    )}
                  </div>

                  <textarea
                    value={
                      reason
                    }
                    onChange={(
                      event
                    ) =>
                      setReason(
                        event.target.value
                      )
                    }
                    placeholder="Reason for the appointment..."
                    className="mt-5 min-h-28 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black">
                    Choose a date
                  </h2>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {days.map(
                      (day) => (
                        <button
                          key={
                            day
                          }
                          type="button"
                          onClick={() =>
                            setSelectedDate(
                              day
                            )
                          }
                          className={`rounded-2xl border px-3 py-3 text-xs font-black ${
                            selectedDate ===
                            day
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-zinc-200 bg-zinc-50"
                          }`}
                        >
                          {formatDay(
                            day
                          )}
                        </button>
                      )
                    )}
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black">
                    Available times
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    {schedule?.open
                      ? `${schedule.start} – ${schedule.end}`
                      : "No consultation hours for this date."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {slots.map(
                      (slot) => {
                        const selected =
                          selectedStartAt ===
                          slot.startAt;

                        return (
                          <button
                            key={
                              slot.startAt
                            }
                            type="button"
                            disabled={
                              slot.taken
                            }
                            onClick={() => {
                              setSelectedStartAt(
                                slot.startAt
                              );

                              setSelectedEndAt(
                                slot.endAt
                              );
                            }}
                            className={`rounded-2xl border px-3 py-3 text-sm font-black ${
                              selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : slot.taken
                                ? "cursor-not-allowed bg-zinc-100 text-zinc-400 line-through"
                                : "border-zinc-200"
                            }`}
                          >
                            {formatTime(
                              slot.startAt
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <MapPin className="h-5 w-5 text-blue-600" />

                  <div className="mt-3 text-sm font-black">
                    {[
                      provider.city,
                      provider.region,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(", ") ||
                      "Ghana"}
                  </div>

                  {provider.address && (
                    <div className="mt-1 text-xs text-zinc-500">
                      {provider.address}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                    <Clock3 className="h-4 w-4" />

                    {provider.durationMinutes} minutes
                  </div>
                </section>

                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={() =>
                    void confirmAppointment()
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="h-4 w-4" />
                      Confirm appointment
                    </>
                  )}
                </button>
              </aside>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}