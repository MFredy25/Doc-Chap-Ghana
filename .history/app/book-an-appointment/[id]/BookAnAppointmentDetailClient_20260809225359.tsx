"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  HeartPulse,
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
  db,
} from "@/lib/firebase/client";

type ProviderType =
  | "doctor"
  | "clinic";

type AppointmentType =
  | "in_person"
  | "teleconsultation"
  | "phone";

type Provider = {
  id: string;
  type: ProviderType;
  name: string;
  specialty: string;
  city: string;
  region: string;
  address: string;
  photoUrl: string;
  acceptsNewPatients: boolean;
  durationMinutes: number;
  currency: string;

  modes: {
    inPerson: boolean;
    teleconsultation: boolean;
    phone: boolean;
  };
};

type DaySchedule = {
  key: string;
  open: boolean;
  start: string | null;
  end: string | null;
};

type BusyInterval = {
  startAt: string;
  endAt: string;
};

type AvailabilityResponse = {
  ok: boolean;
  provider?: Provider;
  schedule?: DaySchedule;
  busy?: BusyInterval[];
  error?: string;
};

type PatientData = {
  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
  };

  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
};

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

type UiSlot = {
  startAt: string;
  endAt: string;
  label: string;
  taken: boolean;
  selected: boolean;
};

const DRAFT_KEY =
  "docchapghana:booking-draft:v2";

const DAY_MS =
  86_400_000;

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function ghanaDate(
  offsetDays = 0
): string {
  const date =
    new Date(
      Date.now() +
      offsetDays *
        DAY_MS
    );

  const parts =
    new Intl.DateTimeFormat(
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
    ).formatToParts(
      date
    );

  const values =
    Object.fromEntries(
      parts.map(
        (
          part
        ) => [
          part.type,
          part.value,
        ]
      )
    );

  return `${values.year}-${values.month}-${values.day}`;
}

function formatDay(
  value: string
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

function normalizePhone(
  value: string
): string {
  const raw =
    s(value);

  if (!raw) return "";

  let digits =
    raw.replace(
      /\D/g,
      ""
    );

  if (
    digits.startsWith(
      "233"
    )
  ) {
    digits =
      digits.slice(3);
  }

  if (
    digits.startsWith(
      "0"
    )
  ) {
    digits =
      digits.slice(1);
  }

  return `+233${digits}`;
}

function parseTime(
  value: string | null
) {
  if (!value) return null;

  const match =
    /^(\d{1,2}):(\d{2})$/.exec(
      value
    );

  if (!match) return null;

  const hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return {
    hour,
    minute,
  };
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return (
    aStart <
      bEnd &&
    aEnd >
      bStart
  );
}

function buildSlots({
  date,
  schedule,
  durationMinutes,
  providerBusy,
  patientBusy,
  selectedStartAt,
}: {
  date: string;
  schedule: DaySchedule | null;
  durationMinutes: number;
  providerBusy: BusyInterval[];
  patientBusy: BusyInterval[];
  selectedStartAt: string;
}): UiSlot[] {
  if (
    !schedule?.open ||
    !schedule.start ||
    !schedule.end
  ) {
    return [];
  }

  const startParts =
    parseTime(
      schedule.start
    );

  const endParts =
    parseTime(
      schedule.end
    );

  if (
    !startParts ||
    !endParts
  ) {
    return [];
  }

  const opening =
    new Date(
      `${date}T${String(
        startParts.hour
      ).padStart(
        2,
        "0"
      )}:${String(
        startParts.minute
      ).padStart(
        2,
        "0"
      )}:00.000Z`
    );

  const closing =
    new Date(
      `${date}T${String(
        endParts.hour
      ).padStart(
        2,
        "0"
      )}:${String(
        endParts.minute
      ).padStart(
        2,
        "0"
      )}:00.000Z`
    );

  const now =
    new Date();

  const slots:
    UiSlot[] =
    [];

  for (
    let cursor =
      new Date(opening);

    cursor <
      closing;

    cursor =
      new Date(
        cursor.getTime() +
        durationMinutes *
          60_000
      )
  ) {
    const end =
      new Date(
        cursor.getTime() +
        durationMinutes *
          60_000
      );

    if (
      end >
      closing
    ) {
      break;
    }

    const providerTaken =
      providerBusy.some(
        (
          interval
        ) =>
          overlaps(
            cursor,
            end,
            new Date(
              interval.startAt
            ),
            new Date(
              interval.endAt
            )
          )
      );

    const patientTaken =
      patientBusy.some(
        (
          interval
        ) =>
          overlaps(
            cursor,
            end,
            new Date(
              interval.startAt
            ),
            new Date(
              interval.endAt
            )
          )
      );

    const startIso =
      cursor.toISOString();

    slots.push({
      startAt:
        startIso,
      endAt:
        end.toISOString(),
      label:
        formatTime(
          startIso
        ),
      taken:
        providerTaken ||
        patientTaken ||
        cursor <= now,
      selected:
        selectedStartAt ===
        startIso,
    });
  }

  return slots;
}

function TypeIcon({
  type,
  className,
}: {
  type: ProviderType;
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

  return (
    <Building2
      className={
        className
      }
    />
  );
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
    response.status === 404
      ? "The appointment API route was not found. Check app/api/book-an-appointment/availability/route.ts."
      : `Invalid response from appointment service (${response.status}): ${text.slice(
          0,
          80
        )}`
  );
}

export default function BookAnAppointmentDetailClient() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const providerId =
    decodeURIComponent(
      s(
        params?.id
      )
    );

  const rawType =
    s(
      searchParams.get(
        "type"
      )
    ).toLowerCase();

  const providerType:
    ProviderType | null =
    rawType ===
      "doctor" ||
    rawType ===
      "clinic"
      ? rawType
      : null;

  const [
    patientUid,
    setPatientUid,
  ] =
    useState("");

  const [
    loadingAuth,
    setLoadingAuth,
  ] =
    useState(true);

  const [
    provider,
    setProvider,
  ] =
    useState<Provider | null>(
      null
    );

  const [
    schedule,
    setSchedule,
  ] =
    useState<DaySchedule | null>(
      null
    );

  const [
    providerBusy,
    setProviderBusy,
  ] =
    useState<BusyInterval[]>(
      []
    );

  const [
    patientBusy,
    setPatientBusy,
  ] =
    useState<BusyInterval[]>(
      []
    );

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      ghanaDate()
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
    availabilityLoading,
    setAvailabilityLoading,
  ] =
    useState(true);

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
    beneficiary,
    setBeneficiary,
  ] =
    useState<
      "self" |
      "other"
    >(
      "self"
    );

  const [
    otherFullName,
    setOtherFullName,
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

      setLoadingAuth(
        false
      );

      return;
    }

    const firebaseAuth =
      auth;

    const firestore =
      db;

    return onAuthStateChanged(
      firebaseAuth,
      async (
        user
      ) => {
        if (
          !user?.uid
        ) {
          const next =
            `/book-an-appointment/${encodeURIComponent(
              providerId
            )}?type=${encodeURIComponent(
              providerType ||
              ""
            )}`;

          router.replace(
            `/patients/login?next=${encodeURIComponent(
              next
            )}`
          );

          return;
        }

        setPatientUid(
          user.uid
        );

        try {
          const snapshot =
            await (
              await import(
                "firebase/firestore"
              )
            ).getDoc(
              (
                await import(
                  "firebase/firestore"
                )
              ).doc(
                firestore,
                "patients",
                user.uid
              )
            );

          if (
            snapshot.exists()
          ) {
            const data =
              snapshot.data() as PatientData;

            const profile =
              data.profile ||
              {};

            const firstName =
              s(
                profile.firstName ||
                data.firstName
              );

            const lastName =
              s(
                profile.lastName ||
                data.lastName
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
                user.displayName
              )
            );

            setEmail(
              s(
                profile.email ||
                data.email ||
                user.email
              )
            );

            setPhone(
              s(
                profile.phone ||
                profile.phoneNumber ||
                data.phone ||
                user.phoneNumber
              )
            );
          } else {
            setFullName(
              s(
                user.displayName
              )
            );

            setEmail(
              s(
                user.email
              )
            );

            setPhone(
              s(
                user.phoneNumber
              )
            );
          }
        } catch (
          profileError
        ) {
          console.warn(
            "[BookAppointment] Patient profile unavailable:",
            profileError
          );

          setFullName(
            s(
              user.displayName
            )
          );

          setEmail(
            s(
              user.email
            )
          );
        } finally {
          setLoadingAuth(
            false
          );
        }
      }
    );
  }, [
    providerId,
    providerType,
    router,
  ]);

  useEffect(() => {
    if (
      !providerType ||
      !providerId ||
      !selectedDate
    ) {
      setAvailabilityLoading(
        false
      );

      return;
    }

    const stableType =
      providerType;

    const stableId =
      providerId;

    let cancelled =
      false;

    const controller =
      new AbortController();

    async function loadAvailability() {
      setAvailabilityLoading(
        true
      );

      setSelectedStartAt(
        ""
      );

      setSelectedEndAt(
        ""
      );

      try {
        const queryParams =
          new URLSearchParams({
            type:
              stableType,
            id:
              stableId,
            date:
              selectedDate,
          });

        const response =
          await fetch(
            `/api/book-an-appointment/availability?${queryParams.toString()}`,
            {
              cache:
                "no-store",
              signal:
                controller.signal,
            }
          );

        const payload =
          await readJsonResponse<AvailabilityResponse>(
            response
          );

        if (
          !response.ok ||
          payload.ok !==
            true ||
          !payload.provider ||
          !payload.schedule
        ) {
          throw new Error(
            payload.error ||
            "Unable to load provider availability."
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        setProvider(
          payload.provider
        );

        setSchedule(
          payload.schedule
        );

        setProviderBusy(
          payload.busy ||
          []
        );

        const modes =
          payload.provider.modes;

        setAppointmentType(
          (
            current
          ) => {
            if (
              current ===
                "in_person" &&
              modes.inPerson
            ) {
              return current;
            }

            if (
              current ===
                "teleconsultation" &&
              modes.teleconsultation
            ) {
              return current;
            }

            if (
              current ===
                "phone" &&
              modes.phone
            ) {
              return current;
            }

            if (
              modes.inPerson
            ) {
              return "in_person";
            }

            if (
              modes.teleconsultation
            ) {
              return "teleconsultation";
            }

            if (
              modes.phone
            ) {
              return "phone";
            }

            return null;
          }
        );

        setError(
          null
        );
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
          "[BookAppointment] Availability load error:",
          loadError
        );

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "Unable to load availability."
        );

        setSchedule(
          null
        );

        setProviderBusy(
          []
        );
      } finally {
        if (
          !cancelled
        ) {
          setAvailabilityLoading(
            false
          );
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled =
        true;

      controller.abort();
    };
  }, [
    providerId,
    providerType,
    selectedDate,
  ]);

  useEffect(() => {
    if (
      !patientUid ||
      !db ||
      !selectedDate
    ) {
      setPatientBusy(
        []
      );

      return;
    }

    let cancelled =
      false;

    async function loadPatientBusy() {
      try {
        const firestore =
          db;

        if (
          !firestore
        ) {
          return;
        }

        const dayStart =
          new Date(
            `${selectedDate}T00:00:00.000Z`
          );

        const dayEnd =
          new Date(
            `${selectedDate}T23:59:59.999Z`
          );

        const snapshot =
          await getDocs(
            query(
              collection(
                firestore,
                "patients",
                patientUid,
                "appointments"
              ),
              where(
                "startAt",
                ">=",
                Timestamp.fromDate(
                  dayStart
                )
              ),
              where(
                "startAt",
                "<=",
                Timestamp.fromDate(
                  dayEnd
                )
              )
            )
          );

        if (
          cancelled
        ) {
          return;
        }

        const rows:
          BusyInterval[] =
          [];

        snapshot.docs.forEach(
          (
            document
          ) => {
            const data =
              document.data();

            const status =
              s(
                data.status
              ).toLowerCase();

            if (
              status &&
              ![
                "scheduled",
                "confirmed",
                "pending",
                "ongoing",
                "in_progress",
                "checked_in",
              ].includes(
                status
              )
            ) {
              return;
            }

            const start =
              data.startAt?.toDate?.();

            if (
              !start
            ) {
              return;
            }

            const end =
              data.endAt?.toDate?.() ||
              new Date(
                start.getTime() +
                (
                  provider?.durationMinutes ||
                  30
                ) *
                60_000
              );

            rows.push({
              startAt:
                start.toISOString(),
              endAt:
                end.toISOString(),
            });
          }
        );

        setPatientBusy(
          rows
        );
      } catch (
        busyError
      ) {
        console.warn(
          "[BookAppointment] Patient busy slots unavailable:",
          busyError
        );

        if (
          !cancelled
        ) {
          setPatientBusy(
            []
          );
        }
      }
    }

    void loadPatientBusy();

    return () => {
      cancelled =
        true;
    };
  }, [
    patientUid,
    provider?.durationMinutes,
    selectedDate,
  ]);

  const days =
    useMemo(
      () =>
        Array.from(
          {
            length:
              14,
          },
          (
            _,
            index
          ) =>
            ghanaDate(
              index
            )
        ),
      []
    );

  const slots =
    useMemo(
      () =>
        buildSlots({
          date:
            selectedDate,
          schedule,
          durationMinutes:
            provider?.durationMinutes ||
            30,
          providerBusy,
          patientBusy,
          selectedStartAt,
        }),
      [
        patientBusy,
        provider,
        providerBusy,
        schedule,
        selectedDate,
        selectedStartAt,
      ]
    );

  const location =
    useMemo(
      () =>
        [
          provider?.city,
          provider?.region,
        ]
          .filter(
            Boolean
          )
          .join(
            ", "
          ) ||
        "Ghana",
      [
        provider,
      ]
    );

  function chooseSlot(
    slot: UiSlot
  ) {
    if (
      slot.taken
    ) {
      return;
    }

    setSelectedStartAt(
      slot.startAt
    );

    setSelectedEndAt(
      slot.endAt
    );

    setError(
      null
    );
  }

  function goToConfirmation() {
    if (
      !provider ||
      !providerType ||
      !patientUid
    ) {
      return;
    }

    const cleanName =
      s(fullName);

    const cleanEmail =
      s(email).toLowerCase();

    const cleanPhone =
      normalizePhone(
        phone
      );

    if (
      cleanName.length <
      2
    ) {
      setError(
        "Please enter the patient full name."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (
      !/^\+233\d{9}$/.test(
        cleanPhone
      )
    ) {
      setError(
        "Please enter a valid Ghana phone number."
      );
      return;
    }

    if (
      beneficiary ===
        "other" &&
      s(
        otherFullName
      ).length <
        2
    ) {
      setError(
        "Please enter the beneficiary's full name."
      );
      return;
    }

    if (
      !appointmentType
    ) {
      setError(
        "Please select a consultation type."
      );
      return;
    }

    if (
      s(reason).length <
      3
    ) {
      setError(
        "Please briefly describe the reason for the appointment."
      );
      return;
    }

    if (
      !selectedStartAt ||
      !selectedEndAt
    ) {
      setError(
        "Please select an available date and time."
      );
      return;
    }

    const draft:
      BookingDraft = {
      version:
        2,

      provider: {
        id:
          provider.id,
        type:
          provider.type,
        name:
          provider.name,
        specialty:
          provider.specialty,
        city:
          provider.city,
        region:
          provider.region,
        address:
          provider.address,
        photoUrl:
          provider.photoUrl,
        durationMinutes:
          provider.durationMinutes,
        currency:
          provider.currency,
      },

      patient: {
        uid:
          patientUid,
        fullName:
          cleanName,
        email:
          cleanEmail,
        phone:
          cleanPhone,
        beneficiary,
        beneficiaryName:
          beneficiary ===
            "other"
            ? s(
                otherFullName
              )
            : cleanName,
      },

      appointment: {
        type:
          appointmentType,
        reason:
          s(reason),
      },

      selectedSlot: {
        date:
          selectedDate,
        startAt:
          selectedStartAt,
        endAt:
          selectedEndAt,
      },

      createdAtIso:
        new Date().toISOString(),
    };

    try {
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(
          draft
        )
      );
    } catch (
      storageError
    ) {
      console.warn(
        "[BookAppointment] Draft storage error:",
        storageError
      );
    }

    router.push(
      `/book-an-appointment/confirm-appointment?type=${encodeURIComponent(
        providerType
      )}&id=${encodeURIComponent(
        provider.id
      )}`
    );
  }

  const initialLoading =
    loadingAuth ||
    (
      availabilityLoading &&
      !provider
    );

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
            <Link
              href={
                providerType &&
                providerId
                  ? `/search/${encodeURIComponent(
                      providerId
                    )}?type=${encodeURIComponent(
                      providerType
                    )}`
                  : "/search"
              }
              className="inline-flex items-center gap-2 text-xs font-black text-emerald-50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to provider
            </Link>

            <div className="mt-6 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                <CalendarDays className="h-4 w-4" />
                Book an appointment
              </span>

              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                Choose your appointment
              </h1>

              <p className="mt-3 text-sm leading-7 text-emerald-50">
                Add the patient information, choose the consultation type and select one of the provider&apos;s available times.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {initialLoading ? (
            <div className="flex min-h-[460px] items-center justify-center rounded-[28px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

                <p className="mt-4 text-sm font-bold text-zinc-500">
                  Loading appointment information...
                </p>
              </div>
            </div>
          ) : provider ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
              <div className="space-y-6">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Patient information
                      </h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        Confirm the patient and contact information.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        Full name
                      </span>
                      <input
                        value={fullName}
                        onChange={(event) =>
                          setFullName(
                            event.target.value
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </label>

                    <label>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        Email
                      </span>
                      <div className="relative mt-2">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(
                              event.target.value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>

                    <label>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        Ghana phone number
                      </span>
                      <div className="relative mt-2">
                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          value={phone}
                          onChange={(event) =>
                            setPhone(
                              event.target.value
                            )
                          }
                          placeholder="+233..."
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Who is this appointment for?
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          setBeneficiary(
                            "self"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          beneficiary ===
                          "self"
                            ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 dark:bg-emerald-950/20"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                        }`}
                      >
                        <UserRound className="h-5 w-5 text-emerald-600" />
                        <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                          Myself
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setBeneficiary(
                            "other"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          beneficiary ===
                          "other"
                            ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/20"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                        }`}
                      >
                        <HeartPulse className="h-5 w-5 text-blue-600" />
                        <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                          Someone else
                        </div>
                      </button>
                    </div>

                    {beneficiary ===
                      "other" && (
                      <label className="mt-4 block">
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          Beneficiary full name
                        </span>
                        <input
                          value={
                            otherFullName
                          }
                          onChange={(event) =>
                            setOtherFullName(
                              event.target.value
                            )
                          }
                          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </label>
                    )}
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Consultation
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
                            ? "border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100 dark:bg-cyan-950/20"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                        }`}
                      >
                        <UserRound className="h-5 w-5 text-cyan-600" />
                        <div className="mt-3 text-sm font-black">
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
                            ? "border-violet-400 bg-violet-50 ring-2 ring-violet-100 dark:bg-violet-950/20"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                        }`}
                      >
                        <Video className="h-5 w-5 text-violet-600" />
                        <div className="mt-3 text-sm font-black">
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
                            ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 dark:bg-emerald-950/20"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                        }`}
                      >
                        <Phone className="h-5 w-5 text-emerald-600" />
                        <div className="mt-3 text-sm font-black">
                          Phone
                        </div>
                      </button>
                    )}
                  </div>

                  <label className="mt-5 block">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Reason for the appointment
                    </span>
                    <textarea
                      value={reason}
                      onChange={(event) =>
                        setReason(
                          event.target.value
                        )
                      }
                      placeholder="Briefly describe the reason for the consultation..."
                      className="mt-2 min-h-32 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Date
                      </h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        Next 14 days • Ghana time
                      </p>
                    </div>
                    <CalendarDays className="h-6 w-6 text-emerald-600" />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {days.map(
                      (
                        day
                      ) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setSelectedDate(
                              day
                            )
                          }
                          className={`rounded-2xl border px-3 py-3 text-xs font-black transition ${
                            selectedDate ===
                            day
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
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

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Available times
                      </h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        {schedule?.open
                          ? `${schedule.start} – ${schedule.end} • ${provider.durationMinutes} min`
                          : "No consultation hours for this day."}
                      </p>
                    </div>
                    <Clock3 className="h-6 w-6 text-blue-600" />
                  </div>

                  {availabilityLoading ? (
                    <div className="flex min-h-40 items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                    </div>
                  ) : slots.length ===
                    0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-7 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                      No available time for this day. Choose another date.
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {slots.map(
                        (
                          slot
                        ) => (
                          <button
                            key={
                              slot.startAt
                            }
                            type="button"
                            disabled={
                              slot.taken
                            }
                            onClick={() =>
                              chooseSlot(
                                slot
                              )
                            }
                            className={`relative rounded-2xl border px-3 py-3 text-sm font-black transition ${
                              slot.selected
                                ? "border-emerald-600 bg-emerald-600 text-white ring-2 ring-emerald-200"
                                : slot.taken
                                  ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 line-through dark:border-zinc-800 dark:bg-zinc-900"
                                  : "border-zinc-200 bg-white text-zinc-800 hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                            }`}
                          >
                            {slot.selected && (
                              <Check className="absolute right-2 top-2 h-3.5 w-3.5" />
                            )}
                            {slot.label}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </section>

                <button
                  type="button"
                  onClick={
                    goToConfirmation
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Confirm appointment
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-600">
                      {provider.photoUrl ? (
                        <img
                          src={
                            provider.photoUrl
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <TypeIcon
                          type={
                            provider.type
                          }
                          className="h-6 w-6"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                        {provider.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-zinc-500">
                        {provider.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      {location}
                    </div>

                    {provider.address && (
                      <div className="mt-2 text-xs leading-5 text-zinc-500">
                        {provider.address}
                      </div>
                    )}
                  </div>
                </section>

                {selectedStartAt && (
                  <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <Check className="h-6 w-6 text-emerald-600" />
                    <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                      Selected appointment
                    </h3>
                    <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {formatDay(
                        selectedDate
                      )} •{" "}
                      {formatTime(
                        selectedStartAt
                      )} –{" "}
                      {formatTime(
                        selectedEndAt
                      )}
                    </p>
                  </section>
                )}
              </aside>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}